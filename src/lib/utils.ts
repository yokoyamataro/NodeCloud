import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFieldLabel(farmerNumber: number, fieldNumber: number): string {
  return `${farmerNumber}-${fieldNumber}`
}

export function getWorkTypeColor(workTypeCode: string): string {
  const colors: Record<string, string> = {
    underdrain: '#3B82F6',    // 暗渠 - blue
    soil_import: '#F59E0B',   // 客土 - amber
    subsoil_break: '#EF4444', // 心破 - red
    soil_improve: '#10B981',  // 土改 - emerald
    grading: '#8B5CF6',       // 整地 - violet
    open_ditch: '#06B6D4',    // 明渠 - cyan
  }
  return colors[workTypeCode] || '#6B7280'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planned: '計画中',
    active: '進行中',
    completed: '完了',
    suspended: '中断',
    not_started: '未着手',
    in_progress: '作業中',
    on_hold: '保留',
    pending: '保留中',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planned: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    not_started: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
