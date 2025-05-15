import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Tower as TowerType, TOWER_COLORS, TowerType as TowerTypeEnum } from "../data/towers";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";
import { getTargetEnemy } from "../utils/collisions";
import { Sounds } from "../../lib/sounds";
import { useTexture } from "@react-three/drei";

// Muzzle flash effect
class MuzzleFlash {
  active: boolean;
  life: number;
  maxLife: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  
  constructor() {
    this.active = false;
    this.life = 0;
    this.maxLife = 0.1;
    this.position = new THREE.Vector3();
    this.direction = new THREE.Vector3();
  }
  
  trigger(position: THREE.Vector3, direction: THREE.Vector3) {
    this.active = true;
    this.life = 0;
    this.position.copy(position);
    this.direction.copy(direction);
  }
  
  update(delta: number) {
    if (!this.active) return;
    
    this.life += delta;
    if (this.life >= this.maxLife) {
      this.active = false;
    }
  }
}

interface EnhancedTowerProps {
  tower: TowerType;
}

export function EnhancedTower({ tower }: EnhancedTowerProps) {
  const towerRef = useRef<THREE.Group>(null);
  const baseRef = useRef<THREE.Mesh>(null);
  const turretRef = useRef<THREE.Group>(null);
  const barrelRef = useRef<THREE.Mesh>(null);
  const rangeRef = useRef<THREE.Mesh>(null);
  const muzzleFlashRef = useRef<THREE.Mesh>(null);
  const laserBeamRef = useRef<THREE.Line>(null);
  
  const [showRange, setShowRange] = useState(false);
  
  // Load textures
  const textures = {
    wood: useTexture("/textures/wood.jpg"),
    cannon: useTexture("/textures/towers/cannon.png"),
    laser: useTexture("/textures/towers/laser.png"),
    sniper: useTexture("/textures/towers/sniper.png"),
    particle: useTexture("/textures/particles/circle.png")
  };
  
  // Create muzzle flash
  const muzzleFlash = useMemo(() => new MuzzleFlash(), []);
  
  // Create materials
  const baseMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({ 
      map: textures.wood,
      roughness: 0.7,
      metalness: 0.2
    });
    material.map!.wrapS = THREE.RepeatWrapping;
    material.map!.wrapT = THREE.RepeatWrapping;
    material.map!.repeat.set(1, 1);
    return material;
  }, [textures.wood]);
  
  const turretMaterial = useMemo(() => {
    const texture = textures[tower.type as keyof typeof textures] || textures.cannon;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return new THREE.MeshStandardMaterial({ 
      map: texture,
      color: TOWER_COLORS[tower.type],
      roughness: 0.5,
      metalness: 0.7
    });
  }, [tower.type, textures]);
  
  const rangeMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({
      color: TOWER_COLORS[tower.type],
      transparent: true,
      opacity: 0.1,
    }),
  [tower.type]);
  
  const muzzleFlashMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0,
      emissive: 0xffff00,
      emissiveIntensity: 2
    }),
  []);
  
  const laserMaterial = useMemo(() => 
    new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      linewidth: 3
    }),
  []);
  
  const enemies = useTowerDefense((state) => state.enemies);
  const addProjectile = useTowerDefense((state) => state.addProjectile);
  
  // Create laser beam geometry
  const laserGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 20)
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);
  
  // Handle tower shooting
  useFrame((_, delta) => {
    if (!towerRef.current || !turretRef.current || !barrelRef.current || !muzzleFlashRef.current || !laserBeamRef.current) return;
    
    // Update muzzle flash
    muzzleFlash.update(delta);
    if (muzzleFlash.active) {
      muzzleFlashRef.current.material = new THREE.MeshBasicMaterial({
        ...muzzleFlashMaterial,
        opacity: 1 - muzzleFlash.life / muzzleFlash.maxLife
      });
    } else {
      muzzleFlashRef.current.material = new THREE.MeshBasicMaterial({
        ...muzzleFlashMaterial,
        opacity: 0
      });
    }
    
    // Update laser beam
    if (tower.type === TowerTypeEnum.LASER) {
      const laserOpacity = laserBeamRef.current.material.opacity;
      if (laserOpacity > 0) {
        laserBeamRef.current.material = new THREE.LineBasicMaterial({
          ...laserMaterial,
          opacity: Math.max(0, laserOpacity - delta * 5)
        });
      }
    }
    
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
        
        // Get position for projectile (end of barrel)
        const turretDirection = new THREE.Vector3(direction.x, 0, direction.z).normalize();
        const projectilePosition = new THREE.Vector3()
          .copy(tower.position)
          .add(turretDirection.multiplyScalar(1.5));
        projectilePosition.y = 1.5; // Height adjustment
        
        // Trigger effects based on tower type
        if (tower.type === TowerTypeEnum.CANNON || tower.type === TowerTypeEnum.SNIPER) {
          // Trigger muzzle flash
          muzzleFlash.trigger(
            new THREE.Vector3(0, 0, 1.0), // Local position at end of barrel
            turretDirection
          );
          
          // Create projectile
          addProjectile({
            position: projectilePosition,
            direction: new THREE.Vector3().subVectors(targetEnemy.position, projectilePosition).normalize(),
            speed: tower.type === TowerTypeEnum.SNIPER ? 30 : 20,
            damage: tower.damage,
            towerId: tower.id,
            targetId: targetEnemy.id
          });
        } else if (tower.type === TowerTypeEnum.LASER) {
          // Update laser beam
          const points = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3().subVectors(targetEnemy.position, tower.position)
          ];
          laserBeamRef.current.geometry.setFromPoints(points);
          laserBeamRef.current.material = new THREE.LineBasicMaterial({
            ...laserMaterial,
            opacity: 1
          });
          
          // Direct damage for laser (no projectile)
          targetEnemy.health -= tower.damage;
        }
        
        // Play sound
        Sounds.playHit();
      }
    }
    
    // Tower base rotation (slow spin)
    if (baseRef.current) {
      baseRef.current.rotation.y += delta * 0.2;
    }
  });
  
  // Create tower model based on type
  const createTowerModel = () => {
    switch (tower.type) {
      case TowerTypeEnum.CANNON:
        return (
          <>
            {/* Base */}
            <mesh ref={baseRef} receiveShadow castShadow material={baseMaterial}>
              <cylinderGeometry args={[0.8, 1.0, 0.5, 8]} />
            </mesh>
            
            {/* Turret */}
            <group ref={turretRef} position={[0, 0.75, 0]}>
              {/* Turret base */}
              <mesh receiveShadow castShadow material={turretMaterial}>
                <cylinderGeometry args={[0.6, 0.7, 0.5, 8]} />
              </mesh>
              
              {/* Cannon barrel */}
              <group position={[0, 0.3, 0]}>
                <mesh 
                  ref={barrelRef}
                  position={[0, 0, 0.5]} 
                  receiveShadow 
                  castShadow
                  material={turretMaterial}
                >
                  <cylinderGeometry args={[0.2, 0.25, 1.5, 8]} rotation={[Math.PI / 2, 0, 0]} />
                </mesh>
                
                {/* Muzzle flash */}
                <mesh 
                  ref={muzzleFlashRef}
                  position={[0, 0, 1.3]} 
                  material={muzzleFlashMaterial}
                >
                  <sphereGeometry args={[0.3, 8, 8]} />
                </mesh>
              </group>
            </group>
          </>
        );
        
      case TowerTypeEnum.LASER:
        return (
          <>
            {/* Base */}
            <mesh ref={baseRef} receiveShadow castShadow material={baseMaterial}>
              <cylinderGeometry args={[0.7, 0.9, 0.5, 8]} />
            </mesh>
            
            {/* Turret */}
            <group ref={turretRef} position={[0, 0.75, 0]}>
              {/* Turret base */}
              <mesh receiveShadow castShadow material={turretMaterial}>
                <cylinderGeometry args={[0.5, 0.6, 0.6, 8]} />
              </mesh>
              
              {/* Laser emitter */}
              <group position={[0, 0.3, 0.3]}>
                <mesh 
                  ref={barrelRef}
                  position={[0, 0, 0.3]} 
                  receiveShadow 
                  castShadow
                  material={turretMaterial}
                >
                  <boxGeometry args={[0.6, 0.3, 0.8]} />
                </mesh>
                
                {/* Laser lens */}
                <mesh 
                  position={[0, 0, 0.8]} 
                  material={new THREE.MeshStandardMaterial({
                    color: 0x00ffff,
                    emissive: 0x00ffff,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.8
                  })}
                >
                  <cylinderGeometry args={[0.15, 0.15, 0.1, 8]} rotation={[Math.PI / 2, 0, 0]} />
                </mesh>
                
                {/* Laser beam */}
                <line 
                  ref={laserBeamRef}
                  position={[0, 0, 0.8]}
                  geometry={laserGeometry}
                  material={laserMaterial}
                />
              </group>
            </group>
          </>
        );
        
      case TowerTypeEnum.SNIPER:
        return (
          <>
            {/* Base */}
            <mesh ref={baseRef} receiveShadow castShadow material={baseMaterial}>
              <cylinderGeometry args={[0.7, 0.9, 0.5, 8]} />
            </mesh>
            
            {/* Turret */}
            <group ref={turretRef} position={[0, 0.75, 0]}>
              {/* Turret base */}
              <mesh receiveShadow castShadow material={turretMaterial}>
                <cylinderGeometry args={[0.5, 0.6, 0.5, 8]} />
              </mesh>
              
              {/* Sniper barrel */}
              <group position={[0, 0.3, 0]}>
                <mesh 
                  ref={barrelRef}
                  position={[0, 0, 1.0]} 
                  receiveShadow 
                  castShadow
                  material={turretMaterial}
                >
                  <cylinderGeometry args={[0.1, 0.15, 2.5, 8]} rotation={[Math.PI / 2, 0, 0]} />
                </mesh>
                
                {/* Scope */}
                <mesh 
                  position={[0, 0.2, 0.5]} 
                  material={turretMaterial}
                >
                  <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} rotation={[Math.PI / 2, 0, 0]} />
                </mesh>
                
                {/* Muzzle flash */}
                <mesh 
                  ref={muzzleFlashRef}
                  position={[0, 0, 2.3]} 
                  material={muzzleFlashMaterial}
                >
                  <sphereGeometry args={[0.2, 8, 8]} />
                </mesh>
              </group>
            </group>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <group 
      ref={towerRef} 
      position={[tower.position.x, tower.position.y, tower.position.z]}
      onPointerEnter={() => setShowRange(true)}
      onPointerLeave={() => setShowRange(false)}
    >
      {/* Tower model */}
      {createTowerModel()}
      
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
          <mesh position={[0.5, 0.3, 0.5]} material={new THREE.MeshStandardMaterial({ color: TOWER_COLORS[tower.type], emissive: TOWER_COLORS[tower.type], emissiveIntensity: 0.5 })}>
            <sphereGeometry args={[0.15, 8, 8]} />
          </mesh>
          
          {/* Level 3 indicator */}
          {tower.level === 3 && (
            <mesh position={[-0.5, 0.3, 0.5]} material={new THREE.MeshStandardMaterial({ color: TOWER_COLORS[tower.type], emissive: TOWER_COLORS[tower.type], emissiveIntensity: 0.5 })}>
              <sphereGeometry args={[0.15, 8, 8]} />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}