import pdf from "pdf-parse"
import { applySegRules, countCharas, countWords, checkValidText } from '../util/util';

export async function pdfReader(pdfBuffer: Buffer, fileName: string, opt: MyOption): Promise<OfficeContent> {
  return new Promise((resolve, reject) => {
    const pdfContents: OfficeContent = {
      name: fileName,
      format: 'pdf',
      exts: [],
    };
    pdf(pdfBuffer).then(data => {
      const texts = data.text.split('\n')
      let position = 0
      texts.forEach(text => {
        if (checkValidText(text)) {
          pdfContents.exts.push({
            type: 'PDF-Paragraph',
            position: position++,
            isActive: true,
            value: applySegRules([text], opt),
            sumCharas: countCharas(text),
            sumWords: countWords(text),
          })
        }
      })
      resolve(pdfContents)
    }).catch(err => {
      reject(err)
    })
  })
}