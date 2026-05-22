import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const TIMEOUT_MS = 8000;
const MAX_CONTENT = 8000;
const MAX_REDIRECTS = 3;

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

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function isPrivateV4(ip: string): boolean {
  const n = ipToInt(ip);
  // 0.0.0.0/8, 10/8, 127/8, 169.254/16, 172.16/12, 192.168/16, 100.64/10 (CGNAT),
  // 192.0.0.0/24, 192.0.2.0/24, 198.18/15, 198.51.100/24, 203.0.113/24, 224/4, 240/4, 255.255.255.255.
  const ranges: Array<[string, number]> = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
  ];
  for (const [base, bits] of ranges) {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    if ((n & mask) === (ipToInt(base) & mask)) return true;
  }
  return false;
}

function isPrivateV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  // IPv4-mapped (::ffff:a.b.c.d) — defer to v4 check.
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]!);
  // fc00::/7 (unique local), fe80::/10 (link-local), ff00::/8 (multicast),
  // 2001:db8::/32 (docs), ::/8 (reserved incl. v4-compat).
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // fc00::/7
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // fe80::/10
  if (/^ff[0-9a-f]{2}:/.test(lower)) return true; // ff00::/8
  if (/^2001:0?db8:/.test(lower)) return true;
  return false;
}

function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isPrivateV4(ip);
  if (v === 6) return isPrivateV6(ip);
  return true; // unknown — fail closed
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new JdExtractError('blocked_host');
    return;
  }
  let addrs: Array<{ address: string }>;
  try {
    addrs = await dnsLookup(hostname, { all: true });
  } catch {
    throw new JdExtractError('dns_failed');
  }
  if (!addrs.length) throw new JdExtractError('dns_failed');
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new JdExtractError('blocked_host');
  }
}

async function guardedFetch(initialUrl: URL, signal: AbortSignal): Promise<{ html: string }> {
  let current = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!/^https?:$/.test(current.protocol)) throw new JdExtractError('invalid_protocol');
    await assertPublicHost(current.hostname);
    const res = await fetch(current.toString(), {
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
      },
      signal,
      redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) throw new JdExtractError('fetch_failed', res.status);
      try {
        current = new URL(loc, current);
      } catch {
        throw new JdExtractError('fetch_failed', res.status);
      }
      continue;
    }
    if (!res.ok) throw new JdExtractError('fetch_failed', res.status);
    return { html: await res.text() };
  }
  throw new JdExtractError('too_many_redirects');
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
    const out = await guardedFetch(parsedUrl, ctrl.signal);
    html = out.html;
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
