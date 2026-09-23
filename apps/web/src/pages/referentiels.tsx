import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Badge, Carte, ChargementLigne } from '@/components/ui';

export function Referentiels() {
  const { t } = useTranslation();
  const bases = useQuery({ queryKey: ['bases'], queryFn: () => api.referentiels.bases() });
  const grades = useQuery({ queryKey: ['grades'], queryFn: () => api.referentiels.grades() });
  const specialites = useQuery({ queryKey: ['specialites'], queryFn: () => api.referentiels.specialites() });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">{t('menu.referentiels')}</h1>

      <Carte titre={`Grades et limites d'âge (${grades.data?.length ?? 0})`}>
        {grades.isLoading && <ChargementLigne />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-entete border-b border-slate-200 bg-slate-50">
              <tr><th>Grade</th><th>Catégorie</th><th>Limite d'âge</th><th>Ordre</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(grades.data ?? []).map((g) => (
                <tr key={g.id} className="table-ligne">
                  <td className="cellule-table">{g.libelle}</td>
                  <td className="cellule-table"><Badge>{t(`grades.${g.categorie}`)}</Badge></td>
                  <td className="cellule-table">{g.ageDepartRetraite} ans</td>
                  <td className="cellule-table text-xs text-slate-500">{g.ordre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>

      <Carte titre={`Bases et unités (${bases.data?.length ?? 0} base(s))`}>
        {bases.isLoading && <ChargementLigne />}
        <div className="grid gap-4 md:grid-cols-2">
          {(bases.data ?? []).map((b) => (
            <div key={b.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-semibold text-slate-800">{b.nom}</p>
              <p className="text-xs text-slate-500">{b.ville}</p>
              <ul className="mt-2 space-y-1">
                {(b.unites ?? []).map((u) => (
                  <li key={u.id} className="flex justify-between text-sm">
                    <span>{u.nom}</span>
                    <span className="font-mono text-xs text-slate-400">{u.code}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Carte>

      <Carte titre={`Spécialités (${specialites.data?.length ?? 0})`}>
        {specialites.isLoading && <ChargementLigne />}
        <div className="flex flex-wrap gap-2">
          {(specialites.data ?? []).map((s) => (
            <span key={s.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{s.libelle}</span>
          ))}
        </div>
      </Carte>
    </div>
  );
}