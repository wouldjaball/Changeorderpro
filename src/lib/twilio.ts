import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(accountSid, authToken);
}

export interface SendSMSParams {
  to: string;
  body: string;
}

export async function sendSMS({ to, body }: SendSMSParams) {
  const client = getClient();
  const message = await client.messages.create({
    to,
    from: fromNumber!,
    body,
  });
  return {
    sid: message.sid,
    status: message.status,
  };
}

// ==========================================
// SMS Templates (from PRD Section 16)
// ==========================================

export function smsApprovalRequest(params: {
  companyName: string;
  coNumber: string;
  projectName: string;
  coTitle: string;
  amount: string;
  approvalLink: string;
}): string {
  return `${params.companyName} sent you Change Order #${params.coNumber} for ${params.projectName}: ${params.coTitle} — $${params.amount}. Reply YES to approve or NO to decline. View details: ${params.approvalLink}`;
}

export function smsTMApprovalRequest(params: {
  companyName: string;
  coNumber: string;
  projectName: string;
  coTitle: string;
  amount: string;
  rate: string;
  approvalLink: string;
}): string {
  return `${params.companyName} sent you Change Order #${params.coNumber} for ${params.projectName}: ${params.coTitle} — Est. $${params.amount} at $${params.rate}/hr + materials. Final invoice reflects actual hours. Reply YES to approve or view: ${params.approvalLink}`;
}

export function smsReminder(params: {
  coNumber: string;
  companyName: string;
  approvalLink: string;
}): string {
  return `Reminder: Change Order #${params.coNumber} from ${params.companyName} is awaiting your approval. Reply YES/NO or view details: ${params.approvalLink}`;
}

export function smsApprovalConfirmation(params: {
  coNumber: string;
  companyName: string;
  clientEmail: string;
  companyPhone: string;
}): string {
  return `Change Order #${params.coNumber} approved. Thank you! ${params.companyName} will send a confirmation to ${params.clientEmail}. Questions? Call ${params.companyPhone}.`;
}

export function smsDeclineAcknowledgment(params: {
  coNumber: string;
  companyName: string;
  companyPhone: string;
}): string {
  return `Change Order #${params.coNumber} declined. Your project manager at ${params.companyName} will follow up shortly. Questions? Call ${params.companyPhone}.`;
}

/**
 * Validate Twilio webhook signature for inbound messages.
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}
