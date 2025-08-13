import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencySymbol(currency: string = 'ksh'): string {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    NGN: '₦',
    ZAR: 'R',
    KES: 'KSh',
    KSH: 'KSh', // Add lowercase support
    GHS: 'GH₵',
  };
  
  return symbols[currency.toUpperCase()] || currency;
}

export function formatCurrency(amount: number, currency: string = 'ksh'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatPrice(price: number, currency: string = 'ksh'): string {
  return formatCurrency(price, currency);
}
