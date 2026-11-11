export interface SensorHistoryPoint {
  time: string
  occupancy: number
  temperature: number
  wifiDevices: number
  powerKW: number
}

export type BuildingStatus = 'normal' | 'warning' | 'critical'
export type BuildingType = 'academic' | 'hostel' | 'administrative' | 'recreational' | 'library'

export interface Building {
  id: string
  name: string
  code: string
  type: BuildingType
  position: [number, number, number]
  size: [number, number, number] // [width, height, depth]
  colorHex?: string
  occupancy: number // 0 - 100 %
  capacity: number // max people
  currentOccupants: number
  temperature: number // °C
  humidity: number // %
  powerKW: number
  wifiDevices: number
  status: BuildingStatus
  anomalyScore: number // 0.00 (safe) to 1.00 (severe outlier)
  anomalyReason?: string
  floorCount: number
  zones: string[]
  tags: string[]
  history: SensorHistoryPoint[]
}

export interface AnomalyEvent {
  id: string
  buildingId: string
  buildingName: string
  timestamp: string
  severity: 'warning' | 'critical'
  metric: string
  value: string
  expected: string
  score: number
  description: string
}

function generateHistory(baseOccupancy: number, baseTemp: number, baseDevices: number, basePower: number): SensorHistoryPoint[] {
  const points: SensorHistoryPoint[] = []
  const now = new Date()

  for (let i = 12; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60 * 1000)
    const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const jitter = (Math.random() - 0.5) * 8
    const occ = Math.max(5, Math.min(100, Math.round(baseOccupancy + jitter)))
    const temp = Math.round((baseTemp + (Math.random() - 0.5) * 1.5) * 10) / 10
    const dev = Math.max(10, Math.round(baseDevices + (Math.random() - 0.5) * 40))
    const pow = Math.round((basePower + (Math.random() - 0.5) * 15) * 10) / 10

    points.push({
      time: timeStr,
      occupancy: occ,
      temperature: temp,
      wifiDevices: dev,
      powerKW: pow,
    })
  }

  return points
}

export const TIET_BUILDINGS: Building[] = [
  {
    id: 'csed',
    name: 'CSED Block',
    code: 'CS-BLOCK',
    type: 'academic',
    position: [-14, 3, -10],
    size: [9, 6, 7],
    occupancy: 84,
    capacity: 1200,
    currentOccupants: 1008,
    temperature: 24.2,
    humidity: 52,
    powerKW: 185.4,
    wifiDevices: 1140,
    status: 'warning',
    anomalyScore: 0.68,
    anomalyReason: 'Surge in WiFi connections exceeding expected lab capacity',
    floorCount: 5,
    zones: ['TIFAC Core', 'Lab 101 - AI/ML', 'Lab 203 - Cyber Sec', 'Auditorium CSED'],
    tags: ['Computer Science', 'AI', 'Coding', 'TIFAC', 'Labs', 'Software Engineering'],
    history: generateHistory(84, 24.2, 1140, 185),
  },
  {
    id: 'mba',
    name: 'MBA Block (LMTSOM)',
    code: 'LMTSOM',
    type: 'academic',
    position: [13, 2.5, -12],
    size: [8, 5, 6],
    occupancy: 56,
    capacity: 700,
    currentOccupants: 392,
    temperature: 22.8,
    humidity: 48,
    powerKW: 92.0,
    wifiDevices: 410,
    status: 'normal',
    anomalyScore: 0.12,
    floorCount: 4,
    zones: ['Boardroom A', 'Case Study Room 1', 'Executive Lounge', 'Lecture Hall 12'],
    tags: ['Management', 'Finance', 'Marketing', 'Business', 'Executive'],
    history: generateHistory(56, 22.8, 410, 92),
  },
  {
    id: 'lt-complex',
    name: 'LT Complex',
    code: 'LT-1/10',
    type: 'academic',
    position: [-2, 3.5, -4],
    size: [12, 7, 8],
    occupancy: 92,
    capacity: 2500,
    currentOccupants: 2300,
    temperature: 26.5,
    humidity: 61,
    powerKW: 310.2,
    wifiDevices: 2450,
    status: 'critical',
    anomalyScore: 0.91,
    anomalyReason: 'HVAC thermal load spike + high density crowding in central atrium',
    floorCount: 4,
    zones: ['LT 101 Main Hall', 'LT 102 Lecture Theater', 'LT 201 Amphitheater', 'Central Concourse'],
    tags: ['Lectures', 'Auditorium', 'Exams', 'Physics', 'Mathematics', 'Mega Hall'],
    history: generateHistory(92, 26.5, 2450, 310),
  },
  {
    id: 'central-library',
    name: 'Central Library',
    code: 'NAV-LIB',
    type: 'library',
    position: [0, 4, 8],
    size: [10, 8, 10],
    occupancy: 67,
    capacity: 1500,
    currentOccupants: 1005,
    temperature: 21.5,
    humidity: 45,
    powerKW: 140.8,
    wifiDevices: 980,
    status: 'normal',
    anomalyScore: 0.08,
    floorCount: 5,
    zones: ['Silent Reading Floor 2', 'Digital Archives', 'Reference Section', 'Periodicals Hall'],
    tags: ['Study', 'Quiet Zone', 'Books', 'Research Papers', 'Digital Lab'],
    history: generateHistory(67, 21.5, 980, 140),
  },
  {
    id: 'hostel-a',
    name: 'Hostel A',
    code: 'HSTL-A',
    type: 'hostel',
    position: [-16, 4, 7],
    size: [8, 8, 7],
    occupancy: 48,
    capacity: 650,
    currentOccupants: 312,
    temperature: 23.0,
    humidity: 50,
    powerKW: 85.3,
    wifiDevices: 520,
    status: 'normal',
    anomalyScore: 0.15,
    floorCount: 6,
    zones: ['Block 1 Wing', 'Mess Hall', 'Common Room', 'Badminton Court'],
    tags: ['Hostel', 'Boys Dorm', 'Residential', 'Mess'],
    history: generateHistory(48, 23.0, 520, 85),
  },
  {
    id: 'hostel-l',
    name: 'Hostel L',
    code: 'HSTL-L',
    type: 'hostel',
    position: [-16, 4.5, 17],
    size: [8, 9, 7],
    occupancy: 62,
    capacity: 800,
    currentOccupants: 496,
    temperature: 23.4,
    humidity: 53,
    powerKW: 110.0,
    wifiDevices: 710,
    status: 'normal',
    anomalyScore: 0.18,
    floorCount: 7,
    zones: ['North Wing', 'South Wing', 'Study Hall', 'Dining Hall'],
    tags: ['Hostel', 'Residential', 'Student Residence', 'Dining'],
    history: generateHistory(62, 23.4, 710, 110),
  },
  {
    id: 'sports-complex',
    name: 'Sports Complex',
    code: 'SPR-CMP',
    type: 'recreational',
    position: [16, 2, 8],
    size: [11, 4, 11],
    occupancy: 35,
    capacity: 900,
    currentOccupants: 315,
    temperature: 25.1,
    humidity: 58,
    powerKW: 74.5,
    wifiDevices: 290,
    status: 'normal',
    anomalyScore: 0.05,
    floorCount: 2,
    zones: ['Olympic Swimming Pool', 'Gymnasium', 'Squash Courts', 'Indoor Basketball Arena'],
    tags: ['Gym', 'Pool', 'Fitness', 'Sports', 'Basketball', 'Athletics'],
    history: generateHistory(35, 25.1, 290, 74),
  },
  {
    id: 'admin-block',
    name: 'Admin Block',
    code: 'ADM-HQ',
    type: 'administrative',
    position: [0, 3, -16],
    size: [11, 6, 7],
    occupancy: 42,
    capacity: 500,
    currentOccupants: 210,
    temperature: 22.0,
    humidity: 46,
    powerKW: 68.9,
    wifiDevices: 230,
    status: 'normal',
    anomalyScore: 0.09,
    floorCount: 4,
    zones: ['Directorate', 'Dean Academic Affairs', 'Registrar Office', 'Finance Wing'],
    tags: ['Administration', 'Dean', 'Registrar', 'Admissions', 'Finance'],
    history: generateHistory(42, 22.0, 230, 68),
  },
  {
    id: 'ece-block',
    name: 'ECE Block',
    code: 'ECE-DEPT',
    type: 'academic',
    position: [14, 3, -2],
    size: [8, 6, 7],
    occupancy: 78,
    capacity: 950,
    currentOccupants: 741,
    temperature: 24.8,
    humidity: 51,
    powerKW: 138.6,
    wifiDevices: 820,
    status: 'normal',
    anomalyScore: 0.22,
    floorCount: 5,
    zones: ['VLSI Design Lab', 'Embedded Systems', 'IoT Smart Lab', 'Signal Processing Lab'],
    tags: ['Electronics', 'Communication', 'VLSI', 'Robotics', 'Circuits'],
    history: generateHistory(78, 24.8, 820, 138),
  },
  {
    id: 'mech-block',
    name: 'Mech Block',
    code: 'MED-ENG',
    type: 'academic',
    position: [-14, 2.5, -1],
    size: [8, 5, 8],
    occupancy: 81,
    capacity: 850,
    currentOccupants: 688,
    temperature: 27.2,
    humidity: 55,
    powerKW: 245.0,
    wifiDevices: 690,
    status: 'warning',
    anomalyScore: 0.61,
    anomalyReason: 'High machinery workshop power draw and elevated thermal readings',
    floorCount: 3,
    zones: ['CNC Workshop', 'CAD/CAM Studio', 'Thermal Engg Lab', 'Automotive Testing Bay'],
    tags: ['Mechanical', 'Workshop', 'CAD', 'Automobile', 'Robotics', 'Thermal'],
    history: generateHistory(81, 27.2, 690, 245),
  },
]

export const INITIAL_ANOMALIES: AnomalyEvent[] = [
  {
    id: 'anom-01',
    buildingId: 'lt-complex',
    buildingName: 'LT Complex',
    timestamp: '2 mins ago',
    severity: 'critical',
    metric: 'Occupancy / Heat',
    value: '92% / 26.5°C',
    expected: '< 80% / 23.5°C',
    score: 0.91,
    description: 'IsolationForest flag: Critical density clustering in central lecture theater causing thermal overload.',
  },
  {
    id: 'anom-02',
    buildingId: 'csed',
    buildingName: 'CSED Block',
    timestamp: '7 mins ago',
    severity: 'warning',
    metric: 'WiFi Density',
    value: '1,140 devices',
    expected: '< 900 devices',
    score: 0.68,
    description: 'Concurrent device surge detected across 5GHz access points during lab hack session.',
  },
  {
    id: 'anom-03',
    buildingId: 'mech-block',
    buildingName: 'Mech Block',
    timestamp: '14 mins ago',
    severity: 'warning',
    metric: 'Power Draw',
    value: '245.0 kW',
    expected: '< 180.0 kW',
    score: 0.61,
    description: 'Abnormal continuous 3-phase power consumption detected in CNC manufacturing floor.',
  },
]
