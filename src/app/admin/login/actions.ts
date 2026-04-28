"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";

export async function sendMagicLink(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    throw new Error("Email is required");
  }

  if (!isAdminEmail(email)) {
    return { success: true };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}