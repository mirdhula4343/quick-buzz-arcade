import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Room = Tables<"rooms">;
export type Player = Tables<"players">;
export type Buzz = Tables<"buzzes">;

export function useRoom(code: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      setLoading(true);
      const { data: r, error: rErr } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code!)
        .maybeSingle();
      if (cancelled) return;
      if (rErr || !r) {
        setError(rErr?.message ?? "Room not found");
        setLoading(false);
        return;
      }
      setRoom(r);

      const [{ data: ps }, { data: bs }] = await Promise.all([
        supabase.from("players").select("*").eq("room_id", r.id),
        supabase
          .from("buzzes")
          .select("*")
          .eq("room_id", r.id)
          .order("buzzed_at", { ascending: true }),
      ]);
      if (cancelled) return;
      setPlayers(ps ?? []);
      setBuzzes(bs ?? []);
      setLoading(false);

      channel = supabase
        .channel(`room:${r.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "rooms", filter: `id=eq.${r.id}` },
          (payload) => {
            if (payload.eventType === "DELETE") setRoom(null);
            else setRoom(payload.new as Room);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `room_id=eq.${r.id}`,
          },
          (payload) => {
            setPlayers((prev) => {
              if (payload.eventType === "INSERT")
                return [...prev.filter((p) => p.id !== (payload.new as Player).id), payload.new as Player];
              if (payload.eventType === "UPDATE")
                return prev.map((p) =>
                  p.id === (payload.new as Player).id ? (payload.new as Player) : p,
                );
              if (payload.eventType === "DELETE")
                return prev.filter((p) => p.id !== (payload.old as Player).id);
              return prev;
            });
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "buzzes",
            filter: `room_id=eq.${r.id}`,
          },
          (payload) => {
            setBuzzes((prev) => {
              if (payload.eventType === "INSERT") {
                const nb = payload.new as Buzz;
                if (prev.some((b) => b.id === nb.id)) return prev;
                return [...prev, nb].sort(
                  (a, b) =>
                    new Date(a.buzzed_at).getTime() -
                    new Date(b.buzzed_at).getTime(),
                );
              }
              if (payload.eventType === "DELETE")
                return prev.filter((b) => b.id !== (payload.old as Buzz).id);
              return prev;
            });
          },
        )
        .subscribe();
    }
    load();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [code]);

  return { room, players, buzzes, loading, error };
}
