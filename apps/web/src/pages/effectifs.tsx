import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Eye, FileUp, Plus, RefreshCw, Search, TriangleAlert } from 'lucide-react';
import { api } from '@/lib/api';
import type { PersonnelLigne } from '@/lib/types';
import { Badge, Bouton, Carte, Champ, ChargementLigne, Choix, Entree, EtatVide, Fenetre } from '@/components/ui';
import { cn } from '@/lib/classes';
import { format } from 'date-fns';

const COULEUR_PERTINENCE = { DANS_1_AN: 'ambre', DANS_2_ANS: 'violet', RETRAITE: 'rouge' } as const;

export function Effectifs() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [texte, setTexte] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [uniteId, setUniteId] = useState('');
  const [categorie, setCategorie] = useState('');
  const [page, setPage] = useState(1);
  const [importOuvert, setImportOuvert] = useState(false);

  const options = useMemo(
    () => ({
      page,
      pageSize: 15,
      ...(texte.trim() ? { q: texte.trim() } : {}),
      ...(gradeId ? { gradeId } : {}),
      ...(uniteId ? { uniteId } : {}),
      ...(categorie ? { categorie } : {}),
    }),
    [texte, gradeId, uniteId, categorie, page],
  );

  const resultat = useQuery({
    queryKey: ['personnel', options],
    queryFn: () => api.personnel.rechercher(options),
  });

  const grades = useQuery({ queryKey: ['grades'], queryFn: () => api.referentiels.grades() });
  const unites = useQuery({ queryKey: ['unites'], queryFn: () => api.referentiels.unites() });

  const items: PersonnelLigne[] = resultat.data?.items ?? [];
  const total = resultat.data?.total ?? items.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">{t('menu.effectifs')}</h1>
        <div className="flex gap-2">
          <Bouton variante="secondaire" onClick={() => { void api.imports.gabarit(); }}>
            <Download size={16} /> {t('menu.import')}
          </Bouton>
          <Bouton variante="secondaire" onClick={() => { void api.rapports.excel(); }}>
            <Download size={16} /> {t('commun.exporter')}
          </Bouton>
          <Bouton onClick={() => setImportOuvert(true)}>
            <FileUp size={16} /> Import Excel
          </Bouton>
        </div>
      </div>

      <Carte>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <Entree
              className="pl-9"
              placeholder={t('commun.rechercher') + '…'}
              value={texte}
              onChange={(e) => { setTexte(e.target.value); setPage(1); }}
            />
          </div>
          <Choix value={categorie} onChange={(e) => { setCategorie(e.target.value); setPage(1); }}>
            <option value="">Toutes catégories</option>
            {Object.entries(t('grades', { returnObjects: true }) as Record<string, string>).map(([cle, libelle]) => (
              <option key={cle} value={cle}>{libelle}</option>
            ))}
          </Choix>
          <Choix value={gradeId} onChange={(e) => { setGradeId(e.target.value); setPage(1); }}>
            <option value="">Tous grades</option>
            {(grades.data ?? []).map((g) => <option key={g.id} value={g.id}>{g.libelle}</option>)}
          </Choix>
          <Choix value={uniteId} onChange={(e) => { setUniteId(e.target.value); setPage(1); }}>
            <option value="">Toutes unités</option>
            {(unites.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
          </Choix>
          <Bouton variante="secondaire" onClick={() => { setTexte(''); setGradeId(''); setUniteId(''); setCategorie(''); setPage(1); }}>
            <RefreshCw size={16} />
          </Bouton>
        </div>
      </Carte>

      <Carte titre={`${total} fiche(s)`} action={<LienAlertes />}>
        {resultat.isLoading && <ChargementLigne />}
        {resultat.isError && <EtatVide message={t('commun.erreurReseau')} />}
        {!resultat.isLoading && !resultat.isError && items.length === 0 && <EtatVide message={t('commun.aucuneDonnee')} />}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-entete border-b border-slate-200 bg-slate-50">
                <tr>
                  <th>Matricule</th>
                  <th>Nom & prénoms</th>
                  <th>Grade</th>
                  <th>Unité</th>
                  <th className="hidden lg:table-cell">Naissance</th>
                  <th>Al. fin de lien</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id} className="table-ligne">
                    <td className="cellule-table font-mono text-xs">{p.matriculeRecrutement}</td>
                    <td className="cellule-table">
                      <Link to={`/personnel/${p.id}`} className="font-medium text-marine-800 hover:underline">
                        {p.nom} {p.prenoms}
                      </Link>
                      {p.finDeLien?.enAlerte && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                          <TriangleAlert size={12} />
                        </span>
                      )}
                    </td>
                    <td className="cellule-table text-xs text-slate-600">{p.grade?.libelle ?? '—'}</td>
                    <td className="cellule-table text-xs text-slate-600">
                      {p.unite?.nom ?? '—'}
                      <div className="text-[11px] text-slate-400">{p.unite?.base?.nom ?? ''}</div>
                    </td>
                    <td className="cellule-table hidden text-xs text-slate-500 lg:table-cell">
                      {p.dateNaissance ? format(new Date(p.dateNaissance), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="cellule-table">
                      <LigneFinDeLien p={p} />
                    </td>
                    <td className="cellule-table">
                      <Link to={`/personnel/${p.id}`}>
                        <Bouton variante="secondaire" type="button" className="whitespace-nowrap">
                          <Eye size={14} /> {t('voirFiche')}
                        </Bouton>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">Page {page}</p>
            <div className="flex gap-2">
              <Bouton variante="secondaire" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>←</Bouton>
              <Bouton variante="secondaire" disabled={page * 15 >= total} onClick={() => setPage((p) => p + 1)}>→</Bouton>
            </div>
          </div>
        )}
      </Carte>

      <ImportDialogue ouvert={importOuvert} onFermer={() => setImportOuvert(false)} onTermine={() => void queryClient.invalidateQueries({ queryKey: ['personnel'] })} />

      <CreationFiche onCree={() => void queryClient.invalidateQueries({ queryKey: ['personnel'] })} />
    </div>
  );
}

function LigneFinDeLien({ p }: { p: PersonnelLigne }) {
  if (!p.finDeLien || p.finDeLien.statut === 'NEANT') return <span className="text-xs text-slate-300">—</span>;
  return (
    <Badge couleur={COULEUR_PERTINENCE[p.finDeLien.statut]}>
      {p.finDeLien.statut === 'RETRAITE' ? 'Limite atteinte' : p.finDeLien.statut === 'DANS_1_AN' ? '≤ 1 an' : '≤ 2 ans'}
    </Badge>
  );
}

import { Link as ReactLink } from 'react-router-dom';

function LienAlertes() {
  const { data } = useQuery({ queryKey: ['finlien', 'RETRAITE'], queryFn: () => api.personnel.finDeLien('RETRAITE') });
  const n = data?.length ?? 0;
  if (!n) return null;
  return (
    <ReactLink to="/effectifs?alerte=RETRAITE" className="flex items-center gap-1 text-sm text-red-600 hover:underline">
      <TriangleAlert size={14} /> {n} limite(s) atteinte(s)
    </ReactLink>
  );
}

function ImportDialogue({ ouvert, onFermer, onTermine }: { ouvert: boolean; onFermer: () => void; onTermine: () => void }) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [analyse, setAnalyse] = useState<{ importId: string; total: number; valides: number; avecErreurs: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: api.imports.analyser,
    onSuccess: (r) => { setAnalyse(r); setMessage(null); },
    onError: (_e: Error) => setMessage(_e.message),
  });

  const confirmer = useMutation({
    mutationFn: (importId: string) => api.imports.valider(importId),
    onSuccess: () => { setMessage('Import confirmé.'); onTermine(); },
    onError: (_e: Error) => setMessage(_e.message),
  });

  return (
    <Fenetre ouvert={ouvert} onFermer={onFermer} titre="Import Excel — gabarit>analyser>confirmer">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          1) Téléchargez le gabarit, remplissez les lignes puis chargez le fichier. 2) L'analyse liste les erreurs. 3) La confirmation applique les créations.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => { setFichier(e.target.files?.[0] ?? null); setAnalyse(null); setMessage(null); }}
          className="input"
        />
        <Bouton
          disabled={!fichier || mutation.isPending}
          onClick={() => fichier && mutation.mutate(fichier)}
        >
          Analyser le fichier
        </Bouton>
        {message && <p className="text-sm text-red-600">{message}</p>}
        {analyse && (
          <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            <p>Lignes : {analyse.total} — valides : {analyse.valides} — avec erreurs : {analyse.avecErreurs}</p>
            <Bouton
              disabled={confirmer.isPending || analyse.valides === 0}
              onClick={() => analyse && confirmer.mutate(analyse.importId)}
            >
              Confirmer l'import ({analyse.valides} création(s))
            </Bouton>
          </div>
        )}
      </div>
    </Fenetre>
  );
}

function CreationFiche({ onCree }: { onCree: () => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState(1);
  const [valeurs, setValeurs] = useState({ matriculeRecrutement: '', nom: '', prenoms: '', dateNaissance: '', gradeId: '', uniteId: '', email: '' });
  const [res, setRes] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { t } = useTranslation();

  const grades = useQuery({ queryKey: ['grades'], queryFn: () => api.referentiels.grades() });
  const unites = useQuery({ queryKey: ['unites'], queryFn: () => api.referentiels.unites() });

  const etapes = [
    { titre: t('etapes.identification'), numero: 1 },
    { titre: t('etapes.affectation'), numero: 2 },
    { titre: t('etapes.confirmation'), numero: 3 },
  ];

  const etapeValide = (): boolean => {
    if (etape === 1) {
      return Boolean(valeurs.matriculeRecrutement.trim() && valeurs.nom.trim() && valeurs.prenoms.trim() && valeurs.dateNaissance);
    }
    if (etape === 2) {
      return Boolean(valeurs.gradeId && valeurs.uniteId);
    }
    return true;
  };

  async function creer() {
    setErr(null); setRes(null);
    try {
      const r = await api.personnel.creer(valeurs);
      setRes(`Fiche créée — identifiant : ${r.identifiant ?? ''} — mot de passe provisoire : ${r.motDePasseProvisoire ?? ''}`);
      onCree();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  function suivant() {
    setErr(null);
    if (!etapeValide()) {
      setErr(t('etapes.champsObligatoires'));
      return;
    }
    setEtape((s) => Math.min(etapes.length, s + 1));
  }

  return (
    <>
      <Bouton
        className="fixed bottom-6 right-6"
        onClick={() => { setEtape(1); setRes(null); setErr(null); setOuvert(true); }}
      >
        <Plus size={16} /> Nouvelle fiche
      </Bouton>
      <Fenetre ouvert={ouvert} onFermer={() => setOuvert(false)} titre="Nouvelle fiche personnel — assistant 3 étapes">
        <ol className="mb-5 flex items-center gap-2">
          {etapes.map((e) => {
            const termine = e.numero < etape;
            const actif = e.numero === etape;
            return (
              <li key={e.numero} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    actif ? 'bg-marine-700 text-white' : termine ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400',
                  )}
                >
                  {termine ? '✓' : e.numero}
                </span>
                <span className={cn('text-xs', actif ? 'font-semibold text-marine-800' : 'text-slate-400')}>{e.titre}</span>
                {e.numero < etapes.length && <div className="h-0.5 flex-1 rounded bg-slate-200" />}
              </li>
            );
          })}
        </ol>
        <p className="mb-3 text-[11px] uppercase tracking-wide text-slate-400">
          {t('etapes.progression', { etape, total: etapes.length })}
        </p>

        <div className="space-y-3">
          {etape === 1 && (
            <>
              <p className="text-sm text-slate-500">{t('etapes.identificationAide')}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Champ label="Matricule">
                  <Entree value={valeurs.matriculeRecrutement} onChange={(e) => setValeurs({ ...valeurs, matriculeRecrutement: e.target.value })} required />
                </Champ>
                <Champ label="Date de naissance">
                  <Entree type="date" value={valeurs.dateNaissance} onChange={(e) => setValeurs({ ...valeurs, dateNaissance: e.target.value })} required />
                </Champ>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Champ label="Nom">
                  <Entree value={valeurs.nom} onChange={(e) => setValeurs({ ...valeurs, nom: e.target.value })} required />
                </Champ>
                <Champ label="Prénoms">
                  <Entree value={valeurs.prenoms} onChange={(e) => setValeurs({ ...valeurs, prenoms: e.target.value })} required />
                </Champ>
              </div>
            </>
          )}

          {etape === 2 && (
            <>
              <p className="text-sm text-slate-500">{t('etapes.affectationAide')}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Champ label="Grade">
                  <Choix value={valeurs.gradeId} onChange={(e) => setValeurs({ ...valeurs, gradeId: e.target.value })} required>
                    <option value="">—</option>
                    {(grades.data ?? []).map((g) => <option key={g.id} value={g.id}>{g.libelle}</option>)}
                  </Choix>
                </Champ>
                <Champ label="Unité">
                  <Choix value={valeurs.uniteId} onChange={(e) => setValeurs({ ...valeurs, uniteId: e.target.value })} required>
                    <option value="">—</option>
                    {(unites.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
                  </Choix>
                </Champ>
              </div>
            </>
          )}

          {etape === 3 && (
            <>
              <p className="text-sm text-slate-500">{t('etapes.confirmationAide')}</p>
              <Champ label="Email">
                <Entree type="email" value={valeurs.email} onChange={(e) => setValeurs({ ...valeurs, email: e.target.value })} />
              </Champ>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-700">{valeurs.nom} {valeurs.prenoms}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {t('etapes.recap', {
                    matricule: valeurs.matriculeRecrutement,
                    grade: grades.data?.find((g) => g.id === valeurs.gradeId)?.libelle ?? '—',
                    unite: unites.data?.find((u) => u.id === valeurs.uniteId)?.nom ?? '—',
                    naissance: valeurs.dateNaissance ?? '—',
                  })}
                </p>
              </div>
            </>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}
          {res && <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">{res}</p>}

          <div className="flex justify-between gap-3 pt-1">
            <Bouton variante="secondaire" disabled={etape === 1} onClick={() => setEtape((s) => Math.max(1, s - 1))}>
              {t('commun.annuler')} ←
            </Bouton>
            {etape < etapes.length ? (
              <Bouton onClick={suivant}>{t('etapes.suivant')} →</Bouton>
            ) : (
              <Bouton onClick={() => void creer()} disabled={!valeurs.email && !etapeValide()}>
                {t('commun.enregistrer')}
              </Bouton>
            )}
          </div>
        </div>
      </Fenetre>
    </>
  );
}