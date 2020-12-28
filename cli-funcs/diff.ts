import { createReadStream } from 'fs'
import { createInterface } from 'readline';
import { DiffInfoBrowser } from './diff-brs'

export class DiffInfo extends DiffInfoBrowser {
  constructor() {
    super()
  }

  public analyzeFromText(path: string, adding?: boolean): Promise<number> {
    if (adding === undefined || adding === false) {
      this.dsegs.length = 0;
    }
    const rs = createReadStream(path);
    const lines = createInterface(rs);
    let i = -1
    let j = -1
    const sepMarkA = '_@@_';
    const sepMarkB = '_@λ_';
    const isBiLang = path.endsWith('.tsv');
    // const texts: string[] = [];
    let fileName = ''
    return new Promise((resolve, reject) => {
      lines.on('line', (line) => {
        if (line.startsWith(sepMarkA)) {
          if (!line.endsWith('EOF')) {
            fileName = isBiLang ? line.split('\t')[0].replace(sepMarkA, '') : line.replace(sepMarkA, '');
          }
        } else if (line.startsWith(sepMarkB)) {
          j++
        } else if (line !== '') {
          i++;
          const st = isBiLang ? line.split('\t')[0] : line;
          const tt = isBiLang ? line.split('\t')[1] : '';
          this.addDseg(i, j, fileName, st, tt);
        }
      });
      lines.on('close', () => {
        resolve(i)
      })
    })
  }
}
