import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount?: number | string | null): string {
  const safe = Number(amount);
  const val = isNaN(safe) ? 0 : safe;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatNumber(num?: number | string | null): string {
  const safe = Number(num);
  const val = isNaN(safe) ? 0 : safe;
  return new Intl.NumberFormat('en-IN').format(val);
}
