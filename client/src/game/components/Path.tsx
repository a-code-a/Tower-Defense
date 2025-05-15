import { useMemo } from "react";
import * as THREE from "three";
import { Vector3 } from "three";
import { useTexture } from "@react-three/drei";

interface PathProps {
  waypoints: Vector3[];
  width?: number;
}

export function Path({ waypoints, width = 2 }: PathProps) {
  // Load path texture
  const texture = useTexture("/textures/asphalt.png");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  
  // Create path segments
  const pathSegments = useMemo(() => {
    const segments = [];
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      
      // Calculate segment direction
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const normalized = direction.normalize();
      
      // Calculate segment center
      const center = new THREE.Vector3().addVectors(
        start,
        new THREE.Vector3().copy(normalized).multiplyScalar(length / 2)
      );
      
      // Calculate rotation based on direction
      const rotation = new THREE.Euler();
      
      // If segment is along Z axis
      if (Math.abs(normalized.z) > Math.abs(normalized.x)) {
        rotation.y = 0;
      } 
      // If segment is along X axis
      else {
        rotation.y = Math.PI / 2;
      }
      
      segments.push({
        center,
        length,
        rotation
      });
    }
    
    return segments;
  }, [waypoints]);
  
  return (
    <group>
      {pathSegments.map((segment, index) => (
        <mesh 
          key={`path-${index}`} 
          position={segment.center} 
          rotation={segment.rotation}
          receiveShadow
        >
          <boxGeometry args={[width, 0.1, segment.length]} />
          <meshStandardMaterial map={texture} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
