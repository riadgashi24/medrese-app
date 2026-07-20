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
        <div className="space-y-8 p-4 sm:p-6 max-w-[1600px] mx-auto text-surface-200">

            {/* Header Section - Responsive (Butoni kalon poshtë në celular nëse s'ka hapësirë) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
                <PageHeader title="Planprogrami i Lëndëve" description="Menaxhimi dhe pasqyra e lëndëve sipas klasave" />
                {canManage && (
                    <button
                        onClick={() => { setFormData({ id: null, name: '', category: 'Gjuhët dhe komunikimi', level: 10 }); setIsModalOpen(true); }}
                        className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white text-xs px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/10 cursor-pointer self-start sm:self-auto"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Shto Lëndë
                    </button>
                )}
            </div>

            {/* Ndryshuar: grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 items-start">
                {[10, 11, 12].map((level) => {
                    const levelSubjects = subjects.filter(s => parseInt(s.level) === level)

                    return (
                        <div key={level} className="flex flex-col space-y-3 bg-surface-900/40 border border-white/5 rounded-xl p-4 backdrop-blur-sm shadow-xl">

                            {/* Titulli i Klasës me informacione shtesë */}
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <h2 className="text-sm font-bold text-brand-400 uppercase tracking-wider">
                                    Klasa {level}
                                </h2>
                                <span className="text-[10px] bg-brand-400/10 text-brand-400 px-2 py-0.5 rounded-full font-semibold">
                                    {levelSubjects.length} Lëndë
                                </span>
                            </div>

                            {/* Tabela me overflow-x që mos ta prishë layout-in në ekrane shumë të vogla */}
                            <div className="overflow-x-auto w-full subtle-scrollbar">
                                <table className="w-full border-collapse text-left table-fixed"> {/* w-full dhe table-fixed janë kyçe këtu */}
                                    <thead>
                                        <tr className="text-[10px] font-semibold text-surface-400 border-b border-white/5 uppercase tracking-wider">
                                            <th className="py-2.5 px-2 w-10 text-center">Nr.</th>
                                            <th className="py-2.5 px-2 w-[40%]">Lënda</th> {/* I japim 40% të hapësirës lëndës */}
                                            <th className="py-2.5 px-2 w-[35%]">Kategoria</th> {/* I japim 35% kategorisë */}
                                            {canManage && <th className="py-2.5 px-2 w-[20%] text-right">Veprime</th>} {/* 20% për butonat */}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02] text-xs">
                                        {levelSubjects.length === 0 ? (
                                            <tr>
                                                <td colSpan={canManage ? 4 : 3} className="py-8 text-center text-surface-500 font-medium">
                                                    Nuk ka lëndë për këtë klasë.
                                                </td>
                                            </tr>
                                        ) : (
                                            levelSubjects.map((subject, index) => {
                                                const badgeStyle = categoryStyles[subject.category] || 'bg-surface-800 text-surface-400 border-white/5';

                                                return (
                                                    <tr
                                                        key={subject.id}
                                                        onClick={() => navigate(`/subjects/${subject.id}`)}
                                                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                                    >
                                                        <td className="py-3 px-2 text-center font-mono text-surface-500 group-hover:text-surface-450 transition-colors">
                                                            {index + 1}
                                                        </td>

                                                        {/* Emri i lëndës nuk e shtyn më tabelën nëse është i gjatë */}
                                                        <td className="py-3 px-2 font-semibold text-surface-100 truncate">
                                                            {subject.name}
                                                        </td>

                                                        <td className="py-3 px-2">
                                                            <span className={`inline-block truncate max-w-full px-2 py-0.5 rounded text-[10px] font-medium border shadow-sm ${badgeStyle}`}>
                                                                {subject.category}
                                                            </span>
                                                        </td>

                                                        {/* Butonat tani qëndrojnë në bllok dhe nuk thyhen apo ngjeshen */}
                                                        {canManage && (
                                                            <td className="py-3 px-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                                <div className="inline-flex justify-end space-x-2">
                                                                    <button
                                                                        onClick={() => { setFormData(subject); setIsModalOpen(true); }}
                                                                        className="text-blue-400 hover:text-blue-305 font-medium text-xs transition-colors"
                                                                    >
                                                                        Mod
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => handleDelete(subject.id, e)}
                                                                        className="text-rose-400 hover:text-rose-300 font-medium text-xs transition-colors"
                                                                    >
                                                                        Fshij
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal-i i modernizuar */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
                    <Card className="w-full max-w-md p-6 bg-surface-900 border border-white/10 space-y-5 shadow-2xl rounded-xl">
                        <div className="border-b border-white/5 pb-3">
                            <h3 className="text-sm font-bold text-surface-100 uppercase tracking-wide">
                                {formData.id ? ' Modifiko Lëndën' : ' Shto Lëndë të Re'}
                            </h3>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="text-surface-400 font-medium">Emri i Lëndës</label>
                                <input
                                    type="text" required value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 rounded-lg bg-surface-950 border border-white/10 text-surface-100 focus:outline-none focus:border-brand-500 transition-colors"
                                    placeholder="Shkruaj emrin e lëndës..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-surface-400 font-medium">Kategoria</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-2.5 rounded-lg bg-surface-950 border border-white/10 text-surface-100 focus:outline-none focus:border-brand-500 transition-colors appearance-none"
                                >
                                    {Object.keys(categoryStyles).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-surface-400 font-medium">Klasa (Niveli)</label>
                                <select
                                    value={formData.level}
                                    onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                    className="w-full p-2.5 rounded-lg bg-surface-950 border border-white/10 text-surface-100 focus:outline-none focus:border-brand-500 transition-colors"
                                >
                                    <option value={10}>Klasa 10</option>
                                    <option value={11}>Klasa 11</option>
                                    <option value={12}>Klasa 12</option>
                                </select>
                            </div>

                            {/* Butonat e Action-it në Modal */}
                            <div className="flex justify-end space-x-2 pt-3 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-surface-800 hover:bg-surface-750 text-surface-300 font-medium rounded-lg transition-colors cursor-pointer"
                                >
                                    Anulo
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-brand-500/20 cursor-pointer"
                                >
                                    Ruaj
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}