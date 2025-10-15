import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className="animate-[spin_1s_ease-in-out_infinite]">
      <Loader2
        className={cn(
          "size-8 animate-spin duration-[4000ms] text-muted-foreground",
          className,
        )}
      />
    </div>
  );
}
