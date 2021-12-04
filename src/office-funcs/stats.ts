export class FileStats {
  public name: string;
  public format: 'docx' | 'xlsx' | 'pptx' | '';
  public doc_para: number;
  public doc_table: number;
  public xl_sheet: number;
  public xl_shape: number;
  public ppt_slide: number;
  public ppt_dgm: number;
  public ppt_note: number;

  constructor(name: string, format: 'docx' | 'xlsx' | 'pptx' | '') {
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

  public countElement(ext: ExtractedText) {
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

  }
}
