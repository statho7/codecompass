"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html, Line } from "@react-three/drei"
import * as THREE from "three"

export interface FileNode {
  path: string
  type: "component" | "util" | "api" | "page" | "config" | "style" | "other"
  imports: string[]
  importedBy: string[]
}

export interface GraphData {
  nodes: FileNode[]
  edges: Array<{ source: string; target: string }>
  warnings?: string[]
}

interface DependencyGraphProps {
  data: GraphData
  onNodeSelect: (node: FileNode | null) => void
  selectedNode: FileNode | null
  repoUrl: string
}

// Color palette for different file types
const TYPE_COLORS: Record<FileNode["type"], string> = {
  component: "#3b82f6", // blue
  util: "#10b981", // emerald
  api: "#f59e0b", // amber
  page: "#8b5cf6", // violet
  config: "#6b7280", // gray
  style: "#ec4899", // pink
  other: "#6b7280", // gray
}

interface NodePosition {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

function useForceSimulation(nodes: FileNode[], edges: GraphData["edges"]) {
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map())

  useEffect(() => {
    const initialPositions = new Map<string, NodePosition>()
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2
      const radius = 8 + Math.random() * 4 // Increased from 3+2 to 8+4
      initialPositions.set(node.path, {
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 8, // Increased vertical spread
        z: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        vz: 0,
      })
    })
    setPositions(initialPositions)

    // Run force simulation
    let animationId: number
    let iteration = 0
    const maxIterations = 200

    const simulate = () => {
      if (iteration >= maxIterations) return

      setPositions((prev) => {
        const next = new Map(prev)
        const alpha = 1 - iteration / maxIterations

        nodes.forEach((nodeA) => {
          const posA = next.get(nodeA.path)
          if (!posA) return

          nodes.forEach((nodeB) => {
            if (nodeA.path === nodeB.path) return
            const posB = next.get(nodeB.path)
            if (!posB) return

            const dx = posA.x - posB.x
            const dy = posA.y - posB.y
            const dz = posA.z - posB.z
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1
            // Increased repulsion force significantly
            const force = (alpha * 8) / (dist * dist)

            posA.vx += (dx / dist) * force
            posA.vy += (dy / dist) * force
            posA.vz += (dz / dist) * force
          })
        })

        edges.forEach((edge) => {
          const posSource = next.get(edge.source)
          const posTarget = next.get(edge.target)
          if (!posSource || !posTarget) return

          const dx = posTarget.x - posSource.x
          const dy = posTarget.y - posSource.y
          const dz = posTarget.z - posSource.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1
          // Reduced attraction, only pull together if very far apart
          const idealDist = 6
          const force = alpha * 0.05 * (dist - idealDist)

          posSource.vx += (dx / dist) * force
          posSource.vy += (dy / dist) * force
          posSource.vz += (dz / dist) * force
          posTarget.vx -= (dx / dist) * force
          posTarget.vy -= (dy / dist) * force
          posTarget.vz -= (dz / dist) * force
        })

        // Apply velocities with damping
        next.forEach((pos) => {
          pos.x += pos.vx * 0.3
          pos.y += pos.vy * 0.3
          pos.z += pos.vz * 0.3
          pos.vx *= 0.9
          pos.vy *= 0.9
          pos.vz *= 0.9
        })

        return next
      })

      iteration++
      animationId = requestAnimationFrame(simulate)
    }

    simulate()
    return () => cancelAnimationFrame(animationId)
  }, [nodes, edges])

  return positions
}

function GraphNode({
  node,
  position,
  isSelected,
  isHighlighted,
  onClick,
  hasOpenPanel,
}: {
  node: FileNode
  position: [number, number, number]
  isSelected: boolean
  isHighlighted: boolean
  onClick: () => void
  hasOpenPanel: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [isInOverlapZone, setIsInOverlapZone] = useState(false)
  const { camera, size: viewportSize } = useThree()
  const color = TYPE_COLORS[node.type]

  const connectionCount = node.imports.length + node.importedBy.length
  const size = 0.4 + Math.min(connectionCount * 0.05, 0.3)

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered || isSelected ? 1.8 : isHighlighted ? 1.4 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)

      // Calculate screen position to check if label would overlap with side panel
      if (hasOpenPanel) {
        const worldPosition = new THREE.Vector3(position[0], position[1], position[2])
        const screenPosition = worldPosition.project(camera)

        // Convert to pixel coordinates
        const x = (screenPosition.x * 0.5 + 0.5) * viewportSize.width

        // Panel is 420px wide + 16px right margin = 436px from right edge
        // Add extra 100px buffer for the label width
        const overlapThreshold = viewportSize.width - 536

        setIsInOverlapZone(x > overlapThreshold)
      } else {
        setIsInOverlapZone(false)
      }
    }
  })

  const fileName = node.path.split("/").pop() || node.path

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = "auto"
        }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : isHighlighted ? 0.6 : hovered ? 0.5 : 0.3}
          transparent
          opacity={isHighlighted || isSelected || hovered ? 1 : 0.9}
        />
      </mesh>
      {!isInOverlapZone && (
        <Html center style={{ pointerEvents: "none" }}>
          <div
            className={`px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg border transition-all ${
              hovered || isSelected
                ? "bg-primary text-primary-foreground border-primary font-bold scale-110"
                : "bg-card/95 text-card-foreground border-border font-medium"
            }`}
            style={{
              fontSize: hovered || isSelected ? "16px" : "14px",
              minWidth: "max-content",
              transform: "translateY(-35px)",
              backdropFilter: "blur(4px)",
            }}
          >
            {fileName}
          </div>
        </Html>
      )}
    </group>
  )
}

function GraphEdge({
  start,
  end,
  isHighlighted,
}: {
  start: [number, number, number]
  end: [number, number, number]
  isHighlighted: boolean
}) {
  return (
    <Line
      points={[start, end]}
      color={isHighlighted ? "#60a5fa" : "#94a3b8"}
      lineWidth={isHighlighted ? 4 : 2}
      transparent
      opacity={isHighlighted ? 1 : 0.6}
    />
  )
}

function Scene({ data, onNodeSelect, selectedNode, isHovered }: DependencyGraphProps & { isHovered: boolean }) {
  const positions = useForceSimulation(data.nodes, data.edges)
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()

  // Set initial camera position
  useEffect(() => {
    camera.position.set(10, 6, 10)
  }, [camera])

  // Determine highlighted nodes (connected to selected)
  const highlightedPaths = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const paths = new Set<string>()
    selectedNode.imports.forEach((p) => paths.add(p))
    selectedNode.importedBy.forEach((p) => paths.add(p))
    return paths
  }, [selectedNode])

  // Determine highlighted edges
  const highlightedEdges = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const edges = new Set<string>()
    data.edges.forEach((edge) => {
      if (edge.source === selectedNode.path || edge.target === selectedNode.path) {
        edges.add(`${edge.source}->${edge.target}`)
      }
    })
    return edges
  }, [selectedNode, data.edges])

  const hasOpenPanel = selectedNode !== null

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} />

      {/* Render edges */}
      {data.edges.map((edge) => {
        const startPos = positions.get(edge.source)
        const endPos = positions.get(edge.target)
        if (!startPos || !endPos) return null

        const edgeKey = `${edge.source}->${edge.target}`
        return (
          <GraphEdge
            key={edgeKey}
            start={[startPos.x, startPos.y, startPos.z]}
            end={[endPos.x, endPos.y, endPos.z]}
            isHighlighted={highlightedEdges.has(edgeKey)}
          />
        )
      })}

      {/* Render nodes */}
      {data.nodes.map((node) => {
        const pos = positions.get(node.path)
        if (!pos) return null

        return (
          <GraphNode
            key={node.path}
            node={node}
            position={[pos.x, pos.y, pos.z]}
            isSelected={selectedNode?.path === node.path}
            isHighlighted={highlightedPaths.has(node.path)}
            onClick={() => onNodeSelect(selectedNode?.path === node.path ? null : node)}
            hasOpenPanel={hasOpenPanel}
          />
        )
      })}

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={25}
        autoRotate={!isHovered && !selectedNode}
        autoRotateSpeed={0.3}
      />
    </>
  )
}

export function DependencyGraph({ data, onNodeSelect, selectedNode, repoUrl }: DependencyGraphProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (data.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        No dependencies found in this repository
      </div>
    )
  }

  return (
    <div className="w-full h-full" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Canvas camera={{ position: [10, 6, 10], fov: 50 }} style={{ background: "transparent" }}>
        <Scene
          data={data}
          onNodeSelect={onNodeSelect}
          selectedNode={selectedNode}
          repoUrl={repoUrl}
          isHovered={isHovered}
        />
      </Canvas>
    </div>
  )
}
