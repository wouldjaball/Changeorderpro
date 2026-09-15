"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteCompany } from "@/app/admin/actions";

interface DeleteCompanyDialogProps {
  companyId: string;
  companyName: string;
  redirectTo?: string;
  trigger?: React.ReactNode;
}

export function DeleteCompanyDialog({
  companyId,
  companyName,
  redirectTo,
  trigger,
}: DeleteCompanyDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmValue("");
      setError(null);
    }
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCompany(companyId, confirmValue);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success(`${companyName} deleted.`);
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {companyName}</DialogTitle>
          <DialogDescription>
            This permanently deletes the company along with its users,
            projects, and change orders. This cannot be undone. Type the
            company name to confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-company-name">Company name</Label>
          <Input
            id="confirm-company-name"
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={companyName}
            autoComplete="off"
            disabled={isPending}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || confirmValue !== companyName}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Delete permanently"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
