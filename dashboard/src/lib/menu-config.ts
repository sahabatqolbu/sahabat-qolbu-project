// dashboard/src/lib/menu-config.ts
import {
  LayoutDashboard,
  Users,
  Package,
  Building2,
  Plane,
  MapPin,
  Landmark,
  Settings,
  Database,
  FileText,
  Wallet,
  UserCheck,
  MessageSquare,
  HelpCircle,
  Image as ImageIcon,
  CreditCard,
  Shield,
  FileCheck,
  Target,
  Calendar,
  User,
  UserCog,
  Briefcase,
} from "lucide-react";

export interface MenuItem {
  label: string;
  href?: string;
  icon: any;
  badge?: string;
  children?: MenuItem[];
  exact?: boolean;
}

export const MENU_CONFIG: Record<string, MenuItem[]> = {
  // =====================================================
  // ADMIN MENU
  // =====================================================
  ADMIN: [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Kelola User",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Paket Umrah",
      href: "/admin/packages",
      icon: Package,
    },
    {
      label: "Kelola Jamaah",
      href: "/admin/jamaah",
      icon: UserCheck,
    },
    // ✅ NEW: Tab Agen (terpisah dari users)
    {
      label: "Kelola Agen",
      href: "/admin/agen",
      icon: UserCog, // atau Briefcase, UserCheck, Shield
    },
    {
      label: "Transaksi",
      href: "/admin/transactions",
      icon: Wallet,
    },
    {
      label: "Data Master",
      icon: Database,
      children: [
        {
          label: "Hotel",
          href: "/admin/master/hotels",
          icon: Building2,
        },
        {
          label: "Maskapai",
          href: "/admin/master/airlines",
          icon: Plane,
        },
        {
          label: "Bandara",
          href: "/admin/master/airports",
          icon: MapPin,
        },
        {
          label: "Bank",
          href: "/admin/master/banks",
          icon: Landmark,
        },
        // ✅ NEW: Master Data Agen
        {
          label: "Level Agen",
          href: "/admin/master/agent-levels",
          icon: Shield,
        },
        {
          label: "Persyaratan Agen",
          href: "/admin/master/agent-requirements",
          icon: FileCheck,
        },
        {
          label: "Tujuan Bergabung",
          href: "/admin/master/agent-purposes",
          icon: Target,
        },
        {
          label: "Periode Closing",
          href: "/admin/master/periods",
          icon: Calendar,
        },
      ],
    },
    {
      label: "Konten",
      icon: FileText,
      children: [
        {
          label: "Testimonial",
          href: "/admin/content/testimonials",
          icon: MessageSquare,
        },
        {
          label: "FAQ",
          href: "/admin/content/faqs",
          icon: HelpCircle,
        },
        {
          label: "Gallery",
          href: "/admin/content/gallery",
          icon: ImageIcon,
        },
      ],
    },
    {
      label: "Laporan",
      href: "/admin/reports",
      icon: FileText,
    },
    {
      label: "Pengaturan",
      icon: Settings,
      children: [
        {
          label: "Profil Perusahaan",
          href: "/admin/settings/company",
          icon: Building2,
        },
      ],
    },
  ],

  // =====================================================
  // FINANCE MENU
  // =====================================================
  FINANCE: [
    {
      label: "Dashboard",
      href: "/finance",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Kelola User",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Paket Umrah",
      href: "/admin/packages",
      icon: Package,
    },
    {
      label: "Kelola Jamaah",
      href: "/admin/jamaah",
      icon: UserCheck,
    },
    {
      label: "Kelola Agen",
      href: "/admin/agen",
      icon: UserCog,
    },
    {
      label: "POS Jamaah",
      href: "/finance/pos",
      icon: CreditCard,
    },
    {
      label: "Transaksi",
      href: "/admin/transactions",
      icon: Wallet,
    },
    {
      label: "Laporan",
      href: "/admin/reports",
      icon: FileText,
    },
  ],

  // =====================================================
  // AGEN MENU
  // =====================================================
  AGEN: [
    {
      label: "Dashboard",
      href: "/agen",
      icon: LayoutDashboard,
      exact: true,
    },
    // ✅ NEW: Profile Agen (untuk lengkapi data)
    {
      label: "Profil Saya",
      href: "/agen/profile",
      icon: User,
      badge: "Wajib", // Jika belum lengkap
    },
    {
      label: "Daftar Jamaah",
      href: "/agen/jamaah",
      icon: Users,
    },
    {
      label: "Buat Akun Jamaah",
      href: "/agen/jamaah/create",
      icon: UserCheck,
    },
    {
      label: "Komisi Saya",
      href: "/agen/commissions",
      icon: Wallet,
    },
    {
      label: "Paket Tersedia",
      href: "/agen/packages",
      icon: Package,
    },
  ],

  // =====================================================
  // JAMAAH MENU
  // =====================================================
  JAMAAH: [
    {
      label: "Dashboard",
      href: "/jamaah",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Lengkapi Biodata",
      href: "/jamaah/profile",
      icon: UserCheck,
    },
    {
      label: "Upload Dokumen",
      href: "/jamaah/documents",
      icon: FileText,
    },
    {
      label: "Pembayaran",
      href: "/jamaah/payments",
      icon: Wallet,
    },
    {
      label: "Paket Saya",
      href: "/jamaah/package",
      icon: Package,
    },
  ],

  STAFF: [
    {
      label: "Dashboard",
      href: "/staff",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Kelola User",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Paket Umrah",
      href: "/admin/packages",
      icon: Package,
    },
    {
      label: "Kelola Jamaah",
      href: "/admin/jamaah",
      icon: UserCheck,
    },
    {
      label: "Kelola Agen",
      href: "/admin/agen",
      icon: UserCog,
    },
    {
      label: "Data Master",
      icon: Database,
      children: [
        {
          label: "Hotel",
          href: "/admin/master/hotels",
          icon: Building2,
        },
        {
          label: "Maskapai",
          href: "/admin/master/airlines",
          icon: Plane,
        },
        {
          label: "Bandara",
          href: "/admin/master/airports",
          icon: MapPin,
        },
        {
          label: "Bank",
          href: "/admin/master/banks",
          icon: Landmark,
        },
        {
          label: "Level Agen",
          href: "/admin/master/agent-levels",
          icon: Shield,
        },
        {
          label: "Persyaratan Agen",
          href: "/admin/master/agent-requirements",
          icon: FileCheck,
        },
        {
          label: "Tujuan Bergabung",
          href: "/admin/master/agent-purposes",
          icon: Target,
        },
        {
          label: "Periode Closing",
          href: "/admin/master/periods",
          icon: Calendar,
        },
      ],
    },
    {
      label: "Konten",
      icon: FileText,
      children: [
        {
          label: "Testimonial",
          href: "/admin/content/testimonials",
          icon: MessageSquare,
        },
        {
          label: "FAQ",
          href: "/admin/content/faqs",
          icon: HelpCircle,
        },
        {
          label: "Gallery",
          href: "/admin/content/gallery",
          icon: ImageIcon,
        },
      ],
    },
    {
      label: "Profil Saya",
      href: "/admin/profile",
      icon: User,
    },

  ],
};

export function getMenuByRole(role: string): MenuItem[] {
  return MENU_CONFIG[role] || [];
}
