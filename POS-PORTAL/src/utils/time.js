export const VIETNAM_TIME_ZONE = 'Asia/Bangkok';

const DATE_TIME_OPTIONS = {
  timeZone: VIETNAM_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
};

const SQL_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export function parsePortalDate(value, { assumeUtc = false } = {}) {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (assumeUtc && typeof value === 'string' && SQL_TIMESTAMP_RE.test(value)) {
    return new Date(`${value.replace(' ', 'T')}Z`);
  }

  return new Date(value);
}

export function formatVietnamTime(value, options) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsePortalDate(value, options));
}

export function formatVietnamDate(value, options) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsePortalDate(value, options));
}

export function formatVietnamDateTime(value, options) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', DATE_TIME_OPTIONS).format(parsePortalDate(value, options));
}
