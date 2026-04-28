import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAbsoluteDate } from "@/lib/admin/helpers";
import type { TeamMember } from "@/lib/admin/types";

interface TeamPanelProps {
  members: TeamMember[];
}

export function TeamPanel({ members }: TeamPanelProps) {
  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No team members found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Team ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 text-muted-foreground font-medium">Name</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Email</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Role</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="py-2">{m.full_name}</td>
                <td className="py-2 text-muted-foreground">{m.email}</td>
                <td className="py-2">
                  <Badge variant="outline" className="capitalize">
                    {m.role}
                  </Badge>
                </td>
                <td className="py-2 text-muted-foreground">
                  {formatAbsoluteDate(m.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
