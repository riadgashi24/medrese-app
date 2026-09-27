import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'

export function SubjectDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [state, setState] = useState({ subject: null, classes: [], loading: true, error: '' })
    const [options, setOptions] = useState({ classes: [], teachers: [], academic_year_id: null })
    const [academicYears, setAcademicYears] = useState([])
    const [selectedYearId, setSelectedYearId] = useState('')
    const [canManage, setCanManage] = useState(false)
    const [showSubjectEditor, setShowSubjectEditor] = useState(false)
    const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)
    const [editingAssignment, setEditingAssignment] = useState(null)
    const [subjectForm, setSubjectForm] = useState({ name: '', category: '', level: 10, description: '' })
    const [assignmentForm, setAssignmentForm] = useState({ class_id: '', teacher_user_id: '', weekly_hours: 2 })
    const [saving, setSaving] = useState(false)
    const [assignmentJobs, setAssignmentJobs] = useState({})
    const activeAssignments = useRef(new Set())
    const loadedScope = useRef('')
    const hasPendingAssignments = Object.values(assignmentJobs).some(job => job.status === 'pending')

    useEffect(() => {
        const warn = event => {
            if (activeAssignments.current.size) { event.preventDefault(); event.returnValue = '' }
        }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [])

    useEffect(() => {
        if (loadedScope.current === `${id}:${selectedYearId}`) return
        let cancelled = false
        async function fetchDetails() {
            setState(current => ({ ...current, loading: true }))
            try {
                const [detailsRes, yearsRes, optionsRes, userRes] = await Promise.all([
                    api.academic.showSubjectDetails(id, selectedYearId ? { academic_year_id: selectedYearId } : undefined),
                    api.academic.academicYears(),
                    api.academic.subjectOptions(selectedYearId ? { academic_year_id: selectedYearId } : undefined),
                    api.auth.me(),
                ])
                const payload = detailsRes?.data || detailsRes
                const years = yearsRes?.data || yearsRes || []
                const optionsPayload = optionsRes?.data || optionsRes || {}
                const user = userRes?.data || userRes
                if (cancelled) return
                if (payload) {
                    loadedScope.current = `${id}:${selectedYearId || optionsPayload.academic_year_id || ''}`
                    setState({
                        subject: payload.subject || null,
                        classes: payload.classes || [],
                        loading: false,
                        error: ''
                    })
                    setSubjectForm({
                        name: payload.subject?.name || '',
                        category: payload.subject?.category || '',
                        level: payload.subject?.level || 10,
                        description: payload.subject?.description || '',
                    })
                    setAcademicYears(years)
                    setOptions(optionsPayload)
                    setSelectedYearId((current) => current || String(optionsPayload.academic_year_id || ''))
                    setCanManage(['director', 'secretary'].includes(user?.role))
                }
            } catch (err) {
                if (cancelled) return
                console.error(err)
                setState({ subject: null, classes: [], loading: false, error: 'Detajet e kësaj lënde nuk u ngarkuan.' })
            }
        }
        fetchDetails()
        return () => { cancelled = true }
    }, [id, selectedYearId])

    async function saveSubject(e) {
        e.preventDefault()
        setSaving(true)
        try {
            const response = await api.academic.updateSubject(id, subjectForm)
            setState(current => ({ ...current, subject: response?.data || response }))
            setShowSubjectEditor(false)
        } catch (err) {
            alert('Gabim gjatë ruajtjes së lëndës.')
        } finally {
            setSaving(false)
        }
    }

    async function persistAssignment(job) {
        const key = String(job.payload.class_id)
        if (activeAssignments.current.has(key)) return
        activeAssignments.current.add(key)
        setAssignmentJobs(current => ({ ...current, [key]: { ...job, status: 'pending' } }))
        try {
            const response = job.assignmentId
                ? await api.academic.updateSubjectAssignment(job.assignmentId, job.payload)
                : await api.academic.assignSubjectToClass(job.payload)
            const saved = response?.data || response
            setState(current => {
                const previous = current.classes.find(item => Number(item.class_id) === job.payload.class_id)
                const row = {
                    ...previous,
                    assignment_id: saved.id,
                    class_id: job.payload.class_id,
                    class_name: previous?.class_name || job.className,
                    teacher_user_id: Number(saved.teacher_user_id),
                    teacher_name: job.teacherName,
                    weekly_hours: Number(saved.weekly_hours),
                    students_count: previous?.students_count ?? job.studentsCount,
                    academic_year_id: job.payload.academic_year_id,
                }
                return { ...current, classes: [...current.classes.filter(item => Number(item.class_id) !== job.payload.class_id), row].sort((a, b) => a.class_name.localeCompare(b.class_name)) }
            })
            setAssignmentJobs(current => ({ ...current, [key]: { ...job, status: 'saved' } }))
        } catch {
            setAssignmentJobs(current => ({ ...current, [key]: { ...job, status: 'error' } }))
        } finally {
            activeAssignments.current.delete(key)
        }
    }

    function saveAssignment(e) {
        e.preventDefault()
        const classId = Number(assignmentForm.class_id)
        if (activeAssignments.current.has(String(classId))) return
        const classItem = options.classes.find(item => Number(item.id) === classId)
        const teacher = options.teachers.find(item => Number(item.id) === Number(assignmentForm.teacher_user_id))
        const job = {
            assignmentId: editingAssignment?.assignment_id,
            payload: { academic_year_id: Number(selectedYearId || options.academic_year_id), subject_id: Number(id), class_id: classId, teacher_user_id: Number(assignmentForm.teacher_user_id), weekly_hours: Number(assignmentForm.weekly_hours) },
            className: classItem?.name || editingAssignment?.class_name || '',
            teacherName: teacher?.name || '',
            studentsCount: classItem?.students_count ?? 0,
        }
        void persistAssignment(job)
        setEditingAssignment(null)
        setAssignmentForm(current => ({ ...current, class_id: '' }))
    }

    const assignmentStatus = Object.keys(assignmentJobs).length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-2 text-xs" aria-live="polite">
            {Object.entries(assignmentJobs).map(([key, job]) => <p key={key} className={job.status === 'error' ? 'text-red-400' : 'text-surface-300'}>
                {job.className} · {job.teacherName}: {job.status === 'pending' ? 'Duke ruajtur…' : job.status === 'saved' ? 'U ruajt' : 'Nuk u ruajt.'}
                {job.status === 'error' && <button type="button" onClick={() => persistAssignment(job)} className="ml-2 underline">Provo përsëri</button>}
            </p>)}
        </div>
    )

    async function removeAssignment(assignmentId) {
        if (!confirm('A jeni të sigurt që dëshironi ta hiqni këtë caktim?')) return
        try {
            await api.academic.deleteSubjectAssignment(assignmentId)
            setState(current => ({ ...current, classes: current.classes.filter(item => item.assignment_id !== assignmentId) }))
            const removed = state.classes.find(item => item.assignment_id === assignmentId)
            setAssignmentJobs(current => {
                const next = { ...current }
                if (removed) delete next[removed.class_id]
                return next
            })
        } catch (err) {
            alert('Gabim gjatë heqjes së caktimit.')
        }
    }

    if (state.loading) return <p className="text-sm text-surface-300 p-6">Duke ngarkuar detajet...</p>
    if (state.error) return <p className="text-sm text-red-400 p-6">{state.error}</p>

    const { subject, classes } = state

    return (
        <div className="space-y-6 p-6">
            <button onClick={() => navigate('/subjects')} className="text-xs text-brand-400 hover:underline bg-transparent border-0 cursor-pointer">
                ← Kthehu te lëndët
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <PageHeader title={subject?.name} description={`Kategoria: ${subject?.category} | Niveli: Klasa ${subject?.level}`} />
                {canManage && (
                    <button onClick={() => setShowSubjectEditor(true)} className="px-3 py-2 rounded-lg bg-brand-600 text-white text-xs font-medium">
                        Modifiko lëndën
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs text-surface-400">Viti akademik</label>
                <select disabled={hasPendingAssignments} value={selectedYearId} onChange={(e) => { setAssignmentJobs({}); setSelectedYearId(e.target.value) }} className="rounded-lg bg-surface-900 border border-white/10 px-3 py-2 text-xs text-surface-100">
                    {academicYears.map((year) => <option key={year.id} value={year.id}>{year.label}{year.is_active ? ' (Aktiv)' : ''}</option>)}
                </select>
            </div>

            {!showAssignmentEditor && assignmentStatus}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Planprogrami */}
                <Card className="p-4 space-y-3 lg:col-span-1 bg-surface-900 border border-white/10">
                    <h3 className="text-sm font-bold text-surface-200 border-b border-white/10 pb-1">Planprogrami i Lëndës</h3>
                    <p className="text-xs text-surface-400 leading-relaxed whitespace-pre-wrap">
                        {subject?.description || 'Nuk ka përshkrim të regjistruar për këtë lëndë.'}
                    </p>
                </Card>

                {/* Tabela e Klasave ku ky subjekt jepet mësim */}
                <Card className="lg:col-span-2 overflow-hidden bg-surface-900 border border-white/10">
                    <div className="p-4 bg-surface-950 border-b border-white/10">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold text-surface-200">Klasat ku ligjërohet</h3>
                            {canManage && <button onClick={() => { setEditingAssignment(null); setAssignmentForm({ class_id: '', teacher_user_id: '', weekly_hours: 2 }); setShowAssignmentEditor(true) }} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs">+ Shto klasë</button>}
                        </div>
                    </div>
                    <table className="w-full border-collapse text-xs text-left">
                        <thead>
                            <tr className="bg-surface-950 text-surface-400 border-b border-white/10">
                                <th className="p-3">Klasa</th>
                                <th className="p-3">Kush e ligjeron</th>
                                <th className="p-3 text-center">Orë në Javë</th>
                                <th className="p-3 text-center">Nxënës</th>
                                {canManage && <th className="p-3 text-right">Veprime</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {classes.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 5 : 4} className="p-4 text-center text-surface-500">
                                        Kjo lëndë nuk është caktuar në asnjë klasë ende.
                                    </td>
                                </tr>
                            ) : (
                                classes.map((c) => (
                                    <tr
                                        key={c.class_id}
                                        className="border-b border-white/5 hover:bg-brand-500/5 transition-colors cursor-pointer group"
                                    >
                                        <td onClick={() => navigate(`/subjects/${id}/class/${c.class_id}`)} className="p-3 font-bold text-brand-400 group-hover:underline">
                                            {c.class_name}
                                        </td>
                                        <td className="p-3 text-surface-200">{c.teacher_name}</td>
                                        <td className="p-3 text-center font-mono text-surface-300">{c.weekly_hours} orë</td>
                                        <td className="p-3 text-center font-mono text-surface-400">{c.students_count} nxënës</td>
                                        {canManage && <td className="p-3 text-right whitespace-nowrap">
                                            <button disabled={assignmentJobs[c.class_id]?.status === 'pending'} onClick={() => { setEditingAssignment(c); setAssignmentForm({ class_id: c.class_id, teacher_user_id: c.teacher_user_id, weekly_hours: c.weekly_hours }); setShowAssignmentEditor(true) }} className="text-brand-400 hover:underline mr-2">Modifiko</button>
                                            <button disabled={assignmentJobs[c.class_id]?.status === 'pending'} onClick={() => removeAssignment(c.assignment_id)} className="text-rose-400 hover:underline">Fshij</button>
                                        </td>}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>

            {showSubjectEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <Card className="w-full max-w-md p-6 bg-surface-900 border border-white/10 space-y-4">
                        <h3 className="text-sm font-bold text-surface-100">Modifiko lëndën</h3>
                        <form onSubmit={saveSubject} className="space-y-3 text-xs">
                            <input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Emri" className="w-full rounded-lg bg-surface-950 border border-white/10 p-2.5 text-surface-100" />
                            <input required value={subjectForm.category} onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })} placeholder="Kategoria" className="w-full rounded-lg bg-surface-950 border border-white/10 p-2.5 text-surface-100" />
                            <select value={subjectForm.level} onChange={(e) => setSubjectForm({ ...subjectForm, level: Number(e.target.value) })} className="w-full rounded-lg bg-surface-950 border border-white/10 p-2.5 text-surface-100">
                                <option value={10}>Klasa 10</option><option value={11}>Klasa 11</option><option value={12}>Klasa 12</option>
                            </select>
                            <textarea value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} placeholder="Përshkrimi / planprogrami" rows={5} className="w-full rounded-lg bg-surface-950 border border-white/10 p-2.5 text-surface-100" />
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowSubjectEditor(false)} className="px-3 py-2 rounded-lg bg-surface-800 text-surface-300">Anulo</button>
                                <button disabled={saving} className="px-4 py-2 rounded-lg bg-brand-600 text-white">{saving ? 'Duke ruajtur...' : 'Ruaj'}</button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {showAssignmentEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <Card className="w-full max-w-md p-6 bg-surface-900 border border-white/10 space-y-4">
                        <h3 className="text-sm font-bold text-surface-100">{editingAssignment ? 'Modifiko caktimin' : 'Shto klasë'}</h3>
                        <p className="text-xs text-surface-400">Pas ruajtjes mund të vazhdoni menjëherë me klasën tjetër.</p>
                        {assignmentStatus}
                        <form onSubmit={saveAssignment} className="space-y-3 text-xs">
                            <select required disabled={Boolean(editingAssignment)} value={assignmentForm.class_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, class_id: e.target.value })} className="w-full rounded-lg bg-surface-950 border border-white/10 p-2.5 text-surface-100">
                                <option value="">Zgjidh klasën</option>
                                {options.classes.filter(classItem => Number(classItem.level) === Number(subject?.level)).map((classItem) => <option disabled={assignmentJobs[classItem.id]?.status === 'pending'} key={classItem.id} value={classItem.id}>{classItem.name} ({classItem.students_count} nxënës)</option>)}
                            </select>
                            <select required value={assignmentForm.teacher_user_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, teacher_user_id: e.target.value })} className="w-full rounded-lg bg-surface-950 border border-white/10 p-2.5 text-surface-100">
                                <option value="">Zgjidh profesorin</option>
                                {options.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                            </select>
                            <input required type="number" min="1" max="40" value={assignmentForm.weekly_hours} onChange={(e) => setAssignmentForm({ ...assignmentForm, weekly_hours: e.target.value })} placeholder="Orë në javë" className="w-full rounded-lg bg-surface-950 border border-white/10 p-2.5 text-surface-100" />
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAssignmentEditor(false)} className="px-3 py-2 rounded-lg bg-surface-800 text-surface-300">Anulo</button>
                                <button disabled={!assignmentForm.class_id || assignmentJobs[assignmentForm.class_id]?.status === 'pending'} className="px-4 py-2 rounded-lg bg-brand-600 text-white">Ruaj dhe vazhdo</button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}
