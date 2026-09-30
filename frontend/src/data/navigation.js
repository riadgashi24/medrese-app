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
        { label: 'Kujdestaria dhe raportet', path: '/teacher/homeroom' },
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
      ],
    },

    {
      label: 'Aktivitetet',
      icon: BookOpen,
      children: [
        { label: 'Aktivitetet', path: '/extracurricular' },
      ],
    },

    {
      label: 'Raportet',
      icon: BarChart3,
      children: [
        { label: 'Akademike', path: '/reports' },
        { label: 'Prezenca', path: '/reports' },
        { label: 'Disiplina', path: '/reports' },
      ],
    },

    { label: 'Njoftimet', path: '/announcements', icon: Megaphone },

    { label: 'Profili', path: '/profile', icon: Users },
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
        { label: 'Kujdestaria dhe raportet', path: '/teacher/homeroom' },
        { label: 'Dokumentet', path: '/documents/my-documents' },
      ],
    },
    { label: 'Stafi', path: '/staff', icon: Users },
    { label: 'Njoftime', path: '/announcements', icon: Megaphone },
    { label: 'Cilësimet', path: '/settings', icon: Settings },
    { label: 'Profili', path: '/profile', icon: Users },
  ],
  [ROLES.CASHIER]: [
    { label: 'Paneli', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Cilësimet', path: '/settings', icon: Settings },
    { label: 'Profili', path: '/profile', icon: Users },
  ],
  [ROLES.TEACHER]: [
    { label: 'Paneli', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Klasat e mia', path: '/classes', icon: Calendar },
    { label: 'Prezenca', path: '/classes', icon: CheckSquare },
    { label: 'Notat', path: '/classes', icon: NotebookPen },
    { label: 'Nxenesit', path: '/students', icon: Users },
    { label: 'Mbikeqyrja', path: '/discipline', icon: Shield },
    { label: 'Cilësimet', path: '/settings', icon: Settings },
    { label: 'Profili', path: '/profile', icon: Users },
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
        { label: 'Oret e mesimit', path: '/dormitory/rooms' },
        { label: 'Namazi i sabahut', path: '/dormitory/rooms' },
      ],
    },
    { label: 'Raporte', path: '/reports', icon: FileText },
    { label: 'Cilësimet', path: '/settings', icon: Settings },
    { label: 'Profili', path: '/profile', icon: Users },
  ],
  [ROLES.STUDENT]: [
    { label: 'Paneli im', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Orari', path: '/timetable', icon: Calendar },
    { label: 'Notat e mia', path: '/dashboard', icon: BarChart3 },
    { label: 'Prezenca ime', path: '/attendance/reports', icon: CheckSquare },
    { label: 'Njoftime', path: '/announcements', icon: Megaphone },
    { label: 'Dokumentet', path: '/documents/my-documents', icon: Download },
    { label: 'Disiplina', path: '/discipline/my-record', icon: Gavel },
    { label: 'Cilësimet', path: '/settings', icon: Settings },
    { label: 'Profili', path: '/profile', icon: Users },
  ],
  [ROLES.BOARDING]: [
    { label: 'Paneli im', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Orari', path: '/timetable', icon: Calendar },
    { label: 'Notat e mia', path: '/dashboard', icon: BarChart3 },
    { label: 'Prezenca ime', path: '/attendance/reports', icon: CheckSquare },
    { label: 'Njoftime', path: '/announcements', icon: Megaphone },
    { label: 'Dokumentet', path: '/documents/my-documents', icon: Download },
    { label: 'Disiplina', path: '/discipline/my-record', icon: Gavel },
    { label: 'Dhoma ime', path: '/dormitory/my-room', icon: Home },
    { label: 'Raportet e pastertise', path: '/dormitory/inspections', icon: Sparkles },
    { label: 'Oret e mesimit', path: '/dormitory/rooms', icon: BookOpen },
    { label: 'Prezenca ne sabah', path: '/dormitory/rooms', icon: Sun },
    { label: 'Verejtjet e edukatorit', path: '/discipline/my-record', icon: Gavel },
    { label: 'Cilësimet', path: '/settings', icon: Settings },
    { label: 'Profili', path: '/profile', icon: Users },
  ],
}

export function getNavForRole(role) {
  if (role === ROLES.TEACHER) return [
    { label: 'Paneli im', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Klasat e mia', path: '/classes', icon: GraduationCap },
    { label: 'Orari mësimor', path: '/timetable', icon: Calendar },
    { label: 'Njoftimet', path: '/announcements', icon: Megaphone },
    { label: 'Kujdestaria', path: '/teacher/homeroom', icon: Users },
    { label: 'Materiale dhe publikime', path: '/portal/publish', icon: BookOpen },
    { label: 'Profili', path: '/profile', icon: Users },
    { label: 'Cilësimet', path: '/settings', icon: Settings },
  ]
  if ([ROLES.STUDENT, ROLES.BOARDING].includes(role)) return [
    { label: 'Paneli im', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Mësimet aktuale', path: '/student/lessons', icon: BookOpen },
    { label: 'Detyrat e mia', path: '/student/assignments', icon: ClipboardList },
    { label: 'Kalendari', path: '/student/calendar', icon: Calendar },
    { label: 'Orari mësimor', path: '/student/timetable', icon: Calendar },
    { label: 'Notat dhe suksesi', path: '/student/grades', icon: BarChart3 },
    { label: 'Prezenca ime', path: '/student/attendance', icon: CheckSquare },
    { label: 'Njoftimet e mia', path: '/student/notifications', icon: Megaphone },
    { label: 'Njoftimet e klasës', path: '/student/announcements', icon: Megaphone },
    { label: 'Materiale dhe dokumente', path: '/student/materials', icon: FileText },
    { label: 'Grupet dhe aktivitetet', path: '/student/groups', icon: Users },
    { label: 'Njoftimet e shkollës', path: '/announcements', icon: Megaphone },
    { label: 'Disiplina', path: '/discipline/my-record', icon: Gavel },
    ...(role === ROLES.BOARDING ? [{ label: 'Dhoma ime', path: '/dormitory/my-room', icon: Home }] : []),
    { label: 'Kuize online', path: '/student/quizzes', icon: Sparkles, badge: 'Në plan' },
    { label: 'Profili', path: '/profile', icon: Users },
    { label: 'Cilësimet', path: '/settings', icon: Settings },
  ]
  if ([ROLES.DIRECTOR, ROLES.SECRETARY, ROLES.TEACHER].includes(role)) return [
    ...NAV_BY_ROLE[role], { label: 'Publikime për nxënësit', path: '/portal/publish', icon: BookOpen },
  ]
  return NAV_BY_ROLE[role] || [
    { label: 'Cilësimet', path: '/settings', icon: Settings },
    { label: 'Profili', path: '/profile', icon: Users },
  ]
}

export function canAccessRoute(role, path) {
  if (role === ROLES.TEACHER && path.startsWith('/teacher/classes/')) return true
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
