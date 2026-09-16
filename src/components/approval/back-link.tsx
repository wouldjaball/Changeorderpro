import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackLink({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Dashboard
    </Link>
  );
}
