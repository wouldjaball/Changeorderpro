import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@changeorderpro.com";

function getClient() {
  if (!apiKey) {
    console.error(
      "[resend] RESEND_API_KEY is not set — email delivery is disabled. " +
        "Set RESEND_API_KEY and RESEND_FROM_EMAIL in the environment."
    );
    throw new Error("Resend API key not configured");
  }
  return new Resend(apiKey);
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  const resend = getClient();
  const { data, error } = await resend.emails.send({
    from: `ChangeOrder Pro <${fromEmail}>`,
    to,
    subject,
    html,
    replyTo,
  });

  if (error) {
    console.error("[resend] send failed", {
      to,
      subject,
      from: fromEmail,
      error: error.message,
      name: error.name,
    });
    throw new Error(`Resend error: ${error.message}`);
  }

  return { id: data?.id };
}

// ==========================================
// Email HTML Templates
// ==========================================

export function emailApprovalRequest(params: {
  companyName: string;
  companyLogo?: string;
  coNumber: string;
  projectName: string;
  coTitle: string;
  description?: string;
  amount: string;
  pricingType: string;
  approvalLink: string;
  photoUrls?: string[];
}): { subject: string; html: string } {
  const subject = `Change Order #${params.coNumber} from ${params.companyName} — ${params.coTitle}`;

  const photoSection =
    params.photoUrls && params.photoUrls.length > 0
      ? `
    <div style="margin: 20px 0;">
      <p style="font-size: 14px; color: #666; margin-bottom: 8px;">Photos attached:</p>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${params.photoUrls.map((url) => `<img src="${url}" alt="CO Photo" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e5e5;" />`).join("")}
      </div>
    </div>`
      : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${params.companyLogo ? `<img src="${params.companyLogo}" alt="${params.companyName}" style="height: 40px; margin-bottom: 20px;" />` : `<h2 style="margin: 0 0 20px; color: #1a1a1a;">${params.companyName}</h2>`}

      <p style="font-size: 16px; color: #333; margin: 0 0 8px;">You've received a change order for review:</p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666; font-size: 14px;">Change Order</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">#${params.coNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666; font-size: 14px;">Project</td>
            <td style="padding: 6px 0; text-align: right;">${params.projectName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666; font-size: 14px;">Title</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">${params.coTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666; font-size: 14px;">Type</td>
            <td style="padding: 6px 0; text-align: right;">${params.pricingType === "fixed" ? "Fixed Price" : params.pricingType === "tm" ? "Time & Materials" : "Hybrid"}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e5e5;">
            <td style="padding: 12px 0 6px; font-size: 16px; font-weight: 700;">Total</td>
            <td style="padding: 12px 0 6px; text-align: right; font-size: 20px; font-weight: 700; color: #1a1a1a;">$${params.amount}</td>
          </tr>
        </table>
      </div>

      ${params.description ? `<div style="margin: 16px 0;"><p style="font-size: 14px; color: #666; margin: 0 0 4px;">Description:</p><p style="font-size: 14px; color: #333; margin: 0; white-space: pre-wrap;">${params.description}</p></div>` : ""}

      ${photoSection}

      <div style="text-align: center; margin: 24px 0 16px;">
        <a href="${params.approvalLink}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Review & Approve</a>
      </div>

      <p style="font-size: 12px; color: #999; text-align: center; margin: 16px 0 0;">
        Click the button above to review full details, view photos, and approve or decline this change order.
      </p>
    </div>

    <p style="font-size: 11px; color: #999; text-align: center; margin-top: 16px;">
      Sent via ChangeOrder Pro on behalf of ${params.companyName}
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}

export function emailApprovalConfirmation(params: {
  companyName: string;
  companyLogo?: string;
  coNumber: string;
  coTitle: string;
  amount: string;
  action: "approved" | "declined";
}): { subject: string; html: string } {
  const subject =
    params.action === "approved"
      ? `Change Order #${params.coNumber} Approved — ${params.coTitle}`
      : `Change Order #${params.coNumber} Declined — ${params.coTitle}`;

  const statusColor = params.action === "approved" ? "#16a34a" : "#dc2626";
  const statusText = params.action === "approved" ? "Approved" : "Declined";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${params.companyLogo ? `<img src="${params.companyLogo}" alt="${params.companyName}" style="height: 40px; margin-bottom: 20px;" />` : `<h2 style="margin: 0 0 20px; color: #1a1a1a;">${params.companyName}</h2>`}

      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; background: ${statusColor}15; color: ${statusColor}; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px;">
          ${statusText}
        </span>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666; font-size: 14px;">Change Order</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">#${params.coNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666; font-size: 14px;">Title</td>
            <td style="padding: 6px 0; text-align: right;">${params.coTitle}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e5e5;">
            <td style="padding: 12px 0 6px; font-weight: 700;">Amount</td>
            <td style="padding: 12px 0 6px; text-align: right; font-weight: 700;">$${params.amount}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center;">
        ${params.action === "approved" ? "This change order has been approved. Work may proceed as described." : "This change order has been declined. Your project manager will follow up."}
      </p>
    </div>

    <p style="font-size: 11px; color: #999; text-align: center; margin-top: 16px;">
      Sent via ChangeOrder Pro on behalf of ${params.companyName}
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}
