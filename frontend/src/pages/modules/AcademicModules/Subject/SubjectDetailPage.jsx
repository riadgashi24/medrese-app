import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'

export function SubjectDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [state, setState] = useState({ subject: null, classes: [], loading: true, error: '' })

    useEffect(() => {
        async function fetchDetails() {
            try {
                // Thirrja përmes skedarit të ri të lidhjes të API-së
                const res = await api.academic.showSubjectDetails(id)

                // Përshtatja e strukturës në varësi të kthimit nga Laravel { success, data: { subject, classes } }
                const payload = res?.data || res
                if (payload) {
                    setState({
                        subject: payload.subject || null,
                        classes: payload.classes || [],
                        loading: false,
                        error: ''
                    })
                }
            } catch (err) {
                console.error(err)
                setState({ subject: null, classes: [], loading: false, error: 'Detajet e kësaj lënde nuk u ngarkuan.' })
            }
        }
        fetchDetails()
    }, [id])

    if (state.loading) return <p className="text-sm text-surface-300 p-6">Duke ngarkuar detajet...</p>
    if (state.error) return <p className="text-sm text-red-400 p-6">{state.error}</p>

    const { subject, classes } = state

    return (
        <div className="space-y-6 p-6">
            <button onClick={() => navigate('/subjects')} className="text-xs text-brand-400 hover:underline bg-transparent border-0 cursor-pointer">
                ← Kthehu te lëndët
            </button>

            <PageHeader title={subject?.name} description={`Kategoria: ${subject?.category} | Niveli: Klasa ${subject?.level}`} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Planprogrami */}
                <Card className="p-4 space-y-3 lg:col-span-1 bg-surface-900 border border-white/10">
                    <h3 className="text-sm font-bold text-surface-200 border-b border-white/10 pb-1">Planprogrami i Lëndës</h3>
                    <p className="text-xs text-surface-400 leading-relaxed">
                        Ky planprogram përfshin materialet bazë, vlerësimin e rregullt periodik dhe testet javore.
                        Të gjithë profesorët ndjekin të njëjtën agjendë akademike të vendosur nga drejtoria.
                    </p>
                </Card>

                {/* Tabela e Klasave ku ky subjekt jepet mësim */}
                <Card className="lg:col-span-2 overflow-hidden bg-surface-900 border border-white/10">
                    <div className="p-4 bg-surface-950 border-b border-white/10">
                        <h3 className="text-sm font-bold text-surface-200">Klasat ku ligjërohet</h3>
                    </div>
                    <table className="w-full border-collapse text-xs text-left">
                        <thead>
                            <tr className="bg-surface-950 text-surface-400 border-b border-white/10">
                                <th className="p-3">Klasa</th>
                                <th className="p-3">Kush e ligjeron</th>
                                <th className="p-3 text-center">Orë në Javë</th>
                                <th className="p-3 text-center">Nxënës</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-surface-500">
                                        Kjo lëndë nuk është caktuar në asnjë klasë ende.
                                    </td>
                                </tr>
                            ) : (
                                classes.map((c) => (
                                    <tr
                                        key={c.class_id}
                                        onClick={() => navigate(`/subjects/${id}/class/${c.class_id}`)}
                                        className="border-b border-white/5 hover:bg-brand-500/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-3 font-bold text-brand-400 group-hover:underline">
                                            {c.class_name}
                                        </td>
                                        <td className="p-3 text-surface-200">{c.teacher_name}</td>
                                        <td className="p-3 text-center font-mono text-surface-300">{c.weekly_hours} orë</td>
                                        <td className="p-3 text-center font-mono text-surface-400">{c.students_count} nxënës</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    )
}