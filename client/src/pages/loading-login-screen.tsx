import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function LoadingLoginScreen() {
  return (
    <div className="min-h-screen flex flex-col gap-6 items-center justify-center">
      <LoadingSpinner className="size-7" />
    </div>
  );
}
