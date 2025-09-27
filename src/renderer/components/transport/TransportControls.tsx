import * as React from "react";
import { Button } from "@renderer/components/ui/button";

export type TransportControlsProps = {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onQuantize: (bars: number) => void;
  energy: number;
  onEnergyChange: (value: number) => void;
};

export const TransportControls: React.FC<TransportControlsProps> = ({
  onPlay,
  onPause,
  onNext,
  onPrev,
  onQuantize,
  energy,
  onEnergyChange
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-muted/40 bg-black/30 p-4">
      <div className="flex items-center gap-2">
        <Button onClick={onPrev} variant="secondary">
          Prev
        </Button>
        <Button onClick={onPlay}>Play</Button>
        <Button onClick={onPause} variant="secondary">
          Pause
        </Button>
        <Button onClick={onNext} variant="secondary">
          Next
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-foreground/70">
        <span>Quantize</span>
        {[8, 16, 32].map((bars) => (
          <button
            key={bars}
            className="rounded-md border border-transparent bg-foreground/10 px-3 py-1 text-xs uppercase tracking-wide transition hover:border-accent/50 hover:text-accent"
            onClick={() => onQuantize(bars)}
          >
            {bars} bars
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-foreground/60">Energy</span>
        <input
          type="range"
          min={1}
          max={10}
          value={energy}
          onChange={(event) => onEnergyChange(Number(event.target.value))}
          className="h-2 w-40 cursor-pointer rounded-full bg-foreground/20 accent-accent"
        />
        <span className="w-6 text-right text-foreground/80">{energy}</span>
      </div>
    </div>
  );
};
