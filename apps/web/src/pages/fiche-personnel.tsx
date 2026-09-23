import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Upload } from 'lucide-react';
import { api, multipart, rawHttp } from '@/lib/api';
import { Badge, Bouton, Carte, Champ, ChargementLigne, Choix, Entree, EtatVide, Fenetre } from '@/components/ui';
import { format } from 'date-fns';

interface OngletEntree { id: string; createdAt?: string; [cle: string]: unknown }

interface DefOnglet {
  cle: string;
  clesApi: string;
  libelle: string;
  colonnes: Array<{ k: string; libelle: string }>;
  formulaire: Array<{ k: string; libelle: string; type?: 'date' | 'select'; options?: Array<{ v: string; l: string }>; requis?: boolean }>;
}

const ONGLETS: DefOnglet[] = [
  {
    cle: 'enfants', clesApi: 'enfants', libelle: 'Enfants',
    colonnes: [{ k: 'rang', libelle: 'Rang' }, { k: 'nom', libelle: 'Nom' }, { k: 'prenoms', libelle: 'Prénoms' }, { k: 'dateNaissance', libelle: 'Naissance' }],
    formulaire: [
      { k: 'rang', libelle: 'Rang', requis: true },
      { k: 'nom', libelle: 'Nom', requis: true },
      { k: 'prenoms', libelle: 'Prénoms' },
      { k: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
      { k: 'sexe', libelle: 'Sexe', type: 'select', options: [{ v: 'M', l: 'Masculin' }, { v: 'F', l: 'Féminin' }] },
      { k: 'lienParente', libelle: 'Lien de parenté' },
    ],
  },
  {
    cle: 'historique-grades', clesApi: 'historique-grades', libelle: 'Historique des grades',
    colonnes: [{ k: 'grade', libelle: 'Grade' }, { k: 'referenceDecret', libelle: 'Réf. décret' }, { k: 'datePriseCommandement', libelle: 'Prise commandement' }],
    formulaire: [
      { k: 'gradeId', libelle: 'Grade', type: 'select', requis: true },
      { k: 'referenceDecret', libelle: 'Référence décret' },
      { k: 'datePriseCommandement', libelle: 'Date de prise de commandement', type: 'date' },
      { k: 'observations', libelle: 'Observations' },
    ],
  },
  {
    cle: 'cursus', clesApi: 'cursus', libelle: 'Cursus scolaire / formation',
    colonnes: [{ k: 'diplome', libelle: 'Diplôme' }, { k: 'etablissement', libelle: 'Établissement' }, { k: 'dateDebut', libelle: 'Début' }, { k: 'dateFin', libelle: 'Fin' }],
    formulaire: [
      { k: 'diplome', libelle: 'Diplôme / formation', requis: true },
      { k: 'etablissement', libelle: 'Établissement' },
      { k: 'dateDebut', libelle: 'Début', type: 'date' },
      { k: 'dateFin', libelle: 'Fin', type: 'date' },
      { k: 'mention', libelle: 'Mention' },
    ],
  },
  {
    cle: 'stages', clesApi: 'stages', libelle: 'Stages militaires',
    colonnes: [{ k: 'intitule', libelle: 'Intitulé' }, { k: 'dateDebut', libelle: 'Début' }, { k: 'dateFin', libelle: 'Fin' }],
    formulaire: [
      { k: 'intitule', libelle: 'Intitulé du stage', requis: true },
      { k: 'dateDebut', libelle: 'Début', type: 'date' },
      { k: 'dateFin', libelle: 'Fin', type: 'date' },
      { k: 'lieu', libelle: 'Lieu' },
    ],
  },
  {
    cle: 'langues', clesApi: 'langues', libelle: 'Langues parlées',
    colonnes: [{ k: 'langue', libelle: 'Langue' }, { k: 'niveau', libelle: 'Niveau' }],
    formulaire: [
      { k: 'langue', libelle: 'Langue', requis: true },
      { k: 'niveau', libelle: 'Niveau' },
    ],
  },
  {
    cle: 'affectations', clesApi: 'affectations', libelle: 'Affectations',
    colonnes: [{ k: 'unite', libelle: 'Unité' }, { k: 'dateEffet', libelle: 'Date d’effet' }],
    formulaire: [
      { k: 'uniteId', libelle: 'Unité', type: 'select', requis: true },
      { k: 'dateEffet', libelle: 'Date d’effet', type: 'date' },
      { k: 'referenceDecret', libelle: 'Référence décret' },
    ],
  },
  {
    cle: 'decorations', clesApi: 'decorations', libelle: 'Décorations',
    colonnes: [{ k: 'intitule', libelle: 'Intitulé' }, { k: 'dateEffet', libelle: 'Date d’effet' }],
    formulaire: [
      { k: 'intitule', libelle: 'Intitulée', requis: true },
      { k: 'dateEffet', libelle: 'Date d’effet', type: 'date' },
      { k: 'referenceDecret', libelle: 'Référence' },
    ],
  },
];

export function FichePersonnel() {
  const { id = '' } = useParams();
  const [onglet, setOnglet] = useState('identite');
  const [docOuvert, setDocOuvert] = useState(false);

  const detail = useQuery({ queryKey: ['personnel', id], queryFn: () => api.personnel.detail(id) });
  const grades = useQuery({ queryKey: ['grades'], queryFn: () => api.referentiels.grades() });
  const unites = useQuery({ queryKey: ['unites'], queryFn: () => api.referentiels.unites() });

  const p = detail.data;

  return (
    <div className="space-y-5">
      <Link to="/effectifs" className="inline-flex items-center gap-1 text-sm text-marine-700 hover:underline">
        <ArrowLeft size={14} /> Effectifs
      </Link>

      {detail.isLoading && <ChargementLigne />}
      {detail.isError && <EtatVide message="Fiche introuvable ou accès refusé." />}
      {p && (
        <>
          <div className="carte px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{p.nom} {p.prenoms}</h1>
                <p className="text-sm text-slate-500">
                  Matricule : <span className="font-mono">{p.matriculeRecrutement}</span>
                  {' — '}{p.grade?.libelle ?? '—'} — {p.unite?.nom ?? '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {p.finDeLien?.statut !== 'NEANT' && (
                  <Badge couleur={p.finDeLien.statut === 'RETRAITE' ? 'rouge' : p.finDeLien.statut === 'DANS_1_AN' ? 'ambre' : 'violet'}>
                    {p.finDeLien.statut === 'RETRAITE' ? 'Limite atteinte' : p.finDeLien.statut === 'DANS_1_AN' ? 'Limite ≤ 1 an' : 'Limite ≤ 2 ans'}
                    {p.finDeLien.dateFinDeLien ? ` — ${format(new Date(p.finDeLien.dateFinDeLien), 'dd/MM/yyyy')}` : ''}
                  </Badge>
                )}
                <Bouton variante="secondaire" onClick={() => setDocOuvert(true)}>
                  <Upload size={15} /> Documents
                </Bouton>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-slate-200">
            <OngletBouton actif={onglet === 'identite'} onClick={() => setOnglet('identite')}>Identification</OngletBouton>
            {ONGLETS.map((o) => (
              <OngletBouton key={o.cle} actif={onglet === o.cle} onClick={() => setOnglet(o.cle)}>{o.libelle}</OngletBouton>
            ))}
            <OngletBouton actif={onglet === 'documents'} onClick={() => setOnglet('documents')}>Pièces jointes</OngletBouton>
          </div>

          {onglet === 'identite' && <Identite p={p} />}
          {onglet === 'documents' && <Documents pid={id} />}
          {onglet !== 'identite' && onglet !== 'documents' && (
            <OngletDonnees pid={id} def={ONGLETS.find((o) => o.cle === onglet)!} grades={grades.data ?? []} unites={unites.data ?? []} />
          )}

          <DialogueDocuments ouvert={docOuvert} onFermer={() => setDocOuvert(false)} pid={id} />
        </>
      )}
    </div>
  );
}

function OngletBouton({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        actif ? 'border-marine-700 text-marine-800' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function Identite({ p }: { p: any }) {
  const identite = [
    ['Matricule', p.matriculeRecrutement],
    ['Matricule financier', p.matriculeFinancier],
    ['Nom', p.nom],
    ['Prénoms', p.prenoms],
    ['Sexe', p.sexe],
    ['Date de naissance', p.dateNaissance ? format(new Date(p.dateNaissance), 'dd/MM/yyyy') : ''],
    ['Lieu de naissance', p.lieuNaissance],
    ['CIN', p.numeroCIN],
    ['Email', p.email],
    ['Téléphone', p.telephoneMobile],
    ['Adresse actuelle', p.adresseActuelle],
    ['Statut familial', p.statutFamilial],
    ['Situation militaire', p.situationMilitaire],
    ['Spécialité', p.specialite?.libelle],
    ['Niveau d’instruction', p.niveauInstruction],
    ['Date d’entrée en service', p.dateEntreeService ? format(new Date(p.dateEntreeService), 'dd/MM/yyyy') : ''],
    ['Corps', p.corps],
    ['Taille', p.taille ? `${p.taille} m` : ''],
    ['Groupe sanguin', p.groupeSanguin],
    ['Religiosité', p.religion],
  ];
  return (
    <Carte titre="Identification">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {identite.map(([cle, valeur]) => (
          <div key={cle}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{cle}</dt>
            <dd className="mt-0.5 text-sm text-slate-800">{valeur || '—'}</dd>
          </div>
        ))}
      </dl>
    </Carte>
  );
}

function OngletDonnees({ pid, def, grades, unites }: { pid: string; def: DefOnglet; grades: Array<{ id: string; libelle: string }>; unites: Array<{ id: string; nom: string }> }) {
  const queryClient = useQueryClient();
  const [ajout, setAjout] = useState(false);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const liste = useQuery({
    queryKey: ['onglet', pid, def.cle],
    queryFn: () => api.onglets.lister(pid, def.clesApi) as Promise<OngletEntree[]>,
  });

  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) => api.onglets.creer(pid, def.clesApi, body),
    onSuccess: () => {
      setAjout(false);
      setValeurs({});
      void queryClient.invalidateQueries({ queryKey: ['onglet', pid, def.cle] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  async function supprimer(itemId: string) {
    if (!window.confirm(`Supprimer cet élément de « ${def.libelle} » ?`)) return;
    try {
      await api.onglets.supprimer(pid, def.clesApi, itemId);
      void queryClient.invalidateQueries({ queryKey: ['onglet', pid, def.cle] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  const options = (cle: string) =>
    cle === 'gradeId' ? grades.map((g) => ({ v: g.id, l: g.libelle }))
    : cle === 'uniteId' ? unites.map((u) => ({ v: u.id, l: u.nom }))
    : [];

  return (
    <Carte
      titre={def.libelle}
      action={
        <Bouton variante="secondaire" onClick={() => setAjout((v) => !v)}>
          <Plus size={15} /> Ajouter
        </Bouton>
      }
    >
      {liste.isLoading && <ChargementLigne />}
      {!liste.isLoading && (liste.data?.length ?? 0) === 0 && <EtatVide message="Aucune donnée dans cet onglet." />}
      {liste.data && liste.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-entete border-b border-slate-200 bg-slate-50">
              <tr>
                {def.colonnes.map((c) => <th key={c.k} className="hidden md:table-cell">{c.libelle}</th>)}
                <th className="md:hidden">{def.colonnes[0]?.libelle}</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liste.data.map((item) => (
                <tr key={item.id} className="table-ligne">
                  {def.colonnes.map((c) => (
                    <td key={c.k} className="cellule-table hidden text-xs text-slate-700 md:table-cell">
                      {c.k === 'grade' ? (item as any).grade?.libelle ?? item[c.k] ?? '—'
                        : c.k === 'unite' ? (item as any).unite?.nom ?? item[c.k] ?? '—'
                        : typeof item[c.k] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(String(item[c.k]))
                          ? format(new Date(String(item[c.k])), 'dd/MM/yyyy')
                          : item[c.k] ?? '—'}
                    </td>
                  ))}
                  <td className="cellule-table text-xs md:hidden">{String(item[def.colonnes[0].k] ?? '')}</td>
                  <td className="cellule-table text-right">
                    <button className="text-xs text-red-600 hover:underline" onClick={() => void supprimer(item.id)}>Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ajout && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {def.formulaire.map((f) => {
              const opt = options(f.k).length > 0 ? options(f.k) : f.options ?? [];
              return (
                <Champ key={f.k} label={f.libelle}>
                  {f.type === 'select' ? (
                    <Choix value={valeurs[f.k] ?? ''} onChange={(e) => setValeurs({ ...valeurs, [f.k]: e.target.value })}>
                      <option value="">—</option>
                      {opt.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </Choix>
                  ) : (
                    <Entree
                      type={f.type === 'date' ? 'date' : 'text'}
                      value={valeurs[f.k] ?? ''}
                      onChange={(e) => setValeurs({ ...valeurs, [f.k]: e.target.value })}
                    />
                  )}
                </Champ>
              );
            })}
          </div>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <div className="mt-3 flex gap-2">
            <Bouton onClick={() => mutation.mutate(valeurs)} disabled={mutation.isPending}>
              Enregistrer
            </Bouton>
            <Bouton variante="ghost" onClick={() => setAjout(false)}>Annuler</Bouton>
          </div>
        </div>
      )}
    </Carte>
  );
}

function Documents({ pid }: { pid: string }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Array<{ ok: boolean; texte: string }>>([]);

  const liste = useQuery({
    queryKey: ['pj', pid],
    queryFn: () => rawHttp(`/personnel/${pid}/pieces-jointes`) as Promise<unknown[]>,
  });

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fichier = fd.get('fichier') as File | null;
    const type = fd.get('type') as string | null;
    if (!fichier || fichier.size === 0) return;
    try {
      await multipart(`/personnel/${pid}/pieces-jointes`, fichier, type);
      setMessages((m) => [...m, { ok: true, texte: `Fichier ${fichier.name} ajouté.` }]);
      void queryClient.invalidateQueries({ queryKey: ['pj', pid] });
    } catch (error) {
      setMessages((m) => [...m, { ok: false, texte: error instanceof Error ? error.message : String(error) }]);
    }
  };

  return (
    <Carte titre="Pièces jointes">
      <form onSubmit={envoyer} className="mb-4 flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <Champ label="Type de pièce">
          <Choix name="type" required>
            <option value="AUTRE">Autre</option>
            <option value="DECISION">Décision</option>
            <option value="ARRETE">Arrêté</option>
            <option value="CONTRAT">Contrat</option>
            <option value="DIPLOME">Diplôme</option>
            <option value="RAPPORT">Rapport</option>
          </Choix>
        </Champ>
        <Champ label="Fichier (PDF, image, Word ≤ 10 Mo)">
          <Entree type="file" name="fichier" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" required />
        </Champ>
        <Bouton type="submit"><Upload size={15} /> Déposer</Bouton>
      </form>

      {messages.map((m, i) => (
        <p key={i} className={`mb-1 text-sm ${m.ok ? 'text-emerald-700' : 'text-red-600'}`}>{m.texte}</p>
      ))}

      {liste.isLoading && <ChargementLigne />}
      {(liste.data?.length ?? 0) === 0 && !liste.isLoading && <EtatVide message="Aucune pièce jointe." />}
      {liste.data && liste.data.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {liste.data.map((pj: any) => (
            <li key={pj.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{pj.nomOriginale}</p>
                <p className="text-xs text-slate-500">v{pj.versions?.length ?? 1} — {pj.type}</p>
              </div>
              <a
                className="inline-flex items-center gap-1 text-sm text-marine-700 hover:underline"
                href={`/api/pieces-jointes/${pj.id}/telecharger`}
                download
              >
                <Download size={14} /> Télécharger
              </a>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}

function DialogueDocuments({ ouvert, onFermer, pid }: { ouvert: boolean; onFermer: () => void; pid: string }) {
  const queryClient = useQueryClient();
  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fichier = fd.get('fichier') as File | null;
    const type = fd.get('type') as string | null;
    if (!fichier || fichier.size === 0) return;
    await multipart(`/personnel/${pid}/pieces-jointes`, fichier, type);
    void queryClient.invalidateQueries({ queryKey: ['pj', pid] });
    onFermer();
  };
  return (
    <Fenetre ouvert={ouvert} onFermer={onFermer} titre="Ajouter une pièce jointe">
      <form onSubmit={envoyer} className="space-y-3">
        <Champ label="Type">
          <Choix name="type"><option value="AUTRE">Autre</option><option value="DECISION">Décision</option><option value="ARRETE">Arrêté</option><option value="CONTRAT">Contrat</option><option value="DIPLOME">Diplôme</option></Choix>
        </Champ>
        <Champ label="Fichier">
          <Entree type="file" name="fichier" required />
        </Champ>
        <Bouton type="submit" className="w-full">Déposer</Bouton>
      </form>
    </Fenetre>
  );
}