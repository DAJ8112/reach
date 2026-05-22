import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const TIMEOUT_MS = 8000;
const MAX_CONTENT = 8000;

export type JdExtract = {
  title?: string;
  company?: string;
  content: string;
};

export class JdExtractError extends Error {
  constructor(public code: string, public httpStatus?: number) {
    super(code);
  }
}

export async function extractJd(url: string): Promise<JdExtract> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new JdExtractError('invalid_url');
  }
  if (!/^https?:$/.test(parsedUrl.protocol)) {
    throw new JdExtractError('invalid_protocol');
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  let html: string;
  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    if (!res.ok) {
      throw new JdExtractError('fetch_failed', res.status);
    }
    html = await res.text();
  } catch (e) {
    if (e instanceof JdExtractError) throw e;
    if (e instanceof Error && e.name === 'AbortError') throw new JdExtractError('fetch_timeout');
    throw new JdExtractError('fetch_failed');
  } finally {
    clearTimeout(timer);
  }

  // Run Readability inside a JSDOM window keyed to the fetched URL so relative
  // links resolve and Readability's heuristics see plausible page structure.
  const dom = new JSDOM(html, { url: parsedUrl.toString() });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const rawText = article?.textContent?.trim() ?? '';
  if (!rawText) {
    throw new JdExtractError('empty_extract');
  }

  // Collapse whitespace and cap.
  const content = rawText.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').slice(0, MAX_CONTENT);

  // Best-effort company guess from hostname.
  const hostBits = parsedUrl.hostname.replace(/^www\./, '').split('.');
  const companyGuess = hostBits[0] ? hostBits[0][0]!.toUpperCase() + hostBits[0].slice(1) : undefined;

  return {
    title: article?.title?.trim() || undefined,
    company: article?.siteName?.trim() || companyGuess,
    content,
  };
}
