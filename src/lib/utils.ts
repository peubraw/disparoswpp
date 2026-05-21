import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");
  // If already has country code (starts with 55 and length >= 12)
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }
  // If 11 digits (DDD + number), add 55
  if (digits.length === 11) {
    return `55${digits}`;
  }
  // If 10 digits (DDD + 8-digit number), add 55
  if (digits.length === 10) {
    return `55${digits}`;
  }
  return digits;
}

export function interpolateTemplate(
  template: string,
  vars: Record<string, string | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    return vars[key] ?? match;
  });
}
