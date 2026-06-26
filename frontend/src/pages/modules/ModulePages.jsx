import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { Input, Label, Select } from '@/components/ui/Input'
import { roomInspections, disciplineRecords, extracurricularActivities, announcements } from '@/data/mockData'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function DormitoryPage() {
  return (
    <div>
      <PageHeader title="Dormitory Overview" description="142 boarding students across Block A & B" />
      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardContent><p className="text-xs text-surface-300">Block A</p><p className="text-3xl font-mono text-surface-50 mt-1">72</p><p className="text-xs text-surface-700">students</p></CardContent></Card>
        <Card><CardContent><p className="text-xs text-surface-300">Block B</p><p className="text-3xl font-mono text-surface-50 mt-1">70</p><p className="text-xs text-surface-700">students</p></CardContent></Card>
      </div>
    </div>
  )
}

export function RoomsPage() {
  const columns = [
    { key: 'room', label: 'Room' },
    { key: 'score', label: 'Inspection Score' },
  ]
  return (
    <div>
      <PageHeader title="Room Assignments" description="Dormitory room layout and assignments" />
      <DataTable columns={columns} data={roomInspections.map((r, i) => ({ id: i, ...r }))} />
    </div>
  )
}

export function InspectionsPage() {
  return (
    <div>
      <PageHeader title="Room Inspections" description="Cleanliness and dormitory inspections" actions={<Button>New Inspection</Button>} />
      <div className="space-y-3">
        {roomInspections.map((r) => (
          <Card key={r.room}>
            <CardContent className="flex justify-between items-center">
              <span className="text-surface-200">{r.room}</span>
              <Badge variant={r.tone === 'success' ? 'success' : r.tone === 'warning' ? 'warning' : 'red'}>{r.score}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function MyRoomPage() {
  return (
    <div>
      <PageHeader title="My Room" description="Block A — Room 103" />
      <Card>
        <CardContent className="space-y-3">
          <div className="flex justify-between"><span className="text-surface-300">Roommates</span><span>Ibrahim, Khalid</span></div>
          <div className="flex justify-between"><span className="text-surface-300">Last Inspection</span><Badge variant="warning">6.5/10</Badge></div>
          <div className="flex justify-between"><span className="text-surface-300">Educator</span><span>Yusuf Ali</span></div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DisciplinePage() {
  const columns = [
    { key: 'student', label: 'Student' },
    { key: 'category', label: 'Category', render: (r) => <Badge variant={r.category === 'Positive' ? 'success' : 'amber'}>{r.category}</Badge> },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'location', label: 'Location' },
  ]
  return (
    <div>
      <PageHeader title="Discipline Records" description="Behavioral remarks and incidents" actions={<Button>Record Incident</Button>} />
      <DataTable columns={columns} data={disciplineRecords} />
    </div>
  )
}

export function DisciplineRecordPage() {
  return (
    <div>
      <PageHeader title="Record Discipline" description="Log a new behavioral remark" />
      <Card className="max-w-xl">
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Student</Label><Select><option>Ali Kaya</option><option>Omar Hassan</option></Select></div>
          <div className="space-y-2"><Label>Category</Label><Select><option>Positive</option><option>Minor</option><option>Moderate</option><option>Serious</option></Select></div>
          <div className="space-y-2"><Label>Location</Label><Select><option>Classroom</option><option>Dormitory</option><option>Campus</option></Select></div>
          <div className="space-y-2"><Label>Description</Label><Input placeholder="Describe the incident..." /></div>
          <Button>Submit Record</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function MyDisciplinePage() {
  return (
    <div>
      <PageHeader title="My Discipline Record" description="Your behavioral history" />
      <Card><CardContent><p className="text-sm text-surface-300">No active discipline records. Keep up the good work!</p></CardContent></Card>
    </div>
  )
}

export function ExtracurricularPage() {
  const columns = [
    { key: 'name', label: 'Activity' },
    { key: 'type', label: 'Type', render: (r) => <Badge variant="purple">{r.type}</Badge> },
    { key: 'instructor', label: 'Instructor' },
    { key: 'enrolled', label: 'Enrolled', render: (r) => `${r.enrolled}/${r.capacity}` },
    { key: 'fee', label: 'Fee', render: (r) => r.fee ? `€${r.fee}/mo` : 'Free' },
  ]
  return (
    <div>
      <PageHeader title="Extracurricular Activities" description="Hifz program and other activities" />
      <DataTable columns={columns} data={extracurricularActivities} />
    </div>
  )
}

export function AnnouncementsPage() {
  return (
    <div>
      <PageHeader title="Announcements" description="School-wide notices and updates" actions={<Button>New Announcement</Button>} />
      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-surface-100">{a.title}</h3>
                  <p className="text-xs text-surface-700 mt-1">{formatDate(a.date)} — {a.author}</p>
                </div>
                {a.priority === 'high' && <Badge variant="red">High</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function GenericListPage({ title, description, items = [] }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent>
          {items.length > 0 ? (
            <ul className="space-y-2">{items.map((item) => <li key={item} className="text-surface-300">{item}</li>)}</ul>
          ) : (
            <p className="text-sm text-surface-300">This module is set up and ready for backend integration.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="System Settings" description="Configure school-wide settings" />
      <div className="grid md:grid-cols-2 gap-4">
        {['General', 'Academic Years', 'Notifications', 'Security'].map((section) => (
          <Card key={section}>
            <CardHeader><CardTitle className="text-base font-body font-medium">{section}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-surface-300">Configure {section.toLowerCase()} settings.</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  return (
    <div>
      <PageHeader title="Profile" description="Your account information" />
      <Card className="max-w-md">
        <CardContent className="space-y-3">
          <div><p className="text-xs text-surface-300">Name</p><p className="text-surface-100">{user?.name}</p></div>
          <div><p className="text-xs text-surface-300">Email</p><p className="font-mono text-sm">{user?.email}</p></div>
          <div><p className="text-xs text-surface-300">Role</p><Badge>{user?.role}</Badge></div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TimetablePage() {
  const schedule = [
    { time: '08:00', subject: 'Quran', room: '201' },
    { time: '09:00', subject: 'Mathematics', room: '105' },
    { time: '10:30', subject: 'Arabic', room: '203' },
    { time: '13:00', subject: 'Science', room: 'Lab 1' },
  ]
  return (
    <div>
      <PageHeader title="Timetable" description="Weekly class schedule" />
      <Card>
        <CardContent className="space-y-0">
          {schedule.map((s) => (
            <div key={s.time} className="flex gap-4 py-3 border-b border-white/5 text-sm">
              <span className="font-mono text-brand-400 w-12">{s.time}</span>
              <span className="flex-1 text-surface-200">{s.subject}</span>
              <span className="text-surface-700">Room {s.room}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function GradesPage() {
  return (
    <div>
      <PageHeader title="Grades & Assessments" description="Academic performance tracking" />
      <Card><CardContent><p className="text-sm text-surface-300">Grade entry and reports are available for teachers and directors.</p></CardContent></Card>
    </div>
  )
}
