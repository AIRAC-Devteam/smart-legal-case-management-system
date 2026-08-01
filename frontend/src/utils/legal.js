export const CASE_TYPE_LABELS = {
  legal: 'حقوقی',
  criminal: 'کیفری',
  quasi_judicial: 'شبه قضایی',
  administrative: 'اداری',
}

export const CLASSIFICATION_LABELS = {
  normal: 'عادی',
  confidential: 'محرمانه',
}

export const FINANCIAL_LABELS = {
  financial: 'مالی',
  non_financial: 'غیرمالی',
}

export const CASE_STATUS_LABELS = {
  primary: 'اصلی',
  secondary: 'فرعی',
}

export const SUBMITTED_BY_LABELS = {
  organization: 'سازمان/شرکت',
  other: 'دیگری',
}

export const DRAFT_STATUS_LABELS = {
  draft: 'پیش‌نویس',
  under_review: 'در حال بررسی',
  approved: 'تأییدشده',
  archived: 'بایگانی‌شده',
}

export function formatDate(value, includeTime = true) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime
        ? { hour: '2-digit', minute: '2-digit' }
        : {}),
    })
  } catch {
    return value
  }
}

export function formatAmount(value) {
  if (value == null || value === '') return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value)
  return `${number.toLocaleString('fa-IR')} ریال`
}

export function draftStatusClass(status) {
  return `status-badge status-${status || 'draft'}`
}

export function caseTypeLabel(value) {
  return CASE_TYPE_LABELS[value] || 'نامشخص'
}
