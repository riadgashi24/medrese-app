import { buildMappedCertificate, certificateValues, validateTemplate } from './certificateTemplate.js'
import { formatDate } from '../../lib/date.js'

export const safeFilename = text => String(text).normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').trim() || 'deftese'
const marks = { 1: 'pamjaftueshëm', 2: 'mjaftueshëm', 3: 'mirë', 4: 'shumë mirë', 5: 'shkëlqyeshëm' }

export function buildCertificate(jsPDF, data, entry, details, assets) {
  if (!entry.ready) throw new Error('Dëftesa ka të dhëna të paplotësuara.')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.addFileToVFS('Vera.ttf', assets.font)
  doc.addFont('Vera.ttf', 'Vera', 'normal'); doc.setFont('Vera')
  const student = entry.student, result = entry.result
  const width = 180
  function line(text, x, y, size = 10, max = width) {
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(String(text), max)
    doc.text(lines, x, y)
    return y + lines.length * size * .42
  }
  function frame(continued = false) {
    doc.setDrawColor(23, 107, 87); doc.setLineWidth(.5); doc.rect(9, 9, 192, 279)
    doc.setDrawColor(182, 156, 96); doc.setLineWidth(.2); doc.rect(11, 11, 188, 275)
    doc.addImage(assets.logo, 'PNG', 91, 15, 28, 28)
    doc.setTextColor(23, 80, 66)
    doc.setFontSize(15); doc.text(data.settings.school_name, 105, 50, { align: 'center', maxWidth: 175 })
    doc.setFontSize(9); doc.text(data.settings.school_type, 105, 57, { align: 'center' })
    doc.setFontSize(22); doc.text(continued ? 'DËFTESË - vazhdim' : 'DËFTESË', 105, 70, { align: 'center' })
    doc.setTextColor(30, 45, 40)
  }
  frame()
  let y = line(student.name, 18, 82, 14)
  y = line(`Emri i prindit: ${student.parent_name}     Nr. në amzë: ${student.profile.register_number}`, 18, y + 3, 9)
  y = line(`I/e lindur më ${formatDate(student.date_of_birth)} në ${student.profile.birth_place}, komuna ${student.municipality}.`, 18, y + 3, 9)
  y = line(`Shteti: ${student.profile.birth_country}     Shtetësia: ${student.profile.citizenship}`, 18, y + 3, 9)
  y = line(`Viti shkollor ${data.class.year}     Klasa ${data.class.name}`, 18, y + 4, 11)
  y = line('Vlerësimi përfundimtar sipas lëndëve', 18, y + 4, 10) + 4
  const start = y
  const subjects = data.subjects
  const half = Math.ceil(subjects.length / 2)
  const ends = [start, start]
  subjects.forEach((subject, i) => {
    const column = i < half ? 0 : 1, x = column ? 109 : 18
    let pos = ends[column]
    const mark = result.grades[subject.id]
    const nameLines = doc.splitTextToSize(subject.name, 78)
    const height = Math.max(10, nameLines.length * 4 + 6)
    // Keep an individual subject intact; exceptionally long curricula continue on a new page.
    if (pos + height > 236) {
      doc.addPage(); frame(true); pos = 82; ends[0] = ends[1] = 82
      line(student.name, 18, 78, 10)
    }
    doc.setFillColor(i % 2 ? 242 : 250, i % 2 ? 247 : 252, i % 2 ? 244 : 251)
    doc.rect(x - 1, pos - 3, 84, height, 'F')
    line(subject.name, x, pos + 1, 9, 78)
    line(`${marks[mark]} (${mark})`, x, pos + height - 5, 9, 78)
    ends[column] = pos + height
  })
  y = Math.max(...ends) + 7
  if (y > 238) { doc.addPage(); frame(true); y = 84 }
  y = line(`Suksesi i përgjithshëm: ${marks[result.success]} (${result.success})     Mesatarja: ${result.average}`, 18, y, 10)
  y = line(`Sjellja: ${student.profile.conduct}`, 18, y + 3, 10)
  y = line(`Mungesa: ${result.attendance.excused} me arsye; ${result.attendance.unexcused} pa arsye.`, 18, y + 3, 9)
  if (result.attendance.pending) y = line(`Në shqyrtim: ${result.attendance.pending} mungesa.`, 18, y + 2, 8)
  let foot = Math.max(y + 10, 254)
  if (foot + 25 > 281) { doc.addPage(); frame(true); line(student.name, 18, 82, 12); foot = 245 }
  line(`${details.place}, ${formatDate(details.date)}`, 18, foot, 9)
  line(`Kujdestari/ja: ${data.class.teacher || '________________'}`, 18, foot + 8, 8, 83)
  line(`Drejtori/ja: ${details.director}`, 109, foot + 8, 8, 83)
  line('________________________', 18, foot + 22, 9)
  line('________________________', 109, foot + 22, 9)
  doc.setFontSize(8); doc.text('Vula', 105, foot + 22, { align: 'center' })
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page); doc.setFontSize(7); doc.text(`${student.student_id} · ${data.class.year} · ${page}/${doc.getNumberOfPages()}`, 105, 284, { align: 'center' })
  }
  return doc
}

export async function loadAssets() {
  const { default: logoUrl } = await import('@/assets/logo.png')
  const toBase64 = async url => {
    const response = await fetch(url); if (!response.ok) throw new Error('Skedari i dëftesës nuk u ngarkua.')
    const blob = await response.blob()
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob) })
  }
  const [font, logo] = await Promise.all([toBase64(`${import.meta.env.BASE_URL}fonts/Vera.ttf`), toBase64(logoUrl)])
  return { font, logo: `data:image/png;base64,${logo}` }
}

export async function downloadCertificates(data, details, studentId = null) {
  const entries = studentId == null ? data.certificates : data.certificates.filter(e => e.student.id === studentId)
  if (!entries.length || entries.some(e => !e.ready)) throw new Error('Plotëso notat dhe të dhënat e dëftesave para shkarkimit.')
  const [{ jsPDF }, assets] = await Promise.all([import('jspdf'), loadAssets()])
  const { api } = await import('../../lib/api.js')
  const level = Number(data.class.name.split('/')[0])
  const template = (await api.certificateTemplates.show(level)).data
  if (template) validateTemplate(template, data.subjects)
  const build = entry => template ? buildMappedCertificate(jsPDF, template, certificateValues(data, entry, details), assets) : buildCertificate(jsPDF, data, entry, details, assets)
  const filename = e => safeFilename(`${e.student.first_name}_${e.student.last_name}`)
  if (studentId != null) { build(entries[0]).save(filename(entries[0]) + '.pdf'); return }
  const { default: JSZip } = await import('jszip'); const zip = new JSZip(); const used = new Set()
  for (const e of entries) {
    let name = filename(e)
    let suffix = 0
    while (used.has(name.toLowerCase())) name = `${filename(e)}_${e.student.id}${suffix++ ? '_' + suffix : ''}`
    used.add(name.toLowerCase())
    zip.file(name + '.pdf', build(e).output('arraybuffer'))
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = safeFilename(`Deftesa klasa ${data.class.name} ${data.class.year}`) + '.zip'
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000)
}
