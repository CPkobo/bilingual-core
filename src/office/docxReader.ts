const JSZip = require('jszip');

import { ReadingOption } from './option';
import { applySegRules, countCharas, countWords, checkValidText } from '../util/util';

// Wordファイルの読み込みに使用
export async function docxReader(docxFile: any, fileName: string, opt: ReadingOption, isAlignTgt: boolean = false): Promise<ExtractedContent> {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    const wordContents: ExtractedContent = {
      name: fileName,
      format: 'docx',
      exts: [],
    };
    const rev = !isAlignTgt
      ? opt.word.afterRev === undefined ? true : opt.word.afterRev
      : opt.word.afterRev2 === undefined ? true : opt.word.afterRev2;
    zip.loadAsync(docxFile).then((inzip: any) => {
      if (inzip !== null) {
        inzip.file('word/document.xml').async('string').then((wordxml: string) => {
          // Wordファイルは修正履歴などの順番を保つ必要があるため、xml2js ではなく xmldom を使う
          const dom: any = require('xmldom').DOMParser;
          const doc: any = new dom().parseFromString(wordxml);
          // root > w:document
          const docNd: any = doc.lastChild || {};
          const docCds: any = docNd.childNodes || [];
          // w:document > w:body
          let bodyNd: any = {};
          for (let i = 0; i < docCds.length; i++) {
            if (docCds[i].nodeName === 'w:body') {
              bodyNd = docCds[i]
              break
            }
          }
          // w:body の直下のノードから w:p または w:tbl のみを選択して処理
          const bodyCds: any = bodyNd.childNodes || [];
          const bodyCdsLen: number = bodyCds.length;
          for (let i = 0; i < bodyCdsLen; i++) {
            switch (bodyCds[String(i)].nodeName) {
              // w:p の場合
              case 'w:p': {
                const textInPara = wordParaReder(bodyCds[String(i)], rev)
                if (checkValidText(textInPara)) {
                  const paraTexts: string[] = applySegRules([textInPara], opt);
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
              }

              // w:tbl の場合
              // 実際にはセルの中にまた w:p があるので、関数の中で再度 wordParaReder を呼び出すことになる
              case 'w:tbl': {
                let tblTexts: string[] = wordTableReader(bodyCds[String(i)], rev);
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
          // w:body の子ノードの処理がすべて終わったらresolve
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

// w:p 用の処理関数
// RUNを示すw:r、挿入を示すw:ins、削除を示すw:delにあたれば抽出処理を実行する
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

// w:tbl 用の処理関数
// 行を示す w:trの下の、セルを示すw:cellをループし
// その中の段落 w:p について通常の段落と同じよう段落用の処理関数を実行する
function wordTableReader(tblNd: any, rev: boolean): string[] {
  const tableTexts: string[] = [];
  const tblCds: any = tblNd.childNodes || [];
  const tblCdsLen: number = tblCds.length;
  // 行単位のループ
  for (let i = 0; i < tblCdsLen; i++) {
    if (tblCds[String(i)].nodeName === 'w:tr') {
      const cellNds: any = tblCds[String(i)].childNodes || [];
      const cellLen: number = cellNds.length;
      // セル単位のループ
      for (let j = 0; j < cellLen; j++) {
        const cellCds: any = cellNds[String(j)].childNodes || [];
        const cellCdsLen: number = cellCds.length;
        for (let k = 0; k < cellCdsLen; k++) {
          if (cellCds[String(k)].nodeName === 'w:p') {
            const cellText = wordParaReder(cellCds[String(k)], rev);
            const valid = checkValidText(cellText)
            if (valid) {
              tableTexts.push(cellText);
            }
          }
        }
      }
    }
  }
  return tableTexts;
}

// RUN に入ればテキストを直接取得することができる
// 
function wordRunReader(rNd: any, rev: boolean): string {
  const rCds: any = rNd.childNodes || [];
  const rCdsLen: number = rCds.length;
  let textVal = '';
  for (let i = 0; i < rCdsLen; i++) {
    const i_ = String(i)
    if (rCds[i_].firstChild === null) {
      continue;
    }
    switch (rCds[i_].nodeName) {
      case 'w:t':
        textVal += rCds[i_].firstChild.data;
        break;

      // タブ記号はセグメントで分けるために改行に変換している
      case 'w:tab':
        textVal += '\n';
        break;

      // w:del の中のテキスト部分
      case 'w:delText':
        if (!rev) {
          const t = rCds[i_].firstChild.data || '';
          textVal += t;
        }
        break;

      // Field Code ？ 要検証
      case 'w:instrText':
        textVal += ' ';
        break;

      // テキストボックスの場合
      // 再度 W:p を探す処理に入る
      case 'mc:AlternateContent': {
        const t = shapeVisitor(rCds[i_], rev)
        if (t !== '') {
          textVal += t + '\n'
        }
        break;
      }

      // シェイプの場合
      // 再度 W:p を探す処理に入る
      case 'w:pict': {
        const t = shapeVisitor(rCds[i_], rev)
        if (t !== '') {
          textVal += t + '\n'
        }
        break;
      }

      default:
        break;
    }
  }
  return textVal;
}

// テキストボックスやシェイプの処理
// これらは作り方によって入れ子になっている数が違うので、
// ビジター関数で w:p ノードが見つかるまで再帰的にノードを訪問する
function shapeVisitor(anyNode: any, rev: boolean): string {
  const ndName = anyNode.nodeName || '';
  // mc:Fallback は同じ内容が入っているため、処理をスキップして文字の重複を防ぐ
  if (ndName === 'mc:Fallback') {
    return ''
  } else if (ndName === 'w:p') {
    return wordParaReder(anyNode, rev)
  } else if (anyNode.childNodes === undefined || anyNode.childNodes === null) {
    return '';
  } else {
    const cdNds = anyNode.childNodes;
    let textVal = ''
    for (let j = 0; j < cdNds.length; j++) {
      textVal += shapeVisitor(cdNds[j], rev);
    }
    return textVal
  }
}
