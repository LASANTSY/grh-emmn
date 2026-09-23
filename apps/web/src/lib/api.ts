import { http, telecharger } from './http';
import type {
  AnalyseImport, Base, CompteMe, DemandeModification, EntreeAudit, FinDeLienAlerte,
  Grade, ImportHistorique, LoginResponse, ResultatsPage, PersonnelLigne, Specialite,
  Unite, Utilisateur,
} from './types';

export const { http: rawHttp } = { http }; // passthrough générique

export async function multipart(path: string, fichier: File, type?: string | null): Promise<unknown> {
  const fd = new FormData();
  fd.append('fichier', fichier);
  if (type) fd.append('type', type);
  return http(path, { method: 'POST', formData: fd });
}

export const api = {
  auth: {
    login: (identifiant: string, motDePasse: string) =>
      http<LoginResponse>('/auth/login', { method: 'POST', body: { identifiant, motDePasse } }),
    me: async (): Promise<CompteMe> => {
      const rep = await http<{ compte: CompteMe; permissions: string[]; perimetre: unknown }>('/auth/me');
      return rep.compte;
    },
    deconnexion: () => http<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  },

  personnel: {
    rechercher: (params: Record<string, string | number | boolean | undefined | null>) =>
      http<ResultatsPage<PersonnelLigne>>('/personnel/rechercher', { query: params }),
    detail: (id: string) => http<any>(`/personnel/${id}`),
    creer: (body: unknown) => http<{ id: string; identifiant?: string; motDePasseProvisoire?: string }>('/personnel', { method: 'POST', body }),
    modifier: (id: string, body: unknown) => http<void>(`/personnel/${id}`, { method: 'PATCH', body }),
    supprimer: (id: string) => http<void>(`/personnel/${id}`, { method: 'DELETE' }),
    doublons: () => http<Record<string, unknown>[]>('/personnel/doublons'),
    finDeLien: (statut: 'DANS_1_AN' | 'DANS_2_ANS' | 'RETRAITE') =>
      http<FinDeLienAlerte[]>(`/personnel/fin-de-lien?statut=${statut}`),
  },

  onglets: {
    lister: (id: string, cle: string) => http<unknown[]>(`/personnel/${id}/${cle}`),
    creer: (id: string, cle: string, body: unknown) =>
      http<unknown>(`/personnel/${id}/${cle}`, { method: 'POST', body }),
    modifier: (id: string, cle: string, itemId: string, body: unknown) =>
      http<unknown>(`/personnel/${id}/${cle}/${itemId}`, { method: 'PATCH', body }),
    supprimer: (id: string, cle: string, itemId: string) =>
      http<unknown>(`/personnel/${id}/${cle}/${itemId}`, { method: 'DELETE' }),
  },

  referentiels: {
    bases: () => http<Base[]>('/bases'),
    unites: () => http<Unite[]>('/unites'),
    grades: () => http<Grade[]>('/grades'),
    specialites: () => http<Specialite[]>('/specialites'),
  },

  utilisateurs: {
    lister: () => http<Utilisateur[]>('/utilisateurs'),
    creer: (body: unknown) => http<unknown>('/utilisateurs', { method: 'POST', body }),
    modifier: (id: string, body: unknown) => http<unknown>(`/utilisateurs/${id}`, { method: 'PATCH', body }),
  },

  demandes: {
    lister: (params?: Record<string, string | number | boolean | undefined | null>) =>
      http<DemandeModification[]>('/demandes', { query: params }),
    creer: (body: unknown) => http<unknown>('/demandes', { method: 'POST', body }),
    valider: (id: string) => http<unknown>(`/demandes/${id}/valider`, { method: 'PATCH', body: {} }),
    rejeter: (id: string, commentaire: string) =>
      http<unknown>(`/demandes/${id}/rejeter`, { method: 'PATCH', body: { commentaire } }),
  },

  audit: {
    lister: (params: Record<string, string | number | boolean | undefined | null>) =>
      http<{ total: number; page: number; pageSize: number; lignes: EntreeAudit[] }>('/audit', { query: params }),
    exporter: () => telecharger('/audit/export', `audit_${new Date().toISOString().slice(0, 10)}.csv`),
  },

  imports: {
    gabarit: () => telecharger('/imports/gabarit', 'gabarit_personnel.xlsx'),
    analyser: (fichier: File) => {
      const fd = new FormData();
      fd.append('fichier', fichier);
      return http<AnalyseImport>('/imports', { method: 'POST', formData: fd });
    },
    valider: (importId: string) => http<unknown>(`/imports/${importId}/valider`, { method: 'POST' }),
    historique: () => http<ImportHistorique[]>('/imports/historique'),
  },

  rapports: {
    excel: () => telecharger('/rapports/personnel-excel', 'effectifs_personnel.xlsx'),
    pdf: () => telecharger('/rapports/effectifs-pdf', 'rapport_effectifs.pdf'),
  },

  dashboard: {
    synthese: () => http<any>('/dashboard/synthese'),
    parBase: () => http<any[]>('/dashboard/par-base'),
    pyramide: () => http<any[]>('/dashboard/pyramide'),
    evolution: () => http<any[]>('/dashboard/evolution'),
  },
};