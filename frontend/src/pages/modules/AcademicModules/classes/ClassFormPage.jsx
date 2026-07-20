import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card' // Përshtat sipas UI tënd
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

export function ClassFormPage({ mode = 'create' }) {
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

    // Select Options State
    const [staffList, setStaffList] = useState([])
    const [academicYears, setAcademicYears] = useState([])

    // Loaders & Errors
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState({})

    // 1. Fetch dropdown options & existing class data if editing
    useEffect(() => {
        async function initForm() {
            try {
                setLoading(true)

                // Marrim listën e stafit dhe viteve akademike për dropdowns
                const [staffRes, yearsRes] = await Promise.all([
                    api.staff.index({ per_page: 500 }), // Përshtat sipas endpoint-eve tua të API
                    api.academicYears.index({ per_page: 100 }),
                ])

                const staffData = staffRes.data?.data || staffRes.data || []
                const yearsData = yearsRes.data?.data || yearsRes.data || []

                setStaffList(staffData)
                setAcademicYears(yearsData)

                // Nëse është 'edit', marrim të dhënat e klasës
                if (isEdit && id) {
                    const classRes = await api.classes.show(id)
                    const classData = classRes.data?.data || classRes.data

                    setFormData({
                        name: classData.name || '',
                        section: classData.section || '',
                        homeroom_staff_id: classData.homeroom_staff_id || '',
                        academic_year_id: classData.academic_year_id || '',
                    })
                }
            } catch (err) {
                console.error('Gabim gjatë ngarkimit të të dhënave:', err)
            } finally {
                setLoading(false)
            }
        }

        initForm()
    }, [id, isEdit])

    // Handle Input Changes
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        // Pastrojmë gabimin për atë fushë nëse përdoruesi shkruan diçka
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }))
        }
    }

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setErrors({})

        try {
            if (isEdit) {
                await api.classes.update(id, formData)
            } else {
                await api.classes.store(formData)
            }

            // Kthehemi te lista e klasave
            navigate('/classes')
        } catch (err) {
            if (err.response?.status === 422) {
                // Validation errors nga Laravel
                setErrors(err.response.data.errors || {})
            } else {
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
                    onClick={() => navigate('/classes')}
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
                                Emri i Klasës (p.sh. 10/1) *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="10/1"
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
                                placeholder="1"
                                className="w-full rounded-md border border-surface-700 bg-surface-900 p-2 text-sm focus:border-brand-500 focus:outline-none"
                            />
                            {errors.section && (
                                <p className="mt-1 text-xs text-red-500">{errors.section[0]}</p>
                            )}
                        </div>

                        {/* Kujdestari (Homeroom Staff) */}
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
                                    <option key={staff.id} value={staff.id}>
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
                                    <option key={year.id} value={year.id}>
                                        {year.label || year.year}
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
                                onClick={() => navigate('/classes')}
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