const JSZip = require('jszip');
import { parseString } from 'xml2js';

import { ExtractedText, ExtractedContent, PPTSubInfoRel } from '../extract';
import { ReadingOption } from '../option';
import { applySegRules, ReadFailure } from '../util';

// PPTファイルを読み込むための関数
export async function pptxReader(pptxFile: any, fileName: string, opt: ReadingOption): Promise<ExtractedContent> {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    zip.loadAsync(pptxFile).then((inzip: any) => {
      const prs: Array<Promise<ExtractedText>> = [];
      const rels: PPTSubInfoRel[] = [];
      // const slideNums = inzip.folder("ppt/slides/_rels/").file(/.rels/).length
      inzip.folder('ppt/slides/').forEach(async (path: string, file: any) => {
        if (!path.startsWith('_rels')) {
          prs.push(slideReader(path, file, opt));
        } else {
          if (path.indexOf('xml') !== -1) {
            rels.push(await pptRelReader(path, file));
          }
        }
      });
      if (opt.pptNote) {
        inzip.folder('ppt/notesSlides/').forEach((path: string, file: any) => {
          if (!path.startsWith('_rels')) {
            prs.push(noteReader(path, file, opt));
          }
        });
      }
      inzip.folder('ppt/diagrams/').forEach((path: string, file: any) => {
        if (path.startsWith('data') && path.endsWith('.xml')) {
          prs.push(slideDiagramReader(path, file, opt));
        }
      });
      // チャートの種類が多岐にわたるため、課題
      inzip.folder('ppt/charts/').forEach((path: string, file: any) => {
        if (path.startsWith('chart') && path.endsWith('.xml')) {
          prs.push(slideChartReader(path, file, opt));
        }
      });

      Promise.all(prs).then((rs: ExtractedText[]) => {
        const datas: ExtractedText[] = [];
        const noteRelation: any = {};
        const dgmRelation: any = {};
        const chtRelation: any = {};
        for (const rel of rels) {
          if (rel.note !== '') {
            noteRelation[rel.note] = Number(rel.main);
          }
          if (rel.dgm !== '') {
            dgmRelation[rel.dgm] = Number(rel.main);
          }
          if (rel.chart !== '') {
            chtRelation[rel.chart] = Number(rel.main);
          }
        }
        for (const r of rs) {
          if (r.value.length === 0) {
            continue;
          }
          if (r.type === 'PPT-Slide') {
            datas.push(r);
          } else if (r.type === 'PPT-Note') {
            r.position = Number(noteRelation[r.position]);
            datas.push(r);
          } else if (r.type === 'PPT-Diagram') {
            r.position = Number(dgmRelation[r.position]);
            datas.push(r);
          } else if (r.type === 'PPT-Chart') {
            r.position = Number(chtRelation[r.position]);
            datas.push(r);
          }
        }
        const sortedDatas: ExtractedText[] = datas.sort((a: ExtractedText, b: ExtractedText): any => {
          if (a.position > b.position) { return 1; }
          if (a.position < b.position) { return -1; }
          if (a.position === b.position) {
            if (a.type === 'PPT-Slide') {
              return -1;
            } else if (b.type === 'PPT-Note' || b.type === 'PPT-Diagram' || b.type === 'PPT-Chart') {
              return 1;
            } else {
              return 0;
            }
          }
        });
        const pptContents: ExtractedContent = {
          name: fileName,
          format: 'pptx',
          exts: sortedDatas,
        };
        resolve(pptContents);
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

async function slideReader(path: string, fileObj: any, opt: ReadingOption): Promise<ExtractedText> {
  return new Promise((resolve) => {
    fileObj.async('string').then((slide: any) => {
      parseString(slide, (err: any, root: any) => {
        if (err) {
          console.log(err);
        } else {
          let textInSlide: string[] = [];
          const pTree = root['p:sld']['p:cSld'][0]['p:spTree'][0] !== undefined ? root['p:sld']['p:cSld'][0]['p:spTree'][0] : {};
          const groups: any[] = pTree['p:grpSp'] !== undefined ? pTree['p:grpSp'] : [];
          const shapes: any[] = pTree['p:sp'] !== undefined ? pTree['p:sp'] : [];
          for (const group of groups) {
            if (group['p:sp'] === undefined) {
              continue;
            }
            shapes.push(...group['p:sp']);
          }
          for (const shape of shapes) {
            if (shape['p:txBody'] === undefined) {
              continue;
            }
            const paras: any[] = shape['p:txBody'][0]['a:p'] !== undefined ? shape['p:txBody'][0]['a:p'] : [];
            for (const para of paras) {
              // const runs = para['a:r'];
              // if (runs === undefined) {
              //   continue;
              // } else {
              const runs: any = para['a:r'] !== undefined ? para['a:r'] : [];
              let textInPara = '';
              for (const run of runs) {
                if (run['a:t'] === undefined) {
                  continue;
                }
                textInPara += run['a:t'];
              }
              textInSlide.push(textInPara.replace('\t', '\n'));
              // }
            }
          }
          const gFrames: any[] = pTree['p:graphicFrame'] !== undefined ? pTree['p:graphicFrame'] : [];
          for (const gFrame of gFrames) {
            if (gFrame['a:graphic'] === undefined) {
              continue;
            }
            if (gFrame['a:graphic'][0]['a:graphicData'] === undefined) {
              continue;
            }
            const tables: any[] = gFrame['a:graphic'][0]['a:graphicData'][0]['a:tbl'] !== undefined ? gFrame['a:graphic'][0]['a:graphicData'][0]['a:tbl'] : [];
            for (const table of tables) {
              const rows: any[] = table['a:tr'] !== undefined ? table['a:tr'] : [];
              for (const row of rows) {
                const cells: any[] = row['a:tc'] !== undefined ? row['a:tc'] : [];
                for (const cell of cells) {
                  if (cell['a:txBody'] === undefined) {
                    continue
                  }
                  const paras = cell['a:txBody'][0]['a:p'] !== undefined ? cell['a:txBody'][0]['a:p'] : [];
                  let textInCell = '';
                  for (const para of paras) {
                    const runs = para['a:r'] !== undefined ? para['a:r'] : [];
                    for (const run of runs) {
                      textInCell += run['a:t'];
                    }
                    textInCell += '\n';
                  }
                  textInSlide.push(textInCell.replace('\t', '\n'));
                }
              }
            }
          }
          const slideContents: ExtractedText = {
            type: 'PPT-Slide',
            position: Number(path.replace('slide', '').replace('.xml', '')),
            isActive: true,
            value: applySegRules(textInSlide, opt),
          };
          resolve(slideContents);
        }
      });
    });
  });
}

async function pptRelReader(path: string, fileObj: any): Promise<PPTSubInfoRel> {
  return new Promise((resolve) => {
    fileObj.async('string').then((rel: any) => {
      parseString(rel, (err: any, root: any) => {
        if (err) {
          console.log(err);
        } else {
          const relInfo: PPTSubInfoRel = {
            main: path.replace('_rels/slide', '').replace('.xml.rels', ''),
            note: '',
            dgm: '',
            chart: '',
          };
          for (const r of root.Relationships.Relationship) {
            if (r.$.Target.startsWith('../notesSlides')) {
              relInfo.note = r.$.Target.replace('../notesSlides/notesSlide', '').replace('.xml', '');
            }
            if (r.$.Target.startsWith('../diagrams/data')) {
              relInfo.dgm = r.$.Target.replace('../diagrams/data', '').replace('.xml', '');
            }
            if (r.$.Target.startsWith('../charts/')) {
              relInfo.chart = r.$.Target.replace('../charts/chart', '').replace('Ex', '10000').replace('.xml', '');
            }
          }
          resolve(relInfo);
        }
      });
    });
  });
}

async function noteReader(path: string, fileObj: any, opt: ReadingOption): Promise<ExtractedText> {
  return new Promise((resolve) => {
    fileObj.async('string').then((note: any) => {
      parseString(note, (err: any, root: any) => {
        if (err) {
          console.log(err);
        } else {
          let textInNote: string[] = [];
          const pTree: any = root['p:notes']['p:cSld'][0]['p:spTree'][0] !== undefined ? root['p:notes']['p:cSld'][0]['p:spTree'][0] : {};
          const shapes: any[] = pTree['p:sp'] !== undefined ? pTree['p:sp'] : [];
          for (const shape of shapes) {
            const txBody: any[] = shape['p:txBody'] !== undefined ? shape['p:txBody'] : [];
            if (txBody.length === 0) {
              continue;
            }
            const paras: any[] = txBody[0]['a:p'] !== undefined ? txBody[0]['a:p'] : [];
            for (const para of paras) {
              const textInPara: string[] = [];
              const runs: any[] = para['a:r'] !== undefined ? para['a:r'] : [];
              for (const run of runs) {
                if (run['a:t'][0] !== '' && run['a:t'][0] !== '\t') {
                  textInPara.push(...run['a:t']);
                }
              }
              textInNote.push(textInPara.join(''));
            }
          }
          const noteContents: ExtractedText = {
            type: 'PPT-Note',
            position: Number(path.replace('notesSlide', '').replace('.xml', '')),
            isActive: true,
            value: applySegRules(textInNote, opt),
          };
          resolve(noteContents);
        }
      });
    });
  });
}

async function slideDiagramReader(path: string, fileObj: any, opt: ReadingOption): Promise<ExtractedText> {
  return new Promise((resolve) => {
    fileObj.async('string').then((dgm: any) => {
      parseString(dgm, (err: any, root: any) => {
        if (err) {
          console.log(err);
        } else {
          const textInDiagram: string[] = [];
          const patterns: any[] = root['dgm:dataModel']['dgm:ptLst'][0]['dgm:pt'] !== undefined ? root['dgm:dataModel']['dgm:ptLst'][0]['dgm:pt'] : [];
          for (const pattern of patterns) {
            const dgmt: any[] = pattern['dgm:t'] !== undefined ? pattern['dgm:t'] : [];
            if (dgmt.length === 0) {
              continue;
            }
            const dgmtp: any[] = dgmt[0]['a:p'] !== undefined ? dgmt[0]['a:p'] : [];
            if (dgmtp.length === 0) {
              continue;
            }
            const dgmtprun: any[] = dgmtp[0]['a:r'] !== undefined ? dgmtp[0]['a:r'] : [];
            if (dgmtprun.length === 0) {
              continue;
            }
            textInDiagram.push(...dgmtprun[0]['a:t']);
          }
          const dgmContents: ExtractedText = {
            type: 'PPT-Diagram',
            position: Number(path.replace('data', '').replace('.xml', '')),
            isActive: true,
            value: applySegRules(textInDiagram, opt),
          };
          resolve(dgmContents);
        }
      });
    });
  });
}

async function slideChartReader(path: string, fileObj: any, opt: ReadingOption): Promise<ExtractedText> {
  return new Promise((resolve, reject) => {
    fileObj.async('string').then((chtxml: any) => {
      const dom: any = require('xmldom').DOMParser;
      const cht: any = new dom().parseFromString(chtxml);
      const chtSpace = cht.lastChild;
      const chtSpCds = chtSpace.childNodes !== undefined ? chtSpace.childNodes : [];

      const textInChart: string[] = [];
      slideChartVisitor(chtSpace, textInChart);

      const chartContents: ExtractedText = {
        type: 'PPT-Chart',
        position: Number(path.replace('chart', '').replace('Ex', '10000').replace('.xml', '')),
        isActive: true,
        value: applySegRules(textInChart, opt),
      };
      resolve(chartContents);
    });
  });
}

function slideChartVisitor(anyNode: any, chartTexts: string[]): string[] {
  if (anyNode.childNodes === undefined || anyNode.childNodes === null) {
    if (anyNode.parentNode.nodeName === 'a:t' || anyNode.parentNode.nodeName === 'c:v') {
      if (anyNode.data !== undefined && anyNode.data !== '') {
        const text = anyNode.data as string;
        if (chartTexts.indexOf(text) === -1) {
          chartTexts.push(text);
        }
      }
    }
    return chartTexts;
  } else {
    const cdNds = anyNode.childNodes;
    for (let j = 0; j < cdNds.length; j++) {
      slideChartVisitor(cdNds[j], chartTexts);
    }
    return chartTexts;
  }
}

