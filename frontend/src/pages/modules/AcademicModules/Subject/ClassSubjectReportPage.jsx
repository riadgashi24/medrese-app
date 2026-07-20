import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'

export function ClassSubjectReportPage() {
    const { subjectId, classId } = useParams()
    const navigate = useNavigate()
    const [report, setReport] = useState({ className: '', subjectName: '', students: [], loading: true })

    useEffect(() => {
        async function fetchReport() {
            try {
                // Thirrja përmes metodës së saktë në api
                const res = await api.academic.getClassSubjectReport(classId, subjectId)
                const payload = res?.data || res

                if (payload) {
                    setReport({
                        className: payload.class_name || '',
                        subjectName: payload.subject_name || '',
                        students: payload.students || [],
                        loading: false
                    })
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchReport()
    }, [classId, subjectId])

    if (report.loading) return <p className="text-sm text-surface-300 p-6">Duke gjeneruar pasqyrën e nxënësve...</p>

    return (
        <div className="space-y-6 p-6">
            <button onClick={() => navigate(`/subjects/${subjectId}`)} className="text-xs text-brand-400 hover:underline bg-transparent border-0 cursor-pointer">
                ← Kthehu te detajet e lëndës
            </button>

            <PageHeader
                title={`Detajet e Klasës: ${report.className}`}
                description={`Lënda: ${report.subjectName} | Monitorimi i notave, progresit akademik dhe pjesëmarrjes`}
            />

            <Card className="overflow-hidden bg-surface-900 border border-white/10">
                <table className="w-full border-collapse text-xs text-left">
                    <thead>
                        <tr className="bg-surface-950 text-surface-300 border-b border-white/10">
                            <th className="p-3 w-12 text-center">Nr.</th>
                            <th className="p-3">Nxënësi</th>
                            <th className="p-3">Notat e marra</th>
                            <th className="p-3 text-center">Nota Mesatare</th>
                            <th className="p-3 text-center">Mungesa (orë)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.students.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-surface-500">
                                    Nuk ka nxënës të regjistruar në këtë klasë.
                                </td>
                            </tr>
                        ) : (
                            report.students.map((student, index) => (
                                <tr key={student.student_id} onClick={() => navigate(`/subjects/${subject.id}`)} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                                    <td className="p-3 text-center font-mono text-surface-500">{index + 1}</td>
                                    <td className="p-3 font-medium text-surface-100">{student.student_name}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {Array.isArray(student.grades) && student.grades.map((g, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-surface-800 text-surface-200 border border-white/5 rounded font-bold font-mono">
                                                    {g}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold text-brand-400">
                                        {student.average}
                                    </td>
                                    <td className="p-3 text-center font-mono">
                                        <span className={`px-2 py-0.5 rounded ${student.absences > 0 ? 'bg-red-500/10 text-red-400' : 'text-surface-500'}`}>
                                            {student.absences} orë
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    )
}