import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteCompanyDialog } from "@/components/admin/companies/DeleteCompanyDialog";

interface DangerZoneProps {
  companyId: string;
  companyName: string;
}

export function DangerZone({ companyId, companyName }: DangerZoneProps) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete this company</p>
            <p className="text-sm text-muted-foreground">
              Permanently removes {companyName}, its users, projects, and
              change orders. Blocked if the company has approval history.
            </p>
          </div>
          <DeleteCompanyDialog
            companyId={companyId}
            companyName={companyName}
            redirectTo="/admin/companies"
            trigger={
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Company
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
