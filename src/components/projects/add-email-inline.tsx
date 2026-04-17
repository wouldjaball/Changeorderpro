"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddEmailInlineProps {
  projectId: string;
  existingEmails: string[];
}

export function AddEmailInline({ projectId, existingEmails }: AddEmailInlineProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    if (existingEmails.includes(trimmed)) {
      toast.error("Email already added");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ client_emails: [...existingEmails, trimmed] })
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to add email");
      setSaving(false);
      return;
    }

    toast.success("Email added");
    setEmail("");
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  async function handleRemove(emailToRemove: string) {
    setRemoving(emailToRemove);
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ client_emails: existingEmails.filter((e) => e !== emailToRemove) })
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to remove email");
      setRemoving(null);
      return;
    }

    toast.success("Email removed");
    setRemoving(null);
    router.refresh();
  }

  return (
    <div className="space-y-1">
      {existingEmails.map((e) => (
        <p key={e} className="flex items-center gap-2 group">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="flex-1">{e}</span>
          <button
            type="button"
            onClick={() => handleRemove(e)}
            disabled={removing === e}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            {removing === e ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </button>
        </p>
      ))}
      {open ? (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
          <Input
            type="email"
            placeholder="add@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            required
          />
          <Button type="submit" size="sm" variant="ghost" className="h-8 px-2" disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => { setOpen(false); setEmail(""); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add email
        </button>
      )}
    </div>
  );
}
