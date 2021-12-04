
declare type Opcode = [Optag, number, number, number, number];
declare type Match = [number, number, number];
declare type Queue = [number, number, number, number];

declare type IsJunk = (chara: string) => boolean;

declare interface EltCount {
  [key: string]: number;
}

declare interface EltIndices {
  [key: string]: number[];
}

declare interface J2Len {
  [key: number]: number;
}

export class SequenceMatcher {
  private isjunk: IsJunk | null;
  private a: string;
  private b: string;
  private autojunk: boolean;
  private matchingBlocks: Match[];
  private opcodes: Opcode[];
  private opIsA2B: boolean;
  private fullbcount: EltCount;
  private b2j: EltIndices;
  private bjunk: string[];
  private bpopular: string[];

  constructor(
    isjunk: IsJunk | null = null,
    a: string = '',
    b: string = '',
    autojunk: boolean = true,
    opDirection: 'A2B' | 'B2A' = 'A2B') {

    this.isjunk = isjunk;
    this.a = '';
    this.b = '';
    this.autojunk = autojunk;
    this.matchingBlocks = [];
    this.opcodes = [];
    this.opIsA2B = opDirection === 'A2B';
    this.fullbcount = {};
    this.b2j = {};
    this.bjunk = [];
    this.bpopular = [];
    this.setSeqs(a, b);
  }

  public setDefaultDirection(opDirection: 'A2B' | 'B2A' = 'A2B') {
    if (opDirection === 'A2B') {
      this.opIsA2B = true;
    } else if (opDirection === 'B2A') {
      this.opIsA2B = false;
    }
  }

  public setSeqs(a: string, b: string): void {
    this.setSeq1(a);
    this.setSeq2(b);
  }

  public setSeq1(a: string): void {
    if (a !== this.a) {
      this.a = a;
      this.matchingBlocks = [];
      this.opcodes = [];
    }
  }

  public setSeq2(b: string): void {
    if (b !== this.b) {
      this.b = b;
      this.matchingBlocks = [];
      this.opcodes = [];
      this.fullbcount = {};
      this._chainB();
    }
  }

  public getMatchingBlocks(): Match[] {
    if (this.matchingBlocks.length > 0) {
      return this.matchingBlocks;
    } else {
      const la = this.a.length;
      const lb = this.b.length;
      const queue: Queue[] = [[0, la, 0, lb]];
      const matchingBlocks: Match[] = [];
      while (queue.length > 0) {
        const q = queue.pop() || [0, 0, 0, 0];
        const alo = q[0];
        const ahi = q[1];
        const blo = q[2];
        const bhi = q[3];
        const x = this.findLongestMatch(alo, ahi, blo, bhi);
        const i = x[0];
        const j = x[1];
        const k = x[2];
        if (k > 0) {
          matchingBlocks.push(x);
          if (alo < i && blo < j) {
            queue.push([alo, i, blo, j]);
          }
          if (i + k < ahi && j + k < bhi) {
            queue.push([i + k, ahi, j + k, bhi]);
          }
        }
      }

      matchingBlocks.sort((a: Match, b: Match) => {
        if (a[0] > b[0]) {
          return 1
        } else if (a[0] < b[0]) {
          return -1
        } else {
          return 0
        }
      });
      let i1 = 0;
      let j1 = 0;
      let k1 = 0;
      const nonAdjacent: Match[] = [];
      for (const m of matchingBlocks) {
        const i2 = m[0];
        const j2 = m[1];
        const k2 = m[2];
        if ((i1 + k1 === i2) && (j1 + k1 === j2)) {
          k1 += k2;
        } else {
          if (k1 > 0) {
            nonAdjacent.push([i1, j1, k1]);
          }
          i1 = i2;
          j1 = j2;
          k1 = k2;
        }
      }
      if (k1 > 0) {
        nonAdjacent.push([i1, j1, k1]);
      }

      nonAdjacent.push([la, lb, 0]);
      this.matchingBlocks = nonAdjacent;
      return this.matchingBlocks;
    }
  }

  public getOpcodes(isA2B?: boolean): Opcode[] {
    const opIsA2B = isA2B === undefined ? this.opIsA2B : isA2B;
    if (opIsA2B) {
      return this.getOpcodesA2B();
    } else {
      return this.getOpcodesB2A();
    }
  }

  public getOpcodesA2B(): Opcode[] {
    if (this.opcodes.length > 0 && this.opIsA2B) {
      return this.opcodes;
    } else {
      let i = 0;
      let j = 0;
      const answer: Opcode[] = [];
      for (const m of this.getMatchingBlocks()) {
        let tag: Optag = '';
        const ai = m[0];
        const bj = m[1];
        const size = m[2];
        if (i < ai && j < bj) {
          tag = 'replace';
        } else if (i < ai) {
          tag = 'delete';
        } else if (j < bj) {
          tag = 'insert';
        }

        if (tag !== '') {
          answer.push([tag, i, ai, j, bj]);
        }
        i = ai + size;
        j = bj + size;
        if (size > 0) {
          answer.push(['equal', ai, i, bj, j]);
        }
      }
      this.opcodes = answer;
      return answer;
    }
  }

  public getOpcodesB2A(): Opcode[] {
    if (this.opcodes.length > 0 && !this.opIsA2B) {
      return this.opcodes;
    } else {
      let i = 0;
      let j = 0;
      const answer: Opcode[] = [];
      for (const m of this.getMatchingBlocks()) {
        let tag: Optag = '';
        const ai = m[0];
        const bj = m[1];
        const size = m[2];
        if (i < ai && j < bj) {
          tag = 'replace';
        } else if (i < ai) {
          tag = 'insert';
        } else if (j < bj) {
          tag = 'delete';
        }

        if (tag !== '') {
          answer.push([tag, j, bj, i, ai]);
        }
        i = ai + size;
        j = bj + size;
        if (size > 0) {
          answer.push(['equal', bj, j, ai, i]);
        }
      }
      this.opcodes = answer;
      return answer;
    }
  }

  public getGroupedOpcodes(n: number = 3) {
    let tag: Optag;
    let i1: number;
    let i2: number;
    let j1: number;
    let j2: number;
    let codes = this.getOpcodes();
    if (codes.length === 0) {
      codes = [['equal', 0, 1, 0, 1]];
    }
    if (codes[0][0] === 'equal') {
      tag = codes[0][0] as Optag;
      i1 = codes[0][1] as number;
      i2 = codes[0][2] as number;
      j1 = codes[0][3] as number;
      j2 = codes[0][4] as number;
      codes[0] = [tag, Math.max(i1, i2 - n), i2, Math.max(j1, j2 - n), j2];
    }
    const last = codes.length - 1;
    if (codes[last][0] === 'equal') {
      tag = codes[last][0] as Optag;
      i1 = codes[last][1] as number;
      i2 = codes[last][2] as number;
      j1 = codes[last][3] as number;
      j2 = codes[last][4] as number;
      codes[last] = [tag, i1, Math.min(i2, i1 + n), j1, Math.min(j2, j1 + n)];
    }

    const nn = n + n;
    const groups: Opcode[][] = [];
    let group: Opcode[] = [];
    for (const code of codes) {
      tag = code[0] as Optag;
      i1 = code[1] as number;
      i2 = code[2] as number;
      j1 = code[3] as number;
      j2 = code[4] as number;
      if ((tag === 'equal') && ((i2 - i1) > nn)) {
        group.push([tag, i1, Math.min(i2, i1 + n), j1, Math.min(j2, j1 + n)]);
        groups.push(group.slice());
        group = [];
        i1 = Math.max(i1, i2 - n);
        j1 = Math.max(j1, j2 - n);
      }
      group.push([tag, i1, i2, j1, j2]);
    }
    if (group.length > 0 && !((group.length === 1) && (group[0][0] === 'equal'))) {
      groups.push(group);
    }
    return groups;
  }

  public ratio(): number {
    let matches = 0;
    for (const m of this.getMatchingBlocks()) {
      matches += m[2];
    }
    return this.calculate_ratio(matches, this.a.length + this.b.length);
  }

  public quickRatio(): number {
    if (Object.keys(this.fullbcount).length === 0) {
      for (let i = 0; i < this.b.length; i++) {
        const elt = this.b[i];
        if (this.fullbcount[elt] === undefined) {
          this.fullbcount[elt] = 1;
        } else {
          this.fullbcount[elt]++;
        }
      }
    }
    const avail: EltCount = {};
    let matches = 0;
    for (let i = 0; i < this.a.length; i++) {
      const elt = this.a[i];
      const numb = avail[elt] || this.fullbcount[elt] || 0;
      avail[elt] = numb - 1;
      if (numb > 0) {
        matches++;
      }
    }
    return this.calculate_ratio(matches, this.a.length + this.b.length);
  }

  public realQuickRatio(): number {
    const la = this.a.length;
    const lb = this.b.length;
    return this.calculate_ratio(Math.min(la, lb), la + lb);
  }

  public applyOpcodes(isA2B: boolean = true): string {
    if (this.a === '' || this.b === '') {
      return '';
    }
    // OpcodeのDelete / Replace 用にオリジナルテキストをとっておく
    const crtSegment = isA2B ? this.escape1(this.a) : this.escape1(this.b);
    // 類似テキストを一つずつ取得して処理
    let tagged: string = isA2B ? this.escape1(this.b) : this.escape1(this.a);
    const processCodes: Opcode[] = this.getOpcodes(isA2B).reverse();
    for (const processCode of processCodes) {
      switch (processCode[0]) {
        case 'equal':
          break;
        case 'delete':
          tagged =
            tagged.slice(0, processCode[3]) +
            '<span class="ins">' + crtSegment.slice(processCode[1], processCode[2]) + '</span>' +
            tagged.slice(processCode[4]);
          break;
        case 'replace':
          tagged =
            tagged.slice(0, processCode[3]) +
            '<span class="ins">' + crtSegment.slice(processCode[1], processCode[2]) + '</span>' +
            '<span class="del">' + tagged.slice(processCode[3], processCode[4]) + '</span>' +
            tagged.slice(processCode[4]);
          break;
        case 'insert':
          tagged =
            tagged.slice(0, processCode[3]) +
            '<span class="del">' + tagged.slice(processCode[3], processCode[4]) + '</span>' +
            tagged.slice(processCode[4]);
          break;
        default:
          break;
      }
    }
    return this.escape2(tagged);
  }

  private escape1(text: string): string {
    return text.replace(/</g, '＜').replace(/>/g, '＞');
  }

  private escape2(text: string): string {
    return text.replace(/＜/g, '$lt;').replace(/＞/g, '&gt;');
  }


  private calculate_ratio(matches: number, length: number): number {
    if (length > 0) {
      return 2.0 * matches / length;
    } else {
      return 1.0;
    }
  }

  private range(start: number, end: number = 0): number[] {
    let sx = 0;
    let ex = 0;
    if (end === 0) {
      ex = start;
    } else {
      sx = start;
      ex = end;
    }
    const rng: number[] = [];
    for (let i = sx; i < ex; i++) {
      rng.push(i);
    }
    return rng;
  }

  private _chainB() {
    const b = this.b;
    this.b2j = {};
    for (let i = 0; i < b.length; i++) {
      const elt = b[i];
      if (this.b2j[elt] === undefined) {
        this.b2j[elt] = [i];
      } else {
        this.b2j[elt].push(i);
      }
    }
    this.bjunk = [];
    const isjunk = this.isjunk;
    if (isjunk) {
      for (const key of Object.keys(this.b2j)) {
        if (isjunk(key)) {
          if (this.bjunk.indexOf(key) === -1) {
            this.bjunk.push(key);
          }
        }
      }
      for (const elt of Object.keys(this.bjunk)) {
        delete this.b2j[elt];
      }
    }

    const n = b.length;
    this.bpopular.length = 0;
    if (this.autojunk && n >= 200) {
      const ntest = n;
      for (const key of Object.keys(this.b2j)) {
        const indices = this.b2j[key];
        if (indices.length > ntest) {
          if (this.bpopular.indexOf(key) === -1) {
            this.bpopular.push(key);
          }
        }
      }
      for (const elt of this.bpopular) {
        delete this.b2j[elt];
      }
    }
  }

  private findLongestMatch(alo: number, ahi: number, blo: number, bhi: number): Match {

    const a = this.a;
    const b = this.b;
    let besti = alo;
    let bestj = blo;
    let bestsize = 0;
    let j2len: J2Len = {};
    for (const i of this.range(alo, ahi)) {
      const newj2len: J2Len = {};
      const elt = a[i];
      const indices = this.b2j[elt] || [];
      for (const j of indices) {
        if (j < blo) {
          continue;
        } else if (j >= bhi) {
          break;
        }
        const k: number = j2len[j - 1] ? j2len[j - 1] + 1 : 1;
        newj2len[j] = k;
        if (k > bestsize) {
          besti = i - k + 1;
          bestj = j - k + 1;
          bestsize = k;
        }
      }
      j2len = newj2len;
    }

    while (
      besti > alo &&
      bestj > blo &&
      this.bjunk.indexOf(b[bestj - 1]) !== -1 &&
      a[besti - 1] === b[bestj - 1]) {
      besti--;
      bestj--;
      bestsize++;
    }

    while (
      besti + bestsize < ahi &&
      bestj + bestsize < bhi &&
      this.bjunk.indexOf(b[bestj + bestsize]) !== -1 &&
      a[besti + bestsize] === b[bestj + bestsize]) {
      bestsize++;
    }

    while (
      besti > alo &&
      bestj > blo &&
      this.bjunk.indexOf(b[bestj - 1]) !== -1 &&
      a[besti - 1] === b[bestj - 1]) {
      besti--;
      bestj--;
      bestsize++;
    }

    while (
      besti + bestsize < ahi &&
      bestj + bestsize < bhi &&
      this.bjunk.indexOf(b[bestj + bestsize]) !== -1 &&
      a[besti + bestsize] === b[bestj + bestsize]) {
      bestsize++;
    }

    return [besti, bestj, bestsize];
  }
}
