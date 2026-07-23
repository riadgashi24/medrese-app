import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { api } from '@/lib/api'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import UsersManagementPage from '@/pages/users/UsersManagement'
import { StudentImportPage } from '@/pages/students/StudentImportPage'
import {
  FinanceOverviewPage,
  PaymentsPage,
  RecordPaymentPage,
  OutstandingPage,
  FinanceReportsPage,
  StudentPayPage,
  FeeStructurePage,
  InvoicesPage,
} from '@/pages/finance/FinancePages'
import {
  FajrAttendancePage,
  StudyHoursPage,
  AttendanceReportsPage,
} from '@/pages/modules/AcademicModules/Attendance/AttendancePages'
import {
  DormitoryPage,
  RoomsPage,
  InspectionsPage,
  MyRoomPage,
  DisciplinePage,
  DisciplineRecordPage,
  MyDisciplinePage,
  ExtracurricularPage,
  AnnouncementsPage,
  GenericListPage,
  SettingsPage,
  ProfilePage,
} from '@/pages/modules/ModulePages'
import GradesPage from '@/pages/modules/AcademicModules/GradesPage'
import TimetablePage from '@/pages/modules/AcademicModules/Timetable'
import ClassesPage from '@/pages/modules/AcademicModules/classes/ClassesPage'
import ClassDetailPage from '@/pages/modules/AcademicModules/classes/ClassDetail'
import { SubjectsPage } from './pages/modules/AcademicModules/Subject/SubjectsPage'
import { SubjectDetailPage } from './pages/modules/AcademicModules/Subject/SubjectDetailPage'
import { ClassSubjectReportPage } from './pages/modules/AcademicModules/Subject/ClassSubjectReportPage'
import { StudentFormPage } from './pages/students/StudentFormPage'
import { StudentDetailPage } from './pages/students/StudentDetailPage'
import { AllStudentsPage } from './pages/students/AllStudentsPage'
import { ClassStudentsPage } from './pages/students/ClassStudentsPage'
import ClassFormPage from './pages/modules/AcademicModules/classes/ClassFormPage'
import { AttendancePage } from './pages/modules/AcademicModules/Attendance/AttendancePage'

const queryClient = new QueryClient()

const staffColumns = [
  { key: 'name', label: 'Emri' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Roli' },
]

const mapStaffRow = (row) => ({
  ...row,
  name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.name || '-',
  email: row.email || row.user?.email || '-',
  role: row.role || (() => {
    const position = String(row.position || '').toLowerCase()
    if (position.includes('drejtor')) return 'director'
    if (position.includes('sekretar')) return 'secretary'
    if (position.includes('arkatar')) return 'cashier'
    return 'teacher'
  })(),
})

const simpleNameColumns = [
  { key: 'name', label: 'Emri' },
]

const academicYearColumns = [
  { key: 'label', label: 'Viti shkollor' },
  { key: 'is_active', label: 'Statusi', render: (row) => (row.is_active ? 'Aktiv' : 'Joaktiv') },
]

const documentColumns = [
  { key: 'title', label: 'Titulli' },
  { key: 'visibility', label: 'Dukshmeria' },
]

const assignmentColumns = [
  { key: 'title', label: 'Titulli' },
  { key: 'subject', label: 'Lenda' },
  { key: 'due_date', label: 'Afati' },
]

function DashboardRoute() {
  const { user } = useAuth()
  return <DashboardPage role={user?.role} />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Students */}
        <Route path="/students" element={<AllStudentsPage />} />
        <Route path="/students/new" element={<StudentFormPage mode="create" />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/students/:id/edit" element={<StudentFormPage mode="edit" />} />
        <Route path="/students/import" element={<StudentImportPage />} />

        {/* Staff lists */}
        <Route path="/staff" element={<GenericListPage title="Stafi" description="Lista e stafit" loader={() => api.staff.index()} columns={staffColumns} mapRow={mapStaffRow} />} />

        {/* Academic */}
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/subjects/:id" element={<SubjectDetailPage />} />
        <Route path="/subjects/:subjectId/class/:classId" element={<ClassSubjectReportPage />} />

        {/* <Route path="/academic-years" element={<AcademicYearsPage />} /> */}
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/classes/:id" element={<ClassDetailPage />} />
        <Route path="/classes/:classId/students" element={<ClassStudentsPage />} />
        <Route path="/classes/:classId/students/:id" element={<StudentDetailPage />} />
        <Route path="/classes/:classId/students/:id/edit" element={<StudentFormPage mode="edit" />} />
        <Route path="/classes/new" element={<ClassFormPage mode="create" />} />
        <Route path="/classes/:id/edit" element={<ClassFormPage mode="edit" />} />
        {/* <Route path="/classes/:id/subjects" element={<SubjectsPage />} /> */}


        {/* Finance */}
        <Route path="/finance" element={<FinanceOverviewPage />} />
        <Route path="/finance/payments" element={<PaymentsPage />} />
        <Route path="/finance/payments/new" element={<RecordPaymentPage />} />
        <Route path="/finance/invoices" element={<InvoicesPage />} />
        <Route path="/finance/outstanding" element={<OutstandingPage />} />
        <Route path="/finance/reports" element={<FinanceReportsPage />} />
        <Route path="/finance/pay" element={<StudentPayPage />} />

        {/* Dormitory */}
        <Route path="/dormitory" element={<DormitoryPage />} />
        <Route path="/dormitory/rooms" element={<RoomsPage />} />
        <Route path="/dormitory/inspections" element={<InspectionsPage />} />
        <Route path="/dormitory/my-room" element={<MyRoomPage />} />

        {/* Attendance */}
        <Route path="/classes/:id/attendance" element={<AttendancePage />} />
        <Route path="/classes/:id/attendance/take" element={<AttendancePage />} />
        <Route path="/classes/:id/attendance/fajr" element={<FajrAttendancePage />} />
        <Route path="/classes/:id/attendance/study-hours" element={<StudyHoursPage />} />
        <Route path="/classes/:id/attendance/reports" element={<AttendanceReportsPage />} />

        {/* Grades */}
        <Route path="/classes/:id/grades" element={<GradesPage />} />
        <Route path="/classes/:id/grades/entry" element={<GradesPage />} />
        <Route path="/classes/:id/grades/exams" element={<GradesPage />} />
        <Route path="/classes/:id/grades/reports" element={<GradesPage />} />
        <Route path="/classes/:id/grades/transcripts" element={<GradesPage />} />

        {/* Discipline */}
        <Route path="/discipline" element={<DisciplinePage />} />
        <Route path="/discipline/record" element={<DisciplineRecordPage />} />
        <Route path="/discipline/history" element={<DisciplinePage />} />
        <Route path="/discipline/my-record" element={<MyDisciplinePage />} />

        {/* Other modules */}
        <Route path="/extracurricular" element={<ExtracurricularPage />} />
        <Route path="/extracurricular/hifz" element={<ExtracurricularPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/reports" element={<FinanceReportsPage />} />
        {/* <Route path="/documents" element={<DocumentsPage />} /> */}
        <Route path="/documents/my-documents" element={<GenericListPage title="Dokumentet e mia" description="Certifikatat dhe dokumentet e tua" loader={api.documents.myDocuments} columns={documentColumns} mapRow={(row) => row.document || row} />} />
        {/* <Route path="/assignments" element={<AssignmentsPage />} /> */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/fee-structure" element={<FeeStructurePage />} />
        <Route path="/users" element={<UsersManagementPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
