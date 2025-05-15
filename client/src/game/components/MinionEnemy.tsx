import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Enemy as EnemyType, ENEMY_COLORS } from "../data/enemies";
import { Vector3 } from "three";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";
import { LevelConfig } from "../levels/level1";
import { useTexture } from "@react-three/drei";
import { Quaternion } from "three";

// Particle system for hit effects
class ParticleSystem {
  particles: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    size: number;
    life: number;
    maxLife: number;
    color: THREE.Color;
  }[];
  maxParticles: number;
  texture: THREE.Texture;
  
  constructor(maxParticles: number, texture: THREE.Texture) {
    this.particles = [];
    this.maxParticles = maxParticles;
    this.texture = texture;
  }
  
  emit(position: THREE.Vector3, count: number, color: THREE.Color) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) return;
      
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.1;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.05 + Math.random() * 0.1,
        Math.sin(angle) * speed
      );
      
      this.particles.push({
        position: position.clone(),
        velocity,
        size: 0.2 + Math.random() * 0.3,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5,
        color: color.clone()
      });
    }
  }
  
  update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Update position
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      
      // Add gravity
      p.velocity.y -= 0.1 * delta;
    }
  }
}

interface MinionEnemyProps {
  enemy: EnemyType;
  levelConfig: LevelConfig;
}

export function MinionEnemy({ enemy, levelConfig }: MinionEnemyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const eyesRef = useRef<THREE.Mesh>(null);
  const healthBarRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  const path = levelConfig.path;
  const removeEnemy = useTowerDefense((state) => state.removeEnemy);
  const decreaseLives = useTowerDefense((state) => state.decreaseLives);
  const enemies = useTowerDefense((state) => state.enemies);
  
  // Load textures
  const textures = {
    basic: useTexture("/textures/enemies/minion_basic.png"),
    fast: useTexture("/textures/enemies/minion_fast.png"),
    tank: useTexture("/textures/enemies/minion_tank.png"),
    particle: useTexture("/textures/particles/circle.png")
  };
  
  // Set up particle system
  const particleSystem = useMemo(() => new ParticleSystem(50, textures.particle), [textures.particle]);
  const particlePositions = useMemo(() => new Float32Array(50 * 3), []);
  const particleSizes = useMemo(() => new Float32Array(50), []);
  const particleColors = useMemo(() => new Float32Array(50 * 3), []);
  const particleOpacities = useMemo(() => new Float32Array(50), []);
  
  // Create materials
  const bodyMaterial = useMemo(() => {
    const texture = textures[enemy.type as keyof typeof textures] || textures.basic;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return new THREE.MeshStandardMaterial({ 
      map: texture,
      roughness: 0.7,
      metalness: 0.3,
      color: ENEMY_COLORS[enemy.type]
    });
  }, [enemy.type, textures]);
  
  const eyeMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    }),
  []);
  
  const healthBarMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  []);
  
  const healthBarBgMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
  []);
  
  const particleMaterial = useMemo(() => 
    new THREE.PointsMaterial({
      size: 0.5,
      map: textures.particle,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }),
  [textures.particle]);
  
  // Track previous health to detect hits
  const prevHealthRef = useRef(enemy.health);
  
  // Animation parameters
  const animationRef = useRef({
    bobHeight: 0,
    bobSpeed: 1.5 + Math.random() * 0.5,
    bobTime: Math.random() * Math.PI * 2,
    rotationSpeed: 0.5 + Math.random() * 0.5,
    eyeBlinkTime: 0,
    eyeBlinkInterval: 2 + Math.random() * 3
  });
  
  // Update enemy position and animations
  useFrame((_, delta) => {
    if (!groupRef.current || !bodyRef.current || !eyesRef.current || !healthBarRef.current || !particlesRef.current) return;
    
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
    
    // Update group position
    groupRef.current.position.copy(enemy.position);
    
    // Rotate enemy to face direction of movement
    if (direction.length() > 0) {
      const targetRotation = new Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(direction.x, 0, direction.z).normalize()
      );
      
      // Smooth rotation
      groupRef.current.quaternion.slerp(targetRotation, 5 * delta);
    }
    
    // Bobbing animation
    const anim = animationRef.current;
    anim.bobTime += delta * anim.bobSpeed;
    anim.bobHeight = Math.sin(anim.bobTime) * 0.1;
    bodyRef.current.position.y = 0.5 + anim.bobHeight;
    
    // Eye blinking
    anim.eyeBlinkTime += delta;
    if (anim.eyeBlinkTime > anim.eyeBlinkInterval) {
      eyesRef.current.scale.y = 0.1;
      if (anim.eyeBlinkTime > anim.eyeBlinkInterval + 0.15) {
        eyesRef.current.scale.y = 1;
        anim.eyeBlinkTime = 0;
        anim.eyeBlinkInterval = 2 + Math.random() * 3;
      }
    }
    
    // Update health bar
    const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
    healthBarRef.current.scale.x = healthPercent;
    
    // Position health bar above enemy
    healthBarRef.current.position.set(
      -(1 - healthPercent) * 0.6, // Center the bar as it shrinks
      enemy.size * 1.5 + 0.3,
      0
    );
    
    // Check for damage taken
    if (enemy.health < prevHealthRef.current) {
      // Emit particles on hit
      const hitPosition = new THREE.Vector3(0, enemy.size * 0.5, 0);
      hitPosition.applyMatrix4(groupRef.current.matrixWorld);
      
      const color = new THREE.Color(ENEMY_COLORS[enemy.type]);
      particleSystem.emit(hitPosition, 10, color);
      
      // Flash the body on hit
      bodyRef.current.material = new THREE.MeshStandardMaterial({
        ...bodyMaterial,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.5
      });
      
      // Reset material after flash
      setTimeout(() => {
        if (bodyRef.current) {
          bodyRef.current.material = bodyMaterial;
        }
      }, 100);
    }
    prevHealthRef.current = enemy.health;
    
    // Update particle system
    particleSystem.update(delta);
    
    // Update particle geometry
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array;
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
    const opacities = particlesRef.current.geometry.attributes.opacity.array as Float32Array;
    
    for (let i = 0; i < particleSystem.particles.length; i++) {
      const p = particleSystem.particles[i];
      const i3 = i * 3;
      
      // Position
      positions[i3] = p.position.x;
      positions[i3 + 1] = p.position.y;
      positions[i3 + 2] = p.position.z;
      
      // Size
      sizes[i] = p.size * (1 - p.life / p.maxLife);
      
      // Color
      colors[i3] = p.color.r;
      colors[i3 + 1] = p.color.g;
      colors[i3 + 2] = p.color.b;
      
      // Opacity
      opacities[i] = 1 - p.life / p.maxLife;
    }
    
    // Fill the rest with invisible particles
    for (let i = particleSystem.particles.length; i < 50; i++) {
      const i3 = i * 3;
      positions[i3] = 0;
      positions[i3 + 1] = -1000; // Hide below ground
      positions[i3 + 2] = 0;
      sizes[i] = 0;
      opacities[i] = 0;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.size.needsUpdate = true;
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
    particlesRef.current.geometry.attributes.opacity.needsUpdate = true;
  });
  
  // Create minion geometry based on enemy type
  const createMinionGeometry = () => {
    switch (enemy.type) {
      case 'basic':
        return (
          <group>
            {/* Body */}
            <mesh ref={bodyRef} position={[0, 0.5, 0]} castShadow material={bodyMaterial}>
              <capsuleGeometry args={[enemy.size * 0.4, enemy.size * 0.6, 8, 16]} />
              
              {/* Eyes */}
              <group position={[0, enemy.size * 0.3, enemy.size * 0.3]}>
                <mesh ref={eyesRef} material={eyeMaterial}>
                  <sphereGeometry args={[enemy.size * 0.15, 8, 8]} />
                </mesh>
                <mesh position={[0, 0, enemy.size * 0.05]} material={new THREE.MeshBasicMaterial({ color: 0x000000 })}>
                  <sphereGeometry args={[enemy.size * 0.05, 8, 8]} />
                </mesh>
              </group>
              
              {/* Arms */}
              <mesh position={[enemy.size * 0.3, 0, 0]} rotation={[0, 0, -Math.PI / 4]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.1, enemy.size * 0.4, 8, 8]} />
              </mesh>
              <mesh position={[-enemy.size * 0.3, 0, 0]} rotation={[0, 0, Math.PI / 4]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.1, enemy.size * 0.4, 8, 8]} />
              </mesh>
              
              {/* Legs */}
              <mesh position={[enemy.size * 0.2, -enemy.size * 0.4, 0]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.1, enemy.size * 0.3, 8, 8]} />
              </mesh>
              <mesh position={[-enemy.size * 0.2, -enemy.size * 0.4, 0]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.1, enemy.size * 0.3, 8, 8]} />
              </mesh>
            </mesh>
          </group>
        );
        
      case 'fast':
        return (
          <group>
            {/* Body - taller and thinner */}
            <mesh ref={bodyRef} position={[0, 0.5, 0]} castShadow material={bodyMaterial}>
              <capsuleGeometry args={[enemy.size * 0.3, enemy.size * 0.8, 8, 16]} />
              
              {/* Eyes */}
              <group position={[0, enemy.size * 0.4, enemy.size * 0.25]}>
                <mesh ref={eyesRef} material={eyeMaterial}>
                  <sphereGeometry args={[enemy.size * 0.12, 8, 8]} />
                </mesh>
                <mesh position={[0, 0, enemy.size * 0.05]} material={new THREE.MeshBasicMaterial({ color: 0x000000 })}>
                  <sphereGeometry args={[enemy.size * 0.04, 8, 8]} />
                </mesh>
              </group>
              
              {/* Arms - longer for speed */}
              <mesh position={[enemy.size * 0.25, 0, 0]} rotation={[0, 0, -Math.PI / 3]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.08, enemy.size * 0.5, 8, 8]} />
              </mesh>
              <mesh position={[-enemy.size * 0.25, 0, 0]} rotation={[0, 0, Math.PI / 3]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.08, enemy.size * 0.5, 8, 8]} />
              </mesh>
              
              {/* Legs - longer for speed */}
              <mesh position={[enemy.size * 0.15, -enemy.size * 0.5, 0]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.08, enemy.size * 0.4, 8, 8]} />
              </mesh>
              <mesh position={[-enemy.size * 0.15, -enemy.size * 0.5, 0]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.08, enemy.size * 0.4, 8, 8]} />
              </mesh>
            </mesh>
          </group>
        );
        
      case 'tank':
        return (
          <group>
            {/* Body - wider and bulkier */}
            <mesh ref={bodyRef} position={[0, 0.5, 0]} castShadow material={bodyMaterial}>
              <capsuleGeometry args={[enemy.size * 0.5, enemy.size * 0.5, 8, 16]} />
              
              {/* Eyes */}
              <group position={[0, enemy.size * 0.3, enemy.size * 0.4]}>
                <mesh ref={eyesRef} material={eyeMaterial}>
                  <sphereGeometry args={[enemy.size * 0.18, 8, 8]} />
                </mesh>
                <mesh position={[0, 0, enemy.size * 0.06]} material={new THREE.MeshBasicMaterial({ color: 0x000000 })}>
                  <sphereGeometry args={[enemy.size * 0.06, 8, 8]} />
                </mesh>
              </group>
              
              {/* Arms - thicker */}
              <mesh position={[enemy.size * 0.4, 0, 0]} rotation={[0, 0, -Math.PI / 6]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.15, enemy.size * 0.4, 8, 8]} />
              </mesh>
              <mesh position={[-enemy.size * 0.4, 0, 0]} rotation={[0, 0, Math.PI / 6]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.15, enemy.size * 0.4, 8, 8]} />
              </mesh>
              
              {/* Legs - thicker */}
              <mesh position={[enemy.size * 0.25, -enemy.size * 0.4, 0]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.15, enemy.size * 0.3, 8, 8]} />
              </mesh>
              <mesh position={[-enemy.size * 0.25, -enemy.size * 0.4, 0]} material={bodyMaterial}>
                <capsuleGeometry args={[enemy.size * 0.15, enemy.size * 0.3, 8, 8]} />
              </mesh>
              
              {/* Armor plate */}
              <mesh position={[0, 0, enemy.size * 0.2]} material={bodyMaterial}>
                <boxGeometry args={[enemy.size * 0.8, enemy.size * 0.4, enemy.size * 0.1]} />
              </mesh>
            </mesh>
          </group>
        );
        
      default:
        return null;
    }
  };
  
  // Create particle geometry
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    
    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(particleOpacities, 1));
    
    return geometry;
  }, [particlePositions, particleSizes, particleColors, particleOpacities]);
  
  return (
    <>
      <group ref={groupRef} position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
        {/* Minion model */}
        {createMinionGeometry()}
        
        {/* Health bar background */}
        <mesh position={[0, enemy.size * 1.5 + 0.3, 0]} rotation={[0, 0, 0]} material={healthBarBgMaterial}>
          <boxGeometry args={[1.2, 0.2, 0.1]} />
        </mesh>
        
        {/* Health bar */}
        <mesh 
          ref={healthBarRef} 
          position={[0, enemy.size * 1.5 + 0.3, 0]} 
          rotation={[0, 0, 0]}
          material={healthBarMaterial}
        >
          <boxGeometry args={[1.2, 0.2, 0.15]} />
        </mesh>
      </group>
      
      {/* Particle system for hit effects */}
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />
    </>
  );
}