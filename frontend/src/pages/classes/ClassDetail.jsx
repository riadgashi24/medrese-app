import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { Label, Select, Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export default function ClassDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [klass, setKlass] = useState(null)
    const [loading, setLoading] = useState(true)
    const [staff, setStaff] = useState([])
    const [allStudents, setAllStudents] = useState([])
    const [homeroom, setHomeroom] = useState('')
    const [selectedStudents, setSelectedStudents] = useState([])
    const [saving, setSaving] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const res = await api.classes.show(id)
                if (mounted) setKlass(res?.data)
                if (mounted) setHomeroom(res?.data?.homeroom_staff_id || '')
                // load staff and students for assignment
                const [stRes, sRes] = await Promise.all([api.staff.index({ per_page: 1000 }), api.students.index({ per_page: 1000 })])
                if (mounted) {
                    setStaff(stRes?.data || [])
                    setAllStudents(sRes?.data || [])
                    setSelectedStudents((res?.data?.students || []).map((s) => s.id))
                }
            } catch (e) {
                console.error(e)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()
        return () => { mounted = false }
    }, [id])

    if (loading) return <div className="space-y-4"><div className="h-8 w-64 bg-surface-800 animate-pulse" /></div>

    if (!klass) return <div className="text-red-400">Klasë nuk u gjet.</div>

    const handleSaveHomeroom = async () => {
        setSaving(true)
        try {
            await api.classes.assignHomeroom(id, homeroom)
            // reload class
            const res = await api.classes.show(id)
            setKlass(res?.data)
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleAssignStudents = async () => {
        setSaving(true)
        try {
            await api.classes.assignStudents(id, selectedStudents)
            const res = await api.classes.show(id)
            setKlass(res?.data)
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <PageHeader title={klass.name + (klass.section ? ' - ' + klass.section : '')} description={`Nxënësit e klasës ${klass.name}`} />

            <Card className="mb-4">
                <CardContent className="grid md:grid-cols-3 gap-4 items-end">
                    <div>
                        <Label>Shkolla</Label>
                        <div className="text-surface-100">{klass.academic_year?.label || '-'}</div>
                    </div>

                    <div>
                        <Label>Mentori i klasës</Label>
                        <Select value={homeroom} onChange={(e) => setHomeroom(e.target.value)}>
                            <option value="">Pa mentore</option>
                            {staff.map((st) => (
                                <option key={st.id} value={st.id}>{st.first_name} {st.last_name} ({st.position || st.role || st.email})</option>
                            ))}
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleSaveHomeroom} disabled={saving}>{saving ? 'Duke ruajtur...' : 'Ruvo mentorin'}</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-4">
                <CardContent>
                    <Label>Caktimi i nxënësve</Label>
                    <div className="mt-2">
                        <select multiple value={selectedStudents.map(String)} onChange={(e) => {
                            const opts = Array.from(e.target.selectedOptions).map(o => Number(o.value))
                            setSelectedStudents(opts)
                        }} className="w-full h-48 p-2 bg-surface-800">
                            {allStudents.map((s) => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.student_id} {s.class_id === klass.id ? '(Aktual)' : ''}</option>
                            ))}
                        </select>

                        <div className="mt-2 flex gap-2">
                            <Button onClick={handleAssignStudents} disabled={saving}>{saving ? 'Duke ruajtur...' : 'Cakto nxënësit'}</Button>
                            <Button variant="secondary" onClick={() => setSelectedStudents((klass.students || []).map(s => s.id))}>Pastro</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
                {(klass.students || []).map((s) => (
                    <Card key={s.id} onClick={() => navigate(`/students/${s.id}`)} className="cursor-pointer">
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-surface-800 flex items-center justify-center font-mono">{(s.first_name || '').charAt(0)}{(s.last_name || '').charAt(0)}</div>
                                <div>
                                    <div className="font-medium">{s.first_name} {s.last_name}</div>
                                    <div className="text-xs text-surface-400">{s.student_id} • {s.type === 'Boarding' ? 'Konviktor' : 'Ditor'}</div>
                                </div>
                                <div className="flex-1" />
                                <div className="text-xs font-mono">{s.status}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
