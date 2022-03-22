// import { docxReader } from './office/docxReader';
// import { xlsxReader } from './office/xlsxReader';
// import { pptxReader } from './office/pptxReader';
import { ReadingOption } from './option';

export function getVer(): string {
  return '0.3.5'
}

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

export function countFromDoubleArray(texts: string[][], unit: CountType, index: number): number {
  let sum = 0
  if (unit === 'chara') {
    for (const text of texts) {
      sum += countCharas(text[index])
    }
  } else if (unit === 'word') {
    for (const text of texts) {
      sum += countWords(text[index])
    }
  }
  return sum
}

export function countFromArray(texts: string[], unit: CountType): number {
  let sum = 0
  if (unit === 'chara') {
    for (const text of texts) {
      sum += countCharas(text)
    }
  } else if (unit === 'word') {
    for (const text of texts) {
      sum += countWords(text)
    }
  }
  return sum
}

export function countCharas(text: string): number {
  return text.replace(/\s+/g, '').length
}

export function countWords(text: string): number {
  return `${text}.`.replace(/(\,|\.|:|;|\!|\?|\s)+/g, ' ').split(' ').length - 1;
}

export function splitSegmentation(text: string, delimiters: RegExp, exceptions?: RegExp): string[] {
  const t = text.replace(delimiters, '$1\n');
  const ex = exceptions || new RegExp('((Mr)|(Ms)|(No)|(Co)|(co)|(Ltd)|(Inc)|(etc))\\. $')
  let tv = ''
  const ts: string[] = [];
  for (const v of t.split('\n')) {
    tv += v
    if (tv === '' || ex.test(tv)) {
      continue
    } else {
      ts.push(tv)
      tv = ''
    }
  }
  if (tv !== '') {
    ts.push(tv)
  }
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
    return val_ !== '';
  });
}

export function str2ExtractedText(texts: string[], position: number = 0, type: SeparateMark = '') {
  const joined = texts.join(' ')
  return {
    type,
    position,
    isActive: true,
    value: texts,
    sumCharas: countCharas(joined),
    sumWords: countWords(joined)
  }
}
