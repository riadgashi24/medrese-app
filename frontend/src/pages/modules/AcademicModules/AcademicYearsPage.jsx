import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label } from '@/components/ui/Input'
import { api } from '@/lib/api'
import {
  Loader2,
  Plus,
  Check,
  Pencil,
  X,
  Save,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react'

export default function AcademicYearsPage() {
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [promoting, setPromoting] = useState(null) // id e vitit që po promovohet

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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

  async function handleEditStart(year) {
    setEditingId(year.id)
    setEditLabel(year.label)
  }

  async function handleEditCancel() {
    setEditingId(null)
    setEditLabel('')
  }

  async function handleEditSave(yearId) {
    if (!editLabel.trim()) return
    setSavingEdit(true)
    try {
      await api.academic.updateAcademicYear(yearId, { label: editLabel })
      setEditingId(null)
      setEditLabel('')
      loadYears()
    } catch (err) {
      console.error('Failed to update academic year:', err)
    } finally {
      setSavingEdit(false)
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

  async function handlePromote(yearId) {
    setPromoting(yearId)
    try {
      await api.academic.promoteAcademicYear(yearId)
      loadYears()
    } catch (err) {
      console.error('Failed to promote academic year:', err)
    } finally {
      setPromoting(null)
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
        description="Menaxho vitet akademike, cakto vitin aktiv dhe promovo klasat"
        actions={
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" /> Shto Vit
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 max-w-md border-brand-500/20">
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
          years.map((year) => {
            const isEditing = editingId === year.id
            const isPromoting = promoting === year.id

            return (
              <Card
                key={year.id}
                className={`transition-all duration-200 hover:border-surface-600 ${
                  year.is_active ? 'border-brand-500/40 ring-1 ring-brand-500/10' : ''
                }`}
              >
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  {/* Left side */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`h-2.5 w-2.5 rounded-full flex-shrink-0 transition-colors ${
                        year.is_active
                          ? 'bg-brand-400 shadow-sm shadow-brand-400/50'
                          : 'bg-surface-600'
                      }`}
                    />

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave(year.id)
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-400 hover:text-brand-300"
                          onClick={() => handleEditSave(year.id)}
                          disabled={savingEdit || !editLabel.trim()}
                        >
                          {savingEdit ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-surface-400 hover:text-surface-200"
                          onClick={handleEditCancel}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-surface-100 font-medium truncate">
                          {year.label}
                        </span>
                        <button
                          onClick={() => handleEditStart(year)}
                          className="p-1 rounded-md text-surface-500 hover:text-surface-300 hover:bg-surface-700/50 opacity-0 group-hover/card:opacity-100 transition-all"
                          title="Ndrysho emrin"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <span className="text-xs text-surface-500 ml-1 hidden sm:inline whitespace-nowrap">
                          {year.classes_count ?? 0} klasa ·{' '}
                          {year.fee_structures_count ?? 0} tarifa
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {year.is_active ? (
                      <Badge variant="success" className="flex-shrink-0">
                        Aktiv
                      </Badge>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePromote(year.id)}
                          disabled={isPromoting}
                          className="gap-1.5 text-xs"
                          title="Promovo klasat për këtë vit"
                        >
                          {isPromoting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                          Promovo
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(year)}
                          className="gap-1.5 text-xs"
                          title="Aktivizo këtë vit"
                        >
                          <Check className="h-3.5 w-3.5" /> Aktivizo
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
