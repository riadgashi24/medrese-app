import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

function useApiData(load, fallback = []) {
    const [data, setData] = useState(fallback)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let mounted = true

        async function run() {
            try {
                const response = await load()
                if (mounted) {
                    const normalized = Array.isArray(response)
                        ? response
                        : response?.data ?? fallback

                    setData(normalized)
                }
            } catch (err) {
                console.error(err)
                if (mounted) setError('Te dhenat nuk u ngarkuan.')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        run()
        return () => {
            mounted = false
        }
    }, [])

    return { data, loading, error }
}

function EmptyMessage({ loading, error, message = 'Nuk ka te dhena per t’u shfaqur.' }) {
    if (loading) return <p className="text-sm text-surface-300 p-4">Duke ngarkuar orarin...</p>
    if (error) return <p className="text-sm text-red-400 p-4">{error}</p>
    return <p className="text-sm text-surface-300 p-4">{message}</p>
}

export function TimetablePage() {
    const { data: rawData, loading, error } = useApiData(api.academic.timetable)
    const navigate = useNavigate()

    // RREGULLIMI: useApiData e kthen direkt array-in e pastër, kështu që nuk ka nevojë për .data përsëri
    const data = Array.isArray(rawData) ? rawData : []

    const days = ['E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte']
    const slots = [1, 2, 3, 4, 5, 6, 7]

    // 1. Ekstraktojmë listën unike të profesorëve nga të dhënat e orarit
    const teachersMap = {}
    data.forEach((slot) => {
        if (slot.teacher_user) {
            teachersMap[slot.teacher_user.id] = {
                id: slot.teacher_user.id,
                name: slot.teacher_user.name,
                subject: slot.subject?.name || '-',
            }
        }
    })
    const teachers = Object.values(teachersMap)

    // Helper funksion për të gjetur klasën në një qelizë specifike
    const getSlotClass = (teacherId, day, slotNumber) => {
        const found = data.find(
            (s) =>
                s.teacher_user_id === teacherId &&
                s.day === day &&
                parseInt(s.slot_number) === slotNumber
        )
        return found ? found : null
    }

    // Nëse është duke u ngarkuar, shfaqim mesazhin e ngarkimit pa dështuar te tabela
    if (loading) {
        return <EmptyMessage loading={loading} error={error} />
    }

    // Nëse ka përfunduar ngarkimi dhe vërtet nuk ka profesorë/orar
    if (!loading && !teachers.length) {
        return <EmptyMessage loading={loading} error={error} />
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Orari Mësimor" description="Viti Shkollor 2025/2026" />

            <Card className="overflow-x-auto">
                <table className="w-full border-collapse text-xs text-left border border-white/10">
                    {/* Header i Tabelës */}
                    <thead>
                        <tr className="bg-surface-900 text-surface-200 border-b border-white/10">
                            <th rowSpan="2" className="p-2 border-r border-white/10 font-bold min-w-[150px]">Profesorët</th>
                            <th rowSpan="2" className="p-2 border-r border-white/10 font-bold min-w-[100px]">Lënda</th>
                            {days.map((day) => (
                                <th key={day} colSpan="7" className="p-1 text-center border-r border-white/10 font-bold bg-surface-800">
                                    {day}
                                </th>
                            ))}
                        </tr>
                        <tr className="bg-surface-850 text-surface-400 border-b border-white/10 text-[10px]">
                            {days.map((day) =>
                                slots.map((slot) => (
                                    <th key={`${day}-${slot}`} className="p-1 text-center border-r border-white/10 font-mono w-7">
                                        {slot}
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>

                    {/* Trupi i Tabelës */}
                    <tbody>
                        {teachers.map((teacher) => (
                            <tr key={teacher.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                {/* Emri Profesorit */}
                                <td className="p-2 border-r border-white/10 font-medium text-surface-100 bg-surface-900/30 sticky left-0">
                                    {teacher.name}
                                </td>
                                {/* Lënda */}
                                <td className="p-2 border-r border-white/10 text-surface-300">
                                    {teacher.subject}
                                </td>
                                {/* Qelizat e Orarit (Matrica 5 ditë x 7 orë) */}
                                {days.map((day) =>
                                    slots.map((slotNum) => {
                                        const slotData = getSlotClass(teacher.id, day, slotNum)
                                        return (
                                            <td
                                                key={`${day}-${slotNum}`}
                                                className={`p-1 border-r border-white/5 text-center font-mono text-[11px] h-9 ${slotData ? 'bg-brand-500/10 text-brand-400 font-bold cursor-pointer hover:bg-brand-500/20' : 'text-surface-700'
                                                    }`}
                                                onClick={() => {
                                                    if (slotData?.class?.id) {
                                                        navigate(`/attendance?timetable_class=${slotData.class.id}`)
                                                    }
                                                }}
                                            >
                                                {slotData ? slotData.class?.name : ''}
                                            </td>
                                        )
                                    })
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    )
}

export function GradesPage() {
    return (
        <div>
            <PageHeader title="Notat dhe vleresimet" description="Percjellja e suksesit akademik" />
            <Card><CardContent><p className="text-sm text-surface-300">Moduli i notave eshte gati per integrim me backend.</p></CardContent></Card>
        </div>
    )
}