import { Vector3 } from "three";

export interface Enemy {
  id: string;
  type: EnemyType;
  position: Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;  // Damage to player base if enemy reaches the end
  reward: number;  // Gold reward when killed
  currentWaypoint: number;
  size: number;
}

export enum EnemyType {
  BASIC = "basic",       // Standard enemy
  FAST = "fast",         // Fast but weak enemy
  TANK = "tank"          // Slow but strong enemy
}

// Enemy templates
export const ENEMY_TEMPLATES: Record<EnemyType, Omit<Enemy, 'id' | 'position' | 'currentWaypoint'>> = {
  [EnemyType.BASIC]: {
    type: EnemyType.BASIC,
    health: 100,
    maxHealth: 100,
    speed: 1.0,
    damage: 1,
    reward: 10,
    size: 1.0
  },
  [EnemyType.FAST]: {
    type: EnemyType.FAST,
    health: 50,
    maxHealth: 50,
    speed: 2.0,
    damage: 1,
    reward: 15,
    size: 0.8
  },
  [EnemyType.TANK]: {
    type: EnemyType.TANK,
    health: 300,
    maxHealth: 300,
    speed: 0.6,
    damage: 2,
    reward: 25,
    size: 1.3
  }
};

// Create a new enemy
export function createEnemy(type: EnemyType, position: Vector3, waveMultiplier: number = 1): Enemy {
  const template = ENEMY_TEMPLATES[type];
  
  // Scale health based on wave number
  const scaledHealth = Math.floor(template.health * waveMultiplier);
  
  return {
    ...template,
    id: Math.random().toString(36).substring(2, 9),
    position: position.clone(),
    currentWaypoint: 0,
    health: scaledHealth,
    maxHealth: scaledHealth
  };
}

// Enemy color mapping for visualization
export const ENEMY_COLORS = {
  [EnemyType.BASIC]: "#f39c12", // Orange
  [EnemyType.FAST]: "#9b59b6",  // Purple
  [EnemyType.TANK]: "#7f8c8d"   // Gray
};
