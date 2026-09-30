import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'

export function QuickGrades({ data, refresh }) {
  const [period, setPeriod] = useState('1'); const [draft, setDraft] = useState({}); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [error, setError] = useState('')
  const inputs = useRef([])
  const periods = [...data.periods.map(p => ({ id: String(p.id), label: p.label })), { id: 't1', label: 'Gjysmëvjetori I' }, { id: 't2', label: 'Gjysmëvjetori II' }]
  const original = id => period.startsWith('t') ? data.term_grades?.find(g => g.student_id === id)?.[period === 't1' ? 'term_1_grade' : 'term_2_grade'] ?? '' : data.grades.find(g => g.student_id === id && String(g.period) === period)?.grade ?? ''
  const value = id => id in draft ? draft[id] : String(original(id))
  const dirty = Object.keys(draft).length
  useEffect(() => { if (!dirty) return; const warn = e => { e.preventDefault(); e.returnValue = '' }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn) }, [dirty])
  function update(id, grade) { setDraft(prev => { const next = { ...prev }; if (grade === String(original(id))) delete next[id]; else next[id] = grade; return next }); setNotice('') }
  function focus(index) { inputs.current[index]?.focus(); inputs.current[index]?.select() }
  function paste(e, index) {
    const text = e.clipboardData.getData('text').trim(); if (!text) return
    e.preventDefault(); const values = text.split(/\r?\n/).map(v => v.trim())
    if (values.some(v => !/^[1-5]$/.test(v)) || index + values.length > data.students.length) { setError('Ngjit vetëm një kolonë me nota 1–5, jo më shumë se nxënësit e mbetur.'); return }
    values.forEach((v, i) => update(data.students[index + i].id, v)); setError(''); focus(Math.min(index + values.length, data.students.length - 1))
  }
  async function save() {
    setBusy(true); setError(''); setNotice('')
    try { await api.teacherWorkspace.batchGrades(data.class.id, data.subject.id, { period, changes: Object.entries(draft).map(([id, grade]) => ({ student_id: Number(id), grade: grade === '' ? null : Number(grade) })) }); setDraft({}); await refresh(); setNotice('Të gjitha ndryshimet u ruajtën.') }
    catch (e) { try { const p = JSON.parse(e.message); setError(Object.values(p.errors || {}).flat().join(' ') || p.message) } catch { setError('Ruajtja dështoi. Ndryshimet mbeten këtu për riprovim.') } }
    finally { setBusy(false) }
  }
  return <section className="rounded-xl border border-white/10 bg-surface-900 p-5">
    <h2 className="font-semibold">Vendosja e shpejtë e notave</h2><p className="mt-2 text-sm text-surface-400">Zgjidh periudhën, kliko notën e nxënësit të parë dhe shtyp 1–5: kalon automatikisht te nxënësi tjetër. Mund të ngjitësh edhe një kolonë notash nga Excel, sipas rendit të nxënësve më poshtë.</p>
    <div className="sticky top-0 z-10 my-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-surface-900 p-3"><select aria-label="Periudha e notave" disabled={busy} className="rounded-lg bg-surface-800 p-2 text-sm" value={period} onChange={e => { if (!dirty || window.confirm('Ke nota të paruajtura. Të ndërrohet periudha?')) { setPeriod(e.target.value); setDraft({}); setNotice(''); setError('') } }}>{periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select><Button disabled={!dirty || busy} onClick={save}>{busy ? 'Duke ruajtur…' : `Ruaj ${dirty || ''} ndryshime`}</Button><Button variant="ghost" disabled={!dirty || busy} onClick={() => { if (window.confirm('Të anulohen ndryshimet e paruajtura?')) setDraft({}) }}>Anulo ndryshimet</Button><span className="text-xs text-surface-400">{data.students.filter(s => value(s.id) !== '').length}/{data.students.length} nota</span></div>
    {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}{notice && <p role="status" className="mb-4 text-sm text-brand-400">{notice}</p>}
    <p className="mb-3 text-xs text-surface-400">↑ ↓ ose Enter për lëvizje. Backspace për ta zbrazur notën. Ndryshimet ruhen vetëm me butonin “Ruaj”.</p>
    <table className="w-full max-w-3xl text-left text-sm"><thead><tr><th className="p-3">Nr.</th><th className="p-3">Nxënësi</th><th className="p-3">Nota</th>{period.startsWith('t') && <th className="p-3">NP e ruajtur</th>}</tr></thead><tbody>{data.students.map((s, i) => <tr key={s.id} className={`border-t border-white/10 ${s.id in draft ? 'bg-brand-500/5' : ''}`}><td className="p-3 text-surface-400">{i + 1}</td><th className="p-3 font-normal">{s.first_name} {s.last_name}</th><td className="p-2"><input ref={el => { inputs.current[i] = el }} aria-label={`Nota për ${s.first_name} ${s.last_name}`} inputMode="numeric" autoComplete="off" disabled={busy} className="h-11 w-20 rounded-lg border border-brand-500/30 bg-surface-800 text-center text-lg focus:ring-2 focus:ring-brand-500" value={value(s.id)} onFocus={e => e.target.select()} onPaste={e => paste(e, i)} onChange={e => { const v = e.target.value; if (/^[1-5]?$/.test(v)) { update(s.id, v); if (v) focus(i + 1) } }} onKeyDown={e => { if (/^[1-5]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); update(s.id, e.key); focus(i + 1) } else if (['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); focus(i + (e.key === 'ArrowUp' ? -1 : 1)) } }} /></td>{period.startsWith('t') && <td className="p-3">{data.term_grades?.find(g => g.student_id === s.id)?.final_grade ?? '—'}</td>}</tr>)}</tbody></table>
    {!data.students.length && <p className="py-5 text-sm text-surface-400">Nuk ka nxënës aktivë në këtë klasë.</p>}
  </section>
}
