// dashboard/src/components/dashboard/Header.tsx
"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  Menu,
  LogOut,
  User,
  Settings,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileMenu } from "./MobileMenu";
import { NotificationDropdown } from "./NotificationDropdown";
import Link from "next/link";

export function Header() {
  const { user, logout } = useAuthStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (!user) return null;

  const isStaff = user.role === "STAFF";
  const isFinance = user.role === "FINANCE";
  const basePrefix = isStaff ? "/staff" : isFinance ? "/finance" : "/admin";
  const calendarHref = `${basePrefix}/calendar`;
  const profileHref = `${basePrefix}/profile`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Mobile: Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo (Mobile) */}
          <div className="md:hidden flex items-center gap-2">
            <span className="text-2xl">🕌</span>
            <span className="font-serif font-bold text-primary">
              Sahabat Qolbu
            </span>
          </div>

          {/* Page Title (Desktop) */}
          <div className="hidden md:block">
            <h2 className="text-xl font-semibold text-gray-800">
              Dashboard {user.role}
            </h2>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* ✅ Calendar Icon */}
            <Link href={calendarHref}>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/5"
              >
                <Calendar className="h-5 w-5 text-gray-600" />
              </Button>
            </Link>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu (Desktop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex gap-2">
                  <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium block">
                      {user.fullName}
                    </span>
                    <span className="text-xs text-gray-500 block">
                      {user.role}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Profile Link */}
                <Link href={profileHref}>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil Saya</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                  </DropdownMenuItem>
                </Link>

                {/* Settings/Company Profile - Only for ADMIN */}
                {user.role === "ADMIN" && (
                  <Link href="/admin/settings/company">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profil Perusahaan</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                    </DropdownMenuItem>
                  </Link>
                )}

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileMenu
        open={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </>
  );
}
