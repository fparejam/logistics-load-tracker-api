import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserColor(identifier?: string): string {
  const colors = [
    "bg-stone-100 text-stone-500",
    "bg-gray-100 text-gray-500",
    "bg-red-100 text-red-500",
    "bg-orange-100 text-orange-500",
    "bg-amber-100 text-amber-500",
    "bg-yellow-100 text-yellow-500",
    "bg-green-100 text-green-500",
    "bg-emerald-100 text-emerald-500",
    "bg-teal-100 text-teal-500",
    "bg-cyan-100 text-cyan-500",
    "bg-sky-100 text-sky-500",
    "bg-blue-100 text-blue-500",
    "bg-indigo-100 text-indigo-500",
    "bg-violet-100 text-violet-500",
    "bg-purple-100 text-purple-500",
    "bg-fuchsia-100 text-fuchsia-500",
    "bg-pink-100 text-pink-500",
    "bg-rose-100 text-rose-500",
  ];

  if (!identifier) return colors[0];

  // Use a hash function to ensure consistent color assignment
  const hash = identifier.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
