"use strict";
exports.__esModule = true;
exports.ReadingOption = void 0;
var ReadingOption = /** @class */ (function () {
    function ReadingOption(myOption) {
        this.name =
            myOption.name !== undefined && myOption.name !== ''
                ? myOption.name : 'Result';
        this.segmentation =
            myOption.segmentation !== undefined
                ? myOption.segmentation : true;
        this.delimiters =
            myOption.delimiters !== undefined && myOption.delimiters !== ''
                ? myOption.delimiters : '(\\。|\\. |\\! |\\? |\\！|\\？)';
        this.excluding =
            myOption.excluding !== undefined
                ? myOption.excluding : false;
        this.exclusion =
            myOption.exclusion !== undefined && myOption.exclusion !== ''
                ? myOption.exclusion : '^[０-９0-9]+$';
        this.wordRev =
            myOption.wordRev !== undefined
                ? myOption.wordRev : true;
        this.excelReadHidden =
            myOption.excelReadHidden !== undefined
                ? myOption.excelReadHidden : false;
        this.excelReadFilled =
            myOption.excelReadFilled !== undefined
                ? myOption.excelReadFilled : true;
        this.pptNote =
            myOption.pptNote !== undefined
                ? myOption.pptNote : true;
        this.withSeparator =
            myOption.withSeparator !== undefined
                ? myOption.withSeparator : true;
    }
    ReadingOption.prototype.readOptionQue = function (myOption) {
        if (myOption.name !== undefined && myOption.name !== '') {
            this.name = myOption.name;
        }
        if (myOption.segmentation !== undefined) {
            this.segmentation = myOption.segmentation;
        }
        if (myOption.delimiters !== undefined && myOption.delimiters !== '') {
            this.delimiters = myOption.delimiters;
        }
        if (myOption.excluding !== undefined) {
            this.excluding = myOption.excluding;
        }
        if (myOption.exclusion !== undefined && myOption.exclusion !== '') {
            this.exclusion = myOption.exclusion;
        }
        if (myOption.wordRev !== undefined) {
            this.wordRev = myOption.wordRev;
        }
        if (myOption.excelReadHidden !== undefined) {
            this.excelReadHidden = myOption.excelReadHidden;
        }
        if (myOption.excelReadFilled !== undefined) {
            this.excelReadFilled = myOption.excelReadFilled;
        }
        if (myOption.pptNote !== undefined) {
            this.pptNote = myOption.pptNote;
        }
        if (myOption.withSeparator !== undefined) {
            this.withSeparator = myOption.withSeparator;
        }
    };
    ReadingOption.prototype.createOptionQue = function () {
        return {
            name: this.name,
            segmentation: this.segmentation,
            delimiters: this.delimiters,
            excluding: this.excluding,
            exclusion: this.exclusion,
            wordRev: this.wordRev,
            excelReadHidden: this.excelReadHidden,
            excelReadFilled: this.excelReadFilled,
            pptNote: this.pptNote,
            withSeparator: this.withSeparator
        };
    };
    return ReadingOption;
}());
exports.ReadingOption = ReadingOption;
