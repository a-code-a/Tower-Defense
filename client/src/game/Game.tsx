import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Vector3, Vector2 } from "three";
import { 
  OrbitControls, 
  PerspectiveCamera,
  Environment,
  useHelper
} from "@react-three/drei";
import * as THREE from "three";

// Game components
import { Level } from "./components/Level";
import { Path } from "./components/Path";
import { Tower } from "./components/Tower";
import { Enemy } from "./components/Enemy";
import { Projectile } from "./components/Projectile";
import { Base } from "./components/Base";

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

// Scene lighting
function Lights() {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  // Debug light helper (only in development)
  // useHelper(directionalLightRef, THREE.DirectionalLightHelper, 5, "red");
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={directionalLightRef}
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
  );
}

// Game component
export default function Game() {
  const { levelId, getLevel } = useGameState();
  const level = getLevel(levelId || 1);
  
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
      >
        <color attach="background" args={["#87CEEB"]} />
        
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 15, 25]}
            fov={60}
          />
          
          <Lights />
          
          {/* Level geometry */}
          <Level levelConfig={level} />
          
          {/* Path */}
          <Path waypoints={level.path} />
          
          {/* Base */}
          <Base position={level.basePosition} />
          
          {/* Towers */}
          {towers.map(tower => (
            <Tower key={tower.id} tower={tower} />
          ))}
          
          {/* Tower placement preview */}
          {placementMode === "placing" && hoverPosition && (
            <mesh 
              position={hoverPosition}
              scale={[1.5, 1, 1.5]}
            >
              <boxGeometry />
              <meshStandardMaterial 
                color={isValidPlacement ? "#00ff00" : "#ff0000"} 
                transparent 
                opacity={0.5} 
              />
            </mesh>
          )}
          
          {/* Enemies */}
          {enemies.map(enemy => (
            <Enemy 
              key={enemy.id} 
              enemy={enemy} 
              levelConfig={level} 
            />
          ))}
          
          {/* Projectiles */}
          {projectiles.map(projectile => (
            <Projectile
              key={projectile.id}
              {...projectile}
            />
          ))}
          
          {/* Plane for tower placement */}
          <PlacementPlane onPlacePosition={updatePlacementPosition} />
          
          {/* Environment */}
          <Environment preset="sunset" />
          
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
