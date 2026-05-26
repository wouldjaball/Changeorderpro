import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trial Expired | Change Order Pros",
};

export default function TrialExpiredPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-amber-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your free trial has ended</h1>

        <p className="text-gray-500 mb-6">
          Your 14-day trial is over, but your data is still here. Upgrade to keep using Change Order Pros and stop eating unpaid change orders.
        </p>

        <a
          href="mailto:aaron@salesmonsters.com?subject=Change%20Order%20Pros%20-%20Upgrade%20My%20Account"
          className="inline-block w-full bg-[#e8720c] hover:bg-[#ff8c2a] text-white px-6 py-3 rounded-lg font-bold no-underline transition-colors mb-3"
        >
          Contact Us to Upgrade
        </a>

        <Link
          href="/"
          className="inline-block text-sm text-gray-400 hover:text-gray-600 no-underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
