import { Building2, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  activePath: string;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Companies", href: "/admin/companies" },
];

export function Sidebar({ activePath }: SidebarProps) {
  return (
    <div className="w-60 bg-white border-r h-full flex flex-col shrink-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-semibold text-gray-900">ChangeOrder Pro</h1>
        <p className="text-sm text-gray-500 mt-1">Admin</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? activePath === "/admin"
                : activePath.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
