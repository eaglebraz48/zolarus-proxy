export function incrementReferralCount() {
  const key = "referral_visits";
  const current = parseInt(localStorage.getItem(key) || "0", 10);
  localStorage.setItem(key, (current + 1).toString());
}

export function getReferralCount() {
  return parseInt(localStorage.getItem("referral_visits") || "0", 10);
}
