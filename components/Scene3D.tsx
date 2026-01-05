'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';

// 3D Cup Component - Siêu nâng cấp với hiệu ứng cao cấp
function Cup3D({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && groupRef.current && glowRef.current) {
      const time = state.clock.elapsedTime + delay;

      // Rotation mượt mà với nhiều chiều
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.3;
      meshRef.current.rotation.x = Math.cos(time * 0.3) * 0.1;

      // Float animation phức tạp hơn
      groupRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.2 + Math.cos(time * 0.8) * 0.1;
      groupRef.current.rotation.y = time * 0.4;

      // Glow pulse
      glowRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.15);
      const glowMaterial = glowRef.current.material as THREE.MeshStandardMaterial;
      glowMaterial.emissiveIntensity = 0.6 + Math.sin(time * 3) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={2.5} rotationIntensity={0.5} floatIntensity={0.6}>
        {/* Cup body - gradient effect */}
        <mesh ref={meshRef} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.8, 64]} />
          <meshPhysicalMaterial
            color="#22c55e"
            metalness={0.8}
            roughness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.1}
            emissive="#16a34a"
            emissiveIntensity={0.4}
            transmission={0.1}
            thickness={0.5}
          />
        </mesh>

        {/* Inner glow */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.45, 0.75, 32]} />
          <meshStandardMaterial
            color="#86efac"
            transparent
            opacity={0.3}
            emissive="#22c55e"
            emissiveIntensity={1.2}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Cup rim - metallic */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <torusGeometry args={[0.4, 0.03, 16, 64]} />
          <meshPhysicalMaterial
            color="#15803d"
            metalness={0.95}
            roughness={0.05}
            clearcoat={1}
            reflectivity={1}
          />
        </mesh>

        {/* Handle - enhanced */}
        <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
          <torusGeometry args={[0.18, 0.04, 16, 64]} />
          <meshPhysicalMaterial
            color="#15803d"
            metalness={0.9}
            roughness={0.1}
            clearcoat={0.8}
          />
        </mesh>

        {/* Outer glow effect - animated */}
        <mesh ref={glowRef} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.6, 0.9, 32]} />
          <meshStandardMaterial
            color="#22c55e"
            transparent
            opacity={0.15}
            emissive="#10b981"
            emissiveIntensity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Energy rings */}
        {[0.6, 0.7, 0.8].map((radius, i) => (
          <mesh key={i} position={[0, 0.1 * i - 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, 0.01, 8, 32]} />
            <meshStandardMaterial
              color="#10b981"
              transparent
              opacity={0.3 - i * 0.08}
              emissive="#22c55e"
              emissiveIntensity={0.6}
            />
          </mesh>
        ))}
      </Float>
    </group>
  );
}

// 3D Tree Component - Cao cấp với hiệu ứng sống động
function Tree3D({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const leavesRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.15;
      groupRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.08;
    }

    // Animate leaves independently
    leavesRefs.current.forEach((leaf, i) => {
      if (leaf) {
        leaf.rotation.y = Math.sin(time * (1 + i * 0.2)) * 0.1;
        leaf.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.05);
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        {/* Trunk với texture */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.17, 0.9, 16]} />
          <meshPhysicalMaterial
            color="#6b4423"
            roughness={0.9}
            metalness={0.1}
            clearcoat={0.2}
          />
        </mesh>

        {/* Trunk detail rings */}
        {[0.2, 0.5, 0.7].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <torusGeometry args={[0.14 + (0.7 - y) * 0.05, 0.015, 8, 32]} />
            <meshStandardMaterial color="#553311" roughness={0.95} />
          </mesh>
        ))}

        {/* Leaves layer 1 - với glow */}
        <mesh
          ref={(el) => { if (el) leavesRefs.current[0] = el; }}
          position={[0, 1.0, 0]}
          castShadow
        >
          <coneGeometry args={[0.55, 0.75, 12]} />
          <meshPhysicalMaterial
            color="#22c55e"
            roughness={0.5}
            metalness={0.1}
            clearcoat={0.3}
            emissive="#16a34a"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Leaves layer 2 */}
        <mesh
          ref={(el) => { if (el) leavesRefs.current[1] = el; }}
          position={[0, 1.2, 0]}
          castShadow
        >
          <coneGeometry args={[0.45, 0.6, 12]} />
          <meshPhysicalMaterial
            color="#16a34a"
            roughness={0.5}
            metalness={0.1}
            clearcoat={0.3}
            emissive="#15803d"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Leaves layer 3 - top */}
        <mesh
          ref={(el) => { if (el) leavesRefs.current[2] = el; }}
          position={[0, 1.4, 0]}
          castShadow
        >
          <coneGeometry args={[0.35, 0.5, 12]} />
          <meshPhysicalMaterial
            color="#15803d"
            roughness={0.5}
            metalness={0.1}
            clearcoat={0.3}
            emissive="#14532d"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Glow aura around tree */}
        <mesh position={[0, 1.0, 0]}>
          <coneGeometry args={[0.7, 1.0, 12]} />
          <meshStandardMaterial
            color="#22c55e"
            transparent
            opacity={0.1}
            emissive="#10b981"
            emissiveIntensity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Sparkles on tree */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 0.4;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                1.0 + Math.random() * 0.5,
                Math.sin(angle) * radius
              ]}
            >
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial
                color="#86efac"
                emissive="#22c55e"
                emissiveIntensity={1.5}
                transparent
                opacity={0.8}
              />
            </mesh>
          );
        })}
      </Float>
    </group>
  );
}

// Particle System - Nâng cấp với nhiều loại particles
function Particles() {
  const particlesRef = useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 12,
      ] as [number, number, number],
      speed: Math.random() * 0.02 + 0.01,
      size: Math.random() * 0.06 + 0.03,
      color: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#10b981' : '#86efac',
      delay: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const time = state.clock.elapsedTime;
        const particle = particles[i];

        child.position.y += Math.sin(time * particle.speed + particle.delay) * 0.002;
        child.position.x += Math.cos(time * particle.speed * 0.5 + particle.delay) * 0.001;

        // Pulse effect
        const scale = 1 + Math.sin(time * 2 + particle.delay) * 0.3;
        child.scale.setScalar(scale);

        // Fade in/out
        const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        material.opacity = 0.4 + Math.sin(time * 1.5 + particle.delay) * 0.3;
      });
    }
  });

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.size, 12, 12]} />
          <meshStandardMaterial
            color={particle.color}
            transparent
            opacity={0.6}
            emissive={particle.color}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main 3D Scene - Siêu nâng cấp với lighting và effects cao cấp
export default function Scene3D() {
  return (
    <div className="w-full h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 relative shadow-2xl border-2 border-emerald-400/30">
      {/* Animated gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-600/20 pointer-events-none z-10 animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.15),transparent_70%)] pointer-events-none z-10" />

      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        dpr={[1, 2]}
        shadows="soft"
      >
        {/* Advanced lighting setup */}
        <ambientLight intensity={0.4} color="#d1fae5" />

        {/* Main directional light */}
        <directionalLight
          position={[6, 6, 6]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          color="#ffffff"
        />

        {/* Rim light */}
        <directionalLight
          position={[-5, 3, -5]}
          intensity={0.8}
          color="#6ee7b7"
        />

        {/* Accent lights */}
        <pointLight position={[-6, 4, -6]} intensity={1.2} color="#22c55e" distance={15} decay={2} />
        <pointLight position={[6, -3, 6]} intensity={0.9} color="#10b981" distance={12} decay={2} />
        <pointLight position={[0, 5, 0]} intensity={0.7} color="#86efac" distance={10} decay={2} />

        {/* Spotlight for dramatic effect */}
        <spotLight
          position={[0, 8, 0]}
          angle={0.6}
          penumbra={0.5}
          intensity={1.5}
          color="#d1fae5"
          castShadow
        />

        {/* Stars background - enhanced */}
        <Stars
          radius={10}
          depth={80}
          count={200}
          factor={5}
          saturation={0.7}
          fade
          speed={0.3}
        />

        {/* Multiple sparkle layers */}
        <Sparkles
          count={50}
          scale={[10, 10, 10]}
          size={3}
          speed={0.3}
          color="#22c55e"
          opacity={0.8}
        />
        <Sparkles
          count={30}
          scale={[8, 8, 8]}
          size={2}
          speed={0.5}
          color="#86efac"
          opacity={0.5}
        />

        {/* 3D Cups với vị trí và animation tối ưu */}
        <Cup3D position={[-2.2, 0.3, 0]} delay={0} />
        <Cup3D position={[0, 0.5, 0.5]} delay={0.7} />
        <Cup3D position={[2.2, 0.3, 0]} delay={1.4} />

        {/* Tree */}
        <Tree3D position={[0, -1.8, -1.5]} />

        {/* Particles */}
        <Particles />

        {/* Ground plane for reflections */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial
            color="#14532d"
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Environment with custom settings */}
        <Environment
          preset="sunset"
          background={false}
          blur={0.8}
        />

        {/* Fog for depth */}
        <fog attach="fog" args={['#14532d', 5, 20]} />

        {/* Controls với smooth damping */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.2}
          dampingFactor={0.05}
          rotateSpeed={0.5}
        />
      </Canvas>

      {/* Enhanced overlay text */}
      <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none z-20">
        <div className="inline-block bg-gradient-to-r from-white/90 via-emerald-50/90 to-white/90 backdrop-blur-md px-6 py-2.5 rounded-full text-xs font-bold text-emerald-800 shadow-2xl border border-emerald-300/50 animate-pulse">
          <span className="inline-block mr-2 text-base">🌱</span>
          Mỗi ly = 450 năm ô nhiễm được ngăn chặn
          <span className="inline-block ml-2 text-base">✨</span>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-3 left-3 w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-xl pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-16 h-16 bg-gradient-to-tl from-teal-400/20 to-transparent rounded-full blur-xl pointer-events-none" />
    </div>
  );
}