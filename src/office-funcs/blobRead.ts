import { docxReader } from './office/docxReader';
import { xlsxReader } from './office/xlsxReader';
import { pptxReader } from './office/pptxReader';
import { ReadingOption } from './option';

export function blobContentsReader(files: any, order: number[], opq?: OptionQue): Promise<ExtractedContent[]> {
  const que = opq !== undefined ? opq : {};
  const opt = new ReadingOption(que);
  return new Promise((resolve, reject) => {
    const prs: Array<Promise<any>> = [];
    for (const ox of order) {
      const fileName = files[ox].name;
      if (fileName.endsWith('.docx') || fileName.endsWith('.docm')) {
        prs.push(docxReader(files[ox], fileName, opt));
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xlsm')) {
        prs.push(xlsxReader(files[ox], fileName, opt));
      } else if (fileName.endsWith('.pptx') || fileName.endsWith('.pptm')) {
        // スライドもノートも読み込まない設定の場合はスキップ
        if (opt.ppt.readSlide || opt.ppt.readNote) {
          prs.push(pptxReader(files[ox], fileName, opt));
        }
      }
    }
    Promise.all(prs).then((res) => {
      resolve(res);
    }).catch((failure: ReadFailure) => {
      reject(failure);
    });
  });
}