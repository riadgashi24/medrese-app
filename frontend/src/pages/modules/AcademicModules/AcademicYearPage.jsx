import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { Loader2, Plus, Check } from 'lucide-react'

export default function AcademicYearPage() {
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadYears()
  }, [])

  async function loadYears() {
    try {
      setLoading(true)
      const res = await api.academic.academicYears()
      setYears(res?.data ?? [])
    } catch (err) {
      console.error('Failed to load academic years:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!label.trim()) return
    setSaving(true)
    try {
      await api.academic.storeAcademicYear({ label })
      setLabel('')
      setShowForm(false)
      loadYears()
    } catch (err) {
      console.error('Failed to create academic year:', err)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(year) {
    try {
      await api.academic.activateAcademicYear(year.id)
      loadYears()
    } catch (err) {
      console.error('Failed to update academic year:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-surface-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Duke ngarkuar...
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Vitet Shkollore"
        description="Menaxho vitet akademike dhe cakto vitin aktiv"
        actions={
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" /> Shto Vit
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 max-w-md">
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Emri i Vitit Shkollor</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="p.sh. 2026/2027"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Duke ruajtur...' : 'Krijo Vitin'}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Anulo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {years.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-surface-500 text-sm">
              Nuk ka vite shkollore të regjistruara. Kliko "Shto Vit" për të krijuar të parin.
            </CardContent>
          </Card>
        ) : (
          years.map((year) => (
            <Card key={year.id}>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${year.is_active ? 'bg-brand-400' : 'bg-surface-600'}`} />
                  <div>
                    <span className="text-surface-100 font-medium">{year.label}</span>
                    <span className="text-xs text-surface-500 ml-2">
                      {year.classes_count ?? 0} klasa · {year.fee_structures_count ?? 0} tarifa
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {year.is_active ? (
                    <Badge variant="success">Aktiv</Badge>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(year)}>
                      <Check className="h-3.5 w-3.5" /> Aktivizo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
