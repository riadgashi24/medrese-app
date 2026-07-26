import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Search, UserPlus, LayoutGrid, Table2, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'

export function ClassStudentsPage() {
    const { classId } = useParams()
    const navigate = useNavigate()

    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState('cards')
    const [students, setStudents] = useState([])
    const [currentClass, setCurrentClass] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadClassData = async () => {
            try {
                // Ngarkojmë detajet e klasës dhe listën e nxënësve paralelisht
                const [classRes, studentsRes] = await Promise.all([
                    api.classes.show(classId),
                    api.students.index({ per_page: 1000 })
                ])

                const classInfo = classRes?.data || classRes || {}
                setCurrentClass({
                    id: classInfo.id,
                    name: classInfo.name || classInfo.class_name || 'Klasa',
                    description: classInfo.description || ''
                })

                const allStudents = Array.isArray(studentsRes) ? studentsRes : studentsRes?.data || []

                // Filtrojmë nxënësit që i përkasin ekskluzivisht kësaj klase
                const classFiltered = allStudents
                    .filter((s) => String(s.class?.id ?? s.class_id) === String(classId))
                    .map((s) => ({
                        id: s.id,
                        studentId: s.student_id || '-',
                        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || '-',
                        email: s.student_email || s.email || '-',
                        type: s.type,
                        status: s.status,
                        photo: s.photo || null,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name, 'sq'))

                setStudents(classFiltered)
            } catch (err) {
                console.error('Gabim gjatë ngarkimit të nxënësve të klasës:', err)
            } finally {
                setLoading(false)
            }
        }

        if (classId) loadClassData()
    }, [classId])

    const filteredStudents = students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.toLowerCase().includes(search.toLowerCase())
    )

    const columns = [
        {
            key: 'studentId',
            label: 'ID',
            render: (r) => <span className="font-mono text-xs">{r.studentId}</span>,
        },
        {
            key: 'name',
            label: 'Emri i Plotë',
            render: (r) => <span className="font-medium text-surface-100">{r.name}</span>,
        },
        {
            key: 'email',
            label: 'Email',
            render: (r) => <span className="text-xs text-surface-400">{r.email}</span>,
        },
        {
            key: 'type',
            label: 'Regjimi',
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
                <Badge variant={String(r.status).toLowerCase() === 'active' ? 'success' : 'slate'}>
                    {String(r.status).toLowerCase() === 'active' ? 'Aktiv' : 'Joaktiv'}
                </Badge>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/classes/${classId}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <PageHeader
                        title={`Nxënësit - ${currentClass?.name || ''}`}
                        description={currentClass?.description || 'Menaxhimi i nxënësve të kësaj klase.'}
                        actions={
                            // Dërgojmë classId si query param në mënyrë që formulari i ri ta parazgjedhë automatikisht këtë klasë
                            <Link to={`/students/new?preselectedClassId=${classId}`}>
                                <Button className="gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Shto Nxënës në këtë Klasë
                                </Button>
                            </Link>
                        }
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-900/40 p-4 rounded-xl border border-white/5">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                    <Input
                        placeholder="Kërko nxënësin brenda klasës..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant={viewMode === 'cards' ? 'default' : 'secondary'}
                        onClick={() => setViewMode('cards')}
                        size="sm"
                        className="gap-2"
                    >
                        <LayoutGrid className="h-4 w-4" /> Kartela
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'secondary'}
                        onClick={() => setViewMode('table')}
                        size="sm"
                        className="gap-2"
                    >
                        <Table2 className="h-4 w-4" /> Tabela
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="h-28 animate-pulse bg-surface-800 rounded-xl" />
                    ))}
                </div>
            ) : filteredStudents.length ? (
                viewMode === 'cards' ? (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredStudents.map((student) => (
                            <button
                                key={student.id}
                                type="button"
                                onClick={() => navigate(`/classes/${classId}/students/${student.id}`)}
                                className="text-left focus:outline-none"
                            >
                                <Card className="h-full transition-all hover:border-brand-400/50 hover:bg-surface-900/20">
                                    <CardContent className="flex gap-3 p-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-400">
                                            {student.photo ? (
                                                <img src={student.photo} alt={student.name} className="h-12 w-12 rounded-full object-cover" />
                                            ) : (
                                                student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-surface-100 truncate">{student.name}</p>
                                                <Badge variant={student.type === 'Boarding' ? 'blue' : 'slate'} className="shrink-0">
                                                    {student.type === 'Boarding' ? 'Konviktor' : 'Ditor'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-surface-400 truncate">{student.email}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <Badge variant={String(student.status).toLowerCase() === 'active' ? 'success' : 'slate'}>
                                                    {String(student.status).toLowerCase() === 'active' ? 'Aktiv' : 'Joaktiv'}
                                                </Badge>
                                                <span className="font-mono text-[10px] text-surface-500">{student.studentId}</span>
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
                        onRowClick={(row) => navigate(`/classes/${classId}/students/${row.id}`)}
                    />
                )
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-sm text-surface-400">
                        Nuk u gjet asnjë nxënës në këtë klasë.
                    </CardContent>
                </Card>
            )}
        </div>
    )
}