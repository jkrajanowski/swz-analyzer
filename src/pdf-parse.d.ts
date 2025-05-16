declare module 'pdf-parse' {
  import { Buffer } from 'buffer';

  interface PdfMetadata {
    info: any;
    metadata: any;
    version: string;
    text: string;
  }

  function pdf(buffer: Buffer): Promise<PdfMetadata>;
  export default pdf;
}
