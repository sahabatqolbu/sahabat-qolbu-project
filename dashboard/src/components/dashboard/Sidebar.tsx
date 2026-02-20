"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { getMenuByRole } from "@/lib/menu-config";
import { cn } from "@/lib/utils";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // State untuk collapse menu
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const menuItems = getMenuByRole(user.role);
  const homeByRole: Record<string, string> = {
    ADMIN: "/admin",
    FINANCE: "/finance",
    STAFF: "/staff",
    AGEN: "/agen",
    JAMAAH: "/jamaah",
  };
  const homeHref = homeByRole[user.role] || "/";

  // Toggle collapse
  const toggleCollapse = (label: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // ✅ UPDATED: Check active dengan exact match
  const isActive = (href?: string, exact?: boolean) => {
    if (!href) return false;

    if (exact) {
      return pathname === href; // Exact match
    }

    // Untuk menu lain, match jika pathname dimulai dengan href
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Check if any child is active
  const isParentActive = (children?: any[]) => {
    if (!children) return false;
    return children.some((child) => isActive(child.href, child.exact));
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 fixed left-0 top-0 h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href={homeHref} className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/images/icon.png" alt="" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-primary">
              Sahabat <span className="text-secondary">Qolbu</span>
            </h1>
            <p className="text-xs text-gray-500">Dashboard {user.role}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            // Menu dengan children (collapsible)
            if (item.children && item.children.length > 0) {
              const isExpanded = collapsed[item.label];
              const hasActiveChild = isParentActive(item.children);

              return (
                <li key={`parent-${item.label}-${index}`}>
                  {/* Parent Button */}
                  <button
                    onClick={() => toggleCollapse(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors",
                      hasActiveChild
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {/* Children Menu */}
                  {isExpanded && (
                    <ul className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                      {item.children.map((child, childIndex) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.href, child.exact);

                        return (
                          <li key={`child-${child.href}-${childIndex}`}>
                            <Link
                              href={child.href!}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                                childActive
                                  ? "bg-primary text-white"
                                  : "text-gray-700 hover:bg-gray-100"
                              )}
                            >
                              <ChildIcon className="h-4 w-4" />
                              <span className="font-medium">{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            // Menu biasa (tanpa children)
            const itemActive = isActive(item.href, item.exact);

            return (
              <li key={`menu-${item.href}-${index}`}>
                <Link
                  href={item.href!}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    itemActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </aside>
  );
}
