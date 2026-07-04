import { cn } from "@/lib/utils";

interface Props {
  state: "waiting" | "active" | "locked" | "won" | "lost";
  onBuzz: () => void;
  disabled?: boolean;
}

const labels: Record<Props["state"], string> = {
  waiting: "GET READY",
  active: "BUZZ!",
  locked: "LOCKED",
  won: "YOU GOT IT!",
  lost: "TOO SLOW",
};

export function BuzzButton({ state, onBuzz, disabled }: Props) {
  const isActive = state === "active" && !disabled;
  return (
    <button
      type="button"
      onClick={isActive ? onBuzz : undefined}
      disabled={!isActive}
      aria-label="Buzz"
      className={cn(
        "relative select-none rounded-full font-display font-bold uppercase tracking-widest",
        "size-64 md:size-80 text-3xl md:text-4xl",
        "transition-transform duration-100 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60",
        isActive && "animate-buzz-pulse cursor-pointer",
        state === "waiting" && "opacity-70 cursor-not-allowed",
        state === "locked" && "opacity-50 grayscale cursor-not-allowed",
        state === "won" && "cursor-default",
        state === "lost" && "opacity-60 cursor-not-allowed",
      )}
      style={{
        background:
          state === "won"
            ? "radial-gradient(circle at 30% 30%, oklch(0.88 0.22 150), oklch(0.55 0.22 150))"
            : "var(--gradient-buzz)",
        boxShadow: "var(--shadow-buzz)",
        color: "var(--buzz-foreground)",
      }}
    >
      <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
        {labels[state]}
      </span>
    </button>
  );
}
