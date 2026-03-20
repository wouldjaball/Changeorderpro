import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  const effectiveDate = "March 17, 2026";
  const companyName = "ChangeOrder Pro";
  const companyEntity = "Sales Monsters LLC";
  const domain = "changeorderpros.com";
  const contactEmail = "support@changeorderpros.com";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="ChangeOrder Pro"
              width={32}
              height={32}
            />
            <span className="text-lg font-bold">{companyName}</span>
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
            Terms &amp; Conditions
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Effective Date: {effectiveDate}
        </p>

        <div className="prose prose-neutral max-w-none space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p>
              {companyName} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), operated by {companyEntity}, provides a
              cloud-based platform at {domain} (the &quot;Service&quot;) that helps construction
              professionals create, send, and manage change orders. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>

            <h3 className="mt-4 text-base font-semibold">2.1 Account Information</h3>
            <p>
              When you register, we collect your name, email address, phone number, company name,
              and job title. If you are invited by a team administrator, they may provide your
              contact information on your behalf.
            </p>

            <h3 className="mt-4 text-base font-semibold">2.2 Change Order Data</h3>
            <p>
              We store the content you create within the Service, including project details, change
              order descriptions, line items, cost information, photos and markup annotations,
              client contact information, and approval/decline records.
            </p>

            <h3 className="mt-4 text-base font-semibold">2.3 Communications Data</h3>
            <p>
              When you send change orders for approval via SMS or email, we log the recipient phone
              number or email address, message delivery status, and approval or decline responses.
              We also process inbound SMS replies (e.g., &quot;YES&quot; or &quot;NO&quot;) to record client decisions.
            </p>

            <h3 className="mt-4 text-base font-semibold">2.4 Usage &amp; Device Data</h3>
            <p>
              We automatically collect IP address, browser type, operating system, pages visited,
              and timestamps when you interact with the Service.
            </p>

            <h3 className="mt-4 text-base font-semibold">2.5 Cookies</h3>
            <p>
              We use essential cookies and local storage for authentication sessions and offline
              draft persistence. We do not use advertising or third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>To provide, operate, and maintain the Service</li>
              <li>To send change order approval requests via SMS and email on your behalf</li>
              <li>To send reminders for pending approvals</li>
              <li>To generate PDF documents and reports</li>
              <li>To provide AI-powered features (description enhancement, cost suggestions)</li>
              <li>To send account-related notifications (invitations, password resets)</li>
              <li>To monitor and improve service performance and security</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Third-Party Service Providers</h2>
            <p>We share data with the following categories of service providers, only as necessary to operate the Service:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong>Supabase</strong> — Database hosting, authentication, and file storage</li>
              <li><strong>Twilio</strong> — SMS delivery for change order approvals and reminders</li>
              <li><strong>Resend</strong> — Transactional email delivery</li>
              <li><strong>Vercel</strong> — Application hosting and deployment</li>
              <li><strong>Anthropic</strong> — AI-powered text generation features (no personal data is sent; only change order descriptions and line item context)</li>
            </ul>
            <p className="mt-2">
              Each provider processes data under their own privacy policies and data processing agreements.
              We do not sell, rent, or trade your personal information to any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. SMS &amp; Messaging Consent</h2>

            <h3 className="mt-4 text-base font-semibold">5.1 How We Collect Consent (Opt-In)</h3>
            <p>
              Before any SMS messages are sent to a client, the {companyName} user (contractor)
              must explicitly confirm that the client has consented to receive text messages. This
              consent is collected through a required opt-in checkbox on our project creation and
              project editing forms. The checkbox includes the following disclosure:
            </p>
            <blockquote className="mt-2 border-l-4 border-primary/30 pl-4 text-sm italic">
              &quot;The client has agreed to receive SMS messages from ChangeOrder Pro regarding
              change order approvals for this project. By checking this box, you confirm the
              client consented to receive transactional SMS messages including change order
              approval requests and reminders. Msg frequency varies (1–4 per change order).
              Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.&quot;
            </blockquote>
            <p className="mt-2">
              SMS messages cannot be sent through {companyName} until this opt-in checkbox is
              checked. We record the date and time of each consent confirmation.
            </p>

            <h3 className="mt-4 text-base font-semibold">5.2 Types of SMS Messages</h3>
            <p>
              When consent is confirmed and a {companyName} user sends a change order for approval,
              the client may receive the following transactional SMS messages:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>An initial approval request with change order details and a link to review</li>
              <li>Up to two follow-up reminders if the change order remains pending</li>
              <li>A confirmation or acknowledgment after the client approves or declines</li>
            </ul>

            <h3 className="mt-4 text-base font-semibold">5.3 Message Frequency &amp; Rates</h3>
            <p>
              Message frequency varies. Typically 1–4 messages per change order. Message and data
              rates may apply. {companyName} does not charge recipients for SMS messages, but
              carrier fees may apply.
            </p>

            <h3 className="mt-4 text-base font-semibold">5.4 Opt-Out &amp; Help</h3>
            <p>
              Recipients may opt out at any time by replying <strong>STOP</strong> to any message.
              Reply <strong>HELP</strong> for assistance, or contact us at{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary underline">
                {contactEmail}
              </a>.
            </p>

            <h3 className="mt-4 text-base font-semibold">5.5 No Marketing or Third-Party Sharing</h3>
            <p>
              We do not use phone numbers collected through the Service for marketing purposes.
              Phone numbers are used solely for change order approval workflows initiated by the{" "}
              {companyName} user who entered them. We do not share, sell, or rent phone numbers
              or SMS consent data with third parties for their marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Data Retention</h2>
            <p>
              We retain your account data and change order records for as long as your account is
              active. If you delete your account, we will remove your personal information within
              30 days, except where retention is required by law or for legitimate business purposes
              (e.g., completed audit logs).
            </p>
            <p className="mt-2">
              Approval tokens expire after 72 hours and are no longer valid after that period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Data Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS/TLS encryption in
              transit, encrypted database connections, row-level security policies, HMAC-signed
              approval tokens, and role-based access controls. However, no method of electronic
              transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format (CSV export is available in the Service)</li>
              <li>Opt out of SMS communications by replying STOP</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary underline">
                {contactEmail}
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for individuals under 18. We do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify registered users
              of material changes via email. The &quot;Effective Date&quot; at the top of this page indicates
              when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p className="mt-2">
              {companyEntity}<br />
              Email:{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary underline">
                {contactEmail}
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t bg-white py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {companyEntity}. All rights reserved. |{" "}
        <Link href="/terms" className="underline">
          Terms &amp; Conditions
        </Link>
      </footer>
    </div>
  );
}
