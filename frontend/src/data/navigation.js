import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  BarChart3,
  Megaphone,
  Settings,
  UserPlus,
  ClipboardList,
  Wallet,
  Receipt,
  AlertCircle,
  PieChart,
  Calendar,
  CheckSquare,
  NotebookPen,
  Upload,
  BookOpen,
  Shield,
  Bed,
  Gavel,
  Sparkles,
  FileText,
  CreditCard,
  Download,
  Home,
  Sun,
} from 'lucide-react'
import { ROLES } from './mockData'

const allStaff = [
  ROLES.DIRECTOR,
  ROLES.SECRETARY,
  ROLES.CASHIER,
  ROLES.TEACHER,
  ROLES.EDUCATOR,
]

export const NAV_BY_ROLE = {
  [ROLES.DIRECTOR]: [
    { label: 'Paneli', path: '/dashboard', icon: LayoutDashboard },

    {
      label: 'Akademike',
      icon: GraduationCap,
      children: [
        { label: 'Klasat', path: '/classes' },
        { label: 'Lëndët', path: '/subjects' },
        { label: 'Orari', path: '/timetable' },
        { label: 'Vitet Shkollore', path: '/academic-years' },
      ],
    },

    {
      label: 'Stafi',
      icon: Users,
      path: '/staff'
    },

    {
      label: 'Financat',
      icon: DollarSign,
      children: [
        { label: 'Përmbledhje', path: '/finance' },
        { label: 'Pagesat', path: '/finance/payments' },
        { label: 'Borxhet', path: '/finance/outstanding' },
        { label: 'Raportet', path: '/finance/reports' },
      ],
    },

    {
      label: 'Konvikti',
      icon: Building2,
      children: [
        { label: 'Përmbledhje', path: '/dormitory' },
        { label: 'Dhomat', path: '/dormitory/rooms' },
        { label: 'Kontrollet', path: '/dormitory/inspections' },
      ],
    },

    {
      label: 'Disiplina',
      icon: Gavel,
      children: [
        { label: 'Rastet', path: '/discipline' },
        { label: 'Masat Disiplinore', path: '/discipline/actions' },
      ],
    },

    {
      label: 'Aktivitetet',
      icon: BookOpen,
      children: [
        { label: 'Aktivitetet', path: '/extracurricular' },
        { label: 'Klubet', path: '/clubs' },
      ],
    },

    {
      label: 'Raportet',
      icon: BarChart3,
      children: [
        { label: 'Akademike', path: '/reports/academic' },
        { label: 'Financiare', path: '/reports/finance' },
        { label: 'Prezenca', path: '/reports/attendance' },
        { label: 'Disiplina', path: '/reports/discipline' },
      ],
    },

    { label: 'Njoftimet', path: '/announcements', icon: Megaphone },

    { label: 'Cilësimet', path: '/settings', icon: Settings },
  ],
  [ROLES.SECRETARY]: [
    { label: 'Paneli', path: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Regjistrimi',
      icon: UserPlus,
      children: [
        { label: 'Regjistro nxenes', path: '/students/new' },
        { label: 'Import masiv', path: '/students/import' },
      ],
    },
    {
      label: 'Dosjet e nxenesve',
      icon: ClipboardList,
      children: [
        { label: 'Te gjithe nxenesit', path: '/students' },
        { label: 'Caktimet ne klasa', path: '/classes' },
        { label: 'Dokumentet', path: '/documents' },
      ],
    },
    { label: 'Stafi', path: '/teachers', icon: Users },
    { label: 'Raportet financiare', path: '/finance/reports', icon: PieChart, badge: 'Vetem lexim' },
    { label: 'Njoftime', path: '/announcements', icon: Megaphone },
    { label: 'Profili', path: '/profile', icon: Users },
  ],
  [ROLES.CASHIER]: [
    { label: 'Paneli financiar', path: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Pagesat',
      icon: Receipt,
      children: [
        { label: 'Regjistro pagese', path: '/finance/payments/new' },
        { label: 'Historiku i pagesave', path: '/finance/payments' },
      ],
    },
    { label: 'Faturat', path: '/finance/invoices', icon: FileText },
    { label: 'Borxhet', path: '/finance/outstanding', icon: AlertCircle },
    { label: 'Raportet', path: '/finance/reports', icon: PieChart },
    { label: 'Tarifat', path: '/settings/fee-structure', icon: Settings },
  ],
  [ROLES.TEACHER]: [
    { label: 'Paneli', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Klasat e mia', path: '/classes', icon: Calendar },
    { label: 'Prezenca', path: '/attendance', icon: CheckSquare },
    {
      label: 'Notat',
      icon: NotebookPen,
      children: [
        { label: 'Vendos nota', path: '/grades/entry' },
        { label: 'Provimet', path: '/grades/exams' },
        { label: 'Raportet', path: '/grades/reports' },
      ],
    },
    { label: 'Detyrat', path: '/assignments', icon: Upload },
    { label: 'Nxenesit', path: '/students', icon: Users },
    { label: 'Mbikeqyrja', path: '/discipline', icon: Shield },
  ],
  [ROLES.EDUCATOR]: [
    { label: 'Paneli', path: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Nxenesit konviktore',
      icon: Bed,
      children: [
        { label: 'Te gjithe konviktoret', path: '/dormitory' },
        { label: 'Caktimet e dhomave', path: '/dormitory/rooms' },
      ],
    },
    {
      label: 'Disiplina',
      icon: Gavel,
      children: [
        { label: 'Regjistro verejtje', path: '/discipline/record' },
        { label: 'Historiku', path: '/discipline/history' },
      ],
    },
    { label: 'Kontrollet', path: '/dormitory/inspections', icon: Sparkles },
    {
      label: 'Prezenca',
      icon: CheckSquare,
      children: [
        { label: 'Oret e mesimit', path: '/attendance/study-hours' },
        { label: 'Namazi i sabahut', path: '/attendance/fajr' },
      ],
    },
    { label: 'Raporte', path: '/reports', icon: FileText },
  ],
  [ROLES.STUDENT]: [
    { label: 'Paneli im', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Orari', path: '/timetable', icon: Calendar },
    { label: 'Notat e mia', path: '/grades/reports', icon: BarChart3 },
    { label: 'Prezenca ime', path: '/attendance/reports', icon: CheckSquare },
    { label: 'Njoftime', path: '/announcements', icon: Megaphone },
    { label: 'Dokumentet', path: '/documents/my-documents', icon: Download },
    { label: 'Gjendja e pagesave', path: '/finance/pay', icon: CreditCard },
    { label: 'Disiplina', path: '/discipline/my-record', icon: Gavel },
    { label: 'Detyrat', path: '/assignments', icon: BookOpen },
  ],
  [ROLES.BOARDING]: [
    { label: 'Paneli im', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Orari', path: '/timetable', icon: Calendar },
    { label: 'Notat e mia', path: '/grades/reports', icon: BarChart3 },
    { label: 'Prezenca ime', path: '/attendance/reports', icon: CheckSquare },
    { label: 'Njoftime', path: '/announcements', icon: Megaphone },
    { label: 'Dokumentet', path: '/documents/my-documents', icon: Download },
    { label: 'Gjendja e pagesave', path: '/finance/pay', icon: CreditCard },
    { label: 'Disiplina', path: '/discipline/my-record', icon: Gavel },
    { label: 'Detyrat', path: '/assignments', icon: BookOpen },
    { label: 'Dhoma ime', path: '/dormitory/my-room', icon: Home },
    { label: 'Paguaj konviktin', path: '/finance/pay', icon: Wallet },
    { label: 'Raportet e pastertise', path: '/dormitory/inspections', icon: Sparkles },
    { label: 'Oret e mesimit', path: '/attendance/study-hours', icon: BookOpen },
    { label: 'Prezenca ne sabah', path: '/attendance/fajr', icon: Sun },
    { label: 'Verejtjet e edukatorit', path: '/discipline/my-record', icon: Gavel },
  ],
}

export function getNavForRole(role) {
  return NAV_BY_ROLE[role] || []
}

export function canAccessRoute(role, path) {
  const nav = getNavForRole(role)
  const paths = []

  function collect(items) {
    items.forEach((item) => {
      if (item.path) paths.push(item.path)
      if (item.children) collect(item.children)
    })
  }

  collect(nav)

  if (paths.some((p) => path === p || path.startsWith(`${p}/`))) return true
  if (path === '/profile') return true
  if (path.startsWith('/students/') && allStaff.includes(role)) return true
  return paths.some((p) => path.startsWith(p))
}
