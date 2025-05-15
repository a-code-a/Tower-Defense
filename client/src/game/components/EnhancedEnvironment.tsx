import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sky, Cloud, Stars, useTexture } from "@react-three/drei";
import { LevelConfig } from "../levels/level1";

interface EnhancedEnvironmentProps {
  levelConfig: LevelConfig;
}

export function EnhancedEnvironment({ levelConfig }: EnhancedEnvironmentProps) {
  const cloudsRef = useRef<THREE.Group>(null);
  
  // Load textures
  const groundTexture = useTexture("/textures/grass.png");
  
  // Configure textures
  useMemo(() => {
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10);
    groundTexture.anisotropy = 16;
  }, [groundTexture]);
  
  // Create materials
  const groundMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.8,
      metalness: 0.1
    }),
  [groundTexture]);
  
  // Animate clouds
  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02;
    }
  });
  
  return (
    <>
      {/* Sky */}
      <Sky 
        distance={450000} 
        sunPosition={[0, 1, 0]} 
        inclination={0.6}
        azimuth={0.25}
        turbidity={10}
        rayleigh={3}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      
      {/* Stars (visible at night) */}
      <Stars 
        radius={100} 
        depth={50} 
        count={1000} 
        factor={4} 
        saturation={0} 
        fade
        speed={0.5}
      />
      
      {/* Ground */}
      <mesh 
        receiveShadow 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        material={groundMaterial}
      >
        <planeGeometry args={[levelConfig.terrain.width, levelConfig.terrain.height]} />
      </mesh>
      
      {/* Clouds */}
      <group ref={cloudsRef} position={[0, 20, 0]}>
        <Cloud 
          position={[-10, 5, -10]} 
          opacity={0.5} 
          speed={0.4} 
          width={10} 
          depth={1.5} 
          segments={20}
        />
        <Cloud 
          position={[10, 3, 10]} 
          opacity={0.3} 
          speed={0.25} 
          width={8} 
          depth={2} 
          segments={15}
        />
        <Cloud 
          position={[0, 4, -20]} 
          opacity={0.4} 
          speed={0.3} 
          width={12} 
          depth={1.75} 
          segments={18}
        />
      </group>
      
      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      
      {/* Main directional light (sun) */}
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Secondary light for fill */}
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.3}
        color="#b3e0ff"
      />
      
      {/* Ground fog */}
      <fog attach="fog" args={['#d7e3fc', 30, 60]} />
    </>
  );
}