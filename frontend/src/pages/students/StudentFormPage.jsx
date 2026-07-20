import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { User, Phone, GraduationCap } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'

function normalizeListResponse(response, fallback = []) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return fallback
}

const MUNICIPALITIES = [
  'Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Mitrovicë',
  'Vushtrri', 'Podujevë', 'Shtime', 'Suharekë', 'Istog', 'Deçan', 'Klinë',
  'Dragash', 'Kamenicë', 'Leposavić', 'Zubin Potok', 'Zveçan', 'Rahovec', 'Obiliq'
]

export function StudentFormPage({ mode = 'create', studentData: propStudentData = null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { id } = useParams()

  const initialData = propStudentData || location.state?.studentData || null
  const preselectedClassId = searchParams.get('preselectedClassId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const [classId, setClassId] = useState(preselectedClassId || '')
  const [classes, setClasses] = useState([])

  // Populates form fields from a student data object
  const populateForm = (data) => {
    setFirstName(data.first_name || '')
    setLastName(data.last_name || '')
    setType(data.type || 'Regular')
    setStatus(data.status || 'Active')
    setMunicipality(data.municipality || '')
    setStudentId(data.student_id || '')
    setStudentEmail(data.student_email || data.email || '')
    setParentName(data.parent_name || '')
    setParentPhone(data.parent_phone || '')
    setParentPhoneSecondary(data.parent_phone_secondary || '')
    setAddress(data.address || '')

    const rawDob = data.date_of_birth || data.dob || ''
    const formattedDob = typeof rawDob === 'string' ? rawDob.split('T')[0] : ''
    setDob(formattedDob)
    setGender(data.gender || '')

    const currentClassId = data.class_id || data.class?.id || ''
    if (currentClassId) {
      setClassId(String(currentClassId))
    }
  }

  // Hook runs unconditionally
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const classesRes = await api.classes.index({ status: 'Active' })
        setClasses(normalizeListResponse(classesRes))

        if (mode === 'edit') {
          if (initialData) {
            populateForm(initialData)
          } else if (id) {
            const res = await api.students.show(id)
            populateForm(res?.data || {})
          }
        }
      } catch (err) {
        console.error(err)
        setError('Nuk u mundësua ngarkimi i të dhënave.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [mode, id, initialData])

  const validate = () => {
    setError('')
    if (!firstName.trim() || !lastName.trim()) return 'Emri dhe mbiemri janë të detyrueshëm.'
    if (!municipality) return 'Zgjidhni komunën.'
    if (!dob) return 'Zgjidhni datën e lindjes.'
    if (!gender) return 'Zgjidhni gjininë.'
    if (!parentName.trim() || !parentPhone.trim()) return 'Të dhënat kryesore të prindit janë të detyrueshme.'
    if (studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) return 'Emaili i nxënësit nuk është i vlefshëm.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const cleanValue = (val) => {
        if (val === undefined || val === null || String(val).trim() === '') {
          return null
        }
        return String(val).trim()
      }

      const payload = {
        first_name: cleanValue(firstName),
        last_name: cleanValue(lastName),
        student_id: cleanValue(studentId),
        class_id: classId && classId !== '' ? parseInt(classId, 10) : null,
        date_of_birth: cleanValue(dob),
        gender: cleanValue(gender),
        municipality: cleanValue(municipality),
        address: cleanValue(address),
        student_email: cleanValue(studentEmail),
        parent_name: cleanValue(parentName),
        parent_phone: cleanValue(parentPhone),
        parent_phone_secondary: cleanValue(parentPhoneSecondary),
        type,
        status,
      }

      if (mode === 'edit' && id) {
        console.log(payload);
        await api.students.update(id, payload)
        navigate(`/students/${id}`)
      } else {
        await api.students.store(payload)
        navigate('/students')
      }
    } catch (err) {
      console.error('API Error:', err.response?.data)
      const laravelErrors = err.response?.data?.errors
      if (laravelErrors) {
        const firstErrorKey = Object.keys(laravelErrors)[0]
        setError(`${firstErrorKey}: ${laravelErrors[firstErrorKey][0]}`)
      } else {
        setError(err.response?.data?.message || 'Gabim gjatë ruajtjes.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Regjistro Nxënës' : 'Edito Nxënës'}
        description={mode === 'create' ? 'Shto një nxënës të ri në sistem' : 'Përditëso informacionin e nxënësit'}
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl">
          <CardContent className="space-y-6 p-6">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                {/* Personal Info */}
                <div className="rounded-xl border border-white/8 bg-surface-900/40 p-4 space-y-4">
                  <h2 className="text-md font-semibold text-surface-100 flex items-center gap-2">
                    <User className="h-4 w-4 text-brand-400" /> Informacioni personal
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Emri *</Label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ali" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mbiemri *</Label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Hoxha" />
                    </div>
                    <div className="space-y-2">
                      <Label>ID e nxënësit</Label>
                      <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="STD-2026-0001" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gjinia *</Label>
                      <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Zgjidh</option>
                        <option value="Male">Mashkull</option>
                        <option value="Female">Femër</option>
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
                        {MUNICIPALITIES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Adresa</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rruga, lagjja..." />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="rounded-xl border border-white/8 bg-surface-900/40 p-4 space-y-4">
                  <h2 className="text-md font-semibold text-surface-100 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-brand-400" /> Informacioni i kontaktit
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Emri i prindit / kujdestarit *</Label>
                      <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Emri i plotë" />
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

              {/* Sidebar controls */}
              <div className="space-y-4">
                <div className="rounded-xl border border-white/8 bg-surface-900/40 p-4 space-y-4">
                  <h2 className="text-md font-semibold text-surface-100 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-brand-400" /> Klasa
                  </h2>
                  <div className="space-y-2">
                    <Label>Zgjidh Klasën</Label>
                    <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                      <option value="">Pa klasë (E papërcaktuar)</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name || cls.class_name || `Klasa ${cls.id}`}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-surface-900/40 p-4 space-y-4">
                  <h2 className="text-md font-semibold text-surface-100">Statusi & Lloji</h2>
                  <div className="space-y-3">
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
                  <h3 className="text-sm font-semibold text-surface-200 mb-2">Ndihmë</h3>
                  <ul className="text-xs text-surface-400 space-y-1">
                    <li>• Fushat e shënuara me (*) janë të detyrueshme.</li>
                    <li>• Sigurohuni që ID e nxënësit të jetë unike.</li>
                    <li>• Statusi mund të çaktivizohet në çdo kohë.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {loading
                  ? 'Duke ruajtur...'
                  : mode === 'create'
                    ? 'Ruaj nxënësin'
                    : 'Ruaj ndryshimet'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (mode === 'edit' && id) {
                    navigate(`/students/${id}`)
                  } else if (classId) {
                    navigate(`/classes/${classId}/students`)
                  } else {
                    navigate('/students')
                  }
                }}
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