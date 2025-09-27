import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@renderer/lib/utils";

type CrossfaderProps = {
  value: number;
  onChange: (value: number) => void;
};

export const Crossfader: React.FC<CrossfaderProps> = ({ value, onChange }) => {
  const handleValueChange = React.useCallback(
    (val: number[]) => {
      const [next] = val;
      onChange(next);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-foreground/60">
        <span>Deck A</span>
        <span>Blend</span>
        <span>Deck B</span>
      </div>
      <SliderPrimitive.Root
        value={[value]}
        step={0.01}
        min={0}
        max={1}
        onValueChange={handleValueChange}
        className="relative flex h-6 w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-[3px] w-full grow rounded-full bg-foreground/20">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-4 w-4 rounded-full border border-accent bg-black shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          )}
        />
      </SliderPrimitive.Root>
    </div>
  );
};
