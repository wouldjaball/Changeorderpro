"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Camera,
  DollarSign,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Project, PricingType, LineItemType } from "@/types";

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  item_type: LineItemType;
}

export default function NewChangeOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Form state
  const [projectId, setProjectId] = useState(
    searchParams.get("project") || ""
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("fixed");
  const [fixedAmount, setFixedAmount] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Load projects
  useEffect(() => {
    async function loadProjects() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return;

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("status", "active")
        .order("name");

      if (data) setProjects(data as Project[]);
    }
    loadProjects();
  }, [supabase]);

  function addLineItem() {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unit: "hours", rate: 0, item_type: "labor" },
    ]);
  }

  function updateLineItem(index: number, updates: Partial<LineItem>) {
    setLineItems(
      lineItems.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function calculateTotal(): number {
    if (pricingType === "fixed") return Number(fixedAmount) || 0;
    const lineTotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    if (pricingType === "tm") return lineTotal;
    return (Number(fixedAmount) || 0) + lineTotal; // hybrid
  }

  async function handleAIEnhance() {
    if (!description.trim() || !title.trim()) {
      toast.error("Enter a title and description first");
      return;
    }
    setAiLoading(true);
    try {
      const selectedProject = projects.find((p) => p.id === projectId);
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "enhance",
          description,
          title,
          projectName: selectedProject?.name,
          pricingType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setDescription(data.result);
        toast.success("Description enhanced");
      } else {
        toast.error(data.error || "AI enhancement failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAISuggestItems() {
    if (!description.trim() || !title.trim()) {
      toast.error("Enter a title and description first");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "line-items",
          description,
          title,
          pricingType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.items?.length) {
        const newItems: LineItem[] = data.items.map((item: { description: string; unit: string; quantity: number; item_type: string }) => ({
          description: item.description,
          quantity: item.quantity || 1,
          unit: item.unit || "hours",
          rate: 0,
          item_type: (item.item_type as LineItemType) || "labor",
        }));
        setLineItems([...lineItems, ...newItems]);
        toast.success(`Added ${newItems.length} suggested items`);
      } else {
        toast.error(data.error || "No suggestions available");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAiLoading(false);
    }
  }

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 10) {
      toast.error("Maximum 10 photos per change order");
      return;
    }
    setPhotos([...photos, ...files]);
  }

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

    const companyId = profile!.company_id!;

    // Generate CO number via RPC
    const { data: coNumber } = await supabase.rpc("generate_co_number", {
      p_company_id: companyId,
    });

    // Create the change order (generate ID client-side to avoid SELECT RLS issue)
    const coId = crypto.randomUUID();
    const { error: coError } = await supabase
      .from("change_orders")
      .insert({
        id: coId,
        company_id: companyId,
        project_id: projectId,
        co_number: coNumber || `CO-${Date.now()}`,
        title,
        description: description || null,
        pricing_type: pricingType,
        fixed_amount:
          pricingType !== "tm" ? Number(fixedAmount) || null : null,
        total_amount: calculateTotal(),
        internal_notes: internalNotes || null,
        created_by: user!.id,
      });

    if (coError) {
      toast.error("Failed to create change order: " + coError.message);
      setLoading(false);
      return;
    }

    // Insert line items
    if (lineItems.length > 0 && pricingType !== "fixed") {
      const { error: lineError } = await supabase.from("co_line_items").insert(
        lineItems.map((item, i) => ({
          change_order_id: coId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.quantity * item.rate,
          item_type: item.item_type,
          sort_order: i,
        }))
      );
      if (lineError) {
        toast.error("Warning: line items failed to save");
      }
    }

    // Upload photos
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const ext = file.name.split(".").pop();
      const path = `${companyId}/${coId}/${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("co-photos")
        .upload(path, file);

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("co-photos").getPublicUrl(path);

        await supabase.from("co_photos").insert({
          change_order_id: coId,
          original_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          sort_order: i,
        });
      }
    }

    toast.success("Change order created");
    router.push(`/change-orders/${coId}`);
    router.refresh();
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Button variant="ghost" size="sm" render={<Link href="/" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
      </Button>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>New Change Order</CardTitle>
            <CardDescription>
              Create and send a change order in under 60 seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project selection */}
            <div className="space-y-2">
              <Label>Project *</Label>
              {projects.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-base text-muted-foreground">
                  <p>No projects yet. Create one first.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    render={<Link href="/projects/new" />}
                  >
                    <Plus className="mr-1.5 h-3 w-3" />
                    New Project
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
                    <SelectTrigger className="flex-1">
                      <span className="flex flex-1 text-left line-clamp-1 text-base">
                        {projectId
                          ? projects.find((p) => p.id === projectId)?.name ?? "Select a project"
                          : <span className="text-muted-foreground">Select a project</span>}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    render={<Link href="/projects/new" />}
                    title="New project"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Change order title *</Label>
              <Input
                id="title"
                placeholder="Replace bathroom tile"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Work description</Label>
              <Textarea
                id="description"
                placeholder="Describe the change in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              {description.trim().length > 10 && title.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAIEnhance}
                  disabled={aiLoading}
                  className="text-sm"
                >
                  {aiLoading ? (
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3 w-3" />
                  )}
                  Enhance with AI
                </Button>
              )}
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <Label>Pricing type *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["fixed", "tm", "hybrid"] as PricingType[]).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={pricingType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPricingType(type)}
                    className="text-sm"
                  >
                    {type === "fixed"
                      ? "Fixed Price"
                      : type === "tm"
                        ? "T&M"
                        : "Hybrid"}
                  </Button>
                ))}
              </div>

              {/* Fixed price input */}
              {pricingType !== "tm" && (
                <div className="space-y-2">
                  <Label htmlFor="fixedAmount">
                    {pricingType === "hybrid"
                      ? "Fixed portion"
                      : "Amount"}{" "}
                    *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fixedAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-9"
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(e.target.value)}
                      required={pricingType === "fixed"}
                    />
                  </div>
                </div>
              )}

              {/* T&M line items */}
              {pricingType !== "fixed" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Line Items</Label>
                    <div className="flex gap-1.5">
                      {description.trim().length > 10 && title.trim() && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAISuggestItems}
                          disabled={aiLoading}
                          className="text-sm"
                        >
                          {aiLoading ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="mr-1 h-3 w-3" />
                          )}
                          AI Suggest
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLineItem}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Item
                      </Button>
                    </div>
                  </div>

                  {lineItems.map((item, i) => (
                    <div
                      key={i}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Select
                          value={item.item_type}
                          onValueChange={(v) =>
                            updateLineItem(i, {
                              item_type: v as LineItemType,
                            })
                          }
                        >
                          <SelectTrigger className="w-28 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="materials">
                              Materials
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeLineItem(i)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(i, {
                            description: e.target.value,
                          })
                        }
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-sm">Qty</Label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(i, {
                                quantity: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Rate ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              updateLineItem(i, {
                                rate: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Total</Label>
                          <Input
                            value={`$${(item.quantity * item.rate).toFixed(2)}`}
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {lineItems.length === 0 && (
                    <p className="text-base text-muted-foreground text-center py-3">
                      Add line items for time & materials
                    </p>
                  )}
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">
                  ${calculateTotal().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Photo attach */}
            <div className="space-y-2">
              <Label>Photos ({photos.length}/10)</Label>
              <div className="flex gap-2 flex-wrap">
                {photos.map((photo, i) => (
                  <div
                    key={i}
                    className="relative h-16 w-16 rounded-lg border overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos(photos.filter((_, j) => j !== i))
                      }
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 10 && (
                  <label className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed cursor-pointer hover:bg-accent transition-colors">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoCapture}
                      multiple
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Internal notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Internal notes (not sent to client)</Label>
              <Textarea
                id="notes"
                placeholder="Notes for your team only..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading || !projectId || !title}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save as Draft
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
