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

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(time: string): string {
  const [hours = '00', minutes = '00'] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function absoluteUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || ''}${path}`;
}
