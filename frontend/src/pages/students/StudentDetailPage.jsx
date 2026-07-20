import { useEffect, useState } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  KeyRound,
  Pencil,
  User,
  CalendarDays,
  MapPin,
  Mail,
  Wallet
} from 'lucide-react'

import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'NX'
}

export function StudentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [msg, setMsg] = useState('')
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const res = await api.students.show(id)
        const data = res?.data || {}

        setStudent({
          id: data.id,
          studentId: data.student_id || '-',
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || '-',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          className: data.class?.name ?? '-',
          type: data.type || 'Regular',
          status: data.status || 'Active',
          balance: data.balance ?? 0,
          email: data.student_email || data.email || '-',
          parentName: data.parent_name || '-',
          parentPhone: data.parent_phone || '-',
          parentPhoneSecondary: data.parent_phone_secondary || '-',
          municipality: data.municipality || '-',
          address: data.address || '-',
          dateOfBirth: data.date_of_birth || data.dob || '-',
          gender: data.gender === 'Male' ? 'Mashkull' : data.gender === 'Female' ? 'Femër' : '-',
          photo: data.photo || null,
        })
      } catch (err) {
        console.error(err)
        setError('Nuk u ngarkua informacioni për nxënësin.')
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
      setMsg('Fjalëkalimi u rivendos me sukses.')
    } catch (e) {
      setMsg('Gabim gjatë rivendosjes së fjalëkalimit.')
    }
    setTimeout(() => setMsg(''), 4000)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="h-64 animate-pulse bg-surface-800 rounded-xl" />
      </Card>
    )
  }

  if (error) {
    return <div className="rounded-lg bg-red-500/10 p-4 text-red-400 text-sm">{error}</div>
  }

  if (!student) {
    return <div className="text-surface-400 text-sm">Nxënësi nuk u gjet.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={student.name}
            description={`ID e Nxënësit: ${student.studentId}`}
            actions={
              <div className="flex items-center gap-2">
                {(user?.role === 'secretary' || user?.role === 'director') && (
                  <Button variant="destructive" onClick={handleResetPassword} className="gap-2">
                    <KeyRound className="h-4 w-4" /> Rivendos Fjalëkalimin
                  </Button>
                )}
                <Link to={`/students/${student.id}/edit`}>
                  <Button variant="secondary" className="gap-2">
                    <Pencil className="h-4 w-4" /> Edito
                  </Button>
                </Link>
              </div>
            }
          />
        </div>
      </div>

      {msg && <div className="rounded-lg bg-surface-800 p-3 text-sm text-surface-200 animate-fade-in">{msg}</div>}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Profile Card Summary */}
        <Card className="h-fit">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-500/15 text-2xl font-semibold text-brand-400 border border-white/5">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(student.name)
                )}
              </div>
              <div className="mt-4 space-y-1">
                <h2 className="text-lg font-semibold text-surface-100">{student.name}</h2>
                <Badge variant={String(student.status).toLowerCase() === 'active' ? 'success' : 'slate'}>
                  {String(student.status).toLowerCase() === 'active' ? 'Aktiv' : 'Joaktiv'}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 text-xs">
              <div className="rounded-xl border border-white/5 bg-surface-900/50 p-3">
                <span className="text-surface-400 flex items-center gap-1"><Users className="h-3 w-3" /> Klasa</span>
                <p className="mt-1 font-semibold text-surface-100 truncate">{student.className}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-surface-900/50 p-3">
                <span className="text-surface-400 flex items-center gap-1"><User className="h-3 w-3" /> Lloji</span>
                <p className="mt-1 font-semibold text-surface-100">{student.type === 'Boarding' ? 'Konviktor' : 'Ditor'}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-surface-900/50 p-3 col-span-2">
                <span className="text-surface-400 flex items-center gap-1"><Wallet className="h-3 w-3" /> Balanca financiare</span>
                <p className="mt-1 text-sm font-bold text-surface-100">{formatCurrency(student.balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Details tab/grid */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-md font-semibold text-surface-100 border-b border-white/5 pb-2">Të dhënat Personale</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-surface-400 block">Emri dhe Mbiemri</span>
                  <span className="text-surface-100 font-medium">{student.firstName} {student.lastName}</span>
                </div>
                <div>
                  <span className="text-xs text-surface-400 block">Gjinia</span>
                  <span className="text-surface-100 font-medium">{student.gender}</span>
                </div>
                <div>
                  <span className="text-xs text-surface-400 block">Email i Nxënësit</span>
                  <span className="text-surface-100 font-medium flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-surface-400" /> {student.email}</span>
                </div>
                <div>
                  <span className="text-xs text-surface-400 block">Data e Lindjes</span>
                  <span className="text-surface-100 font-medium flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-surface-400" /> {student.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-xs text-surface-400 block">Komuna</span>
                  <span className="text-surface-100 font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-surface-400" /> {student.municipality}</span>
                </div>
                <div>
                  <span className="text-xs text-surface-400 block">Adresa e Vendbanimit</span>
                  <span className="text-surface-100 font-medium">{student.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-3 text-sm">
                <h3 className="text-sm font-semibold text-surface-100 border-b border-white/5 pb-2">Prindi / Kujdestari</h3>
                <div>
                  <span className="text-xs text-surface-400 block">Emri i Plotë</span>
                  <span className="text-surface-100 font-medium">{student.parentName}</span>
                </div>
                <div>
                  <span className="text-xs text-surface-400 block">Numri i Telefonit</span>
                  <span className="text-surface-100 font-medium text-brand-400">{student.parentPhone}</span>
                </div>
                {student.parentPhoneSecondary !== '-' && (
                  <div>
                    <span className="text-xs text-surface-400 block">Numri Rezervë</span>
                    <span className="text-surface-100 font-medium">{student.parentPhoneSecondary}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2">
                <h3 className="text-sm font-semibold text-surface-100 border-b border-white/5 pb-2">Vëzhgime & Suksesi</h3>
                <div className="rounded-xl border border-white/5 bg-surface-900/30 p-3 text-xs text-surface-400 leading-relaxed">
                  Moduli i mungesave, notave dhe vëzhgimeve akademike do të pasqyrohet këtu automatikisht në përditësimet e ardhshme.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}