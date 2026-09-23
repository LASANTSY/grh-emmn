import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Bouton, Carte, Choix, ChargementLigne, EtatVide } from '@/components/ui';
import { format } from 'date-fns';

export function Audit() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const resultat = useQuery({
    queryKey: ['audit', action, page],
    queryFn: () => api.audit.lister({ action: action || undefined, page, pageSize: 25 }),
  });

  const lignes = resultat.data?.lignes ?? [];
  const total = resultat.data?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Journal d'audit</h1>
        <div className="flex gap-2">
          <Choix value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="">Toutes actions</option>
            <option value="CONNEXION">Connexion</option>
            <option value="CREATION">Création</option>
            <option value="MODIFICATION">Modification</option>
            <option value="SUPPRESSION">Suppression</option>
            <option value="VALIDATION">Validation</option>
            <option value="REJET">Rejet</option>
            <option value="IMPORT">Import</option>
            <option value="EXPORT">Export</option>
            <option value="TELEVERSEMENT">Dépôt document</option>
            <option value="TELECHARGEMENT">Téléchargement</option>
          </Choix>
          <Bouton variante="secondaire" onClick={() => void api.audit.exporter()}>
            <Download size={15} /> Exporter CSV
          </Bouton>
        </div>
      </div>

      <Carte titre={`${total} entrées`}>
        {resultat.isLoading && <ChargementLigne />}
        {!resultat.isLoading && lignes.length === 0 && <EtatVide message="Aucun événement." />}
        {lignes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-entete border-b border-slate-200 bg-slate-50">
                <tr>
                  <th>Date</th><th>Action</th><th>Entité</th><th>Champ</th><th>Ancienne → Nouvelle</th><th>Acteur</th><th>IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignes.map((l) => (
                  <tr key={l.id} className="table-ligne">
                    <td className="cellule-table whitespace-nowrap text-xs text-slate-500">
                      {format(new Date(l.dateHeure), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="cellule-table">
                      <Badge couleur={l.action === 'CONNEXION' ? 'bleu' : 'gris'}>{l.action}</Badge>
                    </td>
                    <td className="cellule-table text-xs text-slate-600">
                      {l.entite}{l.entiteId ? ` (${l.entiteId.slice(-6)})` : ''}
                    </td>
                    <td className="cellule-table text-xs text-slate-500">{l.champModifie ?? '—'}</td>
                    <td className="cellule-table text-xs text-slate-500">
                      {l.ancienneValeur || l.nouvelleValeur ? `${l.ancienneValeur ?? '∅'} → ${l.nouvelleValeur ?? '∅'}` : '—'}
                    </td>
                    <td className="cellule-table text-xs">{l.compte?.identifiant ?? '—'}</td>
                    <td className="cellule-table font-mono text-xs text-slate-400">{l.ip ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 25 && (
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">Page {page}</p>
            <div className="flex gap-2">
              <button className="text-sm text-marine-700" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Précédent</button>
              <button className="text-sm text-marine-700" disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)}>Suivant →</button>
            </div>
          </div>
        )}
      </Carte>
    </div>
  );
}