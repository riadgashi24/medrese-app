import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'


import {
    ArrowLeft,
    Users,
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

    useEffect(() => {
        load()
    }, [])

    async function load() {

        try {

            const res = await api.classes.show(id)

            setClassData(res.data)

        } catch (e) {

            console.error(e)

        } finally {

            setLoading(false)

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

                <CardContent>

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

                    <Button
                        variant="secondary"
                        onClick={() => navigate('/classes')}
                    >

                        <ArrowLeft className="mr-2 h-4 w-4" />

                        Kthehu

                    </Button>

                }

            />

            <Card>

                <CardContent className="space-y-4 py-8">

                    <h2 className="text-4xl font-bold">

                        {classData.name}

                    </h2>

                    <p className="text-surface-400">

                        Kujdestar

                    </p>

                    <p className="font-medium">

                        {classData.guardian?.name ?? 'Pa kujdestar'}

                    </p>

                    <div className="flex items-center gap-2">

                        <Users className="h-5 w-5" />

                        <span>

                            {classData.students_count ?? 0} nxënës

                        </span>

                    </div>

                </CardContent>

            </Card>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

                <ModuleCard
                    icon={Users}
                    title="Nxënësit"
                    onClick={() =>
                        navigate(`/classes/${id}/students`)
                    }
                />

                <ModuleCard
                    icon={CalendarDays}
                    title="Prezenca"
                    onClick={() =>
                        navigate(`/classes/${id}/attendance`)
                    }
                />

                <ModuleCard
                    icon={NotebookPen}
                    title="Notat"
                    onClick={() =>
                        navigate(`/classes/${id}/grades`)
                    }
                />

                <ModuleCard
                    icon={BookOpen}
                    title="Lëndët"
                    onClick={() =>
                        navigate(`/classes/${id}/subjects`)
                    }
                />

                <ModuleCard
                    icon={Clock3}
                    title="Orari"
                    onClick={() =>
                        navigate(`/classes/${id}/timetable`)
                    }
                />

                <ModuleCard
                    icon={DollarSign}
                    title="Pagesat"
                    onClick={() =>
                        navigate(`/classes/${id}/finance`)
                    }
                />

                <ModuleCard
                    icon={FileText}
                    title="Dokumentet"
                    onClick={() =>
                        navigate(`/classes/${id}/documents`)
                    }
                />

            </div>

        </div>

    )

}