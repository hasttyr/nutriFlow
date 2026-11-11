import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http.js';

// Signed role tokens (HMAC-SHA256, the same idea as a JWT) checked on every command: access
// control by role. shortcut: the demo issues a token for any role without a password; a real
// deployment puts an identity provider in front of POST /session.
const SECRET = process.env.SECRET ?? 'nutriflow-dev-secret';
const ROLES = ['customer', 'merchant', 'courier', 'admin'];
const DAY = 24 * 60 * 60 * 1000;

const sign = (payload) => createHmac('sha256', SECRET).update(payload).digest('base64url');

export const issueToken = (role) => {
  if (!ROLES.includes(role)) throw new HttpError(400, 'Unknown role');
  const payload = Buffer.from(JSON.stringify({ role, exp: Date.now() + DAY })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

export const verifyToken = (token) => {
  const [payload, signature] = String(token ?? '').split('.');
  const expected = payload ? sign(payload) : '';
  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new HttpError(401, 'Invalid token');
  }
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (claims.exp < Date.now()) throw new HttpError(401, 'Expired token');
  return claims;
};

// The admin may act for anyone (consoles, autopilot); everyone else only as themselves.
export const requireRole = (req, ...roles) => {
  const claims = verifyToken(req.headers.authorization?.replace(/^Bearer /, ''));
  if (claims.role !== 'admin' && !roles.includes(claims.role)) throw new HttpError(403, `Needs role ${roles.join(' or ')}`);
  return claims;
};
