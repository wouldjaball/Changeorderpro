import { SignOutButton } from "./SignOutButton";

interface TopBarProps {
  email: string;
}

export function TopBar({ email }: TopBarProps) {
  return (
    <div className="h-14 bg-white border-b px-6 flex items-center justify-end gap-4 shrink-0">
      <span className="text-sm text-muted-foreground">{email}</span>
      <SignOutButton />
    </div>
  );
}
