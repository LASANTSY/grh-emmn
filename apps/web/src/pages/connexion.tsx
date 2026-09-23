import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/http';
import { Bouton, Champ, Entree } from '@/components/ui';

export function Connexion() {
  const { seConnecter } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await seConnecter(identifiant, motDePasse);
      navigate('/', { replace: true });
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : t('commun.erreurReseau'));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marine-900 via-marine-800 to-marine-950 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3">
            <img src="/logo.png" alt="Logo EMMN" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">{t('app')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('sousTitre')}</p>
        </div>

        {erreur && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle size={16} />
            {erreur}
          </div>
        )}

        <form onSubmit={soumettre} className="space-y-4">
          <Champ label={t('identifiant')}>
            <Entree value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} autoFocus required />
          </Champ>
          <Champ label={t('motDePasse')}>
            <div className="relative">
              <Entree
                type={afficherMotDePasse ? 'text' : 'password'}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setAfficherMotDePasse((v) => !v)}
                aria-label={afficherMotDePasse ? t('masquerMotDePasse') : t('afficherMotDePasse')}
                title={afficherMotDePasse ? t('masquerMotDePasse') : t('afficherMotDePasse')}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-marine-700"
              >
                {afficherMotDePasse ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Champ>
          <Bouton type="submit" variante="primaire" className="w-full" disabled={enCours}>
            {enCours ? t('commun.chargement') : t('seConnecter')}
          </Bouton>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          État-Major de la Marine Nationale — Direction des Ressources Humaines
        </p>
      </div>
    </div>
  );
}