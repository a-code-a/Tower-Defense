import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Vector3 } from "three";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";

interface ProjectileProps {
  id: string;
  position: Vector3;
  direction: Vector3;
  speed: number;
  damage: number;
  towerId: string;
  targetId: string | null;
}

export function Projectile({
  id,
  position,
  direction,
  speed,
  damage,
  towerId,
  targetId
}: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Get relevant state and actions
  const enemies = useTowerDefense((state) => state.enemies);
  const damageEnemy = useTowerDefense((state) => state.damageEnemy);
  const removeProjectile = useTowerDefense((state) => state.removeProjectile);
  
  // Create projectile material based on tower type
  const projectileMaterial = useMemo(() => {
    // Get tower data from state
    const towers = useTowerDefense.getState().towers;
    const tower = towers.find(t => t.id === towerId);
    
    // Return appropriate material
    if (tower?.type === "laser") {
      return new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
    } else if (tower?.type === "sniper") {
      return new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
    } else {
      return new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.2 });
    }
  }, [towerId]);
  
  // Update projectile position and check for collisions
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Move projectile
    const moveDistance = speed * delta;
    const movement = new Vector3().copy(direction).multiplyScalar(moveDistance);
    position.add(movement);
    meshRef.current.position.copy(position);
    
    // Check if the projectile is targeting a specific enemy
    let target = null;
    if (targetId) {
      target = enemies.find(e => e.id === targetId);
    }
    
    // If we have a target, check for collision
    if (target) {
      const distanceToTarget = position.distanceTo(target.position);
      if (distanceToTarget < target.size + 0.5) {
        // Hit the target
        damageEnemy(target.id, damage);
        removeProjectile(id);
      }
    }
    
    // Alternative: check collision with all enemies
    if (!target) {
      for (const enemy of enemies) {
        const distanceToEnemy = position.distanceTo(enemy.position);
        if (distanceToEnemy < enemy.size + 0.5) {
          // Hit the enemy
          damageEnemy(enemy.id, damage);
          removeProjectile(id);
          break;
        }
      }
    }
    
    // Remove projectile if it's too far away (timeout)
    if (position.length() > 100) {
      removeProjectile(id);
    }
  });
  
  // Different projectile shapes for different tower types
  const getProjectileGeometry = () => {
    const towers = useTowerDefense.getState().towers;
    const tower = towers.find(t => t.id === towerId);
    
    switch (tower?.type) {
      case "laser":
        return <cylinderGeometry args={[0.1, 0.1, 1.0, 8]} />;
      case "sniper":
        return <sphereGeometry args={[0.15, 8, 8]} />;
      default: // cannon
        return <sphereGeometry args={[0.3, 8, 8]} />;
    }
  };
  
  return (
    <mesh 
      ref={meshRef} 
      position={[position.x, position.y, position.z]}
      material={projectileMaterial}
    >
      {getProjectileGeometry()}
    </mesh>
  );
}
