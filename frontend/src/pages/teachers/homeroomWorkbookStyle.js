import { formatDate } from '../../lib/date.js'
const green = '176B57', gold = 'B69C60', ink = '173B35'
const fill = argb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const border = { style: 'thin', color: { argb: 'D3E0DA' } }

// Keep the report's existing values and sixteen sheets; presentation is applied separately.
export function styleHomeroomWorkbook(source, data, XLSX, ExcelJS, logoBase64) {
  const book = new ExcelJS.Workbook()
  book.creator = data.settings.school_name
  book.title = `Kujdestaria ${data.class.name} ${data.class.year}`
  const image = logoBase64 ? book.addImage({ base64: logoBase64, extension: 'png' }) : null
  const headings = new Set(['Nxënësi', 'Periudha', 'Lënda', 'Suksesi / statusi', 'Suksesi individual', 'Mungesat', 'Orët', 'Eksport nga Kujdestaria'])
  source.SheetNames.forEach(name => {
    const rows = XLSX.utils.sheet_to_json(source.Sheets[name], { header: 1, defval: null }).slice(4)
    const width = Math.max(4, ...rows.map(r => r.length))
    const sheet = book.addWorksheet(name, { properties: { tabColor: { argb: green } }, views: [{ state: 'frozen', xSplit: name === 'Ditari' ? 2 : 1, ySplit: 7, showGridLines: false }] })
    sheet.pageSetup = { paperSize: width > 20 ? 8 : 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: .3, right: .3, top: .35, bottom: .4, header: .15, footer: .15 }, printTitlesRow: '1:7' }
    sheet.headerFooter.oddFooter = '&L'+data.class.name+' · '+data.class.year+'&RFaqja &P / &N'
    for (let c = 1; c <= width; c++) sheet.getColumn(c).width = c === 1 ? 30 : 13
    sheet.mergeCells(1, 1, 3, 1)
    if (image != null) sheet.addImage(image, { tl: { col: .15, row: .1 }, ext: { width: 80, height: 80 } })
    ;[data.settings.school_name, data.settings.school_type, name.toLocaleUpperCase('sq-AL')].forEach((text, i) => {
      sheet.mergeCells(i + 1, 2, i + 1, width)
      const cell = sheet.getCell(i + 1, 2); cell.value = text
      cell.font = { name: 'Calibri', size: i === 0 ? 20 : i === 2 ? 14 : 11, bold: i !== 1, color: { argb: green } }
      cell.alignment = { vertical: 'middle' }; sheet.getRow(i + 1).height = 24
    })
    sheet.mergeCells(4, 1, 4, width); sheet.getCell(4, 1).value = `Klasa ${data.class.name}     Viti shkollor ${data.class.year}`
    sheet.mergeCells(5, 1, 5, width); sheet.getCell(5, 1).value = `Kujdestari: ${data.class.teacher || '—'}     Data: ${formatDate(data.settings.report_date)}`
    for (const n of [4, 5]) { sheet.getRow(n).height = 22; sheet.getCell(n, 1).font = { name: 'Calibri', size: 11, color: { argb: ink } }; sheet.getCell(n, 1).fill = fill('EEF5F1') }
    sheet.getRow(6).height = 8
    let headers = []
    rows.forEach((values, index) => {
      const row = sheet.getRow(index + 7)
      row.values = values
      const heading = headings.has(values[0]) || index === 0
      const section = values.filter(v => v !== null && v !== '').length === 1 && typeof values[0] === 'string'
      if (heading) headers = values
      row.height = heading ? 42 : 22
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.font = { name: 'Calibri', size: 11, bold: heading || section || values[0] === 'Gjithsej', color: { argb: heading ? 'FFFFFF' : ink } }
        cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'center' : 'left', wrapText: true }
        cell.fill = fill(heading ? green : section ? 'E2EDE6' : index % 2 ? 'F3F7F4' : 'FFFFFF')
        cell.border = { bottom: border, left: border, right: border, top: border }
        if (typeof cell.value === 'number') cell.numFmt = String(headers[col - 1]).includes('%') ? '0.0"%"' : String(headers[col - 1]).includes('Mesatar') ? '0.00' : '0'
      })
      if (section && width > 1) sheet.mergeCells(row.number, 1, row.number, width)
      if (['Perioda 1', 'Perioda 2', 'Nota Përfundimtare', 'Ditari'].includes(name)) {
        const offset = name === 'Ditari' ? 5 : 4
        for (let c = offset; c < offset + data.subjects.length; c++) {
          sheet.getColumn(c).width = 4.5
          const cell = row.getCell(c)
          cell.alignment = { horizontal: 'center', vertical: 'middle', ...(heading ? { textRotation: 90 } : {}) }
        }
        if (heading) row.height = 140
        if (name === 'Ditari') sheet.getColumn(2).width = 30
      }
      if (name === 'Shpjegime') { sheet.getColumn(2).width = 100; row.height = 48 }
      if (name === 'Emrat') row.height = heading ? 42 : 38
    })
    const end = sheet.rowCount + 2
    sheet.mergeCells(end, 1, end, width)
    const signature = sheet.getCell(end, 1)
    signature.value = `Kujdestari/ja: ${data.class.teacher || '________________'}                         Nënshkrimi: ____________________`
    signature.font = { name: 'Calibri', size: 11, color: { argb: ink } }
    signature.border = { top: { style: 'medium', color: { argb: gold } } }
    sheet.getRow(end).height = 30
  })
  return book
}
