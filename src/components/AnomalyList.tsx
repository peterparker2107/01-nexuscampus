import { AlertCircle, AlertTriangle, Radio, ExternalLink } from 'lucide-react'
import type { AnomalyEvent, Building } from '../data/mockSensors'

interface AnomalyListProps {
  anomalies: AnomalyEvent[]
  buildings: Building[]
  onSelectBuilding: (building: Building) => void
}

export const AnomalyList: React.FC<AnomalyListProps> = ({
  anomalies,
  buildings,
  onSelectBuilding,
}) => {
  const handleAnomalyClick = (anom: AnomalyEvent) => {
    const targetBuilding = buildings.find((b) => b.id === anom.buildingId)
    if (targetBuilding) {
      onSelectBuilding(targetBuilding)
    }
  }

  return (
    <div className="glass-panel rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-rose-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase font-mono">
            IsolationForest Live Alerts
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {anomalies.length} ACTIVE
        </span>
      </div>

      {/* Anomaly Stream */}
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {anomalies.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 font-mono">
            No sensor anomalies detected across campus. Baseline normal.
          </div>
        ) : (
          anomalies.map((anom) => {
            const isCritical = anom.severity === 'critical'
            return (
              <div
                key={anom.id}
                onClick={() => handleAnomalyClick(anom)}
                className={`p-2.5 rounded-lg border transition cursor-pointer group flex flex-col gap-1.5 ${
                  isCritical
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 hover:border-rose-400 dark:hover:border-rose-500/80 hover:bg-rose-100/50 dark:hover:bg-rose-950/50'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-500/80 hover:bg-amber-100/50 dark:hover:bg-amber-950/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    {isCritical ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition">
                      {anom.buildingName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400">{anom.timestamp}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">{anom.metric}:</span>
                  <span className={isCritical ? 'text-rose-300 font-bold' : 'text-amber-300 font-bold'}>
                    {anom.value}
                  </span>
                  <span className="text-[10px] text-slate-500">exp: {anom.expected}</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  {anom.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5 border-t border-slate-800/60">
                  <span>ML Score: {anom.score.toFixed(2)}</span>
                  <span className="text-cyan-400 group-hover:underline">Inspect 3D Node &rarr;</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
