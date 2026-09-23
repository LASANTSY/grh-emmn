import { Download } from 'lucide-react';
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
            className="btn pri inline-flex items-center gap-2 rounded-md bg-marine-700 px-4 py-2 text-sm text-white hover:bg-marine-800"
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
      </div>
    </div>
  );
}