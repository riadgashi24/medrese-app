import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { Input, Label, Select } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, Check, X, Loader2, Bell, Monitor, ShieldCheck, Accessibility, KeyRound, RotateCcw } from 'lucide-react'

function useApiData(load, fallback = []) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function run() {
      try {
        const response = await load()
        const loadedData = Array.isArray(response) ? response : response?.data
        if (mounted) setData(loadedData ?? fallback)
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

function EmptyMessage({ loading, error, message }) {
  if (loading) return <p className="text-sm text-surface-300">Duke ngarkuar...</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>
  return <p className="text-sm text-surface-300">{message || 'Nuk ka te dhena per t’u shfaqur.'}</p>
}

function roomName(room) {
  return [room?.block, room?.name || room?.room_no || room?.number].filter(Boolean).join(' - ') || 'Dhome'
}

function getStaffRoleMeta(role) {
  const normalized = String(role ?? '').toLowerCase()

  switch (normalized) {
    case 'director':
      return { label: 'Drejtor', badge: 'purple' }
    case 'secretary':
      return { label: 'Sekretar', badge: 'green' }
    case 'teacher':
      return { label: 'Profesor', badge: 'blue' }
    case 'educator':
      return { label: 'Edukator', badge: 'amber' }
    case 'cashier':
      return { label: 'Arkatar', badge: 'slate' }
    default:
      return { label: 'Të tjerë', badge: 'slate' }
  }
}

function getStaffRoleOrder(role) {
  const normalized = String(role ?? '').toLowerCase()
  const order = ['director', 'secretary', 'teacher', 'educator', 'cashier']
  const index = order.indexOf(normalized)
  return index === -1 ? 999 : index
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
  const [filterRoom, setFilterRoom] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [rooms, setRooms] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (roomId = '', from = '', to = '') => {
    setLoading(true)
    try {
      const params = { per_page: 50 }
      if (roomId) params.room_id = roomId
      if (from) params.from = from
      if (to) params.to = to
      const res = await api.dormitory.inspections(params)
      setData(res?.data ?? [])

      const roomsRes = await api.dormitory.rooms()
      setRooms(roomsRes?.data ?? [])
    } catch (e) {
      setError('Nuk u ngarkuan kontrollet.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleFilter = () => { load(filterRoom, filterFrom, filterTo) }

  const handleDelete = async (id) => {
    if (!confirm('A jeni të sigurt që doni të fshini këtë kontroll?')) return
    try {
      await api.dormitory.deleteInspection(id)
      load()
    } catch (err) {
      console.error('Failed to delete inspection:', err)
    }
  }

  return (
    <div>
      <PageHeader
        title="Kontrollet e dhomave"
        description="Pastertia dhe kontrollet e konviktit"
        actions={
          <Link to="/dormitory/inspections/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Kontroll i ri
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-[10px]">Dhoma</Label>
            <Select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="w-40">
              <option value="">Të gjitha</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.dorm_block || 'Bllok'} — {r.code || r.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Prej</Label>
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-36" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Deri</Label>
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-36" />
          </div>
          <Button variant="secondary" size="sm" onClick={handleFilter}>Filtro</Button>
        </CardContent>
      </Card>

      {/* Data */}
      <div className="space-y-3">
        {loading ? (
          <Card><CardContent className="py-8 flex items-center justify-center text-surface-400 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Duke ngarkuar...
          </CardContent></Card>
        ) : error ? (
          <Card><CardContent className="py-8 text-red-400 text-sm text-center">{error}</CardContent></Card>
        ) : data.length === 0 ? (
          <Card><CardContent className="py-8 text-surface-500 text-sm text-center">Nuk ka kontrolle të regjistruara.</CardContent></Card>
        ) : (
          data.map((item) => {
            const passedCount = item.items?.filter(i => i.passed).length ?? 0
            const totalItems = item.items?.length ?? 0
            return (
              <Card key={item.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-surface-100 font-medium">
                          {item.dorm_room?.dorm_block || 'Blloku'} — {item.dorm_room?.code || item.dorm_room?.name || 'Dhoma'}
                        </span>
                        <p className="text-[10px] text-surface-500 mt-0.5">
                          {item.inspection_date ? formatDate(item.inspection_date) : ''}
                          {item.created_by?.name ? ` — nga ${item.created_by.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant={(item.score ?? 0) >= 8 ? 'success' : (item.score ?? 0) >= 6 ? 'warning' : 'danger'}>
                          {item.score ?? '-'}/10
                        </Badge>
                        {totalItems > 0 && (
                          <p className="text-[9px] text-surface-600 mt-0.5">
                            {passedCount}/{totalItems} kaluan
                          </p>
                        )}
                      </div>
                      <Link to={`/dormitory/inspections/${item.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>

                  {/* Checklist items preview */}
                  {item.items && item.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/5">
                      {item.items.map((checkItem) => (
                        <span
                          key={checkItem.id}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono ${checkItem.passed
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                            }`}
                        >
                          {checkItem.passed ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                          {checkItem.item_label}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export function InspectionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const CHECKLIST_ITEMS = [
    { key: 'beds', label: 'Shtretërit' },
    { key: 'floor', label: 'Dyshemeja' },
    { key: 'wardrobes', label: 'Veshjet' },
    { key: 'trash', label: 'Plehrat' },
    { key: 'study_discipline', label: 'Disiplina e studimit' },
    { key: 'lights', label: 'Dritat' },
    { key: 'noise', label: 'Zhurma' },
  ]

  const [roomId, setRoomId] = useState('')
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [items, setItems] = useState(
    CHECKLIST_ITEMS.map(i => ({ item_key: i.key, item_label: i.label, passed: true, comment: '' }))
  )
  const [rooms, setRooms] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(isEditing)

  useEffect(() => {
    api.dormitory.rooms().then(r => setRooms(r?.data ?? [])).catch(() => { })

    if (isEditing) {
      api.dormitory.showInspection(id)
        .then(r => {
          const inspection = r?.data
          if (inspection) {
            setRoomId(String(inspection.dorm_room_id))
            setInspectionDate(inspection.inspection_date || new Date().toISOString().slice(0, 10))
            setNote(inspection.note || '')
            if (inspection.items?.length) {
              setItems(inspection.items.map(i => ({
                item_key: i.item_key,
                item_label: i.item_label,
                passed: i.passed,
                comment: i.comment || '',
              })))
            }
          }
        })
        .catch(() => setError('Nuk u ngarkua kontrolli.'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const toggleItem = (index) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, passed: !item.passed } : item
    ))
  }

  const updateComment = (index, comment) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, comment } : item
    ))
  }

  const passedCount = items.filter(i => i.passed).length
  const totalItems = items.length
  const liveScore = totalItems > 0 ? Math.round((passedCount / totalItems) * 10 * 100) / 100 : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!roomId) {
      setError('Zgjidhni një dhomë.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      dorm_room_id: Number(roomId),
      inspection_date: inspectionDate,
      note: note || null,
      items: items.map(i => ({
        item_key: i.item_key,
        item_label: i.item_label,
        passed: i.passed,
        comment: i.comment || null,
      })),
    }

    try {
      if (isEditing) {
        await api.dormitory.updateInspection(id, payload)
      } else {
        await api.dormitory.storeInspection(payload)
      }
      navigate('/dormitory/inspections')
    } catch (err) {
      setError('Kontrolli nuk u ruajt.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card><CardContent className="py-12 flex items-center justify-center text-surface-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Duke ngarkuar...
      </CardContent></Card>
    )
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Modifiko Kontrollin' : 'Kontroll i Ri i Dhomës'}
        description="Plotëso kontrollet për secilin artikull"
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardContent className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Dhoma</Label>
                <Select value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                  <option value="">Zgjidh dhomën...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Kati {r.floor || '-'} — {r.dorm_block || 'Blloku'} {r.code || r.name} ({r.capacity} vende)
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} required />
              </div>
            </div>

            {/* Live Score Preview */}
            <div className="rounded-xl bg-surface-800/60 border border-white/5 p-4 text-center">
              <p className="text-xs text-surface-400 mb-1">Rezultati</p>
              <div className="flex items-center justify-center gap-3">
                <div className={`text-4xl font-bold font-mono ${liveScore >= 8 ? 'text-emerald-400' : liveScore >= 6 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                  {liveScore.toFixed(1)}
                </div>
                <span className="text-xl text-surface-500">/10</span>
              </div>
              <p className="text-[10px] text-surface-500 mt-1">
                {passedCount}/{totalItems} artikuj në rregull
              </p>
            </div>

            {/* Editable Checklist */}
            <div>
              <p className="section-label mb-3">Lista e Kontrollit</p>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.item_key}
                    className={`rounded-lg border p-3 transition-colors ${item.passed
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-red-500/20 bg-red-500/5'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleItem(index)}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${item.passed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                          }`}
                      >
                        {item.passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </button>
                      <span className={`text-sm flex-1 ${item.passed ? 'text-surface-200' : 'text-surface-400'}`}>
                        {item.item_label}
                      </span>
                      <input
                        type="text"
                        value={item.comment}
                        onChange={(e) => updateComment(index, e.target.value)}
                        placeholder="Vërejtje..."
                        className="w-28 md:w-40 bg-transparent border-b border-white/10 text-xs text-surface-300 placeholder:text-surface-600 focus:border-brand-500 focus:outline-none py-0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label>Shënim i përgjithshëm</Label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Shkruaj një shënim për kontrollin..."
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-surface-900/60 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving || !roomId}>
                {saving ? 'Duke ruajtur...' : isEditing ? 'Ruaj Ndryshimet' : 'Ruaj Kontrollin'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/dormitory/inspections')}>
                Anulo
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
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
      <PageHeader title="Disiplina" description="Verejtjet dhe shenimet e sjelljes" />
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
      <PageHeader title="Njoftime" description="Njoftime dhe perditesime per shkolle" />
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
  const isStaffPage = title === 'Stafi'
  const staffRows = isStaffPage
    ? [...rows].sort((a, b) => getStaffRoleOrder(a.role) - getStaffRoleOrder(b.role))
    : rows
  const staffRoleKeys = ['director', 'secretary', 'teacher', 'educator', 'cashier']
  const staffGroups = isStaffPage
    ? [
      ...staffRoleKeys.map((roleKey) => ({
        roleKey,
        items: staffRows.filter((row) => String(row.role ?? '').toLowerCase() === roleKey),
      })),
      {
        roleKey: 'other',
        items: staffRows.filter((row) => !staffRoleKeys.includes(String(row.role ?? '').toLowerCase())),
      },
    ].filter((group) => group.items.length)
    : []

  return (
    <div>
      <PageHeader title={title} description={description} />
      {staffRows.length ? (
        isStaffPage ? (
          <div className="space-y-5">
            {staffGroups.map(({ roleKey, items: roleItems }) => {
              const meta = getStaffRoleMeta(roleKey === 'other' ? roleItems[0]?.role : roleKey)
              return (
                <Card key={roleKey}>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-surface-100">{meta.label}</h3>
                      <Badge variant={meta.badge}>{roleItems.length}</Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {roleItems.map((row) => (
                        <div key={row.id || `${row.name}-${row.email}`} className="flex items-center gap-3 rounded-lg border border-white/8 bg-surface-900/30 p-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-300">
                            {row.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-surface-100">{row.name}</p>
                            <p className="truncate text-xs text-surface-400">{row.position || meta.label}</p>
                            <p className="truncate text-xs text-surface-500">{row.email}</p>
                          </div>
                          <Badge variant={meta.badge}>{meta.label}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <DataTable columns={columns} data={rows} />
        )
      ) : (
        <Card><CardContent><EmptyMessage loading={loading} error={error} message="Ky modul eshte gati, por nuk ka te dhena." /></CardContent></Card>
      )}
    </div>
  )
}

const SETTINGS_KEY_PREFIX = 'medrese-settings'
const defaultSettings = { compact: false, reducedMotion: false, largeText: false, highContrast: false, inAppNotifications: true, emailNotifications: true, desktopNotifications: false, confirmChanges: true }

function settingsStorageKey(user) {
  return `${SETTINGS_KEY_PREFIX}:${user?.id || 'guest'}`
}

function ToggleRow({ title, description, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div><p className="text-sm font-medium text-surface-100">{title}</p><p className="mt-0.5 text-xs text-surface-400">{description}</p></div>
      <button type="button" role="switch" aria-label={title} aria-checked={enabled} onClick={() => onChange(!enabled)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-brand-600' : 'bg-surface-700'}`}>
        <span className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export function SettingsPage() {
  const { theme, setTheme, user } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState(() => {
    try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(settingsStorageKey(user)) || '{}') } } catch { return defaultSettings }
  })
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try { localStorage.setItem(settingsStorageKey(user), JSON.stringify(settings)) } catch { /* local storage may be unavailable */ }
    document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion)
    document.documentElement.classList.toggle('large-text', settings.largeText)
    document.documentElement.classList.toggle('high-contrast', settings.highContrast)
    document.documentElement.setAttribute('data-density', settings.compact ? 'compact' : 'comfortable')
  }, [settings, user])

  const updateSetting = async (key, value) => {
    if (key === 'desktopNotifications' && value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setNotice('Njoftimet e shfletuesit nuk u lejuan. Mund t’i aktivizoni nga cilësimet e shfletuesit.'); return }
    }
    setSettings((current) => ({ ...current, [key]: value }))
    setNotice('Cilësimet u ruajtën automatikisht.')
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setTheme('light')
    setNotice('Cilësimet personale u rikthyen në vlerat fillestare.')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cilësimet" description="Personalizo përvojën, njoftimet dhe sigurinë e llogarisë tënde" />
      {notice && <div className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">{notice}</div>}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base font-body font-medium"><Monitor className="h-5 w-5 text-brand-400" /> Pamja</CardTitle></CardHeader><CardContent className="space-y-3">
          <p className="text-sm text-surface-300">Zgjidh pamjen që të përshtatet më shumë. Tema ruhet për llogarinë tënde.</p>
          <div className="flex flex-wrap gap-2"><Button type="button" variant={theme === 'light' ? 'default' : 'secondary'} onClick={() => setTheme('light')}>Ditor</Button><Button type="button" variant={theme === 'dark' ? 'default' : 'secondary'} onClick={() => setTheme('dark')}>Natën</Button></div>
          <ToggleRow title="Pamje kompakte" description="Zvogëlon hapësirat për të shfaqur më shumë përmbajtje." enabled={settings.compact} onChange={(value) => updateSetting('compact', value)} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base font-body font-medium"><Accessibility className="h-5 w-5 text-brand-400" /> Aksesueshmëria</CardTitle></CardHeader><CardContent>
          <ToggleRow title="Tekst më i madh" description="Rrit pak madhësinë e tekstit në të gjithë aplikacionin." enabled={settings.largeText} onChange={(value) => updateSetting('largeText', value)} />
          <ToggleRow title="Kontrast i lartë" description="Forcon dallimin ndërmjet tekstit, kufijve dhe sfondit." enabled={settings.highContrast} onChange={(value) => updateSetting('highContrast', value)} />
          <ToggleRow title="Redukto animacionet" description="Zvogëlon lëvizjet dhe efektet e ndërfaqes." enabled={settings.reducedMotion} onChange={(value) => updateSetting('reducedMotion', value)} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base font-body font-medium"><Bell className="h-5 w-5 text-brand-400" /> Njoftimet</CardTitle></CardHeader><CardContent>
          <ToggleRow title="Njoftime brenda aplikacionit" description="Shfaq njoftime të reja në hapësirën e njoftimeve." enabled={settings.inAppNotifications} onChange={(value) => updateSetting('inAppNotifications', value)} />
          <ToggleRow title="Përmbledhje me email" description="Lejo dërgimin e përmbledhjeve dhe përditësimeve në email." enabled={settings.emailNotifications} onChange={(value) => updateSetting('emailNotifications', value)} />
          <ToggleRow title="Njoftime në pajisje" description="Kërkon leje nga shfletuesi për njoftime në desktop." enabled={settings.desktopNotifications} onChange={(value) => updateSetting('desktopNotifications', value)} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base font-body font-medium"><ShieldCheck className="h-5 w-5 text-brand-400" /> Privatësia dhe siguria</CardTitle></CardHeader><CardContent>
          <ToggleRow title="Konfirmo ndryshimet" description="Kërko konfirmim shtesë para veprimeve të rëndësishme." enabled={settings.confirmChanges} onChange={(value) => updateSetting('confirmChanges', value)} />
          <div className="pt-4"><p className="text-sm font-medium text-surface-100">Emaili dhe fjalëkalimi</p><p className="mt-1 text-xs text-surface-400">Për arsye sigurie, këto menaxhohen nga faqja e profilit.</p><Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/profile')}><KeyRound className="h-3.5 w-3.5" /> Menaxho llogarinë</Button></div>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base font-body font-medium">Të dhënat e aplikacionit</CardTitle></CardHeader><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-surface-200">Cilësimet e tua ruhen vetëm për këtë llogari në këtë pajisje.</p><p className="mt-1 text-xs text-surface-400">Medrese SMS · Versioni 1.0</p></div><Button type="button" variant="secondary" onClick={resetSettings}><RotateCcw className="h-4 w-4" /> Rikthe cilësimet</Button></CardContent></Card>
    </div>
  )
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState(user)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [security, setSecurity] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.profile.show().then((res) => setProfile(res?.data || res)).catch(() => setError('Nuk mundëm t\'i ngarkojmë të dhënat e profilit.')).finally(() => setLoading(false))
  }, [])

  async function saveProfile(payload) {
    setSaving(true); setMessage('')
    try { const res = await api.profile.update(payload); const next = res?.data || res; setProfile(next); await refreshUser(); setEditing(false); setMessage('Të dhënat u përditësuan me sukses.') } catch (err) { setMessage(err?.message || 'Të dhënat nuk u ruajtën.') } finally { setSaving(false) }
  }

  async function uploadPhoto() {
    if (!photo) return
    setSaving(true)
    try { const res = await api.profile.uploadPhoto(photo); setProfile(res?.data || res); await refreshUser(); setPhoto(null); setMessage('Fotografia u përditësua me sukses.') } catch (err) { setMessage(err?.message || 'Fotografia nuk u ruajt.') } finally { setSaving(false) }
  }

  async function removePhoto() {
    setSaving(true)
    try { const res = await api.profile.deletePhoto(); setProfile(res?.data || res); await refreshUser(); setMessage('Fotografia u hoq.') } catch (err) { setMessage(err?.message || 'Fotografia nuk u hoq.') } finally { setSaving(false) }
  }

  if (loading) return <Card><CardContent className="py-12 text-center text-surface-400">Duke ngarkuar profilin...</CardContent></Card>
  if (error) return <Card><CardContent className="py-12 text-center text-red-400">{error}</CardContent></Card>
  if (!profile) return null
  const roleLabels = { director: 'Drejtor', secretary: 'Sekretar', teacher: 'Profesor', educator: 'Edukator', cashier: 'Arkatar', student: 'Nxënës', boarding: 'Nxënës', other: 'Të tjerë' }
  const initials = (profile.name || '?').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const fields = [['Gjinia', { Male: 'Mashkull', Female: 'Femër' }[profile.gender]], ['Data e lindjes', profileDateValue(profile.birth_date).split('-').reverse().join('.')], ['Vendi i lindjes', profile.place_of_birth], ['Telefon', profile.phone], ['Adresa', profile.address], ['Qyteti', profile.city]]
  const teacherAcademic = profile.academic
  return (
    <div className="space-y-6">
      <PageHeader title="Profili" description="Menaxho të dhënat personale dhe llogarinë tënde" />
      {message && <div className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">{message}</div>}
      <Card><CardContent className="flex flex-wrap items-center gap-5"><div className="relative">{profile.photo_url ? <img src={profile.photo_url} alt={profile.name} className="h-24 w-24 rounded-full object-cover border border-white/10" /> : <div className="h-24 w-24 rounded-full bg-brand-500/15 flex items-center justify-center text-2xl font-semibold text-brand-300">{initials || '?'}</div>}</div><div className="flex-1"><h1 className="text-2xl font-semibold text-surface-100">{profile.name}</h1><p className="text-surface-400">{roleLabels[profile.role] || 'Të tjerë'}</p><p className="text-sm text-surface-500">{profile.email}</p><Badge variant="success" className="mt-2">{profile.status === 'Active' ? 'Aktiv' : profile.status}</Badge></div><div className="flex flex-wrap gap-2"><label className="cursor-pointer"><span className="inline-flex rounded-lg border border-white/10 px-3 py-2 text-xs text-surface-200">Ndrysho foton</span><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { setPhoto(e.target.files?.[0] || null) }} /></label>{photo && <Button onClick={uploadPhoto} disabled={saving}>Ruaj foton</Button>}{profile.photo_url && <Button variant="ghost" onClick={removePhoto} disabled={saving}>Hiq</Button>}</div></CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2"><Card><CardContent><div className="flex justify-between items-center mb-4"><h2 className="text-sm font-semibold text-surface-100">Të dhënat personale</h2><Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Modifiko të dhënat</Button></div><div className="grid gap-3 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><p className="text-xs text-surface-500">{label}</p><p className="text-sm text-surface-200">{value || '-'}</p></div>)}</div>{profile.role === 'student' || profile.role === 'boarding' ? <div className="mt-4 border-t border-white/10 pt-3 grid gap-3 sm:grid-cols-2"><div><p className="text-xs text-surface-500">Klasa</p><p className="text-sm text-surface-200">{profile.class_name || '-'}</p></div><div><p className="text-xs text-surface-500">Numri i nxënësit</p><p className="text-sm text-surface-200">{profile.student_id || '-'}</p></div><div><p className="text-xs text-surface-500">Prindi/Kujdestari</p><p className="text-sm text-surface-200">{profile.parent_name || '-'}</p></div></div> : null}</CardContent></Card><Card><CardContent className="space-y-3"><h2 className="text-sm font-semibold text-surface-100">Llogaria</h2><InfoRow label="Email" value={profile.email} /><InfoRow label="Roli" value={roleLabels[profile.role] || 'Të tjerë'} /><InfoRow label="Statusi" value={profile.status === 'Active' ? 'Aktiv' : profile.status} /><div className="pt-2"><Button size="sm" variant="secondary" onClick={() => setSecurity('email')}>Ndrysho emailin</Button></div></CardContent></Card></div>
      {(profile.position || profile.education || teacherAcademic) && <Card><CardContent><h2 className="text-sm font-semibold text-surface-100 mb-3">{profile.role === 'teacher' ? 'Informata profesionale' : 'Informata shtesë'}</h2><div className="grid gap-3 sm:grid-cols-2"><InfoRow label="Pozita" value={profile.position} /><InfoRow label="Shkollimi" value={profile.education} /><InfoRow label="Kualifikimi" value={profile.qualification} /><InfoRow label="Specializimi" value={profile.specialization} /></div>{teacherAcademic && <div className="mt-4 border-t border-white/10 pt-3"><p className="text-xs text-surface-500">Angazhimi mësimor · {teacherAcademic.academic_year?.label}</p><p className="text-lg font-mono text-brand-300">{teacherAcademic.total_hours || 0} orë/javë</p>{teacherAcademic.assignments?.map((item, index) => <p key={`${item.class_name}-${index}`} className="text-sm text-surface-300">{item.subject_name} — {item.class_name} · {item.weekly_hours} orë</p>)}</div>}</CardContent></Card>}
      <Card><CardContent className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-surface-100">Siguria</h2><p className="text-xs text-surface-500">Ndrysho fjalëkalimin e llogarisë</p></div><Button variant="secondary" onClick={() => setSecurity('password')}>Ndrysho fjalëkalimin</Button></CardContent></Card>
      {editing && <ProfileEditDialog profile={profile} saving={saving} onClose={() => setEditing(false)} onSave={saveProfile} />}
      {security && <SecurityDialog mode={security} saving={saving} onClose={() => setSecurity(null)} onSave={async (payload) => { setSaving(true); try { if (security === 'email') { const res = await api.profile.updateEmail(payload); setProfile(res?.data || res); await refreshUser(); setMessage('Email-i u përditësua me sukses.') } else { await api.profile.updatePassword(payload); setMessage('Fjalëkalimi u ndryshua me sukses.') } setSecurity(null) } catch (err) { setMessage(err?.message || 'Veprimi dështoi.') } finally { setSaving(false) } }} />}
    </div>
  )
}

function InfoRow({ label, value }) { return <div><p className="text-xs text-surface-500">{label}</p><p className="text-sm text-surface-200">{value || '-'}</p></div> }
function profileDateValue(value) {
  return typeof value === 'string' ? value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '' : ''
}

function ProfileEditDialog({ profile, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    name: profile.name || '', gender: profile.gender || '',
    birth_date: profileDateValue(profile.birth_date), phone: profile.phone || '',
    address: profile.address || '', city: profile.city || '', education: profile.education || '',
    qualification: profile.qualification || '', specialization: profile.specialization || '', notes: profile.notes || '',
  })
  const labels = { name: 'Emri dhe mbiemri', gender: 'Gjinia', birth_date: 'Data e lindjes', phone: 'Telefoni', address: 'Adresa', city: 'Qyteti', education: 'Shkollimi', qualification: 'Kualifikimi', specialization: 'Specializimi', notes: 'Shënime' }
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  return (
    <Dialog title="Modifiko të dhënat" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-3 max-h-[70vh] overflow-y-auto">
        {Object.entries(form).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={`profile-${key}`}>{labels[key]}</Label>
            {key === 'gender' ? (
              <Select id={`profile-${key}`} value={value} onChange={(e) => set(key, e.target.value)}>
                <option value="">Zgjidh gjininë</option>
                <option value="Male">Mashkull</option>
                <option value="Female">Femër</option>
              </Select>
            ) : key === 'notes' ? (
              <textarea id={`profile-${key}`} value={value} onChange={(e) => set(key, e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-surface-950 p-3 text-sm text-surface-100" />
            ) : (
              <Input id={`profile-${key}`} type={key === 'birth_date' ? 'date' : 'text'} value={value} onChange={(e) => set(key, e.target.value)} />
            )}
          </div>
        ))}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Anulo</Button><Button disabled={saving}>{saving ? 'Duke ruajtur...' : 'Ruaj'}</Button></div>
      </form>
    </Dialog>
  )
}
function SecurityDialog({ mode, saving, onClose, onSave }) { const [form, setForm] = useState(mode === 'email' ? { email: '', current_password: '' } : { current_password: '', password: '', password_confirmation: '' }); const set = (key, value) => setForm((current) => ({ ...current, [key]: value })); return <Dialog title={mode === 'email' ? 'Ndrysho emailin' : 'Ndrysho fjalëkalimin'} onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-3">{Object.entries(form).map(([key, value]) => <Input key={key} type={key.includes('password') ? 'password' : 'email'} required value={value} onChange={(e) => set(key, e.target.value)} placeholder={key === 'current_password' ? 'Fjalëkalimi aktual' : key === 'password_confirmation' ? 'Konfirmo fjalëkalimin' : key === 'password' ? 'Fjalëkalimi i ri' : 'Email i ri'} />)}<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Anulo</Button><Button disabled={saving}>{saving ? 'Duke ruajtur...' : 'Ruaj'}</Button></div></form></Dialog> }
function Dialog({ title, onClose, children }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><Card className="w-full max-w-lg bg-surface-900 border border-white/10"><CardContent className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-base font-semibold text-surface-100">{title}</h3><button onClick={onClose} className="text-surface-400">✕</button></div>{children}</CardContent></Card></div> }

export function AbsenceApprovalPage() {
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.attendance.pendingReview()
      setAbsences(res?.data ?? [])
    } catch (e) {
      setError('Nuk u ngarkuan mungesat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === absences.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(absences.map(a => a.id)))
    }
  }

  const approveSingle = async (id, type) => {
    try {
      await api.attendance.reviewAbsence({ attendance_id: id, absence_type: type })
      load()
    } catch (e) {
      console.error('Failed to approve:', e)
    }
  }

  const approveBatch = async (type) => {
    if (selectedIds.size === 0) return
    setSaving(true)
    try {
      const records = Array.from(selectedIds).map(id => ({ id, absence_type: type }))
      await api.attendance.reviewBatch({ records })
      setSelectedIds(new Set())
      load()
    } catch (e) {
      console.error('Batch approval failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const pendingNotReviewed = absences.filter(a => a.absence_type === 'Unjustified')

  return (
    <div>
      <PageHeader
        title="Miratimi i Mungesave"
        description={`${pendingNotReviewed.length} mungesa presin shqyrtim`}
      />

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <Card className="mb-4 border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-surface-200">
              {selectedIds.size} mungesë(a) të zgjedhura
            </span>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => approveBatch('Excused')}
                disabled={saving}
                className="gap-1.5"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Shëno të Arsyetuara
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => approveBatch('Unexcused')}
                disabled={saving}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Shëno të Paarsyetuara
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Anulo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <Card><CardContent className="py-12 flex items-center justify-center text-surface-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Duke ngarkuar...
          </CardContent></Card>
        ) : error ? (
          <Card><CardContent className="py-12 text-red-400 text-sm text-center">{error}</CardContent></Card>
        ) : pendingNotReviewed.length === 0 ? (
          <Card><CardContent className="py-12 text-surface-500 text-sm text-center">
            Nuk ka mungesa që presin shqyrtim.
          </CardContent></Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center gap-2 px-1 py-1">
              <button
                type="button"
                onClick={toggleSelectAll}
                className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selectedIds.size === pendingNotReviewed.length
                  ? 'bg-brand-500 border-brand-500'
                  : selectedIds.size > 0
                    ? 'bg-brand-500/50 border-brand-500/50'
                    : 'border-white/20 hover:border-white/40'
                  }`}
              >
                {selectedIds.size > 0 && <Check className="h-3 w-3 text-white" />}
              </button>
              <span className="text-xs text-surface-400">
                Zgjidh të gjitha ({pendingNotReviewed.length})
              </span>
            </div>

            {pendingNotReviewed.map((record) => {
              const student = record.student
              const studentName = student?.full_name || [student?.first_name, student?.last_name].filter(Boolean).join(' ') || 'Nxënës'
              return (
                <Card key={record.id}>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(record.id)}
                        className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedIds.has(record.id)
                          ? 'bg-brand-500 border-brand-500'
                          : 'border-white/20 hover:border-white/40'
                          }`}
                      >
                        {selectedIds.has(record.id) && <Check className="h-3 w-3 text-white" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-surface-100 truncate">
                            {studentName}
                          </span>
                          <Badge variant={
                            record.status === 'Absent' ? 'red' :
                              record.status === 'Late' ? 'warning' : 'slate'
                          }>
                            {record.status === 'Absent' ? 'Mungesë' :
                              record.status === 'Late' ? 'Vonesë' : record.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {record.date ? formatDate(record.date) : ''}
                          {record.note ? ` — ${record.note}` : ''}
                        </p>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveSingle(record.id, 'Excused')}
                          className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          <Check className="h-3 w-3" />
                          Arsyetuar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveSingle(record.id, 'Unexcused')}
                          className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                        >
                          <X className="h-3 w-3" />
                          Paarsyetuar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export function LeaderboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('weekly')
  const [error, setError] = useState('')

  useEffect(() => {
    api.dormitory.leaderboard()
      .then(r => setData(r?.data ?? null))
      .catch(() => setError('Nuk u ngarkua renditja.'))
      .finally(() => setLoading(false))
  }, [])

  const tabs = [
    { key: 'weekly', label: 'Javore' },
    { key: 'monthly', label: 'Mujore' },
    { key: 'yearly', label: 'Vjetore' },
  ]

  const currentList = data?.[activeTab] ?? []

  const getTrophy = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  const getScoreColor = (score) => {
    if (score >= 9) return 'text-emerald-400'
    if (score >= 7.5) return 'text-brand-400'
    if (score >= 6) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreBg = (score) => {
    if (score >= 9) return 'bg-emerald-500/20'
    if (score >= 7.5) return 'bg-brand-500/20'
    if (score >= 6) return 'bg-amber-500/20'
    return 'bg-red-500/20'
  }

  const getBarWidth = (score, maxScore) => {
    if (maxScore === 0) return 0
    return Math.max(5, (score / Math.max(maxScore, 10)) * 100)
  }

  if (loading) {
    return (
      <Card><CardContent className="py-16 flex items-center justify-center text-surface-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Duke ngarkuar renditjen...
      </CardContent></Card>
    )
  }

  if (error) {
    return (
      <Card><CardContent className="py-16 text-red-400 text-sm text-center">{error}</CardContent></Card>
    )
  }

  const top3 = currentList.filter(item => item.rank >= 1 && item.rank <= 3)
  const rest = currentList.filter(item => item.rank > 3)
  const maxScore = currentList.length > 0 ? Math.max(...currentList.map(i => i.avg_score)) : 10

  return (
    <div>
      <PageHeader
        title="Rënditja e Dhomave"
        description="Pikët e pastërtisë dhe disiplinës — konvikti"
      />

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-xl bg-surface-800/60 border border-white/8 p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-surface-300 hover:text-surface-100 hover:bg-white/5'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {currentList.length === 0 ? (
        <Card><CardContent className="py-12 text-surface-500 text-sm text-center">
          Nuk ka të dhëna për këtë periudhë.
        </CardContent></Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((rankPos) => {
              const item = top3.find(t => t.rank === rankPos)
              if (!item) {
                return <div key={rankPos} />
              }
              const room = item.dorm_room
              return (
                <Card key={rankPos} className={`text-center relative overflow-hidden ${rankPos === 1 ? 'ring-2 ring-amber-400/50' :
                  rankPos === 2 ? 'ring-1 ring-slate-400/30' :
                    'ring-1 ring-amber-600/30'
                  }`}>
                  {/* Decorative top strip */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${rankPos === 1 ? 'bg-amber-400' :
                    rankPos === 2 ? 'bg-slate-400' :
                      'bg-amber-600'
                    }`} />
                  <CardContent className="pt-6 pb-4">
                    <span className="text-2xl">{getTrophy(rankPos)}</span>
                    <h3 className="text-sm font-medium text-surface-100 mt-2 truncate">
                      {(room?.dorm_block || 'Bllok')} — {room?.code || room?.name || '-'}
                    </h3>
                    <div className={`text-3xl font-bold font-mono mt-2 ${getScoreColor(item.avg_score)}`}>
                      {Number(item.avg_score).toFixed(1)}
                    </div>
                    <p className="text-[10px] text-surface-500 mt-1">
                      {item.inspections_count ?? 0} kontrolle
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Rest of the list */}
          <div className="space-y-2">
            {rest.map((item) => {
              const room = item.dorm_room
              const barWidth = getBarWidth(item.avg_score, maxScore)
              return (
                <Card key={item.rank}>
                  <CardContent className="flex items-center gap-3">
                    <span className="font-mono text-xs text-surface-500 w-6 shrink-0 text-center">
                      #{item.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-100 truncate">
                        {(room?.dorm_block || 'Bllok')} — {room?.code || room?.name || '-'}
                      </p>
                      <div className="mt-1.5 h-2 rounded-full bg-surface-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getScoreBg(item.avg_score)}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono text-sm font-bold ${getScoreColor(item.avg_score)}`}>
                        {Number(item.avg_score).toFixed(1)}
                      </span>
                      <p className="text-[9px] text-surface-600">{item.inspections_count ?? 0} kontrolle</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
