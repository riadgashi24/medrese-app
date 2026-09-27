import { ROLES } from '@/data/mockData'
import { lazy } from 'react'

const DirectorDashboard = lazy(() => import('./DirectorDashboard').then(m => ({ default: m.DirectorDashboard })))
const SecretaryDashboard = lazy(() => import('./SecretaryDashboard').then(m => ({ default: m.SecretaryDashboard })))
const CashierDashboard = lazy(() => import('./CashierDashboard').then(m => ({ default: m.CashierDashboard })))
const TeacherDashboard = lazy(() => import('./TeacherDashboard').then(m => ({ default: m.TeacherDashboard })))
const EducatorDashboard = lazy(() => import('./EducatorDashboard').then(m => ({ default: m.EducatorDashboard })))
const StudentDashboard = lazy(() => import('./StudentDashboard').then(m => ({ default: m.StudentDashboard })))

export function DashboardPage({ role }) {
  switch (role) {
    case ROLES.DIRECTOR:
      return <DirectorDashboard />
    case ROLES.SECRETARY:
      return <SecretaryDashboard />
    case ROLES.CASHIER:
      return <CashierDashboard />
    case ROLES.TEACHER:
      return <TeacherDashboard />
    case ROLES.EDUCATOR:
      return <EducatorDashboard />
    case ROLES.STUDENT:
    case ROLES.BOARDING:
      return <StudentDashboard isBoarding={role === ROLES.BOARDING} />
    default:
      return <p role="alert">Llogaria nuk ka rol të njohur. Kontaktoni administratorin.</p>
  }
}
