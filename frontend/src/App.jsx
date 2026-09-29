import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { api } from '@/lib/api'

const lazyNamed = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })))

const LoginPage = lazyNamed(() => import('@/pages/auth/LoginPage'), 'LoginPage')
const DashboardPage = lazyNamed(() => import('@/pages/dashboard/DashboardPage'), 'DashboardPage')
const UsersManagementPage = lazy(() => import('@/pages/users/UsersManagement'))
const StudentImportPage = lazyNamed(() => import('@/pages/students/StudentImportPage'), 'StudentImportPage')
const AttendancePages = () => import('@/pages/modules/AcademicModules/Attendance/AttendancePages')
const FajrAttendancePage = lazyNamed(AttendancePages, 'FajrAttendancePage')
const StudyHoursPage = lazyNamed(AttendancePages, 'StudyHoursPage')
const AttendanceReportsPage = lazyNamed(AttendancePages, 'AttendanceReportsPage')
const ModulePages = () => import('@/pages/modules/ModulePages')
const DormitoryPage = lazyNamed(ModulePages, 'DormitoryPage')
const RoomsPage = lazyNamed(ModulePages, 'RoomsPage')
const InspectionsPage = lazyNamed(ModulePages, 'InspectionsPage')
const InspectionFormPage = lazyNamed(ModulePages, 'InspectionFormPage')
const MyRoomPage = lazyNamed(ModulePages, 'MyRoomPage')
const LeaderboardPage = lazyNamed(ModulePages, 'LeaderboardPage')
const AbsenceApprovalPage = lazyNamed(ModulePages, 'AbsenceApprovalPage')
const DisciplinePage = lazyNamed(ModulePages, 'DisciplinePage')
const DisciplineRecordPage = lazyNamed(ModulePages, 'DisciplineRecordPage')
const MyDisciplinePage = lazyNamed(ModulePages, 'MyDisciplinePage')
const ExtracurricularPage = lazyNamed(ModulePages, 'ExtracurricularPage')
const AnnouncementsPage = lazyNamed(ModulePages, 'AnnouncementsPage')
const GenericListPage = lazyNamed(ModulePages, 'GenericListPage')
const StaffPages = () => import('@/pages/staff/StaffPages')
const StaffPage = lazyNamed(StaffPages, 'StaffPage')
const StaffFormPage = lazyNamed(StaffPages, 'StaffFormPage')
const StaffDetailPage = lazyNamed(StaffPages, 'StaffDetailPage')
const SettingsPage = lazyNamed(ModulePages, 'SettingsPage')
const ProfilePage = lazyNamed(ModulePages, 'ProfilePage')
const GradesPage = lazy(() => import('@/pages/modules/AcademicModules/GradesPage'))
const TimetablePage = lazy(() => import('@/pages/modules/AcademicModules/Timetable'))
const ClassesPage = lazy(() => import('@/pages/modules/AcademicModules/classes/ClassesPage'))
const ClassDetailPage = lazy(() => import('@/pages/modules/AcademicModules/classes/ClassDetail'))
const SubjectsPage = lazyNamed(() => import('./pages/modules/AcademicModules/Subject/SubjectsPage'), 'SubjectsPage')
const SubjectDetailPage = lazyNamed(() => import('./pages/modules/AcademicModules/Subject/SubjectDetailPage'), 'SubjectDetailPage')
const ClassSubjectReportPage = lazyNamed(() => import('./pages/modules/AcademicModules/Subject/ClassSubjectReportPage'), 'ClassSubjectReportPage')
const StudentFormPage = lazyNamed(() => import('./pages/students/StudentFormPage'), 'StudentFormPage')
const StudentDetailPage = lazyNamed(() => import('./pages/students/StudentDetailPage'), 'StudentDetailPage')
const AllStudentsPage = lazyNamed(() => import('./pages/students/AllStudentsPage'), 'AllStudentsPage')
const ClassStudentsPage = lazyNamed(() => import('./pages/students/ClassStudentsPage'), 'ClassStudentsPage')
const ClassFormPage = lazy(() => import('./pages/modules/AcademicModules/classes/ClassFormPage'))
const AttendancePage = lazyNamed(() => import('./pages/modules/AcademicModules/Attendance/AttendancePage'), 'AttendancePage')
const AcademicYearsPage = lazy(() => import('./pages/modules/AcademicModules/AcademicYearsPage'))

const queryClient = new QueryClient()
const StudentPortalPage = lazyNamed(() => import('@/pages/students/StudentPortal'), 'StudentPortalPage')
const PortalPublishingPage = lazyNamed(() => import('@/pages/students/PortalPublishingPage'), 'PortalPublishingPage')
const TeacherPages = () => import('@/pages/teachers/TeacherWorkspace')
const TeacherClassesPage = lazyNamed(TeacherPages, 'TeacherClassesPage')
const TeacherClassPage = lazyNamed(TeacherPages, 'TeacherClassPage')
const TeacherCoursePage = lazyNamed(TeacherPages, 'TeacherCoursePage')
const TeacherSchedulePage = lazyNamed(TeacherPages, 'TeacherSchedulePage')
const TeacherHomeroomPage = lazyNamed(TeacherPages, 'TeacherHomeroomPage')

function ClassesRoute() {
  const { user } = useAuth()
  return user?.role === 'teacher' ? <TeacherClassesPage /> : <ClassesPage />
}
function ClassRoute() {
  const { user } = useAuth()
  return user?.role === 'teacher' ? <TeacherClassPage /> : <ClassDetailPage />
}
function TimetableRoute() {
  const { user } = useAuth()
  return user?.role === 'teacher' ? <TeacherSchedulePage /> : <TimetablePage />
}

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
    <Suspense fallback={<div className="p-6 text-sm text-surface-300">Duke ngarkuar...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/student/:section" element={<StudentPortalPage />} />
          <Route path="/portal/publish" element={<PortalPublishingPage />} />
          <Route path="/teacher/classes/:classId/subjects/:subjectId" element={<TeacherCoursePage />} />
          <Route path="/teacher/homeroom" element={<TeacherHomeroomPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Students */}
          <Route path="/students" element={<AllStudentsPage />} />
          <Route path="/students/new" element={<StudentFormPage mode="create" />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/students/:id/edit" element={<StudentFormPage mode="edit" />} />
          <Route path="/students/import" element={<StudentImportPage />} />

          {/* Staff lists */}
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/staff/new" element={<StaffFormPage />} />
          <Route path="/staff/:id" element={<StaffDetailPage />} />
          <Route path="/staff/:id/edit" element={<StaffFormPage />} />

          {/* Academic */}
          <Route path="/timetable" element={<TimetableRoute />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/:id" element={<SubjectDetailPage />} />
          <Route path="/subjects/:subjectId/class/:classId" element={<ClassSubjectReportPage />} />

          <Route path="/academic-years" element={<AcademicYearsPage />} />
          <Route path="/classes" element={<ClassesRoute />} />
          <Route path="/classes/:id" element={<ClassRoute />} />
          <Route path="/classes/:classId/students" element={<ClassStudentsPage />} />
          <Route path="/classes/:classId/students/:id" element={<StudentDetailPage />} />
          <Route path="/classes/:classId/students/:id/edit" element={<StudentFormPage mode="edit" />} />
          <Route path="/classes/new" element={<ClassFormPage mode="create" />} />
          <Route path="/classes/:id/edit" element={<ClassFormPage mode="edit" />} />

          {/* Dormitory */}
          <Route path="/dormitory" element={<DormitoryPage />} />
          <Route path="/dormitory/rooms" element={<RoomsPage />} />
          <Route path="/dormitory/inspections" element={<InspectionsPage />} />
          <Route path="/dormitory/inspections/new" element={<InspectionFormPage />} />
          <Route path="/dormitory/inspections/:id/edit" element={<InspectionFormPage />} />
          <Route path="/dormitory/my-room" element={<MyRoomPage />} />
          <Route path="/dormitory/leaderboard" element={<LeaderboardPage />} />

          {/* Attendance */}
          <Route path="/attendance/approval" element={<AbsenceApprovalPage />} />
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
          <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
          {/* <Route path="/documents" element={<DocumentsPage />} /> */}
          <Route path="/documents/my-documents" element={<GenericListPage title="Dokumentet e mia" description="Certifikatat dhe dokumentet e tua" loader={api.documents.myDocuments} columns={documentColumns} mapRow={(row) => row.document || row} />} />
          {/* <Route path="/assignments" element={<AssignmentsPage />} /> */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/users" element={<UsersManagementPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
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
