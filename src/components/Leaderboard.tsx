import { Trophy, Medal, Award, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LBPlayer {
  id: string;
  name: string;
  score: number;
  is_eliminated: boolean;
  connected: boolean;
}

export function Leaderboard({
  players,
  highlightId,
}: {
  players: LBPlayer[];
  highlightId?: string;
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="glass rounded-2xl p-4 space-y-2">
      <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
        <Trophy className="size-5 text-[color:var(--gold)]" />
        Leaderboard
      </h3>
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground">No players yet.</p>
      )}
      {sorted.map((p, i) => {
        const Icon = i === 0 ? Trophy : i === 1 ? Medal : i === 2 ? Award : User;
        const iconColor =
          i === 0
            ? "text-[color:var(--gold)]"
            : i === 1
              ? "text-slate-300"
              : i === 2
                ? "text-orange-400"
                : "text-muted-foreground";
        return (
          <div
            key={p.id}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
              highlightId === p.id
                ? "bg-primary/20 ring-1 ring-primary/50"
                : "bg-white/5",
              p.is_eliminated && "opacity-40 line-through",
            )}
          >
            <span className="w-6 text-center font-mono font-bold text-muted-foreground">
              {i + 1}
            </span>
            <Icon className={cn("size-4 shrink-0", iconColor)} />
            <span className="flex-1 truncate font-medium">{p.name}</span>
            {!p.connected && (
              <span className="text-xs text-muted-foreground">offline</span>
            )}
            <span className="font-mono font-bold tabular-nums text-primary">
              {p.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
