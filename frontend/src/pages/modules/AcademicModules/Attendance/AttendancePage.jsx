import React, { useState, useEffect, useMemo } from 'react'
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    FileCheck,
    TrendingUp,
    AlertTriangle,
    FileSpreadsheet,
    Printer,
    Download,
    Search,
    ArrowUpDown,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

const tooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 12,
}

// Funksion ndihmës për formatimin e datës ISO (p.sh. 2026-07-06T00:00:00.000000Z -> 06.07.2026)
const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return dateString
        return new Intl.DateTimeFormat('sq-AL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date)
    } catch {
        return dateString
    }
}

export function AttendancePage({ classId = 1 }) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)

    // Filters & State
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRate, setFilterRate] = useState('all')
    const [sortConfig, setSortConfig] = useState({ key: 'rollNumber', direction: 'asc' })
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 6

    // Fetch nga Backendi
    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        api.attendance.overview({ class_id: classId })
            .then((resData) => {
                if (isMounted && resData?.success) {
                    setData(resData.data);
                } else if (isMounted && !resData?.success) {
                    setData(resData);
                }
            })
            .catch((err) => {
                console.error('Gabim gjatë marrjes së të dhënave:', err);
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [classId]);

    // Filtering & Sorting
    const filteredStudents = useMemo(() => {
        if (!data?.students) return []

        return data.students
            .filter((student) => {
                const matchesSearch =
                    (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    String(student.rollNumber).includes(searchTerm)

                let matchesFilter = true
                if (filterRate === 'high') matchesFilter = student.rate >= 90
                if (filterRate === 'medium') matchesFilter = student.rate >= 80 && student.rate < 90
                if (filterRate === 'low') matchesFilter = student.rate < 80

                return matchesSearch && matchesFilter
            })
            .sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
    }, [data, searchTerm, filterRate, sortConfig])

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredStudents.slice(start, start + itemsPerPage)
    }, [filteredStudents, currentPage])

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }))
    }

    // --- FUNKSIONET E QUICK ACTIONS ---

    // 1. Printimi dhe Save as PDF
    const handlePrintOrPDF = () => {
        window.print()
    }

    // 2. Eksportimi në Excel (CSV format që hapet natyralisht në Excel)
    const handleExportExcel = () => {
        if (!filteredStudents.length) return

        const headers = ['Roll Number', 'Nxenesi', 'Prezent (Dite)', 'Mungese', 'Vonese', 'Arsyetuar', 'Prezenca %', 'Regjistrimi i Fundit']

        const rows = filteredStudents.map(student => [
            `"${student.rollNumber}"`,
            `"${student.name}"`,
            student.present,
            student.absent,
            student.late,
            student.excused,
            `"${student.rate}%"`,
            `"${formatDate(student.lastDate)}"`
        ])

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `Prezenca_${data?.header?.className || 'Klasa'}_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // 1. LOADING STATE
    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-surface-400">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500 mr-2" />
                <span>Po ngarkohen të dhënat e prezencës...</span>
            </div>
        )
    }

    // 2. EMPTY STATE
    if (!data || !data.students || data.students.length === 0) {
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center p-6">
                <div className="rounded-full bg-surface-800 p-6">
                    <CalendarIcon className="h-12 w-12 text-surface-400" />
                </div>
                <h2 className="text-xl font-bold text-surface-100">Nuk ka të dhëna për prezencën</h2>
                <p className="max-w-md text-sm text-surface-400">
                    Për këtë klasë nuk është regjistruar ende asnjë mungesë ose vonesë.
                </p>
            </div>
        )
    }

    const { header, stats, trend, requiringAttention } = data

    return (
        <div className="space-y-6 p-4 md:p-6 text-surface-100">

            {/* HEADER */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-surface-800 pb-5">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">{header.className}</h1>
                        <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-400 border border-brand-500/20">
                            Viti Akademik {header.academicYear}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-surface-400">
                        Kujdestari: <span className="font-medium text-surface-200">{header.homeroomTeacher}</span> • Total Nxënës: {header.totalStudents}
                    </p>
                </div>

                {/* QUICK ACTIONS */}
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                    <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handlePrintOrPDF}>
                        <Download className="h-4 w-4" /> Export PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExportExcel}>
                        <FileSpreadsheet className="h-4 w-4" /> Export Excel
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handlePrintOrPDF}>
                        <Printer className="h-4 w-4" /> Print
                    </Button>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card className="bg-surface-900 border-surface-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400"><Users className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-surface-400">Total Nxënës</p>
                            <p className="text-lg font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-surface-900 border-surface-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400"><UserCheck className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-surface-400">Prezent Sot</p>
                            <p className="text-lg font-bold text-emerald-400">{stats.presentToday}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-surface-900 border-surface-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg bg-red-500/10 p-2.5 text-red-400"><UserX className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-surface-400">Mungesë Sot</p>
                            <p className="text-lg font-bold text-red-400">{stats.absentToday}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-surface-900 border-surface-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-400"><Clock className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-surface-400">Vonesa Sot</p>
                            <p className="text-lg font-bold text-amber-400">{stats.lateToday}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-surface-900 border-surface-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400"><FileCheck className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-surface-400">Arsyetuar Sot</p>
                            <p className="text-lg font-bold text-purple-400">{stats.excusedToday}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-surface-900 border-surface-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg bg-brand-500/10 p-2.5 text-brand-400"><TrendingUp className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-surface-400">Prezenca Sot</p>
                            <p className="text-lg font-bold text-brand-400">{stats.rateToday}%</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TREND CHART & WARNINGS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Trend 30 Ditë */}
                <Card className="lg:col-span-2 bg-surface-900 border-surface-800">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Trendi i Prezencës (30 Ditët e Fundit)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                                <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val}%`, 'Prezenca']} />
                                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Nxënësit me Vëmendje */}
                <Card className="bg-surface-900 border-surface-800 border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-400">
                            <AlertTriangle className="h-5 w-5" /> Kërkojnë Vëmendje ({requiringAttention.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[220px] overflow-y-auto">
                        {requiringAttention.length > 0 ? (
                            requiringAttention.map((student) => (
                                <div key={student.id} className="flex items-center justify-between rounded-lg bg-surface-800/60 p-2.5 border border-surface-700/50">
                                    <div>
                                        <p className="text-sm font-semibold">{student.name}</p>
                                        <p className="text-xs text-red-400">
                                            {student.rate < 80 ? `Prezenca vetëm ${student.rate}%` : `${student.absent} Mungesa gjithsej`}
                                        </p>
                                    </div>
                                    <span className="text-xs font-mono bg-surface-700 px-2 py-1 rounded">#{student.rollNumber}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-surface-400 py-4 text-center">Nuk ka asnjë nxënës kritik në këtë klasë.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* TABLE */}
            <Card className="bg-surface-900 border-surface-800">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-base font-semibold">Tabela e Prezencës së Nxënësve</CardTitle>

                    <div className="flex flex-wrap items-center gap-3 print:hidden">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-surface-400" />
                            <input
                                type="text"
                                placeholder="Kërko nxënësin..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-48 md:w-60 rounded-md border border-surface-700 bg-surface-800 pl-9 pr-3 py-1.5 text-xs text-surface-100 placeholder-surface-400 focus:border-brand-500 focus:outline-none"
                            />
                        </div>

                        <select
                            value={filterRate}
                            onChange={(e) => setFilterRate(e.target.value)}
                            className="rounded-md border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 focus:border-brand-500 focus:outline-none"
                        >
                            <option value="all">Të gjitha normat</option>
                            <option value="high">Mbi 90% (Lartë)</option>
                            <option value="medium">80% - 90% (Mesatare)</option>
                            <option value="low">Nën 80% (E ulët)</option>
                        </select>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-surface-800 text-xs font-semibold text-surface-400 bg-surface-950/40">
                                <tr>
                                    <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('rollNumber')}>
                                        <div className="flex items-center gap-1"># <ArrowUpDown className="h-3 w-3 print:hidden" /></div>
                                    </th>
                                    <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">Nxënësi <ArrowUpDown className="h-3 w-3 print:hidden" /></div>
                                    </th>
                                    <th className="py-3 px-4 text-center">Prezent (Ditë)</th>
                                    <th className="py-3 px-4 text-center">Mungesë</th>
                                    <th className="py-3 px-4 text-center">Vonesë</th>
                                    <th className="py-3 px-4 text-center">Arsyetuar</th>
                                    <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('rate')}>
                                        <div className="flex items-center gap-1 justify-center">Prezenca % <ArrowUpDown className="h-3 w-3 print:hidden" /></div>
                                    </th>
                                    <th className="py-3 px-4 text-right">Regjistrimi i Fundit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-800/60">
                                {paginatedStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-surface-800/40 transition-colors">
                                        <td className="py-3 px-4 font-mono text-xs text-surface-400">{student.rollNumber}</td>
                                        <td className="py-3 px-4 font-medium text-surface-100">{student.name}</td>
                                        <td className="py-3 px-4 text-center text-emerald-400 font-semibold">{student.present}</td>
                                        <td className="py-3 px-4 text-center text-red-400 font-semibold">{student.absent}</td>
                                        <td className="py-3 px-4 text-center text-amber-400 font-semibold">{student.late}</td>
                                        <td className="py-3 px-4 text-center text-purple-400 font-semibold">{student.excused}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={`font-bold text-xs ${student.rate < 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {student.rate}%
                                                </span>
                                                <div className="w-16 bg-surface-800 h-1.5 rounded-full overflow-hidden print:hidden">
                                                    <div
                                                        className={`h-full ${student.rate < 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${student.rate}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right text-xs text-surface-400">
                                            {formatDate(student.lastDate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4 border-t border-surface-800 text-xs text-surface-400 print:hidden">
                        <span>Po shfaqen {paginatedStudents.length} nga {filteredStudents.length} nxënës</span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-7 w-7"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span>Faqja {currentPage} nga {totalPages || 1}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="h-7 w-7"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}