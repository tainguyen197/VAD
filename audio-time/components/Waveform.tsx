import { memo } from "react";

export type WaveformProps = {
  /** Whether the waveform should animate */
  active?: boolean;
  /** Tailwind utility classes to control the bar color */
  colorClassName?: string;
  /** Optional additional classes for the wrapper */
  className?: string;
  /** Number of bars to render */
  bars?: number;
};

const DEFAULT_COLOR = "bg-blue-500 dark:bg-blue-400";

const Waveform = memo(
  ({ active = false, colorClassName, className, bars = 5 }: WaveformProps) => {
    const segments = Array.from({ length: bars });
    const wrapperClasses = ["flex items-center gap-[3px] h-6", className]
      .filter(Boolean)
      .join(" ");
    const barClassesBase = [
      "inline-block w-[3px] rounded-full transition-opacity duration-300",
      colorClassName ?? DEFAULT_COLOR,
      active ? "wave-bar-active" : "wave-bar-idle",
    ].join(" ");

    return (
      <div className={wrapperClasses} aria-hidden>
        {segments.map((_, index) => (
          <span
            key={index}
            className={barClassesBase}
            style={{ animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>
    );
  }
);

Waveform.displayName = "Waveform";

export default Waveform;
