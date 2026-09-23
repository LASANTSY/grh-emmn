import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Users, UserCog, CalendarClock, Layers, Scale } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { Badge, Carte, ChargementLigne, EtatVide, Choix } from '@/components/ui';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

// CDC §2.3 : rouge = retraite dans les 2 ans, jaune = année en cours, gris = déjà retraité.
const COULEURS_FIN = {
  DANS_1_AN: 'ambre',
  DANS_2_ANS: 'rouge',
  RETRAITE: 'gris',
} as const;

const PALETTE = ['#1f3a64', '#2c4d80', '#3b6399', '#9a86b8', '#c9a227', '#6b4f9c', '#4c7c5a', '#b3544a'];

const CATEGORIE_LIBELLE: Record<string, string> = {
  OFFICIER_GENERAL: 'Officiers Généraux',
  OFFICIER_MARINE: 'Officiers de Marine',
  OFFICIER_MARINIER: 'Officiers Mariniers',
  QMO: 'QMO / Matelots',
};

const LIBELLE_SEXE: Record<string, string> = { M: 'Hommes', F: 'Femmes' };

function LegendeCamembert({ items }: { items: Array<{ couleur: string; libelle: string; valeur: number }> }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-2">
      {items.map((i) => (
        <span key={i.libelle} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: i.couleur }} />
          {i.libelle} · {i.valeur}
        </span>
      ))}
    </div>
  );
}

export function TableauDeBord() {
  const { t } = useTranslation();
  const { compte } = useAuth();
  const navigate = useNavigate();
  const [basePercee, setBasePercee] = useState<string | null>(null);
  const [tuileComparaison, setTuileComparaison] = useState('');

  const synthèse = useQuery({ queryKey: ['dashboard', 'synthese'], queryFn: () => api.dashboard.synthese() });
  const parBaseHier = useQuery({ queryKey: ['dashboard', 'parBaseHier'], queryFn: () => api.dashboard.parBaseHierarchique() });
  const categories = useQuery({ queryKey: ['dashboard', 'categories'], queryFn: () => api.dashboard.categories() });
  const genres = useQuery({ queryKey: ['dashboard', 'genres'], queryFn: () => api.dashboard.genres() });
  const retraites = useQuery({ queryKey: ['dashboard', 'retraites'], queryFn: () => api.dashboard.retraitesParAnnee() });
  const pyramide = useQuery({ queryKey: ['dashboard', 'pyramide'], queryFn: () => api.dashboard.pyramide() });
  const evolution = useQuery({ queryKey: ['dashboard', 'evolution'], queryFn: () => api.dashboard.evolution() });
  const alertes1 = useQuery({ queryKey: ['finlien', 'DANS_1_AN'], queryFn: () => api.personnel.finDeLien('DANS_1_AN') });
  const alertes2 = useQuery({ queryKey: ['finlien', 'DANS_2_ANS'], queryFn: () => api.personnel.finDeLien('DANS_2_ANS') });
  const retirees = useQuery({ queryKey: ['finlien', 'RETRAITE'], queryFn: () => api.personnel.finDeLien('RETRAITE') });
  const comparaison = useQuery({
    queryKey: ['dashboard', 'comparaison', tuileComparaison],
    queryFn: () => {
      const [type, id] = tuileComparaison.split(':');
      return type === 'BASE'
        ? api.dashboard.comparaison({ baseId: id })
        : api.dashboard.comparaison({ uniteId: id });
    },
    enabled: tuileComparaison.length > 0,
  });

  const s = synthèse.data ?? {};
  const kartes = [
    { titre: 'Effectif total', valeur: s.effectif ?? '—', icone: <Users size={18} />, detail: `${s.officiers ?? 0} officiers` },
    { titre: 'Officiers', valeur: s.officiers ?? '—', icone: <UserCog size={18} />, detail: `${s.qmo ?? 0} QMO / matelots` },
    { titre: 'Recrutés cette année', valeur: s.recrutesAnnee ?? '—', icone: <CalendarClock size={18} />, detail: 'année civile' },
  ];

  // ── Bandeau : titre personnalisable (stockage local), unité, date, logo ──
  const [titreBandeau, setTitreBandeau] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('grh.bandeau.titre') ?? 'État-Major de la Marine Nationale — GRH EMMN' : 'État-Major de la Marine Nationale — GRH EMMN')
  const majTitre = (v: string) => {
    setTitreBandeau(v);
    localStorage.setItem('grh.bandeau.titre', v);
  };
  const bandeauInitiale = titreBandeau || 'État-Major de la Marine Nationale — GRH EMMN';

  const alertes = [
    ...(alertes1.data ?? []).map((a) => ({ ...a, st: 'DANS_1_AN' as const })),
    ...(alertes2.data ?? []).map((a) => ({ ...a, st: 'DANS_2_ANS' as const })),
    ...(retirees.data ?? []).map((a) => ({ ...a, st: 'RETRAITE' as const })),
  ];

  const bases = parBaseHier.data ?? [];
  const basePerceeData = useMemo(
    () => (basePercee ? bases.find((b) => b.baseId === basePercee)?.unites ?? [] : []),
    [basePercee, bases],
  );

  // Pyramide miroir : les hommes en négatif à gauche, femmes à droite.
  const pyramideMiroir = (pyramide.data ?? []).map((p) => ({
    ...p,
    homme: -Number(p.homme ?? 0),
  }));

  const compareData = comparaison.data;
  const grilleComparaison = useMemo(() => {
    if (!compareData) return [];
    const libelles = ['OFFICIER_GENERAL', 'OFFICIER_MARINE', 'OFFICIER_MARINIER', 'QMO'];
    return libelles.map((c) => ({
      categorie: CATEGORIE_LIBELLE[c] ?? c,
      Ensemble: compareData.ensemble.cat[c] ?? 0,
      'Sélection': compareData.selection.cat[c] ?? 0,
    }));
  }, [compareData]);

  const tuilesComparaison = useMemo(() => {
    const resultats: Array<{ valeur: string; libelle: string }> = [];
    for (const b of bases) {
      resultats.push({ valeur: `BASE:${b.baseId}`, libelle: b.base });
      for (const u of b.unites) resultats.push({ valeur: `UNITE:${u.uniteId}`, libelle: `${b.base} — ${u.unite}` });
    }
    return resultats;
  }, [bases]);

  const allerEffectifs = (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    navigate(`/effectifs${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="space-y-6">
      {/* Bandeau personnalisable (CDC §2.3) */}
      <section className="carte overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-marine-800 to-marine-600 p-4 text-white">
          <img src="/logo.png" alt="EMMN" className="h-14 w-14 rounded-full bg-white/10 object-contain p-1" />
          <div className="min-w-0 flex-1">
            <input
              value={bandeauInitiale}
              onChange={(e) => majTitre(e.target.value)}
              aria-label="Titre du tableau de bord"
              className="w-full truncate rounded bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/70 focus:bg-white/10"
            />
            <p className="text-sm text-white/80">
              {compte?.identifiant ?? ''} · Unité : {compte?.perimetre?.baseId ?? 'Toutes bases'} · {format(new Date(), 'EEEE d MMMM yyyy')}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-2 text-center">
            <p className="text-3xl font-extrabold">{s.effectif ?? '—'}</p>
            <p className="text-xs uppercase text-white/80">Effectif total</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {kartes.map((k) => (
          <Carte key={k.titre}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">{k.titre}</p>
                <p className="mt-1 text-3xl font-bold text-slate-800">{k.valeur}</p>
                <p className="mt-1 text-xs text-slate-400">{k.detail}</p>
              </div>
              <div className="rounded-lg bg-marine-50 p-2 text-marine-700">{k.icone}</div>
            </div>
          </Carte>
        ))}
      </div>

      {/* Raccourcis (CDC §2.3 : par catégorie de grade, puis par base/unité) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Carte titre="Raccourcis : personnel par catégorie de grade">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(CATEGORIE_LIBELLE).map(([code, libelle]) => (
              <button
                key={code}
                onClick={() => allerEffectifs({ categorie: code })}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-marine-800 transition hover:border-marine-400 hover:bg-marine-50"
              >
                <UserCog size={16} className="shrink-0 text-marine-600" />
                {libelle}
              </button>
            ))}
          </div>
        </Carte>

        <Carte titre="Raccourcis : personnel par base puis par unité">
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {bases.map((b) => (
              <div key={b.baseId} className="rounded-lg border border-slate-200 p-2">
                <button
                  onClick={() => allerEffectifs({ baseId: b.baseId })}
                  className="flex w-full items-center justify-between text-sm font-semibold text-marine-800 hover:text-marine-600"
                >
                  <span className="flex items-center gap-2"><Layers size={15} /> {b.base}</span>
                  <span className="rounded-full bg-marine-100 px-2 py-0.5 text-xs text-marine-700">{b.effectif}</span>
                </button>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {b.unites.map((u) => (
                    <button
                      key={u.uniteId}
                      onClick={() => allerEffectifs({ baseId: b.baseId, uniteId: u.uniteId })}
                      className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 transition hover:border-marine-400 hover:bg-marine-50 hover:text-marine-700"
                    >
                      {u.unite} · {u.effectif}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Carte>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Camembert par base + perçage unité */}
        <Carte
          titre="Répartition par base (clic sur un secteur pour percer les unités)"
          action={
            <button
              onClick={() => setBasePercee(null)}
              className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Réinitialiser
            </button>
          }
        >
          <div className="space-y-3">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bases}
                    dataKey="effectif"
                    nameKey="base"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    onClick={(d: any) => {
                      setBasePercee(d.baseId);
                      allerEffectifs({ baseId: d.baseId });
                    }}
                  >
                    {bases.map((b, i) => (
                      <Cell key={b.baseId} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendeCamembert
              items={bases.map((b, i) => ({ couleur: PALETTE[i % PALETTE.length], libelle: b.base, valeur: b.effectif }))}
            />
            {basePerceeData.length > 0 && (
              <div className="h-44">
                <p className="mb-1 text-xs font-medium text-slate-500">Détail par unité — {bases.find((b) => b.baseId === basePercee)?.base}</p>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={basePerceeData}
                      dataKey="effectif"
                      nameKey="unite"
                      outerRadius={70}
                      onClick={(d: any) => {
                        if (basePercee) allerEffectifs({ baseId: basePercee, uniteId: d.uniteId });
                      }}
                    >
                      {basePerceeData.map((u, i) => (
                        <Cell key={u.uniteId} fill={PALETTE[(i + 3) % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              )}
              <LegendeCamembert
                items={basePerceeData.map((u, i) => ({ couleur: PALETTE[(i + 3) % PALETTE.length], libelle: u.unite, valeur: u.effectif }))}
              />
            </div>
          </Carte>

        {/* Camembert par catégorie de grade */}
        <Carte titre="Répartition par catégorie de grade">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(categories.data ?? []).map((c) => ({ ...c, libelle: CATEGORIE_LIBELLE[c.categorie] ?? c.categorie }))}
                  dataKey="effectif"
                  nameKey="libelle"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  onClick={(d: any) => allerEffectifs({ categorie: d.categorie })}
                >
                  {(categories.data ?? []).map((c, i) => (
                    <Cell key={c.categorie} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Carte>
      </div>

      {/* Comparaison base/unité vs ensemble (CDC §2.3) */}
      <Carte titre={<span className="flex items-center gap-2"><Scale size={18} /> Comparaison base / unité — ensemble des Forces Navales</span>}>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <label className="w-full max-w-sm">
            <span className="label">Base ou unité à comparer</span>
            <Choix value={tuileComparaison} onChange={(e) => setTuileComparaison(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {tuilesComparaison.map((o) => (
                <option key={o.valeur} value={o.valeur}>{o.libelle}</option>
              ))}
            </Choix>
          </label>
        </div>
        {!tuileComparaison && <EtatVide message="Sélectionnez une base ou une unité pour visualiser la comparaison." />}
        {tuileComparaison && comparaison.isLoading && <ChargementLigne />}
        {compareData && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Nombre de personnels par catégorie ({compareData.selection.libelle})</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={grilleComparaison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categorie" tick={{ fontSize: 11 }} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Sélection" fill="#2c4d80" />
                    <Bar dataKey="Ensemble" fill="#9a86b8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Part hommes / femmes ({compareData.selection.libelle})</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { libelle: 'Sélection', ...compareData.selection.genres },
                      { libelle: 'Ensemble', ...compareData.ensemble.genres },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="libelle" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="homme" name="Hommes" fill="#3b6399" stackId="a" />
                    <Bar dataKey="femme" name="Femmes" fill="#9a86b8" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </Carte>

      <div className="grid gap-6 lg:grid-cols-2">
        <Carte titre="Pyramide des âges (hommes — femmes)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pyramideMiroir} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tickFormatter={(v: number) => String(Math.abs(v))} />
                <YAxis type="category" dataKey="tranche" width={70} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number | string) => Math.abs(Number(v))} />
                <Legend />
                <Bar dataKey="homme" name="Hommes" stackId="a" fill="#3b6399" radius={[0, 3, 3, 0]} />
                <Bar dataKey="femme" name="Femmes" stackId="a" fill="#9a86b8" radius={[3, 0, 0, 3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Carte>

        <Carte titre="Départs à la retraite prévus par année">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retraites.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="effectif"
                  name="Départs"
                  fill="#c9a227"
                  radius={[4, 4, 0, 0]}
                  onClick={(d: any) => allerEffectifs({ retraiteAnnee: String(d.annee) })}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Carte>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

        <Carte titre="Répartition hommes / femmes">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(genres.data ?? []).map((g) => ({ ...g, libelle: LIBELLE_SEXE[g.sexe] ?? g.sexe }))}
                  dataKey="effectif"
                  nameKey="libelle"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {(genres.data ?? []).map((g) => (
                    <Cell key={g.sexe} fill={g.sexe === 'M' ? '#3b6399' : '#9a86b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Carte>
      </div>

      <Carte
        titre={<span className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" /> Alertes de fin de lien</span>}
        action={<Link to="/effectifs?alerte=RETRAITE" className="text-sm text-marine-700 hover:underline">Voir les effectifs</Link>}
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