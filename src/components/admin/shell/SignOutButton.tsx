"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <form action="/admin/api/signout" method="POST">
      <Button type="submit" variant="ghost" size="sm" className="gap-2">
        <LogOut size={16} />
        Sign out
      </Button>
    </form>
  );
}
