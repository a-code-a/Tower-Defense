/**
 * Desktop Optimizations
 * 
 * This file contains optimizations specifically for the desktop (Electron) version
 * of the game. These optimizations help improve performance and reduce bugs
 * that might occur in the browser version.
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Detects if the application is running in Electron
 */
export const isElectron = (): boolean => {
  // Check if window.process exists and has a type property
  return window && 
    window.process && 
    window.process.type === 'renderer';
};

/**
 * Hook to apply desktop-specific optimizations
 */
export const useDesktopOptimizations = () => {
  const { gl, scene } = useThree();
  
  useEffect(() => {
    if (!isElectron()) return;
    
    // Apply desktop-specific optimizations
    
    // 1. Use higher quality renderer settings
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(window.innerWidth, window.innerHeight);
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 2. Optimize scene
    scene.matrixAutoUpdate = false;
    
    // 3. Disable performance throttling that might be needed in browsers
    const disableThrottling = () => {
      // Remove any throttling or DPR adjustments that might be in place
      gl.setPixelRatio(window.devicePixelRatio);
    };
    
    // Apply optimizations on resize
    const handleResize = () => {
      gl.setSize(window.innerWidth, window.innerHeight);
      disableThrottling();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [gl, scene]);
};

/**
 * Apply desktop-specific settings to the game
 */
export const applyDesktopSettings = () => {
  if (!isElectron()) return;
  
  // Disable browser-specific limitations
  // These are settings that might be throttled in browsers but can run at full capacity in Electron
  
  // Example: Increase the maximum particle count for effects
  (window as any).MAX_PARTICLES = 10000; // Higher value for desktop
  
  // Example: Enable more advanced visual effects
  (window as any).ENABLE_ADVANCED_EFFECTS = true;
  
  // Example: Increase physics simulation quality
  (window as any).PHYSICS_QUALITY = 'high';
  
  // Example: Disable browser-specific workarounds
  (window as any).BROWSER_MODE = false;
};