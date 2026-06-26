import { ROLES } from '@/data/mockData'
import { DirectorDashboard } from './DirectorDashboard'
import { SecretaryDashboard } from './SecretaryDashboard'
import { CashierDashboard } from './CashierDashboard'
import { TeacherDashboard } from './TeacherDashboard'
import { EducatorDashboard } from './EducatorDashboard'
import { StudentDashboard } from './StudentDashboard'

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
      return <DirectorDashboard />
  }
}
