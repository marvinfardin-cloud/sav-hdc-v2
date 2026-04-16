import { STATUT_LABELS, STATUT_ORDER, formatDateTime } from "@/lib/utils";

interface HistoriqueItem {
  id: string;
  statut: string;
  note?: string | null;
  createdAt: string | Date;
}

interface StatusTimelineProps {
  historique: HistoriqueItem[];
  currentStatut: string;
}

export function StatusTimeline({ historique, currentStatut }: StatusTimelineProps) {
  return (
    <div className="space-y-0">
      {STATUT_ORDER.map((statut, index) => {
        const histEntry = historique.find((h) => h.statut === statut);
        const isPast = histEntry !== undefined;
        const isCurrent = statut === currentStatut;
        const isLast = index === STATUT_ORDER.length - 1;

        return (
          <div key={statut} className="flex gap-4">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all
                  ${isCurrent
                    ? "bg-navy-700 border-navy-700 text-white shadow-md"
                    : isPast
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-white border-gray-200 text-gray-300"
                  }`}
              >
                {isPast && !isCurrent ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 mt-1 mb-1 min-h-[24px] ${isPast ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-center gap-2 pt-1.5">
                <p
                  className={`text-sm font-semibold ${
                    isCurrent ? "text-navy-700" : isPast ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {STATUT_LABELS[statut]}
                </p>
                {isCurrent && (
                  <span className="text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full font-medium">
                    Actuel
                  </span>
                )}
              </div>
              {histEntry && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateTime(histEntry.createdAt)}
                </p>
              )}
              {histEntry?.note && (
                <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  {histEntry.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
