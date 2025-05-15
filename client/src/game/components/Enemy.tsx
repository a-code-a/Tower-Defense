import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Enemy as EnemyType, ENEMY_COLORS } from "../data/enemies";
import { Vector3 } from "three";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";
import { LevelConfig } from "../levels/level1";

interface EnemyProps {
  enemy: EnemyType;
  levelConfig: LevelConfig;
}

export function Enemy({ enemy, levelConfig }: EnemyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const healthBarRef = useRef<THREE.Mesh>(null);
  
  const path = levelConfig.path;
  const removeEnemy = useTowerDefense((state) => state.removeEnemy);
  const decreaseLives = useTowerDefense((state) => state.decreaseLives);
  
  // Create materials
  const enemyMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: ENEMY_COLORS[enemy.type],
      roughness: 0.7,
      metalness: 0.2
    }),
  [enemy.type]);
  
  const healthBarMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  []);
  
  const healthBarBgMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
  []);
  
  // Update enemy position based on path and speed
  useFrame((_, delta) => {
    if (!meshRef.current || !healthBarRef.current) return;
    
    // Skip if enemy is already at the end of the path
    if (enemy.currentWaypoint >= path.length - 1) {
      // Enemy reached the end, decrease lives and remove
      decreaseLives(enemy.damage);
      removeEnemy(enemy.id);
      return;
    }
    
    // Get current and next waypoints
    const currentWaypoint = path[enemy.currentWaypoint];
    const nextWaypoint = path[enemy.currentWaypoint + 1];
    
    // Calculate direction and distance to next waypoint
    const direction = new Vector3()
      .subVectors(nextWaypoint, enemy.position)
      .normalize();
    const distance = enemy.position.distanceTo(nextWaypoint);
    
    // Move enemy
    const moveAmount = enemy.speed * delta;
    
    if (moveAmount >= distance) {
      // Reached current waypoint, move to next
      enemy.position.copy(nextWaypoint);
      enemy.currentWaypoint++;
    } else {
      // Move towards next waypoint
      enemy.position.add(direction.multiplyScalar(moveAmount));
    }
    
    // Update mesh position
    meshRef.current.position.copy(enemy.position);
    
    // Rotate enemy to face direction of movement
    if (direction.length() > 0) {
      const angle = Math.atan2(direction.x, direction.z);
      meshRef.current.rotation.y = angle;
    }
    
    // Update health bar
    const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
    healthBarRef.current.scale.x = healthPercent;
    
    // Position health bar above enemy
    healthBarRef.current.position.set(
      -(1 - healthPercent) * 0.6, // Center the bar as it shrinks
      enemy.size + 0.3,
      0
    );
  });
  
  return (
    <group>
      {/* Enemy mesh */}
      <mesh 
        ref={meshRef} 
        position={[enemy.position.x, enemy.position.y, enemy.position.z]} 
        castShadow
        material={enemyMaterial}
      >
        {/* Different shapes for different enemy types */}
        {enemy.type === "basic" ? (
          <boxGeometry args={[enemy.size, enemy.size, enemy.size]} />
        ) : enemy.type === "fast" ? (
          <coneGeometry args={[enemy.size * 0.5, enemy.size, 8]} />
        ) : (
          <sphereGeometry args={[enemy.size * 0.6, 8, 8]} />
        )}
        
        {/* Health bar background */}
        <mesh position={[0, enemy.size + 0.3, 0]} rotation={[0, 0, 0]} material={healthBarBgMaterial}>
          <boxGeometry args={[1.2, 0.2, 0.1]} />
        </mesh>
        
        {/* Health bar */}
        <mesh 
          ref={healthBarRef} 
          position={[0, enemy.size + 0.3, 0]} 
          rotation={[0, 0, 0]}
          material={healthBarMaterial}
        >
          <boxGeometry args={[1.2, 0.2, 0.15]} />
        </mesh>
      </mesh>
    </group>
  );
}
