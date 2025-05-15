import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Vector3 } from "three";
import { Tower } from "../../game/data/towers";
import { Enemy } from "../../game/data/enemies";
import { useAudio } from "./useAudio";

export type GamePhase = "menu" | "levelSelect" | "playing" | "paused" | "gameOver" | "victory";
export type PlacementMode = "none" | "placing";

interface GameState {
  // Game phase
  phase: GamePhase;
  levelId: number | null;
  
  // Resources and health
  gold: number;
  lives: number;
  
  // Game entities
  towers: Tower[];
  enemies: Enemy[];
  projectiles: {
    id: string;
    position: Vector3;
    direction: Vector3;
    speed: number;
    damage: number;
    towerId: string;
    targetId: string | null;
  }[];
  
  // Current wave and total waves
  currentWave: number;
  totalWaves: number;
  waveInProgress: boolean;
  
  // Tower placement
  placementMode: PlacementMode;
  selectedTowerType: string | null;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  setLevelId: (levelId: number) => void;
  setGold: (gold: number) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  setLives: (lives: number) => void;
  decreaseLives: (amount: number) => void;
  
  // Tower management
  addTower: (tower: Tower) => void;
  removeTower: (id: string) => void;
  upgradeTower: (id: string) => void;
  
  // Enemy management
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (id: string) => void;
  damageEnemy: (id: string, damage: number) => void;
  
  // Projectile management
  addProjectile: (projectile: { position: Vector3, direction: Vector3, speed: number, damage: number, towerId: string, targetId: string | null }) => void;
  removeProjectile: (id: string) => void;
  
  // Wave management
  setWave: (wave: number) => void;
  setTotalWaves: (totalWaves: number) => void;
  startWave: () => void;
  endWave: () => void;
  
  // Tower placement
  setPlacementMode: (mode: PlacementMode) => void;
  setSelectedTowerType: (type: string | null) => void;
  
  // Game reset
  resetGame: () => void;
}

export const useTowerDefense = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial states
    phase: "menu",
    levelId: null,
    gold: 100,
    lives: 20,
    towers: [],
    enemies: [],
    projectiles: [],
    currentWave: 0,
    totalWaves: 0,
    waveInProgress: false,
    placementMode: "none",
    selectedTowerType: null,
    
    // Phase management
    setPhase: (phase) => set({ phase }),
    setLevelId: (levelId) => set({ levelId }),
    
    // Resource management
    setGold: (gold) => set({ gold }),
    addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
    spendGold: (amount) => {
      const { gold } = get();
      if (gold >= amount) {
        set({ gold: gold - amount });
        return true;
      }
      return false;
    },
    
    // Lives management
    setLives: (lives) => set({ lives }),
    decreaseLives: (amount) => {
      set((state) => ({ lives: state.lives - amount }));
      useAudio.getState().playHit();
      
      const { lives } = get();
      if (lives <= 0) {
        set({ phase: "gameOver" });
      }
    },
    
    // Tower management
    addTower: (tower) => set((state) => ({ towers: [...state.towers, tower] })),
    removeTower: (id) => set((state) => ({ 
      towers: state.towers.filter(tower => tower.id !== id)
    })),
    upgradeTower: (id) => set((state) => ({ 
      towers: state.towers.map(tower => {
        if (tower.id === id && tower.level < 3) {
          return {
            ...tower,
            level: tower.level + 1,
            damage: tower.damage * 1.5,
            range: tower.range * 1.2,
          };
        }
        return tower;
      })
    })),
    
    // Enemy management
    addEnemy: (enemy) => set((state) => ({ enemies: [...state.enemies, enemy] })),
    removeEnemy: (id) => set((state) => ({ 
      enemies: state.enemies.filter(enemy => enemy.id !== id)
    })),
    damageEnemy: (id, damage) => {
      set((state) => ({ 
        enemies: state.enemies.map(enemy => {
          if (enemy.id === id) {
            const newHealth = enemy.health - damage;
            if (newHealth <= 0) {
              // Enemy defeated, add gold
              get().addGold(enemy.reward);
              useAudio.getState().playSuccess();
              // Return with negative health to mark for removal
              return { ...enemy, health: -1 };
            }
            return { ...enemy, health: newHealth };
          }
          return enemy;
        })
      }));
      
      // Remove any enemies with negative health
      const deadEnemies = get().enemies.filter(enemy => enemy.health <= 0);
      deadEnemies.forEach(enemy => get().removeEnemy(enemy.id));
      
      // Check if we've cleared all enemies and the wave is done
      if (get().enemies.length === 0 && get().waveInProgress) {
        const currentWave = get().currentWave;
        const totalWaves = get().totalWaves;
        
        if (currentWave >= totalWaves) {
          // Player has completed all waves
          set({ phase: "victory" });
        } else {
          // Wave is complete
          get().endWave();
        }
      }
    },
    
    // Projectile management
    addProjectile: (projectile) => set((state) => ({ 
      projectiles: [...state.projectiles, { 
        ...projectile, 
        id: Math.random().toString(36).substring(2, 9) 
      }]
    })),
    removeProjectile: (id) => set((state) => ({ 
      projectiles: state.projectiles.filter(projectile => projectile.id !== id)
    })),
    
    // Wave management
    setWave: (wave) => set({ currentWave: wave }),
    setTotalWaves: (totalWaves) => set({ totalWaves }),
    startWave: () => set({ waveInProgress: true }),
    endWave: () => set((state) => ({ 
      waveInProgress: false,
      currentWave: state.currentWave + 1 
    })),
    
    // Tower placement
    setPlacementMode: (mode) => set({ placementMode: mode }),
    setSelectedTowerType: (type) => set({ selectedTowerType: type }),
    
    // Reset game for a new level
    resetGame: () => set({
      gold: 100,
      lives: 20,
      towers: [],
      enemies: [],
      projectiles: [],
      currentWave: 0,
      waveInProgress: false,
      placementMode: "none",
      selectedTowerType: null
    })
  }))
);
