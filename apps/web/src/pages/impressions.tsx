import { Download, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { Carte } from '@/components/ui';

export function Impressions() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Rapports</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Carte titre="Exporter les effectifs (Excel)">
          <p className="mb-3 text-sm text-slate-500">
            Liste complète du personnel conforme au référentiel : identité, grades, affectations et coordonnées.
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-marine-700 px-4 py-2 text-sm text-white hover:bg-marine-800"
            onClick={() => void api.rapports.excel()}
          >
            <Download size={16} /> Télécharger (XLSX)
          </button>
        </Carte>
        <Carte titre="Rapport de synthèse (PDF)">
          <p className="mb-3 text-sm text-slate-500">
            Synthèse des effectifs, répartition par base / unité et pyramide des âges au format PDF.
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-marine-700 px-4 py-2 text-sm text-white hover:bg-marine-800"
            onClick={() => void api.rapports.pdf()}
          >
            <Download size={16} /> Télécharger (PDF)
          </button>
        </Carte>

        <Carte titre="Classement par grade (PDF et Excel)">
          <p className="mb-3 text-sm text-slate-500">
            Classement des personnels par grade avec sous-totaux, conformément au CDC §2.3.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-marine-700 px-4 py-2 text-sm text-white hover:bg-marine-800"
              onClick={() => void api.rapports.classementGradePdf()}
            >
              <FileText size={16} /> PDF
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-700"
              onClick={() => void api.rapports.classementGradeExcel()}
            >
              <Download size={16} /> Excel
            </button>
          </div>
        </Carte>

        <Carte titre="Personnel par unité (Excel)">
          <p className="mb-3 text-sm text-slate-500">
            Effectifs détaillés par base et unité avec sous-totaux et total général.
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-marine-700 px-4 py-2 text-sm text-white hover:bg-marine-800"
            onClick={() => void api.rapports.personnelUniteExcel()}
          >
            <Download size={16} /> Télécharger (XLSX)
          </button>
        </Carte>

        <Carte titre="Fiche individuelle (PDF)">
          <p className="mb-3 text-sm text-slate-500">
            Une fiche complète d’un personnel est imprimable depuis sa page (bouton « Imprimer la fiche »).
          </p>
          <a className="inline-block" href="/effectifs">
            <span className="inline-flex items-center gap-2 rounded-md bg-marine-700 px-4 py-2 text-sm text-white hover:bg-marine-800">
              <FileText size={16} /> Ouvrir les effectifs
            </span>
          </a>
        </Carte>
      </div>
    </div>
  );
}