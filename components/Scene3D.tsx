'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sparkles, Stars, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

// 3D Cup Component - Nâng cấp với animation mượt mà
function Cup3D({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current && groupRef.current) {
      const time = state.clock.elapsedTime + delay;
      
      // Rotation mượt mà
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.2;
      
      // Float animation
      groupRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.15;
      groupRef.current.rotation.y = time * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.4}>
        {/* Cup body */}
        <mesh ref={meshRef} castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.45, 0.7, 32]} />
          <meshStandardMaterial
            color="#22c55e"
            metalness={0.6}
            roughness={0.2}
            emissive="#16a34a"
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Cup rim */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <torusGeometry args={[0.35, 0.02, 16, 32]} />
          <meshStandardMaterial
            color="#16a34a"
            metalness={0.8}
            roughness={0.1}
          />
        </mesh>
        
        {/* Handle */}
        <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
          <torusGeometry args={[0.15, 0.03, 16, 32]} />
          <meshStandardMaterial
            color="#16a34a"
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
        
        {/* Glow effect */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 0.75, 32]} />
          <meshStandardMaterial
            color="#22c55e"
            transparent
            opacity={0.1}
            emissive="#22c55e"
            emissiveIntensity={0.5}
          />
        </mesh>
      </Float>
    </group>
  );
}

// 3D Tree Component - Nâng cấp
function Tree3D({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        {/* Trunk */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 0.8, 8]} />
          <meshStandardMaterial color="#8b4513" roughness={0.8} />
        </mesh>
        
        {/* Leaves layer 1 */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <coneGeometry args={[0.5, 0.7, 8]} />
          <meshStandardMaterial color="#22c55e" roughness={0.6} />
        </mesh>
        
        {/* Leaves layer 2 */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <coneGeometry args={[0.4, 0.5, 8]} />
          <meshStandardMaterial color="#16a34a" roughness={0.6} />
        </mesh>
        
        {/* Leaves layer 3 */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <coneGeometry args={[0.3, 0.4, 8]} />
          <meshStandardMaterial color="#15803d" roughness={0.6} />
        </mesh>
      </Float>
    </group>
  );
}

// Particle System
function Particles() {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, () => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      ] as [number, number, number],
      speed: Math.random() * 0.02 + 0.01,
    }));
  }, []);

  return (
    <>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color="#22c55e"
            transparent
            opacity={0.6}
            emissive="#16a34a"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </>
  );
}

// Main 3D Scene - Nâng cấp hoàn toàn
export default function Scene3D() {
  return (
    <div className="w-full h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 relative shadow-xl border border-primary-200/50">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-600/10 pointer-events-none z-10" />
      
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        shadows
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 3, -5]} intensity={0.8} color="#22c55e" />
        <pointLight position={[5, -3, 5]} intensity={0.6} color="#16a34a" />
        
        {/* Stars background */}
        <Stars
          radius={8}
          depth={50}
          count={100}
          factor={4}
          saturation={0.5}
          fade
          speed={0.5}
        />
        
        {/* Sparkles effect */}
        <Sparkles
          count={30}
          scale={[8, 8, 8]}
          size={2}
          speed={0.4}
          color="#22c55e"
          opacity={0.6}
        />
        
        {/* 3D Cups với animation delay khác nhau */}
        <Cup3D position={[-2, 0.5, 0]} delay={0} />
        <Cup3D position={[0, 0, 0]} delay={0.5} />
        <Cup3D position={[2, 0.5, 0]} delay={1} />
        
        {/* Tree */}
        <Tree3D position={[0, -1.5, -1]} />
        
        {/* Particles */}
        <Particles />
        
        {/* Environment */}
        <Environment preset="sunset" />
        
        {/* Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
      
      {/* Overlay text (optional) */}
      <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none z-20">
        <div className="inline-block bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold text-primary-700 shadow-lg">
          🌱 Mỗi ly = 450 năm ô nhiễm được ngăn chặn
        </div>
      </div>
    </div>
  );
}
