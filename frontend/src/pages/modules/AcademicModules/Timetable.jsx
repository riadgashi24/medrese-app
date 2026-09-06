import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'

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

export default function TimetablePage() {
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
            if (!map.has(teacher.id)) {
                map.set(teacher.id, { id: teacher.id, name: teacher.name })
            }
        }

        for (const [teacherId, stats] of Object.entries(teacherStats)) {
            if (!map.has(Number(teacherId)) && stats.teacher_name) {
                map.set(Number(teacherId), { id: Number(teacherId), name: stats.teacher_name })
            }
        }

        return Array.from(map.values())
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
            await fetchData()
            setEditingDaySupervisor(null)
        } catch (err) {
            alert('Gabim gjatë ruajtjes së kujdestarëve.')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveSlot = async () => {
        if (!selectedCell || !formClassId || !formSubjectId || !formTeacherId) return
        setSaving(true)
        try {
            await api.academic.saveTimetableSlot({
                slot_id: selectedCell.slotData?.id,
                teacher_user_id: Number(formTeacherId),
                day: selectedCell.dayNumber,
                slot_number: selectedCell.slotNum,
                class_id: Number(formClassId),
                subject_id: Number(formSubjectId),
                academic_year_id: activeAcademicYearId,
            })
            await fetchData()
            setSelectedCell(null)
        } catch (err) {
            let message = 'Gabim gjatë ruajtjes së orarit.'
            try {
                const details = JSON.parse(err.message)
                message = details.message || message
            } catch { }
            alert(message)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteSlot = async () => {
        if (!selectedCell?.slotData?.id) return
        setSaving(true)
        try {
            await api.academic.deleteTimetableSlot(selectedCell.slotData.id)
            await fetchData()
            setSelectedCell(null)
        } catch (err) {
            alert('Gabim gjatë fshirjes së orarit.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <p className="p-6 text-sm text-surface-300">Duke ngarkuar orarin...</p>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageHeader title="ORARI MËSIMOR PËR VITIN SHKOLLOR 2025/2026" description="ShML 'MEDRESEJA ALAUDDIN' PRISHTINË" />
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-brand-600 text-white'
                        }`}
                >
                    {isEditMode ? '✓ Mbyll Modifikimin' : '✏️ Modifiko Orarin'}
                </button>
            </div>

            <Card className="overflow-x-auto border border-white/10">
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
                            const assignedHours = rosterStats?.assigned_hours ?? stats.scheduled_weekly_hours ?? 0
                            const remainingHours = rosterStats?.remaining_hours ?? Math.max(0, totalHours - assignedHours)

                            return (
                                <tr key={teacher.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="p-2 border-r border-white/10 font-semibold text-surface-100 bg-surface-900 sticky left-0">
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
                                            const canAddSlot = Boolean(remainingHours > 0)

                                            return (
                                                <td
                                                    key={`${day}-${slotNum}`}
                                                    onClick={() => {
                                                        if (isEditMode) {
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
                                                    {slotData ? slotData.class?.name : isEditMode ? '+' : ''}
                                                </td>
                                            )
                                        })
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </Card>

            {selectedCell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-surface-900 border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4">
                        <h3 className="text-base font-bold text-surface-100">
                            {selectedCell.slotData ? 'Modifiko orarin' : 'Shto në orar'} · {selectedCell.teacher.name}
                        </h3>
                        <p className="text-xs text-surface-400">Dita {selectedCell.dayNumber}, ora {selectedCell.slotNum}</p>
                        <select value={formTeacherId} disabled className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-xs text-white disabled:opacity-70">
                            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                        </select>
                        <select value={formSubjectId} onChange={(e) => { setFormSubjectId(e.target.value); setFormClassId('') }} className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-xs text-white">
                            <option value="">Zgjidh lëndën</option>
                            {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                        </select>
                        <select value={formClassId} onChange={(e) => setFormClassId(e.target.value)} className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-xs text-white">
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
                            className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
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