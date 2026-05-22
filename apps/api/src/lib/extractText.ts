// pdf-parse pulls in a debug `index.js` that tries to read a fixture file
// when imported via its package root. Import the lib file directly to skip it.
// @ts-expect-error no types for the deep path
import pdfParseLib from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

const PDF_MIMES = new Set(['application/pdf']);
const DOCX_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

export async function extractText(
  buf: Buffer,
  mimetype: string,
  filename: string,
): Promise<string> {
  const lower = filename.toLowerCase();
  if (PDF_MIMES.has(mimetype) || lower.endsWith('.pdf')) {
    const out = (await pdfParseLib(buf)) as { text: string };
    return out.text ?? '';
  }
  if (DOCX_MIMES.has(mimetype) || lower.endsWith('.docx') || lower.endsWith('.doc')) {
    const out = await mammoth.extractRawText({ buffer: buf });
    return out.value ?? '';
  }
  throw new Error('unsupported_filetype');
}
