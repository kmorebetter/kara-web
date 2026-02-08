declare module "pdf-parse/lib/pdf-parse.js" {
  interface PDFResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  }
  function pdf(dataBuffer: Buffer): Promise<PDFResult>;
  export = pdf;
}
