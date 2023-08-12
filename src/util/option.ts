export class ReadingOption implements MyOption {
  public common: Required<CommonOption>;
  public office: {
    word: Required<WordOption>;
    excel: Required<ExcelOption>;
    ppt: Required<PptOption>;
  };
  // public word: Required<WordOption>;
  // public excel: Required<ExcelOption>;
  // public ppt: Required<PptOption>;
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
    this.office = {
      word: {
        afterRev: true,
        afterRev2: true
      },
      excel: {
        readHiddenSheet: false,
        readFilledCell: true
      },
      ppt: {
        readSlide: true,
        readNote: true
      }
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
    }

    if (myOption.office !== undefined) {
      if (myOption.office.word !== undefined) {
        this.office.word.afterRev = myOption.office.word.afterRev || this.office.word.afterRev
      }

      if (myOption.office.excel !== undefined) {
        this.office.excel.readHiddenSheet = myOption.office.excel.readHiddenSheet || this.office.excel.readHiddenSheet
        this.office.excel.readFilledCell = myOption.office.excel.readFilledCell || this.office.excel.readFilledCell
      }

      if (myOption.office.ppt !== undefined) {
        this.office.ppt.readSlide = myOption.office.ppt.readSlide || this.office.ppt.readSlide
        this.office.ppt.readNote = myOption.office.ppt.readNote || this.office.ppt.readNote
      }
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
      office: this.office,
      cat: this.cat
    };
  }

  public getCommonOptions(): Pick<ReadingOption, 'common'> {
    return {
      common: this.common,
    };
  }

  public getOfficeOptions(): Pick<OfficeOption, 'word' | 'excel' | 'ppt'> {
    return {
      word: this.office.word,
      excel: this.office.excel,
      ppt: this.office.ppt,
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
