import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Stars } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function CyberShield() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial
          color="#00ffff"
          wireframe
          emissive="#00ffff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial
          color="#8b5cf6"
          wireframe
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
    </Float>
  );
}

function GridFloor() {
  return (
    <gridHelper
      args={[50, 50, '#00ffff', '#1a1a2e']}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

function ParticleRing() {
  const ringRef = useRef<THREE.Points>(null);
  const particleCount = 200;
  
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 3.5 + Math.random() * 0.5;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={ringRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00ffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function DataStreams() {
  const streamsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (streamsRef.current) {
      streamsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const streams = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 5;
    const z = Math.sin(angle) * 5;
    return { x, z, height: 4 + Math.random() * 2 };
  });

  return (
    <group ref={streamsRef}>
      {streams.map((stream, i) => (
        <mesh key={i} position={[stream.x, 0, stream.z]}>
          <cylinderGeometry args={[0.02, 0.02, stream.height, 8]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#00ffff' : '#8b5cf6'}
            emissive={i % 2 === 0 ? '#00ffff' : '#8b5cf6'}
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

export function CyberScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
          
          <CyberShield />
          <ParticleRing />
          <DataStreams />
          <GridFloor />
          
          <Stars
            radius={100}
            depth={50}
            count={1000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
