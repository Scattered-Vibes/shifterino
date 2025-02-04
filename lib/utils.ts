/**
 * Combines multiple class values into a single, merged class string.
 *
 * This function uses "clsx" to conditionally join class names and "twMerge" from "tailwind-merge"
 * to intelligently merge Tailwind CSS classes. It resolves conflicts by ensuring that classes
 * applied later override earlier ones when necessary.
 *
 * Example:
 *   const className = cn('p-4', condition && 'bg-blue-500');
 *
 * @param inputs - An array of class values (strings, numbers, arrays, or objects) to be merged.
 * @returns A single string containing the merged classes.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
}
