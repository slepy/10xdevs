import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number (in PLN from backend) as Polish currency
 * Backend converts cents to PLN before returning data
 */
export function formatCurrency(amountInPLN: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInPLN);
}

/**
 * Konwertuje kwotę z PLN na centy (grosz)
 * @param amount Kwota w PLN
 * @returns Kwota w groszach
 */
export function convertToSatoshi(amount: number): number {
  // Mnożenie przez 100 i zaokrąglenie, aby uniknąć problemów z floating point
  return Math.round(amount * 100);
}

/**
 * Konwertuje kwotę z groszy na PLN
 * @param satoshi Kwota w groszach
 * @returns Kwota w PLN
 */
export function convertFromSatoshi(satoshi: number): number {
  return satoshi / 100;
}
