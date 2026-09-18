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
  coTitle: string;
  approvalLink: string;
}): string {
  return `${params.companyName} is sending you a change order for approval.\n\nCO #${params.coNumber}: ${params.coTitle}\n\nPlease open the link to review, then approve or decline:\n${params.approvalLink}`;
}

export function smsReminder(params: {
  coNumber: string;
  companyName: string;
  approvalLink: string;
}): string {
  return `Reminder: Change Order #${params.coNumber} from ${params.companyName} is awaiting your approval. Review & approve: ${params.approvalLink}`;
}
