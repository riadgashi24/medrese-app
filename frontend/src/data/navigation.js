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
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      label: 'User Management',
      icon: Users,
      children: [
        { label: 'Students', path: '/students' },
        { label: 'Teachers', path: '/teachers' },
        { label: 'Educators', path: '/educators' },
        { label: 'Cashiers', path: '/cashiers' },
        { label: 'Secretaries', path: '/secretaries' },
      ],
    },
    {
      label: 'Academic',
      icon: GraduationCap,
      children: [
        { label: 'Classes', path: '/classes' },
        { label: 'Subjects', path: '/subjects' },
        { label: 'Timetable', path: '/timetable' },
        { label: 'Academic Years', path: '/academic-years' },
      ],
    },
    {
      label: 'Finance',
      icon: DollarSign,
      children: [
        { label: 'Overview', path: '/finance' },
        { label: 'Payments', path: '/finance/payments' },
        { label: 'Outstanding', path: '/finance/outstanding' },
        { label: 'Reports', path: '/finance/reports' },
      ],
    },
    {
      label: 'Dormitory',
      icon: Building2,
      children: [
        { label: 'Overview', path: '/dormitory' },
        { label: 'Rooms', path: '/dormitory/rooms' },
        { label: 'Inspections', path: '/dormitory/inspections' },
      ],
    },
    { label: 'Attendance', path: '/attendance', icon: CheckSquare },
    { label: 'Grades', path: '/grades', icon: NotebookPen },
    { label: 'Discipline', path: '/discipline', icon: Gavel },
    { label: 'Extracurricular', path: '/extracurricular', icon: BookOpen },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Announcements', path: '/announcements', icon: Megaphone },
    { label: 'Settings', path: '/settings', icon: Settings },
  ],
  [ROLES.SECRETARY]: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Registration',
      icon: UserPlus,
      children: [
        { label: 'Enroll Student', path: '/students/new' },
        { label: 'Bulk Import', path: '/students/import' },
      ],
    },
    {
      label: 'Student Records',
      icon: ClipboardList,
      children: [
        { label: 'All Students', path: '/students' },
        { label: 'Class Assignments', path: '/classes' },
        { label: 'Documents', path: '/documents' },
      ],
    },
    { label: 'Staff Directory', path: '/teachers', icon: Users },
    { label: 'Financial Reports', path: '/finance/reports', icon: PieChart, badge: 'View Only' },
    { label: 'Announcements', path: '/announcements', icon: Megaphone },
    { label: 'Profile', path: '/profile', icon: Users },
  ],
  [ROLES.CASHIER]: [
    { label: 'Finance Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Payments',
      icon: Receipt,
      children: [
        { label: 'Record Payment', path: '/finance/payments/new' },
        { label: 'Payment History', path: '/finance/payments' },
      ],
    },
    { label: 'Invoices', path: '/finance/invoices', icon: FileText },
    { label: 'Outstanding', path: '/finance/outstanding', icon: AlertCircle },
    { label: 'Reports', path: '/finance/reports', icon: PieChart },
    { label: 'Fee Configuration', path: '/settings/fee-structure', icon: Settings },
  ],
  [ROLES.TEACHER]: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Classes', path: '/classes', icon: Calendar },
    { label: 'Attendance', path: '/attendance', icon: CheckSquare },
    {
      label: 'Grades',
      icon: NotebookPen,
      children: [
        { label: 'Grade Entry', path: '/grades/entry' },
        { label: 'Exams', path: '/grades/exams' },
        { label: 'Reports', path: '/grades/reports' },
      ],
    },
    { label: 'Assignments', path: '/assignments', icon: Upload },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Supervisor', path: '/discipline', icon: Shield },
  ],
  [ROLES.EDUCATOR]: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Boarding Students',
      icon: Bed,
      children: [
        { label: 'All Boarders', path: '/dormitory' },
        { label: 'Room Assignments', path: '/dormitory/rooms' },
      ],
    },
    {
      label: 'Discipline',
      icon: Gavel,
      children: [
        { label: 'Record Remarks', path: '/discipline/record' },
        { label: 'History', path: '/discipline/history' },
      ],
    },
    { label: 'Inspections', path: '/dormitory/inspections', icon: Sparkles },
    {
      label: 'Attendance',
      icon: CheckSquare,
      children: [
        { label: 'Study Hours', path: '/attendance/study-hours' },
        { label: 'Fajr Prayer', path: '/attendance/fajr' },
      ],
    },
    { label: 'Reports', path: '/reports', icon: FileText },
  ],
  [ROLES.STUDENT]: [
    { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Timetable', path: '/timetable', icon: Calendar },
    { label: 'My Grades', path: '/grades/reports', icon: BarChart3 },
    { label: 'My Attendance', path: '/attendance/reports', icon: CheckSquare },
    { label: 'Announcements', path: '/announcements', icon: Megaphone },
    { label: 'Documents', path: '/documents/my-documents', icon: Download },
    { label: 'Payment Status', path: '/finance/pay', icon: CreditCard },
    { label: 'Discipline', path: '/discipline/my-record', icon: Gavel },
    { label: 'Assignments', path: '/assignments', icon: BookOpen },
  ],
  [ROLES.BOARDING]: [
    { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Timetable', path: '/timetable', icon: Calendar },
    { label: 'My Grades', path: '/grades/reports', icon: BarChart3 },
    { label: 'My Attendance', path: '/attendance/reports', icon: CheckSquare },
    { label: 'Announcements', path: '/announcements', icon: Megaphone },
    { label: 'Documents', path: '/documents/my-documents', icon: Download },
    { label: 'Payment Status', path: '/finance/pay', icon: CreditCard },
    { label: 'Discipline', path: '/discipline/my-record', icon: Gavel },
    { label: 'Assignments', path: '/assignments', icon: BookOpen },
    { label: 'My Room', path: '/dormitory/my-room', icon: Home },
    { label: 'Pay Dormitory Fees', path: '/finance/pay', icon: Wallet },
    { label: 'Cleanliness Reports', path: '/dormitory/inspections', icon: Sparkles },
    { label: 'Study Hours', path: '/attendance/study-hours', icon: BookOpen },
    { label: 'Fajr Attendance', path: '/attendance/fajr', icon: Sun },
    { label: 'Educator Remarks', path: '/discipline/my-record', icon: Gavel },
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
