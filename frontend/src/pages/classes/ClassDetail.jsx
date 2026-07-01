import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'

export default function ClassDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [klass, setKlass] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const res = await api.classes.show(id)
                if (mounted) setKlass(res?.data)
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

    return (
        <div>
            <PageHeader title={klass.name + (klass.section ? ' - ' + klass.section : '')} description={`Nxënësit e klasës ${klass.name}`} />

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
