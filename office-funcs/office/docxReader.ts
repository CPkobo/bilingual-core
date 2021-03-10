const JSZip = require('jszip');

import { ReadingOption } from '../option';
import { applySegRules, countCharas, countWords } from '../util';

// Wordファイルの読み込みに使用
export async function docxReader(docxFile: any, fileName: string, opt: ReadingOption): Promise<ExtractedContent> {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    const wordContents: ExtractedContent = {
      name: fileName,
      format: 'docx',
      exts: [],
    };
    zip.loadAsync(docxFile).then((inzip: any) => {
      if (inzip !== null) {
        inzip.file('word/document.xml').async('string').then((wordxml: string) => {
          const dom: any = require('xmldom').DOMParser;
          const doc: any = new dom().parseFromString(wordxml);
          const bodyNd: any = doc.lastChild.firstChild;
          // const bodyCds: any = bodyNd.childNodes !== undefined ? bodyNd.childNodes : [];
          const bodyCds: any = bodyNd.childNodes || [];
          const bodyCdsLen: number = bodyCds.length;
          for (let i = 0; i < bodyCdsLen; i++) {
            switch (bodyCds[String(i)].nodeName) {
              case 'w:p': {
                let paraTexts: string[] = [wordParaReder(bodyCds[String(i)], opt.word.afterRev || true)];
                paraTexts = applySegRules(paraTexts, opt);
                if (paraTexts.length !== 0) {
                  const paraContents: ExtractedText = {
                    type: 'Word-Paragraph',
                    position: i,
                    isActive: true,
                    value: paraTexts,
                    sumCharas: countCharas(paraTexts.join()),
                    sumWords: countWords(paraTexts.join()),
                  };
                  wordContents.exts.push(paraContents);
                }
                break;
              }

              case 'w:tbl': {
                let tblTexts: string[] = wordTableReader(bodyCds[String(i)], opt.word.afterRev || true);
                tblTexts = applySegRules(tblTexts, opt);
                if (tblTexts.length !== 0) {
                  const tblContents: ExtractedText = {
                    type: 'Word-Table',
                    position: i,
                    isActive: true,
                    value: tblTexts,
                    sumCharas: countCharas(tblTexts.join()),
                    sumWords: countWords(tblTexts.join()),
                  };
                  wordContents.exts.push(tblContents);
                }
                break;
              }

              default:
                break;
            }
          }
          resolve(wordContents);
        });
      }
    }).catch((err: any) => {
      const fail: ReadFailure = {
        name: fileName,
        detail: err,
      };
      reject(fail);
    });
  });
}

function wordParaReder(pNd: any, rev: boolean): string {
  const paraTexts: string[] = [];
  const pCds: any = pNd.childNodes || [];
  const pCdsLen: number = pCds.length;
  for (let i = 0; i < pCdsLen; i++) {
    switch (pCds[String(i)].nodeName) {
      case 'w:r':
        paraTexts.push(wordRunReader(pCds[String(i)], rev));
        break;

      case 'w:ins':
        if (rev) {
          const insCds = pCds[String(i)].childNodes;
          const insCdsLen = insCds.length;
          for (let j = 0; j < insCdsLen; j++) {
            paraTexts.push(wordRunReader(insCds[String(j)], rev));
          }
        }
        break;

      case 'w:del':
        if (!rev) {
          const insCds = pCds[String(i)].childNodes;
          const insCdsLen = insCds.length;
          for (let j = 0; j < insCdsLen; j++) {
            paraTexts.push(wordRunReader(insCds[String(j)], rev));
          }
        }
        break;

      default:
        break;
    }
  }
  return paraTexts.join('');
}

function wordTableReader(tblNd: any, rev: boolean): string[] {
  const tableTexts: string[] = [];
  const tblCds: any = tblNd.childNodes || [];
  const tblCdsLen: number = tblCds.length;
  for (let i = 0; i < tblCdsLen; i++) {
    if (tblCds[String(i)].nodeName === 'w:tr') {
      const cellNds: any = tblCds[String(i)].childNodes || [];
      const cellLen: number = cellNds.length;
      for (let j = 0; j < cellLen; j++) {
        const cellCds: any = cellNds[String(j)].childNodes || [];
        const cellCdsLen: number = cellCds.length;
        for (let k = 0; k < cellCdsLen; k++) {
          if (cellCds[String(k)].nodeName === 'w:p') {
            const cellText = wordParaReder(cellCds[String(k)], rev);
            if (cellText !== '') {
              tableTexts.push(cellText);
            }
          }
        }
      }
    }
  }
  return tableTexts;
}

function wordRunReader(rNd: any, rev: boolean): string {
  const rCds: any = rNd.childNodes || [];
  const rCdsLen: number = rCds.length;
  let textVal = '';
  for (let i = 0; i < rCdsLen; i++) {
    if (rCds[String(i)].firstChild === null) {
      continue;
    }
    switch (rCds[String(i)].nodeName) {
      case 'w:t':
        textVal += rCds[String(i)].firstChild.data;
        break;

      case 'w:tab':
        textVal += '\n';
        break;

      case 'w:delText':
        if (!rev) {
          const t = rCds[String(i)].firstChild.data || '';
          textVal += t;
        }
        break;

      case 'w:instrText':
        textVal += ' ';
        break;

      case 'mc:AlternateContent':
        textVal += wordTboxReader(rCds[String(i)], rev);
        break;

      case 'w:pict': {
        const pictCds = rCds[String(i)].childNodes || [];
        for (let j = 0; j < pictCds.length; j++) {
          if (pictCds[String(j)].nodeName !== 'v:shape') {
            continue;
          }
          const shpCds = pictCds[String(j)].childNodes || [];
          for (let k = 0; k < shpCds.length; k++) {
            if (shpCds[String(k)].nodeName !== 'v:textbox') {
              continue;
            }
            const vtboxCds = shpCds[String(k)].childNodes || [];
            for (let l = 0; l < vtboxCds.length; l++) {
              if (vtboxCds[String(l)].nodeName !== 'w:txbxContent') {
                continue;
              }
              const wtboxCds = vtboxCds[String(l)].childNodes || [];
              for (let m = 0; m < wtboxCds.length; m++) {
                if (wtboxCds[String(m)].nodeName !== 'w:p') {
                  continue;
                }
                textVal += wordParaReder(wtboxCds[String(m)], rev);
              }
            }
          }
        }
        break;
      }

      default:
        break;
    }
  }
  return textVal;
}

function wordTboxReader(shpNd: any, rev: boolean): string {
  let textVal = '';
  const shpCds: any = shpNd.firstChild.firstChild.firstChild.childNodes || [];
  const shpCdsLen: number = shpCds.length;
  let wpsNd: any;
  for (let i = 0; i < shpCdsLen; i++) {
    if (shpCds[String(i)].nodeName === 'a:graphic') {
      wpsNd = shpCds[String(i)].firstChild.firstChild;
      break;
    }
  }
  const wpsCds: any = wpsNd.childNodes || [];
  const wpsCdsLen: number = wpsCds.length;
  for (let i = 0; i < wpsCdsLen; i++) {
    if (wpsCds[String(i)].nodeName === 'wps:txbx') {
      const wpsTxConPara = wpsCds[String(i)].firstChild.childNodes || [];
      const wpsTxConParaLen = wpsTxConPara.length;
      for (let j = 0; j < wpsTxConParaLen; j++) {
        textVal += wordParaReder(wpsTxConPara[String(j)], rev);
      }
      break;
    }
  }
  return textVal;
}
