"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { getMenuByRole } from "@/lib/menu-config";
import { cn } from "@/lib/utils";
import { X, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // ✅ State untuk collapse submenu
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!user) return null;

  const menuItems = getMenuByRole(user.role);

  // ✅ Toggle collapse
  const toggleCollapse = (label: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // ✅ Check active dengan exact match
  const isActive = (href?: string, exact?: boolean) => {
    if (!href) return false;

    if (exact) {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

  // ✅ Check if any child is active
  const isParentActive = (children?: any[]) => {
    if (!children) return false;
    return children.some((child) => isActive(child.href, child.exact));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-80 bg-white z-50 md:hidden transition-transform duration-300 ease-out flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/images/icon.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-primary">
                Sahabat <span className="text-secondary">Qolbu</span>
              </h2>
              <p className="text-xs text-gray-500">Dashboard {user.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.fullName}</p>
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
                <span
                  className={cn(
                    "inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold",
                    user.role === "ADMIN" && "bg-purple-100 text-purple-800",
                    user.role === "FINANCE" && "bg-green-100 text-green-800",
                    user.role === "STAFF" && "bg-slate-100 text-slate-800",
                    user.role === "AGEN" && "bg-blue-100 text-blue-800",
                    user.role === "JAMAAH" && "bg-orange-100 text-orange-800"
                  )}
                >
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;

              // ✅ Menu dengan children (collapsible)
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
                                onClick={onClose}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                                  childActive
                                    ? "bg-primary text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                )}
                              >
                                <ChildIcon className="h-4 w-4" />
                                <span className="font-medium">
                                  {child.label}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // ✅ Menu biasa (tanpa children)
              const itemActive = isActive(item.href, item.exact);

              return (
                <li key={`menu-${item.href}-${index}`}>
                  <Link
                    href={item.href!}
                    onClick={onClose}
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

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </aside>
    </>
  );
}
