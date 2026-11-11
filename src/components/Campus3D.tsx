import { useRef } from 'react'
import type { FC } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { Building } from '../data/mockSensors'

interface Campus3DProps {
  buildings: Building[]
  selectedBuilding: Building | null
  onSelectBuilding: (building: Building) => void
  theme?: 'light' | 'dark'
}

function getBuildingBaseColor(building: Building): string {
  if (building.status === 'critical') return '#ef4444' // Bright Red
  if (building.status === 'warning') return '#f59e0b' // Amber
  if (building.occupancy > 75) return '#3b82f6' // Blue
  return '#06b6d4' // Cyan
}

interface BuildingMeshProps {
  building: Building
  isSelected: boolean
  onSelect: (b: Building) => void
}

const BuildingMesh: FC<BuildingMeshProps> = ({ building, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const baseColor = getBuildingBaseColor(building)

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    const t = clock.getElapsedTime()

    if (building.status === 'critical') {
      const pulse = 0.5 + Math.sin(t * 5) * 0.45
      materialRef.current.emissive.set('#ef4444')
      materialRef.current.emissiveIntensity = pulse
    } else if (building.status === 'warning') {
      const pulse = 0.3 + Math.sin(t * 3.5) * 0.25
      materialRef.current.emissive.set('#f59e0b')
      materialRef.current.emissiveIntensity = pulse
    } else if (isSelected) {
      const pulse = 0.4 + Math.sin(t * 4) * 0.3
      materialRef.current.emissive.set('#38bdf8')
      materialRef.current.emissiveIntensity = pulse
    } else {
      materialRef.current.emissive.set('#0369a1')
      materialRef.current.emissiveIntensity = 0.15
    }
  })

  const [w, h, d] = building.size
  const [posX, , posZ] = building.position
  const centerY = h / 2

  return (
    <group position={[posX, 0, posZ]}>
      {/* Main Building Box */}
      <mesh
        ref={meshRef}
        position={[0, centerY, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(building)
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          ref={materialRef}
          color={baseColor}
          roughness={0.25}
          metalness={0.8}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Building Wireframe Outline for Cyber / Digital Twin aesthetic */}
      <lineSegments position={[0, centerY, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(w + 0.05, h + 0.05, d + 0.05)]} />
        <lineBasicMaterial
          color={isSelected ? '#ffffff' : building.status === 'critical' ? '#fda4af' : '#67e8f9'}
          linewidth={isSelected ? 2 : 1}
          transparent
          opacity={isSelected ? 0.95 : 0.45}
        />
      </lineSegments>

      {/* Base Pedestal Ring */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(w, d) * 0.65, Math.max(w, d) * 0.72, 32]} />
        <meshBasicMaterial
          color={isSelected ? '#38bdf8' : building.status === 'critical' ? '#ef4444' : '#1e293b'}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating HTML Label above building */}
      <Html position={[0, h + 0.8, 0]} center distanceFactor={28} zIndexRange={[100, 0]}>
        <div
          onClick={(e) => {
            e.stopPropagation()
            onSelect(building)
          }}
          className={`cursor-pointer transition-all duration-300 transform -translate-y-2 select-none group ${
            isSelected
              ? 'scale-110 ring-2 ring-nexus-cyan shadow-[0_0_20px_rgba(56,189,248,0.8)]'
              : 'hover:scale-105'
          } rounded-lg px-2.5 py-1.5 flex flex-col items-center whitespace-nowrap backdrop-blur-md border ${
            building.status === 'critical'
              ? 'bg-rose-950/85 border-rose-500/80 text-rose-200'
              : building.status === 'warning'
              ? 'bg-amber-950/85 border-amber-500/80 text-amber-200'
              : 'bg-slate-900/85 border-cyan-500/50 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                building.status === 'critical'
                  ? 'bg-rose-500 animate-ping'
                  : building.status === 'warning'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="font-semibold text-xs text-white">{building.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] opacity-90 mt-0.5">
            <span className="font-mono text-cyan-300">{building.occupancy}% OCC</span>
            <span>•</span>
            <span className="font-mono">{building.temperature}°C</span>
          </div>
        </div>
      </Html>
    </group>
  )
}

function CameraRig({ selectedBuilding }: { selectedBuilding: Building | null }) {
  const controlsRef = useRef<any>(null)

  useFrame(() => {
    if (controlsRef.current && selectedBuilding) {
      const targetVec = new THREE.Vector3(
        selectedBuilding.position[0],
        selectedBuilding.size[1] / 2,
        selectedBuilding.position[2]
      )
      controlsRef.current.target.lerp(targetVec, 0.05)
      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2.05} // don't go under ground
      minDistance={10}
      maxDistance={90}
    />
  )
}

export const Campus3D: FC<Campus3DProps> = ({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  theme = 'light',
}) => {
  const isDark = theme === 'dark'
  const bgColor = isDark ? '#070b13' : '#e2e8f0'
  const fogColor = isDark ? '#070b13' : '#e2e8f0'
  const cellColor = isDark ? '#0e2338' : '#cbd5e1'
  const sectionColor = isDark ? '#0ea5e9' : '#0284c7'
  const roadColor = isDark ? '#0c1729' : '#94a3b8'
  return (
    <div className="relative w-full h-full bg-[#070b13]">
      <Canvas
        camera={{ position: [28, 30, 36], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[fogColor, 45, 110]} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[30, 50, 20]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={120}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />
        <pointLight position={[0, 20, 0]} intensity={1.8} color="#38bdf8" distance={70} />

        {/* Ground Cyber Grid */}
        <Grid
          position={[0, 0, 0]}
          args={[120, 120]}
          cellSize={2}
          cellThickness={1}
          cellColor="#0e2338"
          sectionSize={10}
          sectionThickness={1.5}
          sectionColor="#0ea5e9"
          fadeDistance={75}
          fadeStrength={1.2}
        />

        {/* TIET Main Road / Campus Spine */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 80]} />
          <meshBasicMaterial color={roadColor} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 80]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
        </mesh>

        {/* Cross boulevard */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[5, 80]} />
          <meshBasicMaterial color={roadColor} />
        </mesh>

        {/* TIET Central Plaza Fountain / Landmark */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[4, 4.5, 0.6, 32]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 0.1, 32]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
        </mesh>

        {/* Buildings */}
        {buildings.map((building) => (
          <BuildingMesh
            key={building.id}
            building={building}
            isSelected={selectedBuilding?.id === building.id}
            onSelect={onSelectBuilding}
          />
        ))}

        {/* Camera Rig & Orbit Controls */}
        <CameraRig selectedBuilding={selectedBuilding} />
      </Canvas>

      {/* Floating HUD overlays */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-cyan-500/30 text-xs font-mono text-cyan-700 dark:text-cyan-400 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>TIET 3D TWIN ENGINE ACTIVE</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">CLICK ANY BUILDING TO INSPECT</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 flex flex-col gap-1.5 shadow-lg">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Status Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
          <span>Normal (&lt; 75% occ)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
          <span>Dense (&gt; 75% occ)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
          <span>Warning / Anomaly</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
          <span>Critical Outlier (ML flag)</span>
        </div>
      </div>
    </div>
  )
}
