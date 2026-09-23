import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/http';
import type { CompteMe } from '@/lib/types';

interface AuthState {
  compte: CompteMe | null;
  chargement: boolean;
  connecte: boolean;
  seConnecter: (identifiant: string, motDePasse: string) => Promise<void>;
  seDeconnecter: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [compte, setCompte] = useState<CompteMe | null>(null);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    try {
      const info = await api.auth.me();
      setCompte(info);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setCompte(null);
      } else {
        setCompte(null);
      }
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  const seConnecter = useCallback(async (identifiant: string, motDePasse: string) => {
    const { compte: info } = await api.auth.login(identifiant, motDePasse);
    setCompte(info);
  }, []);

  const seDeconnecter = useCallback(async () => {
    try {
      await api.auth.deconnexion();
    } catch {
      /* cookie expiré ou serveur injoignable : on nettoie localement */
    }
    setCompte(null);
  }, []);

  return (
    <AuthContext.Provider value={{ compte, chargement, connecte: compte !== null, seConnecter, seDeconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé sous <AuthProvider>.');
  return ctx;
}