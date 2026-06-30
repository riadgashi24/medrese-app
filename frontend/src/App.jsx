import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { api } from '@/lib/api'
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

const staffColumns = [
  { key: 'name', label: 'Emri' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Roli' },
]

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
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/new" element={<StudentFormPage mode="create" />} />
        <Route path="/students/import" element={<StudentImportPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/students/:id/edit" element={<StudentFormPage mode="edit" />} />

        {/* Staff lists */}
        <Route path="/teachers" element={<GenericListPage title="Mesuesit" description="Lista e stafit mesimor" loader={() => api.staff.index({ role: 'teacher' })} columns={staffColumns} />} />
        <Route path="/educators" element={<GenericListPage title="Edukatoret" description="Edukatoret e konviktit" loader={() => api.staff.index({ role: 'educator' })} columns={staffColumns} />} />
        <Route path="/cashiers" element={<GenericListPage title="Arkataret" description="Stafi financiar" loader={() => api.staff.index({ role: 'cashier' })} columns={staffColumns} />} />
        <Route path="/secretaries" element={<GenericListPage title="Sekretaret" description="Stafi administrativ" loader={() => api.staff.index({ role: 'secretary' })} columns={staffColumns} />} />

        {/* Academic */}
        <Route path="/classes" element={<GenericListPage title="Klasat" description="Menaxhimi i klasave dhe paraleleve" loader={api.classes.index} columns={simpleNameColumns} />} />
        <Route path="/subjects" element={<GenericListPage title="Lendet" description="Lendet mesimore" loader={api.academic.subjects} columns={simpleNameColumns} />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/academic-years" element={<GenericListPage title="Vitet shkollore" description="Menaxhimi i kalendarit akademik" loader={api.academic.academicYears} columns={academicYearColumns} />} />

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
        <Route path="/documents" element={<GenericListPage title="Dokumentet" description="Dokumente zyrtare dhe certifikata" loader={api.documents.index} columns={documentColumns} />} />
        <Route path="/documents/my-documents" element={<GenericListPage title="Dokumentet e mia" description="Certifikatat dhe dokumentet e tua" loader={api.documents.myDocuments} columns={documentColumns} mapRow={(row) => row.document || row} />} />
        <Route path="/assignments" element={<GenericListPage title="Detyrat" description="Materiale dhe detyra mesimore" loader={api.assignments.index} columns={assignmentColumns} mapRow={(row) => ({ ...row, subject: row.subject?.name || '-' })} />} />
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
