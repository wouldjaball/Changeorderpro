"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";
import { SampleChangeOrder } from "@/components/onboarding/sample-change-order";
import {
  loadOnboardingDraft,
  clearOnboardingDraft,
  isOnboardingDraftComplete,
} from "@/lib/onboarding-draft";
import type { CompanySettings } from "@/types";

type StepKey = "name" | "website" | "address" | "rate" | "phone";

const STEP_ORDER: StepKey[] = ["name", "website", "address", "rate", "phone"];

export default function CompanySetupPage() {
  const router = useRouter();
  const supabase = createClient();

  // Picks up where /signup left off when email confirmation was required
  // and the wizard's answers were stashed before the redirect.
  const [draft] = useState(() => loadOnboardingDraft());
  const draftComplete = draft ? isOnboardingDraftComplete(draft) : false;

  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(() => draftComplete);
  const [launched, setLaunched] = useState(false);

  // A stable id generated up front so a logo can be uploaded to storage
  // before the company row exists — reused from the draft so it matches
  // whatever logo was already scraped/uploaded under it.
  const [companyId] = useState(() => draft?.companyId ?? crypto.randomUUID());

  const [companyName, setCompanyName] = useState(draft?.companyName ?? "");
  const [website, setWebsite] = useState(draft?.website ?? "");
  const [logoUrl, setLogoUrl] = useState(draft?.logoUrl ?? "");
  const [scrapingLogo, setScrapingLogo] = useState(false);
  const [addressStreet, setAddressStreet] = useState(draft?.addressStreet ?? "");
  const [addressCity, setAddressCity] = useState(draft?.addressCity ?? "");
  const [addressState, setAddressState] = useState(draft?.addressState ?? "");
  const [addressZip, setAddressZip] = useState(draft?.addressZip ?? "");
  const [hourlyRate, setHourlyRate] = useState(draft?.hourlyRate ?? "");
  const [phone, setPhone] = useState(draft?.phone ?? "");

  const step = STEP_ORDER[stepIndex];

  useEffect(() => {
    if (!launched) return;
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    const t1 = setTimeout(
      () => confetti({ particleCount: 60, spread: 70, origin: { x: 0.2, y: 0.4 } }),
      250
    );
    const t2 = setTimeout(
      () => confetti({ particleCount: 60, spread: 70, origin: { x: 0.8, y: 0.4 } }),
      400
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [launched]);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeWebsite(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  async function tryFindLogo() {
    setScrapingLogo(true);
    try {
      const res = await fetch("/api/onboarding/scrape-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, companyId }),
      });
      const data = await res.json().catch(() => ({ logoUrl: null }));
      if (data.logoUrl) {
        setLogoUrl(data.logoUrl);
      } else {
        toast("We couldn't find a logo on your site automatically", {
          description: "No problem — you can add one anytime in Settings.",
        });
      }
    } catch {
      toast("We couldn't find a logo on your site automatically", {
        description: "No problem — you can add one anytime in Settings.",
      });
    } finally {
      setScrapingLogo(false);
    }
  }

  function canContinue(): boolean {
    switch (step) {
      case "name":
        return companyName.trim().length > 0;
      case "website":
        return true;
      case "address":
        return (
          addressStreet.trim().length > 0 &&
          addressCity.trim().length > 0 &&
          addressState.trim().length > 0 &&
          addressZip.trim().length > 0
        );
      case "rate":
        return Number(hourlyRate) > 0;
      case "phone":
        return phone.replace(/\D/g, "").length === 10;
      default:
        return true;
    }
  }

  async function goNext() {
    if (step === "website" && website.trim()) {
      await tryFindLogo();
    }
    setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleCreate() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      router.push("/login");
      return;
    }

    const slug = generateSlug(companyName) + "-" + Date.now().toString(36);
    const settings: CompanySettings = {
      default_approval_method: "link",
      reminder_hours: 24,
      co_prefix: "CO",
      co_sequence_start: 1,
      default_labor_rate: Number(hourlyRate),
      terms_text: null,
      brand_color: null,
    };

    const { error: companyError } = await supabase.from("companies").insert({
      id: companyId,
      name: companyName,
      slug,
      phone: phone || null,
      website: normalizeWebsite(website) || null,
      logo_url: logoUrl || null,
      address_street: addressStreet || null,
      address_city: addressCity || null,
      address_state: addressState || null,
      address_zip: addressZip || null,
      settings,
    });

    if (companyError) {
      toast.error("Failed to create company: " + companyError.message);
      setLoading(false);
      return;
    }

    const { error: userError } = await supabase
      .from("users")
      .update({ company_id: companyId, role: "admin" })
      .eq("id", user.id);

    if (userError) {
      toast.error("Failed to link account: " + userError.message);
      setLoading(false);
      return;
    }

    clearOnboardingDraft();
    setLoading(false);
    setLaunched(true);
  }

  useEffect(() => {
    if (!draftComplete) return;
    handleCreate();
    // Auto-finish once, using the answers already collected in /signup —
    // no need to make them click through the wizard again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (draftComplete && loading && !launched) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Finishing setup for {companyName}...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (launched) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <PartyPopper className="h-10 w-10 mx-auto text-primary mb-1" />
          <CardTitle className="text-xl">You&apos;re all set up!</CardTitle>
          <CardDescription>
            Here&apos;s an example change order from {companyName}, so you know
            what your clients will see.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SampleChangeOrder
            companyName={companyName}
            logoUrl={logoUrl}
            addressStreet={addressStreet}
            addressCity={addressCity}
            addressState={addressState}
            addressZip={addressZip}
            phone={phone}
            hourlyRate={hourlyRate}
          />
          <Button
            className="w-full h-12"
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          >
            Go to my dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="mb-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%`,
            }}
          />
        </div>
        {step === "name" && (
          <>
            <p className="text-sm font-medium text-primary mb-1">
              Start your free trial
            </p>
            <CardTitle>What&apos;s the name of your company?</CardTitle>
            <CardDescription>
              This is what will appear on your change orders.
            </CardDescription>
          </>
        )}
        {step === "website" && (
          <>
            <CardTitle>Do you have a website?</CardTitle>
            <CardDescription>
              Strongly suggested if you have one — we&apos;ll try to pull your
              logo from it automatically. If not, no problem, just skip this.
            </CardDescription>
          </>
        )}
        {step === "address" && (
          <>
            <CardTitle>Where&apos;s your business located?</CardTitle>
            <CardDescription>
              Necessary for a professional looking change order.
            </CardDescription>
          </>
        )}
        {step === "rate" && (
          <>
            <CardTitle>What&apos;s your hourly rate?</CardTitle>
            <CardDescription>
              This can be changed any time. If you send an hourly proposal,
              this is the rate we&apos;ll use.
            </CardDescription>
          </>
        )}
        {step === "phone" && (
          <>
            <CardTitle>Best number to reach you?</CardTitle>
            <CardDescription>
              This is where someone can contact you regarding this change
              order.
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "name" && (
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name *</Label>
            <Input
              id="companyName"
              placeholder="Smith Construction LLC"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
              required
            />
          </div>
        )}

        {step === "website" && (
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="text"
              placeholder="yourcompany.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {step === "address" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street address *</Label>
              <Input
                id="street"
                placeholder="123 Main St"
                value={addressStreet}
                onChange={(e) => setAddressStreet(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Austin"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="TX"
                  maxLength={2}
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP code *</Label>
              <Input
                id="zip"
                placeholder="78701"
                value={addressZip}
                onChange={(e) => setAddressZip(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === "rate" && (
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly rate ($/hr) *</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              placeholder="85.00"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {step === "phone" && (
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {stepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={goBack}
              disabled={loading || scrapingLogo}
            >
              Back
            </Button>
          )}
          {step === "phone" ? (
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={loading || !canContinue()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start my free trial
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={goNext}
              disabled={!canContinue() || scrapingLogo}
            >
              {scrapingLogo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {scrapingLogo
                ? "Looking for your logo..."
                : step === "website" && !website
                  ? "Skip"
                  : "Continue"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
