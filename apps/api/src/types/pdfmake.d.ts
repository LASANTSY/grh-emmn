declare module 'pdfmake/build/pdfmake';
declare module 'pdfmake/build/vfs_fonts';
declare module 'pdfmake/interfaces' {
  export interface Content {}
  export interface ContentText {}
  export interface TDocumentDefinitions {
    content: unknown;
    styles?: Record<string, unknown>;
    defaultStyle?: Record<string, unknown>;
  }
}