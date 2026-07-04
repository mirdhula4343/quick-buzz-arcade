import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { joinRoom } from "@/lib/room";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

const joinSearch = z.object({ code: z.coerce.string().optional() });

export const Route = createFileRoute("/join")({
  validateSearch: joinSearch,
  head: () => ({
    meta: [
      { title: "Join — QuickBuzz" },
      { name: "description", content: "Join a QuickBuzz room with a 6-digit code." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { code: prefill } = useSearch({ from: "/join" });
  const [code, setCode] = useState(prefill ?? "");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const room = await joinRoom(code, name);
      navigate({ to: "/room/$code", params: { code: room.code } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-3xl font-bold">Join a game</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter the 6-digit room code from your host.
          </p>
          <form onSubmit={handle} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Room code</span>
              <input
                autoFocus={!prefill}
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                placeholder="123456"
                className="mt-1 w-full text-center rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 font-mono text-3xl tracking-[0.4em]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Your name</span>
              <input
                autoFocus={!!prefill}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                placeholder="Player name"
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </label>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button
              type="submit"
              disabled={busy || code.length !== 6 || !name.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-lg neon-glow disabled:opacity-60"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : "Join Room"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
