import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Vector3 } from "three";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";
import { useTexture } from "@react-three/drei";

interface BaseProps {
  position: Vector3;
}

export function Base({ position }: BaseProps) {
  const baseRef = useRef<THREE.Group>(null);
  
  const lives = useTowerDefense((state) => state.lives);
  
  // Load textures
  const woodTexture = useTexture("/textures/wood.jpg");
  
  // Create materials
  const baseMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ map: woodTexture }),
  [woodTexture]);
  
  const roofMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ color: 0x8B4513 }),
  []);
  
  const flagMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ color: 0x3498db }),
  []);
  
  // Calculate health percentage for visualization
  const healthPercent = lives / 20; // Assuming max lives is 20
  
  return (
    <group 
      ref={baseRef} 
      position={[position.x, position.y, position.z]}
    >
      {/* Base structure */}
      <mesh receiveShadow castShadow material={baseMaterial}>
        <boxGeometry args={[4, 2, 4]} />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 2, 0]} receiveShadow castShadow material={roofMaterial}>
        <coneGeometry args={[3, 2, 4]} />
      </mesh>
      
      {/* Flag */}
      <group position={[0, 3.5, 0]}>
        <mesh receiveShadow castShadow material={baseMaterial}>
          <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
        </mesh>
        
        <mesh position={[0.5, 0, 0]} receiveShadow castShadow material={flagMaterial}>
          <boxGeometry args={[1, 0.5, 0.05]} />
        </mesh>
      </group>
      
      {/* Health indicator */}
      <group position={[0, -0.5, 0]}>
        {/* Health bar background */}
        <mesh position={[0, 0, 2.5]} rotation={[0, 0, 0]}>
          <boxGeometry args={[3, 0.4, 0.1]} />
          <meshBasicMaterial color={0x333333} attach="material" />
        </mesh>
        
        {/* Health bar foreground */}
        <mesh 
          position={[-1.5 + (healthPercent * 1.5), 0, 2.55]} 
          rotation={[0, 0, 0]}
        >
          <boxGeometry args={[3 * healthPercent, 0.4, 0.15]} />
          <meshBasicMaterial color={healthPercent > 0.3 ? 0x00ff00 : 0xff0000} attach="material" />
        </mesh>
      </group>
    </group>
  );
}
