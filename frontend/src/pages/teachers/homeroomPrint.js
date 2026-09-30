export const reportStyles = `
@page{size:A4 landscape;margin:12mm}
*{box-sizing:border-box}body{margin:0;font:11px/1.45 Arial,sans-serif;color:#173b35;background:white}
.report-brand{display:flex;align-items:center;gap:18px;border-bottom:3px solid #176b57;padding-bottom:12px;margin-bottom:16px}
.report-brand img{width:85px;height:85px;object-fit:contain}.report-brand h2{font-size:23px;margin:2px 0}.report-brand p{margin:2px 0}
h3{font-size:16px;margin:16px 0 8px}h4{font-size:12px;margin:12px 0 6px}p{margin:5px 0}
table{width:100%;min-width:0!important;border-collapse:collapse;margin:10px 0;font-size:10px;table-layout:auto}
th,td{border:1px solid #c6d8d1;padding:5px 7px!important;position:static!important;background:white;color:#173b35;vertical-align:middle!important}
thead th{background:#176b57!important;color:white!important;font-weight:bold}tbody tr:nth-child(even) td{background:#f1f6f3}
td:not(:first-child),th:not(:first-child){text-align:center}thead{display:table-header-group}tr{break-inside:avoid}
.overflow-x-auto{overflow:visible}.report-section{break-before:page}.report-section:first-of-type{break-before:auto}
footer{margin-top:22px;border-top:2px solid #b69c60;padding-top:12px;display:flex;justify-content:space-between;break-inside:avoid}
.grade-ledger{table-layout:fixed}.grade-ledger th,.grade-ledger td{padding:4px!important;text-align:center;font-size:10px}
.grade-ledger .student-name{width:170px;text-align:left}.grade-ledger .subject-name{height:135px;width:29px;vertical-align:bottom!important}
.subject-name span{writing-mode:vertical-rl;transform:rotate(180deg);display:inline-block;white-space:nowrap}
.grade-ledger .summary-col{width:48px}.grade-ledger .number-col{width:26px}
.report-note{font-size:9px;color:#5c736c;margin-top:12px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}h3,h4{break-after:avoid}}
`

export async function printHomeroom(html) {
  const frame = document.createElement('iframe')
  frame.title = 'Printimi i raportit'
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1120px;height:800px;border:0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  doc.open()
  doc.write(`<!doctype html><html lang="sq"><head><meta charset="utf-8"><title>Raporti i kujdestarisë</title><style>${reportStyles}</style></head><body>${html}</body></html>`)
  doc.close()
  try {
    await Promise.all(Array.from(doc.images).map(img => img.decode()))
    await doc.fonts.ready
    frame.contentWindow.addEventListener('afterprint', () => frame.remove(), { once: true })
    frame.contentWindow.focus()
    frame.contentWindow.print()
  } catch (error) { frame.remove(); throw error }
}
