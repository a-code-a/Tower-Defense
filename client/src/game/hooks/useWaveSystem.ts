import { useState, useEffect, useCallback } from "react";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";
import { EnemyType, createEnemy } from "../data/enemies";
import { Vector3 } from "three";
import { LevelConfig, WaveConfig } from "../levels/level1";
import { Sounds } from "../../lib/sounds";

export function useWaveSystem(level: LevelConfig | null) {
  const [nextEnemyTime, setNextEnemyTime] = useState<number>(0);
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState<number>(0);
  const [currentEnemyType, setCurrentEnemyType] = useState<number>(0);
  const [waveEndTime, setWaveEndTime] = useState<number | null>(null);
  
  const { 
    currentWave,
    totalWaves,
    waveInProgress,
    startWave,
    endWave,
    addEnemy
  } = useTowerDefense();
  
  // Setup total waves when level changes
  useEffect(() => {
    if (!level) return;
    useTowerDefense.getState().setTotalWaves(level.waves.length);
  }, [level]);
  
  // Reset for a new wave
  const resetWaveState = useCallback(() => {
    setCurrentEnemyIndex(0);
    setCurrentEnemyType(0);
    setNextEnemyTime(0);
    setWaveEndTime(null);
  }, []);
  
  // Start a new wave
  const initiateWave = useCallback(() => {
    resetWaveState();
    startWave();
    Sounds.playSuccess();
    console.log(`Starting wave ${currentWave + 1} of ${totalWaves}`);
  }, [currentWave, totalWaves, resetWaveState, startWave]);
  
  // Update function called every frame
  const updateWave = useCallback((time: number) => {
    if (!waveInProgress || !level) return;
    
    // Get current wave configuration
    const waveConfig = level.waves[currentWave];
    if (!waveConfig) return;
    
    // Check if it's time for wave to end
    if (waveEndTime !== null && time >= waveEndTime) {
      endWave();
      return;
    }
    
    // Check if it's time to spawn a new enemy
    if (time >= nextEnemyTime) {
      // Get current enemy type configuration
      const enemyConfig = waveConfig.enemies[currentEnemyType];
      if (!enemyConfig) return;
      
      // Spawn enemy
      const enemy = createEnemy(
        enemyConfig.type,
        new Vector3().copy(level.path[0]),
        1 + (currentWave * 0.2) // Increase difficulty with each wave
      );
      
      addEnemy(enemy);
      
      // Update indices for next enemy
      const newEnemyIndex = currentEnemyIndex + 1;
      if (newEnemyIndex >= enemyConfig.count) {
        // Move to next enemy type
        const newEnemyType = currentEnemyType + 1;
        if (newEnemyType >= waveConfig.enemies.length) {
          // All enemies spawned, set time for wave end
          // We only end the wave when all enemies are defeated
          setWaveEndTime(null);
        } else {
          // Reset enemy index and move to next type
          setCurrentEnemyIndex(0);
          setCurrentEnemyType(newEnemyType);
          setNextEnemyTime(time + waveConfig.enemies[newEnemyType].spawnDelay);
        }
      } else {
        // Spawn next enemy of same type
        setCurrentEnemyIndex(newEnemyIndex);
        setNextEnemyTime(time + enemyConfig.spawnDelay);
      }
    }
  }, [
    currentWave, 
    waveInProgress, 
    currentEnemyType, 
    currentEnemyIndex, 
    nextEnemyTime, 
    waveEndTime,
    level?.path,
    addEnemy,
    endWave
  ]);
  
  return {
    currentWave,
    totalWaves,
    waveInProgress,
    initiateWave,
    updateWave
  };
}
