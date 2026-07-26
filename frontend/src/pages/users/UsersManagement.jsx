import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { api } from '@/lib/api'

export default function UsersManagementPage() {
    const [tab, setTab] = useState('students')
    const [search, setSearch] = useState('')
    const [staffRole, setStaffRole] = useState('')

    const [students, setStudents] = useState([])
    const [staff, setStaff] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const [sRes, stRes] = await Promise.all([api.students.index({ per_page: 1000 }), api.staff.index({ per_page: 1000 })])
                setStudents(sRes?.data || [])
                setStaff(stRes?.data || [])
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    const filteredStudents = students.filter((s) => {
        const q = search.toLowerCase()
        return !q || (`${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || (s.student_id || '').toLowerCase().includes(q))
    })

    const filteredStaff = staff.filter((s) => {
        const q = search.toLowerCase()
        if (staffRole && s.role !== staffRole) return false
        return !q || (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
    })

    const studentColumns = [
        { key: 'student_id', label: 'ID', render: (r) => <span className="font-mono text-xs">{r.student_id}</span> },
        { key: 'name', label: 'Emri', render: (r) => `${r.first_name} ${r.last_name}` },
        { key: 'class', label: 'Klasa', render: (r) => r.class?.name || '-' },
        { key: 'type', label: 'Lloji', render: (r) => <Badge variant={r.type === 'Boarding' ? 'blue' : 'slate'}>{r.type === 'Boarding' ? 'Konviktor' : 'Ditor'}</Badge> },
    ]

    const staffColumns = [
        { key: 'name', label: 'Emri' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Roli', render: (r) => <Badge>{r.role}</Badge> },
    ]

    return (
        <div>
            <PageHeader title="Menaxhimi i Perdoruesve" description="Lista e nxënësve dhe stafit" />

            <Card className="mb-4">
                <CardContent className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <div className="flex gap-2">
                        <Button variant={tab === 'students' ? 'default' : 'ghost'} onClick={() => setTab('students')}>Nxënës</Button>
                        <Button variant={tab === 'staff' ? 'default' : 'ghost'} onClick={() => setTab('staff')}>Staf</Button>
                    </div>

                    <div className="flex-1" />

                    <Input placeholder="Kërko..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />

                    {tab === 'staff' && (
                        <Select value={staffRole} onChange={(e) => setStaffRole(e.target.value)} className="max-w-xs">
                            <option value="">Të gjithë rolet</option>
                            <option value="director">Director</option>
                            <option value="secretary">Secretary</option>
                            <option value="teacher">Teacher</option>
                            <option value="cashier">Cashier</option>
                            <option value="educator">Educator</option>
                        </Select>
                    )}
                </CardContent>
            </Card>

            {tab === 'students' ? (
                <DataTable columns={studentColumns} data={filteredStudents.map((s) => ({ ...s, name: `${s.first_name} ${s.last_name}` }))} loading={loading} />
            ) : (
                <DataTable columns={staffColumns} data={filteredStaff} loading={loading} />
            )}
        </div>
    )
}
