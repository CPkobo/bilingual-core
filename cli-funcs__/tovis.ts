import { statSync, readFileSync, writeFileSync, createReadStream } from 'fs';
import { createInterface } from 'readline';

import { DiffInfo, DiffSeg, Opcode } from './diff';
import { CatovisContext, ExtractedContent, ExtractedText } from './extract';
import { MyPlugins, Triger, TovisPlugin, OnSetString } from './plugins'
import { cnm } from './util';

// export type TovisOpcodeSymbol = '='|'~'|'+'|'-'

// export type TovisOpcode = [string, number, number, number, number]

export interface ParseResult {
  isOk: boolean;
  message: string;
}

export interface TovisRef {
  to: number;
  from: number;
  ratio: number;
  op: Opcode[];
}

export interface TransCandidate {
  type: string;
  text: string;
}

export type UsedTerms = {
  s: string;
  t: string[];
};

export interface TovisMeta {
  srcLang: string;
  tgtLang: string;
  files: string[];
  tags: string[];
  // groups: number[][];
  groups: number[];
  remarks: string;
}

// s: Source
// t: Translation
// m: Machine Translation or Memory, meaning a non-confirmed translation
// d: Diff data
// c: COmments
export interface TovisBlock {
  s: string;
  t: string;
  m: TransCandidate[];
  u: UsedTerms[];
  d: TovisRef[];
  c: string;
}

export class Tovis {
  public meta: TovisMeta;
  public blocks: TovisBlock[];
  public plugins: MyPlugins;

  constructor() {
    this.meta = {
      srcLang: '',
      tgtLang: '',
      files: [],
      tags: [],
      groups: [],
      remarks: '',
    };
    this.blocks = [];
    this.plugins = new MyPlugins()
    const pwd = process.cwd()
    const plPaths: string[][] = []
    try {
      statSync('./.tovisrc')
      const rcs = readFileSync('./.tovisrc').toString()
      if (!rcs.startsWith('!')) {
        for (const rc of rcs.split('\n')) {
          if (!rc.startsWith('#')) {
            const pathAndEx = rc.split('::')
            const plPath = pathAndEx[0].trim().replace('<pwd>', pwd)
            const exOption = pathAndEx.length > 1 ? pathAndEx[1].trim() : ''
            if (plPath !== '') {
              plPaths.push([plPath, exOption])
            }
          }
        }
      }
    } catch (e) {
      console.log('No .tovisrc file')
      // console.log(e)
    }
    for (const pathAndOption of plPaths) {
      this.plugins.register(pathAndOption[0], pathAndOption[1])
    }
  }

  public parseFromFile(path: string, fileType: 'tovis' | 'diff' | 'plain'): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      try {
        statSync(path);
        if (fileType === 'tovis') {
          this.parseFromTovis(path).then((message) => {
            resolve({ isOk: true, message });
          }).catch((errMessage) => {
            reject({ isOk: false, message: errMessage });
          });
        } else if (fileType === 'diff') {
          const diffStr = readFileSync(path).toString();
          this.parseDiffInfo(JSON.parse(diffStr)).then((message) => {
            resolve({ isOk: true, message });
          }).catch((errMessage) => {
            reject({ isOk: false, message: errMessage });
          });
        } else if (fileType === 'plain') {
          // const plainStr: string = readFileSync(path).toString()
          this.parseFromPlainText(path, true).then((message) => {
            resolve({ isOk: true, message });
          }).catch((errMessage) => {
            reject({ isOk: false, message: errMessage });
          });
        } else {
          reject({ isOk: false, message: 'fileType sholud designate from "tovis"/"diff"/"plain"' });
        }
      } catch {
        reject({ isOk: false, message: 'file did not found' });
      }
    });
  }

  public parseFromObj(data: CatovisContext | DiffInfo): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      if (data instanceof CatovisContext) {
        const diff = new DiffInfo()
        const srcContent = data.getRawContent('src')
        if (srcContent !== null) {
          diff.analyze(srcContent)
        this.parseDiffInfo(diff.dsegs).then((message) => {
          resolve({isOk: true, message})
        }).catch((errMessage) => {
          reject({ isOk: false, message: errMessage });
        });
        } else {
          reject({ isOk: false, message: 'No Catovis Context'})
        }
      } else if (data instanceof DiffInfo) {
        this.parseDiffInfo(data.dsegs).then((message) => {
          resolve({isOk: true, message})
        }).catch((errMessage) => {
          reject({ isOk: false, message: errMessage });
        });
      }
    })
    
  }

  public dump(): string[] {
    const tovisStr: string[] = [
      `#SourceLang: ${this.meta.srcLang}`,
      `#TargetLang: ${this.meta.tgtLang}`,
      `#IncludingFiles: ${this.meta.files.join(',')}`,
      `#Tags: ${this.meta.tags.join(',')}`,
    ];
    const groupsStr: string[] = [];
    // for (const group of this.meta.groups) {
    //   groupsStr.push(`${group[0]}-${group[1]}`);
    // }
    // tovisStr.push(`#Groups: ${groupsStr.join(',')}`);
    tovisStr.push(`#Groups: ${this.meta.groups.join(',')}`)
    if (this.meta.remarks !== '') {
      tovisStr.push(`#Remarks: ${this.meta.remarks}`);
    }
    tovisStr.push('-----\n');
    for (let i = 0; i < this.blocks.length; i++) {
      tovisStr.push(`@:${i}} ${this.blocks[i].s}`);
      tovisStr.push(`λ:${i}} ${this.blocks[i].t}`);
      if (this.blocks[i].m.length > 0) {
        for (const tmmt of this.blocks[i].m) {
          tovisStr.push(`_:${i}}[${tmmt.type}] ${tmmt.text}`);
        }
      }
      if (this.blocks[i].u.length > 0) {
        const used: string[] = [];
        for (const usedPair of this.blocks[i].u) {
          used.push(`${usedPair.s}::${usedPair.t.join('|')}`);
        }
        tovisStr.push(`$:${i}} ${used.join(';')}`);
      }
      const refs: string[] = [];
      for (const d of this.blocks[i].d) {
        let ref = `${d.from}>${d.to}|${d.ratio}`;
        for (const op of d.op) {
          ref += `|${op.join(',')}`;
        }
        refs.push(ref);
      }
      tovisStr.push(`%:${i}} ${refs.join(';')}`);
      tovisStr.push(`!:${i}} ${this.blocks[i].c}`);
      tovisStr.push('');
    }
    return tovisStr;
  }

  public dumpToJson(): string {
    return JSON.stringify(this, null, 2);
  }

  private createBlock(): TovisBlock {
    return {
      s: '',
      t: '',
      m: [],
      u: [],
      d: [],
      c: '',
    };
  }

  private createRef(): TovisRef {
    return {
      from: 0,
      to: 0,
      ratio: 0,
      op: [],
    };
  }

  private createOpcodes(codes: string[]): Opcode[] {
    const opcodes: Opcode[] = [];
    for (const code of codes) {
      const eachChara = code.split(',');
      opcodes.push([
        eachChara[0],
        Number(eachChara[1]),
        Number(eachChara[2]),
        Number(eachChara[3]),
        Number(eachChara[4]),
      ]);
    }
    return opcodes;
  }

  private parseFromTovis(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const rs = createReadStream(path);
      const lines = createInterface(rs);
      let count = 1;
      const lineHead = new RegExp('^(@|λ|_|%|\\!)+:(\\d+)}\\s?');
      // const blocks: TovisBlock[] = []
      lines.on('line', (line) => {
        if (line.startsWith('#')) {
          const metaData = line.split(':');
          if (metaData.length > 1) {
            switch (metaData[0]) {
              case '#SourceLang':
                this.meta.srcLang = metaData[1].trim();
                count++;
                break;
              case '#TargetLang':
                this.meta.tgtLang = metaData[1].trim();
                count++;
                break;
              case '#IncludingFiles':
                this.meta.files = metaData[1].trim().split(',');
                count++;
                break;
              case '#Tags':
                this.meta.tags = metaData[1].trim().split(',');
                count++;
                break;
              case '#Groups': {
                  // const byGroups = metaData[1].trim().split(',');
                  // for (const byGroup of byGroups) {
                  //   const fromAndTo = byGroup.split('-');
                  //   if (fromAndTo.length >= 2) {
                  //     this.meta.groups.push([Number(fromAndTo[0]), Number(fromAndTo[1])]);
                  //   }
                  // }
                  this.meta.groups = metaData[1].trim().split(',').map(val => {
                    return Number(val)
                  })
                count++;
                break;
              }

              case '#Remarks':
                this.meta.remarks += `${metaData[1]};`;
                count++;
                break;

              default:
                break;
            }
          } else {
            this.meta.remarks += `${line};`;
            count++;
          }
        } else if (line !== '') {
          const matchObj: RegExpMatchArray | null = line.match(lineHead);
          if (matchObj !== null) {
            const index = Number(matchObj[2]);
            while (this.blocks.length < index + 1) {
              this.blocks.push(this.createBlock());
            }
            this.upsertBlocks(line.substr(0, 1), index, line.replace(lineHead, '').trim());
            count++;
          }
        }
      });
      lines.on('close', () => {
        resolve(`success to read ${count} rows`);
      });
    });
  }

  private parseDiffInfo(diff: DiffSeg[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const codeDict = {
        replace: '~',
        delete: '-',
        insert: '+',
      };
      let fileName = ''
      let fileStr = ''
      let prevGroup = -1
      // let prevGroup = 0
      // let prevPid = 0
      for (const dseg of diff) {
        if (fileName !== dseg.file) {
          fileName = dseg.file
          const pathElements = fileName.split('/')
          fileStr = `${dseg.pid}:${pathElements[pathElements.length - 1]}`
          this.meta.files.push(fileStr)
        }
        if (prevGroup !== dseg.gid) {
          // this.meta.groups.push([prevPid, dseg.pid - 1])
          this.meta.groups.push(dseg.pid)
          // prevPid = dseg.pid
          prevGroup = dseg.gid
        }
        const block = this.createBlock();
        // block.s = dseg.st;
        this.setSource(block, dseg.st)
        block.t = dseg.tt;
        for (const sim of dseg.sims) {
          const refInfo: TovisRef = {
            from: sim.advPid,
            to: dseg.pid,
            ratio: sim.ratio,
            op: sim.opcode.filter((c: Opcode) => {
              return c[0] !== 'equal';
            }).map((c2: Opcode) => {
              const mark = c2[0] === 'replace' ? '~' : c2[0] === 'delete' ? '-' : '+';
              return [mark, c2[1], c2[2], c2[3], c2[4]];
            }),
          };
          block.d.push(refInfo);
          this.blocks[sim.advPid].d.push(refInfo);
        }
        this.blocks.push(block);
      }
      // this.meta.groups.push([prevPid, diff.length - 1])
      // this.meta.groups.push([prevPid, diff.length - 1])
      resolve('DiffInfo successfully parsed into TOVIS');
    });
  }

  private parseFromPlainText(path: string, withDiff: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
      if (withDiff) {
        const diff: DiffInfo = new DiffInfo();
        diff.analyzeFromText(path).then((count: number) => {
          this.parseDiffInfo(diff.dsegs).then(() => {
            resolve(`success to read ${count} rows with Diff`);
          });
        })
      } else {
        const rs = createReadStream(path);
        const lines = createInterface(rs);
        let i = -1
        // let i = 0
        // let j = 0
        const sepMarkA = '_@@_';
        const sepMarkB = '_@λ_';
        const isBiLang = path.endsWith('.tsv');
        // const texts: string[] = [];
        lines.on('line', (line) => {
          if (line.startsWith(sepMarkA)) {
            if (!line.endsWith('EOF')) {
              const fileName = isBiLang ? line.split('\t')[0].replace(sepMarkA, '') : line.replace(sepMarkA, '');
              this.meta.files.push(`${i}:${fileName}`)
            }
          } else if (line.startsWith(sepMarkB)) {
            this.meta.groups.push(i)
            // j = i
          } else if (line !== '') {
            i++;
            const st = isBiLang ? line.split('\t')[0] : line;
            const tt = isBiLang ? line.split('\t')[1] : '';
            const block = this.createBlock()
            this.setSource(block, st)
            block.t = tt
            this.blocks.push(block)
          }
        });
        lines.on('close', () => {
          resolve(`success to read ${i} rows`)
        })
      }
    }) 
  }

  private upsertBlocks(keyChara: string, index: number, contents: string): boolean {
    let isValid = false;
    switch (keyChara) {
      // 原文
      case '@': {
        if (contents !== '') {
          if (this.blocks[index].s === '') {
            // this.blocks[index - 1].s = contents;
            this.setSource(this.blocks[index], contents)
            isValid = true;
          }
        } else {
          isValid = true;
        }
        break;
      }

      // 確定訳文
      case 'λ': {
        if (contents !== '') {
          if (this.blocks[index].t === '') {
            this.blocks[index].t = contents;
            isValid = true;
          }
        } else {
          isValid = true;
        }
        break;
      }

      // 訳文候補
      case '_': {
        if (contents !== '') {
          const matchObj: RegExpMatchArray | null = contents.match(/^\[.+\]/);
          if (matchObj === null) {
            this.blocks[index].m.push({ type: 'Hm?', text: contents });
          } else {
            this.blocks[index].m.push({
              type: matchObj[0].replace('[', '').replace(']', ''),
              text: contents.replace(matchObj[0], ''),
            });
          }
        }
        isValid = true;
        break;
      }

      // 用語
      case '$': {
        if (contents !== '') {
          const pairs: string[] = contents.split(';');
          for (const pair of pairs) {
            const srcAndTgt = pair.split('::');
            const used: UsedTerms = {
              s: srcAndTgt[0],
              t: srcAndTgt[1].split('|'),
            };
            this.blocks[index].u.push(used);
          }
        }
        break;
      }

      // コメント
      case '!': {
        if (contents !== '') {
          this.blocks[index].c += contents + ';';
        }
        isValid = true;
        break;
      }

      // 類似情報
      case '%': {
        if (contents !== '') {
          if (this.blocks[index].d.length === 0) {
            const refs: TovisRef[] = [];
            const singleCodes = contents.split(';');
            for (const singleCode of singleCodes) {
              const elements = singleCode.split('|');
              const fromAndTo = elements[0].split('>');
              if (fromAndTo.length < 2) {
                isValid = false;
                break;
              }
              const ref: TovisRef = {
                from: Number(fromAndTo[0]),
                to: Number(fromAndTo[1]),
                ratio: Number(elements[1]),
                op: this.createOpcodes(elements.slice(2)),
              };
              refs.push(ref);
              // blocks[ref.from - 1].d.push(ref)
            }
            this.blocks[index].d = refs;
            isValid = true;
          }
        } else {
          isValid = true;
        }
        break;
      }

      default:
        break;
    }
    return isValid;
  }

  private setSource(block: TovisBlock, text: string): void {
    if (this.plugins.onSetSouce.length === 0) {
      block.s = text
    } else {
      block.s = this.plugins.execFuncs('onSetSouce', text)
    }
  }

  private setMT(block: TovisBlock, type: string, text: string): void {
    if (this.plugins.onSetMT.length === 0) {
      block.m.push({ type, text })
    } else {
      block.m.push({ type, text: this.plugins.execFuncs('onSetMT', text) })
    }
  }
}
