import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { Input, Label, Select } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

function useApiData(load, fallback = []) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function run() {
      try {
        const response = await load()
        if (mounted) setData(response?.data ?? fallback)
      } catch (err) {
        console.error(err)
        if (mounted) setError('Te dhenat nuk u ngarkuan.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [])

  return { data, loading, error }
}

function EmptyMessage({ loading, error, message = 'Nuk ka te dhena per t’u shfaqur.' }) {
  if (loading) return <p className="text-sm text-surface-300">Duke ngarkuar...</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>
  return <p className="text-sm text-surface-300">{message}</p>
}

function roomName(room) {
  return [room?.block, room?.name || room?.room_no || room?.number].filter(Boolean).join(' - ') || 'Dhome'
}

export function DormitoryPage() {
  const { data, loading, error } = useApiData(api.dormitory.overview, {})
  const rooms = data?.rooms ?? []

  return (
    <div>
      <PageHeader title="Konvikti" description="Kapaciteti dhe zënia e dhomave" />
      {loading || error ? (
        <Card><CardContent><EmptyMessage loading={loading} error={error} /></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardContent><p className="text-xs text-surface-300">Kapaciteti</p><p className="text-3xl font-mono text-surface-50 mt-1">{data.total_capacity ?? 0}</p></CardContent></Card>
          <Card><CardContent><p className="text-xs text-surface-300">Te zena</p><p className="text-3xl font-mono text-surface-50 mt-1">{data.total_occupied ?? 0}</p></CardContent></Card>
          <Card><CardContent><p className="text-xs text-surface-300">Zenia</p><p className="text-3xl font-mono text-surface-50 mt-1">{data.occupancy_rate ?? 0}%</p></CardContent></Card>
        </div>
      )}
      {!!rooms.length && (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardContent className="flex justify-between items-center">
                <span className="text-surface-200">{roomName(room)}</span>
                <span className="font-mono text-brand-400">{room.assignments_count ?? 0}/{room.capacity ?? '-'}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function RoomsPage() {
  const { data, loading, error } = useApiData(api.dormitory.rooms)
  const rows = data.map((room) => ({
    id: room.id,
    room: roomName(room),
    capacity: room.capacity ?? '-',
    occupied: room.assignments_count ?? 0,
  }))
  const columns = [
    { key: 'room', label: 'Dhoma' },
    { key: 'capacity', label: 'Kapaciteti' },
    { key: 'occupied', label: 'Te zena' },
  ]

  return (
    <div>
      <PageHeader title="Dhomat" description="Caktimet dhe kapaciteti i dhomave" />
      {rows.length ? <DataTable columns={columns} data={rows} /> : <Card><CardContent><EmptyMessage loading={loading} error={error} /></CardContent></Card>}
    </div>
  )
}

export function InspectionsPage() {
  const { data, loading, error } = useApiData(api.dormitory.inspections)

  return (
    <div>
      <PageHeader title="Kontrollet e dhomave" description="Pastertia dhe kontrollet e konviktit" actions={<Button>Kontroll i ri</Button>} />
      <div className="space-y-3">
        {data.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex justify-between items-center">
              <span className="text-surface-200">{roomName(item.dorm_room)}</span>
              <div className="text-right">
                <Badge variant={(item.score ?? 0) >= 8 ? 'success' : (item.score ?? 0) >= 6 ? 'warning' : 'red'}>{item.score ?? '-'}/10</Badge>
                <p className="text-xs text-surface-500 mt-1">{item.inspection_date ? formatDate(item.inspection_date) : ''}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {!data.length && <Card><CardContent><EmptyMessage loading={loading} error={error} /></CardContent></Card>}
      </div>
    </div>
  )
}

export function MyRoomPage() {
  const { data, loading, error } = useApiData(api.dormitory.myRoom, null)
  const lastInspection = data?.recent_inspections?.[0]

  return (
    <div>
      <PageHeader title="Dhoma ime" description={data?.room ? roomName(data.room) : 'Te dhenat e dhomes'} />
      <Card>
        <CardContent className="space-y-3">
          {data ? (
            <>
              <div className="flex justify-between"><span className="text-surface-300">Dhoma</span><span>{roomName(data.room)}</span></div>
              <div className="flex justify-between"><span className="text-surface-300">Prej dates</span><span>{data.assignment?.assigned_from ? formatDate(data.assignment.assigned_from) : '-'}</span></div>
              <div className="flex justify-between"><span className="text-surface-300">Kontrolli i fundit</span><Badge variant="warning">{lastInspection?.score ?? '-'}/10</Badge></div>
            </>
          ) : (
            <EmptyMessage loading={loading} error={error} message="Nuk ka dhome te caktuar." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function DisciplinePage() {
  const { data, loading, error } = useApiData(api.discipline.history)
  const rows = data.map((record) => ({
    id: record.id,
    student: record.student?.full_name || [record.student?.first_name, record.student?.last_name].filter(Boolean).join(' ') || '-',
    category: record.category?.name || record.category || '-',
    description: record.description || record.notes || '-',
    date: record.discipline_date,
    location: record.location || '-',
  }))
  const columns = [
    { key: 'student', label: 'Nxenesi' },
    { key: 'category', label: 'Kategoria', render: (r) => <Badge variant={r.category === 'Positive' ? 'success' : 'amber'}>{r.category}</Badge> },
    { key: 'description', label: 'Pershkrimi' },
    { key: 'date', label: 'Data', render: (r) => (r.date ? formatDate(r.date) : '-') },
    { key: 'location', label: 'Vendi' },
  ]

  return (
    <div>
      <PageHeader title="Disiplina" description="Verejtjet dhe shenimet e sjelljes" actions={<Button>Regjistro verejtje</Button>} />
      {rows.length ? <DataTable columns={columns} data={rows} /> : <Card><CardContent><EmptyMessage loading={loading} error={error} /></CardContent></Card>}
    </div>
  )
}

export function DisciplineRecordPage() {
  const [studentId, setStudentId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const studentsLoad = () => api.students.index({ per_page: 1000 })
  const categoriesLoad = () => api.discipline.categories()

  const { data: students = [], loading: studentsLoading } = useApiData(studentsLoad, [])
  const { data: categories = [], loading: categoriesLoading } = useApiData(categoriesLoad, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await api.discipline.store({
        student_id: studentId,
        category_id: categoryId,
        location,
        description,
        discipline_date: new Date().toISOString().slice(0, 10),
      })

      setStudentId('')
      setCategoryId('')
      setLocation('')
      setDescription('')
      // Optionally show toast — omitted for minimal changes
    } catch (e) {
      setError('Gabim gjatë ruajtjes së shënimit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Regjistro disipline" description="Shto nje shenim te ri per sjelljen" />
      <Card className="max-w-xl">
        <CardContent className="space-y-4">
          {error && <div className="text-red-400">{error}</div>}
          <div className="space-y-2">
            <Label>Nxenesi</Label>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Zgjidh nxenesin</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{(s.first_name || '') + ' ' + (s.last_name || '')} - {s.student_id}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kategoria</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Zgjidh kategorine</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2"><Label>Vendi</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Klasa, konvikti ose kampusi" /></div>
          <div className="space-y-2"><Label>Pershkrimi</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pershkruaj rastin..." /></div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || studentsLoading || categoriesLoading}>
              {saving ? 'Duke ruajtur...' : 'Ruaj shenimin'}
            </Button>
            <Button variant="secondary" onClick={() => { setStudentId(''); setCategoryId(''); setLocation(''); setDescription('') }}>Pastro</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function MyDisciplinePage() {
  const { data, loading, error } = useApiData(api.discipline.myRecord)

  return (
    <div>
      <PageHeader title="Disiplina ime" description="Historiku yt i sjelljes" />
      <div className="space-y-3">
        {data.map((record) => (
          <Card key={record.id}>
            <CardContent>
              <div className="flex justify-between gap-4">
                <span className="text-surface-200">{record.description || record.notes || record.category?.name}</span>
                <span className="text-xs text-surface-500">{record.discipline_date ? formatDate(record.discipline_date) : ''}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {!data.length && <Card><CardContent><EmptyMessage loading={loading} error={error} message="Nuk ka shenime disiplinore aktive." /></CardContent></Card>}
      </div>
    </div>
  )
}

export function ExtracurricularPage() {
  const { data, loading, error } = useApiData(api.extracurricular.index)
  const rows = data.map((activity) => ({
    id: activity.id,
    name: activity.name,
    type: activity.type,
    instructor: activity.instructor || '-',
    enrolled: `${activity.enrolled ?? 0}/${activity.capacity ?? '-'}`,
    fee: activity.fee ? formatCurrency(activity.fee) : 'Falas',
  }))
  const columns = [
    { key: 'name', label: 'Aktiviteti' },
    { key: 'type', label: 'Lloji', render: (r) => <Badge variant="purple">{r.type}</Badge> },
    { key: 'instructor', label: 'Instruktori' },
    { key: 'enrolled', label: 'Te regjistruar' },
    { key: 'fee', label: 'Tarifa' },
  ]

  return (
    <div>
      <PageHeader title="Aktivitetet" description="Programi hifz dhe aktivitetet tjera" />
      {rows.length ? <DataTable columns={columns} data={rows} /> : <Card><CardContent><EmptyMessage loading={loading} error={error} /></CardContent></Card>}
    </div>
  )
}

export function AnnouncementsPage() {
  const { data, loading, error } = useApiData(api.announcements.index)

  return (
    <div>
      <PageHeader title="Njoftime" description="Njoftime dhe perditesime per shkolle" actions={<Button>Njoftim i ri</Button>} />
      <div className="space-y-3">
        {data.map((a) => (
          <Card key={a.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-surface-100">{a.title}</h3>
                  <p className="text-xs text-surface-700 mt-1">{a.published_at ? formatDate(a.published_at) : ''} - {a.author?.name || 'Administrata'}</p>
                </div>
                {a.priority === 'high' && <Badge variant="red">Urgjente</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {!data.length && <Card><CardContent><EmptyMessage loading={loading} error={error} /></CardContent></Card>}
      </div>
    </div>
  )
}

export function GenericListPage({ title, description, loader, columns, mapRow = (item) => item }) {
  const { data, loading, error } = useApiData(loader)
  const rows = data.map(mapRow)

  return (
    <div>
      <PageHeader title={title} description={description} />
      {rows.length ? (
        <DataTable columns={columns} data={rows} />
      ) : (
        <Card><CardContent><EmptyMessage loading={loading} error={error} message="Ky modul eshte gati, por nuk ka te dhena." /></CardContent></Card>
      )}
    </div>
  )
}

export function SettingsPage() {
  const sections = ['Te pergjithshme', 'Vitet shkollore', 'Njoftimet', 'Siguria']

  return (
    <div>
      <PageHeader title="Cilesimet" description="Konfigurimet e pergjithshme te shkolles" />
      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Card key={section}>
            <CardHeader><CardTitle className="text-base font-body font-medium">{section}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-surface-300">Konfiguro seksionin: {section.toLowerCase()}.</p></CardContent>
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
      <PageHeader title="Profili" description="Te dhenat e llogarise tende" />
      <Card className="max-w-md">
        <CardContent className="space-y-3">
          <div><p className="text-xs text-surface-300">Emri</p><p className="text-surface-100">{user?.name}</p></div>
          <div><p className="text-xs text-surface-300">Email</p><p className="font-mono text-sm">{user?.email}</p></div>
          <div><p className="text-xs text-surface-300">Roli</p><Badge>{user?.role}</Badge></div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TimetablePage() {
  const { data, loading, error } = useApiData(api.academic.timetable)

  return (
    <div>
      <PageHeader title="Orari" description="Orari javor i mesimit" />
      <Card>
        <CardContent className="space-y-0">
          {data.map((slot) => (
            <div key={slot.id} className="flex gap-4 py-3 border-b border-white/5 text-sm">
              <span className="font-mono text-brand-400 w-12">{slot.start_time}</span>
              <span className="flex-1 text-surface-200">{slot.subject?.name || '-'}</span>
              <span className="text-surface-700">{slot.class?.name || ''}</span>
            </div>
          ))}
          {!data.length && <EmptyMessage loading={loading} error={error} />}
        </CardContent>
      </Card>
    </div>
  )
}

export function GradesPage() {
  return (
    <div>
      <PageHeader title="Notat dhe vleresimet" description="Percjellja e suksesit akademik" />
      <Card><CardContent><p className="text-sm text-surface-300">Moduli i notave eshte gati per integrim me backend.</p></CardContent></Card>
    </div>
  )
}
