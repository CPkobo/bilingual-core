const JSZip = require('jszip');
import { parseString } from 'xml2js';

import { ReadingOption } from '../option';
import { applySegRules, countCharas, countWords } from '../util';

// Excelファイルを読み込むための関数
export async function xlsxReader(xlsxFile: any, fileName: string, opt: ReadingOption): Promise<ExtractedContent> {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    zip.loadAsync(xlsxFile).then((inzip: any) => {
      // const wsNums = inzip.folder("xl/worksheets/_rels/").file(/.rels/).length
      inzip.file('xl/sharedStrings.xml').async('string').then(async (sst: string) => {
        parseString(sst, async (err: any, root: any) => {
          if (err) {
            reject(err);
          } else {
            const shared: string[] = root.sst.si.map((val: any) => {
              if (val.t !== undefined) {
                // return val.t.join('')
                if (val.t[0].$ !== undefined) {
                  return val.t[0]._ || ' ';
                } else {
                  return val.t.join('');
                }
              } else if (val.r !== undefined) {
                return val.r.map((rVal: any) => {
                  if (rVal.t[0].$ !== undefined) {
                    return rVal.t[0]._ || ' ';
                  } else {
                    return rVal.t.join('');
                  }
                }).join('');
              }
            });
            const notHidden: boolean[] = await workbookRelReader(inzip, opt.excel.readHiddenSheet || false);
            const filled: string[] = await styleRelReader(inzip, opt);
            xlsxContentsReader(inzip, shared, notHidden, filled, opt).then((datas: ExtractedText[]) => {
              const sortedDatas: ExtractedText[] = datas.sort((a: ExtractedText, b: ExtractedText): any => {
                if (a.position > b.position) { return 1; }
                if (a.position < b.position) { return -1; }
                if (a.position === b.position) {
                  if (a.type === 'Excel-Sheet') {
                    return -1;
                  } else if (b.type === 'Excel-Shape') {
                    return 1;
                  }
                  return 0;
                }
              });
              const excelContents: ExtractedContent = {
                name: fileName,
                format: 'xlsx',
                exts: sortedDatas,
              };
              resolve(excelContents);
            });
          }
        });
      });
    }).catch((err: any) => {
      const fail: ReadFailure = {
        name: fileName,
        detail: err,
      };
      reject(fail);
    });
  });
}

// 非表示のシートを読み飛ばすための関数
async function workbookRelReader(zipOjt: any, readHidden: boolean): Promise<boolean[]> {
  return new Promise((resolve, reject) => {
    zipOjt.file('xl/workbook.xml').async('string').then((wb: any) => {
      parseString(wb, (err: any, root: any) => {
        if (err) {
          console.log(err);
        } else {
          const sheets: any[] = root.workbook.sheets[0].sheet;
          const sheetsNum = sheets.length;
          const necesaries: boolean[] = Array(sheetsNum).fill(true);
          if (!readHidden) {
            for (let i = 0; i < sheetsNum; i++) {
              necesaries[i] = sheets[i].$.state !== 'hidden';
            }
          }
          resolve(necesaries);
        }
      });
    });
  });
}

// 特定の色のセルを読み飛ばすための関数
async function styleRelReader(zipOjt: any, opt: ReadingOption): Promise<string[]> {
  return new Promise((resolve, reject) => {
    zipOjt.file('xl/styles.xml').async('string').then((styles: any) => {
      parseString(styles, (err: any, root: any) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          const filled = [];
          const myStyle: any = root.styleSheet;
          if (myStyle === undefined) {
            reject('styles.xml not found');
          }
          const xfs: any = myStyle.cellXfs || undefined;
          if (xfs === undefined || xfs[0] === undefined) {
            resolve(['0']);
          }
          const xfNds: any[] = xfs[0].xf || [];
          for (let i = 0; i < xfNds.length; i++) {
            filled.push(xfNds[i].$.fillId);
          }
          resolve(filled);
        }
      });
    });
  });

}

async function xlsxContentsReader(zipOjt: any, shared: string[], notHidden: boolean[], filled: string[], opt: ReadingOption): Promise<ExtractedText[]> {
  return new Promise((resolve) => {
    const prs: Array<Promise<ExtractedText>> = [];
    const rels: ExcelSubInfoRel[] = [];
    zipOjt.folder('xl/worksheets/').forEach(async (path: string, file: any) => {
      if (!path.startsWith('_rels')) {
        prs.push(eachSheetReader(path, file, shared, filled, opt));
      } else {
        if (path.indexOf('xml') !== -1) {
          rels.push(await wsRelReader(path, file));
        }
      }
    });
    zipOjt.folder('xl/drawings/').forEach((path: string, file: any) => {
      if (!path.startsWith('_rels') && !path.endsWith('.vml')) {
        prs.push(eachDrawingReader(path, file, opt));
      }
    });
    Promise.all(prs).then((rs: ExtractedText[]) => {
      const datas: ExtractedText[] = [];
      const relation: any = {};
      for (const rel of rels) {
        relation[rel.sub] = Number(rel.main);
      }
      for (const r of rs) {
        if (r.value.length === 0) {
          continue;
        }
        if (r.type === 'Excel-Sheet') {
          r.isActive = notHidden[r.position - 1];
          datas.push(r);
        } else if (r.type === 'Excel-Shape') {
          r.position = relation[r.position];
          r.isActive = notHidden[r.position - 1];
          datas.push(r);
        }
      }
      resolve(datas);
    });
  });
}

async function wsRelReader(path: string, fileObj: any): Promise<ExcelSubInfoRel> {
  return new Promise((resolve) => {
    fileObj.async('string').then((relxml: any) => {
      parseString(relxml, (err: any, root: any) => {
        if (err) {
          console.log(err);
        } else {
          const relInfo: ExcelSubInfoRel = {
            main: path.replace('_rels/sheet', '').replace('.xml.rels', ''),
            sub: '',
          };
          for (const rel of root.Relationships.Relationship) {
            if (rel.$.Target.startsWith('../drawings/')) {
              relInfo.sub = rel.$.Target.replace('../drawings/drawing', '').replace('.xml', '');
            }
          }
          resolve(relInfo);
        }
      });
    });
  });
}

async function eachSheetReader(path: string, fileObj: any, shared: string[], filled: string[], opt: ReadingOption): Promise<ExtractedText> {
  return new Promise((resolve) => {
    fileObj.async('string').then((sht: any) => {
      parseString(sht, (err: any, root: any) => {
        if (err) {
          console.log(err);
        } else {
          const rows: any = root.worksheet.sheetData[0].row || [];
          const textInSheet: string[] = [];
          for (const row of rows) {
            if (row.c === undefined) {
              continue;
            }
            for (const col of row.c) {
              if (col.$.s !== undefined) {
                if (!opt.excel.readFilledCell) {
                  if (filled[Number(col.$.s)] !== '0') {
                    continue;
                  }
                }
              }
              if (col.$.t === 's') {
                textInSheet.push(shared[col.v]);
              }
            }
          }
          const textVals = applySegRules(textInSheet, opt);
          const sheetContents: ExtractedText = {
            type: 'Excel-Sheet',
            position: Number(path.replace('sheet', '').replace('.xml', '')),
            isActive: true,
            value: textVals,
            sumCharas: countCharas(textVals.join()),
            sumWords: countWords(textVals.join()),
          };
          resolve(sheetContents);
        }
      });
    });
  });
}

async function eachDrawingReader(path: string, fileObj: any, opt: ReadingOption): Promise<ExtractedText> {
  return new Promise((resolve) => {
    fileObj.async('string').then((sht: any) => {
      parseString(sht, (err: any, root: any) => {
        if (err) {
          console.log(err);
        } else {
          const shapes: any = root['xdr:wsDr']['xdr:twoCellAnchor'] || [];
          const drawingText: string[] = [];
          for (const shape of shapes) {
            if (shape['xdr:sp'] === undefined) {
              continue;
            }
            if (shape['xdr:sp'][0]['xdr:txBody'] === undefined) {
              continue;
            }
            const shapePara = shape['xdr:sp'][0]['xdr:txBody'][0]['a:p'] || [];
            for (const para of shapePara) {
              if (para['a:r'] === undefined) {
                continue;
              }
              drawingText.push(para['a:r'].map((val: any) => {
                if (val['a:t'] !== undefined) {
                  return val['a:t'];
                }
              }).join(''));
            }
          }
          const textVals = applySegRules(drawingText, opt);
          const shapeContents: ExtractedText = {
            type: 'Excel-Shape',
            position: Number(path.replace('drawing', '').replace('.xml', '')),
            isActive: true,
            value: textVals,
            sumCharas: countCharas(textVals.join()),
            sumWords: countWords(textVals.join()),
          };
          resolve(shapeContents);
        }
      });
    });
  });
}
