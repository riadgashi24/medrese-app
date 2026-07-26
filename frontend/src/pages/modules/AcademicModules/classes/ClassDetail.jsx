import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    Pencil,
    Users,
    Trash2,
    Loader2,
    CalendarDays,
    NotebookPen,
    BookOpen,
    Clock3,
    DollarSign,
    FileText,
} from 'lucide-react'

import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import ModuleCard from './ModuleCard'

export default function ClassDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [classData, setClassData] = useState(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        load()
    }, [id])

    async function load() {
        try {
            setLoading(true)
            const res = await api.classes.show(id)

            // Laravel shpesh e kthen objektin te res.data.data
            const rawData = res.data?.data || res.data

            if (rawData) {
                // Formatim fallback në rast se backend vjen pa transformim
                const guardianName =
                    rawData.guardian ||
                    (rawData.homeroom_staff
                        ? `${rawData.homeroom_staff.first_name || ''} ${rawData.homeroom_staff.last_name || ''}`.trim()
                        : null) ||
                    'Pa kujdestar'

                const studentCount =
                    rawData.students ??
                    rawData.students_count ??
                    (Array.isArray(rawData.students) ? rawData.students.length : 0)

                setClassData({
                    ...rawData,
                    guardian: guardianName,
                    studentsCount: studentCount,
                })
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        const confirmDelete = window.confirm(
            'A jeni të sigurt që dëshironi ta fshini këtë klasë? Kjo procedurë nuk mund të kthehet mbrapa!'
        )
        if (!confirmDelete) return

        try {
            setDeleting(true)
            await api.classes.destroy(id)
            navigate('/classes')
        } catch (err) {
            console.error('Gabim gjatë fshirjes së klasës:', err)
            alert('Dështoi fshirja e klasës. Sigurohuni që klasa nuk ka nxënës të lidhur.')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="h-64 animate-pulse bg-surface-800 rounded-xl" />
            </Card>
        )
    }

    if (!classData) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-surface-400">
                    Klasa nuk u gjet.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={classData.name}
                description="Detajet e klasës"
                actions={
                    <div className="flex items-center gap-2">
                        {/* Kthehu */}
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/classes')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kthehu
                        </Button>

                        {/* Ndrysho */}
                        <Button
                            onClick={() => navigate(`/classes/${id}/edit`)}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Ndrysho
                        </Button>

                        {/* Fshij - me variant destructive */}
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            {deleting ? 'Po fshihet...' : 'Fshij'}
                        </Button>
                    </div>
                }
            />

            <Card>
                <CardContent className="space-y-4 py-8">
                    <h2 className="text-4xl font-bold">
                        {classData.name}
                    </h2>

                    <div>
                        <p className="text-sm text-surface-400">
                            Kujdestar
                        </p>
                        <p className="text-lg font-medium">
                            {classData.guardian}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-surface-300">
                        <Users className="h-5 w-5 text-brand-500" />
                        <span className="font-semibold">
                            {classData.studentsCount} nxënës
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Modulet e klasës — vetëm ato me route ekzistuese */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                <ModuleCard
                    icon={Users}
                    title="Nxënësit"
                    onClick={() => navigate(`/classes/${id}/students`)}
                />

                <ModuleCard
                    icon={CalendarDays}
                    title="Prezenca"
                    onClick={() => navigate(`/classes/${id}/attendance`)}
                />

                <ModuleCard
                    icon={NotebookPen}
                    title="Notat"
                    onClick={() => navigate(`/classes/${id}/grades`)}
                />
            </div>
        </div>
    )
}