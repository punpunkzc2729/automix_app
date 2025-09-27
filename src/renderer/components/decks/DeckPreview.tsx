import * as React from "react";
import { Track } from "@shared/types";
import { Card } from "@renderer/components/ui/card";
import { cn } from "@renderer/lib/utils";

type DeckPreviewProps = {
  label: string;
  track?: Track;
  isActive?: boolean;
};

export const DeckPreview: React.FC<DeckPreviewProps> = ({ label, track, isActive }) => {
  return (
    <Card
      className={cn(
        "flex flex-1 flex-col gap-3 border-transparent transition",
        isActive ? "border-accent/60" : "border-transparent"
      )}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-foreground/60">
        <span>{label}</span>
        <span>{track?.features?.bpm ? `${track.features.bpm} BPM` : "—"}</span>
      </div>
      <div className="flex flex-col gap-4">
        <div className="h-24 rounded-md bg-gradient-to-r from-accent/40 via-foreground/10 to-accent/20" />
        <div>
          <h3 className="text-lg font-semibold text-foreground/90">{track?.title ?? "No track"}</h3>
          <p className="text-sm text-foreground/60">
            {track?.features?.key ? `${track.features.key} •` : ""} {track?.durationSec ? `${Math.round(track.durationSec / 60)}m` : ""}
          </p>
        </div>
      </div>
    </Card>
  );
};
