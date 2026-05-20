"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  DollarSign,
  AlertTriangle,
  Wand2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { PricingType, LineItemType } from "@/types";

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  item_type: LineItemType;
}

export default function EditChangeOrderPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [coStatus, setCoStatus] = useState("");
  const [coNumber, setCoNumber] = useState("");
  const [projectName, setProjectName] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("fixed");
  const [fixedAmount, setFixedAmount] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [useCents, setUseCents] = useState(false);

  useEffect(() => {
    async function loadCO() {
      const { data: co, error } = await supabase
        .from("change_orders")
        .select("*, project:projects(name)")
        .eq("id", id)
        .single();

      if (error || !co) {
        toast.error("Change order not found");
        router.push("/");
        return;
      }

      if (!["draft", "sent", "declined"].includes(co.status)) {
        toast.error("This change order cannot be edited");
        router.push(`/change-orders/${id}`);
        return;
      }

      setCoStatus(co.status);
      setCoNumber(co.co_number);
      setTitle(co.title);
      setDescription(co.description || "");
      setPricingType(co.pricing_type);
      setFixedAmount(co.fixed_amount ? String(co.fixed_amount) : "");
      setInternalNotes(co.internal_notes || "");

      const project = co.project && !Array.isArray(co.project) ? co.project : null;
      setProjectName(project?.name || "Unknown Project");

      const { data: items } = await supabase
        .from("co_line_items")
        .select("*")
        .eq("change_order_id", id)
        .order("sort_order");

      if (items && items.length > 0) {
        const hasCents = items.some(
          (item) => Number(item.rate) % 1 !== 0 || Number(item.amount) % 1 !== 0
        );
        if (hasCents || (co.fixed_amount && Number(co.fixed_amount) % 1 !== 0)) {
          setUseCents(true);
        }
        setLineItems(
          items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            rate: Number(item.rate) || 0,
            item_type: item.item_type as LineItemType,
          }))
        );
      }

      setPageLoading(false);
    }
    loadCO();
  }, [id, supabase, router]);

  function addLineItem() {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unit: "hours", rate: 20, item_type: "labor" },
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
    return (Number(fixedAmount) || 0) + lineTotal;
  }

  async function handleAIOrganize() {
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
          mode: "organize",
          description,
          title,
          projectName,
          pricingType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setDescription(data.result);
        if (pricingType !== "fixed" && data.items?.length) {
          const newItems: LineItem[] = data.items.map((item: { description: string; unit: string; quantity: number; item_type: string }) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unit: item.unit || "hours",
            rate: 20,
            item_type: (item.item_type as LineItemType) || "labor",
          }));
          setLineItems([...lineItems, ...newItems]);
          toast.success(`Cleaned up description and added ${newItems.length} items`);
        } else {
          toast.success("Description cleaned up");
        }
      } else {
        toast.error(data.error || "AI cleanup failed");
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
          rate: 20,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/co/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          pricing_type: pricingType,
          fixed_amount: pricingType !== "tm" ? Number(fixedAmount) || null : null,
          internal_notes: internalNotes || null,
          line_items: pricingType !== "fixed" ? lineItems : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save changes");
        setLoading(false);
        return;
      }

      toast.success("Change order updated");
      router.push(`/change-orders/${id}`);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Button variant="ghost" size="sm" render={<Link href={`/change-orders/${id}`} />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {coStatus === "sent" && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            This change order has been sent to the client. Saving changes will
            reset it to Draft and invalidate the current approval link. You can
            re-send it after editing.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit {coNumber}</CardTitle>
            <CardDescription>
              {projectName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Change order title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Work description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              {description.trim().length > 10 && title.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAIOrganize}
                  disabled={aiLoading}
                  className="text-sm"
                >
                  {aiLoading ? (
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="mr-1.5 h-3 w-3" />
                  )}
                  AI Clean Up
                  <span className="ml-1 text-muted-foreground font-normal">
                    Fix spelling &amp; organize
                  </span>
                </Button>
              )}
            </div>

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

              {pricingType !== "tm" && (
                <div className="space-y-2">
                  <Label htmlFor="fixedAmount">
                    {pricingType === "hybrid" ? "Fixed portion" : "Amount"} *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fixedAmount"
                      type="number"
                      step={useCents ? "0.01" : "1"}
                      min="0"
                      placeholder={useCents ? "0.00" : "0"}
                      className="pl-9"
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(e.target.value)}
                      required={pricingType === "fixed"}
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCents}
                      onChange={(e) => setUseCents(e.target.checked)}
                      className="rounded"
                    />
                    Include cents
                  </label>
                </div>
              )}

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
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Select
                          value={item.item_type}
                          onValueChange={(v) =>
                            updateLineItem(i, { item_type: v as LineItemType })
                          }
                        >
                          <SelectTrigger className="w-28 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="materials">Materials</SelectItem>
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
                          updateLineItem(i, { description: e.target.value })
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
                              updateLineItem(i, { quantity: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Rate ($)</Label>
                          <Input
                            type="number"
                            step={useCents ? "0.01" : "1"}
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              updateLineItem(i, { rate: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Total</Label>
                          <Input
                            value={`$${useCents ? (item.quantity * item.rate).toFixed(2) : Math.round(item.quantity * item.rate).toLocaleString()}`}
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

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">
                  ${calculateTotal().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal notes (not sent to client)</Label>
              <Textarea
                id="notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading || !title}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
