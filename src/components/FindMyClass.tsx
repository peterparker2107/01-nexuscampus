import { useState, useMemo, useRef, useEffect } from 'react'
import type { FC } from 'react'
import { Search, MapPin, X, ChevronRight, Compass } from 'lucide-react'
import type { Building } from '../data/mockSensors'

interface FindMyClassProps {
  buildings: Building[]
  onSelectBuilding: (building: Building) => void
}

export const FindMyClass: FC<FindMyClassProps> = ({ buildings, onSelectBuilding }) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close suggestions if clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const matchesType = selectedType === 'all' || b.type === selectedType
      if (!matchesType) return false

      if (!query.trim()) return true

      const q = query.toLowerCase()
      const matchesName = b.name.toLowerCase().includes(q)
      const matchesCode = b.code.toLowerCase().includes(q)
      const matchesZones = b.zones.some((z) => z.toLowerCase().includes(q))
      const matchesTags = b.tags.some((t) => t.toLowerCase().includes(q))

      return matchesName || matchesCode || matchesZones || matchesTags
    })
  }, [buildings, query, selectedType])

  const handleSelect = (b: Building) => {
    onSelectBuilding(b)
    setIsOpen(false)
    setQuery(b.name)
  }

  const clearQuery = () => {
    setQuery('')
    setSelectedType('all')
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-cyan-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          placeholder="Find my class, lab, or hostel (e.g. AI, LT, Mess)..."
          className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 backdrop-blur transition shadow-xs font-sans"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Quick Pills */}
      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-xs">
        {['all', 'academic', 'hostel', 'library', 'recreational'].map((typeKey) => (
          <button
            key={typeKey}
            onClick={() => {
              setSelectedType(typeKey)
              setIsOpen(true)
            }}
            className={`px-2.5 py-0.5 rounded-full capitalize font-mono text-[11px] whitespace-nowrap transition border ${
              selectedType === typeKey
                ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/50'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {typeKey}
          </button>
        ))}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl z-50 divide-y divide-slate-200/60 dark:divide-slate-800/60">
          <div className="p-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>TIET Campus Locations ({filteredBuildings.length})</span>
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" /> Click to fly
            </span>
          </div>

          {filteredBuildings.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No building or lab matched &quot;{query}&quot;
            </div>
          ) : (
            filteredBuildings.map((building) => (
              <div
                key={building.id}
                onClick={() => handleSelect(building)}
                className="p-2.5 hover:bg-slate-900/90 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                      building.status === 'critical'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : building.status === 'warning'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition flex items-center gap-1.5">
                      {building.name}
                      <span className="text-[10px] font-mono text-slate-400 px-1 py-0.2 bg-slate-800 rounded">
                        {building.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {building.zones.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span
                      className={`text-xs font-mono font-bold ${
                        building.occupancy > 80 ? 'text-amber-400' : 'text-cyan-400'
                      }`}
                    >
                      {building.occupancy}%
                    </span>
                    <div className="text-[10px] text-slate-500 uppercase">{building.status}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
