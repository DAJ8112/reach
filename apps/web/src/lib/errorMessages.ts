export const ERROR_MESSAGES: Record<string, string> = {
  unsupported_filetype: 'Only PDF and DOCX are supported.',
  empty_extract: 'Could not read text from this file. Try a different export.',
  parse_failed: 'The parser failed. Try again or use a cleaner export.',
  missing_file: 'No file received.',
  http_413: 'File too large. Max 10MB.',
  api_unreachable: "Can't reach the API. Is the server running?",
  invalid_url: 'That URL looks invalid.',
  invalid_protocol: 'URL must start with http:// or https://.',
  fetch_failed: 'Could not fetch that page.',
  fetch_timeout: 'Page took too long to load.',
  needs_manual: 'Could not read the URL — paste the JD text instead.',
  unauthorized: 'You are signed out. Sign in again.',
};

export function friendlyError(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? code;
}
