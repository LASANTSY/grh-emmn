import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookUser, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Bouton, Carte, ChargementLigne, Entree, EtatVide } from '@/components/ui';

export function Annuaire() {
  const [q, setQ] = useState('');

  const annuaire = useQuery({
    queryKey: ['annuaire'],
    queryFn: () => api.personnel.annuaire({ pageSize: 500 }),
  });

  const filtres = (annuaire.data?.items ?? []).filter((p: any) => {
    if (!q.trim()) return true;
    const texte = `${p.nom ?? ''} ${p.prenoms ?? ''} ${p.matriculeRecrutement ?? ''}`.toLowerCase();
    return texte.includes(q.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Annuaire du personnel</h1>
          <p className="mt-1 text-sm text-slate-500">
            Répertoire public accessible au personnel : matricule, grade, spécialité et affectation.
          </p>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2">
          <Entree
            placeholder="Nom, prénom ou matricule…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Bouton><Search size={15} /></Bouton>
        </div>
      </div>

      <Carte titre={`${filtres.length} personnel`}>
        {annuaire.isLoading && <ChargementLigne />}
        {annuaire.isError && <EtatVide message="Annuaire indisponible." />}
        {!annuaire.isLoading && !annuaire.isError && filtres.length === 0 && <EtatVide message="Aucun résultat." />}
        {filtres.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-entete border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left">Matricule</th>
                  <th className="text-left">Nom et prénoms</th>
                  <th className="hidden text-left md:table-cell">Grade</th>
                  <th className="hidden text-left lg:table-cell">Spécialité</th>
                  <th className="text-left">Unité / Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtres.map((p: any) => (
                  <tr key={p.id} className="table-ligne">
                    <td className="cellule-table font-mono text-xs text-slate-600">{p.matriculeRecrutement}</td>
                    <td className="cellule-table">
                      <Link to={`/personnel/${p.id}`} className="font-medium text-marine-800 hover:underline">
                        {p.nom} {p.prenoms}
                      </Link>
                    </td>
                    <td className="cellule-table hidden text-xs text-slate-700 md:table-cell">{p.grade?.libelle ?? '—'}</td>
                    <td className="cellule-table hidden text-xs text-slate-700 lg:table-cell">{p.specialite?.libelle ?? '—'}</td>
                    <td className="cellule-table text-xs text-slate-700">
                      {p.unite?.nom ?? '—'}{p.unite?.base?.nom ? ` (${p.unite.base.nom})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <BookUser size={13} /> Les coordonnées privées (adresse, CIN, situations) ne figurent pas dans l’annuaire public.
      </p>
    </div>
  );
}