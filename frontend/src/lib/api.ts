export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TOKEN_KEY = 'lezhe_token';
const AUTH_EVENT = 'lezhe-auth-change';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function removeAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function subscribeToAuth(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const NETWORK_ERROR = 'Impossible de joindre le serveur Lezhe. Vérifie ta connexion puis réessaie.';

async function request(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError(NETWORK_ERROR, 0);
  }

  if (response.status === 401 && token && !endpoint.startsWith('/auth/')) {
    // Jeton expiré ou compte supprimé : les pages protégées (useRequireAuth) redirigent alors vers /login
    removeAuthToken();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const raw = body.message;
    const message = Array.isArray(raw) ? raw.join(', ') : raw;
    throw new ApiError(
      response.status >= 500 || !message ? 'Un petit problème est survenu. Ton travail n’est pas perdu.' : message,
      response.status,
    );
  }

  return response;
}

export async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await request(endpoint, options);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

// Téléchargement authentifié d'un fichier (le PDF n'est pas exposé publiquement)
export async function apiDownload(endpoint: string, filename: string) {
  const response = await request(endpoint);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function errorMessage(err: unknown, fallback = 'Un petit problème est survenu. Ton travail n’est pas perdu.') {
  return err instanceof Error && err.message ? err.message : fallback;
}
