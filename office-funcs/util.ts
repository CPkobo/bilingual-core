import { docxReader } from './office/docxReader';
import { xlsxReader } from './office/xlsxReader';
import { pptxReader } from './office/pptxReader';
import { ReadingOption } from './option';

export function cnm(data: string | object, row?: number) {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const log = row ? `${row}: ${text}` : text
  console.log(log);
}

export function path2Name(path: string): string {
  const path_ = path.replace(/\//g, '\\')
  return path_.substr(path_.lastIndexOf('\\') + 1)
}

export function path2Dir(path: string): string {
  if (path.endsWith('\\') || path.endsWith('/')) {
    return path
  } else {
    const file = path2Name(path)
    return path.replace(file, '')
  }
}

export function path2Format(path: string): string {
  return path.substr(path.lastIndexOf('.') + 1).toLowerCase()
}

export function checkValidText(text: string): boolean {
  if (text.match(/^\s*$/) === null) {
    return true
  } else {
    return false
  }
}

export function path2FormatClassify(path: string): ClassifiedFormat {
  const format = path2Format(path)
  switch (format) {
    case 'docx':
    case 'docm':
      return 'is-word'

    case 'xlsx':
    case 'xlsm':
      return 'is-excel'

    case 'pptx':
    case 'pptm':
      return 'is-ppt'
  
    default:
      return ''
  }
}

export function index2Range(index: number, startFrom: number = 0) {
  return [...Array(index).keys()].slice(startFrom)
}

export function countCharas(text: string): number {
  return text.replace(/\s+/g, '').length
}

export function countWords(text: string): number {
  return `${text}.`.replace(/(\,|\.|:|;|\!|\?|\s)+/g, ' ').split(' ').length - 1;
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

export function applySegRules(textVal: string[], opt: ReadingOption): string[] {
  if (!opt.common.segmentation && !opt.common.excluding) {
    return textVal;
  }
  const applyedValue: string[] = [];
  let delim: RegExp;
  if (opt.common.segmentation) {
    delim = new RegExp(opt.common.delimiters || '', 'g');
  }

  let ex: RegExp;
  if (opt.common.excluding) {
    ex = new RegExp(opt.common.excludePattern || '');
  }

  textVal.map((val: string) => {
    let newVal: string[] = [val];
    if (opt.common.segmentation) {
      newVal = splitSegmentation(val, delim);
    }
    if (opt.common.excluding) {
      applyedValue.push(...regexExclusion(newVal, ex));
    } else {
      applyedValue.push(...newVal);
    }
  });
  return applyedValue.filter(val => {
    let val_ = val.replace('\n', '').replace('\r', '')
    return val !== '';
  });
}

export function applyOpcodes(original: string, diffed: string, opcodes: Opcode[]): string {
  // OpcodeのDelete / Replace 用にオリジナルテキストをとっておく
  const crtSegment = original;
  // 類似テキストを一つずつ取得して処理
  // let tagged: string = diffed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let tagged:string = diffed
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

