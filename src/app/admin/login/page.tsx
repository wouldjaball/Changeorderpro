"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, AlertCircle } from "lucide-react";
import { sendMagicLink } from "./actions";
import { useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);

    try {
      await sendMagicLink(formData);
      setSuccess(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If that email is authorized, a link has been sent.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ChangeOrder Pro Admin</CardTitle>
          <CardDescription>
            Enter your admin email to receive a sign-in link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error === "unauthorized" && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>You are not authorized to access the admin panel.</span>
            </div>
          )}
          {error === "auth_failed" && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Authentication failed. Please try again.</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send magic link
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}