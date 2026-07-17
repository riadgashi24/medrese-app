import { useEffect, useState } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { t } from '@/i18n'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

/* =========================================================
   📋 NXËNËSIT - LISTA
========================================================= */
function normalizeListResponse(response, fallback = []) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return fallback
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'ST'
}

export function StudentsPage() {
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [viewMode, setViewMode] = useState('cards')
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [classesRes, studentsRes] = await Promise.all([
          api.classes.index({ per_page: 1000 }),
          api.students.index({ per_page: 1000 }),
        ])

        const classData = normalizeListResponse(classesRes, []).map((cls) => ({
          id: cls.id,
          label: cls.name || cls.class_name || 'Klasa',
          studentCount: 0,
        }))

        const mappedStudents = normalizeListResponse(studentsRes, []).map((student) => ({
          id: student.id,
          studentId: student.student_id,
          name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.name || '-',
          email: student.student_email || student.email || '-',
          classId: student.class?.id ?? student.class_id ?? null,
          className: student.class?.name ?? '-',
          type: student.type,
          status: student.status,
          balance: student.balance ?? 0,
        }))

        const classMap = new Map(classData.map((cls) => [String(cls.id), cls]))
        mappedStudents.forEach((student) => {
          if (student.classId && classMap.has(String(student.classId))) {
            const item = classMap.get(String(student.classId))
            item.studentCount = (item.studentCount || 0) + 1
          }
        })

        setClasses(classData)
        setStudents(mappedStudents)
      } catch (err) {
        console.error('Gabim gjatë ngarkimit të nxënësve', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredClasses = classes.filter((cls) =>
    (cls.label || '').toLowerCase().includes(search.toLowerCase()) ||
    (cls.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedClass = classes.find((cls) => String(cls.id) === String(selectedClassId)) || null
  const filteredStudents = (selectedClassId ? students : [])
    .filter((s) => {
      const matchesSearch =
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase())

      return matchesSearch && String(s.classId) === String(selectedClassId)
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'sq'))

  const columns = [
    {
      key: 'studentId',
      label: 'ID',
      render: (r) => <span className="font-mono text-xs">{r.studentId}</span>,
    },
    {
      key: 'name',
      label: 'Emri',
      render: (r) => <span>{r.name}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (r) => <span className="text-xs text-surface-400">{r.email}</span>,
    },
    {
      key: 'type',
      label: 'Lloji',
      render: (r) => (
        <Badge variant={r.type === 'Boarding' ? 'blue' : 'slate'}>
          {r.type === 'Boarding' ? 'Konviktor' : 'Ditor'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Statusi',
      render: (r) => {
        const isActive = String(r.status).toLowerCase() === 'active'
        return (
          <Badge variant={isActive ? 'success' : 'slate'}>
            {isActive ? 'Aktiv' : 'Joaktiv'}
          </Badge>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title={selectedClass ? `Nxënësit - ${selectedClass.label}` : t('students.title')}
        description={selectedClass ? `Lista e nxënësve në ${selectedClass.label}` : t('students.description')}
        actions={
          <Link to="/students/new">
            <Button>{t('students.register')}</Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <CardContent className="pt-0">
          <Input
            placeholder={selectedClass ? 'Kërko nxënësin në këtë klasë' : t('students.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-surface-800"
            />
          ))}
        </div>
      ) : selectedClass ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setSelectedClassId(null)}>
              ← Kthehu te klasat
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('table')}
              >
                Tabela
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-surface-100">{selectedClass.label}</p>
                <p className="text-xs text-surface-400">{selectedClass.description}</p>
              </div>
              <Badge variant="blue">{filteredStudents.length} nxënës</Badge>
            </CardContent>
          </Card>

          {filteredStudents.length ? (
            viewMode === 'cards' ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="text-left"
                  >
                    <Card className="h-full transition-colors hover:border-brand-400/50">
                      <CardContent className="flex gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-400">
                          {student.photo ? (
                            <img src={student.photo} alt={student.name} className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                            getInitials(student.name)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-surface-100">{student.name}</p>
                              <p className="text-xs text-surface-400">{student.email}</p>
                            </div>
                            <Badge variant={student.type === 'Boarding' ? 'blue' : 'slate'}>
                              {student.type === 'Boarding' ? 'Konviktor' : 'Ditor'}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant={String(student.status).toLowerCase() === 'active' ? 'success' : 'slate'}>
                              {String(student.status).toLowerCase() === 'active' ? 'Aktiv' : 'Joaktiv'}
                            </Badge>
                            <span className="font-mono text-[11px] text-surface-500">{student.studentId}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredStudents}
                onRowClick={(row) => navigate(`/students/${row.id}`)}
              />
            )
          ) : (
            <Card>
              <CardContent>
                <p className="text-sm text-surface-400">Nuk u gjet asnjë nxënës për këtë klasë.</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClasses.length ? (
            filteredClasses.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassId(cls.id)}
                className="text-left"
              >
                <Card className="h-full transition-colors hover:border-brand-400/50">
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-surface-100">{cls.label}</h3>
                        <p className="text-sm text-surface-400">{cls.description}</p>
                      </div>
                      <Badge variant="blue">{cls.studentCount || 0}</Badge>
                    </div>
                    <p className="text-xs text-surface-500">Kliko për të parë nxënësit e kësaj klase</p>
                  </CardContent>
                </Card>
              </button>
            ))
          ) : (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent>
                <p className="text-sm text-surface-400">Nuk u gjet asnjë klasë.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   🧾 REGJISTRIM / EDITIM
========================================================= */
export function StudentFormPage({ mode = 'create' }) {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [address, setAddress] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [type, setType] = useState('Regular')
  const [status, setStatus] = useState('Active')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentPhoneSecondary, setParentPhoneSecondary] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentId, setStudentId] = useState('')

  const { id } = useParams()

  const MUNICIPALITIES = [
    'Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Mitrovicë', 'Vushtrri', 'Podujevë', 'Shtime', 'Suharekë', 'Istog', 'Deçan', 'Klinë', 'Dragash', 'Kamenicë', 'Leposavić', 'Zubin Potok', 'Zveçan', 'Rahovec', 'Obiliq', 'Klina',
  ]

  useEffect(() => {
    if (mode === 'edit' && id) {
      const loadStudent = async () => {
        setLoading(true)
        try {
          const res = await api.students.show(id)
          const data = res?.data || {}

          setFirstName(data.first_name || '')
          setLastName(data.last_name || '')
          setType(data.type || 'Regular')
          setStatus(data.status || 'Active')
          setMunicipality(data.municipality || '')
          setStudentId(data.student_id || '')
          setStudentEmail(data.student_email || '')
          setParentName(data.parent_name || '')
          setParentPhone(data.parent_phone || '')
          setParentPhoneSecondary(data.parent_phone_secondary || '')
          setAddress(data.address || '')
          setDob(data.date_of_birth || data.dob || '')
          setGender(data.gender || '')
        } catch (err) {
          console.error('Gabim gjatë ngarkimit të nxënësit', err)
          setError('Nuk u ngarkua nxënësi.')
        } finally {
          setLoading(false)
        }
      }

      loadStudent()
    }
  }, [mode, id])

  const validate = () => {
    setError('')

    if (!firstName.trim()) {
      setError('Emri është i detyrueshëm.')
      return false
    }

    if (!lastName.trim()) {
      setError('Mbiemri është i detyrueshëm.')
      return false
    }

    if (!municipality) {
      setError('Zgjidhni komunën.')
      return false
    }

    if (!dob) {
      setError('Zgjidhni datën e lindjes.')
      return false
    }

    if (!gender) {
      setError('Zgjidhni gjininë.')
      return false
    }

    if (!parentName.trim()) {
      setError('Emri i prindit / kujdestarit është i detyrueshëm.')
      return false
    }

    if (!parentPhone.trim()) {
      setError('Numri i telefonit të prindit është i detyrueshëm.')
      return false
    }

    if (studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      setError('Emaili i nxënësit nuk është i vlefshëm.')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    setError('')

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        student_id: studentId || null,
        date_of_birth: dob || null,
        gender: gender || null,
        municipality: municipality || null,
        address: address || null,
        student_email: studentEmail || null,
        parent_name: parentName || null,
        parent_phone: parentPhone || null,
        parent_phone_secondary: parentPhoneSecondary || null,
        type,
        status,
      }

      if (mode === 'edit' && id) {
        await api.students.update(id, payload)
        navigate(`/students/${id}`)
      } else {
        await api.students.store(payload)
        navigate('/students')
      }
    } catch (err) {
      setError('Gabim gjatë ruajtjes së nxënësit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={mode === 'create' ? 'Regjistro Nxënës' : 'Edito Nxënës'}
        description={mode === 'create' ? 'Shto një nxënës të ri në sistem' : 'Përditëso informacionin e nxënësit'}
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl">
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-4 text-red-400">{error}</div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <div className="rounded-xl border border-white/8 bg-surface-900/40 p-4">
                  <h2 className="mb-4 text-lg font-semibold text-surface-100">Informacioni personal</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Emri *</Label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="P.sh. Ali" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mbiemri *</Label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="P.sh. Hoxha" />
                    </div>
                    <div className="space-y-2">
                      <Label>ID e nxënësit</Label>
                      <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="STD-2025-0001" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gjinia *</Label>
                      <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Zgjidh</option>
                        <option value="Male">Mashkull</option>
                        <option value="Female">Femer</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data e lindjes *</Label>
                      <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Komuna *</Label>
                      <Select value={municipality} onChange={(e) => setMunicipality(e.target.value)}>
                        <option value="">Zgjidh komunën</option>
                        {MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Adresa</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rruga, numri, lagjja" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-surface-900/40 p-4">
                  <h2 className="mb-4 text-lg font-semibold text-surface-100">Informacioni i kontaktit</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Emri i prindit / kujdestarit *</Label>
                      <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Emri i prindit" />
                    </div>
                    <div className="space-y-2">
                      <Label>Numri i telefonit *</Label>
                      <Input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+383 44 123 456" />
                    </div>
                    <div className="space-y-2">
                      <Label>Numri rezervë</Label>
                      <Input type="tel" value={parentPhoneSecondary} onChange={(e) => setParentPhoneSecondary(e.target.value)} placeholder="+383 49 987 654" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email i nxënësit</Label>
                      <Input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="student@example.com" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/8 bg-surface-900/40 p-4">
                  <h2 className="mb-4 text-lg font-semibold text-surface-100">Statusi dhe lloji</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Lloji i nxënësit</Label>
                      <Select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="Regular">Ditor</option>
                        <option value="Boarding">Konviktor</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Statusi</Label>
                      <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="Active">Aktiv</option>
                        <option value="Inactive">Joaktiv</option>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-surface-900/40 p-4">
                  <h2 className="mb-4 text-lg font-semibold text-surface-100">Ndihmë</h2>
                  <ul className="space-y-2 text-sm text-surface-400">
                    <li>• Plotësoni fushat me *</li>
                    <li>• Emaili është opsional</li>
                    <li>• Mund ta ndryshoni statusin më vonë</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex items-center justify-center gap-2">
                {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {loading ? 'Duke ruajtur...' : (mode === 'create' ? 'Ruaj nxënësin' : 'Ruaj ndryshimet')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(mode === 'edit' && id ? `/students/${id}` : '/students')}>
                Anulo
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

/* =========================================================
   👤 DETAJET E NXËNËSIT
========================================================= */
export function StudentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [msg, setMsg] = useState('')

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const res = await api.students.show(id)
        const data = res?.data

        setStudent({
          id: data.id,
          studentId: data.student_id,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || '-',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          className: data.class?.name ?? '-',
          type: data.type,
          status: data.status,
          balance: data.balance ?? 0,
          email: data.student_email || data.email || '-',
          parentName: data.parent_name || '-',
          parentPhone: data.parent_phone || '-',
          parentPhoneSecondary: data.parent_phone_secondary || '-',
          municipality: data.municipality || '-',
          address: data.address || '-',
          dateOfBirth: data.date_of_birth || data.dob || '-',
          gender: data.gender || '-',
          photo: data.photo || '',
        })
      } catch (err) {
        console.error(err)
        setError('Nuk u ngarkua nxënësi.')
      } finally {
        setLoading(false)
      }
    }

    loadStudent()
  }, [id])

  const handleResetPassword = async () => {
    if (!confirm('Rivendos fjalëkalimin e këtij nxënësi në parazgjedhje?')) return

    try {
      await api.students.resetPassword(id)
      setMsg('Fjalëkalimi u rivendos.')
    } catch (e) {
      setMsg('Gabim gjatë rivendosjes së fjalëkalimit.')
    }
    setTimeout(() => setMsg(''), 4000)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 rounded-lg bg-surface-800 animate-pulse" />
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="rounded-lg bg-red-500/10 p-4 text-red-400">{error}</div>
  }

  if (!student) {
    return <div className="text-surface-400">Nxënësi nuk u gjet.</div>
  }

  return (
    <div>
      <PageHeader
        title={student.name}
        description={student.studentId}
        actions={
          <div className="flex gap-2">
            {(user?.role === 'secretary' || user?.role === 'director') && (
              <Button variant="danger" onClick={handleResetPassword}>Rivendos fjalëkalimin</Button>
            )}
            <Link to={`/students/${student.id}/edit`}>
              <Button variant="secondary">Edito</Button>
            </Link>
          </div>
        }
      />

      {msg && <div className="mt-2 text-sm text-surface-50">{msg}</div>}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] mt-4">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-brand-500/15 text-3xl font-semibold text-brand-400">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(student.name)
                )}
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-surface-100">{student.name}</h2>
                <p className="text-sm text-surface-400">{student.studentId}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/8 bg-surface-900/40 p-3">
                <p className="text-xs text-surface-400">Klasa</p>
                <p className="mt-1 font-medium text-surface-100">{student.className}</p>
              </div>
              <div className="rounded-lg border border-white/8 bg-surface-900/40 p-3">
                <p className="text-xs text-surface-400">Statusi</p>
                <p className="mt-1 font-medium text-surface-100">{student.status}</p>
              </div>
              <div className="rounded-lg border border-white/8 bg-surface-900/40 p-3">
                <p className="text-xs text-surface-400">Lloji</p>
                <p className="mt-1 font-medium text-surface-100">{student.type}</p>
              </div>
              <div className="rounded-lg border border-white/8 bg-surface-900/40 p-3">
                <p className="text-xs text-surface-400">Balanca</p>
                <p className="mt-1 font-medium text-surface-100">{formatCurrency(student.balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-surface-100">Të dhënat personale</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-surface-400">Emri</p>
                  <p className="mt-1 text-sm text-surface-100">{student.firstName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400">Mbiemri</p>
                  <p className="mt-1 text-sm text-surface-100">{student.lastName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400">Email</p>
                  <p className="mt-1 text-sm text-surface-100">{student.email}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400">Gjinia</p>
                  <p className="mt-1 text-sm text-surface-100">{student.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400">Data e lindjes</p>
                  <p className="mt-1 text-sm text-surface-100">{student.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400">Komuna</p>
                  <p className="mt-1 text-sm text-surface-100">{student.municipality}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-lg font-semibold text-surface-100">Prindi / kujdestari</h3>
                <div>
                  <p className="text-xs text-surface-400">Emri</p>
                  <p className="mt-1 text-sm text-surface-100">{student.parentName}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400">Telefoni</p>
                  <p className="mt-1 text-sm text-surface-100">{student.parentPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400">Telefoni rezervë</p>
                  <p className="mt-1 text-sm text-surface-100">{student.parentPhoneSecondary}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-lg font-semibold text-surface-100">Vëzhgime, mungesa, sukses</h3>
                <div className="rounded-lg border border-white/8 bg-surface-900/40 p-3 text-sm text-surface-400">
                  Këto seksione mund të plotësohen më vonë me të dhëna nga databaza për vëzhgime, mungesa dhe sukses akademik.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}