import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api' // apo path-i ku ndodhet api juaj

const categoryStyles = {
    'Gjuhët dhe komunikimi': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Kurani dhe jurisprudenca islame': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Bazat e fesë': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    'Matematikë': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Shkencat e natyrës': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Shoqëria dhe mjedisi': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'Jeta dhe mjedisi': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Ed. fizike, sporte': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

export function SubjectsPage() {
    const navigate = useNavigate()
    const [subjects, setSubjects] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({ id: null, name: '', category: 'Gjuhët dhe komunikimi', level: 10 })

    // Ngarkimi i të dhënave fillestare dhe përdoruesit aktual
    async function loadData() {
        try {
            setLoading(true)

            // 1. Marrim përdoruesit për të parë rolin (director ose secretary)
            const userRes = await api.auth.me()
            setCurrentUser(userRes?.data || userRes) // mbron strukturën nëse kthen direkt user-in apo {data: user}

            // 2. Marrim lëndët nga api sipas struktures tuaj
            const res = await api.academic.subjects()
            // Nëse backend-i kthen { success: true, data: [...] } apo direkt vargun [...]
            const items = res?.data || res || []
            setSubjects(Array.isArray(items) ? items : [])

            setError('')
        } catch (err) {
            console.error(err)
            setError('Dështoi ngarkimi i lëndëve.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const userRole = currentUser?.role || ''
    const canManage = ['director', 'secretary', 'principal'].includes(userRole)

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            if (formData.id) {
                // Thirrja e api.academic.updateSubject(id, payload)
                await api.academic.updateSubject(formData.id, {
                    name: formData.name,
                    category: formData.category,
                    level: formData.level
                })
            } else {
                // Thirrja e api.academic.storeSubject(payload)
                await api.academic.storeSubject(formData)
            }
            setIsModalOpen(false)
            setFormData({ id: null, name: '', category: 'Gjuhët dhe komunikimi', level: 10 })
            loadData()
        } catch (err) {
            alert('Gabim gjatë ruajtjes së lëndës.')
        }
    }

    const handleDelete = async (id, e) => {
        e.stopPropagation() // Ndalon klikimin e rreshtit që të dërgon te faqja e detajeve
        if (confirm('A jeni të sigurt që dëshironi ta fshini këtë lëndë?')) {
            try {
                await api.academic.destroySubject(id)
                loadData()
            } catch (err) {
                alert('Dështoi fshirja e lëndës.')
            }
        }
    }

    if (loading) return <p className="text-sm text-surface-300 p-6">Duke ngarkuar planprogramin...</p>
    if (error) return <p className="text-sm text-red-400 p-6">{error}</p>

    return (
        <div className="space-y-10 p-6">
            <div className="flex justify-between items-center">
                <PageHeader title="Planprogrami i Lëndëve" description="Menaxhimi dhe pasqyra e lëndëve" />
                {canManage && (
                    <button
                        onClick={() => { setFormData({ id: null, name: '', category: 'Gjuhët dhe komunikimi', level: 10 }); setIsModalOpen(true); }}
                        className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        + Shto Lëndë
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {[10, 11, 12].map((level) => {
                    const levelSubjects = subjects.filter(s => parseInt(s.level) === level)

                    return (
                        <div key={level} className="space-y-4">
                            <h2 className="text-lg font-bold text-brand-400 border-b border-white/10 pb-2">
                                Klasa {level}
                            </h2>

                            <Card className="overflow-hidden bg-surface-900 border border-white/10">
                                <table className="w-full border-collapse text-xs text-left">
                                    <thead>
                                        <tr className="bg-surface-950 text-surface-300 border-b border-white/10">
                                            <th className="p-2.5 w-12 text-center">Nr.</th>
                                            <th className="p-2.5">Lënda</th>
                                            <th className="p-2.5">Kategoria</th>
                                            {canManage && <th className="p-2.5 text-right">Veprime</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {levelSubjects.length === 0 ? (
                                            <tr>
                                                <td colSpan={canManage ? 4 : 3} className="p-4 text-center text-surface-500">
                                                    Nuk ka lëndë për këtë klasë.
                                                </td>
                                            </tr>
                                        ) : (
                                            levelSubjects.map((subject, index) => {
                                                const badgeStyle = categoryStyles[subject.category] || 'bg-surface-800 text-surface-400'

                                                return (
                                                    <tr
                                                        key={subject.id}
                                                        onClick={() => navigate(`/subjects/${subject.id}`)}
                                                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                                    >
                                                        <td className="p-2.5 text-center font-mono text-surface-400">{index + 1}</td>
                                                        <td className="p-2.5 font-medium text-surface-100">{subject.name}</td>
                                                        <td className="p-2.5">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${badgeStyle}`}>
                                                                {subject.category}
                                                            </span>
                                                        </td>
                                                        {canManage && (
                                                            <td className="p-2.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => { setFormData(subject); setIsModalOpen(true); }}
                                                                    className="text-blue-400 hover:underline bg-transparent border-0 cursor-pointer"
                                                                >
                                                                    Modifiko
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDelete(subject.id, e)}
                                                                    className="text-red-400 hover:underline bg-transparent border-0 cursor-pointer"
                                                                >
                                                                    Fshij
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    )
                })}
            </div>

            {/* Modal-i për Menaxhimin e Lëndëve */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6 bg-surface-900 border border-white/10 space-y-4 shadow-xl">
                        <h3 className="text-base font-bold text-surface-100">
                            {formData.id ? 'Modifiko Lëndën' : 'Shto Lëndë të Re'}
                        </h3>
                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <label className="text-surface-400">Emri i Lëndës</label>
                                <input
                                    type="text" required value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 rounded bg-surface-800 border border-white/10 text-surface-100 focus:outline-none focus:border-brand-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-surface-400">Kategoria</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-2 rounded bg-surface-800 border border-white/10 text-surface-100 focus:outline-none focus:border-brand-500"
                                >
                                    {Object.keys(categoryStyles).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-surface-400">Klasa (Niveli)</label>
                                <select
                                    value={formData.level}
                                    onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                    className="w-full p-2 rounded bg-surface-800 border border-white/10 text-surface-100 focus:outline-none focus:border-brand-500"
                                >
                                    <option value={10}>Klasa 10</option>
                                    <option value={11}>Klasa 11</option>
                                    <option value={12}>Klasa 12</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-surface-800 hover:bg-surface-750 text-surface-300 rounded">Anulo</button>
                                <button type="submit" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded">Ruaj</button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}