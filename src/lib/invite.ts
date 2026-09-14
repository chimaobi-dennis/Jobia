// Shared helpers for the invite-link flow: a referrer invites a candidate
// by email; the candidate follows a link back into the app with the
// referral id in the URL, which routes them to signup + that job's
// application form. The pending referral id survives the signup redirect
// via sessionStorage since Supabase auth reloads/redirects can drop query
// params.

const STORAGE_KEY = "jobia:pendingReferralId";

export function buildInviteLink(referralId: string): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("ref", referralId);
  return url.toString();
}

export function readReferralIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref");
}

export function storePendingReferralId(referralId: string): void {
  sessionStorage.setItem(STORAGE_KEY, referralId);
}

export function getPendingReferralId(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearPendingReferralId(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function clearReferralIdFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("ref");
  window.history.replaceState({}, "", url.toString());
}
