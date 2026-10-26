const LOCALE = "tr-TR";

const money = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const moneyPrecise = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const clock = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const dateTime = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * The server sends `decimal`, which becomes a JS `double`. Display what the
 * server gave us — never recompute prices or minimum increments locally.
 */
export function formatMoney(amount: number): string {
  return money.format(amount);
}

/** Same as {@link formatMoney} but keeps kuruş, for bid amounts. */
export function formatMoneyPrecise(amount: number): string {
  return moneyPrecise.format(amount);
}

export function formatClock(isoDate: string): string {
  return clock.format(new Date(isoDate));
}

export function formatDateTime(isoDate: string): string {
  return dateTime.format(new Date(isoDate));
}

/**
 * `2h 05m 09s` style countdown. Hours are dropped below one hour so the
 * remaining seconds stay the most prominent part.
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export function formatCount(value: number, singular: string): string {
  return `${new Intl.NumberFormat(LOCALE).format(value)} ${singular}`;
}
