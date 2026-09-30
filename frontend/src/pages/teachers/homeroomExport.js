import { formatDate } from '../../lib/date.js'
const terms = { t1: 'Gjysmëvjetori I', t2: 'Gjysmëvjetori II', np: 'Nota përfundimtare' }
const categories = { registered: 'Të regjistruar', withdrawn: 'Të çregjistruar', active: 'Vijojnë', graded: 'Me nota të plota', ungraded: 'Me nota të paplotësuara', excellent: 'Shkëlqyeshëm', very_good: 'Shumë mirë', good: 'Mirë', sufficient: 'Mjaftueshëm', positive: 'Pozitiv', one_failure: 'Me një të dobët', two_failures: 'Me dy të dobëta', three_failures: 'Me tri ose më shumë të dobëta', negative: 'Negativ', repeating: 'Përsëritës', no_absences: 'Pa mungesa' }
const genders = value => value === 'Male' ? 'M' : value === 'Female' ? 'F' : 'Pa shënuar'

export function buildHomeroomWorkbook(data, XLSX) {
  const book = XLSX.utils.book_new()
  const meta = [[data.settings.school_name, data.settings.school_type], ['Klasa', data.class.name, 'Viti', data.class.year], ['Kujdestari', data.class.teacher || '', 'Data', formatDate(data.settings.report_date)]]
  function sheet(name, rows) {
    const ws = XLSX.utils.aoa_to_sheet([...meta, [], ...rows])
    const width = Math.max(...rows.map(r => r.length), 4)
    ws['!cols'] = Array.from({ length: width }, (_, i) => ({ wch: i === 0 ? 32 : 18 }))
    XLSX.utils.book_append_sheet(book, ws, name)
  }
  const registerRows = t => data.periods[t].rows.map(r => [r.name, genders(r.gender), r.status, ...data.subjects.map(s => r.grades[s.id]), r.average, r.failures, r.success, r.missing, r.attendance.excused, r.attendance.unexcused, r.attendance.pending, r.attendance.late])
  const registerHeader = ['Nxënësi', 'Gjinia', 'Statusi', ...data.subjects.map(s => s.name), 'Mesatarja', 'Të dobëta', 'Suksesi', 'Nota që mungojnë', 'Me arsye', 'Pa arsye', 'Në shqyrtim', 'Vonesa']
  const summaryRows = t => [['Suksesi / statusi', 'M', 'F', 'Pa gjini', 'Gjithsej', '% e vijuesve'], ...Object.entries(categories).map(([key, label]) => { const b = data.periods[t].summary[key]; return [label, b.male, b.female, b.unknown, b.total, ['registered', 'withdrawn'].includes(key) ? null : b.percent] }), ['Mesatarja e klasës', data.periods[t].average]]
  const statsRows = t => [['Lënda', 'Vlerësimi', 'M', 'F', 'Pa gjini', 'Gjithsej', '% e vijuesve', 'Mesatarja e lëndës'], ...data.periods[t].subjects.flatMap(s => [5, 4, 3, 2, 'positive', 1, 'ungraded'].map(mark => { const b = s.distribution[mark]; return [s.name, mark === 'positive' ? 'Pozitiv' : mark === 'ungraded' ? 'Pa notë' : mark, b.male, b.female, b.unknown, b.total, b.percent, s.average] }))]
  sheet('Emrat', [['Nxënësi', 'ID', 'Gjinia', 'Datëlindja', 'Vendi i lindjes', 'Shteti', 'Komuna', 'Adresa', 'Prindi', 'Profesioni', 'Telefoni', 'Telefon shtesë', 'Email i prindit', 'Email i nxënësit', 'Statusi I', 'Statusi II', 'Statusi NP', 'Shënime'], ...data.students.map(s => [s.name, s.student_id, genders(s.gender), formatDate(s.date_of_birth), s.profile.birth_place, s.profile.birth_country, s.municipality, s.address, s.parent_name, s.profile.parent_occupation, s.parent_phone, s.parent_phone_secondary, s.profile.parent_email, s.student_email, ...Object.keys(terms).map(t => s.profile[t + '_status'] || s.default_status), s.profile.notes])])
  sheet('Ditari', [['Periudha', ...registerHeader], ...Object.entries(terms).flatMap(([t, label]) => registerRows(t).map(row => [label, ...row]))])
  for (const [t, name, stats] of [['t1', 'Perioda 1', 'Statistika 1'], ['t2', 'Perioda 2', 'Statistika 2'], ['np', 'Nota Përfundimtare', 'Statistika Përfundimtare']]) {
    sheet(name, [registerHeader, ...registerRows(t)])
    sheet(stats, statsRows(t))
  }
  sheet('Raporti', Object.entries(terms).flatMap(([t, label]) => [[label], ...summaryRows(t), [], ['Suksesi individual', 'Mesatarja', 'Suksesi', 'Statusi'], ...data.periods[t].rows.map(r => [r.name, r.average, r.success, r.status]), []]))
  sheet('Raporti administrativ', Object.entries(terms).flatMap(([t, label]) => [[label], ...summaryRows(t), [], ...statsRows(t), [], ['Mungesat', 'M', 'F', 'Pa gjini', 'Gjithsej'], ...Object.entries({ excused: 'Me arsye', unexcused: 'Pa arsye', pending: 'Në shqyrtim', late: 'Vonesa' }).map(([k, l]) => { const a = data.periods[t].attendance[k]; return [l, a.male, a.female, a.unknown, a.total] }), ['Orët', 'Planifikuara', 'Mbajtura', 'Pambajtura'], ['Gjithsej', ...['planned', 'held', 'missed'].map(k => data.hours.reduce((sum, s) => sum + s[t][k], 0))], []]))
  for (const [i, t] of Object.keys(terms).entries()) sheet(`Pasqyra ${['I', 'II', 'III'][i]}`, [[terms[t]], ...summaryRows(t), [], ...statsRows(t)])
  sheet('Planifikimi i orëve', [['Lënda', 'Fusha', ...Object.values(terms).flatMap(t => [t + ' · Planifikuara', t + ' · Mbajtura', t + ' · Pambajtura'])], ...data.hours.map(s => [s.name, s.category, ...Object.keys(terms).flatMap(t => [s[t].planned, s[t].held, s[t].missed])]), ['Gjithsej', '', ...Object.keys(terms).flatMap(t => ['planned', 'held', 'missed'].map(k => data.hours.reduce((sum, s) => sum + s[t][k], 0))) ]])
  sheet('Mungesat', [['Nxënësi', ...data.months.flatMap(m => [m + ' · Ar', m + ' · Pa', m + ' · Në shqyrtim']), ...Object.values(terms).flatMap(t => [t + ' · Ar', t + ' · Pa', t + ' · Në shqyrtim'])], ...data.students.map(s => [s.name, ...data.months.flatMap(m => [s.attendance[m].excused, s.attendance[m].unexcused, s.attendance[m].pending]), ...Object.keys(terms).flatMap(t => { const a = data.periods[t].rows.find(r => r.id === s.id).attendance; return [a.excused, a.unexcused, a.pending] })])])
  sheet('Shpjegime', [
    ['Eksport nga Kujdestaria', 'Ky skedar përmban vlerat në momentin e eksportit. Ndryshimet në aplikacion kërkojnë eksport të ri.'],
    ['Notat', 'Notat e gjysmëvjetorëve ruhen në ditar. NP rrumbullakohet nga gjysmëvjetorët; mbishkrimet ekzistuese ruhen.'],
    ['Suksesi', 'Pa të gjitha notat, suksesi mbetet i paplotësuar. Një notë 1 e bën suksesin dhe mesataren e suksesit 1, sipas modelit të Excel-it.'],
    ['Mesatarja e lëndës', 'Mesatarja e notave të vendosura; mungesa e notës nuk llogaritet si zero.'],
    ['Mesatarja e klasës', 'Mesatarja e suksesit të nxënësve me nota të plota.'],
    ['Përqindjet', 'Emëruesi është numri i nxënësve vijues. Përsëritësit nuk shtohen përsëri në total.'],
    ['Mungesat', 'Totali mujor i konfirmuar zëvendëson atë automatik; mungesat e pashqyrtuara mbeten veçmas.'],
    ['Periudha I', formatDate(data.settings.t1_start), formatDate(data.settings.t1_end)], ['Periudha II', formatDate(data.settings.t2_start), formatDate(data.settings.t2_end)],
  ])
  return book
}

export async function exportHomeroom(data) {
  const [XLSX, { default: ExcelJS }, { default: logo }, { styleHomeroomWorkbook }] = await Promise.all([import('xlsx'), import('exceljs'), import('@/assets/logo.png'), import('./homeroomWorkbookStyle')])
  const response = await fetch(logo)
  if (!response.ok) throw new Error('Logo nuk u ngarkua')
  const blob = await response.blob()
  const logoBase64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob) })
  const book = styleHomeroomWorkbook(buildHomeroomWorkbook(data, XLSX), data, XLSX, ExcelJS, logoBase64)
  const url = URL.createObjectURL(new Blob([await book.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a'); link.href = url
  link.download = `Kujdestaria-${data.class.name.replace(/[^a-z0-9-]/gi, '-')}-${data.class.year.replace(/[^a-z0-9-]/gi, '-')}.xlsx`
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000)
}
