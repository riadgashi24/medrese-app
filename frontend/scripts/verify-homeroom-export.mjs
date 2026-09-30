import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { buildHomeroomWorkbook } from '../src/pages/teachers/homeroomExport.js'
import { styleHomeroomWorkbook } from '../src/pages/teachers/homeroomWorkbookStyle.js'

const bucket = { male: 20, female: 20, unknown: 0, total: 40, percent: 100 }
const keys = ['registered','withdrawn','active','graded','ungraded','excellent','very_good','good','sufficient','positive','one_failure','two_failures','three_failures','negative','repeating','no_absences']
const attendance = { excused: 0, unexcused: 0, pending: 0, late: 0 }
const subjects = Array.from({ length: 18 }, (_, i) => ({ id: i + 1, name: `Lënda ${i + 1}`, category: 'Shkenca' }))
const students = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, student_id: `TEST-${i}`, name: `Nxënësi ${i + 1} Test`, gender: 'Male', profile: {}, default_status: 'active', attendance: { '2026-09': attendance } }))
const periods = Object.fromEntries(['t1','t2','np'].map(t => [t, { rows: students.map(s => ({ ...s, status: 'active', grades: Object.fromEntries(subjects.map(x => [x.id, 5])), average: 5, failures: 0, success: 5, missing: 0, attendance })), summary: Object.fromEntries(keys.map(k => [k, bucket])), subjects: subjects.map(s => ({ ...s, average: 5, distribution: Object.fromEntries([5,4,3,2,'positive',1,'ungraded'].map(k => [k, bucket])) })), attendance: Object.fromEntries(Object.keys(attendance).map(k => [k, bucket])), average: 5 }]))
const data = { settings: { school_name: 'Medreseja Alauddin', school_type: 'Shkollë e mesme', report_date: '2026-09-30' }, class: { name: '12/1', year: '2026-2027', teacher: 'Profesor Test' }, subjects, students, periods, months: ['2026-09'], hours: subjects.map(s => ({ ...s, ...Object.fromEntries(['t1','t2','np'].map(t => [t, { planned: 10, held: 9, missed: 1 }])) })) }
const source = buildHomeroomWorkbook(data, XLSX)
const logo = await fs.readFile(new URL('../src/assets/logo.png', import.meta.url))
const book = styleHomeroomWorkbook(source, data, XLSX, ExcelJS, `data:image/png;base64,${logo.toString('base64')}`)
const restored = new ExcelJS.Workbook()
await restored.xlsx.load(await book.xlsx.writeBuffer())
assert.equal(restored.worksheets.length, 16)
for (const sheet of restored.worksheets) {
  assert.equal(sheet.getImages().length, 1)
  assert.equal(sheet.views[0].state, 'frozen')
  assert.equal(sheet.pageSetup.fitToWidth, 1)
}
const marks = restored.getWorksheet('Perioda 1')
assert.equal(marks.getCell('D8').value, 5)
assert.equal(marks.getCell('D47').value, 5)
assert.equal(marks.getCell('D7').alignment.textRotation, 90)
assert.equal(marks.getColumn(4).width, 4.5)
assert.equal(marks.getCell('A1').value, null)
console.log('Verified 16 sheets, embedded logos, print setup, frozen headers and 40 student rows.')
