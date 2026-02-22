import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getConfidenceColor(score: number): string {
  if (score >= 80) return 'text-buy';
  if (score >= 60) return 'text-warning';
  return 'text-sell';
}

export function getConfidenceLabel(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

export function calculateRR(entry: number, stopLoss: number, takeProfit: number, direction: 'BUY' | 'SELL'): number {
  if (direction === 'BUY') {
    const risk = entry - stopLoss;
    const reward = takeProfit - entry;
    return risk > 0 ? Math.round((reward / risk) * 100) / 100 : 0;
  } else {
    const risk = stopLoss - entry;
    const reward = entry - takeProfit;
    return risk > 0 ? Math.round((reward / risk) * 100) / 100 : 0;
  }
}
