import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export { formatDate } from './date'

export function normalizeListResponse(response, fallback = []) {
    if (!response) return fallback

    if (Array.isArray(response)) return response

    if (Array.isArray(response.data)) return response.data

    if (Array.isArray(response.data?.data)) return response.data.data

    if (Array.isArray(response.items)) return response.items

    return fallback
}