import { toast } from 'sonner';
import { ApiError } from './api.js';
import { friendlyError } from './errorMessages.js';

export { toast };

export function toastApiError(e: unknown, fallback = 'Something went wrong'): string {
  let msg: string;
  if (e instanceof ApiError) {
    msg = friendlyError(e.message, fallback);
  } else if (e instanceof Error) {
    msg = e.message || fallback;
  } else if (typeof e === 'string') {
    msg = friendlyError(e, fallback);
  } else {
    msg = fallback;
  }
  toast.error(msg);
  return msg;
}
