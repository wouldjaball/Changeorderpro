import type { ApprovalEventMetadata } from "@/types";

export interface ApprovalEventLike {
  action: string;
  metadata?: unknown;
  created_at: string;
}

export function getClientNotes(event: { metadata?: unknown }): string | null {
  const metadata = event.metadata;
  if (!metadata || typeof metadata !== "object") return null;

  const notes = (metadata as ApprovalEventMetadata).client_notes;
  if (typeof notes !== "string") return null;

  const trimmed = notes.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function latestClientResponse(events: ApprovalEventLike[]): {
  action: "approved" | "declined";
  notes: string | null;
  created_at: string;
} | null {
  let latest: ApprovalEventLike | null = null;

  for (const event of events) {
    if (event.action !== "approved" && event.action !== "declined") continue;
    if (
      !latest ||
      new Date(event.created_at).getTime() >
        new Date(latest.created_at).getTime()
    ) {
      latest = event;
    }
  }

  if (!latest) return null;

  return {
    action: latest.action as "approved" | "declined",
    notes: getClientNotes(latest),
    created_at: latest.created_at,
  };
}
