// Super Admin Authorization Module for Hangloop

export const SUPER_ADMIN_EMAIL = 'milansharma942105@gmail.com';

export interface AdminAuthResult {
  isSuperAdmin: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    full_name: string;
  };
  error?: string;
}

export async function verifySuperAdmin(request: Request, env: any): Promise<AdminAuthResult> {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return { isSuperAdmin: false, error: 'Missing authorization token' };
    }

    if (!env.DB) {
      return { isSuperAdmin: false, error: 'Database unavailable' };
    }

    // 1. Lookup session token in D1 (strictly verify non-expired session)
    const sessionRow: any = await env.DB.prepare(
      `SELECT s.token, s.expires_at, u.id, u.email, u.username, u.full_name
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    ).bind(token).first();

    if (!sessionRow) {
      return { isSuperAdmin: false, error: 'Invalid or expired session' };
    }

    const userEmail = (sessionRow.email || '').toLowerCase().trim();
    if (userEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return { isSuperAdmin: false, error: 'Unauthorized: Super Admin access required' };
    }

    return {
      isSuperAdmin: true,
      user: {
        id: sessionRow.id,
        email: sessionRow.email,
        username: sessionRow.username,
        full_name: sessionRow.full_name
      }
    };
  } catch (err: any) {
    console.error('Super Admin Auth Error:', err);
    return { isSuperAdmin: false, error: err.message || 'Authentication error' };
  }
}
