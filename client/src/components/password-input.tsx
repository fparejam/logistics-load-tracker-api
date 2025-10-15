import { useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  validationState?: "valid" | "invalid" | "neutral";
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, validationState = "neutral", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const getValidationStyles = () => {
      switch (validationState) {
        case "valid":
          return "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400/20";
        case "invalid":
          return "border-red-300 focus:border-red-400 focus:ring-red-400/20";
        default:
          return "";
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={cn(
            "pr-10 transition-all duration-200",
            getValidationStyles(),
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          disabled={props.disabled}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
