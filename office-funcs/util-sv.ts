// This module needs to be run in client side

import { readFileSync } from 'fs'

import { docxReader } from './office/docxReader';
import { xlsxReader } from './office/xlsxReader';
import { pptxReader } from './office/pptxReader';
import { ReadingOption } from './option';

export function pathContentsReader(paths: string[], opq?: OptionQue): Promise<ExtractedContent[]> {
  const que = opq !== undefined ? opq : {};
  const opt = new ReadingOption(que);
  return new Promise((resolve, reject) => {
    const prs: Array<Promise<any>> = [];
    for (const path of paths) {
      const read = readFileSync(path);
      if (path.endsWith('.docx')) {
        prs.push(docxReader(read, path, opt));
      } else if (path.endsWith('.xlsx')) {
        prs.push(xlsxReader(read, path, opt));
      } else if (path.endsWith('.pptx')) {
        prs.push(pptxReader(read, path, opt));
      }
    }
    Promise.all(prs).then((res) => {
      resolve(res);
    }).catch((failure: ReadFailure) => {
      reject(failure);
    });
  });
}

export function path2ContentStr(path: string): string {
  const contents = readFileSync(path).toString();
  return contents;
}

export function createTsvArray(paths: string | string[]): string[][] | boolean {
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

export function convertPlains2Tsv(paths: string[]): string[][] | boolean {
  const contents: string[][] = []
  let srcLength = 0
  for (const path of paths) {
    const content = readFileSync(path).toString().split('\n')
    if (srcLength === 0) {
      srcLength = content.length
    } else {
      if (srcLength !== content.length) {
        return false
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
