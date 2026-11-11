import type { FC } from 'react'
import {
  Users,
  Thermometer,
  Wifi,
  Zap,
  Layers,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Activity,
  Maximize2
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import type { Building } from '../data/mockSensors'

interface SensorPanelProps {
  building: Building | null
  onClose?: () => void
}

export const SensorPanel: FC<SensorPanelProps> = ({ building, onClose }) => {
  if (!building) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[360px] border border-slate-800">
        <Activity className="w-12 h-12 text-cyan-500/40 mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-300">No Building Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
          Click on any 3D building on the campus map or search to inspect live sensor telemetry.
        </p>
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (building.status) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 glow-rose">
            <AlertCircle className="w-3.5 h-3.5" />
            CRITICAL ANOMALY
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-amber">
            <AlertTriangle className="w-3.5 h-3.5" />
            ELEVATED LOAD
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            NORMAL
          </span>
        )
    }
  }

  const getOccupancyColor = (occ: number) => {
    if (occ >= 90) return 'from-rose-500 to-rose-600'
    if (occ >= 75) return 'from-amber-500 to-orange-500'
    return 'from-cyan-400 to-blue-500'
  }

  return (
    <div className="glass-panel rounded-xl border border-slate-800/80 p-4 flex flex-col gap-4 text-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/50">
              {building.code}
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-400">
              {building.type}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{building.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close panel"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Anomaly Reason Banner (if warning or critical) */}
      {building.anomalyReason && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-300">Anomaly Detected (ML IsolationForest)</div>
            <div className="text-rose-200/90 mt-0.5 leading-relaxed">{building.anomalyReason}</div>
          </div>
        </div>
      )}

      {/* Primary Metric: Occupancy Gauge */}
      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Current Occupancy
          </span>
          <span className="font-mono font-bold text-sm text-cyan-300">
            {building.occupancy}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getOccupancyColor(building.occupancy)} transition-all duration-500`}
            style={{ width: `${building.occupancy}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
          <span>{building.currentOccupants.toLocaleString()} occupants</span>
          <span>Max: {building.capacity.toLocaleString()} cap</span>
        </div>
      </div>

      {/* Telemetry Sensor Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Temperature */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Temp & Humidity</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {building.temperature}°C <span className="text-xs text-slate-400 font-normal">/ {building.humidity}%</span>
            </div>
          </div>
        </div>

        {/* WiFi Devices */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500/10 text-blue-400">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">WiFi Devices</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {building.wifiDevices.toLocaleString()} <span className="text-[10px] text-slate-400">AP clients</span>
            </div>
          </div>
        </div>

        {/* Power Draw */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Power Load</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {building.powerKW} <span className="text-xs text-slate-400 font-normal">kW</span>
            </div>
          </div>
        </div>

        {/* Floors & Structure */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500/10 text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Levels & ML Score</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {building.floorCount} Fl <span className="text-[10px] text-cyan-600 dark:text-cyan-400">• ML {building.anomalyScore.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Telemetry Chart */}
      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-mono text-[11px] uppercase tracking-wider">Hourly Sensor Dynamics (60m)</span>
          <span className="text-[10px] text-cyan-400 font-mono">Occupancy %</span>
        </div>
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={building.history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="sensorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#475569" fontSize={9} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  fontSize: '11px',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                }}
              />
              <Area
                type="monotone"
                dataKey="occupancy"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#sensorGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Zones */}
      <div>
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
          Active Monitored Zones
        </div>
        <div className="flex flex-wrap gap-1.5">
          {building.zones.map((zone, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 font-mono"
            >
              {zone}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
