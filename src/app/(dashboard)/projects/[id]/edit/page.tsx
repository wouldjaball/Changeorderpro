"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/types";


export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPhoneSecondary, setClientPhoneSecondary] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);

  useEffect(() => {
    async function loadProject() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Project not found");
        router.push("/projects");
        return;
      }

      const project = data as Project;
      setName(project.name);
      setAddress(project.address || "");
      setClientName(project.client_name || "");
      setClientEmail(project.client_email || "");
      setClientPhone(project.client_phone || "");
      setClientPhoneSecondary(project.client_phone_secondary || "");
      setSmsConsent(project.sms_consent || false);
      setFetching(false);
    }
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("projects")
      .update({
        name,
        address: address || null,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        client_phone_secondary: clientPhoneSecondary || null,
        sms_consent: smsConsent,
        sms_consent_at: smsConsent ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update project: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Project updated");
    router.push(`/projects/${id}`);
    router.refresh();
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" render={<Link href={`/projects/${id}`} />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Project
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
          <CardDescription>
            Update project details and client contact information
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
                      <a href="/privacy" className="underline" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                      </a>{" "}
                      &amp;{" "}
                      <a href="/terms" className="underline" target="_blank" rel="noopener noreferrer">
                        Terms
                      </a>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
