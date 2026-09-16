// ==========================================
// SMS message composition
//
// SMS is not sent by this app — sends are handed off to the contractor's own
// phone via an `sms:` link (see src/components/co/send-dialog.tsx), which
// opens their native texting app with the message pre-filled for them to
// send themselves. These are just the plain-text templates for that body.
// ==========================================

export function smsApprovalRequest(params: {
  companyName: string;
  coNumber: string;
  projectName: string;
  coTitle: string;
  amount: string;
  approvalLink: string;
}): string {
  return `${params.companyName} sent you Change Order #${params.coNumber} for ${params.projectName}: ${params.coTitle} — $${params.amount}. Review & approve: ${params.approvalLink}`;
}

export function smsTMApprovalRequest(params: {
  companyName: string;
  coNumber: string;
  projectName: string;
  coTitle: string;
  amount: string;
  rate?: string | null;
  approvalLink: string;
}): string {
  const pricing = params.rate
    ? `Est. $${params.amount} at $${params.rate}/hr + materials`
    : `Est. $${params.amount}, time & materials`;
  return `${params.companyName} sent you Change Order #${params.coNumber} for ${params.projectName}: ${params.coTitle} — ${pricing}. Final invoice reflects actual hours. Review & approve: ${params.approvalLink}`;
}

export function smsReminder(params: {
  coNumber: string;
  companyName: string;
  approvalLink: string;
}): string {
  return `Reminder: Change Order #${params.coNumber} from ${params.companyName} is awaiting your approval. Review & approve: ${params.approvalLink}`;
}
