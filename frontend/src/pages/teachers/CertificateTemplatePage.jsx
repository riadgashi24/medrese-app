import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { templateLabels, templateImage, buildMappedCertificate } from './certificateTemplate'
import { loadAssets } from './certificatePdf'

const input = 'rounded-lg border border-white/10 bg-surface-900 p-2 text-sm w-full'
function errorText(e) { try { return JSON.parse(e.message).message } catch { return e.message } }
export default function CertificateTemplatePage() {
  const { user } = useAuth()
  const [level, setLevel] = useState(10), [template, setTemplate] = useState(null), [subjects, setSubjects] = useState([])
  const [selected, setSelected] = useState('student_name'), [fields, setFields] = useState([]), [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  useEffect(() => {
    if (user?.role !== 'director') return
    let alive = true; setBusy(true); setError(''); setTemplate(null); setFields([])
    Promise.all([api.certificateTemplates.show(level), api.academic.subjects()]).then(([r,s]) => {
      if (!alive) return
      setTemplate(r.data); setFields(r.data?.fields || []); setSubjects((s.data || s).filter(x => Number(x.level) === level)); setDirty(false)
    }).catch(e => alive && setError(errorText(e))).finally(() => alive && setBusy(false))
    return () => { alive = false }
  }, [level, user?.role])
  useEffect(() => { const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = '' } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn) }, [dirty])
  if (user?.role !== 'director') return <Navigate to="/dashboard" replace />
  const options = [...Object.entries(templateLabels).map(([key,label]) => ({key,label})), ...subjects.flatMap(s => [{key:`grade:${s.id}`,label:`${s.name} · numri`},{key:`word:${s.id}`,label:`${s.name} · me fjalë`}])]
  const field = fields.find(f => f.key === selected)
  const missing = subjects.filter(s => !fields.some(f => f.key === `grade:${s.id}` || f.key === `word:${s.id}`))
  function patch(values) { setFields(current => current.map(f => f.key === selected ? {...f,...values} : f)); setDirty(true); setNotice('') }
  async function upload(file) {
    if (!file) return
    if ((template || dirty) && !window.confirm('Shablloni i ri do t’i zëvendësojë figurën dhe pozitat e fushave për këtë nivel. Vazhdo?')) return
    setBusy(true); setError(''); setNotice('')
    try {
      const image = await templateImage(file), form = new FormData()
      form.append('image', image.blob, 'template.png'); form.append('name',file.name.slice(0,150)); form.append('width_mm',image.width); form.append('height_mm',image.height)
      const r = await api.certificateTemplates.upload(level,form); setTemplate(r.data); setFields([]); setDirty(false); setSelected('student_name'); setNotice('Shablloni u ngarkua si draft. Vendosi fushat dhe aktivizoje.')
    } catch(e) { setError(errorText(e)) } finally { setBusy(false) }
  }
  async function save(active) {
    setBusy(true); setError(''); setNotice('')
    try { const r = await api.certificateTemplates.save(level,{fields,active,revision:template.revision}); setTemplate(r.data); setFields(r.data.fields); setDirty(false); setNotice(active ? 'Shablloni u aktivizua për dëftesat e këtij niveli.' : 'Drafti u ruajt. Aktivizoje para gjenerimit.') }
    catch(e) { setError(errorText(e)) } finally { setBusy(false) }
  }
  function place(e) {
    if (busy) return
    const rect = e.currentTarget.getBoundingClientRect(), width = field?.width || (selected.startsWith('grade:') ? 5 : 30)
    const x = Math.max(0,Math.min(100-width,(e.clientX-rect.left)/rect.width*100)), y = Math.max(0,Math.min(95,(e.clientY-rect.top)/rect.height*100))
    if (field) patch({x,y}); else { setFields([...fields,{key:selected,x,y,width,size:10,align:'left'}]); setDirty(true) }
  }
  async function preview() {
    setBusy(true); setError('')
    try { const [{jsPDF},assets] = await Promise.all([import('jspdf'),loadAssets()]); const values = Object.fromEntries(options.map(o => [o.key,o.key.startsWith('grade:') ? '5' : o.key.startsWith('word:') ? 'shkëlqyeshëm' : o.key === 'student_name' ? 'Emër Mbiemër' : o.label])); buildMappedCertificate(jsPDF,{...template,fields},values,assets).save(`Prove-shablloni-${level}.pdf`) }
    catch(e) { setError(errorText(e)) } finally { setBusy(false) }
  }
  return <div className="space-y-5"><PageHeader title="Shabllonet e dëftesave" description="Ngarko dëftesën bosh dhe cakto vendin e çdo fushe. Shablloni vlen për të gjitha paralelet e nivelit të zgjedhur." />
    <Card><div className="flex flex-wrap gap-4 items-end"><label className="grid gap-1 text-sm">Niveli<select className={input} disabled={busy} value={level} onChange={e => { if (!dirty || window.confirm('Ke ndryshime të paruajtura. Ndërro nivelin?')) { setLevel(Number(e.target.value)); setNotice('') } }}><option value={10}>Klasa 10</option><option value={11}>Klasa 11</option><option value={12}>Klasa 12</option></select></label><label className="grid gap-1 text-sm">Ngarko PDF, PNG ose JPG<input disabled={busy} type="file" accept="application/pdf,image/png,image/jpeg" onChange={e => { upload(e.target.files?.[0]); e.target.value='' }} /></label></div><p className="mt-3 text-xs text-surface-400">Një faqe, deri 12 MB. Përdor shabllon bosh, pa nota dhe pa të dhëna nxënësi. PDF-ja ruan përmasat e faqes; figurat përshtaten në gjerësi A4.</p></Card>
    {error && <p role="alert" className="text-red-500">{error}</p>}{notice && <p role="status" className="text-brand-500">{notice}</p>}
    {template && <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <Card className="space-y-4 self-start"><p className="font-semibold break-all">{template.name}</p><p className="text-xs text-surface-400">{template.active ? 'Aktiv' : 'Draft'}{dirty ? ' · Ndryshime të paruajtura' : ''} · {template.width_mm} × {template.height_mm} mm</p>
        <label className="grid gap-1 text-sm">Fusha<select className={input} disabled={busy} value={selected} onChange={e => setSelected(e.target.value)}>{options.map(o => <option key={o.key} value={o.key}>{fields.some(f=>f.key===o.key) ? '✓ ' : ''}{o.label}</option>)}</select></label>
        <p className="text-xs text-surface-400">Zgjidh fushën, pastaj kliko mbi shabllon. Kliko sërish për ta zhvendosur. Pozita llogaritet nga këndi i sipërm majtas.</p>
        {field && <fieldset disabled={busy} className="space-y-3"><div className="grid grid-cols-2 gap-2">{[['x','Majtas (%)',0,98],['y','Lart (%)',0,97],['width','Gjerësia (%)',1,100-field.x],['size','Shkronjat (pt)',6,24]].map(([key,label,min,max])=><label className="grid gap-1 text-xs" key={key}>{label}<input className={input} type="number" step="0.1" min={min} max={max} value={Number(field[key].toFixed(2))} onChange={e=>patch({[key]:Math.max(min,Math.min(max,Number(e.target.value)))})} /></label>)}</div><label className="grid gap-1 text-xs">Rreshtimi<select className={input} value={field.align} onChange={e=>patch({align:e.target.value})}><option value="left">Majtas</option><option value="center">Në mes</option><option value="right">Djathtas</option></select></label><Button variant="secondary" onClick={()=>{setFields(fields.filter(f=>f.key!==selected));setDirty(true)}}>Hiqe këtë fushë</Button></fieldset>}
        <p className="text-xs text-surface-400">{fields.length} fusha të vendosura. {missing.length ? `Pa vend për notën: ${missing.map(s=>s.name).join(', ')}` : 'Të gjitha lëndët kanë vend për notën.'}</p>
        <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={()=>save(false)}>Ruaj draftin</Button><Button disabled={busy || !fields.length} onClick={()=>save(true)}>Ruaj dhe aktivizo</Button><Button variant="secondary" disabled={busy || !fields.length} onClick={preview}>Shkarko provën PDF</Button></div>
      </Card>
      <div className="overflow-x-auto rounded-xl bg-surface-800/40 p-3"><div role="img" aria-label="Shablloni i dëftesës; kliko për të vendosur fushën e zgjedhur" onClick={place} className="relative mx-auto cursor-crosshair bg-white shadow-lg" style={{width:'100%',minWidth:420,maxWidth:900,aspectRatio:`${template.width_mm}/${template.height_mm}`}}><img draggable={false} alt="Shablloni bosh" src={template.image} className="absolute inset-0 h-full w-full pointer-events-none" />{fields.map(f=><button key={f.key} type="button" disabled={busy} onClick={e=>{e.stopPropagation();setSelected(f.key)}} title={options.find(o=>o.key===f.key)?.label} className={`absolute truncate border text-[10px] leading-tight ${selected===f.key ? 'border-blue-600 bg-blue-100 text-blue-950' : 'border-emerald-700 bg-emerald-50/90 text-emerald-950'}`} style={{left:`${f.x}%`,top:`${f.y}%`,width:`${f.width}%`,textAlign:f.align}}>{options.find(o=>o.key===f.key)?.label || f.key}</button>)}</div></div>
    </div>}
  </div>
}
