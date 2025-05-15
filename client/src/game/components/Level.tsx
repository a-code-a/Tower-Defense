import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { LevelConfig } from "../levels/level1";

interface LevelProps {
  levelConfig: LevelConfig;
}

export function Level({ levelConfig }: LevelProps) {
  const groundRef = useRef<THREE.Mesh>(null);
  
  // Load texture
  const texture = useTexture(levelConfig.terrain.texture);
  
  // Configure texture
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  
  // Create ground geometry
  const { width, height } = levelConfig.terrain;
  
  // Create debug material for buildable areas
  const buildableAreasMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      wireframe: true,
      transparent: true,
      opacity: 0.2
    }),
  []);
  
  return (
    <group>
      {/* Ground */}
      <mesh 
        ref={groundRef} 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} attach="material" />
      </mesh>
      
      {/* Buildable area visualization (for debug) */}
      {levelConfig.buildableAreas.map((area, index) => (
        <mesh 
          key={`buildable-${index}`} 
          position={[area.center.x, area.center.y + 0.1, area.center.z]} 
          rotation={[-Math.PI / 2, 0, 0]}
          material={buildableAreasMaterial}
        >
          <planeGeometry args={[area.width, area.height]} />
        </mesh>
      ))}
    </group>
  );
}
