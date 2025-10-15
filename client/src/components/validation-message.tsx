import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationMessageProps {
  type: "success" | "error";
  children: React.ReactNode;
  show: boolean;
}

export function ValidationMessage({
  type,
  children,
  show,
}: ValidationMessageProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs",
        type === "success" ? "text-green-600" : "text-destructive",
      )}
    >
      {type === "success" ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {children}
    </div>
  );
}
