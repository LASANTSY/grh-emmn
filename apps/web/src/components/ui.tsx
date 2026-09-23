import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/classes';

export type Variante = 'primaire' | 'secondaire' | 'danger' | 'ghost';

const VARIANTES: Record<Variante, string> = {
  primaire: 'bg-marine-700 text-white hover:bg-marine-800',
  secondaire: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

export function Bouton({ variante = 'primaire', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button className={cn('btn', VARIANTES[variante], className)} {...props} />;
}

export function Carte({ titre, action, children, className }: { titre?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('carte', className)}>
      {(titre || action) && (
        <header className="entete-carte flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-800">{titre}</h2>
          {action}
        </header>
      )}
      <div className={titre || action ? 'body-carte' : 'p-4'}>{children}</div>
    </section>
  );
}

export function Champ({ label, erreur, children }: { label: ReactNode; erreur?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {erreur && <p className="mt-1 text-xs text-red-600">{erreur}</p>}
    </div>
  );
}

export function Entree(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...reste } = props;
  return <input className={cn('input', className)} {...reste} />;
}

export function Zone(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input" {...props} />;
}

export function Choix(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input" {...props} />;
}

export type StatutCouleur = 'vert' | 'rouge' | 'ambre' | 'gris' | 'bleu' | 'violet';

const COULEURS: Record<StatutCouleur, string> = {
  vert: 'bg-emerald-100 text-emerald-800',
  rouge: 'bg-red-100 text-red-700',
  ambre: 'bg-amber-100 text-amber-800',
  gris: 'bg-slate-100 text-slate-600',
  bleu: 'bg-marine-100 text-marine-800',
  violet: 'bg-violet-100 text-violet-800',
};

export function Badge({ couleur = 'gris', children, className }: { couleur?: StatutCouleur; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', COULEURS[couleur], className)}>{children}</span>;
}

export function PetitesDonnees({ entete, defaut = [], options }: { entete: string; defaut?: string[]; options: string[] | readonly string[] }) {
  return (
    <Choix defaultValue={defaut[0]}>
      <option value="">{entete}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </Choix>
  );
}

export function EtatVide({ message, action }: { message: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
      {action}
    </div>
  );
}

export function Fenetre({ ouvert, titre, onFermer, largeur = 'max-w-lg', children }: { ouvert: boolean; titre: ReactNode; onFermer: () => void; largeur?: string; children: ReactNode }) {
  if (!ouvert) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onFermer}>
      <div className={cn('w-full rounded-lg bg-white shadow-xl', largeur)} onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-semibold text-slate-800">{titre}</h3>
          <button className="text-slate-400 hover:text-slate-600" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </header>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function ChargementLigne() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="h-8 animate-pulse rounded bg-slate-100" style={{ width: `${100 - n * 8}%` }} />
      ))}
    </div>
  );
}