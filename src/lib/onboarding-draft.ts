export type OnboardingDraft = {
  companyId: string;
  companyName: string;
  website: string;
  logoUrl: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  hourlyRate: string;
  phone: string;
  savedAt: string;
};

const DRAFT_KEY = "co-pro-onboarding-draft";
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function saveOnboardingDraft(draft: Omit<OnboardingDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() })
    );
  } catch {}
}

export function loadOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as OnboardingDraft;
    if (Date.now() - new Date(draft.savedAt).getTime() > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function isOnboardingDraftComplete(draft: OnboardingDraft): boolean {
  return (
    draft.companyName.trim().length > 0 &&
    draft.addressStreet.trim().length > 0 &&
    draft.addressCity.trim().length > 0 &&
    draft.addressState.trim().length > 0 &&
    draft.addressZip.trim().length > 0 &&
    Number(draft.hourlyRate) > 0 &&
    draft.phone.replace(/\D/g, "").length === 10
  );
}
