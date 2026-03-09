"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import type { Company, CompanySettings } from "@/types";

interface SettingsFormProps {
  company: Company;
}

export function SettingsForm({ company }: SettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Company info
  const [name, setName] = useState(company.name);
  const [phone, setPhone] = useState(company.phone || "");
  const [tradeType, setTradeType] = useState(company.trade_type || "");
  const [addressStreet, setAddressStreet] = useState(company.address_street || "");
  const [addressCity, setAddressCity] = useState(company.address_city || "");
  const [addressState, setAddressState] = useState(company.address_state || "");
  const [addressZip, setAddressZip] = useState(company.address_zip || "");

  // Settings
  const settings = company.settings || {} as CompanySettings;
  const [approvalMethod, setApprovalMethod] = useState<string>(settings.default_approval_method || "link");
  const [reminderHours, setReminderHours] = useState(String(settings.reminder_hours || 24));
  const [coPrefix, setCoPrefix] = useState(settings.co_prefix || "CO");
  const [laborRate, setLaborRate] = useState(
    settings.default_labor_rate ? String(settings.default_labor_rate) : ""
  );
  const [termsText, setTermsText] = useState(settings.terms_text || "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const updatedSettings: CompanySettings = {
      default_approval_method: approvalMethod as CompanySettings["default_approval_method"],
      reminder_hours: Number(reminderHours) || 24,
      co_prefix: coPrefix || "CO",
      co_sequence_start: settings.co_sequence_start || 1,
      default_labor_rate: laborRate ? Number(laborRate) : null,
      terms_text: termsText || null,
    };

    const { error } = await supabase
      .from("companies")
      .update({
        name,
        phone: phone || null,
        trade_type: tradeType || null,
        address_street: addressStreet || null,
        address_city: addressCity || null,
        address_state: addressState || null,
        address_zip: addressZip || null,
        settings: updatedSettings,
      })
      .eq("id", company.id);

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Settings saved");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Company info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
          <CardDescription className="text-xs">
            This appears on PDFs and emails sent to clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name *</Label>
            <Input
              id="companyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade">Trade type</Label>
              <Input
                id="trade"
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value)}
                placeholder="General Contractor"
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="street">Street address</Label>
            <Input
              id="street"
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={addressZip}
                onChange={(e) => setAddressZip(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CO Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Order Defaults</CardTitle>
          <CardDescription className="text-xs">
            Default settings for new change orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="coPrefix">CO number prefix</Label>
              <Input
                id="coPrefix"
                value={coPrefix}
                onChange={(e) => setCoPrefix(e.target.value)}
                placeholder="CO"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laborRate">Default labor rate ($/hr)</Label>
              <Input
                id="laborRate"
                type="number"
                step="0.01"
                min="0"
                value={laborRate}
                onChange={(e) => setLaborRate(e.target.value)}
                placeholder="85.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Default approval method</Label>
            <select
              value={approvalMethod}
              onChange={(e) => setApprovalMethod(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="both">SMS + Email</option>
              <option value="sms">SMS Only</option>
              <option value="email">Email Only</option>
              <option value="link">Link Only</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminderHours">Reminder window (hours)</Label>
            <Input
              id="reminderHours"
              type="number"
              min="1"
              max="168"
              value={reminderHours}
              onChange={(e) => setReminderHours(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Send first reminder this many hours after sending CO
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Terms & Conditions</CardTitle>
          <CardDescription className="text-xs">
            Shown on PDFs and the public approval page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            rows={5}
            placeholder="Enter your standard terms and conditions..."
          />
        </CardContent>
      </Card>

      {/* Save */}
      <Button type="submit" className="w-full h-12" disabled={loading || !name}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Settings
      </Button>
    </form>
  );
}
