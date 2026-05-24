import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Change Order Pros | Stop Eating Unpaid Change Orders",
  description:
    "Photo, scope, price, customer signature. 60 seconds from the job site. Stop losing thousands on undocumented change orders.",
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* NAV */}
      <nav className="bg-[#1e3a5f] sticky top-0 z-50 shadow-md">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-white font-extrabold text-lg no-underline">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2" />
              <path d="M9 16l5 5 9-9" stroke="#2d8a4e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Change Order Pros
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/80 hover:text-white text-sm font-medium no-underline hidden sm:block">
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-[#e8720c] hover:bg-[#ff8c2a] text-white px-6 py-2.5 rounded-md text-sm font-bold no-underline transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1e3a5f] to-[#152b47] text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="max-w-[800px] mx-auto relative z-10">
          <span className="inline-block bg-white/10 border border-white/20 rounded-full px-5 py-1.5 text-sm font-semibold tracking-wide mb-6 text-white/90">
            FOR HOME SERVICE CONTRACTORS
          </span>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5">
            You Lost <span className="text-[#ff8c2a]">$3,200</span> on Your Last Job Because Nothing Was in Writing
          </h1>
          <p className="text-lg text-white/85 max-w-[620px] mx-auto mb-8 leading-relaxed">
            Photo, scope, price, customer signature. 60 seconds from the job site. Your phone is in your pocket. The customer is standing right there. That&apos;s all it takes to stop bleeding money on undocumented change orders.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-[#e8720c] hover:bg-[#ff8c2a] text-white px-10 py-4 rounded-lg text-lg font-extrabold no-underline transition-all shadow-[0_4px_14px_rgba(232,114,12,0.4)] hover:shadow-[0_6px_20px_rgba(232,114,12,0.5)] hover:-translate-y-0.5"
          >
            Try It Free for 14 Days
          </Link>
          <p className="mt-5 text-sm text-white/50">No credit card required. Set up in under 5 minutes.</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-br from-transparent via-transparent to-white" style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }} />
      </section>

      {/* PAIN SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-[900px] mx-auto">
          <span className="inline-block bg-gray-100 text-gray-500 text-xs font-bold tracking-widest uppercase px-3.5 py-1.5 rounded mb-4">
            The Problem
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
            You Know Exactly What Happens Next
          </h2>
          <p className="text-base text-gray-700 leading-relaxed mb-8">
            The homeowner walks up mid-demo. &ldquo;While you&apos;re here, can you move that outlet?&rdquo; You say sure. It takes an hour. You figure you&apos;ll add it to the invoice.
          </p>
          <p className="text-base text-gray-700 leading-relaxed mb-8">
            Three weeks later at final walk, they look at the bill and say: <strong className="text-red-600">&ldquo;That was never approved.&rdquo;</strong>
          </p>
          <p className="text-base text-gray-700 leading-relaxed mb-8">
            You eat it. Again. Because you have no proof. No photo, no signed approval, no documentation. Just your word against theirs. And your word doesn&apos;t hold up in court, at the kitchen table, or on the phone with their spouse who &ldquo;never agreed to that.&rdquo;
          </p>
          <p className="text-base text-gray-700 leading-relaxed mb-8">
            Every contractor knows this feeling. Most have accepted it as &ldquo;the cost of doing business.&rdquo; It&apos;s not. It&apos;s a leak. And it&apos;s fixable.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-7 text-center">
              <div className="text-4xl font-black text-red-600">$5,000+</div>
              <div className="text-sm text-gray-500 mt-2">Average annual revenue lost to undocumented change orders per small crew</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-7 text-center">
              <div className="text-4xl font-black text-red-600">73%</div>
              <div className="text-sm text-gray-500 mt-2">of contractors say verbal-only approvals have cost them money in the past year</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-7 text-center">
              <div className="text-4xl font-black text-red-600">0</div>
              <div className="text-sm text-gray-500 mt-2">disputes won in court without written documentation</div>
            </div>
          </div>
        </div>
      </section>

      {/* MECHANISM */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-[900px] mx-auto">
          <span className="inline-block bg-white text-gray-500 text-xs font-bold tracking-widest uppercase px-3.5 py-1.5 rounded border border-gray-200 mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            60 Seconds. From the Job Site. Done.
          </h2>
          <p className="text-base text-gray-500 mb-12 max-w-[600px]">
            Your customer doesn&apos;t download an app. They don&apos;t create an account. They get a text, review the change, and sign with their finger. You get proof that holds up. Hands covered in drywall dust? Voice-to-text works too.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "1", title: "Snap the Photo", desc: "Take a picture of what needs to change. The cracked tile, the moved outlet, the added fixture. Visual proof of the scope." },
              { num: "2", title: "Add Scope + Price", desc: "Type what you're doing and how much it costs. Two sentences. One number. That's it." },
              { num: "3", title: "Send for Signature", desc: "Customer gets a text. They see the photo, the scope, and the price. They sign on their phone screen. Timestamped. Done." },
              { num: "4", title: "Get Paid", desc: 'At invoice time, every change order is documented with photo, description, price, and customer signature. No disputes. No "I never agreed to that."' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-xl font-extrabold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOT ANOTHER ECOSYSTEM */}
      <section className="py-20 px-6">
        <div className="max-w-[900px] mx-auto text-center">
          <span className="inline-block bg-gray-100 text-gray-500 text-xs font-bold tracking-widest uppercase px-3.5 py-1.5 rounded mb-4">
            What This Is NOT
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            One Tool. One Job. That&apos;s It.
          </h2>
          <p className="text-base text-gray-500 mb-10 max-w-[600px] mx-auto">
            You already tried the platforms that want to run your whole business. Scheduling, CRM, invoicing, marketing, GPS tracking. You cancelled them. We know.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[700px] mx-auto text-left">
            <div>
              <h3 className="text-base font-bold text-gray-400 mb-4 pb-3 border-b-2 border-gray-200">The Ecosystems</h3>
              {["$300+/month for features you won't use", "Week-long onboarding and training", "Crew won't use it, ends up on the van floor", "Customer needs to download their app"].map((item) => (
                <div key={item} className="flex items-start gap-2.5 mb-3.5 text-sm text-gray-600">
                  <XIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2d8a4e] mb-4 pb-3 border-b-2 border-[#2d8a4e]">Change Order Pros</h3>
              {[
                "One flat price. Cancel anytime.",
                "Set up in 5 minutes. No training needed.",
                "If your crew can text, they can use it.",
                "Customer signs via text. No app download.",
                "Works alongside QuickBooks, Jobber, whatever you've got.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 mb-3.5 text-sm text-gray-600">
                  <CheckIcon className="w-5 h-5 text-[#2d8a4e] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OBJECTIONS */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-10">
            &ldquo;Yeah, But...&rdquo;
          </h2>
          {[
            {
              q: "\"I don't have time to learn another app in the middle of a job.\"",
              a: "If you can take a photo and send a text, you already know how to use it. There's no dashboard to learn, no workflow to configure. Open it, snap, type, send.",
              strong: "60 seconds.",
            },
            {
              q: "\"My customers will think I don't trust them if I ask them to sign something.\"",
              a: "Your customers sign for a $7 pizza delivery. Signing a $1,200 scope change isn't about trust. It's about clarity.",
              strong: "Most customers actually prefer knowing exactly what they're paying for before the work starts.",
            },
            {
              q: "\"Will my techs actually use this? They barely check their email.\"",
              a: "The customer signs via text message on their own phone. Your tech doesn't need to manage accounts, send emails, or open a laptop.",
              strong: "If they can text, they can do this.",
            },
            {
              q: "\"My wife handles the budget and she's going to say no to another subscription.\"",
              a: "Show her this: you ate how much in unpaid extras last year?",
              strong: "One recovered change order pays for an entire year of the subscription.",
              after: " This doesn't cost money. It recovers it.",
            },
            {
              q: "\"What if my customer isn't tech-savvy?\"",
              a: "They get a text with a link. They tap it, see the photo and the price, and draw their signature with one finger. No login. No app. No account.",
              strong: "If they can answer a text message, they can do this.",
              after: " Works for the 65-year-old homeowner just as well as the 35-year-old.",
            },
          ].map((obj) => (
            <div key={obj.q} className="bg-white border border-gray-200 rounded-xl p-7 mb-4">
              <div className="text-base font-bold text-gray-900 mb-2">{obj.q}</div>
              <div className="text-sm text-gray-500 leading-relaxed">
                {obj.a} <strong className="text-gray-800">{obj.strong}</strong>{obj.after || ""}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROI MATH */}
      <section className="py-20 px-6 bg-[#1e3a5f] text-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-8">
            The Math Is Simple
          </h2>
          <div className="bg-white/[0.08] rounded-xl p-8 max-w-[500px] mx-auto mb-8">
            {[
              { label: "Change orders you eat per year", value: "~8" },
              { label: "Average value per change order", value: "$650" },
              { label: "Revenue you lose annually", value: "$5,200", color: "text-red-400" },
              { label: "Change Order Pro (annual)", value: "$468" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/80">{row.label}</span>
                <span className={`font-bold text-lg ${row.color || ""}`}>{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-5 mt-2 border-t-2 border-[#34a85a]">
              <span className="text-[#34a85a] font-extrabold text-xl">Money back in your pocket</span>
              <span className="text-[#34a85a] font-extrabold text-xl">$4,732</span>
            </div>
          </div>
          <p className="text-sm text-white/50 mb-8">Conservative estimate. Most contractors tell us it&apos;s higher once they start tracking it.</p>
          <Link
            href="/signup"
            className="inline-block bg-[#e8720c] hover:bg-[#ff8c2a] text-white px-10 py-4 rounded-lg text-lg font-extrabold no-underline transition-all shadow-[0_4px_14px_rgba(232,114,12,0.4)] hover:shadow-[0_6px_20px_rgba(232,114,12,0.5)] hover:-translate-y-0.5"
          >
            Start Your 14-Day Free Trial
          </Link>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6">
        <div className="max-w-[900px] mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-10">
            Contractors Who Stopped Eating It
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "First week using it, I recovered a $1,400 panel relocation that the homeowner swore they never asked for. I had the photo, the signed approval, and the timestamp. Conversation over.",
                name: "Mike R.",
                trade: "Remodeling, Phoenix AZ",
              },
              {
                quote: "I lost in small claims court last year over a $4,800 change order because I had nothing in writing. That won't happen again. My techs actually use this because it's just a text.",
                name: "Sarah K.",
                trade: "HVAC, Nashville TN",
              },
              {
                quote: "I've tried Jobber, Housecall Pro, Buildertrend. Cancelled all of them. Too much software for what I need. This does one thing and it does it right. That's all I wanted.",
                name: "Tony M.",
                trade: "Plumbing, Chicago IL",
              },
            ].map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-xl p-7 relative">
                <span className="absolute top-3 left-5 text-5xl text-gray-200 font-serif leading-none">&ldquo;</span>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 pt-5 italic">{t.quote}</p>
                <cite className="text-sm font-semibold text-gray-900 not-italic block">
                  {t.name} <span className="font-normal text-gray-400">{t.trade}</span>
                </cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            The Next Change Order That Comes Up On Your Job Site?
          </h2>
          <p className="text-base text-gray-500 mb-2">You&apos;ll have two options:</p>
          <ul className="inline-block text-left mb-8 space-y-3">
            <li className="flex items-center gap-2.5 text-gray-600">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#e2e6ea" /><path d="M13 8l-4 4-2-2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Say &ldquo;we&apos;ll work it out later&rdquo; and hope for the best
            </li>
            <li className="flex items-center gap-2.5 text-gray-700 font-semibold">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#d4edda" /><path d="M13 8l-4 4-2-2" stroke="#2d8a4e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Pull out your phone, spend 60 seconds, and get it signed
            </li>
          </ul>
          <div>
            <Link
              href="/signup"
              className="inline-block bg-[#e8720c] hover:bg-[#ff8c2a] text-white px-12 py-4.5 rounded-lg text-xl font-extrabold no-underline transition-all shadow-[0_4px_14px_rgba(232,114,12,0.4)] hover:shadow-[0_6px_20px_rgba(232,114,12,0.5)] hover:-translate-y-0.5"
            >
              Try Change Order Pros Free for 14 Days
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">No credit card. No contract. No ecosystems. Just the one tool you actually need.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#152b47] text-white/50 py-8 px-6 text-center text-sm">
        <p>&copy; 2026 Change Order Pros. All rights reserved. | <Link href="/privacy" className="text-white/70 no-underline hover:text-white">Privacy</Link> | <Link href="/terms" className="text-white/70 no-underline hover:text-white">Terms</Link></p>
      </footer>
    </div>
  );
}
