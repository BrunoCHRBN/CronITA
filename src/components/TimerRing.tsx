import type { ReactNode } from "react";

interface TimerRingProps {
  /** 0..1 */
  progress: number;
  tone: "idle" | "running" | "paused" | "break";
  children: ReactNode;
}

const SIZE = 200;
const C = SIZE / 2;
const R = 92;
const CIRC = 2 * Math.PI * R;
const TICKS = 60;

/** Watch-face ring: 60 minute ticks plus a progress arc with a leading dot. */
export function TimerRing({ progress, tone, children }: TimerRingProps) {
  const p = Math.min(1, Math.max(0, progress));
  const angle = p * 2 * Math.PI - Math.PI / 2;
  const litTicks = Math.floor(p * TICKS);

  return (
    <div className={`ring ring--${tone}`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden focusable="false">
        <g>
          {Array.from({ length: TICKS }, (_, i) => {
            const a = (i / TICKS) * 2 * Math.PI - Math.PI / 2;
            const major = i % 5 === 0;
            const r1 = major ? 76 : 79;
            const r2 = 83;
            return (
              <line
                key={i}
                className={`ring-tick${major ? " major" : ""}${i < litTicks ? " on" : ""}`}
                x1={C + r1 * Math.cos(a)}
                y1={C + r1 * Math.sin(a)}
                x2={C + r2 * Math.cos(a)}
                y2={C + r2 * Math.sin(a)}
              />
            );
          })}
        </g>
        <circle className="ring-track" cx={C} cy={C} r={R} />
        <circle
          className="ring-progress"
          cx={C}
          cy={C}
          r={R}
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - p)}
          transform={`rotate(-90 ${C} ${C})`}
        />
        {p > 0 && p < 1 && (
          <circle className="ring-dot" cx={C + R * Math.cos(angle)} cy={C + R * Math.sin(angle)} r={5} />
        )}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
