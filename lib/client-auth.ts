export function getClientAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const headers: Record<string, string> = {};
  const csrfToken = window.localStorage.getItem('csrfToken');
  const userId = window.localStorage.getItem('userId');
  const role = window.localStorage.getItem('role');

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  if (userId) {
    headers['X-Client-User-Id'] = userId;
  }

  if (role) {
    headers['X-Client-User-Role'] = role;
  }

  return headers;
}