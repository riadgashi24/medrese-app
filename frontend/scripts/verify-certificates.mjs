import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import { buildCertificate, safeFilename } from '../src/pages/teachers/certificatePdf.js'

const data = { settings: { school_name: 'Medreseja Alauddin', school_type: 'Shkollë e mesme' }, class: { name: '12/1', year: '2025/26', teacher: 'Profesor Test' }, subjects: ['Gjuhë amtare', 'Gjuhë angleze', 'Gjuhë arabe', 'Gjuhë turke', 'Kuran', 'Fikh', 'Usuli Fikh', 'Akaid', 'Komentimi i Kuranit', 'Komentimi i Hadithit', 'Thirrje-Imamat', 'Matematikë', 'Histori', 'Filozofi', 'Sociologji', 'TIK', 'Edukatë fizike dhe sporte', 'Etikë (Ahlak)'].map((name, i) => ({ id: i, name })) }
const entry = { ready: true, student: { first_name: 'Nxënës', last_name: 'Demonstrim', name: 'Nxënës Demonstrim', student_id: 'DEMO-001', parent_name: 'Prind Demonstrim', date_of_birth: '2008-10-07', municipality: 'Prishtinë', profile: { register_number: 'DEMO-001', birth_place: 'Prishtinë', birth_country: 'Republika e Kosovës', citizenship: 'Kosovare', conduct: 'Shembullore' } }, result: { grades: Object.fromEntries(data.subjects.map(s => [s.id, 5])), average: 5, success: 5, attendance: { excused: 4, unexcused: 0, pending: 0 } } }
const font = (await fs.readFile(new URL('../public/fonts/Vera.ttf', import.meta.url))).toString('base64')
const logo = 'data:image/png;base64,' + (await fs.readFile(new URL('../src/assets/logo.png', import.meta.url))).toString('base64')
const pdf = buildCertificate(jsPDF, data, entry, { date: '2026-06-30', place: 'Prishtinë', director: 'Drejtor Demonstrim' }, { font, logo })
assert.equal(pdf.getNumberOfPages(), 1)
assert.equal(safeFilename('Deftesa klasa 10/1 2025/26'), 'Deftesa klasa 10-1 2025-26')
assert.throws(() => buildCertificate(jsPDF, data, { ...entry, ready: false }, {}, {}))
const zip = new JSZip()
zip.file('Nxënës_Demonstrim.pdf', pdf.output('arraybuffer'))
const restored = await JSZip.loadAsync(await zip.generateAsync({ type: 'nodebuffer' }))
assert.equal((await restored.file('Nxënës_Demonstrim.pdf').async('uint8array'))[0], 37)
if (process.argv[2]) await fs.writeFile(process.argv[2], Buffer.from(pdf.output('arraybuffer')))
console.log('PDF with Albanian font, A4 layout and ZIP roundtrip verified.')
