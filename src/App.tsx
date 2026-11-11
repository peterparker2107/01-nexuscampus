import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Zap,
  Users,
  Wifi,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Flame,
  Clock,
  Cpu,
  Sun,
  Moon
} from 'lucide-react'
import {
  TIET_BUILDINGS,
  INITIAL_ANOMALIES,
  type Building,
  type AnomalyEvent
} from './data/mockSensors'
import { Campus3D } from './components/Campus3D'
import { SensorPanel } from './components/SensorPanel'
import { FindMyClass } from './components/FindMyClass'
import { AnomalyList } from './components/AnomalyList'

export function App() {
  const [buildings, setBuildings] = useState<Building[]>(TIET_BUILDINGS)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('csed')
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>(INITIAL_ANOMALIES)
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString())
  const [chaosLog, setChaosLog] = useState<string | null>(null)

  // Theme state: default to Light Mode per requirements
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('nexus_theme')
    if (stored === 'dark' || stored === 'light') return stored
    return 'light'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('nexus_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Background sensor telemetry subtle jitter (simulating live IoT broker)
  useEffect(() => {
    const interval = setInterval(() => {
      setBuildings((prevBuildings) =>
        prevBuildings.map((b) => {
          // If in critical injected state, keep it high; otherwise normal slight jitter
          if (b.status === 'critical') return b

          const occJitter = (Math.random() - 0.5) * 1.5
          const newOcc = Math.max(10, Math.min(99, Math.round(b.occupancy + occJitter)))
          const newCurrent = Math.round((newOcc / 100) * b.capacity)
          const tempJitter = Math.round((Math.random() - 0.5) * 0.2 * 10) / 10
          const newTemp = Math.round((b.temperature + tempJitter) * 10) / 10
          const deviceJitter = Math.round((Math.random() - 0.5) * 6)
          const newDevices = Math.max(20, b.wifiDevices + deviceJitter)

          return {
            ...b,
            occupancy: newOcc,
            currentOccupants: newCurrent,
            temperature: newTemp,
            wifiDevices: newDevices,
          }
        })
      )
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  const selectedBuilding = useMemo(() => {
    return buildings.find((b) => b.id === selectedBuildingId) || null
  }, [buildings, selectedBuildingId])

  // Aggregate campus metrics
  const campusStats = useMemo(() => {
    const totalOccupants = buildings.reduce((acc, b) => acc + b.currentOccupants, 0)
    const totalCapacity = buildings.reduce((acc, b) => acc + b.capacity, 0)
    const totalDevices = buildings.reduce((acc, b) => acc + b.wifiDevices, 0)
    const totalPower = Math.round(buildings.reduce((acc, b) => acc + b.powerKW, 0) * 10) / 10
    const avgTemp =
      Math.round((buildings.reduce((acc, b) => acc + b.temperature, 0) / buildings.length) * 10) / 10
    const overallOccupancy = Math.round((totalOccupants / totalCapacity) * 100)

    const normalCount = buildings.filter((b) => b.status === 'normal').length
    const warningCount = buildings.filter((b) => b.status === 'warning').length
    const criticalCount = buildings.filter((b) => b.status === 'critical').length

    return {
      totalOccupants,
      totalCapacity,
      totalDevices,
      totalPower,
      avgTemp,
      overallOccupancy,
      normalCount,
      warningCount,
      criticalCount,
    }
  }, [buildings])

  // Select building callback
  const handleSelectBuilding = useCallback((building: Building) => {
    setSelectedBuildingId(building.id)
  }, [])

  // Chaos Injection Button: Simulates unexpected hardware / crowd failure for ML IsolationForest demo
  const handleInjectChaos = () => {
    const candidateIds = ['central-library', 'sports-complex', 'ece-block', 'admin-block', 'hostel-a']
    const randomId = candidateIds[Math.floor(Math.random() * candidateIds.length)]

    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === randomId) {
          return {
            ...b,
            occupancy: 98,
            currentOccupants: Math.round(b.capacity * 0.98),
            temperature: 31.4,
            powerKW: Math.round(b.powerKW * 2.2 * 10) / 10,
            wifiDevices: Math.round(b.wifiDevices * 1.8),
            status: 'critical',
            anomalyScore: 0.96,
            anomalyReason: 'CHAOS INJECTION: Unscheduled mega-event detected. Power & thermal thresholds violated.',
          }
        }
        return b
      })
    )

    const targetB = buildings.find((b) => b.id === randomId)
    const buildingName = targetB ? targetB.name : randomId

    const newAnomaly: AnomalyEvent = {
      id: `anom-chaos-${Date.now()}`,
      buildingId: randomId,
      buildingName,
      timestamp: 'Just now',
      severity: 'critical',
      metric: 'Severe Power/Thermal Spike',
      value: '31.4°C / 98% OCC',
      expected: '< 24.0°C / 65% OCC',
      score: 0.96,
      description: `IsolationForest detected sudden 2.2x power surge and capacity saturation at ${buildingName}.`,
    }

    setAnomalies((prev) => [newAnomaly, ...prev.slice(0, 9)])
    setSelectedBuildingId(randomId)
    setChaosLog(`Injected synthetic anomaly into ${buildingName}!`)

    setTimeout(() => setChaosLog(null), 4500)
  }

  // Reset baseline
  const handleResetBaseline = () => {
    setBuildings(TIET_BUILDINGS)
    setAnomalies(INITIAL_ANOMALIES)
    setSelectedBuildingId('csed')
    setChaosLog('Restored campus baseline telemetry.')
    setTimeout(() => setChaosLog(null), 3000)
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-100 dark:bg-[#070b13] text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors duration-200">
      {/* Top Bar Navigation & Campus Telemetry Ribbon - Frosted Header */}
      <header className="h-14 bg-white/85 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-800/80 px-4 flex items-center justify-between z-20 backdrop-blur-md shadow-xs transition-colors duration-200">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center glow-cyan shadow-sm">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wider text-slate-900 dark:text-white">NEXUSCAMPUS</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-500/40 font-bold">
                TIET TWIN v2.5
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Thapar Institute of Eng. & Tech. Live Spatial Digital Twin
            </p>
          </div>
        </div>

        {/* Global Live Campus Metrics Bento Row */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-slate-500 dark:text-slate-400">Occupancy:</span>
            <span className="text-slate-900 dark:text-white font-bold">{campusStats.totalOccupants.toLocaleString()}</span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px]">({campusStats.overallOccupancy}%)</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Wifi className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-500 dark:text-slate-400">WiFi APs:</span>
            <span className="text-slate-900 dark:text-white font-bold">{campusStats.totalDevices.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-slate-500 dark:text-slate-400">Grid Load:</span>
            <span className="text-slate-900 dark:text-white font-bold">{campusStats.totalPower} kW</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Ambient:</span>
            <span className="text-slate-900 dark:text-white font-bold">{campusStats.avgTemp}°C</span>
          </div>
        </div>

        {/* Status / Clock / Dark Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>ML ENGINE: ONLINE</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Mission Control Layout: Left Sidebar, Center 3D, Right Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chaos notification banner */}
        {chaosLog && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-mono flex items-center gap-2 shadow-2xl animate-bounce">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>{chaosLog}</span>
          </div>
        )}

        {/* LEFT PANEL: Search + Selected Building Sensor Telemetry + Anomaly Stream */}
        <aside className="w-96 flex flex-col gap-3 p-3 bg-white/80 dark:bg-slate-950/80 border-r border-slate-200 dark:border-slate-800/80 backdrop-blur-md overflow-y-auto z-10 transition-colors duration-200">
          {/* Find My Class search component */}
          <FindMyClass buildings={buildings} onSelectBuilding={handleSelectBuilding} />

          {/* Detailed Sensor Telemetry Panel for current selection */}
          <SensorPanel building={selectedBuilding} />

          {/* Anomaly Alerts Stream */}
          <AnomalyList
            anomalies={anomalies}
            buildings={buildings}
            onSelectBuilding={handleSelectBuilding}
          />
        </aside>

        {/* CENTER: 3D Interactive Three.js Digital Twin Canvas */}
        <main className="flex-1 relative h-full">
          <Campus3D
            buildings={buildings}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleSelectBuilding}
            theme={theme}
          />
        </main>

        {/* RIGHT PANEL: Campus Analytics, Controls & Chaos Button */}
        <aside className="w-80 flex flex-col gap-3 p-3 bg-white/80 dark:bg-slate-950/80 border-l border-slate-200 dark:border-slate-800/80 backdrop-blur-md overflow-y-auto z-10 transition-colors duration-200">
          {/* Controls Box */}
          <div className="glass-panel rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Simulation Controls
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Offline Local ML</span>
            </div>

            {/* Chaos Injection Button */}
            <button
              onClick={handleInjectChaos}
              className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg glow-rose transition transform active:scale-95"
            >
              <Flame className="w-4 h-4" />
              INJECT SENSOR CHAOS (ML DEMO)
            </button>

            {/* Reset Baseline Button */}
            <button
              onClick={handleResetBaseline}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Reset Normal Baseline
            </button>
          </div>

          {/* Campus Health & Status Breakdown - Bento Tiles */}
          <div className="glass-panel rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Building Status Breakdown
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center">
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {campusStats.normalCount}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-semibold">Normal</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex flex-col items-center">
                <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                  {campusStats.warningCount}
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 uppercase tracking-wider font-semibold">Warning</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex flex-col items-center">
                <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                  {campusStats.criticalCount}
                </span>
                <span className="text-[10px] text-rose-700 dark:text-rose-300 uppercase tracking-wider font-semibold">Critical</span>
              </div>
            </div>
          </div>

          {/* Quick Building Directory Navigator */}
          <div className="glass-panel rounded-xl p-3.5 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
              <span>TIET Node Selector</span>
              <span className="text-[10px] text-cyan-400">{buildings.length} Nodes</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {buildings.map((b) => {
                const isSelected = b.id === selectedBuildingId
                return (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBuilding(b)}
                    className={`p-2 rounded-lg text-left text-xs font-mono transition border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-500 text-cyan-700 dark:text-cyan-300 glow-cyan'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-[11px] truncate">{b.code}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          b.status === 'critical'
                            ? 'bg-rose-500'
                            : b.status === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-1">{b.name}</div>
                    <div className="text-[10px] text-cyan-400 font-bold mt-0.5">{b.occupancy}% OCC</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI / ML Model Details */}
          <div className="glass-panel rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-semibold text-[11px] font-mono uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              IsolationForest Architecture
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              Multivariate IsolationForest scoring (contamination=0.08). Evaluates real-time occupancy surges, thermal drift, grid power, and AP cluster density completely client-side.
            </p>
            <div className="mt-1 pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-cyan-600 dark:text-cyan-400 flex justify-between">
              <span>Latency: &lt; 2.4 ms</span>
              <span>Mode: 100% Client-Side Engine</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
