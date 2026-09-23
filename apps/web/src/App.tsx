import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Connexion } from '@/pages/connexion';
import { AppLayout } from '@/components/layout/AppLayout';
import { TableauDeBord } from '@/pages/tableau-de-bord';
import { Effectifs } from '@/pages/effectifs';
import { FichePersonnel } from '@/pages/fiche-personnel';
import { Referentiels } from '@/pages/referentiels';
import { Utilisateurs } from '@/pages/utilisateurs';
import { Demandes } from '@/pages/demandes';
import { Audit } from '@/pages/audit';
import { Impressions } from '@/pages/impressions';
import { RequisRole } from '@/lib/roles';

function RequisAuth({ children }: { children: React.ReactNode }) {
  const { chargement, connecte } = useAuth();
  if (chargement) return <EtageChargement />;
  if (!connecte) return <Navigate to="/connexion" replace />;
  return <>{children}</>;
}

export function EtageChargement() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-marine-300 border-t-marine-700" />
        <p className="text-sm text-slate-500">Chargement…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<Connexion />} />
      <Route
        element={
          <RequisAuth>
            <AppLayout />
          </RequisAuth>
        }
      >
        <Route index element={<TableauDeBord />} />
        <Route path="effectifs" element={<Effectifs />} />
        <Route path="personnel/:id" element={<FichePersonnel />} />
        <Route path="referentiels" element={<Referentiels />} />
        <Route path="utilisateurs" element={<Utilisateurs />} />
        <Route path="demandes" element={<Demandes />} />
        <Route path="audit" element={<Audit />} />
        <Route
          path="rapports"
          element={
            <RequisRole roles={['ADMIN_SYSTEME', 'RH_ETAT_MAJOR']}>
              <Impressions />
            </RequisRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}