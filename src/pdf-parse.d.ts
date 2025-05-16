declare module 'pdf-parse' {
  import { Buffer } from 'buffer';

  interface PdfMetadata {
    info: Record<string, unknown> | undefined;
    metadata: Record<string, unknown> | undefined;
    version: string;
    text: string;
  }

  function pdf(buffer: Buffer): Promise<PdfMetadata>;
  export default pdf;
}
