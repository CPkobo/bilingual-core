// This module needs to be run in client side

import { readFileSync } from 'fs'

import { docxReader } from '../office/docxReader';
import { xlsxReader } from '../office/xlsxReader';
import { pptxReader } from '../office/pptxReader';
import { pdfReader } from '../office/pdfRead';
import { ReadingOption } from './option';

export function pathContentsReader(paths: string[], opq?: OptionQue): Promise<OfficeContent[]> {
  const que = opq !== undefined ? opq : {};
  const opt = new ReadingOption(que);
  return new Promise((resolve, reject) => {
    const prs: Array<Promise<any>> = [];
    for (const path of paths) {
      const read = readFileSync(path);
      if (path.endsWith('.docx') || path.endsWith('.docm')) {
        prs.push(docxReader(read, path, opt));
      } else if (path.endsWith('.xlsx') || path.endsWith('.xlsm')) {
        prs.push(xlsxReader(read, path, opt));
      } else if (path.endsWith('.pptx') || path.endsWith('.pptm')) {
        // スライドもノートも読み込まない設定の場合はスキップ
        if (opt.office.ppt.readSlide || opt.office.ppt.readNote) {
          prs.push(pptxReader(read, path, opt));
        }
      } else if (path.endsWith('.pdf')) {
        prs.push(pdfReader(read, path, opt))
      }
    }
    Promise.all(prs).then((res) => {
      resolve(res);
    }).catch((failure: ReadFailure) => {
      reject(failure);
    });
  });
}

export async function batchPathContentsReader(srcFiles: string[], tgtFiles: string[], opt: ReadingOption): Promise<OfficeContent[][]> {
  return new Promise((resolve, reject) => {
    const prs: Array<Promise<OfficeContent[]>> = [];
    prs.push(pathContentsReader(srcFiles, opt));
    if (tgtFiles.length > 0) {
      prs.push(pathContentsReader(tgtFiles, opt));
    }
    Promise.all(prs).then(ds => {
      resolve(ds)
    }).catch((failure: ReadFailure) => {
      console.log(`Error occured at ${failure.name}`);
      console.log('--------For more details, please see below-----------');
      console.log(failure.detail);
      console.log('-----------------------------------------------------');
      reject(failure)
    });
  })
}

export function path2ContentStr(path: string): string {
  const contents = readFileSync(path).toString();
  return contents;
}

export function createTsvArray(paths: string | string[]): string[][] {
  if (typeof paths === 'string') {
    const tsvStr = path2ContentStr(paths)
    return convertTsv2Array(tsvStr)
  } else if (paths.length === 1) {
    const tsvStr = path2ContentStr(paths[0])
    return convertTsv2Array(tsvStr)
  } else {
    return convertPlains2Tsv(paths)
  }
}

export function convertTsv2Array(tsvStr: string): string[][] {
  const lines = tsvStr.split('\n')
  const tsvArray: string[][] = []
  for (const line of lines) {
    const vals = line.split('\t')
    if (vals.length >= 2 && vals[0] !== '' && vals[1] !== '') {
      tsvArray.push([vals[0], vals[1]])
    }
  }
  return tsvArray
}

export function convertPlains2Tsv(paths: string[]): string[][] {
  const contents: string[][] = []
  let srcLength = 0
  for (const path of paths) {
    const content = readFileSync(path).toString().split('\n')
    if (srcLength === 0) {
      srcLength = content.length
    } else {
      if (srcLength !== content.length) {
        return [[]]
      }
    }
    contents.push(content)
  }
  for (let i = 0; i < srcLength; i++) {
    const line: string[] = [];
    for (const content of contents) {
      line.push(content[i]);
    }
    contents.push(line);
  }
  return contents;
}

