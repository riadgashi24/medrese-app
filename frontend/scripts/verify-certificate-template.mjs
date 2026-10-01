import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { jsPDF } from 'jspdf'
import { buildMappedCertificate, validateTemplate } from '../src/pages/teachers/certificateTemplate.js'
const image='data:image/png;base64,'+(await fs.readFile(new URL('../../tmp/pdfs/template-blank.png',import.meta.url))).toString('base64')
const font=(await fs.readFile(new URL('../public/fonts/Vera.ttf',import.meta.url))).toString('base64')
const template={active:true,width_mm:210,height_mm:297,image,fields:[
  {key:'student_name',x:11,y:22,width:70,size:16,align:'left'},
  {key:'word:1',x:40,y:37,width:35,size:12,align:'left'},
  {key:'grade:1',x:83,y:37,width:5,size:12,align:'center'},
  {key:'word:2',x:40,y:44.3,width:35,size:12,align:'left'},
  {key:'grade:2',x:83,y:44.3,width:5,size:12,align:'center'},
]}
validateTemplate(template,[{id:1,name:'Gjuhë amtare'},{id:2,name:'Matematikë'}])
assert.throws(()=>validateTemplate({...template,active:false},[]))
assert.throws(()=>validateTemplate(template,[{id:3,name:'Fizikë'}]),/Fizikë/)
const doc=buildMappedCertificate(jsPDF,template,{student_name:'Nxënës Demonstrim','word:1':'shkëlqyeshëm','grade:1':5,'word:2':'shumë mirë','grade:2':4},{font})
assert.equal(doc.getNumberOfPages(),1)
assert.ok(Math.abs(doc.internal.pageSize.getWidth()-210)<.1)
assert.throws(()=>buildMappedCertificate(jsPDF,{...template,fields:[{key:'student_name',x:0,y:0,width:1,size:12,align:'left'}]},{student_name:'Një emër shumë i gjatë që nuk përshtatet'},{font}),/Zgjero/)
await fs.writeFile(new URL('../../tmp/pdfs/template-filled.pdf',import.meta.url),Buffer.from(doc.output('arraybuffer')))
console.log('Template overlay, Albanian glyphs, subject coverage and overflow verified.')
