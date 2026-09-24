"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

function Slider({
  className,
  thumbLabel,
  tone = "default",
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { thumbLabel?: string; tone?: "default" | "console" }) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex w-full touch-none items-center py-2 select-none", className)}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative h-1 w-full grow overflow-hidden rounded-full",
          tone === "console" ? "bg-console-border" : "bg-border",
        )}
      >
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={thumbLabel}
        className="block size-4 cursor-pointer rounded-full border-2 border-background bg-primary shadow outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      />
    </SliderPrimitive.Root>
  );
}

export { Slider };
