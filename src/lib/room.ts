import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "./client-id";

export const MAX_PLAYERS = 10;

export async function generateRoomCode(): Promise<string> {
  // Try up to 8 times to find an unused 6-digit code
  for (let i = 0; i < 8; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { data } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique room code, try again");
}

export async function createRoom(hostName: string) {
  const clientId = getClientId();
  const code = await generateRoomCode();

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      code,
      host_client_id: clientId,
      status: "waiting",
      settings: { max_players: MAX_PLAYERS },
    })
    .select()
    .single();
  if (error) throw error;

  const { error: pErr } = await supabase.from("players").insert({
    room_id: room.id,
    client_id: clientId,
    name: hostName.trim() || "Host",
    is_host: true,
  });
  if (pErr) throw pErr;

  return room;
}

export async function joinRoom(code: string, name: string) {
  const clientId = getClientId();
  const cleaned = code.trim();
  if (!/^\d{6}$/.test(cleaned)) throw new Error("Room code must be 6 digits");

  const { data: room, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", cleaned)
    .maybeSingle();
  if (error) throw error;
  if (!room) throw new Error("Room not found");
  if (room.locked) throw new Error("Room is locked");

  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);
  if ((count ?? 0) >= MAX_PLAYERS) throw new Error("Room is full");

  // Upsert player (allow rejoin)
  const { error: pErr } = await supabase.from("players").upsert(
    {
      room_id: room.id,
      client_id: clientId,
      name: name.trim() || "Player",
      connected: true,
    },
    { onConflict: "room_id,client_id" },
  );
  if (pErr) throw pErr;

  return room;
}
