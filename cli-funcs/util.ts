import { docxReader } from './office/docxReader';
import { xlsxReader } from './office/xlsxReader';
import { pptxReader } from './office/pptxReader';
import { ReadingOption, OptionQue } from './option';

import { ExtractedContent } from './extract';
import { Opcode } from './diff';

export interface ReadFailure {
  name: string;
  detail: any;
}

export function cnm(data: any) {
  console.log(data);
}

export function blobContentsReader(files: any, order: number[], opq?: OptionQue): Promise<ExtractedContent[]> {
  const que = opq !== undefined ? opq : {};
  const opt = new ReadingOption(que);
  return new Promise((resolve, reject) => {
    const prs: Array<Promise<any>> = [];
    for (const ox of order) {
      const fileName = files[ox].name;
      if (fileName.endsWith('.docx')) {
        prs.push(docxReader(files[ox], fileName, opt));
      } else if (fileName.endsWith('.xlsx')) {
        prs.push(xlsxReader(files[ox], fileName, opt));
      } else if (fileName.endsWith('.pptx')) {
        prs.push(pptxReader(files[ox], fileName, opt));
      }
    }
    Promise.all(prs).then((res) => {
      resolve(res);
    }).catch((failure: ReadFailure) => {
      reject(failure);
    });
  });
}

export function applySegRules(textVal: string[], opt: ReadingOption): string[] {
  if (!opt.segmentation && !opt.exclusion) {
    return textVal;
  }
  const applyedValue: string[] = [];
  let delim: RegExp;
  if (opt.segmentation) {
    delim = new RegExp(opt.delimiters, 'g');
  }

  let ex: RegExp;
  if (opt.excluding) {
    ex = new RegExp(opt.exclusion);
  }

  textVal.map((val: string) => {
    let newVal: string[] = [val];
    if (opt.segmentation) {
      newVal = splitSegmentation(val, delim);
    }
    if (opt.excluding) {
      applyedValue.push(...regexExclusion(newVal, ex));
    } else {
      applyedValue.push(...newVal);
    }
  });
  return applyedValue;
}

export function splitSegmentation(text: string, delimiters: RegExp): string[] {
  const t = text.replace(delimiters, '$1\n');
  const ts: string[] = t.split('\n').filter((val) => {
    return val !== '';
  });

  return ts;
}

export function regexExclusion(texts: string[], ex: RegExp): string[] {
  const excluded: string[] = texts.filter((val: string) => {
    return !ex.test(val);
  });
  return excluded;
}

export function applyOpcodes(original: string, diffed: string, opcodes: Opcode[]): string {
  // OpcodeのDelete / Replace 用にオリジナルテキストをとっておく
  const crtSegment = original;
  // 類似テキストを一つずつ取得して処理
  let tagged: string = diffed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const processCodes: Opcode[] = opcodes.reverse();
  for (const processCode of processCodes) {
    switch (processCode[0]) {
      case 'equal':
      case '=':
        break;
      case 'delete':
      case '-':
        tagged =
            tagged.slice(0, processCode[3]) +
            '<span class="ins">' + crtSegment.slice(processCode[1], processCode[2]) + '</span>' +
            tagged.slice(processCode[4]);
        break;
      case 'replace':
      case '~':
        tagged =
            tagged.slice(0, processCode[3]) +
            '<span class="ins">' + crtSegment.slice(processCode[1], processCode[2]) + '</span>' +
            '<span class="del">' + tagged.slice(processCode[3], processCode[4]) + '</span>' +
            tagged.slice(processCode[4]);
        break;
      case 'insert':
      case '+':
        tagged =
            tagged.slice(0, processCode[3]) +
            '<span class="del">' + tagged.slice(processCode[3], processCode[4]) + '</span>' +
            tagged.slice(processCode[4]);
        break;
      default:
        break;
    }
  }
  return tagged;
}

