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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPhoneSecondary, setClientPhoneSecondary] = useState("");
  const [clientEmails, setClientEmails] = useState<string[]>([]);
  const [smsConsent, setSmsConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user!.id)
      .single();

    const { error } = await supabase.from("projects").insert({
      company_id: profile!.company_id!,
      name,
      address: address || null,
      client_name: clientName || null,
      client_email: clientEmail || null,
      client_emails: clientEmails.filter((e) => e.trim()),
      client_phone: clientPhone || null,
      client_phone_secondary: clientPhoneSecondary || null,
      sms_consent: smsConsent,
      sms_consent_at: smsConsent ? new Date().toISOString() : null,
      created_by: user!.id,
    });

    if (error) {
      toast.error("Failed to create project: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Project created");
    router.push("/projects");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" render={<Link href="/projects" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>
            Add a job or project to create change orders against
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project / Job name *</Label>
              <Input
                id="name"
                placeholder="Kitchen Remodel — 123 Oak St"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Job site address</Label>
              <Input
                id="address"
                placeholder="123 Oak St, Austin, TX 78701"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3">Client Contact Info</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client name</Label>
                  <Input
                    id="clientName"
                    placeholder="Jane Doe"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="jane@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                {clientEmails.map((ce, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="space-y-2 flex-1">
                      {i === 0 && <Label>Additional emails</Label>}
                      <Input
                        type="email"
                        placeholder="another@example.com"
                        value={ce}
                        onChange={(e) => {
                          const next = [...clientEmails];
                          next[i] = e.target.value;
                          setClientEmails(next);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setClientEmails(clientEmails.filter((_, j) => j !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setClientEmails([...clientEmails, ""])}
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Add email
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client phone</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhoneSecondary">Secondary phone</Label>
                  <Input
                    id="clientPhoneSecondary"
                    type="tel"
                    placeholder="(555) 987-6543"
                    value={clientPhoneSecondary}
                    onChange={(e) => setClientPhoneSecondary(e.target.value)}
                  />
                </div>

                {/* SMS Opt-In Consent */}
                {clientPhone.trim() && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsConsent}
                        onChange={(e) => setSmsConsent(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm leading-snug">
                        The client has agreed to receive SMS messages from ChangeOrder Pro
                        regarding change order approvals for this project.
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                      By checking this box, you confirm the client consented to receive
                      transactional SMS messages including change order approval requests
                      and reminders. Msg frequency varies (1–4 per change order). Msg &amp; data
                      rates may apply. Reply STOP to opt out, HELP for help.{" "}
                      <Link href="/privacy" className="underline" target="_blank">
                        Privacy Policy
                      </Link>{" "}
                      &amp;{" "}
                      <Link href="/terms" className="underline" target="_blank">
                        Terms
                      </Link>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
