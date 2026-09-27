import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Edit3, Check, FileSpreadsheet, FileText } from 'lucide-react';

function GradeInput({ value, onSave, onDirty, label, className }) {
    const [draft, setDraft] = useState(value ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => { setDraft(value ?? ''); }, [value]);
    const save = async () => {
        if (saving || String(draft) === String(value ?? '')) return;
        const next = draft === '' ? null : Number(draft);
        if (next !== null && (!Number.isInteger(next) || next < 1 || next > 5)) {
            setError('Vendosni notë nga 1 deri në 5.');
            return;
        }
        setSaving(true);
        setError('');
        try { await onSave(next); onDirty(false); }
        catch { setError('Nuk u ruajt. Klikoni fushën dhe provoni përsëri.'); }
        finally { setSaving(false); }
    };
    return <div>
        <input type="number" min="1" max="5" step="1" aria-label={label} aria-invalid={Boolean(error)}
            disabled={saving} className={className} value={draft}
            onChange={e => { setDraft(e.target.value); setError(''); onDirty(e.target.value !== String(value ?? '')); }} onBlur={save}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setDraft(value ?? ''); setError(''); onDirty(false); } }} />
        {saving && <span className="block text-xs text-surface-400" role="status">Ruhet…</span>}
        {error && <span className="block text-xs text-red-400" role="alert">{error}</span>}
    </div>;
}

export default function GradesPage() {
    const { id: classId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);
    const tableRef = useRef(null);
    const saveQueue = useRef(Promise.resolve());
    const [dirtyCells, setDirtyCells] = useState({});
    const [pendingSaves, setPendingSaves] = useState(0);
    const markDirty = (key, dirty) => setDirtyCells(prev => ({ ...prev, [key]: dirty }));

    useEffect(() => {
        if (classId) {
            fetchGrades();
        }
    }, [classId]);

    const fetchGrades = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.classes.grades(classId);
            setData(res);
        } catch (err) {
            setError('Pasqyra nuk u ngarkua. Kontrolloni lidhjen ose qasjen tuaj.');
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (studentId, subjectId, term, value) => {
        setPendingSaves(count => count + 1);
        const operation = saveQueue.current.catch(() => {}).then(async () => {
        const response = await api.classes.updateGrade(classId, {
            student_id: studentId, subject_id: subjectId, term, value,
        });
        const saved = response.grade;
        setData(prev => {
            if (!prev) return prev;
            const updatedStudents = prev.students.map(st => {
                if (st.id === studentId) {
                    const updatedGrades = { ...st.grades };
                    updatedGrades[subjectId] = {
                        t1: saved.term_1_grade,
                        t2: saved.term_2_grade,
                        np: saved.final_grade,
                        is_overridden: saved.is_final_overridden,
                    };
                    const averages = Object.fromEntries(['t1', 't2', 'np'].map(key => {
                        const values = Object.values(updatedGrades).map(g => g[key]).filter(v => v !== null && v !== undefined).map(Number);
                        return [key, values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100 : '-'];
                    }));
                    return { ...st, grades: updatedGrades, overall_averages: averages };
                }
                return st;
            });
            return { ...prev, students: updatedStudents };
        });
        });
        saveQueue.current = operation;
        return operation.finally(() => setPendingSaves(count => count - 1));
    };

    const exportRows = (subjects) => data.students.flatMap(student => ['t1', 't2', 'np'].map(term => [
        student.full_name, { t1: 'I', t2: 'II', np: 'NP' }[term],
        ...subjects.map(subject => student.grades[subject.id]?.[term] ?? ''),
        student.overall_averages[term],
    ]));

    const exportToExcel = async () => {
        setExporting(true);
        setError('');
        try {
            const XLSX = await import('xlsx');
            const rows = [['Emri dhe mbiemri', 'Periudha', ...data.all_subjects.map(s => s.name), 'Mesatarja'], ...exportRows(data.all_subjects)];
            const sheet = XLSX.utils.aoa_to_sheet(rows);
            sheet['!cols'] = [{ wch: 28 }, { wch: 10 }, ...data.all_subjects.map(() => ({ wch: 18 })), { wch: 12 }];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, 'Pasqyra e notave');
            XLSX.writeFile(workbook, `Pasqyra_Notave_${data.class.name}.xlsx`);
        } catch { setError('Eksporti nuk u krye. Provoni përsëri.'); }
        finally { setExporting(false); }
    };

    const exportToPDF = async () => {
        setExporting(true);
        setError('');
        try {
            const { default: jsPDF } = await import('jspdf');
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            // Standard PDF fonts need transliteration for the Albanian alphabet.
            const text = value => String(value ?? '').replace(/[ëËçÇ]/g, c => ({ë:'e',Ë:'E',ç:'c',Ç:'C'}[c]));
            const subjects = data.all_subjects;
            let firstPage = true;
            for (let offset = 0; offset < Math.max(subjects.length, 1); offset += 8) {
                const part = subjects.slice(offset, offset + 8);
                const rows = exportRows(part);
                const headers = ['Emri dhe mbiemri', 'Periudha', ...part.map(s => s.name), 'Mesatarja'];
                const widths = [44, 16, ...part.map(() => 196 / Math.max(part.length, 1)), 21];
                for (let rowOffset = 0; rowOffset < Math.max(rows.length, 1); rowOffset += 18) {
                    if (!firstPage) pdf.addPage();
                    firstPage = false;
                    pdf.setTextColor(25, 35, 45);
                    pdf.setFontSize(13);
                    pdf.text(text(`Pasqyra e notave - ${data.class.name}`), 10, 12);
                    pdf.setFontSize(9);
                    pdf.text(text(data.class.academic_year?.label || ''), 10, 19);
                    const drawRow = (cells, y, header = false) => {
                        let x = 10;
                        pdf.setFontSize(header ? 7 : 8);
                        cells.forEach((value, index) => {
                            pdf.setFillColor(...(header ? [230, 237, 232] : [255, 255, 255]));
                            pdf.setDrawColor(205, 213, 220);
                            pdf.rect(x, y, widths[index], header ? 14 : 8, 'FD');
                            const lines = pdf.splitTextToSize(text(value), widths[index] - 3);
                            pdf.text(lines.slice(0, header ? 3 : 2), x + 1.5, y + 4);
                            x += widths[index];
                        });
                    };
                    drawRow(headers, 24, true);
                    rows.slice(rowOffset, rowOffset + 18).forEach((row, index) => drawRow(row, 38 + index * 8));
                    pdf.text(`Faqe ${pdf.getNumberOfPages()}`, 265, 200);
                }
            }
            pdf.save(`Pasqyra_Notave_${data.class.name}.pdf`);
        } catch { setError('PDF-ja nuk u krijua. Provoni përsëri.'); }
        finally { setExporting(false); }
    };

    if (loading) return <div className="p-8 text-center text-surface-400 font-medium">Po ngarkohet pasqyra e notave...</div>;
    if (!data) return <div className="p-8 text-center"><p role="alert">{error || "Nuk u gjetën të dhëna për këtë klasë."}</p><Button onClick={fetchGrades}>Provo përsëri</Button></div>;

    const { class: classInfo, grouped_subjects, all_subjects, students } = data;

    return (
        <div className="space-y-6 text-surface-100">
            {error && <p role="alert" className="text-red-400">{error}</p>}
            {isEditMode && <p className="text-sm text-surface-300" role="status">{pendingSaves ? 'Duke ruajtur ndryshimet…' : Object.values(dirtyCells).some(Boolean) ? 'Ka ndryshime të paruajtura. Shtypni Enter për ruajtje ose Escape për anulim.' : 'Ndryshimet janë të ruajtura. Nota ruhet me Enter ose kur dilni nga fusha.'}</p>}
            {/* Header i Faqes */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-900/80 p-4 rounded-xl shadow-md border border-surface-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-bold text-surface-100">
                        {`Pasqyra e Notave — Klasa ${classInfo.name}`}
                    </h1>
                    <p className="text-sm text-surface-400">{classInfo.academic_year?.label || "Viti shkollor"}</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={isEditMode ? "destructive" : "outline"}
                        disabled={pendingSaves > 0 || Object.values(dirtyCells).some(Boolean) || !data.all_subjects.some(sub => sub.can_edit)}
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`flex items-center gap-2 ${!isEditMode ? "bg-surface-800 text-surface-200 border-surface-700 hover:bg-surface-700 hover:text-surface-100" : ""
                            }`}
                    >
                        {isEditMode ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isEditMode ? "Përfundo Modifikimin" : "Modifiko Notat"}
                    </Button>

                    <Button
                        variant="outline"
                        disabled={isEditMode || exporting} onClick={exportToExcel}
                        className="bg-surface-800 text-surface-200 border-surface-700 hover:bg-surface-700 hover:text-surface-100 flex items-center gap-2"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel
                    </Button>

                    <Button
                        variant="outline"
                        disabled={isEditMode || exporting} onClick={exportToPDF}
                        className="bg-surface-800 text-surface-200 border-surface-700 hover:bg-surface-700 hover:text-surface-100 flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4 text-rose-400" /> PDF
                    </Button>
                </div>
            </div>

            {/* Tabela kryesore e Notave - Dark Mode */}
            <div className="overflow-x-auto bg-surface-900 rounded-xl shadow-lg border border-surface-800" ref={tableRef}>
                <table className="w-full border-collapse text-sm text-center border-surface-800">
                    <thead>
                        {/* Niveli 1: Kategoritë e Lëndëve */}
                        <tr className="bg-sky-500/10 text-sky-200 border-b border-surface-800">
                            <th colSpan="3" className="p-3 border-r border-surface-800 font-semibold text-surface-300">
                                Informata personale
                            </th>
                            {Object.keys(grouped_subjects).map((category, idx) => (
                                <th
                                    key={idx}
                                    colSpan={grouped_subjects[category].length}
                                    className="p-3 border-r border-surface-800 font-bold text-sky-400 border-l"
                                >
                                    {category || 'Lëndë të tjera'}
                                </th>
                            ))}
                            <th className="p-3 bg-amber-500/10 font-bold text-amber-300 border-l border-surface-800">
                                Notat Mesatare
                            </th>
                        </tr>

                        {/* Niveli 2: Emrat e Lëndëve */}
                        <tr className="bg-surface-900 text-surface-300 border-b border-surface-800 text-xs">
                            <th className="p-2 border-r border-surface-800 text-left min-w-[180px]">Emri & Mbiemri</th>
                            <th className="p-2 border-r border-surface-800 w-10">Gjinia</th>
                            <th className="p-2 border-r border-surface-800 w-12 bg-surface-800/80 font-semibold text-emerald-400">
                                Gjysmëvjetori
                            </th>

                            {all_subjects.map((sub) => (
                                <th key={sub.id} className="p-2 border-r border-surface-800 font-semibold min-w-[80px] max-w-[100px]">
                                    <div className="line-clamp-2">{sub.name}</div>
                                </th>
                            ))}

                            <th className="p-2 bg-amber-500/10 font-bold text-amber-200 w-16">Mesatarja</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-surface-800">
                        {students.length === 0 && <tr><td colSpan={all_subjects.length + 4} className="p-8 text-surface-400">Nuk ka nxënës aktivë në këtë klasë.</td></tr>}
                        {students.map((student) => (
                            <React.Fragment key={student.id}>
                                {/* Rreshti I (Gjysmëvjetori I) */}
                                <tr className="hover:bg-surface-800/40 transition-colors">
                                    <td rowSpan="3" className="p-3 border-r border-surface-800 font-bold text-left text-surface-100 bg-surface-900">
                                        {student.full_name}
                                    </td>
                                    <td rowSpan="3" className="p-2 border-r border-surface-800 font-semibold text-surface-400 bg-surface-900">
                                        {student.gender}
                                    </td>
                                    <td className="p-1 border-r border-surface-800 font-bold text-surface-400 bg-surface-800/60">I</td>

                                    {all_subjects.map((sub) => {
                                        const gradeObj = student.grades[sub.id];
                                        return (
                                            <td key={sub.id} className="p-1 border-r border-surface-800 text-sky-300 font-medium">
                                                {isEditMode && sub.can_edit ? (
                                                    <GradeInput
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        className="w-8 text-center border border-surface-700 rounded bg-surface-950 text-sky-300 focus:outline-none focus:border-sky-500"
                                                        value={gradeObj?.t1 || ''}
                                                        label={`${student.full_name} — ${sub.name} — T1`}
                                                        onDirty={dirty => markDirty(`${student.id}:${sub.id}:t1`, dirty)}
                                                        onSave={value => handleGradeChange(student.id, sub.id, 't1', value)}
                                                    />
                                                ) : (
                                                    gradeObj?.t1 || '-'
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-1 border-r border-surface-800 font-bold text-surface-300 bg-amber-500/10">
                                        {student.overall_averages.t1}
                                    </td>
                                </tr>

                                {/* Rreshti II (Gjysmëvjetori II) */}
                                <tr className="hover:bg-surface-800/40 transition-colors">
                                    <td className="p-1 border-r border-surface-800 font-bold text-surface-400 bg-surface-800/60">II</td>

                                    {all_subjects.map((sub) => {
                                        const gradeObj = student.grades[sub.id];
                                        return (
                                            <td key={sub.id} className="p-1 border-r border-surface-800 text-sky-300 font-medium">
                                                {isEditMode && sub.can_edit ? (
                                                    <GradeInput
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        className="w-8 text-center border border-surface-700 rounded bg-surface-950 text-sky-300 focus:outline-none focus:border-sky-500"
                                                        value={gradeObj?.t2 || ''}
                                                        label={`${student.full_name} — ${sub.name} — T2`}
                                                        onDirty={dirty => markDirty(`${student.id}:${sub.id}:t2`, dirty)}
                                                        onSave={value => handleGradeChange(student.id, sub.id, 't2', value)}
                                                    />
                                                ) : (
                                                    gradeObj?.t2 || '-'
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-1 border-r border-surface-800 font-bold text-surface-300 bg-amber-500/10">
                                        {student.overall_averages.t2}
                                    </td>
                                </tr>

                                {/* Rreshti NP (Nota Përfundimtare) */}
                                <tr className="border-b-2 border-surface-700 bg-emerald-500/10 font-bold">
                                    <td className="p-1 border-r border-surface-800 font-bold text-emerald-400 bg-emerald-500/10">NP</td>

                                    {all_subjects.map((sub) => {
                                        const gradeObj = student.grades[sub.id];
                                        return (
                                            <td key={sub.id} className="p-1 border-r border-surface-800 text-rose-400">
                                                {isEditMode && sub.can_edit ? (
                                                    <GradeInput
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        className="w-8 text-center border border-surface-700 rounded bg-surface-950 font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                                                        value={gradeObj?.np || ''}
                                                        label={`${student.full_name} — ${sub.name} — NP`}
                                                        onDirty={dirty => markDirty(`${student.id}:${sub.id}:np`, dirty)}
                                                        onSave={value => handleGradeChange(student.id, sub.id, 'np', value)}
                                                    />
                                                ) : (
                                                    <span className={gradeObj?.is_overridden ? "underline decoration-dotted text-amber-400" : ""}>
                                                        {gradeObj?.np || '-'}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-1 border-r border-surface-800 font-extrabold text-rose-300 bg-amber-500/10">
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
