import { HomeroomCertificates, HomeroomHistory } from './HomeroomCertificates'
import { formatDate } from '../../lib/date.js'
import logo from '@/assets/logo.png'
import { renderToStaticMarkup } from 'react-dom/server'
import { reportStyles, printHomeroom } from './homeroomPrint'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Users, CalendarDays, Clock, BarChart3, FileText, Settings, Printer, Download } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Panel, Empty, LoadError } from '@/pages/students/StudentPortal'
import { exportHomeroom } from './homeroomExport'

export const terms = { t1: 'Gjysmëvjetori I', t2: 'Gjysmëvjetori II', np: 'Nota përfundimtare' }
export const labels = { registered: 'Të regjistruar gjithsej', withdrawn: 'Të çregjistruar', active: 'Vijojnë mësimin', graded: 'Me të gjitha notat', ungraded: 'Me nota të paplotësuara', excellent: 'Shkëlqyeshëm', very_good: 'Shumë mirë', good: 'Mirë', sufficient: 'Mjaftueshëm', positive: 'Gjithsej pozitiv', one_failure: 'Me një të dobët', two_failures: 'Me dy të dobëta', three_failures: 'Me tri ose më shumë të dobëta', negative: 'Gjithsej negativ', repeating: 'Përsërisin klasën', no_absences: 'Pa mungesa' }
const statusLabels = { active: 'Vijon', withdrawn: 'I çregjistruar', repeating: 'Përsëritës' }
const inputClass = 'w-full rounded-lg border border-white/10 bg-surface-800 p-2 text-sm'
const num = n => n == null ? '—' : Number(n).toLocaleString('sq-AL', { maximumFractionDigits: 2 })
const gender = value => value === 'Male' ? 'M' : value === 'Female' ? 'F' : 'Pa shënuar'
const monthNames = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor']
const monthLabel = m => `${monthNames[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`
function message(error) { try { const parsed = JSON.parse(error.message); return Object.values(parsed.errors || {}).flat().join(' ') || parsed.message } catch { return 'Ruajtja dështoi. Provo përsëri.' } }
function Table({ headers, children, minWidth = 700 }) {
  return <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm" style={{ minWidth }}><thead><tr className="border-b border-white/15">{headers.map((h, i) => <th key={i} className={`p-3 text-xs font-medium text-surface-400 ${i === 0 ? 'sticky left-0 z-10 bg-surface-900' : ''}`}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}
function Row({ cells }) { return <tr className="border-b border-white/5">{cells.map((c, i) => <td key={i} className={`p-3 align-top ${i === 0 ? 'sticky left-0 bg-surface-900 font-medium' : ''}`}>{c}</td>)}</tr> }
function Field({ label, children }) { return <label className="grid gap-1 text-xs text-surface-400">{label}{children}</label> }
function TermSelect({ value, onChange }) { return <select aria-label="Gjysmëvjetori" className={`${inputClass} sm:w-auto`} value={value} onChange={e => onChange(e.target.value)}>{Object.entries(terms).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select> }
function Editor({ title, children, close }) { return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4"><div role="dialog" aria-modal="true" aria-label={title} className="mx-auto my-8 max-w-3xl rounded-2xl border border-white/10 bg-surface-900 p-6"><div className="mb-5 flex justify-between gap-4"><h2 className="font-semibold">{title}</h2><Button aria-label="Mbyll" variant="ghost" onClick={close}>✕</Button></div>{children}</div></div> }

function Roster({ data, save, busy }) {
  const [search, setSearch] = useState(''); const [editing, setEditing] = useState(null)
  function edit(s) { setEditing({ ...s, date_of_birth: s.date_of_birth?.slice(0, 10) || '', profile: { ...s.profile, ...Object.fromEntries(Object.keys(terms).map(t => [t + '_status', s.profile[t + '_status'] || s.default_status])) } }) }
  const set = (key, value) => setEditing(s => ({ ...s, [key]: value }))
  const setProfile = (key, value) => setEditing(s => ({ ...s, profile: { ...s.profile, [key]: value } }))
  return <Panel title="Regjistri i nxënësve"><input aria-label="Kërko nxënës" className={`${inputClass} mb-4`} placeholder="Kërko emrin e nxënësit…" value={search} onChange={e => setSearch(e.target.value)} /><Table headers={['Nxënësi', 'Gjinia', 'Datëlindja / vendbanimi', 'Prindi dhe kontakti', 'GJ I / GJ II / NP', '']}>
    {data.students.filter(s => s.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(s => <Row key={s.id} cells={[s.name, gender(s.gender), <>{formatDate(s.date_of_birth)}<br />{s.municipality}</>, <>{s.parent_name}<br />{s.parent_phone}</>, Object.keys(terms).map(t => <p key={t} className="whitespace-nowrap text-xs">{t.toUpperCase()}: {statusLabels[s.profile[t + '_status'] || s.default_status]}</p>), <Button size="sm" variant="secondary" onClick={() => edit(s)}>{data.class.active ? 'Plotëso' : 'Shiko'}</Button>]} />)}
  </Table>{!data.students.length && <Empty>Nuk ka nxënës të regjistruar në këtë klasë.</Empty>}
    {editing && <Editor title={editing.name} close={() => setEditing(null)}><form onSubmit={async e => { e.preventDefault(); if (await save(`students/${editing.id}`, editing)) setEditing(null) }}><fieldset disabled={busy || !data.class.active} className="grid gap-4 sm:grid-cols-2">
      {[['first_name', 'Emri'], ['last_name', 'Mbiemri'], ['municipality', 'Komuna'], ['address', 'Adresa'], ['parent_name', 'Emri i prindit'], ['parent_phone', 'Telefoni i prindit'], ['parent_phone_secondary', 'Telefon shtesë'], ['student_email', 'Email i nxënësit']].map(([key, label]) => <Field key={key} label={label}><input className={inputClass} value={editing[key] || ''} onChange={e => set(key, e.target.value)} /></Field>)}
      <Field label="Gjinia"><select required className={inputClass} value={editing.gender || ''} onChange={e => set('gender', e.target.value || null)}><option value="" disabled>Zgjidh M / F</option><option value="Male">Mashkull</option><option value="Female">Femër</option></select></Field><Field label="Datëlindja"><input className={inputClass} type="date" value={editing.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></Field>
      {[['birth_place', 'Vendi i lindjes'], ['birth_country', 'Shteti i lindjes'], ['citizenship', 'Shtetësia'], ['conduct', 'Sjellja'], ['register_number', 'Numri në amzë'], ['parent_occupation', 'Profesioni i prindit'], ['parent_email', 'Email i prindit']].map(([key, label]) => <Field key={key} label={label}><input className={inputClass} value={editing.profile[key] || ''} onChange={e => setProfile(key, e.target.value)} /></Field>)}
      {Object.entries(terms).map(([t, label]) => <Field key={t} label={`Statusi në raport · ${label}`}><select className={inputClass} value={editing.profile[t + '_status']} onChange={e => setProfile(t + '_status', e.target.value)}>{Object.entries(statusLabels).filter(([id]) => id !== 'repeating' || t === 'np').map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></Field>)}
      <Field label="Shënime"><textarea className={inputClass} value={editing.profile.notes || ''} onChange={e => setProfile('notes', e.target.value)} /></Field>
      <p className="text-xs text-surface-400 sm:col-span-2">Statusi vlen për raportin e këtij gjysmëvjetori. Çregjistrimi nga shkolla menaxhohet te regjistri administrativ.</p><Button type="submit">Ruaj regjistrin</Button>
    </fieldset></form></Editor>}
  </Panel>
}

function GradeLedger({ data, term }) {
  return <div className="overflow-x-auto rounded-lg border border-white/10"><table className="grade-ledger w-full border-collapse text-sm" style={{ minWidth: 340 + data.subjects.length * 34, tableLayout: 'fixed' }}>
    <thead><tr className="bg-brand-500/10"><th className="number-col w-9 border border-white/10 p-1">Nr.</th><th className="student-name sticky left-0 z-10 w-44 border border-white/10 bg-surface-900 p-3 text-left">Nxënësi</th>{data.subjects.map(s => <th key={s.id} className="subject-name h-40 w-[34px] border border-white/10 p-1 align-bottom font-medium"><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', whiteSpace: 'nowrap' }}>{s.name}</span></th>)}{['Mes.', 'Dob.', 'Suks.'].map(h => <th key={h} className="summary-col w-11 border border-white/10 p-1 text-xs">{h}</th>)}</tr></thead>
    <tbody>{data.periods[term].rows.map((row, i) => <tr key={row.id} className="even:bg-brand-500/5 hover:bg-brand-500/10"><td className="border border-white/10 p-1 text-center text-xs text-surface-400">{i + 1}</td><th scope="row" className="student-name sticky left-0 border border-white/10 bg-surface-900 px-3 py-2 text-left text-xs font-medium">{row.name}{row.status === 'withdrawn' && <span className="block text-[10px] text-surface-400">I çregjistruar</span>}</th>{data.subjects.map(s => <td key={s.id} className={`border border-white/10 p-1 text-center font-semibold tabular-nums ${row.grades[s.id] === 1 ? 'text-red-500' : ''}`}>{row.grades[s.id] ?? '—'}</td>)}<td className="border border-white/10 p-1 text-center text-xs">{num(row.average)}</td><td className="border border-white/10 p-1 text-center text-xs">{row.failures}</td><td title={row.success == null ? `${row.missing} nota mungojnë` : ''} className="border border-white/10 p-1 text-center text-xs">{num(row.success)}</td></tr>)}</tbody>
  </table></div>
}

function GradeBook({ data, term, setTerm }) {
  return <Panel title="Ditari i notave"><TermSelect value={term} onChange={setTerm} /><p className="my-3 text-xs text-surface-400">Notat vendosen nga profesori i lëndës te “Klasat e mia”. Mes. = mesatarja; Dob. = nota të dobëta; Suks. = suksesi. — = pa notë / i paplotësuar.</p><GradeLedger data={data} term={term} /></Panel>
}

function Absences({ data, save, busy }) {
  const [editing, setEditing] = useState(null)
  return <Panel title="Mungesat mujore"><p className="mb-4 text-sm text-surface-400">Ar = me arsye, Pa = pa arsye. Mungesat nga orët shfaqen automatikisht si “në shqyrtim”. Totali mujor i konfirmuar nga kujdestari zëvendëson totalin automatik të atij muaji.</p>
    <Table minWidth={Math.max(1000, data.months.length * 140 + 450)} headers={['Nxënësi', ...data.months.map(monthLabel), 'Gj I · Ar / Pa', 'Gj II · Ar / Pa', 'Gjithsej · Ar / Pa']}>
      {data.students.map(s => <Row key={s.id} cells={[s.name, ...data.months.map(m => { const a = s.attendance[m]; return <button disabled={!data.class.active} className="w-full rounded-lg border border-white/10 p-2 text-left hover:border-brand-500/40" onClick={() => setEditing({ student_id: s.id, name: s.name, month: m, excused: a.excused, unexcused: a.unexcused, note: a.note || '', automatic: false, source: a.automatic })}><span>{a.excused} / {a.unexcused}</span><span className="block text-[10px] text-surface-400">{a.manual ? 'Konfirmuar' : 'Automatik'}{a.pending > 0 ? ` · ${a.pending} në shqyrtim` : ''}{a.late ? ` · ${a.late} vonesa` : ''}</span></button> }), ...Object.keys(terms).map(t => { const a = data.periods[t].rows.find(r => r.id === s.id).attendance; return <>{a.excused} / {a.unexcused}{a.pending > 0 && <p className="text-xs text-amber-400">{a.pending} në shqyrtim</p>}</> })]} />)}
    </Table>
    {editing && <Editor title={`${editing.name} · ${monthLabel(editing.month)}`} close={() => setEditing(null)}><p className="mb-4 text-sm text-surface-400">Nga evidenca: {editing.source.excused} me arsye, {editing.source.unexcused} pa arsye, {editing.source.pending} në shqyrtim dhe {editing.source.late} vonesa.</p><form onSubmit={async e => { e.preventDefault(); if (await save('absences', editing)) setEditing(null) }}><fieldset disabled={busy} className="space-y-4"><label className="flex gap-2 text-sm"><input type="checkbox" checked={editing.automatic} onChange={e => setEditing({ ...editing, automatic: e.target.checked })} />Përdor sërish evidencën automatike</label>{!editing.automatic && <><div className="grid grid-cols-2 gap-4">{[['excused', 'Me arsye'], ['unexcused', 'Pa arsye']].map(([key, label]) => <Field key={key} label={label}><input type="number" required min="0" max="1000" className={inputClass} value={editing[key]} onChange={e => setEditing({ ...editing, [key]: e.target.value })} /></Field>)}</div><Field label="Shënim për konfirmimin"><textarea className={inputClass} value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} /></Field></>}<Button type="submit">Ruaj muajin</Button></fieldset></form></Editor>}
  </Panel>
}

function Hours({ data, save, busy }) {
  const [editing, setEditing] = useState(null)
  return <Panel title="Planifikimi i orëve"><p className="mb-4 text-sm text-surface-400">Orët e planifikuara = të mbajtura + të pambajtura. Të mbajturat merren nga ditari i orëve; mund të vendosësh totalin e plotë kur evidenca është mbajtur më parë jashtë aplikacionit.</p>
    <Table headers={['Lënda / fusha', 'Gj I · Plan / Mb / Pa', 'Gj II · Plan / Mb / Pa', 'Gjithsej · Plan / Mb / Pa']}>
      {data.hours.map(s => <Row key={s.id} cells={[<>{s.name}<p className="text-xs text-surface-400">{s.category}</p></>, ...Object.keys(terms).map(t => <div><p>{s[t].planned} / {s[t].held} / {s[t].missed}</p>{t !== 'np' && <Button size="sm" variant="ghost" disabled={!data.class.active} onClick={() => setEditing({ subject_id: s.id, name: s.name, term: t, held: s[t].manual ? s[t].held : '', missed: s[t].missed, automatic: s[t].automatic })}>Plotëso</Button>}</div>)]} />)}
      <Row cells={['Gjithsej', ...Object.keys(terms).map(t => ['planned', 'held', 'missed'].map(k => data.hours.reduce((sum, s) => sum + s[t][k], 0)).join(' / '))]} />
    </Table>
    {editing && <Editor title={`${editing.name} · ${terms[editing.term]}`} close={() => setEditing(null)}><form onSubmit={async e => { e.preventDefault(); if (await save('hours', { ...editing, held: editing.held === '' ? null : editing.held })) setEditing(null) }}><fieldset disabled={busy} className="space-y-4"><Field label={`Të mbajtura · lëre bosh për automatik (${editing.automatic})`}><input type="number" min="0" max="2000" className={inputClass} value={editing.held} onChange={e => setEditing({ ...editing, held: e.target.value })} /></Field><Field label="Të pambajtura"><input type="number" required min="0" max="2000" className={inputClass} value={editing.missed} onChange={e => setEditing({ ...editing, missed: e.target.value })} /></Field><Button type="submit">Ruaj orët</Button></fieldset></form></Editor>}
  </Panel>
}

export function Summary({ period }) {
  return <Table minWidth={600} headers={['Suksesi / statusi', 'M', 'F', 'Pa gjini', 'Gjithsej', '% e vijuesve']}>
    {Object.entries(labels).map(([key, label]) => { const b = period.summary[key]; return <Row key={key} cells={[label, b.male, b.female, b.unknown, b.total, ['registered', 'withdrawn'].includes(key) ? '—' : `${num(b.percent)}${b.percent == null ? '' : '%'}`]} /> })}
  </Table>
}
export function SubjectStatistics({ period, detailed = false }) {
  const marks = [5, 4, 3, 2, 'positive', 1, 'ungraded']
  return <Table minWidth={detailed ? 1200 : 850} headers={['Lënda', ...marks.map(n => n === 'positive' ? 'Pozitiv' : n === 'ungraded' ? 'Pa notë' : `Nota ${n}`), 'Nxënës', 'Mesatarja']}>
    {period.subjects.map(s => <Row key={s.id} cells={[s.name, ...marks.map(mark => { const b = s.distribution[mark]; return detailed ? <><p>{b.total} · {num(b.percent)}%</p><p className="whitespace-nowrap text-[11px] text-surface-400">M {b.male} / F {b.female} / ? {b.unknown}</p></> : b.total }), s.total, num(s.average)]} />)}
  </Table>
}

function Statistics({ data, term, setTerm }) {
  const [detailed, setDetailed] = useState(true)
  return <div className="space-y-5"><TermSelect value={term} onChange={setTerm} /><Panel title="Suksesi i klasës"><Summary period={data.periods[term]} /><p className="mt-4 text-xs text-surface-400">Mesatarja e klasës: {num(data.periods[term].average)}. Llogaritet nga mesataret e nxënësve me nota të plota. Përsëritësit janë tregues më vete dhe nuk shtohen përsëri në total.</p></Panel><Panel title="Suksesi sipas lëndëve"><label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)} />Ndarja sipas gjinisë dhe përqindjet</label><SubjectStatistics period={data.periods[term]} detailed={detailed} /><p className="mt-3 text-xs text-surface-400">Përqindjet përdorin nxënësit vijues. Mesatarja e lëndës përdor vetëm notat e vendosura. Nxënësit pa gjini mbeten të përfshirë në total.</p></Panel></div>
}

function ReportContent({ data, mode, term }) {
  const period = data.periods[term]
  return <div className="space-y-6"><header className="report-brand flex items-center gap-5 border-b-2 border-brand-500 pb-4"><img src={logo} alt="Medreseja Alauddin" className="h-24 w-24 object-contain" /><div><p className="text-xs text-surface-400">{data.settings.school_type}</p><h2 className="text-xl font-semibold">{data.settings.school_name}</h2><h3 className="mt-2 font-medium">{mode === 'journal' ? 'Ditari i notave' : mode === 'admin' ? 'Raporti administrativ' : mode === 'individual' ? 'Suksesi individual' : `Pasqyra · ${terms[term]}`}</h3><p className="mt-2 text-sm">Klasa {data.class.name} · Viti {data.class.year} · Kujdestari: {data.class.teacher || '—'}</p></div></header>
    {mode === 'journal' ? <><h3>{terms[term]}</h3><GradeLedger data={data} term={term} /><p className="report-note">Mes. = mesatarja; Dob. = nota të dobëta; Suks. = suksesi. — = pa notë / i paplotësuar.</p></> : mode === 'individual' ? <Table headers={['Nxënësi', 'Gj I · Mes. / Suks.', 'Gj II · Mes. / Suks.', 'NP · Mes. / Suks.', 'Statusi NP']} >{data.students.map(s => <Row key={s.id} cells={[s.name, ...Object.keys(terms).map(t => { const row = data.periods[t].rows.find(r => r.id === s.id); return `${num(row.average)} / ${num(row.success)}` }), statusLabels[data.periods.np.rows.find(r => r.id === s.id).status]]} />)}</Table> : (mode === 'admin' ? Object.keys(terms) : [term]).map(t => <section key={t} className="report-section space-y-4"><h3 className="font-semibold">{terms[t]}</h3><SubjectStatistics period={data.periods[t]} detailed={mode !== 'admin'} /><Summary period={data.periods[t]} /><h4 className="font-medium">Mungesat dhe orët</h4><Table headers={['Evidenca', 'M', 'F', 'Pa gjini', 'Gjithsej']} minWidth={600}>{[['excused', 'Mungesa me arsye'], ['unexcused', 'Mungesa pa arsye'], ['pending', 'Mungesa në shqyrtim'], ['late', 'Vonesa']].map(([key, label]) => { const a = data.periods[t].attendance[key]; return <Row key={key} cells={[label, a.male, a.female, a.unknown, a.total]} /> })}</Table><p className="text-sm">Orë të planifikuara: {data.hours.reduce((sum, s) => sum + s[t].planned, 0)} · Të mbajtura: {data.hours.reduce((sum, s) => sum + s[t].held, 0)} · Të pambajtura: {data.hours.reduce((sum, s) => sum + s[t].missed, 0)}</p><p className="text-sm">Mesatarja e klasës: {num(data.periods[t].average)}</p></section>)}
    <footer className="flex justify-between gap-6 border-t border-white/10 pt-4 text-sm"><span>Data: {formatDate(data.settings.report_date)}</span><span>Kujdestari/ja: {data.class.teacher || '________________'}<br />Nënshkrimi: ____________________</span></footer>
    <p className="text-xs text-surface-400">Të çregjistruarit përjashtohen nga suksesi. Nota të paplotësuara dhe mungesa në shqyrtim shfaqen veçmas. Raporti përditësohet nga evidenca e ruajtur.</p>
  </div>
}

function Reports({ data, term, setTerm, setError }) {
  const [mode, setMode] = useState('overview'); const [exporting, setExporting] = useState(false)
  const reportHtml = renderToStaticMarkup(<ReportContent data={data} mode={mode} term={term} />)
  async function print() {
    try { await printHomeroom(reportHtml) } catch { setError('Printimi dështoi. Provo përsëri.') }
  }
  return <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><select aria-label="Lloji i raportit" className={`${inputClass} sm:w-auto`} value={mode} onChange={e => setMode(e.target.value)}><option value="journal">Ditari i notave</option><option value="overview">Pasqyra për administratë</option><option value="admin">Raporti administrativ · I, II, NP</option><option value="individual">Suksesi individual</option></select><TermSelect value={term} onChange={setTerm} /><Button variant="secondary" onClick={print}><Printer size={16} />Printo / PDF</Button><Button disabled={exporting} variant="secondary" onClick={async () => { setExporting(true); try { await exportHomeroom(data) } catch { setError('Eksporti dështoi. Provo përsëri.') } finally { setExporting(false) } }}><Download size={16} />{exporting ? 'Duke eksportuar…' : 'Eksporto Excel'}</Button></div><Panel title="Pamja e raportit"><div className="overflow-x-auto rounded-lg bg-white"><iframe title="Pamja për printim e raportit" className="h-[850px] w-full border-0" srcDoc={`<!doctype html><html lang="sq"><head><meta charset="utf-8"><style>${reportStyles}body{padding:24px}</style></head><body>${reportHtml}</body></html>`} /></div></Panel></div>
}

function SettingsForm({ data, save, busy }) {
  const [form, setForm] = useState(data.settings)
  return <Panel title="Të dhënat e raportit"><form onSubmit={e => { e.preventDefault(); save('settings', form) }}><fieldset disabled={busy || !data.class.active} className="grid gap-4 sm:grid-cols-2">{[['school_name', 'Emri i shkollës'], ['school_type', 'Lloji i institucionit'], ['report_date', 'Data e raportit'], ['t1_start', 'Fillimi i gjysmëvjetorit I'], ['t1_end', 'Fundi i gjysmëvjetorit I'], ['t2_start', 'Fillimi i gjysmëvjetorit II'], ['t2_end', 'Fundi i gjysmëvjetorit II']].map(([key, label]) => <Field key={key} label={label}><input required type={key === 'school_name' || key === 'school_type' ? 'text' : 'date'} className={inputClass} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></Field>)}<div className="sm:col-span-2"><p className="mb-4 text-xs text-surface-400">Datat përcaktojnë orët dhe mungesat e përfshira. Periudhat duhet të përfshijnë muaj të plotë dhe të vijojnë njëra pas tjetrës. Klasa, kujdestari dhe viti merren nga administrata.</p><Button type="submit">Ruaj të dhënat</Button></div></fieldset></form></Panel>
}

function Workspace({ data, refresh, historical = false }) {
  const [tab, setTab] = useState('register'); const [term, setTerm] = useState('t1'); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  async function save(section, body) { setBusy(true); setError(''); setSuccess(''); try { const result = await api.homeroom.save(data.class.id, section, body); await refresh(); setSuccess(result.message); return true } catch (e) { setError(message(e)); return false } finally { setBusy(false) } }
  const tabs = [['register', 'Regjistri', Users], ['grades', 'Ditari', BookOpen], ['absences', 'Mungesat', CalendarDays], ['hours', 'Orët', Clock], ['statistics', 'Statistikat', BarChart3], ['reports', 'Raportet', FileText], ['settings', 'Të dhënat', Settings], ...(!historical ? [['certificates', 'Dëftesat', FileText], ['history', 'Vitet e mëparshme', CalendarDays]] : [])]
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3">{[['Nxënës në regjistër', data.students.length], ['Lëndë', data.subjects.length], ['Viti shkollor', data.class.year]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-surface-900 p-4"><p className="text-xs text-surface-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}</div>{!data.class.active && <p className="text-sm text-amber-400">Ky vit është i arkivuar. Të dhënat janë vetëm për lexim.</p>}<nav aria-label="Seksionet e kujdestarisë" className="flex flex-wrap gap-2">{tabs.map(([id, label, Icon]) => <Button key={id} variant={tab === id ? 'default' : 'secondary'} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon size={16} />{label}</Button>)}</nav>
    {error && <p role="alert" className="fixed right-4 top-4 z-[60] max-w-lg rounded-lg border border-red-500/30 bg-surface-900 p-4 text-sm text-red-400">{error}</p>}{success && <p role="status" className="text-sm text-brand-400">{success}</p>}
    {tab === 'certificates' && <HomeroomCertificates data={data} onRegister={() => setTab('register')} />}{tab === 'history' && <HomeroomHistory data={data} renderReport={report => <Workspace key={report.class.id} data={report} refresh={async () => {}} historical />} />}{tab === 'register' && <Roster data={data} save={save} busy={busy} />}{tab === 'grades' && <GradeBook data={data} term={term} setTerm={setTerm} />}{tab === 'absences' && <Absences data={data} save={save} busy={busy} />}{tab === 'hours' && <Hours data={data} save={save} busy={busy} />}{tab === 'statistics' && <Statistics data={data} term={term} setTerm={setTerm} />}{tab === 'reports' && <Reports data={data} term={term} setTerm={setTerm} setError={setError} />}{tab === 'settings' && <SettingsForm data={data} save={save} busy={busy} />}
  </div>
}

export function TeacherHomeroomPage() {
  const { user } = useAuth(); const client = useQueryClient(); const [selected, setSelected] = useState('')
  const allowed = ['teacher', 'director', 'secretary'].includes(user?.role)
  const classes = useQuery({ queryKey: ['homeroom-classes', user?.id], queryFn: () => api.homeroom.index().then(r => r.data), enabled: allowed })
  const classId = selected || classes.data?.find(c => c.academic_year?.is_active)?.id || classes.data?.[0]?.id
  const query = useQuery({ queryKey: ['homeroom', user?.id, classId], queryFn: () => api.homeroom.show(classId).then(r => r.data), enabled: allowed && !!classId })
  if (!allowed) return <Navigate to="/dashboard" replace />
  async function refresh() { await client.invalidateQueries({ queryKey: ['homeroom', user?.id, classId] }); await Promise.all(['student', 'student-inbox', 'student-portal', 'class-grades', 'certificates'].map(key => client.invalidateQueries({ queryKey: [key] }))) }
  return <div className="space-y-5"><PageHeader title="Kujdestaria" description="Ditari, evidenca dhe raportet e klasës" />{classes.isPending ? <Empty>Duke ngarkuar klasat…</Empty> : classes.isError ? <LoadError retry={classes.refetch} /> : !classes.data?.length ? <Panel title="Klasa e kujdestarisë"><Empty>Administrata ende nuk të ka caktuar si kujdestar të ndonjë klase.</Empty></Panel> : <>{classes.data.length === 1 ? <h2 className="text-lg font-semibold">Klasa {classes.data[0].name} · {classes.data[0].academic_year?.label}</h2> : <select aria-label="Klasa e kujdestarisë" className={`${inputClass} sm:w-auto`} value={classId} onChange={e => setSelected(e.target.value)}>{classes.data.map(c => <option key={c.id} value={c.id}>{c.name} · {c.academic_year?.label}{c.academic_year?.is_active ? '' : ' · Arkiv'}</option>)}</select>}{query.isPending ? <Empty>Duke përgatitur evidencën…</Empty> : query.isError ? <LoadError retry={query.refetch} /> : <Workspace key={classId} data={query.data} refresh={refresh} />}</>}</div>
}
