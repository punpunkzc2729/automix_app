import * as React from "react";
import { cn } from "@renderer/lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn(
      "rounded-xl border border-muted/60 bg-muted/40 p-4 shadow-deck backdrop-blur-sm",
      className
    )}
    {...props}
  />
);
