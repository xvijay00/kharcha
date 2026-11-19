import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupees (₹).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string or Date object as "19 Nov 2026".
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a date string or Date object as a 12-hour time "02:30 PM".
 */
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Format a date string or Date object as "19 Nov 2026, 02:30 PM".
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)}, ${formatTime(date)}`;
}

/**
 * Get initials from a name (max 2 characters, uppercase).
 */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Get today's date as an ISO string (YYYY-MM-DD).
 */
export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Return a new Date set to the start of the day (00:00:00.000).
 */
export function startOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Return a new Date set to the end of the day (23:59:59.999).
 */
export function endOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
