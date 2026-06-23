'use client'
// components/growth-tree/GrowthTree.tsx
// 3D growth tree using React Three Fiber - centerpiece of client dashboard

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'
import type { TreeConfig } from '@/types'

interface GrowthTreeProps {
  config: TreeConfig
  interactive?: boolean
}

// ─── LEAF CLUSTER ─────────────────────────────────────────────────────────────

function LeafCluster({
  position,
  scale = 1,
  color,
}: {
  position: [number, number, number]
  scale?: number
  color: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.05
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3 + position[2]) * 0.03
    }
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[0.35, 8, 6]} />
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

// ─── BRANCH ───────────────────────────────────────────────────────────────────

function Branch({
  start,
  end,
  radius = 0.04,
  color = '#5C3A1E',
}: {
  start: [number, number, number]
  end: [number, number, number]
  radius?: number
  color?: string
}) {
  const geometry = useMemo(() => {
    const dir = new THREE.Vector3(...end).sub(new THREE.Vector3(...start))
    const length = dir.length()
    const geo = new THREE.CylinderGeometry(radius * 0.6, radius, length, 6)
    geo.translate(0, length / 2, 0)
    return geo
  }, [start, end, radius])

  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3(...end).sub(new THREE.Vector3(...start)).normalize()
    const up = new THREE.Vector3(0, 1, 0)
    return new THREE.Quaternion().setFromUnitVectors(up, dir)
  }, [start, end])

  return (
    <mesh position={start} quaternion={quaternion} geometry={geometry}>
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

// ─── TREE STAGES ──────────────────────────────────────────────────────────────

function SeedTree() {
  return (
    <group>
      {/* Small sprout */}
      <Branch start={[0, -0.5, 0]} end={[0, 0.3, 0]} radius={0.025} />
      <LeafCluster position={[0, 0.45, 0]} scale={0.4} color="#7CB87D" />
      {/* Soil mound */}
      <mesh position={[0, -0.55, 0]} scale={[0.8, 0.1, 0.8]}>
        <sphereGeometry args={[0.5, 8, 4]} />
        <meshLambertMaterial color="#5D4037" />
      </mesh>
    </group>
  )
}

function SaplingTree() {
  return (
    <group>
      {/* Trunk */}
      <Branch start={[0, -0.5, 0]} end={[0, 0.8, 0]} radius={0.045} />
      {/* Small branches */}
      <Branch start={[0, 0.3, 0]} end={[0.3, 0.6, 0.1]} radius={0.025} />
      <Branch start={[0, 0.3, 0]} end={[-0.3, 0.6, -0.1]} radius={0.025} />
      {/* Leaves */}
      <LeafCluster position={[0, 1.0, 0]} scale={0.65} color="#6DB56D" />
      <LeafCluster position={[0.35, 0.75, 0.1]} scale={0.45} color="#7DC87D" />
      <LeafCluster position={[-0.35, 0.75, -0.1]} scale={0.45} color="#6BB56B" />
    </group>
  )
}

function YoungTree() {
  return (
    <group>
      {/* Trunk */}
      <Branch start={[0, -0.5, 0]} end={[0, 1.2, 0]} radius={0.065} />
      <Branch start={[0, 0.4, 0]} end={[0.55, 0.9, 0.2]} radius={0.035} />
      <Branch start={[0, 0.4, 0]} end={[-0.55, 0.9, -0.2]} radius={0.035} />
      <Branch start={[0, 0.8, 0]} end={[0.4, 1.3, 0.1]} radius={0.025} />
      <Branch start={[0, 0.8, 0]} end={[-0.4, 1.3, -0.1]} radius={0.025} />
      {/* Canopy */}
      <LeafCluster position={[0, 1.55, 0]} scale={0.85} color="#4CAF50" />
      <LeafCluster position={[0.6, 1.1, 0.2]} scale={0.6} color="#66BB6A" />
      <LeafCluster position={[-0.6, 1.1, -0.2]} scale={0.6} color="#4CAF50" />
      <LeafCluster position={[0.45, 1.45, 0.1]} scale={0.5} color="#81C784" />
      <LeafCluster position={[-0.45, 1.45, -0.1]} scale={0.5} color="#66BB6A" />
    </group>
  )
}

function MatureTree() {
  const leafColor1 = '#388E3C'
  const leafColor2 = '#43A047'
  const leafColor3 = '#2E7D32'

  return (
    <group>
      {/* Main trunk */}
      <Branch start={[0, -0.5, 0]} end={[0, 1.6, 0]} radius={0.09} />
      {/* Primary branches */}
      <Branch start={[0, 0.6, 0]} end={[0.8, 1.2, 0.3]} radius={0.055} />
      <Branch start={[0, 0.6, 0]} end={[-0.8, 1.2, -0.3]} radius={0.055} />
      <Branch start={[0, 0.6, 0]} end={[0.3, 1.3, -0.7]} radius={0.045} />
      <Branch start={[0, 1.0, 0]} end={[0.6, 1.7, 0.2]} radius={0.035} />
      <Branch start={[0, 1.0, 0]} end={[-0.6, 1.7, -0.2]} radius={0.035} />
      {/* Secondary */}
      <Branch start={[0.8, 1.2, 0.3]} end={[1.1, 1.7, 0.4]} radius={0.025} />
      <Branch start={[-0.8, 1.2, -0.3]} end={[-1.1, 1.7, -0.4]} radius={0.025} />
      {/* Dense canopy */}
      <LeafCluster position={[0, 2.1, 0]} scale={1.1} color={leafColor1} />
      <LeafCluster position={[0.85, 1.75, 0.3]} scale={0.8} color={leafColor2} />
      <LeafCluster position={[-0.85, 1.75, -0.3]} scale={0.8} color={leafColor3} />
      <LeafCluster position={[0.35, 1.9, -0.7]} scale={0.75} color={leafColor1} />
      <LeafCluster position={[1.15, 1.9, 0.4]} scale={0.65} color={leafColor2} />
      <LeafCluster position={[-1.15, 1.9, -0.4]} scale={0.65} color={leafColor3} />
      <LeafCluster position={[0.65, 2.0, 0.2]} scale={0.7} color={leafColor1} />
      <LeafCluster position={[-0.65, 2.0, -0.2]} scale={0.7} color={leafColor2} />
    </group>
  )
}

function FullTree() {
  const leafColor1 = '#1B5E20'
  const leafColor2 = '#2E7D32'
  const leafColor3 = '#388E3C'
  const leafColor4 = '#43A047'

  return (
    <group>
      {/* Thick trunk */}
      <Branch start={[0, -0.5, 0]} end={[0, 1.8, 0]} radius={0.12} />
      {/* Root flares */}
      <Branch start={[0, -0.5, 0]} end={[0.35, -0.4, 0.2]} radius={0.06} />
      <Branch start={[0, -0.5, 0]} end={[-0.35, -0.4, -0.2]} radius={0.06} />
      {/* Primary branches — all around */}
      <Branch start={[0, 0.6, 0]} end={[1.0, 1.3, 0.4]} radius={0.065} />
      <Branch start={[0, 0.6, 0]} end={[-1.0, 1.3, -0.4]} radius={0.065} />
      <Branch start={[0, 0.6, 0]} end={[0.4, 1.4, -0.9]} radius={0.055} />
      <Branch start={[0, 0.6, 0]} end={[-0.4, 1.4, 0.9]} radius={0.055} />
      <Branch start={[0, 1.1, 0]} end={[0.8, 1.9, 0.3]} radius={0.045} />
      <Branch start={[0, 1.1, 0]} end={[-0.8, 1.9, -0.3]} radius={0.045} />
      <Branch start={[0, 1.1, 0]} end={[0, 2.0, 0]} radius={0.04} />
      {/* Secondary branches */}
      <Branch start={[1.0, 1.3, 0.4]} end={[1.4, 1.9, 0.5]} radius={0.03} />
      <Branch start={[1.0, 1.3, 0.4]} end={[1.2, 2.0, 0.2]} radius={0.025} />
      <Branch start={[-1.0, 1.3, -0.4]} end={[-1.4, 1.9, -0.5]} radius={0.03} />
      {/* Full lush canopy */}
      <LeafCluster position={[0, 2.4, 0]} scale={1.3} color={leafColor1} />
      <LeafCluster position={[1.0, 2.0, 0.4]} scale={0.95} color={leafColor2} />
      <LeafCluster position={[-1.0, 2.0, -0.4]} scale={0.95} color={leafColor3} />
      <LeafCluster position={[0.5, 1.8, -0.9]} scale={0.85} color={leafColor4} />
      <LeafCluster position={[-0.5, 1.8, 0.9]} scale={0.85} color={leafColor1} />
      <LeafCluster position={[1.45, 2.0, 0.5]} scale={0.75} color={leafColor2} />
      <LeafCluster position={[-1.45, 2.0, -0.5]} scale={0.75} color={leafColor3} />
      <LeafCluster position={[1.25, 2.1, 0.2]} scale={0.7} color={leafColor4} />
      <LeafCluster position={[-1.25, 2.1, -0.2]} scale={0.7} color={leafColor1} />
      <LeafCluster position={[0.8, 2.1, 0.3]} scale={0.8} color={leafColor2} />
      <LeafCluster position={[-0.8, 2.1, -0.3]} scale={0.8} color={leafColor3} />
      <LeafCluster position={[0, 2.2, 0.5]} scale={0.75} color={leafColor4} />
      <LeafCluster position={[0, 2.2, -0.5]} scale={0.75} color={leafColor1} />
      {/* Accent flowers/fruits (red dots) */}
      {[
        [0.6, 2.3, 0.3], [-0.7, 2.1, -0.2], [1.0, 1.95, 0.4],
        [-0.3, 2.5, 0.1], [0.2, 2.3, -0.4]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.05, 6, 4]} />
          <meshLambertMaterial color="#FF3131" />
        </mesh>
      ))}
    </group>
  )
}

// ─── GROUND ───────────────────────────────────────────────────────────────────

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]}>
      <circleGeometry args={[1.8, 32]} />
      <meshLambertMaterial color="#4E342E" />
    </mesh>
  )
}

// ─── SCENE ────────────────────────────────────────────────────────────────────

function TreeScene({ config }: { config: TreeConfig }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle breathing sway
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.015
    }
  })

  const TreeComponent = {
    seed: SeedTree,
    sapling: SaplingTree,
    young: YoungTree,
    mature: MatureTree,
    full: FullTree,
  }[config.stage]

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow />
      <directionalLight position={[-2, 3, -2]} intensity={0.4} color="#b0c4ff" />

      <Float speed={1.5} rotationIntensity={0.02} floatIntensity={0.03}>
        <group ref={groupRef}>
          <TreeComponent />
          <Ground />
        </group>
      </Float>
    </>
  )
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export default function GrowthTree({ config, interactive = false }: GrowthTreeProps) {
  return (
    <div style={{ width: '100%', height: '320px', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0.5, 3.5], fov: 45 }}
        style={{ borderRadius: 'var(--radius-xl)' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <TreeScene config={config} />
          {interactive && (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2}
              autoRotate
              autoRotateSpeed={0.5}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Stage label */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <p style={{
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--text)',
          letterSpacing: '-0.01em',
        }}>
          {config.label}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          {config.description}
        </p>
      </div>
    </div>
  )
}
