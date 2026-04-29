// Tailwind class'larini birlestirmek icin standart cn() utility.
// clsx → conditional class join, twMerge → conflict resolution.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
