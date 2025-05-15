import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";
import { useTexture } from "@react-three/drei";

interface EnhancedProjectileProps {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  towerId: string;
  targetId: string;
}

export function EnhancedProjectile(props: EnhancedProjectileProps) {
  const { id, position, direction, speed, damage, towerId, targetId } = props;
  
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);
  
  const removeProjectile = useTowerDefense((state) => state.removeProjectile);
  const damageEnemy = useTowerDefense((state) => state.damageEnemy);
  const enemies = useTowerDefense((state) => state.enemies);
  const towers = useTowerDefense((state) => state.towers);
  
  // Find the tower that fired this projectile
  const tower = useMemo(() => 
    towers.find(t => t.id === towerId),
  [towers, towerId]);
  
  // Load texture
  const texture = useTexture("/textures/particles/circle.png");
  
  // Create materials based on tower type
  const projectileMaterial = useMemo(() => {
    const color = tower ? new THREE.Color(tower.type === "cannon" ? 0xff4400 : tower.type === "laser" ? 0x00ffff : 0x88ff00) : new THREE.Color(0xffffff);
    
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.9
    });
  }, [tower]);
  
  const trailMaterial = useMemo(() => {
    const color = tower ? new THREE.Color(tower.type === "cannon" ? 0xff4400 : tower.type === "laser" ? 0x00ffff : 0x88ff00) : new THREE.Color(0xffffff);
    
    return new THREE.PointsMaterial({
      color,
      size: tower?.type === "cannon" ? 0.5 : 0.3,
      map: texture,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [tower, texture]);
  
  // Trail positions
  const trailPositions = useMemo(() => {
    const count = 20;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
    }
    
    return positions;
  }, [position]);
  
  // Trail sizes and opacities
  const trailSizes = useMemo(() => new Float32Array(20), []);
  const trailOpacities = useMemo(() => new Float32Array(20), []);
  
  // Trail geometry
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(trailOpacities, 1));
    return geometry;
  }, [trailPositions, trailSizes, trailOpacities]);
  
  // Update projectile position and check for collisions
  useFrame((_, delta) => {
    if (!meshRef.current || !trailRef.current) return;
    
    // Move projectile
    const moveAmount = speed * delta;
    position.add(direction.clone().multiplyScalar(moveAmount));
    
    // Update mesh position
    meshRef.current.position.copy(position);
    
    // Update trail
    const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
    const sizes = trailRef.current.geometry.attributes.size.array as Float32Array;
    const opacities = trailRef.current.geometry.attributes.opacity.array as Float32Array;
    
    // Shift all positions back
    for (let i = 19; i > 0; i--) {
      const i3 = i * 3;
      const prev3 = (i - 1) * 3;
      
      positions[i3] = positions[prev3];
      positions[i3 + 1] = positions[prev3 + 1];
      positions[i3 + 2] = positions[prev3 + 2];
      
      sizes[i] = sizes[i - 1];
      opacities[i] = opacities[i - 1] * 0.95; // Fade out
    }
    
    // Set new head position
    positions[0] = position.x;
    positions[1] = position.y;
    positions[2] = position.z;
    sizes[0] = tower?.type === "cannon" ? 0.5 : 0.3;
    opacities[0] = 1.0;
    
    trailRef.current.geometry.attributes.position.needsUpdate = true;
    trailRef.current.geometry.attributes.size.needsUpdate = true;
    trailRef.current.geometry.attributes.opacity.needsUpdate = true;
    
    // Check for collision with target enemy
    const target = enemies.find(e => e.id === targetId);
    if (target) {
      const distance = position.distanceTo(target.position);
      const hitThreshold = target.size * 0.8; // Adjust based on enemy size
      
      if (distance < hitThreshold) {
        // Hit enemy
        damageEnemy(targetId, damage);
        removeProjectile(id);
        return;
      }
    } else {
      // Target no longer exists, remove projectile
      removeProjectile(id);
      return;
    }
    
    // Remove if projectile goes too far
    if (position.length() > 50) {
      removeProjectile(id);
    }
    
    // Rotate projectile for visual effect
    if (tower?.type === "cannon") {
      meshRef.current.rotation.x += delta * 5;
      meshRef.current.rotation.y += delta * 3;
    }
  });
  
  // Different projectile shapes based on tower type
  const getProjectileGeometry = () => {
    if (!tower) return <sphereGeometry args={[0.2, 8, 8]} />;
    
    switch (tower.type) {
      case "cannon":
        return <sphereGeometry args={[0.3, 8, 8]} />;
      case "laser":
        return <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} rotation={[Math.PI / 2, 0, 0]} />;
      case "sniper":
        return <coneGeometry args={[0.1, 0.4, 8]} rotation={[Math.PI / 2, 0, 0]} />;
      default:
        return <sphereGeometry args={[0.2, 8, 8]} />;
    }
  };
  
  return (
    <>
      {/* Projectile */}
      <mesh 
        ref={meshRef} 
        position={[position.x, position.y, position.z]}
        material={projectileMaterial}
      >
        {getProjectileGeometry()}
      </mesh>
      
      {/* Trail */}
      <points ref={trailRef} geometry={trailGeometry} material={trailMaterial} />
    </>
  );
}