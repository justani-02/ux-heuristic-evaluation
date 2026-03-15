import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-[hsl(var(--score-excellent))]";
  if (score >= 60) return "text-[hsl(var(--score-good))]";
  if (score >= 40) return "text-[hsl(var(--score-average))]";
  return "text-[hsl(var(--score-poor))]";
}

function getScoreStroke(score: number) {
  if (score >= 80) return "hsl(142, 71%, 45%)";
  if (score >= 60) return "hsl(167, 72%, 44%)";
  if (score >= 40) return "hsl(38, 92%, 50%)";
  return "hsl(0, 84%, 60%)";
}

export function ScoreRing({ score, size = 120, strokeWidth = 8, className, label }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getScoreStroke(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-2xl font-bold", getScoreColor(score))} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {score}
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground font-medium text-center">{label}</span>}
    </div>
  );
}
