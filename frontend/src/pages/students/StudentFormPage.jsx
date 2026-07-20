import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { User, Phone } from 'lucide-react'
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


export function StudentFormPage({ mode = 'create' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedClassId = searchParams.get('preselectedClassId')
  const id = useParams().id

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

  const MUNICIPALITIES = [
    'Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Mitrovicë', 'Vushtrri', 'Podujevë', 'Shtime', 'Suharekë', 'Istog', 'Deçan', 'Klinë', 'Dragash', 'Kamenicë', 'Leposavić', 'Zubin Potok', 'Zveçan', 'Rahovec', 'Obiliq'
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
          console.error(err)
          setError('Nuk u ngarkuan të dhënat e nxënësit.')
        } finally {
          setLoading(false)
        }
      }
      loadStudent()
    }
  }, [mode, id])

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
      // Kjo sigurohet që asnjë string "null" apo "" mos të shkojë gabim
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
        // E detyrojmë të jetë NUMËR i pastër ose NULL
        class_id: classId && classId !== "" ? parseInt(classId, 10) : null,
        date_of_birth: cleanValue(dob),
        gender: cleanValue(gender),
        municipality: cleanValue(municipality),
        address: cleanValue(address),
        student_email: cleanValue(studentEmail),
        parent_name: cleanValue(parentName),
        parent_phone: cleanValue(parentPhone),
        parent_phone_secondary: cleanValue(parentPhoneSecondary),
        type: type,
        status: status,
      }

      // SHIKO NË CONSOLE TË BROWSER-IT SAKTËSISHT ÇFARË PO NIS HAPASIN
      console.log("Payload që po niset nga fronti:", payload);

      if (mode === 'edit' && id) {
        await api.students.update(id, payload)
        navigate(`/students/${id}`)
      } else {
        await api.students.store(payload)
        navigate('/students')
      }
    } catch (err) {
      console.error('API Error:', err.response?.data)
      // Kjo do të shfaqë gabimin e saktë të Laravelit në ekran
      const laravelErrors = err.response?.data?.errors;
      if (laravelErrors) {
        const firstErrorKey = Object.keys(laravelErrors)[0];
        setError(`${firstErrorKey}: ${laravelErrors[firstErrorKey][0]}`);
      } else {
        setError(err.response?.data?.message || 'Gabim gjatë ruajtjes.');
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
                        {MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
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
                {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {loading ? 'Duke ruajtur...' : (mode === 'create' ? 'Ruaj nxënësin' : 'Ruaj ndryshimet')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (classId) {
                    navigate(mode === 'edit' && id ? `/classes/${classId}/students/${id}` : `/classes/${classId}/students`);
                  } else {
                    navigate('/students');
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
