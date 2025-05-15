import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Vector3, Vector2 } from "three";
import { 
  OrbitControls, 
  PerspectiveCamera,
  Environment,
  useHelper,
  PerformanceMonitor,
  AdaptiveDpr,
  Preload,
  Effects
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";

// Desktop optimizations
import { isElectron, useDesktopOptimizations, applyDesktopSettings } from "../utils/desktopOptimizations";

// Game components
import { Level } from "./components/Level";
import { Path } from "./components/Path";
import { EnhancedTower } from "./components/EnhancedTower";
import { MinionEnemy } from "./components/MinionEnemy";
import { EnhancedProjectile } from "./components/EnhancedProjectile";
import { Base } from "./components/Base";
import { EnhancedEnvironment } from "./components/EnhancedEnvironment";

// UI components
import GameUI from "./components/UI/GameUI";

// Hooks and state
import { useTowerDefense } from "../lib/stores/useTowerDefense";
import { useWaveSystem } from "./hooks/useWaveSystem";
import { useGameState } from "./hooks/useGameState";
import { useTowerPlacement } from "./hooks/useTowerPlacement";

// Helper to handle pointer events for tower placement
function PlacementPlane({ onPlacePosition }: { onPlacePosition: (position: Vector3) => void }) {
  const { camera, raycaster, mouse } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);
  
  // Handle all pointer events (both mouse and touch)
  const handlePointerMove = useCallback((event: any) => {
    if (!planeRef.current) return;
    
    // Create a ray from the camera through the pointer point
    const pointer = new THREE.Vector2();
    pointer.x = (event.offsetX / event.target.clientWidth) * 2 - 1;
    pointer.y = -(event.offsetY / event.target.clientHeight) * 2 + 1;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(planeRef.current);
    
    if (intersects.length > 0) {
      const { point } = intersects[0];
      onPlacePosition(point);
    }
  }, [camera, raycaster, onPlacePosition]);
  
  // Standard mouse tracking for continuous updates
  useFrame(() => {
    if (!planeRef.current) return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(planeRef.current);
    
    if (intersects.length > 0) {
      const { point } = intersects[0];
      onPlacePosition(point);
    }
  });

  // Add event listeners to the canvas for both mouse and touch events
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // For both mouse and touch movement
      canvas.addEventListener('pointermove', handlePointerMove);
      
      // Additional touch-specific handlers for better mobile experience
      const handleTouchStart = (e: TouchEvent) => {
        // Prevent default to avoid scrolling while interacting with the game
        if (e.touches.length === 1) {
          e.preventDefault();
        }
      };
      
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      
      return () => {
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('touchstart', handleTouchStart);
      };
    }
  }, [handlePointerMove]);

  return (
    <mesh
      ref={planeRef}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// Tower placement preview with animation
function TowerPreview({ position, isValid, towerType }: { position: Vector3, isValid: boolean, towerType: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Animate preview
  useFrame((_, delta) => {
    if (!meshRef.current || !glowRef.current) return;
    
    // Rotate preview
    meshRef.current.rotation.y += delta * 1.5;
    
    // Pulse glow
    const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
    glowRef.current.scale.set(scale, scale, scale);
  });
  
  // Color based on tower type and validity
  const color = isValid 
    ? (towerType === "cannon" ? "#ff4400" : towerType === "laser" ? "#00aaff" : "#44ff00")
    : "#ff0000";
  
  return (
    <group position={position}>
      {/* Base platform */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.1, 16]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.7}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Tower preview */}
      <mesh 
        ref={meshRef}
        position={[0, 0.5, 0]} 
        castShadow
      >
        {towerType === "cannon" ? (
          <cylinderGeometry args={[0.5, 0.7, 1, 8]} />
        ) : towerType === "laser" ? (
          <boxGeometry args={[0.8, 1, 0.8]} />
        ) : (
          <coneGeometry args={[0.5, 1.2, 8]} />
        )}
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.7}
          wireframe={true}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh 
        ref={glowRef}
        position={[0, 0.5, 0]}
      >
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Game component
export default function Game() {
  const { levelId, getLevel } = useGameState();
  const level = getLevel(levelId || 1);
  
  // Set higher initial DPR for desktop
  const [dpr, setDpr] = useState(isElectron() ? 2.0 : 1.5);
  
  const { 
    towers,
    enemies,
    projectiles,
    waveInProgress,
    phase
  } = useTowerDefense();
  
  const { 
    initiateWave,
    updateWave
  } = useWaveSystem(level);
  
  const {
    hoverPosition,
    isValidPlacement,
    placementMode,
    selectedTowerType,
    updatePlacementPosition,
    placeTower
  } = useTowerPlacement(level);
  
  // Handle both mouse clicks and touch taps to place tower
  const handleTowerPlacement = useCallback(() => {
    if (placementMode === "placing" && hoverPosition && isValidPlacement) {
      placeTower();
    }
  }, [placementMode, hoverPosition, isValidPlacement, placeTower]);
  
  if (!level) return null;
  
  return (
    <div className="w-full h-full">
      <Canvas 
        shadows 
        onClick={handleTowerPlacement}
        onPointerDown={handleTowerPlacement} // Handle touch start events
        camera={{ position: [0, 15, 25], fov: 60 }}
        dpr={dpr}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
      >
        {/* Performance monitoring - more aggressive in desktop mode */}
        <PerformanceMonitor
          onIncline={() => {
            const maxDpr = isElectron() ? 3.0 : 2.0;
            const increment = isElectron() ? 0.75 : 0.5;
            setDpr(Math.min(maxDpr, dpr + increment));
          }}
          onDecline={() => {
            const minDpr = isElectron() ? 1.5 : 1.0;
            const decrement = isElectron() ? 0.5 : 0.5;
            setDpr(Math.max(minDpr, dpr - decrement));
          }}
        >
          <AdaptiveDpr pixelated />
        </PerformanceMonitor>
        
        <Suspense fallback={null}>
          {/* Apply desktop optimizations */}
          <DesktopOptimizer />
          
          <PerspectiveCamera
            makeDefault
            position={[0, 15, 25]}
            fov={60}
          />
          
          {/* Enhanced environment */}
          <EnhancedEnvironment levelConfig={level} />
          
          {/* Level geometry */}
          <Level levelConfig={level} />
          
          {/* Path */}
          <Path waypoints={level.path} />
          
          {/* Base */}
          <Base position={level.basePosition} />
          
          {/* Towers */}
          {towers.map(tower => (
            <EnhancedTower key={tower.id} tower={tower} />
          ))}
          
          {/* Tower placement preview */}
          {placementMode === "placing" && hoverPosition && (
            <TowerPreview 
              position={hoverPosition}
              isValid={isValidPlacement}
              towerType={selectedTowerType}
            />
          )}
          
          {/* Enemies */}
          {enemies.map(enemy => (
            <MinionEnemy 
              key={enemy.id} 
              enemy={enemy} 
              levelConfig={level} 
            />
          ))}
          
          {/* Projectiles */}
          {projectiles.map(projectile => (
            <EnhancedProjectile
              key={projectile.id}
              {...projectile}
            />
          ))}
          
          {/* Plane for tower placement */}
          <PlacementPlane onPlacePosition={updatePlacementPosition} />
          
          {/* Camera controls with touch support */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.5}
            minPolarAngle={Math.PI / 8}
            maxDistance={40}
            minDistance={10}
            panSpeed={0.7}
            rotateSpeed={0.7}
            zoomSpeed={1.2}
            enableDamping={true}
            dampingFactor={0.1}
            touches={{
              ONE: THREE.TOUCH.PAN,
              TWO: THREE.TOUCH.ROTATE
            }}
          />
          
          {/* Post-processing effects */}
          <EffectComposer>
            <Bloom 
              intensity={0.5} 
              luminanceThreshold={0.8} 
              luminanceSmoothing={0.9} 
            />
            <DepthOfField 
              focusDistance={0} 
              focalLength={0.02} 
              bokehScale={2} 
              height={480} 
            />
            <Vignette 
              offset={0.5} 
              darkness={0.5} 
              eskil={false} 
            />
          </EffectComposer>
          
          <Preload all />
        </Suspense>
        
        {/* Game loop */}
        <GameLoop updateWave={updateWave} />
      </Canvas>
      
      {/* Game UI */}
      <GameUI 
        levelConfig={level} 
        onStartWave={initiateWave}
        waveInProgress={waveInProgress}
      />
    </div>
  );
}

// Desktop optimizations component
function DesktopOptimizer() {
  // Apply desktop-specific optimizations
  useDesktopOptimizations();
  
  useEffect(() => {
    // Apply desktop settings
    if (isElectron()) {
      console.log("Running in Electron - applying desktop optimizations");
      applyDesktopSettings();
    }
  }, []);
  
  return null;
}

// Game loop component (handles frame updates)
function GameLoop({ updateWave }: { updateWave: (time: number) => void }) {
  const timeRef = useRef(0);
  const phase = useTowerDefense(state => state.phase);
  
  useFrame((_, delta) => {
    if (phase !== "playing") return;
    
    timeRef.current += delta;
    updateWave(timeRef.current);
  });
  
  return null;
}
