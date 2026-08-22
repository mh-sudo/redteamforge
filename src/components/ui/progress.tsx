import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-1 w-full overflow-hidden rounded-none bg-elevated", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full bg-accent transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        // No value = indeterminate: a steel sweep of the hairline track.
        value == null &&
          "w-2/5 animate-indeterminate motion-reduce:w-full motion-reduce:animate-none",
      )}
      style={
        value == null ? undefined : { transform: `translateX(-${100 - value}%)` }
      }
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
