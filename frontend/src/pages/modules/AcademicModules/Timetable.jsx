import { useState, useRef, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'

const SUBJECT_COLORS = [
    { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    { bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
]

function getSubjectStyle(id) {
    return SUBJECT_COLORS[Math.abs(Number(id || 0)) % SUBJECT_COLORS.length]
}

function PersonalTimetable({ slots, days, slotNumbers, isTeacher, className }) {
    const slotMap = useMemo(() => new Map(slots.map((slot) => [`${slot.day}-${Number(slot.slot_number)}`, slot])), [slots])

    return (
        <Card className="overflow-x-auto border border-white/10">
            <table className="min-w-[760px] w-full border-collapse text-left">
                <thead>
                    <tr className="bg-surface-900 border-b border-white/10">
                        <th className="w-24 p-3 text-center text-xs font-semibold text-surface-300">Ora</th>
                        {days.map((day) => <th key={day} className="min-w-36 p-3 text-center text-sm font-semibold text-surface-100 border-l border-white/10">{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {slotNumbers.map((slotNumber) => (
                        <tr key={slotNumber} className="border-b border-white/5 last:border-0">
                            <td className="bg-surface-900/40 p-3 text-center font-mono text-sm font-semibold text-brand-400">{slotNumber}. orë</td>
                            {days.map((_, dayIndex) => {
                                const slot = slotMap.get(`${dayIndex + 1}-${slotNumber}`)
                                const style = slot ? getSubjectStyle(slot.subject_id) : null
                                return <td key={dayIndex} className="p-2 border-l border-white/5 align-top h-20">{slot ? (
                                    <div className={`h-full min-h-16 rounded-lg border px-3 py-2 ${style.bg}`}>
                                        {isTeacher ? <><p className="text-base font-bold leading-tight">{slot.class?.name || 'Klasa'}</p><p className="mt-1 text-xs opacity-85">{slot.subject?.name || 'Lënda'}</p></> : <><p className="text-sm font-semibold leading-tight">{slot.subject?.name || 'Lënda'}</p><p className="mt-1 text-[11px] opacity-85">{slot.teacher_user?.name || 'Profesor i pacaktuar'}</p></>}
                                    </div>
                                ) : <span className="block h-full rounded-lg bg-surface-900/20" />}</td>
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            {slots.length === 0 && <p className="p-6 text-center text-sm text-surface-400">Nuk ka orë të caktuara në orar{className ? ` për ${className}` : ''}.</p>}
        </Card>
    )
}

export default function TimetablePage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)

    const [slots, setSlots] = useState([])
    const [supervisors, setSupervisors] = useState({})
    const [teacherStats, setTeacherStats] = useState({})
    const [teacherRoster, setTeacherRoster] = useState([])
    const [activeAcademicYearId, setActiveAcademicYearId] = useState(null)
    const [classes, setClasses] = useState([])
    const [subjects, setSubjects] = useState([])
    const [teacherAssignments, setTeacherAssignments] = useState([])

    // Modal state për Slot Orari
    const [selectedCell, setSelectedCell] = useState(null)
    const [formClassId, setFormClassId] = useState('')
    const [formSubjectId, setFormSubjectId] = useState('')
    const [formTeacherId, setFormTeacherId] = useState('')

    // Modal state për Kujdestarët e Ditës
    const [editingDaySupervisor, setEditingDaySupervisor] = useState(null) // { day, names }
    const [supervisorInput, setSupervisorInput] = useState('')
    const [saving, setSaving] = useState(false)
    const [slotJobs, setSlotJobs] = useState({})
    const slotQueue = useRef(Promise.resolve())
    const pendingCells = useRef(new Set())
    useEffect(() => {
        const warn = event => { if (pendingCells.current.size) { event.preventDefault(); event.returnValue = '' } }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [])

    const days = ['E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte']
    const slotNumbers = [1, 2, 3, 4, 5, 6, 7]

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await api.academic.timetable()
            const payload = res?.data ?? res
            const [optionsRes, subjectsRes] = await Promise.all([
                api.academic.subjectOptions({ academic_year_id: payload.active_academic_year_id }),
                api.academic.subjects(),
            ])
            const options = optionsRes?.data ?? optionsRes
            const subjectItems = subjectsRes?.data ?? subjectsRes
            setSlots(payload.slots || [])
            setSupervisors(payload.supervisors || {})
            setTeacherStats(payload.teacher_stats || {})
            setTeacherRoster(payload.teachers || [])
            setActiveAcademicYearId(payload.active_academic_year_id || null)
            setClasses(options.classes || [])
            setSubjects(Array.isArray(subjectItems) ? subjectItems : [])
            setTeacherAssignments(options.assignments || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const teachers = useMemo(() => {
        const map = new Map()

        for (const slot of slots) {
            if (slot.teacher_user && !map.has(slot.teacher_user.id)) {
                map.set(slot.teacher_user.id, {
                    id: slot.teacher_user.id,
                    name: slot.teacher_user.name,
                })
            }
        }

        for (const teacher of teacherRoster) {
            map.set(teacher.id, { id: teacher.id, name: teacher.name, gender: teacher.gender })
        }

        for (const [teacherId, stats] of Object.entries(teacherStats)) {
            if (!map.has(Number(teacherId)) && stats.teacher_name) {
                map.set(Number(teacherId), { id: Number(teacherId), name: stats.teacher_name })
            }
        }

        const genderOrder = { Male: 0, Female: 1 }
        return Array.from(map.values()).sort((a, b) =>
            (genderOrder[a.gender] ?? 2) - (genderOrder[b.gender] ?? 2)
            || a.name.localeCompare(b.name, 'sq')
        )
    }, [slots, teacherStats, teacherRoster])

    const slotMap = useMemo(() => {
        const map = new Map()

        for (const slot of slots) {
            const key = `${slot.teacher_user_id}-${slot.day}-${Number(slot.slot_number)}`
            map.set(key, slot)
        }

        return map
    }, [slots])

    const teacherWorkloadMap = useMemo(
        () => new Map(teacherRoster.map((teacher) => [teacher.id, teacher])),
        [teacherRoster]
    )

    const availableSubjects = useMemo(() => {
        const subjectIds = new Set(
            teacherAssignments
                .filter((assignment) => Number(assignment.teacher_user_id) === Number(formTeacherId))
                .map((assignment) => Number(assignment.subject_id))
        )
        return subjects.filter((subject) => subjectIds.has(Number(subject.id)))
    }, [formTeacherId, subjects, teacherAssignments])

    const availableClasses = useMemo(() => {
        const classIds = new Set(
            teacherAssignments
                .filter((assignment) => Number(assignment.teacher_user_id) === Number(formTeacherId) && Number(assignment.subject_id) === Number(formSubjectId))
                .map((assignment) => Number(assignment.class_id))
        )
        return classes.filter((classItem) => classIds.has(Number(classItem.id)))
    }, [classes, formSubjectId, formTeacherId, teacherAssignments])

    const isStudentView = user?.role === 'student' || user?.role === 'boarding'
    const isTeacherView = user?.role === 'teacher'
    const canEdit = user?.role === 'director' || user?.role === 'secretary'
    const personalSlots = useMemo(() => {
        if (isStudentView) return slots.filter((slot) => Number(slot.class_id) === Number(user?.class_id))
        if (isTeacherView) return slots.filter((slot) => Number(slot.teacher_user_id) === Number(user?.id))
        return []
    }, [isStudentView, isTeacherView, slots, user?.class_id, user?.id])

    // Modifiko Kujdestarët e Ditës
    const handleSaveSupervisor = async () => {
        if (!editingDaySupervisor || !supervisorInput) return
        setSaving(true)
        try {
            await api.academic.updateDaySupervisor({
                day: editingDaySupervisor.day,
                supervisor_names: supervisorInput,
                academic_year_id: activeAcademicYearId
            })
            setSupervisors(current => ({ ...current, [editingDaySupervisor.day]: supervisorInput }))
            setEditingDaySupervisor(null)
        } catch (err) {
            alert('Gabim gjatë ruajtjes së kujdestarëve.')
        } finally {
            setSaving(false)
        }
    }

    const submitSlotJob = (job) => {
        if (pendingCells.current.has(job.key)) return
        pendingCells.current.add(job.key)
        setSlotJobs(current => ({ ...current, [job.key]: { ...job, status: 'pending' } }))
        slotQueue.current = slotQueue.current.catch(() => {}).then(async () => {
            try {
                if (job.remove) {
                    await api.academic.deleteTimetableSlot(job.payload.slot_id)
                    setSlots(current => current.filter(slot => slot.id !== job.payload.slot_id))
                } else {
                    const response = await api.academic.saveTimetableSlot(job.payload)
                    const saved = response?.data ?? response
                    setSlots(current => [...current.filter(slot => slot.id !== saved.id), saved])
                }
                setSlotJobs(current => ({ ...current, [job.key]: { ...job, status: 'saved' } }))
            } catch (error) {
                let message = 'Ruajtja dështoi. Kontrolloni lidhjen dhe provoni përsëri.'
                try { message = JSON.parse(error.message).message || message } catch {}
                setSlotJobs(current => ({ ...current, [job.key]: { ...job, status: 'error', message } }))
            } finally {
                pendingCells.current.delete(job.key)
            }
        })
        setSelectedCell(null)
    }

    const handleSaveSlot = () => {
        if (!selectedCell || !formClassId || !formSubjectId || !formTeacherId) return
        submitSlotJob({
            key: `${formTeacherId}-${selectedCell.dayNumber}-${selectedCell.slotNum}`,
            label: `${selectedCell.teacher.name}, ${selectedCell.day}, ora ${selectedCell.slotNum}`,
            payload: {
                slot_id: selectedCell.slotData?.id,
                teacher_user_id: Number(formTeacherId), day: selectedCell.dayNumber,
                slot_number: selectedCell.slotNum, class_id: Number(formClassId),
                subject_id: Number(formSubjectId), academic_year_id: activeAcademicYearId,
            },
        })
    }

    const handleDeleteSlot = () => {
        if (!selectedCell?.slotData?.id) return
        submitSlotJob({
            key: `${selectedCell.teacher.id}-${selectedCell.dayNumber}-${selectedCell.slotNum}`,
            label: `${selectedCell.teacher.name}, ${selectedCell.day}, ora ${selectedCell.slotNum}`,
            remove: true, payload: { slot_id: selectedCell.slotData.id },
        })
    }

    if (loading) return <p className="p-6 text-sm text-surface-300">Duke ngarkuar orarin...</p>

    return (
        <div className="space-y-6">
            <div aria-live="polite" className="space-y-2 text-sm">
                {Object.values(slotJobs).some(job => job.status === 'pending') && <p className="text-brand-400">Duke ruajtur {Object.values(slotJobs).filter(job => job.status === 'pending').length} orë. Mund të vazhdoni me slotet e tjera.</p>}
                {Object.keys(slotJobs).length > 0 && Object.values(slotJobs).every(job => job.status === 'saved') && <p className="text-brand-400">Të gjitha ndryshimet u ruajtën.</p>}
                {Object.values(slotJobs).filter(job => job.status === 'error').map(job => <p key={job.key} className="text-red-400">{job.label}: {job.message} <button className="underline" onClick={() => submitSlotJob(job)}>Provo përsëri</button></p>)}
            </div>
            <div className="flex justify-between items-center">
                <PageHeader title="ORARI MËSIMOR PËR VITIN SHKOLLOR 2025/2026" description="ShML 'MEDRESEJA ALAUDDIN' PRISHTINË" />
                {canEdit && <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-brand-600 text-white'
                        }`}
                >
                    {isEditMode ? '✓ Mbyll Modifikimin' : '✏️ Modifiko Orarin'}
                </button>}
            </div>

            {(isStudentView || isTeacherView) ? <>
                <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
                    {isTeacherView ? 'Orari juaj mësimor. Klasa shfaqet e theksuar, ndërsa lënda poshtë saj.' : `Orari për klasën ${user?.class_name || 'tuaj'}. Lënda shfaqet sipër dhe profesori me tekst më të vogël poshtë.`}
                </div>
                <PersonalTimetable slots={personalSlots} days={days} slotNumbers={slotNumbers} isTeacher={isTeacherView} className={isStudentView ? user?.class_name : user?.name} />
            </> : <Card className="overflow-x-auto border border-white/10">
                <table className="w-full border-collapse text-xs text-left">
                    <thead>
                        {/* Rreshti I: Ditët e javës */}
                        <tr className="bg-surface-900 text-surface-200 border-b border-white/10">
                            <th rowSpan="2" className="p-2 border-r border-white/10 min-w-[150px] font-bold sticky left-0 bg-surface-900">
                                Profesorët
                            </th>
                            <th rowSpan="2" className="p-1 border-r border-white/10 w-12 text-center font-bold bg-surface-900">
                                Orët
                            </th>
                            {days.map((day) => (
                                <th key={day} colSpan="7" className="p-1 text-center border-r border-white/10 font-bold bg-surface-800">
                                    {day}
                                </th>
                            ))}
                        </tr>

                        {/* Rreshti II: Kujdestarët e Ditës */}
                        <tr className="bg-surface-850 text-surface-300 border-b border-white/10 text-[11px]">
                            {days.map((day) => (
                                <th
                                    key={`sup-${day}`}
                                    colSpan="7"
                                    onClick={() => {
                                        if (isEditMode) {
                                            setEditingDaySupervisor({ day, names: supervisors[day] || '' })
                                            setSupervisorInput(supervisors[day] || '')
                                        }
                                    }}
                                    className={`p-1.5 text-center border-r border-white/10 font-semibold ${isEditMode ? 'hover:bg-amber-500/10 cursor-pointer text-amber-300' : 'text-brand-300'
                                        }`}
                                >
                                    <span className="text-[10px] text-surface-400 block font-normal">Kujdestarët e ditës:</span>
                                    {supervisors[day] || '— Papërcaktuar —'}
                                </th>
                            ))}
                        </tr>

                        {/* Rreshti III: Numerimi i Orëve (1-7) */}
                        <tr className="bg-surface-900 text-surface-400 border-b border-white/10 text-[10px]">
                            <th className="sticky left-0 bg-surface-900 border-r border-white/10"></th>
                            <th className="border-r border-white/10"></th>
                            {days.map((day) =>
                                slotNumbers.map((slot) => (
                                    <th key={`${day}-${slot}`} className="p-1 text-center border-r border-white/10 font-mono w-8">
                                        {slot}
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {teachers.map((teacher) => {
                            const stats = teacherStats[teacher.id] || { total_weekly_hours: 0, scheduled_weekly_hours: 0 }
                            const rosterStats = teacherWorkloadMap.get(teacher.id)
                            const totalHours = rosterStats?.total_hours ?? stats.total_weekly_hours ?? 0
                            const assignedHours = slots.filter(slot => Number(slot.teacher_user_id) === Number(teacher.id)).length
                            const pendingHours = Object.values(slotJobs).filter(job => job.status === 'pending' && !job.remove && !job.payload.slot_id && job.payload.teacher_user_id === Number(teacher.id)).length
                            const remainingHours = Math.max(0, totalHours - assignedHours - pendingHours)

                            return (
                                <tr key={teacher.id} className="timetable-teacher-row border-b border-white/5">
                                    <td className="timetable-teacher-name p-2 border-r border-white/10 font-semibold text-surface-100 sticky left-0">
                                        {teacher.name}
                                    </td>
                                    <td className="p-1 border-r border-white/10 text-center font-mono font-bold text-brand-400" title={`${remainingHours} slots të lira · ${assignedHours} të caktuara`}>
                                        {totalHours}
                                    </td>

                                    {days.map((day, dayIndex) =>
                                        slotNumbers.map((slotNum) => {
                                            const dayNumber = dayIndex + 1
                                            const slotData = slotMap.get(`${teacher.id}-${dayNumber}-${slotNum}`)
                                            const style = slotData ? getSubjectStyle(slotData.subject_id) : null
                                            const cellJob = slotJobs[`${teacher.id}-${dayNumber}-${slotNum}`]
                                            const canAddSlot = Boolean(remainingHours > 0)

                                            return (
                                                <td
                                                    key={`${day}-${slotNum}`}
                                                    title={cellJob?.status === 'pending' ? 'Duke ruajtur…' : cellJob?.status === 'error' ? cellJob.message : undefined}
                                                    onClick={() => {
                                                        if (isEditMode) {
                                                            if (cellJob?.status === 'pending') return
                                                            if (!slotData && !canAddSlot) return
                                                            setSelectedCell({ teacher, day, dayNumber, slotNum, slotData })
                                                            setFormTeacherId(String(slotData?.teacher_user_id || teacher.id))
                                                            setFormSubjectId(String(slotData?.subject_id || ''))
                                                            setFormClassId(String(slotData?.class_id || ''))
                                                        }
                                                    }}
                                                    className={`p-1 border-r border-white/5 text-center font-mono text-[11px] h-9 transition-all ${slotData
                                                        ? `${style.bg} font-bold border`
                                                        : isEditMode && canAddSlot
                                                            ? 'hover:bg-white/10 cursor-pointer text-surface-600'
                                                            : 'text-surface-700'
                                                        }`}
                                                >
                                                    {cellJob?.status === 'pending' ? '…' : cellJob?.status === 'error' ? '!' : slotData ? slotData.class?.name : isEditMode && canAddSlot ? '+' : ''}
                                                </td>
                                            )
                                        })
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </Card>}

            {selectedCell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-surface-900 border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4">
                        <h3 className="text-base font-bold text-surface-100">
                            {selectedCell.slotData ? 'Modifiko orarin' : 'Shto në orar'} · {selectedCell.teacher.name}
                        </h3>
                        <p className="text-xs text-surface-400">Dita {selectedCell.dayNumber}, ora {selectedCell.slotNum}</p>
                        <select value={formTeacherId} disabled className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-sm text-surface-100 disabled:opacity-70">
                            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                        </select>
                        <select value={formSubjectId} onChange={(e) => { setFormSubjectId(e.target.value); setFormClassId('') }} className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-sm text-surface-100">
                            <option value="">Zgjidh lëndën</option>
                            {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                        </select>
                        <select value={formClassId} onChange={(e) => setFormClassId(e.target.value)} className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-sm text-surface-100">
                            <option value="">Zgjidh klasën</option>
                            {availableClasses.map((classItem) => <option key={classItem.id} value={classItem.id}>{classItem.name}</option>)}
                        </select>
                        <div className="flex justify-between gap-2 pt-2">
                            <button onClick={handleDeleteSlot} disabled={saving || !selectedCell.slotData} className="px-3 py-1.5 bg-rose-500/20 text-rose-300 rounded-lg text-xs disabled:opacity-40">Fshij</button>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedCell(null)} className="px-3 py-1.5 bg-surface-800 text-surface-300 rounded-lg text-xs">Anulo</button>
                                <button onClick={handleSaveSlot} disabled={saving || !formClassId || !formSubjectId} className="px-4 py-1.5 bg-brand-600 text-white font-medium rounded-lg text-xs">{saving ? 'Duke ruajtur...' : 'Ruaj'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal per Kujdestarët e Ditës */}
            {editingDaySupervisor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-surface-900 border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4">
                        <h3 className="text-base font-bold text-surface-100">
                            Modifiko Kujdestarët e Ditës: {editingDaySupervisor.day}
                        </h3>
                        <input
                            type="text"
                            value={supervisorInput}
                            onChange={(e) => setSupervisorInput(e.target.value)}
                            placeholder="p.sh. B JAHA / VIOLINA & ERBLINA"
                            className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-sm text-surface-100 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditingDaySupervisor(null)} className="px-3 py-1.5 bg-surface-800 text-surface-300 rounded-lg text-xs">
                                Anulo
                            </button>
                            <button onClick={handleSaveSupervisor} disabled={saving} className="px-4 py-1.5 bg-brand-600 text-white font-medium rounded-lg text-xs">
                                {saving ? 'Duke ruajtur...' : 'Ruaj'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
