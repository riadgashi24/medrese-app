import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { DataTable } from '@/components/ui/DataTable'

export default function ClassesPage() {
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.classes.index({ per_page: 1000 })
                setClasses(res?.data || [])
            } catch (e) { console.error(e) } finally { setLoading(false) }
        }

        load()
    }, [])

    const rows = classes.map((c) => ({ id: c.id, label: c.name + (c.section ? (' - ' + c.section) : '') }))
    const columns = [{ key: 'label', label: 'Klasa' }]

    return (
        <div>
            <PageHeader title="Klasat" description="Kliko për të parë nxënësit" />
            {rows.length ? (
                <DataTable columns={columns} data={rows} onRowClick={(row) => navigate(`/classes/${row.id}`)} />
            ) : (
                <Card><CardContent className="text-surface-400">Nuk u gjet asnjë klasë.</CardContent></Card>
            )}
        </div>
    )
}
