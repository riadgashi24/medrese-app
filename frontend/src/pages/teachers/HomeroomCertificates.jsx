import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { downloadCertificates } from './certificatePdf'

export function HomeroomCertificates({ data, onRegister }) {
  const query = useQuery({ queryKey: ['certificates', data.class.id], queryFn: () => api.homeroom.certificates(data.class.id).then(r => r.data), staleTime: 0 })
  const templateQuery = useQuery({ queryKey: ['certificate-template', Number(data.class.name.split('/')[0])], queryFn: () => api.certificateTemplates.show(Number(data.class.name.split('/')[0])).then(r => r.data) })
  const [details, setDetails] = useState({ date: data.settings.report_date, place: '', director: '' })
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const entries = query.data?.certificates || [], ready = entries.filter(e => e.ready).length
  async function download(id = null) {
    setError('')
    if (!details.date || !details.place.trim() || !details.director.trim()) { setError('Plotëso datën, vendin e lëshimit dhe emrin e drejtorit.'); return }
    setBusy(true)
    try {
      const fresh = await api.homeroom.certificates(data.class.id)
      await downloadCertificates(fresh.data, details, id)
    } catch (e) { try { setError(JSON.parse(e.message).message) } catch { setError(e.message) } }
    finally { setBusy(false) }
  }
  return <section className="space-y-4 rounded-xl border border-white/10 bg-surface-900 p-5"><h2 className="text-lg font-semibold">Dëftesat e fundvitit</h2>
    <p className="text-sm text-brand-500">{templateQuery.isPending ? 'Duke kontrolluar shabllonin…' : templateQuery.isError ? 'Shablloni nuk u ngarkua. Provo përsëri para shkarkimit.' : templateQuery.data ? `Shablloni i drejtorit: ${templateQuery.data.name} · ${templateQuery.data.active ? 'Aktiv' : 'Draft, kërkon aktivizim'}` : 'Përdoret modeli standard derisa drejtori të ngarkojë shabllonin.'}</p>
    <p className="text-sm text-surface-400">PDF për çdo nxënës, me notat përfundimtare të lëndëve të klasës. Plotëso të dhënat personale, sjelljen dhe numrin në amzë te Regjistri. Notat që janë llogaritur vetëm nga një gjysmëvjetor nuk mjaftojnë.</p>
    <div className="grid gap-3 sm:grid-cols-3">{[['date', 'Data e lëshimit', 'date'], ['place', 'Vendi i lëshimit', 'text'], ['director', 'Emri i drejtorit/es', 'text']].map(([key, label, type]) => <label key={key} className="grid gap-1 text-sm">{label}<input required maxLength={100} disabled={busy} type={type} value={details[key]} onChange={e => setDetails({ ...details, [key]: e.target.value })} className="rounded-lg border border-white/10 bg-surface-800 p-2" /></label>)}</div>
    <div className="flex flex-wrap items-center gap-3"><Button disabled={busy || query.isPending || !entries.length || ready !== entries.length} onClick={() => download()}>{busy ? 'Duke përgatitur PDF-të…' : 'Shkarko ZIP për klasën'}</Button><Button variant="secondary" onClick={onRegister}>Plotëso regjistrin</Button><span className="text-sm">{ready}/{entries.length} dëftesa të gatshme</span></div>
    <p className="text-xs text-surface-400">ZIP-i përfshin gjithë klasën kur të gjitha dëftesat janë gati. Nxënësit e çregjistruar nuk përfshihen. PDF-të kanë hapësira për nënshkrime dhe vulë.</p>
    {error && <p role="alert" className="text-red-500">{error}</p>}{query.isError && <Button onClick={() => query.refetch()}>Provo ngarkimin përsëri</Button>}
    {query.isPending ? <p>Duke kontrolluar notat…</p> : <div className="divide-y divide-white/10">{entries.map(e => <div key={e.student.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium">{e.student.name}</p><p className={`mt-1 text-xs ${e.ready ? 'text-brand-500' : 'text-amber-600'}`}>{e.ready ? 'Gati për gjenerim' : 'Mungojnë: ' + e.missing.join(', ')}</p></div><Button variant="secondary" disabled={busy || !e.ready} onClick={() => download(e.student.id)}>PDF</Button></div>)}</div>}
  </section>
}

export function HomeroomHistory({ data, renderReport }) {
  const [selected, setSelected] = useState('')
  const classes = useQuery({ queryKey: ['homeroom-history', data.class.id], queryFn: () => api.homeroom.history(data.class.id).then(r => r.data) })
  const report = useQuery({ queryKey: ['homeroom-history-report', data.class.id, selected], queryFn: () => api.homeroom.historicalReport(data.class.id, selected).then(r => r.data), enabled: !!selected })
  return <section className="space-y-4"><h2 className="text-lg font-semibold">Vitet e mëparshme</h2><p className="text-sm text-surface-400">Evidenca historike vetëm për nxënësit e klasës aktuale. Nëse klasa është bashkuar nga disa paralele, ato shfaqen veçmas. Të dhënat janë vetëm për lexim.</p>
    {classes.isPending ? <p>Duke kërkuar regjistrimet…</p> : classes.isError ? <Button onClick={() => classes.refetch()}>Provo përsëri</Button> : !classes.data?.length ? <p>Nuk ka regjistrime në klasa të mëparshme për këta nxënës.</p> : <select aria-label="Viti shkollor historik" className="rounded-lg border border-white/10 bg-surface-800 p-3" value={selected} onChange={e => setSelected(e.target.value)}><option value="">Zgjidh vitin dhe klasën</option>{classes.data.map(c => <option key={c.id} value={c.id}>{c.year} · Klasa {c.name}</option>)}</select>}
    {selected && (report.isPending ? <p>Duke ngarkuar evidencën…</p> : report.isError ? <Button onClick={() => report.refetch()}>Provo përsëri</Button> : renderReport(report.data))}
  </section>
}
