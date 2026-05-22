import type { Request, Response, NextFunction } from 'express';
import { getUserFromJwt } from '../lib/supabase.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'missing_authorization' });
    return;
  }
  const user = await getUserFromJwt(token);
  if (!user) {
    res.status(401).json({ error: 'invalid_token' });
    return;
  }
  req.userId = user.id;
  req.userEmail = user.email;
  next();
}
