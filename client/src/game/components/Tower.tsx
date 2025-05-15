import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Tower as TowerType, TOWER_COLORS } from "../data/towers";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";
import { getTargetEnemy } from "../utils/collisions";
import { Sounds } from "../../lib/sounds";
import { useTexture } from "@react-three/drei";

interface TowerProps {
  tower: TowerType;
}

export function Tower({ tower }: TowerProps) {
  const towerRef = useRef<THREE.Group>(null);
  const turretRef = useRef<THREE.Mesh>(null);
  const rangeRef = useRef<THREE.Mesh>(null);
  
  const [showRange, setShowRange] = useState(false);
  
  // Load texture
  const texture = useTexture("/textures/wood.jpg");
  
  // Create materials
  const baseMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ map: texture }),
  [texture]);
  
  const turretMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ color: TOWER_COLORS[tower.type] }),
  [tower.type]);
  
  const rangeMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({
      color: TOWER_COLORS[tower.type],
      transparent: true,
      opacity: 0.1,
    }),
  [tower.type]);
  
  const enemies = useTowerDefense((state) => state.enemies);
  const addProjectile = useTowerDefense((state) => state.addProjectile);
  
  // Handle tower shooting
  useFrame((_, delta) => {
    if (!towerRef.current || !turretRef.current) return;
    
    // Find target enemy
    const targetEnemy = getTargetEnemy(tower, enemies);
    
    if (targetEnemy) {
      // Rotate turret to face enemy
      const direction = new THREE.Vector3()
        .subVectors(targetEnemy.position, tower.position)
        .normalize();
      
      const angle = Math.atan2(direction.x, direction.z);
      turretRef.current.rotation.y = angle;
      
      // Check if can attack based on attack speed
      const now = performance.now() / 1000; // Convert to seconds
      const timeSinceLastAttack = now - tower.lastAttackTime;
      
      if (timeSinceLastAttack >= 1 / tower.attackSpeed) {
        // Update last attack time
        tower.lastAttackTime = now;
        
        // Get position for projectile (end of turret)
        const turretDirection = new THREE.Vector3(direction.x, 0, direction.z).normalize();
        const projectilePosition = new THREE.Vector3()
          .copy(tower.position)
          .add(turretDirection.multiplyScalar(1.5));
        projectilePosition.y = 1.5; // Height adjustment
        
        // Create projectile
        addProjectile({
          position: projectilePosition,
          direction: new THREE.Vector3().subVectors(targetEnemy.position, projectilePosition).normalize(),
          speed: 20,
          damage: tower.damage,
          towerId: tower.id,
          targetId: targetEnemy.id
        });
        
        // Play sound
        Sounds.playHit();
      }
    }
  });
  
  return (
    <group 
      ref={towerRef} 
      position={[tower.position.x, tower.position.y, tower.position.z]}
      onPointerEnter={() => setShowRange(true)}
      onPointerLeave={() => setShowRange(false)}
    >
      {/* Base */}
      <mesh receiveShadow castShadow material={baseMaterial}>
        <boxGeometry args={[1.5, 0.5, 1.5]} />
      </mesh>
      
      {/* Turret */}
      <group position={[0, 0.75, 0]}>
        {/* Turret base (cylinder) */}
        <mesh receiveShadow castShadow material={baseMaterial}>
          <cylinderGeometry args={[0.6, 0.8, 0.5, 8]} />
        </mesh>
        
        {/* Turret gun */}
        <mesh 
          ref={turretRef} 
          position={[0, 0.4, 0]} 
          receiveShadow 
          castShadow
          material={turretMaterial}
        >
          <boxGeometry args={[0.3, 0.3, 1.5]} />
        </mesh>
      </group>
      
      {/* Range indicator (only shown on hover) */}
      {showRange && (
        <mesh 
          ref={rangeRef} 
          position={[0, 0.05, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
          material={rangeMaterial}
        >
          <circleGeometry args={[tower.range, 32]} />
        </mesh>
      )}
      
      {/* Tower level indicator */}
      {tower.level > 1 && (
        <>
          {/* Level 2 indicator */}
          <mesh position={[0.5, 0.3, 0.5]} material={turretMaterial}>
            <sphereGeometry args={[0.15, 8, 8]} />
          </mesh>
          
          {/* Level 3 indicator */}
          {tower.level === 3 && (
            <mesh position={[-0.5, 0.3, 0.5]} material={turretMaterial}>
              <sphereGeometry args={[0.15, 8, 8]} />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}
