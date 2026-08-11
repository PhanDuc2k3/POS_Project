const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function vietnamDateParts(date = new Date()) {
  return new Date(date.getTime() + VIETNAM_OFFSET_MS).toISOString();
}

function nowVietnamSql() {
  return vietnamDateParts().slice(0, 19).replace('T', ' ');
}

function vietnamDate(offsetDays = 0) {
  return vietnamDateParts(new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)).slice(0, 10);
}

function todayVietnamDate() {
  return vietnamDate();
}

function todayVietnamCompact() {
  return todayVietnamDate().replace(/-/g, '');
}

module.exports = { nowVietnamSql, vietnamDate, todayVietnamDate, todayVietnamCompact };
