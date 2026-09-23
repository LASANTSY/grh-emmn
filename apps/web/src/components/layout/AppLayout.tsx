import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3, BookOpen, FileSpreadsheet, LayoutDashboard, LogOut,
  ScrollText, ShieldCheck, Users, UserCog,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { pagesPourRole } from '@/lib/roles';
import { changerLangue } from '@/lib/i18n';
import { cn } from '@/lib/classes';
import { Badge } from '@/components/ui';

const META: Array<{ chemin: string; libelle: string; icone: React.ReactNode }> = [
  { chemin: '/', libelle: 'menu.tableauDeBord', icone: <LayoutDashboard size={18} /> },
  { chemin: '/effectifs', libelle: 'menu.effectifs', icone: <Users size={18} /> },
  { chemin: '/referentiels', libelle: 'menu.referentiels', icone: <BookOpen size={18} /> },
  { chemin: '/utilisateurs', libelle: 'menu.utilisateurs', icone: <UserCog size={18} /> },
  { chemin: '/demandes', libelle: 'menu.demandes', icone: <FileSpreadsheet size={18} /> },
  { chemin: '/audit', libelle: 'menu.audit', icone: <ScrollText size={18} /> },
  { chemin: '/rapports', libelle: 'menu.rapports', icone: <BarChart3 size={18} /> },
];

const LIBELLE_ROLE: Record<string, string> = {
  ADMIN_SYSTEME: 'Administrateur système',
  RH_ETAT_MAJOR: "RH État-Major",
  RH_BASE: 'RH Base',
  CHEF_COMMANDEMENT: 'Chef de commandement',
  PERSONNEL: 'Personnel',
};

export function AppLayout() {
  const { compte, seDeconnecter } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  if (!compte) return null;
  const pages = new Set(pagesPourRole(compte.typeCompte));

  const menu = META.filter((m) => pages.has(m.chemin));

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-marine-900 text-white">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <img src="/logo.png" alt="Logo EMMN" className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wider">{t('app')}</p>
            <p className="text-[11px] text-marine-300">EMMN / GRH</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menu.map((item) => (
            <NavLink
              key={item.chemin}
              to={item.chemin}
              end={item.chemin === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-marine-700 text-white' : 'text-marine-200 hover:bg-marine-800 hover:text-white',
                )
              }
            >
              {item.icone}
              {t(item.libelle)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck size={16} className="text-marine-300" />
            <Badge className="bg-marine-700 text-white">{LIBELLE_ROLE[compte.typeCompte]}</Badge>
          </div>
          <button
            onClick={() => { void seDeconnecter().then(() => navigate('/connexion')); }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-marine-200 hover:bg-marine-800"
          >
            <LogOut size={16} />
            {t('deconnexion')}
          </button>
        </div>
      </aside>

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
          <p className="text-sm text-slate-500">{t('sousTitre')}</p>
          <div className="flex items-center gap-3">
            <select
              value={i18n.language}
              onChange={(e) => changerLangue(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="mg">Malagasy</option>
            </select>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-marine-100 text-xs font-bold uppercase text-marine-800">
              {compte.identifiant.slice(0, 2)}
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}