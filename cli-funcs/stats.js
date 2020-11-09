"use strict";
exports.__esModule = true;
exports.FileStats = void 0;
var FileStats = /** @class */ (function () {
    function FileStats(name, format) {
        this.name = name;
        this.format = format;
        this.doc_para = 0;
        this.doc_table = 0;
        this.xl_sheet = 0;
        this.xl_shape = 0;
        this.ppt_slide = 0;
        this.ppt_dgm = 0;
        this.ppt_note = 0;
    }
    FileStats.prototype.countElement = function (ext) {
        if (ext.isActive) {
            switch (ext.type) {
                case 'Word-Paragraph':
                    this.doc_para++;
                    break;
                case 'Word-Table':
                    this.doc_table++;
                    break;
                case 'Excel-Sheet':
                    this.xl_sheet++;
                    break;
                case 'Excel-Shape':
                    this.xl_shape++;
                    break;
                case 'PPT-Slide':
                    this.ppt_slide++;
                    break;
                case 'PPT-Diagram':
                    this.ppt_dgm++;
                    break;
                case 'PPT-Note':
                    this.ppt_note++;
                    break;
                default:
                    break;
            }
        }
    };
    return FileStats;
}());
exports.FileStats = FileStats;
