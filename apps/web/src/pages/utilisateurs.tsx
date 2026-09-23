import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import type { TypeCompte } from '@/lib/types';
import { Badge, Bouton, Carte, Champ, ChargementLigne, Choix, Entree, Fenetre } from '@/components/ui';
import { format } from 'date-fns';

const ROLES: Array<{ v: TypeCompte; l: string }> = [
  { v: 'ADMIN_SYSTEME', l: 'Administrateur système' },
  { v: 'RH_ETAT_MAJOR', l: 'RH État-Major' },
  { v: 'RH_BASE', l: 'RH Base' },
  { v: 'CHEF_COMMANDEMENT', l: 'Chef de commandement' },
  { v: 'PERSONNEL', l: 'Personnel' },
];

export function Utilisateurs() {
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [res, setRes] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [valeurs, setValeurs] = useState({ personnelId: '', identifiant: '', typeCompte: 'PERSONNEL' as TypeCompte, uniteId: '' });

  const liste = useQuery({ queryKey: ['utilisateurs'], queryFn: () => api.utilisateurs.lister() });
  const personnel = useQuery({ queryKey: ['personnel', 'tous'], queryFn: () => api.personnel.rechercher({ pageSize: 200, page: 1 }) });
  const unites = useQuery({ queryKey: ['unites'], queryFn: () => api.referentiels.unites() });

  async function creer() {
    setErr(null); setRes(null);
    try {
      const r = await api.utilisateurs.creer({ ...valeurs, uniteId: valeurs.uniteId || null });
      setRes(`Compte créé — identifiant : ${(r as any).compte?.identifiant ?? ''} — mot de passe provisoire : ${(r as any).motDePasseProvisoire ?? ''}`);
      void queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function actif(id: string, actuellement: boolean) {
    try {
      await api.utilisateurs.modifier(id, { actif: !actuellement });
      void queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
    } catch { /* ignorer */ }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Gestion des comptes</h1>
        <Bouton onClick={() => setOuvert(true)}>Nouveau compte</Bouton>
      </div>

      <Carte titre={`${liste.data?.length ?? 0} compte(s)`}>
        {liste.isLoading && <ChargementLigne />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-entete border-b border-slate-200 bg-slate-50">
              <tr><th>Identifiant</th><th>Profil</th><th>Statut</th><th>Nom</th><th>Dernier accès</th><th></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(liste.data ?? []).map((u) => (
                <tr key={u.id} className="table-ligne">
                  <td className="cellule-table font-mono text-xs">{u.identifiant}</td>
                  <td className="cellule-table text-xs">{ROLES.find((r) => r.v === u.typeCompte)?.l ?? u.typeCompte}</td>
                  <td className="cellule-table">
                    {u.compteVerrouille ? <Badge couleur="rouge">Verrouillé</Badge>
                      : u.actif ? <Badge couleur="vert">Actif</Badge>
                      : <Badge>Désactivé</Badge>}
                    {u.doitChangerMotDePasse && <span className="ml-1"><Badge couleur="ambre">mdp provisoire</Badge></span>}
                  </td>
                  <td className="cellule-table text-xs text-slate-600">{u.personnel ? `${u.personnel.prenoms} ${u.personnel.nom}` : '—'}</td>
                  <td className="cellule-table text-xs text-slate-500">{u.dateDernierAcces ? format(new Date(u.dateDernierAcces), 'dd/MM/yyyy HH:mm') : '—'}</td>
                  <td className="cellule-table text-right">
                    <button className="text-xs text-marine-700 hover:underline" onClick={() => void actif(u.id, !!u.actif)}>
                      {u.actif ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>

      <Fenetre ouvert={ouvert} onFermer={() => setOuvert(false)} titre="Créer un compte">
        <div className="space-y-3">
          <Champ label="Fiche personnel">
            <Choix value={valeurs.personnelId} onChange={(e) => setValeurs({ ...valeurs, personnelId: e.target.value })}>
              <option value="">—</option>
              {(personnel.data?.items ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.matriculeRecrutement} — {p.nom} {p.prenoms}</option>
              ))}
            </Choix>
          </Champ>
          <Champ label="Identifiant">
            <Entree value={valeurs.identifiant} onChange={(e) => setValeurs({ ...valeurs, identifiant: e.target.value })} required />
          </Champ>
          <Champ label="Profil">
            <Choix value={valeurs.typeCompte} onChange={(e) => setValeurs({ ...valeurs, typeCompte: e.target.value as TypeCompte })}>
              {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
            </Choix>
          </Champ>
          {valeurs.typeCompte !== 'ADMIN_SYSTEME' && valeurs.typeCompte !== 'PERSONNEL' && valeurs.typeCompte !== 'RH_ETAT_MAJOR' && (
            <Champ label="Périmètre (RH_BASE / CHEF)">
              <Choix value={valeurs.uniteId} onChange={(e) => setValeurs({ ...valeurs, uniteId: e.target.value })}>
                <option value="">—</option>
                {(unites.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
              </Choix>
            </Champ>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
          {res && <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800"><KeyRound size={12} className="inline" /> {res}</p>}
          <Bouton className="w-full" onClick={creer}>Créer le compte</Bouton>
        </div>
      </Fenetre>
    </div>
  );
}