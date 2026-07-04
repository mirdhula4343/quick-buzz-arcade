import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createRoom } from "@/lib/room";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host — QuickBuzz" },
      { name: "description", content: "Create a QuickBuzz room and invite up to 10 players." },
    ],
  }),
  component: HostPage,
});

function HostPage() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const room = await createRoom(name);
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
          <h1 className="font-display text-3xl font-bold">Host a game</h1>
          <p className="text-muted-foreground text-sm mt-1">
            You'll get a 6-digit room code to share.
          </p>
          <form onSubmit={handle} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Your display name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                placeholder="Host name"
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </label>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-lg neon-glow disabled:opacity-60"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : "Create Room"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
