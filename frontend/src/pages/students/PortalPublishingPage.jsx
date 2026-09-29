import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel, Empty, LoadError, kinds, dateLabel } from './StudentPortal'

const blank = { kind: 'lesson', title: '', description: '', url: '', starts_on: '', ends_on: '', class_id: '', activity_id: '', subject_id: '' }
export function PortalPublishingPage() {
  const { user } = useAuth(); const client = useQueryClient()
  const allowed = ['director', 'secretary', 'teacher'].includes(user?.role)
  const query = useQuery({ queryKey: ['portal-management', user?.id], queryFn: () => api.studentPortal.manage().then(r => r.data), enabled: allowed })
  const [form, setForm] = useState(blank); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('')
  if (!allowed) return <Navigate to="/dashboard" replace />
  async function publish(e) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      await api.studentPortal.publish(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])))
      setForm(blank); setMessage('U publikua me sukses. Nxënësit përkatës do ta shohin në portal dhe në njoftime.')
      await client.invalidateQueries({ queryKey: ['portal-management'] })
    } catch (err) { try { const data = JSON.parse(err.message); setError(Object.values(data.errors || {}).flat().join(' ') || data.message) } catch { setError('Publikimi dështoi. Provo përsëri.') } } finally { setBusy(false) }
  }
  async function remove(id) { setBusy(true); setError(''); try { await api.studentPortal.remove(id); await query.refetch() } catch { setError('Publikimi nuk u hoq. Provo përsëri.') } finally { setBusy(false) } }
  const input = 'mt-1 w-full rounded-lg border border-white/10 bg-surface-800 p-2.5 text-sm'
  function field(key, label, type = 'text', required = false) { return <label className="block text-sm">{label}<input className={input} type={type} required={required} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label> }
  function select(key, label, items, placeholder) { return <label className="block text-sm">{label}<select className={input} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}><option value="">{placeholder}</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label> }
  return <div><PageHeader title="Publikime për nxënësit" description="Mësime, detyra, materiale, kalendar dhe grupe" />{query.isPending ? <Empty>Duke ngarkuar…</Empty> : query.isError ? <LoadError retry={query.refetch} /> : <div className="grid gap-5 lg:grid-cols-2"><Panel title="Publikim i ri"><form onSubmit={publish} className="space-y-4"><label className="block text-sm">Lloji<select className={input} value={form.kind} onChange={e => setForm({ ...blank, kind: e.target.value })}>{Object.entries(kinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{field('title', 'Titulli', 'text', true)}<label className="block text-sm">Përshkrimi / udhëzimet<textarea rows={4} className={input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>{select('class_id', 'Klasa', query.data.classes, user.role === 'teacher' || form.kind === 'assignment' ? 'Zgjidh klasën' : 'Të gjithë nxënësit')}{select('subject_id', 'Lënda', query.data.subjects, 'Zgjidh lëndën (kur zbatohet)')}{form.kind !== 'assignment' && select('activity_id', 'Kufizo te anëtarët e aktivitetit', query.data.activities, 'Pa kufizim sipas aktivitetit')}<p className="text-xs text-surface-400">Nëse caktoni klasë dhe aktivitet, publikimi u shfaqet vetëm nxënësve që i përkasin të dyjave.</p>{field('url', form.kind === 'group' ? 'Linku i ftesës në WhatsApp' : 'Linku i materialit (opsional)', 'url', form.kind === 'group')}<div className="grid grid-cols-2 gap-3">{field('starts_on', form.kind === 'assignment' ? 'Afati i detyrës' : 'Data e fillimit', 'date', ['assignment', 'exam', 'holiday', 'break', 'event'].includes(form.kind))}{form.kind !== 'assignment' && field('ends_on', 'Data e përfundimit', 'date')}</div>{error && <p role="alert" className="text-sm text-red-400">{error}</p>}{message && <p role="status" className="text-sm text-brand-400">{message}</p>}<Button disabled={busy} type="submit">{busy ? 'Duke ruajtur…' : 'Publiko për nxënësit'}</Button></form></Panel><Panel title="Publikimet e portalit"><p className="mb-3 text-xs text-surface-400">Detyrat e publikuara shfaqen te detyrat e klasës në portalin e nxënësit.</p>{query.data.entries.map(e => <article key={e.id} className="border-b border-white/10 py-4"><p className="text-xs text-brand-400">{kinds[e.kind]} · {e.class?.name || 'Të gjitha klasat'}{e.activity && ` · ${e.activity.name}`}</p><h3 className="mt-1 text-sm font-medium">{e.title}</h3>{e.starts_on && <p className="mt-1 text-xs text-surface-400">{dateLabel(e.starts_on)}</p>}<Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => remove(e.id)}>Hiq publikimin</Button></article>)}{!query.data.entries.length && <Empty>Ende nuk ka publikime.</Empty>}</Panel></div>}</div>
}
