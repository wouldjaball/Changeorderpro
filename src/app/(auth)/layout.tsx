import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Logos/CHange Order Pros White BG Logo png 750px.png"
          alt="Change Order Pros"
          width={320}
          className="dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Logos/ChangeOrderPros Logo for BlacgBG .png"
          alt="Change Order Pros"
          width={320}
          className="hidden dark:block"
        />
      </div>
      <div className="w-full max-w-md">{children}</div>
      <div className="mt-8 flex gap-3 text-sm text-muted-foreground">
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        <span>&middot;</span>
        <Link href="/terms" className="hover:underline">
          Terms &amp; Conditions
        </Link>
      </div>
    </div>
  );
}
