import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { TypeCompte } from '@/lib/types';

const ROLES_ACTIFS: TypeCompte[] = ['ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'PERSONNEL'];

export function RequisRole({ roles = ROLES_ACTIFS, children }: { roles?: TypeCompte[]; children: ReactNode }) {
  const { compte, chargement } = useAuth();
  if (chargement) return null;
  if (!compte) return <Navigate to="/connexion" replace />;
  if (!roles.includes(compte.typeCompte)) {
    return <Navigate to="/" replace state={{ refus: true }} />;
  }
  return <>{children}</>;
}

/** Les pages accessibles selon le profil (menu latéral). */
export function pagesPourRole(type: TypeCompte): string[] {
  switch (type) {
    case 'ADMIN_SYSTEME':
    case 'RH_ETAT_MAJOR':
      return ['/', '/annuaire', '/effectifs', '/referentiels', '/utilisateurs', '/demandes', '/audit', '/rapports'];
    case 'RH_BASE':
      return ['/', '/annuaire', '/effectifs', '/referentiels', '/demandes', '/audit'];
    case 'CHEF_COMMANDEMENT':
      return ['/', '/annuaire', '/effectifs', '/demandes'];
    case 'PERSONNEL':
    default:
      return ['/', '/annuaire', '/demandes'];
  }
}