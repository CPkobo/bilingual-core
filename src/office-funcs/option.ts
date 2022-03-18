export class ReadingOption {
  public common: Required<CommonOption>;
  public word: Required<WordOption>;
  public excel: Required<ExcelOption>;
  public ppt: Required<PptOption>;
  public cat: Required<CatOption>
  public wwc: WWCRate

  constructor(myOption?: OptionQue) {
    this.common = {
      name: 'Result',
      segmentation: true,
      delimiters: '(。|！|？|(\\. )|(\\! )|(\\? ))',
      excluding: false,
      excludePattern: '^[０-９0-9]+$',
      withSeparator: true,
    }
    this.word = {
      afterRev: true
    }
    this.excel = {
      readHiddenSheet: false,
      readFilledCell: true
    }
    this.ppt = {
      readSlide: true,
      readNote: true
    }
    this.cat = {
      locales: 'all',
      fullset: false,
      overWrite: false,
    }
    this.wwc = {
      dupli: 1,
      over95: 1,
      over85: 1,
      over75: 1,
      over50: 1,
      under49: 1,
    }
    if (myOption) {
      this.setOfficeOptions(myOption)
    }
  }

  public setOfficeOptions(myOption: OptionQue) {
    if (myOption.common !== undefined) {
      this.common.name = myOption.common.name || this.common.name
      this.common.segmentation = myOption.common.segmentation || this.common.segmentation
      this.common.delimiters = myOption.common.delimiters || this.common.delimiters
      this.common.excluding = myOption.common.excluding || this.common.excluding
      this.common.excludePattern = myOption.common.excludePattern || this.common.excludePattern
      this.common.withSeparator = myOption.common.withSeparator || this.common.withSeparator
      // if (myOption.common.name !== undefined && myOption.common.name !== '') {
      //   this.common.name = myOption.common.name;
      // }
      // if (myOption.common.segmentation !== undefined) {
      //   this.common.segmentation = myOption.common.segmentation;
      // }
      // if (myOption.common.delimiters !== undefined && myOption.common.delimiters !== '') {
      //   this.common.delimiters = myOption.common.delimiters;
      // }
      // if (myOption.common.excluding !== undefined) {
      //   this.common.excluding = myOption.common.excluding;
      // }
      // if (myOption.common.excludePattern !== undefined && myOption.common.excludePattern !== '') {
      //   this.common.excludePattern = myOption.common.excludePattern;
      // }
      // if (myOption.common.withSeparator !== undefined) {
      //   this.common.withSeparator = myOption.common.withSeparator;
      // }
    }

    if (myOption.word !== undefined) {
      this.word.afterRev = myOption.word.afterRev || this.word.afterRev
      // if (myOption.word.afterRev !== undefined) {
      //   this.word.afterRev = myOption.word.afterRev;
      // }
    }

    if (myOption.excel !== undefined) {
      this.excel.readHiddenSheet = myOption.excel.readHiddenSheet || this.excel.readHiddenSheet
      this.excel.readFilledCell = myOption.excel.readFilledCell || this.excel.readFilledCell
      // if (myOption.excel.readHiddenSheet !== undefined) {
      //   this.excel.readHiddenSheet = myOption.excel.readHiddenSheet;
      // }
      // if (myOption.excel.readFilledCell !== undefined) {
      //   this.excel.readFilledCell = myOption.excel.readFilledCell;
      // }
    }

    if (myOption.ppt !== undefined) {
      this.ppt.readSlide = myOption.ppt.readSlide || this.ppt.readSlide
      this.ppt.readNote = myOption.ppt.readNote || this.ppt.readNote
      // if (myOption.ppt.readSlide !== undefined) {
      //   this.ppt.readSlide = myOption.ppt.readSlide;
      // }
      // if (myOption.ppt.readNote !== undefined) {
      //   this.ppt.readNote = myOption.ppt.readNote;
      // }
    }

    if (myOption.cat !== undefined) {
      this.cat.fullset = myOption.cat.fullset || this.cat.fullset
      this.cat.locales = myOption.cat.locales || this.cat.locales
      this.cat.overWrite = myOption.cat.overWrite || this.cat.overWrite
    }
  }

  public setWWCOption(wwc: {
    dupli?: string | number | null,
    over95?: string | number | null,
    over85?: string | number | null,
    over75?: string | number | null,
    over50?: string | number | null,
    under49?: string | number | null,
  } | undefined | null) {
    if (wwc !== undefined && wwc !== null) {
      if (wwc.dupli !== undefined && wwc.dupli !== null) {
        this.wwc.dupli = Number(wwc.dupli)
      }
      if (wwc.over95 !== undefined && wwc.over95 !== null) {
        this.wwc.over95 = Number(wwc.over95)
      }
      if (wwc.over85 !== undefined && wwc.over85 !== null) {
        this.wwc.over85 = Number(wwc.over85)
      }
      if (wwc.over75 !== undefined && wwc.over75 !== null) {
        this.wwc.over75 = Number(wwc.over75)
      }
      if (wwc.over50 !== undefined && wwc.over50 !== null) {
        this.wwc.over95 = Number(wwc.over50)
      }
      if (wwc.under49 !== undefined && wwc.under49 !== null) {
        this.wwc.under49 = Number(wwc.under49)
      }
    }
  }

  public setCatOptions(op: CatOption) {
    this.cat = op
  }

  public createOptionQue(): Required<OptionQue> {
    return {
      common: this.common,
      word: this.word,
      excel: this.excel,
      ppt: this.ppt,
      cat: this.cat
    };
  }

  public getCommonOptions(): Pick<ReadingOption, 'common'> {
    return {
      common: this.common,
    };
  }

  public getOfficeOptions(): Pick<ReadingOption, 'word' | 'excel' | 'ppt'> {
    return {
      word: this.word,
      excel: this.excel,
      ppt: this.ppt,
    };
  }

  public getCatOptions(): Pick<ReadingOption, 'cat'> {
    return {
      cat: this.cat,
    };
  }

  public getWWCOptions(): WWCRate {
    return this.wwc
  }
}
