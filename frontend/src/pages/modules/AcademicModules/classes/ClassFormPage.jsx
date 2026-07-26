import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function ClassFormPage({ mode = 'create' }) {
    const navigate = useNavigate()
    const { id } = useParams()

    const isEdit = mode === 'edit'

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        section: '',
        homeroom_staff_id: '',
        academic_year_id: '',
    })

    // Dropdown options State
    const [staffList, setStaffList] = useState([])
    const [academicYears, setAcademicYears] = useState([])

    // Loaders & Errors
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState({})

    // 1. Initial Fetch (Dropdowns + Class details if Edit mode)
    useEffect(() => {
        async function initForm() {
            try {
                setLoading(true)

                // Marrim listat për dropdown-e duke përdorur strukturën tuaj ekzistuese të `api`
                const [staffRes, yearsRes] = await Promise.all([
                    api.staff.index({ per_page: 500 }),
                    api.academic.academicYears(),
                ])

                // Nxjerrim vargun e të dhënave (duhet marrë parasysh nëse vjen direkt apo brenda .data)
                const staffData = staffRes?.data || staffRes || []
                const yearsData = yearsRes?.data || yearsRes || []

                setStaffList(Array.isArray(staffData) ? staffData : [])
                setAcademicYears(Array.isArray(yearsData) ? yearsData : [])

                // Nëse jemi në EDIT mode, marrim klasën ekzistuese
                if (isEdit && id) {
                    const classRes = await api.classes.show(id)
                    // Nëse backend e mban në res.data.data apo direkt res.data
                    const classData = classRes?.data || classRes

                    if (classData) {
                        setFormData({
                            name: classData.name || '',
                            section: classData.section || '',
                            // I konvertojmë në String sepse HTML <select> punon me string
                            homeroom_staff_id: classData.homeroom_staff_id ? String(classData.homeroom_staff_id) : '',
                            academic_year_id: classData.academic_year_id ? String(classData.academic_year_id) : '',
                        })
                    }
                }
            } catch (err) {
                console.error('Gabim gjatë marrjes së të dhënave për formë:', err)
            } finally {
                setLoading(false)
            }
        }

        initForm()
    }, [id, isEdit])

    // Handle input values
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }))
        }
    }

    // Handle Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setErrors({})

        try {
            if (isEdit) {
                // 1. Përditësojmë të dhënat bazë të klasës
                await api.classes.update(id, formData)

                // 2. Nëse është zgjedhur ose ndryshuar mësuesi kujdestar, thërrasim edhe endpoint-in specifik:
                if (formData.homeroom_staff_id) {
                    await api.classes.assignHomeroom(id, formData.homeroom_staff_id)
                }
            } else {
                // Nëse është krijim i ri
                const newClassRes = await api.classes.store(formData)
                const createdId = newClassRes?.data?.id || newClassRes?.id

                if (createdId && formData.homeroom_staff_id) {
                    await api.classes.assignHomeroom(createdId, formData.homeroom_staff_id)
                }
            }

            navigate(isEdit ? `/classes/${id}` : '/classes')
        } catch (err) {
            // api.js hedh gabime si new Error(JSON.stringify({status, message, code}))
            // Për 422, përpiqemi të marrim errors nga message
            let statusCode = 0
            try {
                const parsed = JSON.parse(err.message)
                if (parsed.status === 422 && parsed.errors) {
                    setErrors(parsed.errors)
                } else {
                    statusCode = parsed.status
                }
            } catch {
                // Nëse nuk është JSON, vazhdo
            }
            if (!statusCode || statusCode !== 422) {
                console.error('Gabim gjatë ruajtjes:', err)
            }
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEdit ? 'Ndrysho Klasën' : 'Shto Klasë të Re'}
                    </h1>
                    <p className="text-sm text-surface-400">
                        {isEdit
                            ? 'Përditëso të dhënat e klasës existuese'
                            : 'Plotëso të dhënat për të krijuar një klasë të re'}
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Informatat e Klasës</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Emri i Klasës */}
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Emri i Klasës *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="p.sh. 10/1"
                                required
                                className="w-full rounded-md border border-surface-700 bg-surface-900 p-2 text-sm focus:border-brand-500 focus:outline-none"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">{errors.name[0]}</p>
                            )}
                        </div>

                        {/* Paralelja / Section */}
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Paralelja (Section)
                            </label>
                            <input
                                type="text"
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                placeholder="p.sh. 1"
                                className="w-full rounded-md border border-surface-700 bg-surface-900 p-2 text-sm focus:border-brand-500 focus:outline-none"
                            />
                            {errors.section && (
                                <p className="mt-1 text-xs text-red-500">{errors.section[0]}</p>
                            )}
                        </div>

                        {/* Kujdestari */}
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Mësuesi Kujdestar
                            </label>
                            <select
                                name="homeroom_staff_id"
                                value={formData.homeroom_staff_id}
                                onChange={handleChange}
                                className="w-full rounded-md border border-surface-700 bg-surface-900 p-2 text-sm focus:border-brand-500 focus:outline-none"
                            >
                                <option value="">Zgjidh Mësuesin Kujdestar</option>
                                {staffList.map((staff) => (
                                    <option key={staff.id} value={String(staff.id)}>
                                        {staff.first_name} {staff.last_name}
                                    </option>
                                ))}
                            </select>
                            {errors.homeroom_staff_id && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.homeroom_staff_id[0]}
                                </p>
                            )}
                        </div>

                        {/* Viti Akademik */}
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Viti Akademik *
                            </label>
                            <select
                                name="academic_year_id"
                                value={formData.academic_year_id}
                                onChange={handleChange}
                                required
                                className="w-full rounded-md border border-surface-700 bg-surface-900 p-2 text-sm focus:border-brand-500 focus:outline-none"
                            >
                                <option value="">Zgjidh Vitin Akademik</option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={String(year.id)}>
                                        {year.label || year.name || year.year}
                                    </option>
                                ))}
                            </select>
                            {errors.academic_year_id && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.academic_year_id[0]}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(-1)}
                            >
                                Anulo
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                {isEdit ? 'Përditëso' : 'Ruaj'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}