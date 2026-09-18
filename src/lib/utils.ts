import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const numFormatter = new Intl.NumberFormat('en-IN');

export function formatINR(amount?: number | string | null): string {
  const safe = Number(amount);
  return inrFormatter.format(isNaN(safe) ? 0 : safe);
}

export function formatNumber(num?: number | string | null): string {
  const safe = Number(num);
  return numFormatter.format(isNaN(safe) ? 0 : safe);
}

