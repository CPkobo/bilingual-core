export class ReadingOption {
  public common: CommonOption;
  public word: WordOption;
  public excel: ExcelOption;
  public ppt: PptOption;

  constructor(myOption: OptionQue) {
    this.common = {
      name: 'Result',
      segmentation: true,
      delimiters: '(\\。|\\. |\\! |\\? |\\！|\\？)',
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
      readNote: true
    }
    this.readOptionQue(myOption)
  }

  public readOptionQue(myOption: OptionQue) {
    if (myOption.common !== undefined) {
      if (myOption.common.name !== undefined && myOption.common.name !== '') {
          this.common.name = myOption.common.name;
      }
      if (myOption.common.segmentation !== undefined) {
        this.common.segmentation = myOption.common.segmentation;
      }
      if (myOption.common.delimiters !== undefined && myOption.common.delimiters !== '') {
        this.common.delimiters = myOption.common.delimiters;
      }
      if (myOption.common.excluding !== undefined) {
        this.common.excluding = myOption.common.excluding;
      }
      if (myOption.common.excludePattern !== undefined && myOption.common.excludePattern !== '') {
        this.common.excludePattern = myOption.common.excludePattern;
      }
      if (myOption.common.withSeparator !== undefined) {
        this.common.withSeparator = myOption.common.withSeparator;
      }
    }
    
    if (myOption.word !== undefined) {
      if (myOption.word.afterRev !== undefined) {
        this.word.afterRev = myOption.word.afterRev;
      }
    }
    
    if (myOption.excel !== undefined) {
      if (myOption.excel.readHiddenSheet !== undefined) {
        this.excel.readHiddenSheet = myOption.excel.readHiddenSheet;
      }
      if (myOption.excel.readFilledCell !== undefined) {
        this.excel.readFilledCell = myOption.excel.readFilledCell;
      }
    }
    
    if (myOption.ppt !== undefined) {
      if (myOption.ppt.readNote !== undefined) {
        this.ppt.readNote = myOption.ppt.readNote;
      }
    }
  }

  public createOptionQue(): OptionQue {
    return {
      common: this.common,
      word: this.word,
      excel: this.excel,
      ppt: this.ppt
    };
  }
}
