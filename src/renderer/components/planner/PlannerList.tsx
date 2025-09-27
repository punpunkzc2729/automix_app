import * as React from "react";
import { PlanResponse, TransitionNote } from "@shared/types";
import { Card } from "@renderer/components/ui/card";

const TransitionRow: React.FC<{ transition: TransitionNote; index: number }> = ({ transition, index }) => {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-transparent bg-black/30 px-3 py-2">
      <div className="flex items-center justify-between text-xs text-foreground/60">
        <span>
          #{index + 1} → {transition.toId}
        </span>
        <span>{transition.targetBpm ? `${transition.targetBpm} BPM` : "~"}</span>
      </div>
      <div className="text-sm text-foreground/80">
        {transition.keyMove ?? "Key hold"} • {transition.barsOverlap} bars
      </div>
      {transition.fx?.length ? (
        <div className="text-xs text-foreground/50">FX: {transition.fx.join(", ")}</div>
      ) : null}
    </div>
  );
};

export const PlannerList: React.FC<{ plan?: PlanResponse | null }> = ({ plan }) => {
  return (
    <Card className="flex h-full flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">Planner</h3>
        <p className="text-xs text-foreground/50">Upcoming transitions and notes</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {plan?.orderedTracks?.slice(0, 6).map((track, idx) => (
          <div key={track.videoId} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm font-medium text-foreground/80">
              <span>
                {idx + 1}. {track.title}
              </span>
              <span className="text-xs text-foreground/60">
                {track.features?.bpm ? `${track.features.bpm} BPM` : "~"} • {track.features?.key ?? ""}
              </span>
            </div>
            {plan.transitions[idx] ? <TransitionRow transition={plan.transitions[idx]} index={idx} /> : null}
          </div>
        ))}
        {!plan?.orderedTracks?.length ? (
          <div className="flex flex-1 items-center justify-center text-sm text-foreground/40">
            Queue tracks and generate an automix plan.
          </div>
        ) : null}
      </div>
      {plan?.rationale ? (
        <div className="rounded-md bg-black/20 p-3 text-xs text-foreground/60">
          {plan.rationale}
        </div>
      ) : null}
    </Card>
  );
};
