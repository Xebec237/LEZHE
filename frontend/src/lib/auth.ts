'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, subscribeToAuth } from './api';

/**
 * État d'authentification sans erreur d'hydratation :
 * `null` pendant le rendu serveur / premier rendu, puis `true` ou `false` côté navigateur.
 * (Le frontend ne décide pas de l'autorisation : le backend vérifie le JWT à chaque appel.)
 */
export function useIsAuthenticated(): boolean | null {
  return useSyncExternalStore(
    subscribeToAuth,
    () => !!getAuthToken(),
    () => null,
  );
}

// Destination choisie lors d'une déconnexion volontaire (ex : suppression de compte -> accueil)
let signOutDestination: string | null = null;

/** Déconnecte et envoie vers `destination` (sinon les pages protégées renverraient vers /login). */
export function signOut(destination = '/login') {
  signOutDestination = destination;
  removeAuthToken();
}

/** Redirige vers /login si aucun jeton n'est présent. Renvoie true quand la page peut charger ses données. */
export function useRequireAuth(): boolean {
  const isAuth = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (isAuth !== false) return;
    router.replace(signOutDestination ?? '/login');
    signOutDestination = null;
  }, [isAuth, router]);

  return isAuth === true;
}
