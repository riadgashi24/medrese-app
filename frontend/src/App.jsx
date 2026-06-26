import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import {
  StudentsPage,
  StudentFormPage,
  StudentDetailPage,
} from '@/pages/students/StudentsPage'
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
  AttendancePage,
  FajrAttendancePage,
  StudyHoursPage,
  AttendanceReportsPage,
} from '@/pages/attendance/AttendancePages'
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
  TimetablePage,
  GradesPage,
} from '@/pages/modules/ModulePages'

const queryClient = new QueryClient()

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
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/new" element={<StudentFormPage mode="create" />} />
        <Route path="/students/import" element={<StudentImportPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/students/:id/edit" element={<StudentFormPage mode="edit" />} />

        {/* Staff lists */}
        <Route path="/teachers" element={<GenericListPage title="Teachers" description="Staff directory — teachers" items={['Mehmet Kaya — Mathematics', 'Sister Amina — Arabic', 'Ustadh Ibrahim — Quran']} />} />
        <Route path="/educators" element={<GenericListPage title="Educators" description="Dormitory educators" items={['Yusuf Ali — Block A & B']} />} />
        <Route path="/cashiers" element={<GenericListPage title="Cashiers" description="Finance staff" items={['Emre Yilmaz']} />} />
        <Route path="/secretaries" element={<GenericListPage title="Secretaries" description="Administrative staff" items={['Fatima Oz']} />} />

        {/* Academic */}
        <Route path="/classes" element={<GenericListPage title="Classes" description="Class and section management" items={['7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '12A']} />} />
        <Route path="/subjects" element={<GenericListPage title="Subjects" description="Curriculum subjects" items={['Mathematics', 'Arabic', 'Quran', 'Science', 'History']} />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/academic-years" element={<GenericListPage title="Academic Years" description="Manage academic calendar" items={['2025–2026 (Active)', '2024–2025']} />} />

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
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/attendance/take" element={<AttendancePage />} />
        <Route path="/attendance/fajr" element={<FajrAttendancePage />} />
        <Route path="/attendance/study-hours" element={<StudyHoursPage />} />
        <Route path="/attendance/reports" element={<AttendanceReportsPage />} />

        {/* Grades */}
        <Route path="/grades" element={<GradesPage />} />
        <Route path="/grades/entry" element={<GradesPage />} />
        <Route path="/grades/exams" element={<GradesPage />} />
        <Route path="/grades/reports" element={<GradesPage />} />
        <Route path="/grades/transcripts" element={<GradesPage />} />

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
        <Route path="/documents" element={<GenericListPage title="Documents" description="Official documents and certificates" />} />
        <Route path="/documents/my-documents" element={<GenericListPage title="My Documents" description="Your certificates and transcripts" />} />
        <Route path="/assignments" element={<GenericListPage title="Assignments" description="Course materials and assignments" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/fee-structure" element={<FeeStructurePage />} />
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
