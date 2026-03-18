import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

function getClient() {
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }
  return new Anthropic({ apiKey });
}

/**
 * Enhance a rough CO description into a professional, client-facing version.
 */
export async function enhanceDescription(params: {
  description: string;
  title: string;
  projectName?: string;
  pricingType?: string;
}): Promise<string> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You are a professional construction change order writer. Rewrite the following rough description into a clear, professional, client-facing change order description. Keep it concise (2-4 sentences). Do not add information that isn't implied by the original. Use construction industry terminology where appropriate. Do not include pricing or sign-off language.

Title: ${params.title}
${params.projectName ? `Project: ${params.projectName}` : ""}
${params.pricingType ? `Pricing type: ${params.pricingType}` : ""}

Original description:
${params.description}

Rewritten description:`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.text?.trim() || params.description;
}

/**
 * Summarize long field notes into a concise CO description.
 */
export async function summarizeNotes(params: {
  notes: string;
  title: string;
}): Promise<string> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You are a professional construction change order writer. Summarize the following field notes into a concise, professional change order description (2-4 sentences). Focus on the scope of work, reason for the change, and any relevant details. Do not include pricing.

Title: ${params.title}

Field notes:
${params.notes}

Summary:`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.text?.trim() || params.notes;
}

/**
 * Clean up voice-to-text dictation: fix spelling/grammar, rewrite professionally,
 * and extract structured line items — all in one API call.
 */
export async function organizeFromDictation(params: {
  description: string;
  title: string;
  projectName?: string;
  pricingType?: string;
}): Promise<{
  description: string;
  line_items: { description: string; unit: string; quantity: number; item_type: string }[];
}> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a professional construction change order writer. You are cleaning up a voice-to-text dictation from a contractor on a job site.

The input will be messy — expect missing punctuation, spelling errors, run-on sentences, filler words (um, uh, like, you know, so basically, gonna, gotta, wanna), and disorganized thoughts. Your job:

1. DESCRIPTION: Rewrite the dictation into a clear, professional, client-facing change order description. Fix all spelling, punctuation, and grammar. Remove filler words. Keep it concise (2-4 sentences). Use construction industry terminology. Do not add information that isn't implied.

2. LINE ITEMS: Extract discrete work items into structured line items. Each item needs: description (professional wording), unit (e.g., "hours", "each", "sqft", "lf"), quantity (your best estimate, default to 1 if unclear), item_type ("labor", "materials", or "other").

Return ONLY valid JSON in this exact format, no explanation:
{"description": "...", "line_items": [{"description": "...", "unit": "...", "quantity": 1, "item_type": "labor"}]}

Title: ${params.title}
${params.projectName ? `Project: ${params.projectName}` : ""}
${params.pricingType ? `Pricing type: ${params.pricingType}` : ""}

Raw dictation:
${params.description}

JSON:`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock?.text) {
    return { description: params.description, line_items: [] };
  }

  try {
    const cleaned = textBlock.text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleaned);
  } catch {
    return { description: params.description, line_items: [] };
  }
}

/**
 * Suggest line items based on a CO description.
 */
export async function suggestLineItems(params: {
  description: string;
  title: string;
  pricingType: string;
}): Promise<{ description: string; unit: string; quantity: number; item_type: string }[]> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Based on the following construction change order, suggest 2-5 common line items. Return ONLY a JSON array with objects containing: description, unit (e.g., "hours", "each", "sqft", "lf"), quantity (number), item_type ("labor", "materials", or "other"). No explanation, just the JSON array.

Title: ${params.title}
Pricing type: ${params.pricingType}
Description: ${params.description}

JSON:`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock?.text) return [];

  try {
    const cleaned = textBlock.text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
