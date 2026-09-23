import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Bouton, Carte, Champ, ChargementLigne, Choix, Entree, Fenetre, Zone, EtatVide } from '@/components/ui';
import { format } from 'date-fns';

export function Demandes() {
  const { compte } = useAuth();
  const queryClient = useQueryClient();
  const [statut, setStatut] = useState('');
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [rejetId, setRejetId] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [veau, setVeau] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const descend = compte?.typeCompte ?? 'PERSONNEL';
  const peutCreer = descend === 'PERSONNEL';

  const liste = useQuery({
    queryKey: ['demandes', statut],
    queryFn: () => api.demandes.lister(statut ? { statut } : {}),
  });

  const invalider = () => void queryClient.invalidateQueries({ queryKey: ['demandes'] });

  const valider = useMutation({
    mutationFn: (id: string) => api.demandes.valider(id),
    onSuccess: invalider,
    onError: (e: Error) => setErr(e.message),
  });
  const rejeter = useMutation({
    mutationFn: (id: string) => api.demandes.rejeter(id, commentaire),
    onSuccess: () => { setRejetId(null); setCommentaire(''); invalider(); },
    onError: (e: Error) => setErr(e.message),
  });

  async function creer() {
    setErr(null);
    try {
      await api.demandes.creer(veau);
      setAjoutOuvert(false);
      setVeau({});
      invalider();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Demandes de modification</h1>
        <div className="flex items-center gap-2">
          <Choix value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDEE">Validée</option>
            <option value="REJETEE">Rejetée</option>
          </Choix>
          {peutCreer && <Bouton onClick={() => setAjoutOuvert(true)}>Nouvelle demande</Bouton>}
        </div>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <Carte titre={`${liste.data?.length ?? 0} demande(s)`}>
        {liste.isLoading && <ChargementLigne />}
        {!liste.isLoading && (liste.data?.length ?? 0) === 0 && <EtatVide message="Aucune demande." />}
        <ul className="divide-y divide-slate-100">
          {(liste.data ?? []).map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {d.personnel ? `${d.personnel.nom} ${d.personnel.prenoms}` : '—'}
                  <span className="ml-2 font-mono text-xs text-slate-400">{d.personnel?.matriculeRecrutement}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {d.champModifie} : « {d.ancienneValeur ?? '(vide)'} » → « {d.nouvelleValeur ?? '(vide)'} » — {format(new Date(d.dateDemande), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge couleur={d.statut === 'EN_ATTENTE' ? 'ambre' : d.statut === 'VALIDEE' ? 'vert' : 'rouge'}>
                  {d.statut === 'EN_ATTENTE' ? 'En attente' : d.statut === 'VALIDEE' ? 'Validée' : 'Rejetée'}
                </Badge>
                {' '}
                {d.statut === 'EN_ATTENTE' && (descend === 'ADMIN_SYSTEME' || descend === 'RH_ETAT_MAJOR' || descend === 'RH_BASE') && (
                  <span className="flex gap-1">
                    <button className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700" onClick={() => valider.mutate(d.id)}>
                      <Check size={12} /> Valider
                    </button>
                    <button className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700" onClick={() => setRejetId(d.id)}>
                      <X size={12} /> Rejeter
                    </button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Carte>

      {peutCreer && (
        <Fenetre ouvert={ajoutOuvert} onFermer={() => setAjoutOuvert(false)} titre="Nouvelle demande">
          <div className="space-y-3">
            <Champ label="Champ à modifier">
              <Choix value={veau.champModifie ?? ''} onChange={(e) => setVeau({ ...veau, champModifie: e.target.value })}>
                <option value="">—</option>
                <option value="telephoneMobile">Téléphone mobile</option>
                <option value="email">Adresse électronique</option>
                <option value="adresseActuelle">Adresse actuelle</option>
                <option value="statutFamilial">Situation familiale</option>
              </Choix>
            </Champ>
            <Champ label="Nouvelle valeur">
              <Entree value={veau.nouvelleValeur ?? ''} onChange={(e) => setVeau({ ...veau, nouvelleValeur: e.target.value })} required />
            </Champ>
            <Bouton className="w-full" onClick={creer} disabled={!veau.nouvelleValeur || (veau.nouvelleValeur ?? '').length === 0}>Soumettre</Bouton>
          </div>
        </Fenetre>
      )}

      <Fenetre ouvert={rejetId !== null} onFermer={() => setRejetId(null)} titre="Rejeter la demande">
        <div className="space-y-3">
          <Champ label="Motif du rejet">
            <Zone value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} />
          </Champ>
          <Bouton variante="danger" className="w-full" onClick={() => rejetId && rejeter.mutate(rejetId)}>
            Confirmer le rejet
          </Bouton>
        </div>
      </Fenetre>
    </div>
  );
}