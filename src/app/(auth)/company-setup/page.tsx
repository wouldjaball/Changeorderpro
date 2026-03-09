"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Building2, MapPin, Rocket } from "lucide-react";

const TRADE_TYPES = [
  "General Contractor",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Roofing",
  "Painting",
  "Landscaping",
  "Flooring",
  "Remodeling",
  "Other",
];

const STEPS = [
  { title: "Company Info", icon: Building2 },
  { title: "Address", icon: MapPin },
  { title: "Launch", icon: Rocket },
];

export default function CompanySetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [phone, setPhone] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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

    // Create the company (generate ID client-side to avoid SELECT RLS issue)
    const companyId = crypto.randomUUID();
    const slug = generateSlug(companyName) + "-" + Date.now().toString(36);
    const { error: companyError } = await supabase
      .from("companies")
      .insert({
        id: companyId,
        name: companyName,
        slug,
        trade_type: tradeType || null,
        phone: phone || null,
        address_street: addressStreet || null,
        address_city: addressCity || null,
        address_state: addressState || null,
        address_zip: addressZip || null,
      });

    if (companyError) {
      toast.error("Failed to create company: " + companyError.message);
      setLoading(false);
      return;
    }

    // Link user to company as admin
    const { error: userError } = await supabase
      .from("users")
      .update({ company_id: companyId, role: "admin" })
      .eq("id", user.id);

    if (userError) {
      toast.error("Failed to link account: " + userError.message);
      setLoading(false);
      return;
    }

    toast.success("Company created! Welcome to ChangeOrder Pro.");
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-1">
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-8 ${
                      i < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <CardTitle>{STEPS[step].title}</CardTitle>
        <CardDescription>
          {step === 0 && "Tell us about your company"}
          {step === 1 && "Where is your company located? (Optional)"}
          {step === 2 && "Review and launch your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name *</Label>
              <Input
                id="companyName"
                placeholder="Smith Construction LLC"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeType">Trade / Industry</Label>
              <Select value={tradeType} onValueChange={(v) => setTradeType(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your trade" />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_TYPES.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => setStep(1)}
              disabled={!companyName}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street address</Label>
              <Input
                id="street"
                placeholder="123 Main St"
                value={addressStreet}
                onChange={(e) => setAddressStreet(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Austin"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
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
              <Label htmlFor="zip">ZIP code</Label>
              <Input
                id="zip"
                placeholder="78701"
                value={addressZip}
                onChange={(e) => setAddressZip(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(0)}
              >
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{companyName}</span>
              </div>
              {tradeType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trade</span>
                  <span>{tradeType}</span>
                </div>
              )}
              {phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{phone}</span>
                </div>
              )}
              {addressCity && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>
                    {addressCity}
                    {addressState ? `, ${addressState}` : ""}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="text-green-600 font-medium">
                  14-day free trial
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Launch my account
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
