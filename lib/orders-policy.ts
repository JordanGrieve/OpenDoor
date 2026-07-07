// Shared order policy rules.

/** Customers may cancel a pending/confirmed order within 12 hours of placing it. */
export function isCancellable(status: string, createdAt: string): boolean {
  if (!["pending", "confirmed"].includes(status)) return false;
  const hours = (Date.now() - new Date(createdAt).getTime()) / 36e5;
  return hours <= 12;
}
