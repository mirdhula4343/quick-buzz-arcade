import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Users, Radio, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickBuzz — Real-time Multiplayer Buzzer Game" },
      {
        name: "description",
        content:
          "Host a real-time buzzer game show in seconds. Millisecond-accurate buzz detection, up to 10 players, no accounts needed.",
      },
      { property: "og:title", content: "QuickBuzz — Real-time Multiplayer Buzzer" },
      {
        property: "og:description",
        content:
          "The fastest way to run a buzzer round. Create a room, share the code, play.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Zap, big: "10ms", label: "Response Time" },
  { icon: Users, big: "10", label: "Max Players" },
  { icon: Radio, big: "100%", label: "Real-Time Sync" },
  { icon: Sparkles, big: "∞", label: "Fun Guaranteed" },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* floating glow orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full blur-3xl opacity-40 animate-float-slow"
        style={{ background: "var(--primary)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 size-[28rem] rounded-full blur-3xl opacity-30 animate-float-slow"
        style={{ background: "var(--secondary)", animationDelay: "-3s" }}
      />

      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <div className="glass mx-auto mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
          <span className="size-2 rounded-full bg-[color:var(--neon)] animate-pulse" />
          Real-time multiplayer, no accounts
        </div>

        <h1 className="font-display text-7xl md:text-9xl font-black leading-none">
          <span className="text-gradient">BUZZ!</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg md:text-xl text-muted-foreground">
          The instant buzzer game show for your next party, classroom, or
          team-meeting. Millisecond accurate. Zero setup.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/host"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-lg neon-glow transition-transform hover:scale-105"
            style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
          >
            Host a Game
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/join"
            className="glass inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-lg hover:bg-white/10 transition-colors"
          >
            Join a Game
          </Link>
        </div>

        {/* feature cards */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.label} className="glass rounded-2xl p-6 text-left">
              <f.icon className="size-6 text-[color:var(--neon)] mb-3" />
              <div className="font-display text-4xl font-black text-gradient">
                {f.big}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <h2 className="text-center font-display text-3xl md:text-4xl font-bold mb-12">
          How it works
        </h2>
        <ol className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Create a room", d: "Get a 6-digit code and a QR to share." },
            { n: "02", t: "Players join", d: "Just a name — no signup, no app install." },
            { n: "03", t: "First buzz wins", d: "Millisecond timestamps rank every buzz." },
          ].map((s) => (
            <li key={s.n} className="glass rounded-2xl p-6">
              <div className="font-display text-5xl font-black text-primary/80">
                {s.n}
              </div>
              <div className="mt-2 font-semibold text-lg">{s.t}</div>
              <div className="text-muted-foreground text-sm mt-1">{s.d}</div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted-foreground">
        Built with ⚡ on Lovable — QuickBuzz © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
