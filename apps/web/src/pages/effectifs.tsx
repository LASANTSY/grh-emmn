import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Eye, FileUp, Plus, RefreshCw, Search, TriangleAlert } from 'lucide-react';
import { api } from '@/lib/api';
import type { AnalyseImport, PersonnelLigne } from '@/lib/types';
import { Badge, Bouton, Carte, Champ, ChargementLigne, Choix, Entree, EtatVide, Fenetre } from '@/components/ui';
import { format } from 'date-fns';

// CDC §2.3 : rouge = retraite dans les 2 ans, jaune = année en cours, gris = déjà retraité.
const COULEUR_PERTINENCE = { DANS_1_AN: 'ambre', DANS_2_ANS: 'rouge', RETRAITE: 'gris' } as const;

export function Effectifs() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [texte, setTexte] = useState(() => searchParams.get('q') ?? '');
  const [gradeId, setGradeId] = useState(() => searchParams.get('gradeId') ?? '');
  const [uniteId, setUniteId] = useState(() => searchParams.get('uniteId') ?? '');
  const [baseId, setBaseId] = useState(() => searchParams.get('baseId') ?? '');
  const [categorie, setCategorie] = useState(() => searchParams.get('categorie') ?? '');
  const [specialiteId, setSpecialiteId] = useState(() => searchParams.get('specialiteId') ?? '');
  const [dateNaissance, setDateNaissance] = useState(() => searchParams.get('dateNaissance') ?? '');
  const [retraiteAnnee, setRetraiteAnnee] = useState(() => searchParams.get('retraiteAnnee') ?? '');
  const [page, setPage] = useState(1);
  const [importOuvert, setImportOuvert] = useState(false);
  const [doublonsOuvert, setDoublonsOuvert] = useState(false);

  // Navigation depuis le tableau de bord (clic sur un camembert / graphique) :
  // on synchronise les filtres de liste avec l'URL.
  useEffect(() => {
    setTexte(searchParams.get('q') ?? '');
    setGradeId(searchParams.get('gradeId') ?? '');
    setUniteId(searchParams.get('uniteId') ?? '');
    setBaseId(searchParams.get('baseId') ?? '');
    setCategorie(searchParams.get('categorie') ?? '');
    setSpecialiteId(searchParams.get('specialiteId') ?? '');
    setDateNaissance(searchParams.get('dateNaissance') ?? '');
    setRetraiteAnnee(searchParams.get('retraiteAnnee') ?? '');
    setPage(1);
  }, [searchParams]);

  const options = useMemo(
    () => ({
      page,
      pageSize: 15,
      ...(texte.trim() ? { q: texte.trim() } : {}),
      ...(gradeId ? { gradeId } : {}),
      ...(uniteId ? { uniteId } : {}),
      ...(baseId ? { baseId } : {}),
      ...(categorie ? { categorie } : {}),
      ...(specialiteId ? { specialiteId } : {}),
      ...(dateNaissance ? { dateNaissance } : {}),
      ...(retraiteAnnee ? { retraiteAnnee } : {}),
    }),
    [texte, gradeId, uniteId, baseId, categorie, specialiteId, dateNaissance, retraiteAnnee, page],
  );

  const resultat = useQuery({
    queryKey: ['personnel', options],
    queryFn: () => api.personnel.rechercher(options),
  });

  const grades = useQuery({ queryKey: ['grades'], queryFn: () => api.referentiels.grades() });
  const unites = useQuery({ queryKey: ['unites'], queryFn: () => api.referentiels.unites() });
  const bases = useQuery({ queryKey: ['bases'], queryFn: () => api.referentiels.bases() });
  const specialites = useQuery({ queryKey: ['specialites'], queryFn: () => api.referentiels.specialites() });

  const items: PersonnelLigne[] = resultat.data?.items ?? [];
  const total = resultat.data?.total ?? items.length;

  const reinitialiser = () => {
    setTexte(''); setGradeId(''); setUniteId(''); setBaseId(''); setCategorie('');
    setSpecialiteId(''); setDateNaissance(''); setRetraiteAnnee(''); setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">{t('menu.effectifs')}</h1>
        <div className="flex flex-wrap gap-2">
          <Bouton variante="secondaire" onClick={() => setDoublonsOuvert(true)}>
            <TriangleAlert size={16} /> Doublons détectés
          </Bouton>
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
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <div className="relative md:col-span-2">
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
          <Choix value={baseId} onChange={(e) => { setBaseId(e.target.value); setUniteId(''); setPage(1); }}>
            <option value="">Toutes bases</option>
            {(bases.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </Choix>
          <Choix value={uniteId} onChange={(e) => { setUniteId(e.target.value); setPage(1); }}>
            <option value="">Toutes unités</option>
            {(unites.data ?? [])
              .filter((u) => !baseId || u.baseId === baseId)
              .map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
          </Choix>
          <Choix value={specialiteId} onChange={(e) => { setSpecialiteId(e.target.value); setPage(1); }}>
            <option value="">Toutes spécialités</option>
            {(specialites.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.libelle}</option>)}
          </Choix>
          <Entree
            type="date"
            value={dateNaissance}
            onChange={(e) => { setDateNaissance(e.target.value); setPage(1); }}
            aria-label="Date de naissance exacte"
          />
          <Bouton variante="secondaire" onClick={reinitialiser}>
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
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600">
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
      <DoublonsDialogue ouvert={doublonsOuvert} onFermer={() => setDoublonsOuvert(false)} />
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

function LienAlertes() {
  const { data } = useQuery({ queryKey: ['finlien', 'RETRAITE'], queryFn: () => api.personnel.finDeLien('RETRAITE') });
  const n = data?.length ?? 0;
  if (!n) return null;
  return (
    <Link to="/effectifs?alerte=RETRAITE" className="flex items-center gap-1 text-sm text-red-600 hover:underline">
      <TriangleAlert size={14} /> {n} limite(s) atteinte(s)
    </Link>
  );
}

function DoublonsDialogue({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['personnel', 'doublons'],
    queryFn: () => api.personnel.doublons(),
    enabled: ouvert,
  });
  return (
    <Fenetre ouvert={ouvert} onFermer={onFermer} titre="Doublons détectés (CIN / matricule) — CDC §2.4">
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          Un doublon signale un matricule ou une CIN partagé(e) par plusieurs fiches. Corrigez les fiches concernées ou
          utilisez l'import pour appliquer une mise à jour.
        </p>
        {isLoading && <ChargementLigne />}
        {!isLoading && (data ?? []).length === 0 && <EtatVide message="Aucun doublon détecté." />}
        <ul className="space-y-2">
          {(data ?? []).map((d: any) => (
            <li key={`${d.type}-${d.cle}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-900">
                {d.type === 'CIN' ? 'CIN' : 'Matricule'} : <span className="font-mono">{d.cle}</span> — {d.nb} fiches
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {d.ids.map((id: string) => (
                  <Link key={id} to={`/personnel/${id}`} className="text-xs text-marine-700 hover:underline">
                    Ouvrir la fiche →
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Fenetre>
  );
}

function ImportDialogue({ ouvert, onFermer, onTermine }: { ouvert: boolean; onFermer: () => void; onTermine: () => void }) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [analyse, setAnalyse] = useState<AnalyseImport | null>(null);
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

  const avertissements = analyse?.lignes?.filter((l) => (l.avertissements ?? []).length > 0) ?? [];

  return (
    <Fenetre ouvert={ouvert} onFermer={onFermer} titre="Import Excel — gabarit>analyser>confirmer">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          1) Téléchargez le gabarit, remplissez les lignes puis chargez le fichier. 2) L'analyse liste les erreurs et
          détecte les doublons (mise à jour prévue). 3) La confirmation applique les créations et mises à jour.
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
            {avertissements.length > 0 && (
              <ul className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                {avertissements.slice(0, 8).map((l) => (
                  <li key={l.numeroLigne}>Ligne {l.numeroLigne} : {l.avertissements?.join(' ')}</li>
                ))}
              </ul>
            )}
            <Bouton
              disabled={confirmer.isPending || analyse.valides === 0}
              onClick={() => analyse && confirmer.mutate(analyse.importId)}
            >
              Confirmer l'import
            </Bouton>
          </div>
        )}
      </div>
    </Fenetre>
  );
}

function CreationFiche({ onCree }: { onCree: () => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [valeurs, setValeurs] = useState({ matriculeRecrutement: '', nom: '', prenoms: '', dateNaissance: '', gradeId: '', uniteId: '', email: '' });
  const [res, setRes] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { t } = useTranslation();

  const grades = useQuery({ queryKey: ['grades'], queryFn: () => api.referentiels.grades() });
  const unites = useQuery({ queryKey: ['unites'], queryFn: () => api.referentiels.unites() });

  function etapeValide(v: typeof valeurs): boolean {
    return Boolean(v.matriculeRecrutement.trim() && v.nom.trim() && v.prenoms.trim() && v.dateNaissance && v.gradeId && v.uniteId);
  }

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

  return (
    <>
      <Bouton
        className="fixed bottom-6 right-6"
        onClick={() => { setRes(null); setErr(null); setOuvert(true); }}
      >
        <Plus size={16} /> Nouvelle fiche
      </Bouton>
      <Fenetre ouvert={ouvert} onFermer={() => setOuvert(false)} titre="Nouvelle fiche personnel — formulaire global">
        <p className="mb-4 text-sm text-slate-500">{t('etapes.identificationAide')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ label="Matricule">
            <Entree value={valeurs.matriculeRecrutement} onChange={(e) => setValeurs({ ...valeurs, matriculeRecrutement: e.target.value })} required />
          </Champ>
          <Champ label="Email">
            <Entree type="email" value={valeurs.email} onChange={(e) => setValeurs({ ...valeurs, email: e.target.value })} />
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ label="Date de naissance">
            <Entree type="date" value={valeurs.dateNaissance} onChange={(e) => setValeurs({ ...valeurs, dateNaissance: e.target.value })} required />
          </Champ>
        </div>
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

        {err && <p className="text-sm text-red-600">{err}</p>}
        {res && <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">{res}</p>}

        <div className="flex justify-between gap-3 pt-1">
          <Bouton variante="secondaire" onClick={() => setOuvert(false)}>{t('commun.annuler')}</Bouton>
          <Bouton onClick={() => void creer()} disabled={!etapeValide(valeurs)}>{t('commun.enregistrer')}</Bouton>
        </div>
      </Fenetre>
    </>
  );
}
