import { statSync, readFileSync, writeFileSync, createReadStream } from 'fs';
import { createInterface } from 'readline';

import { DiffInfo } from './diff'
import { TovisBrowser } from './tovis-brs'

export class Tovis extends TovisBrowser {
  constructor() {
    super()
    // .tovisrcを読み込む
    const cwd = process.cwd()
    const plPaths: string[][] = []
    try {
      statSync('./.tovisrc')
      const rcs = readFileSync('./.tovisrc').toString()
      if (!rcs.startsWith('!')) {
        for (const rc of rcs.split('\n')) {
          if (!rc.startsWith('#')) {
            const pathAndEx = rc.split('::')
            const plPath = pathAndEx[0].trim().replace('<cwd>', cwd)
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
          this.readTovisLines(path).then((message) => {
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

  private readTovisLines(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const rs = createReadStream(path);
      const lines = createInterface(rs);
      let count = 1;
      const lineHead = new RegExp('^(@|λ|_|%|\\!)+:(\\d+)}\\s?');
      lines.on('line', (line) => {
        if (this.parseByLine(line)) {
          count++
        }
      });
      lines.on('close', () => {
        resolve(`success to read ${count} rows`);
      });
    })
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
        const sepMarkA = '_@@_';
        const sepMarkB = '_@λ_';
        const isBiLang = path.endsWith('.tsv');
        lines.on('line', (line) => {
          if (line.startsWith(sepMarkA)) {
            if (!line.endsWith('EOF')) {
              const fileName = isBiLang ? line.split('\t')[0].replace(sepMarkA, '') : line.replace(sepMarkA, '');
              this.meta.files.push(`${i}:${fileName}`)
            }
          } else if (line.startsWith(sepMarkB)) {
            this.meta.groups.push(i)
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
}
