import { describe, it, expect } from "vitest";
import { getClientNotes, latestClientResponse } from "../approval-notes";

describe("getClientNotes", () => {
  it("returns the note when metadata carries one", () => {
    expect(getClientNotes({ metadata: { client_notes: "Too expensive" } })).toBe(
      "Too expensive"
    );
  });

  it("trims surrounding whitespace", () => {
    expect(getClientNotes({ metadata: { client_notes: "  hold off  " } })).toBe(
      "hold off"
    );
  });

  it("returns null when metadata lacks client_notes", () => {
    expect(getClientNotes({ metadata: { timestamp: "2026-01-01" } })).toBeNull();
  });

  it("returns null for empty or whitespace-only notes", () => {
    expect(getClientNotes({ metadata: { client_notes: "" } })).toBeNull();
    expect(getClientNotes({ metadata: { client_notes: "   " } })).toBeNull();
  });

  it("returns null for missing or non-object metadata", () => {
    expect(getClientNotes({})).toBeNull();
    expect(getClientNotes({ metadata: null })).toBeNull();
    expect(getClientNotes({ metadata: "note" })).toBeNull();
  });

  it("returns null when client_notes is not a string", () => {
    expect(getClientNotes({ metadata: { client_notes: 42 } })).toBeNull();
  });
});

describe("latestClientResponse", () => {
  it("returns null when there are no events", () => {
    expect(latestClientResponse([])).toBeNull();
  });

  it("returns null when no event is approved or declined", () => {
    expect(
      latestClientResponse([
        { action: "viewed", created_at: "2026-01-01T00:00:00Z" },
        { action: "reminder_sent", created_at: "2026-01-02T00:00:00Z" },
      ])
    ).toBeNull();
  });

  it("picks the newest decline over an older approve", () => {
    const result = latestClientResponse([
      {
        action: "approved",
        metadata: { client_notes: "looks good" },
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        action: "declined",
        metadata: { client_notes: "changed my mind" },
        created_at: "2026-01-05T00:00:00Z",
      },
      { action: "viewed", created_at: "2026-01-09T00:00:00Z" },
    ]);

    expect(result).toEqual({
      action: "declined",
      notes: "changed my mind",
      created_at: "2026-01-05T00:00:00Z",
    });
  });

  it("returns null notes when the latest response has no client note", () => {
    const result = latestClientResponse([
      {
        action: "declined",
        metadata: { client_notes: "too pricey" },
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        action: "approved",
        metadata: { timestamp: "2026-01-06T00:00:00Z" },
        created_at: "2026-01-06T00:00:00Z",
      },
    ]);

    expect(result?.action).toBe("approved");
    expect(result?.notes).toBeNull();
  });

  it("treats whitespace-only notes as no note", () => {
    const result = latestClientResponse([
      {
        action: "declined",
        metadata: { client_notes: "   " },
        created_at: "2026-02-01T00:00:00Z",
      },
    ]);

    expect(result?.notes).toBeNull();
  });
});
