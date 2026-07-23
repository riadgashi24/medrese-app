import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Edit3, Check, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function GradesPage() {
    const { id: classId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const tableRef = useRef(null);

    useEffect(() => {
        if (classId) {
            fetchGrades();
        }
    }, [classId]);

    const fetchGrades = async () => {
        try {
            setLoading(true);
            const res = await api.classes.grades(classId);
            setData(res);
        } catch (err) {
            console.error("Gabim gjatë marrjes së notave:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = async (studentId, subjectId, term, value) => {
        const val = value === "" ? null : parseInt(value, 10);

        // Optimistic UI update
        setData(prev => {
            if (!prev) return prev;
            const updatedStudents = prev.students.map(st => {
                if (st.id === studentId) {
                    const updatedGrades = { ...st.grades };
                    updatedGrades[subjectId] = {
                        ...updatedGrades[subjectId],
                        [term]: val,
                        is_overridden: term === 'np' ? true : updatedGrades[subjectId]?.is_overridden
                    };
                    return { ...st, grades: updatedGrades };
                }
                return st;
            });
            return { ...prev, students: updatedStudents };
        });

        try {
            await api.classes.updateGrade(classId, {
                student_id: studentId,
                subject_id: subjectId,
                term: term,
                value: val,
                is_director_override: isEditMode
            });
            fetchGrades();
        } catch (err) {
            alert("Nuk u ruajt dot nota!");
        }
    };

    const exportToExcel = () => {
        const table = tableRef.current;
        if (!table) return;
        const wb = XLSX.utils.table_to_book(table, { sheet: "Pasqyra e Notave" });
        XLSX.writeFile(wb, `Pasqyra_Notave_Klasa_${data?.class?.name || classId}.xlsx`);
    };

    const exportToPDF = () => {
        const input = tableRef.current;
        if (!input) return;
        html2canvas(input, { scale: 1.5, backgroundColor: "#0f172a" }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
            pdf.save(`Pasqyra_Notave_Klasa_${data?.class?.name || classId}.pdf`);
        });
    };

    if (loading) return <div className="p-8 text-center text-slate-400 font-medium">Po ngarkohet pasqyra e notave...</div>;
    if (!data) return <div className="p-8 text-center text-red-400 font-medium">Nuk u gjetën të dhëna për këtë klasë!</div>;

    const { class: classInfo, grouped_subjects, all_subjects, students } = data;

    return (
        <div className="p-6 space-y-6 text-slate-100">
            {/* Header i Faqes */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl shadow-md border border-slate-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">
                        Pasqyra e Notave — Klasa {classInfo.name} {classInfo.section || ''}
                    </h1>
                    <p className="text-sm text-slate-400">Viti Akademik Aktiv</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={isEditMode ? "destructive" : "outline"}
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`flex items-center gap-2 ${!isEditMode ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white" : ""
                            }`}
                    >
                        {isEditMode ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isEditMode ? "Përfundo Modifikimin" : "Modifiko Notat"}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={exportToExcel}
                        className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel
                    </Button>

                    <Button
                        variant="outline"
                        onClick={exportToPDF}
                        className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4 text-rose-400" /> PDF
                    </Button>
                </div>
            </div>

            {/* Tabela kryesore e Notave - Dark Mode */}
            <div className="overflow-x-auto bg-slate-900 rounded-xl shadow-lg border border-slate-800" ref={tableRef}>
                <table className="w-full border-collapse text-sm text-center border-slate-800">
                    <thead>
                        {/* Niveli 1: Kategoritë e Lëndëve */}
                        <tr className="bg-sky-950/60 text-sky-200 border-b border-slate-800">
                            <th colSpan="3" className="p-3 border-r border-slate-800 font-semibold text-slate-300">
                                Informata personale
                            </th>
                            {Object.keys(grouped_subjects).map((category, idx) => (
                                <th
                                    key={idx}
                                    colSpan={grouped_subjects[category].length}
                                    className="p-3 border-r border-slate-800 font-bold text-sky-400 border-l"
                                >
                                    {category || 'Lëndë të tjera'}
                                </th>
                            ))}
                            <th className="p-3 bg-amber-950/50 font-bold text-amber-300 border-l border-slate-800">
                                Notat Mesatare
                            </th>
                        </tr>

                        {/* Niveli 2: Emrat e Lëndëve */}
                        <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 text-xs">
                            <th className="p-2 border-r border-slate-800 text-left min-w-[180px]">Emri & Mbiemri</th>
                            <th className="p-2 border-r border-slate-800 w-10">Gjinia</th>
                            <th className="p-2 border-r border-slate-800 w-12 bg-slate-800/80 font-semibold text-emerald-400">
                                Gjysmëvjetori
                            </th>

                            {all_subjects.map((sub) => (
                                <th key={sub.id} className="p-2 border-r border-slate-800 font-semibold min-w-[80px] max-w-[100px]">
                                    <div className="line-clamp-2">{sub.name}</div>
                                </th>
                            ))}

                            <th className="p-2 bg-amber-950/30 font-bold text-amber-200 w-16">Mesatarja</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                        {students.map((student) => (
                            <React.Fragment key={student.id}>
                                {/* Rreshti I (Gjysmëvjetori I) */}
                                <tr className="hover:bg-slate-800/40 transition-colors">
                                    <td rowSpan="3" className="p-3 border-r border-slate-800 font-bold text-left text-slate-100 bg-slate-900">
                                        {student.full_name}
                                    </td>
                                    <td rowSpan="3" className="p-2 border-r border-slate-800 font-semibold text-slate-400 bg-slate-900">
                                        {student.gender}
                                    </td>
                                    <td className="p-1 border-r border-slate-800 font-bold text-slate-400 bg-slate-800/60">I</td>

                                    {all_subjects.map((sub) => {
                                        const gradeObj = student.grades[sub.id];
                                        return (
                                            <td key={sub.id} className="p-1 border-r border-slate-800 text-sky-300 font-medium">
                                                {isEditMode ? (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        className="w-8 text-center border border-slate-700 rounded bg-slate-950 text-sky-300 focus:outline-none focus:border-sky-500"
                                                        value={gradeObj?.t1 || ''}
                                                        onChange={(e) => handleGradeChange(student.id, sub.id, 't1', e.target.value)}
                                                    />
                                                ) : (
                                                    gradeObj?.t1 || '-'
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-1 border-r border-slate-800 font-bold text-slate-300 bg-amber-950/20">
                                        {student.overall_averages.t1}
                                    </td>
                                </tr>

                                {/* Rreshti II (Gjysmëvjetori II) */}
                                <tr className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-1 border-r border-slate-800 font-bold text-slate-400 bg-slate-800/60">II</td>

                                    {all_subjects.map((sub) => {
                                        const gradeObj = student.grades[sub.id];
                                        return (
                                            <td key={sub.id} className="p-1 border-r border-slate-800 text-sky-300 font-medium">
                                                {isEditMode ? (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        className="w-8 text-center border border-slate-700 rounded bg-slate-950 text-sky-300 focus:outline-none focus:border-sky-500"
                                                        value={gradeObj?.t2 || ''}
                                                        onChange={(e) => handleGradeChange(student.id, sub.id, 't2', e.target.value)}
                                                    />
                                                ) : (
                                                    gradeObj?.t2 || '-'
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-1 border-r border-slate-800 font-bold text-slate-300 bg-amber-950/20">
                                        {student.overall_averages.t2}
                                    </td>
                                </tr>

                                {/* Rreshti NP (Nota Përfundimtare) */}
                                <tr className="border-b-2 border-slate-700 bg-emerald-950/30 font-bold">
                                    <td className="p-1 border-r border-slate-800 font-bold text-emerald-400 bg-emerald-950/50">NP</td>

                                    {all_subjects.map((sub) => {
                                        const gradeObj = student.grades[sub.id];
                                        return (
                                            <td key={sub.id} className="p-1 border-r border-slate-800 text-rose-400">
                                                {isEditMode ? (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        className="w-8 text-center border border-slate-700 rounded bg-slate-950 font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                                                        value={gradeObj?.np || ''}
                                                        onChange={(e) => handleGradeChange(student.id, sub.id, 'np', e.target.value)}
                                                    />
                                                ) : (
                                                    <span className={gradeObj?.is_overridden ? "underline decoration-dotted text-amber-400" : ""}>
                                                        {gradeObj?.np || '-'}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-1 border-r border-slate-800 font-extrabold text-rose-300 bg-amber-950/40">
                                        {student.overall_averages.np}
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}