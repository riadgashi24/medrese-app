import { formatDate } from '../../lib/date.js'
export const templateLabels = { student_name: 'Emri dhe mbiemri', first_name: 'Emri', last_name: 'Mbiemri', parent_name: 'Emri i prindit', birth_date: 'Datëlindja', birth_place: 'Vendi i lindjes', municipality: 'Komuna', birth_country: 'Shteti i lindjes', citizenship: 'Shtetësia', register_number: 'Numri në amzë', school_year: 'Viti shkollor', class_name: 'Klasa', conduct: 'Sjellja', average: 'Mesatarja', success: 'Suksesi i përgjithshëm', excused: 'Mungesa me arsye', unexcused: 'Mungesa pa arsye', issue_date: 'Data e lëshimit', issue_place: 'Vendi i lëshimit', director: 'Drejtori/ja', teacher: 'Kujdestari/ja' }
const words = { 1: 'pamjaftueshëm', 2: 'mjaftueshëm', 3: 'mirë', 4: 'shumë mirë', 5: 'shkëlqyeshëm' }
export function certificateValues(data, entry, details) {
  const s = entry.student, p = s.profile, r = entry.result
  const values = { student_name: s.name, first_name: s.first_name, last_name: s.last_name, parent_name: s.parent_name, birth_date: formatDate(s.date_of_birth), birth_place: p.birth_place, municipality: s.municipality, birth_country: p.birth_country, citizenship: p.citizenship, register_number: p.register_number, school_year: data.class.year, class_name: data.class.name, conduct: p.conduct, average: r.average, success: `${words[r.success]} (${r.success})`, excused: r.attendance.excused, unexcused: r.attendance.unexcused, issue_date: formatDate(details.date), issue_place: details.place, director: details.director, teacher: data.class.teacher }
  for (const subject of data.subjects) { values[`grade:${subject.id}`] = r.grades[subject.id]; values[`word:${subject.id}`] = words[r.grades[subject.id]] }
  return values
}
export function validateTemplate(template, subjects) {
  if (!template.active) throw new Error('Drejtori duhet ta aktivizojë shabllonin e ngarkuar para gjenerimit.')
  const keys = new Set(template.fields.map(f => f.key))
  const missing = subjects.filter(s => !keys.has(`grade:${s.id}`) && !keys.has(`word:${s.id}`))
  if (missing.length) throw new Error('Shabllonit i mungon vendi për notat: ' + missing.map(s => s.name).join(', '))
}
export function buildMappedCertificate(jsPDF, template, values, assets) {
  const width = Number(template.width_mm), height = Number(template.height_mm)
  const doc = new jsPDF({ unit: 'mm', format: [width, height], orientation: width > height ? 'landscape' : 'portrait' })
  doc.addFileToVFS('Vera.ttf', assets.font); doc.addFont('Vera.ttf', 'Vera', 'normal'); doc.setFont('Vera')
  doc.addImage(template.image, 'PNG', 0, 0, width, height)
  doc.setTextColor(20, 20, 20)
  for (const field of template.fields) {
    const text = String(values[field.key] ?? '')
    if (!text) continue
    const box = field.width / 100 * width
    let size = Number(field.size); doc.setFontSize(size)
    if (doc.getTextWidth(text) > box) { size = Math.max(6, size * box / doc.getTextWidth(text)); doc.setFontSize(size) }
    if (doc.getTextWidth(text) > box + .2) throw new Error(`Zgjero fushën ${templateLabels[field.key] || field.key}: teksti nuk përshtatet.`)
    const x = field.x / 100 * width + (field.align === 'center' ? box / 2 : field.align === 'right' ? box : 0)
    const y = field.y / 100 * height
    if (y + size * .353 > height) throw new Error('Një fushë del jashtë faqes së shabllonit.')
    doc.text(text, x, y, { align: field.align, baseline: 'top' })
  }
  return doc
}
export async function templateImage(file) {
  if (file.size > 12 * 1024 * 1024) throw new Error('Madhësia maksimale është 12 MB.')
  let canvas = document.createElement('canvas'), width, height
  if (file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false })
    const pdf = await loadingTask.promise
    try {
      if (pdf.numPages !== 1) throw new Error('Ngarko shabllon me një faqe për dëftesën.')
      const page = await pdf.getPage(1), original = page.getViewport({ scale: 1 })
      width = original.width * 25.4 / 72; height = original.height * 25.4 / 72
      const viewport = page.getViewport({ scale: Math.min(3, 3500 / Math.max(original.width, original.height)) })
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
      await page.render({ canvasContext: canvas.getContext('2d'), viewport, background: 'white' }).promise
    } finally { await loadingTask.destroy() }
  } else {
    if (!['image/png','image/jpeg'].includes(file.type)) throw new Error('Zgjidh PDF, PNG ose JPG.')
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 3500 / Math.max(bitmap.width, bitmap.height))
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d'); context.fillStyle = 'white'; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close()
    width = canvas.width > canvas.height ? 297 : 210; height = width * canvas.height / canvas.width
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob || blob.size > 8 * 1024 * 1024) throw new Error('Shablloni është shumë i madh. Përdor një version me rezolucion më të ulët.')
  return { blob, width: width.toFixed(2), height: height.toFixed(2) }
}
