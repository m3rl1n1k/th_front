
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMonthName(monthNumber: number, locale: string = 'en'): string {
  const date = new Date();
  date.setMonth(monthNumber - 1); // Month is 0-indexed in JavaScript Date
  return date.toLocaleString(locale, { month: 'long' });
}
