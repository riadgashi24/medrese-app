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

/* =========================================================
   📋 NXËNËSIT - LISTA
========================================================= */
export function StudentsPage() {
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.students.index()

        const data = (res?.data || []).map((student) => ({
          id: student.id,
          studentId: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
          className: student.class?.name ?? '-',
          type: student.type,
          status: student.status,
          balance: student.balance ?? 0,
        }))

        setStudents(data)
      } catch (err) {
        console.error('Gabim gjatë ngarkimit të nxënësve', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filtered = students.filter((s) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId || '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'studentId',
      label: 'ID e nxënësit',
      render: (r) => <span className="font-mono text-xs">{r.studentId}</span>,
    },
    {
      key: 'name',
      label: 'Emri',
      render: (r) => <span>{r.name}</span>,
    },
    {
      key: 'className',
      label: 'Klasa',
      render: (r) => <span className="font-mono text-xs">{r.className}</span>,
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
      render: (r) => (
        <Badge variant="success">
          {r.status === 'active' ? 'Aktiv' : r.status}
        </Badge>
      ),
    },
    {
      key: 'balance',
      label: 'Balanca',
      render: (r) => (
        <span className="font-mono">{formatCurrency(r.balance)}</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('students.title')}
        description={t('students.description')}
        actions={
          <Link to="/students/new">
            <Button>{t('students.register')}</Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <CardContent className="pt-0">
          <Input
            placeholder={t('students.search_placeholder')}
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
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/students/${row.id}`)}
        />
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

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [type, setType] = useState('Regular')
  const [email, setEmail] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [step, setStep] = useState(1)

  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')

  /* load classes */
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await api.classes.index()
        setClasses(res?.data || [])
      } catch (err) {
        console.error('Gabim gjatë ngarkimit të klasave', err)
      }
    }

    loadClasses()
  }, [])

  /* default class */
  useEffect(() => {
    if (classes.length > 0) {
      setClassId(classes[0].id)
    }
  }, [classes])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // if not final step, advance
    if (step !== 3) {
      setStep((s) => Math.min(3, s + 1))
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.students.store({
        first_name: firstName,
        last_name: lastName,
        class_id: Number(classId),
        type,
        parent_email: email || null,
        municipality: municipality || null,
      })

      navigate('/students')
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
        description="Shto një nxënës të ri në sistem"
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardContent className="space-y-4">

            {error && (
              <div className="rounded-lg bg-red-500/10 p-4 text-red-400">
                {error}
              </div>
            )}

            {/* Multi-step form */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Emri</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mbiemri</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <Label>Komuna</Label>
                  <Input
                    placeholder="Shkruaj komunën e banimit"
                    value={municipality}
                    onChange={(e) => {
                      const v = e.target.value
                      setMunicipality(v)
                      // If municipality is not Prishtinë, enforce Boarding
                      if (v && v.trim().toLowerCase() !== 'prishtinë' && type !== 'Boarding') {
                        setType('Boarding')
                      }
                    }}
                  />
                  <p className="text-xs text-surface-400">Nëse komuna nuk është Prishtinë, nxënësi do të konsiderohet konviktor.</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Klasa</Label>
                  <Select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lloji i nxënësit</Label>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={municipality && municipality.trim().toLowerCase() !== 'prishtinë'}
                  >
                    <option value="Regular">Ditor</option>
                    <option value="Boarding">Konviktor</option>
                  </Select>
                  {municipality && municipality.trim().toLowerCase() !== 'prishtinë' && (
                    <p className="text-xs text-surface-400">Komuna jashtë Prishtinës — konviktor kërkohet.</p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label>Email i prindit</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))}>
                  Mbrapa
                </Button>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {loading ? 'Duke ruajtur...' : (step === 3 ? 'Ruaj Nxënësin' : 'Vazhdo')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/students')}
              >
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
          name: `${data.first_name} ${data.last_name}`,
          className: data.class?.name ?? '-',
          type: data.type,
          status: data.status,
          balance: data.balance ?? 0,
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
            <div
              key={i}
              className="h-28 rounded-xl bg-surface-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-4 text-red-400">
        {error}
      </div>
    )
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

      <div className="grid md:grid-cols-4 gap-4">
        {[
          ['Klasa', student.className],
          ['Lloji', student.type],
          ['Statusi', student.status],
          ['Balanca', formatCurrency(student.balance)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent>
              <p className="text-xs text-surface-300">{label}</p>
              <p className="mt-1 text-lg font-mono text-surface-50">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}