import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Users, UserCog, CalendarClock } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { Badge, Carte, ChargementLigne, EtatVide } from '@/components/ui';
import { format } from 'date-fns';

const COULEURS_FIN = {
  DANS_1_AN: 'ambre',
  DANS_2_ANS: 'violet',
  RETRAITE: 'rouge',
} as const;

export function TableauDeBord() {
  const { t } = useTranslation();

  const synthèse = useQuery({ queryKey: ['dashboard', 'synthese'], queryFn: () => api.dashboard.synthese() });
  const parBase = useQuery({ queryKey: ['dashboard', 'parBase'], queryFn: () => api.dashboard.parBase() });
  const pyramide = useQuery({ queryKey: ['dashboard', 'pyramide'], queryFn: () => api.dashboard.pyramide() });
  const evolution = useQuery({ queryKey: ['dashboard', 'evolution'], queryFn: () => api.dashboard.evolution() });
  const alertes1 = useQuery({ queryKey: ['finlien', 'DANS_1_AN'], queryFn: () => api.personnel.finDeLien('DANS_1_AN') });
  const alertes2 = useQuery({ queryKey: ['finlien', 'DANS_2_ANS'], queryFn: () => api.personnel.finDeLien('DANS_2_ANS') });
  const retirees = useQuery({ queryKey: ['finlien', 'RETRAITE'], queryFn: () => api.personnel.finDeLien('RETRAITE') });

  const s = synthèse.data ?? {};
  const kartes = [
    { titre: "Effectif total", valeur: s.effectif ?? '—', icone: <Users size={18} />, ditail: `${s.officiers ?? 0} officiers` },
    { titre: "Officiers", valeur: s.officiers ?? '—', icone: <UserCog size={18} />, ditail: `${s.qmo ?? 0} QMO / matelots` },
    { titre: "Recrutés cette année", valeur: s.recrutesAnnee ?? '—', icone: <CalendarClock size={18} />, ditail: 'année civile' },
  ];

  const alertes = [
    ...(alertes1.data ?? []).map((a) => ({ ...a, st: 'DANS_1_AN' as const })),
    ...(alertes2.data ?? []).map((a) => ({ ...a, st: 'DANS_2_ANS' as const })),
    ...(retirees.data ?? []).map((a) => ({ ...a, st: 'RETRAITE' as const })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{t('menu.tableauDeBord')}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {kartes.map((k) => (
          <Carte key={k.titre}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">{k.titre}</p>
                <p className="mt-1 text-3xl font-bold text-slate-800">{k.valeur}</p>
                <p className="mt-1 text-xs text-slate-400">{k.ditail}</p>
              </div>
              <div className="rounded-lg bg-marine-50 p-2 text-marine-700">{k.icone}</div>
            </div>
          </Carte>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Carte titre="Effectifs par base">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={parBase.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="base" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="effectif" name="Effectif" fill="#2c4d80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Carte>

        <Carte titre="Pyramide des âges">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pyramide.data ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="tranche" width={70} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="homme" name="Hommes" stackId="a" fill="#3b6399" />
                <Bar dataKey="femme" name="Femmes" stackId="a" fill="#9a86b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Carte>
      </div>

      <Carte titre="Évolution des recrutements">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={evolution.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="annee" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="effectif" name="Recrutés" fill="#1f3a64" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Carte>

      <Carte
        titre={<span className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" /> Alertes de fin de lien</span>}
        action={<Link to="/effectifs" className="text-sm text-marine-700 hover:underline">Voir les effectifs</Link>}
      >
        {alertes.length === 0 && <EtatVide message="Aucune alerte de fin de lien active." />}
        <ul className="divide-y divide-slate-100">
          {alertes.slice(0, 20).map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2">
              <div>
                <Link to={`/personnel/${a.id}`} className="font-medium text-marine-800 hover:underline">
                  {a.nom} {a.prenoms}
                </Link>
                <p className="text-xs text-slate-500">
                  {a.matriculeRecrutement} — {a.grade?.libelle ?? '—'} — {a.dateNaissance ? format(new Date(a.dateNaissance), 'dd/MM/yyyy') : ''}
                </p>
              </div>
              <Badge couleur={COULEURS_FIN[a.st]}>{t(`statutFinDeLien.${a.st}`)}</Badge>
            </li>
          ))}
        </ul>
      </Carte>

      {(synthèse.isLoading || alertes1.isLoading) && <ChargementLigne />}
      {synthèse.isError && <EtatVide message={t('commun.erreurReseau')} />}
    </div>
  );
}