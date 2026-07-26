export const ROLES = {
  DIRECTOR: 'director',
  SECRETARY: 'secretary',
  CASHIER: 'cashier',
  TEACHER: 'teacher',
  EDUCATOR: 'educator',
  STUDENT: 'student',
  BOARDING: 'boarding',
}

export const ROLE_LABELS = {
  [ROLES.DIRECTOR]: 'Drejtor',
  [ROLES.SECRETARY]: 'Sekretar',
  [ROLES.CASHIER]: 'Arkatar',
  [ROLES.TEACHER]: 'Mesues',
  [ROLES.EDUCATOR]: 'Edukator',
  [ROLES.STUDENT]: 'Nxenes',
  [ROLES.BOARDING]: 'Nxenes konviktor',
}

export const DEMO_USERS = [
  {
    id: '1',
    email: 'director@medrese.edu',
    password: 'demo123',
    name: 'Ahmed Hassan',
    role: ROLES.DIRECTOR,
    initials: 'AH',
  },
  {
    id: '2',
    email: 'secretary@medrese.edu',
    password: 'demo123',
    name: 'Fatima Oz',
    role: ROLES.SECRETARY,
    initials: 'FO',
  },
  {
    id: '3',
    email: 'cashier@medrese.edu',
    password: 'demo123',
    name: 'Emre Yilmaz',
    role: ROLES.CASHIER,
    initials: 'EY',
  },
  {
    id: '4',
    email: 'teacher@medrese.edu',
    password: 'demo123',
    name: 'Mehmet Kaya',
    role: ROLES.TEACHER,
    initials: 'MK',
  },
  {
    id: '5',
    email: 'educator@medrese.edu',
    password: 'demo123',
    name: 'Yusuf Ali',
    role: ROLES.EDUCATOR,
    initials: 'YA',
  },
  {
    id: '38',
    email: 'dren.shala1@medrese.edu',
    password: 'demo123',
    name: 'Ahmet Yilmaz',
    role: ROLES.STUDENT,
    initials: 'DSH',
    studentId: 'STD-2024-0042',
    className: '10-1',
  },
  {
    id: '39',
    email: 'alban.rama2@medrese.edu',
    password: 'demo123',
    name: 'Alban Rama',
    role: ROLES.BOARDING,
    initials: 'OH',
    studentId: 'STD-2024-0088',
    className: '11B',
    room: 'Block A — Room 103',
  },
]

export const students = [
  { id: '1', name: 'Ahmet Yilmaz', studentId: 'STD-2024-0042', className: '10A', type: 'Regular', status: 'Active', balance: 0 },
  { id: '2', name: 'Fatima Oz', studentId: 'STD-2024-0015', className: '9A', type: 'Boarding', status: 'Active', balance: 85 },
  { id: '3', name: 'Ali Kaya', studentId: 'STD-2024-0033', className: '10B', type: 'Boarding', status: 'Active', balance: 0 },
  { id: '4', name: 'Ayşe Demir', studentId: 'STD-2024-0056', className: '11A', type: 'Regular', status: 'Active', balance: 15 },
  { id: '5', name: 'Omar Hassan', studentId: 'STD-2024-0088', className: '11B', type: 'Boarding', status: 'Active', balance: 170 },
  { id: '6', name: 'Zeynep Arslan', studentId: 'STD-2024-0091', className: '12A', type: 'Regular', status: 'Active', balance: 0 },
  { id: '7', name: 'Hasan Bilal', studentId: 'STD-2024-0027', className: '9B', type: 'Boarding', status: 'Active', balance: 85 },
  { id: '8', name: 'Mariam Khalid', studentId: 'STD-2024-0064', className: '10A', type: 'Boarding', status: 'Active', balance: 0 },
]

export const payments = [
  { id: '1', student: 'Ahmet Yilmaz', type: 'Meal Fee', amount: 15, method: 'Online', date: '2026-06-20', status: 'Completed' },
  { id: '2', student: 'Fatima Oz', type: 'Dormitory Fee', amount: 85, method: 'Cash', date: '2026-06-19', status: 'Completed' },
  { id: '3', student: 'Omar Hassan', type: 'Dormitory Fee', amount: 85, method: 'Transfer', date: '2026-06-18', status: 'Pending' },
  { id: '4', student: 'Ayşe Demir', type: 'Meal Fee', amount: 15, method: 'Online', date: '2026-06-17', status: 'Completed' },
  { id: '5', student: 'Ali Kaya', type: 'Hifz Program', amount: 30, method: 'Cash', date: '2026-06-16', status: 'Completed' },
]

export const announcements = [
  { id: '1', title: 'Mid-term exam schedule published', author: 'Director', date: '2026-06-23', priority: 'high' },
  { id: '2', title: 'Dormitory cleaning schedule updated', author: 'Admin', date: '2026-06-22', priority: 'normal' },
  { id: '3', title: 'Hifz program registration open', author: 'Director', date: '2026-06-20', priority: 'normal' },
  { id: '4', title: 'Parent-teacher meeting next Friday', author: 'Secretary', date: '2026-06-18', priority: 'high' },
]

export const disciplineRecords = [
  { id: '1', student: 'Ali K.', category: 'Minor', description: 'Late to morning class', date: '2026-06-22', location: 'Classroom' },
  { id: '2', student: 'Hasan B.', category: 'Positive', description: 'Helped organize dormitory event', date: '2026-06-21', location: 'Dormitory' },
  { id: '3', student: 'Omar H.', category: 'Moderate', description: 'Repeated dress code violation', date: '2026-06-20', location: 'Campus' },
]

export const attendanceOverview = [
  { day: 'Mon', present: 95 },
  { day: 'Tue', present: 92 },
  { day: 'Wed', present: 97 },
  { day: 'Thu', present: 94 },
  { day: 'Fri', present: 96 },
  { day: 'Sat', present: 88 },
]

export const classPerformance = [
  { class: '9A', score: 78 },
  { class: '9B', score: 72 },
  { class: '10A', score: 81 },
  { class: '10B', score: 68 },
  { class: '11A', score: 75 },
  { class: '12A', score: 85 },
]

export const fajrTrend = [
  { week: 'W1', rate: 82 },
  { week: 'W2', rate: 85 },
  { week: 'W3', rate: 83 },
  { week: 'W4', rate: 88 },
  { week: 'W5', rate: 86 },
  { week: 'W6', rate: 89 },
  { week: 'W7', rate: 91 },
  { week: 'W8', rate: 89 },
]

export const revenueByCategory = [
  { category: 'Meal Fees', amount: 3720 },
  { category: 'Dormitory', amount: 12060 },
  { category: 'Hifz', amount: 1800 },
  { category: 'Other', amount: 840 },
]

export const enrollmentByClass = [
  { class: '7A', count: 22 },
  { class: '7B', count: 20 },
  { class: '8A', count: 25 },
  { class: '8B', count: 24 },
  { class: '9A', count: 28 },
  { class: '9B', count: 26 },
  { class: '10A', count: 30 },
  { class: '10B', count: 27 },
  { class: '11A', count: 24 },
  { class: '12A', count: 22 },
]

export const recentActivity = [
  { text: 'Payment received — Ahmet Yilmaz', value: '€85', tone: 'success' },
  { text: 'New student enrolled — Fatima Oz', value: 'Class 9A', tone: 'info' },
  { text: 'Attendance marked — Class 10B', value: '28/30', tone: 'neutral' },
  { text: 'Dormitory inspection — Block A', value: 'Needs attention', tone: 'warning' },
]

export const teacherSchedule = [
  { time: '08:00', subject: 'Mathematics — 9A', status: 'Done' },
  { time: '09:00', subject: 'Mathematics — 9B', status: 'Done' },
  { time: '10:30', subject: 'Algebra — 10A', status: 'In Progress' },
  { time: '13:00', subject: 'Geometry — 11A', status: 'Upcoming' },
  { time: '14:00', subject: 'Mathematics — 12A', status: 'Upcoming' },
]

export const roomInspections = [
  { room: 'Room 101 — Ahmed, Yusuf, Omar', score: '9.5/10', tone: 'success' },
  { room: 'Room 102 — Ali, Hasan, Bilal', score: '8.0/10', tone: 'success' },
  { room: 'Room 103 — Ibrahim, Khalid', score: '6.5/10', tone: 'warning' },
  { room: 'Room 104 — Mustafa, Isa', score: '4.0/10', tone: 'danger' },
]

export const extracurricularActivities = [
  { id: '1', name: 'Hifz Program', type: 'hifz', instructor: 'Ustadh Ibrahim', capacity: 40, enrolled: 32, fee: 30 },
  { id: '2', name: 'Football Club', type: 'sports', instructor: 'Coach Emre', capacity: 25, enrolled: 22, fee: 0 },
  { id: '3', name: 'Arabic Calligraphy', type: 'arts', instructor: 'Sister Amina', capacity: 15, enrolled: 12, fee: 10 },
]

export const feeStructure = [
  { name: 'Monthly Meal Fee (Regular)', amount: 15 },
  { name: 'Monthly Meal Fee (Boarding)', amount: 15 },
  { name: 'Dormitory Fee (Boarding)', amount: 85 },
  { name: 'Hifz Program Fee', amount: 'Configurable' },
  { name: 'Late Payment Penalty', amount: 'Optional' },
]
