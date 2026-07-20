import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, GraduationCap, Users } from 'lucide-react'

import { api } from '@/lib/api'
import { normalizeListResponse } from '@/lib/utils'

import { PageHeader } from '@/components/ui/PageHeader'
import { ClassCard } from '@/components/ui/ClassCard'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

export default function ClassesPage() {
    const navigate = useNavigate()

    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadClasses()
    }, [])

    async function loadClasses() {
        try {
            setLoading(true)

            const res = await api.classes.index({
                per_page: 1000,
            })

            const data = normalizeListResponse(res, [])

            const mapped = data.map((item) => ({
                id: item.id,
                name:
                    item.name ||
                    item.class_name ||
                    `${item.grade}/${item.section || ''}`,

                grade:
                    Number(item.grade) ||
                    Number(
                        String(item.name || '')
                            .replace(/\D/g, '')
                            .substring(0, 2)
                    ),

                // 💡 MARRJA E SAKTË E KUJDESTARIT:
                // Kontrollon nëse është string direkt (item.guardian), pastaj nëse është objekt apo field tjetër
                guardian:
                    (typeof item.guardian === 'string' ? item.guardian : item.guardian?.name) ||
                    item.guardian_name ||
                    (item.homeroom_staff ? `${item.homeroom_staff.first_name} ${item.homeroom_staff.last_name}` : null) ||
                    'Pa kujdestar',

                // 💡 MARRJA E SAKTË E NXËNËSVE:
                // Së pari me marrë item.students nëse është numër, pastaj fallback te çelësat tjerë
                students:
                    (typeof item.students === 'number' ? item.students : null) ??
                    item.students_count ??
                    (Array.isArray(item.students) ? item.students.length : 0),
            }))

            setClasses(mapped)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filtered = useMemo(() => {
        return classes.filter((c) => {
            const q = search.toLowerCase()

            return (
                c.name.toLowerCase().includes(q) ||
                c.guardian.toLowerCase().includes(q)
            )
        })
    }, [classes, search])

    const grade10 = filtered.filter((c) => c.grade === 10)
    const grade11 = filtered.filter((c) => c.grade === 11)
    const grade12 = filtered.filter((c) => c.grade === 12)

    return (
        <div className="space-y-6">

            <PageHeader
                title="Klasat"
                description="Menaxhimi i klasave"
                actions={
                    <Button onClick={() => navigate('/classes/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Shto klasë
                    </Button>
                }
            />

            <Card>
                <CardContent className="pt-6">

                    <div className="relative max-w-md">

                        <Search className="absolute left-3 top-3 h-4 w-4 text-surface-500" />

                        <Input
                            className="pl-10"
                            placeholder="Kërko klasën ose kujdestarin..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                    </div>

                </CardContent>
            </Card>

            {loading ? (

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

                    {Array.from({ length: 9 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="h-36 animate-pulse bg-surface-800 rounded-xl" />
                        </Card>
                    ))}

                </div>

            ) : (

                <>

                    <ClassGroup
                        title="Klasat e 10-ta"
                        classes={grade10}
                        navigate={navigate}
                    />

                    <ClassGroup
                        title="Klasat e 11-ta"
                        classes={grade11}
                        navigate={navigate}
                    />

                    <ClassGroup
                        title="Klasat e 12-ta"
                        classes={grade12}
                        navigate={navigate}
                    />

                </>

            )}

        </div>
    )
}

function ClassGroup({ title, classes, navigate }) {
    return (
        <div className="space-y-4">

            <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                    <GraduationCap className="h-5 w-5 text-brand-500" />

                    <h2 className="text-xl font-semibold">
                        {title}
                    </h2>

                </div>

                <Badge variant="blue">
                    {classes.length} Klasa
                </Badge>

            </div>

            {classes.length ? (

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

                    {classes.map((item) => (

                        <ClassCard
                            key={item.id}
                            classItem={item}
                            onClick={() => navigate(`/classes/${item.id}`)}
                        >

                            {/* <CardContent className="space-y-5">

                                <div>

                                    <h3 className="text-2xl font-bold">
                                        {item.name}
                                    </h3>

                                    <p className="text-sm text-surface-400">
                                        {item.guardian}
                                    </p>

                                </div>

                                <div className="flex items-center justify-between">

                                    <div className="flex items-center gap-2 text-surface-400">

                                        <Users className="h-4 w-4" />

                                        <span>
                                            {item.students} nxënës
                                        </span>

                                    </div>

                                    <Badge>
                                        Hape
                                    </Badge>

                                </div>

                            </CardContent> */}

                        </ClassCard>

                    ))}

                </div>

            ) : (

                <Card>

                    <CardContent className="py-10 text-center text-surface-500">

                        Nuk ka klasa.

                    </CardContent>

                </Card>

            )}

        </div>
    )
}