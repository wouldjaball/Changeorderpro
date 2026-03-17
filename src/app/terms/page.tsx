import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
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
          <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
            Privacy Policy
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold">Terms &amp; Conditions</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Effective Date: {effectiveDate}
        </p>

        <div className="prose prose-neutral max-w-none space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using {companyName} at {domain} (the &quot;Service&quot;), operated by{" "}
              {companyEntity}, you agree to be bound by these Terms &amp; Conditions
              (&quot;Terms&quot;). If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p>
              {companyName} is a cloud-based platform that enables construction professionals to
              create, send, track, and document change orders. Features include change order
              creation with line items, photo upload and annotation, SMS and email delivery for
              client approval, PDF generation, AI-assisted descriptions, team management, and
              reporting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Account Registration</h2>
            <p>
              You must register for an account to use the Service. You agree to provide accurate,
              current, and complete information during registration and to keep your account
              credentials secure. You are responsible for all activity under your account.
            </p>
            <p className="mt-2">
              If you register on behalf of a company, you represent that you have authority to bind
              that company to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>
                Send SMS or email messages to individuals who have not been provided as
                legitimate business contacts for change order approval
              </li>
              <li>Upload content that is malicious, infringing, or harmful</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to send spam, marketing messages, or unsolicited communications</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Reverse-engineer, decompile, or disassemble the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. SMS Messaging Terms</h2>
            <p>
              When you use the Service to send change orders for approval via SMS, you represent
              and warrant that:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                You have a legitimate business relationship with each SMS recipient
              </li>
              <li>
                The recipient&apos;s phone number was provided to you directly by the recipient or their
                authorized representative for the purpose of construction project communications
              </li>
              <li>
                You will honor all opt-out requests promptly
              </li>
            </ul>
            <p className="mt-2">
              SMS messages are sent via Twilio. Message and data rates may apply to recipients.
              Recipients may opt out by replying STOP to any message. Message frequency varies;
              typically 1–4 messages per change order.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Your Data</h2>
            <p>
              You retain ownership of all content you upload or create through the Service
              (&quot;Your Data&quot;), including change orders, project information, photos, and
              documents. You grant us a limited license to host, process, and transmit Your Data
              solely to provide the Service.
            </p>
            <p className="mt-2">
              You are responsible for the accuracy of client contact information entered into the
              Service. We are not liable for messages sent to incorrect phone numbers or email
              addresses that you provide.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. AI Features</h2>
            <p>
              The Service includes optional AI-powered features for enhancing change order
              descriptions, summarizing content, and suggesting line items. AI-generated content
              is provided as a suggestion only. You are solely responsible for reviewing, editing,
              and approving all content before sending it to clients.
            </p>
            <p className="mt-2">
              We do not guarantee the accuracy, completeness, or suitability of AI-generated
              content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Change Order Approvals</h2>
            <p>
              The Service facilitates digital approval of change orders via SMS reply, email link,
              or web form. These digital approvals are intended to supplement — not replace — your
              existing contractual agreements with clients.
            </p>
            <p className="mt-2">
              We record approval events with timestamps and metadata. However, you are responsible
              for determining whether digital approval is legally sufficient under your contracts
              and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Fees &amp; Payment</h2>
            <p>
              Pricing and subscription terms will be published on our website. We reserve the right
              to modify pricing with 30 days notice to active subscribers. SMS and email delivery
              costs may be included in your plan or billed separately based on usage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access.
              The Service may be temporarily unavailable for maintenance, updates, or circumstances
              beyond our control. We are not liable for any loss resulting from service downtime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {companyEntity.toUpperCase()} SHALL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES,
              ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p className="mt-2">
              OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS SHALL NOT EXCEED THE
              AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless {companyEntity}, its officers, employees, and
              agents from any claims, damages, or expenses arising from your use of the Service,
              your violation of these Terms, or your violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">13. Termination</h2>
            <p>
              We may suspend or terminate your account if you violate these Terms. You may cancel
              your account at any time by contacting us. Upon termination, your right to use the
              Service ceases immediately. We may retain Your Data for up to 30 days following
              termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Texas, without regard to conflict
              of law principles. Any disputes arising from these Terms shall be resolved in the
              state or federal courts located in Texas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">15. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify registered users of
              material changes via email. Continued use of the Service after changes constitutes
              acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">16. Contact Us</h2>
            <p>
              If you have questions about these Terms, contact us at:
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
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
