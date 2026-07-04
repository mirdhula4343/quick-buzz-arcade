import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import { useRoom, type Player } from "@/hooks/use-room";
import { BuzzButton } from "@/components/BuzzButton";
import { Leaderboard } from "@/components/Leaderboard";
import {
  Copy,
  Lock,
  Unlock,
  Play,
  Square,
  RotateCcw,
  Plus,
  Minus,
  UserX,
  UserCheck,
  Loader2,
  ArrowLeft,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/room/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Room ${params.code} — QuickBuzz` },
      { name: "description", content: "Live QuickBuzz room." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const { room, players, buzzes, loading, error } = useRoom(code);
  const navigate = useNavigate();
  const clientId = typeof window !== "undefined" ? getClientId() : "";

  const me = useMemo(
    () => players.find((p) => p.client_id === clientId) ?? null,
    [players, clientId],
  );
  const isHost = !!room && room.host_client_id === clientId;

  // If we opened this URL without joining, and we're not the host, send to /join
  useEffect(() => {
    if (loading || !room) return;
    if (!me && !isHost) {
      navigate({ to: "/join", search: { code } });
    }
  }, [loading, room, me, isHost, code, navigate]);

  // Keyboard: spacebar to buzz for players
  useEffect(() => {
    if (isHost || !room || !me) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && room.round_active) {
        e.preventDefault();
        void handleBuzz();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, room?.round_active, me?.id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    );
  }
  if (error || !room) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg">Room not found.</p>
        <Link to="/" className="text-primary underline">Home</Link>
      </main>
    );
  }

  // ---- BUZZER: locked, do not modify order semantics ----
  async function handleBuzz() {
    if (!me || !room?.round_active) return;
    // Only allow one buzz per round per player — DB unique constraint enforces it too
    const already = buzzes.some((b) => b.player_id === me.id && b.round === room.current_round);
    if (already) return;
    await supabase.from("buzzes").insert({
      room_id: room.id,
      player_id: me.id,
      round: room.current_round,
      // buzzed_at is set by DB clock_timestamp() for authoritative ordering
    });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(60);
  }

  const currentBuzzes = buzzes
    .filter((b) => b.round === room.current_round)
    .sort(
      (a, b) => new Date(a.buzzed_at).getTime() - new Date(b.buzzed_at).getTime(),
    );
  const firstBuzz = currentBuzzes[0];
  const firstPlayer = firstBuzz
    ? (players.find((p) => p.id === firstBuzz.player_id) ?? null)
    : null;

  const myState: "waiting" | "active" | "locked" | "won" | "lost" = (() => {
    if (!me) return "waiting";
    if (me.is_eliminated) return "locked";
    if (!room.round_active) {
      if (firstBuzz && firstBuzz.player_id === me.id) return "won";
      return "waiting";
    }
    const iBuzzed = currentBuzzes.some((b) => b.player_id === me.id);
    if (iBuzzed) {
      if (firstBuzz?.player_id === me.id) return "won";
      return "lost";
    }
    if (firstBuzz) return "locked";
    return "active";
  })();

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?code=${room.code}`
      : "";

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Leave
          </Link>
          <div className="text-sm text-muted-foreground">
            Round <span className="text-foreground font-semibold">{room.current_round}</span>
            {" · "}
            <span className={cn("font-semibold", room.round_active ? "text-[color:var(--neon)]" : "text-muted-foreground")}>
              {room.round_active ? "LIVE" : room.status === "ended" ? "ENDED" : "IDLE"}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            {isHost ? (
              <HostPanel
                room={room}
                players={players}
                firstPlayer={firstPlayer}
                joinUrl={joinUrl}
              />
            ) : (
              <PlayerPanel
                state={myState}
                onBuzz={handleBuzz}
                me={me}
                firstPlayer={firstPlayer}
                roundActive={room.round_active}
              />
            )}
          </div>

          <div className="space-y-4">
            <Leaderboard
              players={players as unknown as Parameters<typeof Leaderboard>[0]["players"]}
              highlightId={me?.id}
            />
            <div className="glass rounded-2xl p-4 text-sm">
              <div className="font-semibold mb-2">Players ({players.length}/10)</div>
              <ul className="space-y-1 text-muted-foreground">
                {players.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className={cn("size-1.5 rounded-full", p.connected ? "bg-[color:var(--neon)]" : "bg-muted-foreground")} />
                    <span className={cn("truncate", p.is_eliminated && "line-through opacity-50")}>
                      {p.name}
                    </span>
                    {p.is_host && <span className="text-xs text-primary">host</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PlayerPanel({
  state,
  onBuzz,
  me,
  firstPlayer,
  roundActive,
}: {
  state: "waiting" | "active" | "locked" | "won" | "lost";
  onBuzz: () => void;
  me: Player | null;
  firstPlayer: Player | null;
  roundActive: boolean;
}) {
  return (
    <div className="glass rounded-3xl p-8 flex flex-col items-center gap-6 text-center min-h-[520px] justify-center">
      <div>
        <div className="text-sm text-muted-foreground uppercase tracking-widest">You</div>
        <div className="font-display text-2xl font-bold">{me?.name}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Score: <span className="text-primary font-bold">{me?.score ?? 0}</span>
        </div>
      </div>
      <BuzzButton state={state} onBuzz={onBuzz} />
      {!roundActive && firstPlayer && (
        <div className="text-lg">
          <span className="text-muted-foreground">Winner:</span>{" "}
          <span className="font-bold text-[color:var(--neon)]">{firstPlayer.name}</span>
        </div>
      )}
      {roundActive && state === "active" && (
        <div className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10">SPACE</kbd> to buzz</div>
      )}
    </div>
  );
}

function HostPanel({
  room,
  players,
  firstPlayer,
  joinUrl,
}: {
  room: NonNullable<ReturnType<typeof useRoom>["room"]>;
  players: Player[];
  firstPlayer: Player | null;
  joinUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function updateRoom(patch: Partial<typeof room>) {
    await supabase.from("rooms").update(patch).eq("id", room.id);
  }

  async function startRound() {
    // Clear this round's buzzes if any (reset for the round we're starting)
    const nextRound = room.current_round + 1;
    await supabase.from("rooms").update({
      current_round: nextRound,
      round_active: true,
      status: "active",
    }).eq("id", room.id);
  }

  async function endRound() {
    await updateRoom({ round_active: false });
  }

  async function resetBuzzer() {
    await supabase.from("buzzes").delete().eq("room_id", room.id).eq("round", room.current_round);
  }

  async function resetAll() {
    if (!confirm("Reset the whole game? Scores and buzzes will be cleared.")) return;
    await supabase.from("buzzes").delete().eq("room_id", room.id);
    await supabase.from("players").update({ score: 0, is_eliminated: false }).eq("room_id", room.id);
    await supabase.from("rooms").update({ current_round: 0, round_active: false, status: "waiting" }).eq("id", room.id);
  }

  async function adjustScore(playerId: string, delta: number) {
    const p = players.find((x) => x.id === playerId);
    if (!p) return;
    await supabase.from("players").update({ score: p.score + delta }).eq("id", playerId);
  }

  async function toggleEliminated(p: Player) {
    await supabase.from("players").update({ is_eliminated: !p.is_eliminated }).eq("id", p.id);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 text-center md:text-left">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Room code</div>
            <div className="font-display font-black text-6xl md:text-7xl tracking-widest text-gradient">
              {room.code}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                onClick={copyCode}
                className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm hover:bg-white/10"
              >
                <Copy className="size-4" /> {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                onClick={() => updateRoom({ locked: !room.locked })}
                className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm hover:bg-white/10"
              >
                {room.locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                {room.locked ? "Locked" : "Unlocked"}
              </button>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-3">
            <QRCodeSVG value={joinUrl} size={140} />
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Round controls</h2>
          <div className="text-sm text-muted-foreground">Round {room.current_round}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!room.round_active ? (
            <button
              onClick={startRound}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold neon-glow"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              <Play className="size-4" /> Start round {room.current_round + 1}
            </button>
          ) : (
            <button
              onClick={endRound}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold bg-destructive text-destructive-foreground"
            >
              <Square className="size-4" /> End round
            </button>
          )}
          <button
            onClick={resetBuzzer}
            className="glass inline-flex items-center gap-2 rounded-xl px-4 py-2.5 hover:bg-white/10"
          >
            <RotateCcw className="size-4" /> Reset buzzer
          </button>
          <button
            onClick={resetAll}
            className="glass inline-flex items-center gap-2 rounded-xl px-4 py-2.5 hover:bg-white/10"
          >
            <RotateCcw className="size-4" /> Reset game
          </button>
        </div>

        {firstPlayer && (
          <div className="mt-4 rounded-2xl bg-[color:var(--neon)]/10 border border-[color:var(--neon)]/30 p-4 flex items-center gap-3">
            <Trophy className="size-6 text-[color:var(--neon)]" />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest text-[color:var(--neon)]">
                First to buzz
              </div>
              <div className="font-bold text-xl">{firstPlayer.name}</div>
            </div>
            <button
              onClick={() => adjustScore(firstPlayer.id, 1)}
              className="inline-flex items-center gap-1 rounded-xl bg-[color:var(--neon)]/20 hover:bg-[color:var(--neon)]/30 px-4 py-2 font-semibold"
            >
              <Plus className="size-4" /> Award point
            </button>
          </div>
        )}
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-bold mb-4">Score controls</h2>
        {players.filter(p => !p.is_host).length === 0 && (
          <p className="text-sm text-muted-foreground">Waiting for players to join…</p>
        )}
        <ul className="space-y-2">
          {players.filter(p => !p.is_host).map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
              <span className={cn("flex-1 truncate", p.is_eliminated && "line-through opacity-50")}>{p.name}</span>
              <span className="w-12 text-right font-mono font-bold text-primary">{p.score}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => adjustScore(p.id, -1)} className="glass rounded-lg p-1.5 hover:bg-white/10" aria-label="Deduct">
                  <Minus className="size-4" />
                </button>
                <button onClick={() => adjustScore(p.id, 1)} className="glass rounded-lg p-1.5 hover:bg-white/10" aria-label="Award">
                  <Plus className="size-4" />
                </button>
                <button onClick={() => toggleEliminated(p)} className="glass rounded-lg p-1.5 hover:bg-white/10" aria-label="Eliminate">
                  {p.is_eliminated ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
