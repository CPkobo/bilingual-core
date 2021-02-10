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