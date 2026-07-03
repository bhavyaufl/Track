// All dates in the app use IST (UTC+5:30) explicitly
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export function todayIST() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().split('T')[0]
}

export function yesterdayIST() {
  return new Date(Date.now() + IST_OFFSET_MS - 86400000).toISOString().split('T')[0]
}

export function dateToIST(offsetDays = 0) {
  return new Date(Date.now() + IST_OFFSET_MS + offsetDays * 86400000).toISOString().split('T')[0]
}
