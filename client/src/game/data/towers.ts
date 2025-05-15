import { Vector3 } from "three";

export interface Tower {
  id: string;
  type: TowerType;
  position: Vector3;
  rotation: number;
  damage: number;
  range: number;
  attackSpeed: number; // attacks per second
  lastAttackTime: number;
  level: number;
  cost: number;
  upgradeCost: number;
  targetMode: 'first' | 'last' | 'strongest' | 'weakest';
}

export enum TowerType {
  CANNON = "cannon",     // High damage, slow attack speed, splash damage
  LASER = "laser",       // Medium damage, fast attack speed, single target
  SNIPER = "sniper"      // Very high damage, very slow attack speed, long range
}

// Tower templates
export const TOWER_TEMPLATES: Record<TowerType, Omit<Tower, 'id' | 'position' | 'rotation' | 'lastAttackTime'>> = {
  [TowerType.CANNON]: {
    type: TowerType.CANNON,
    damage: 20,
    range: 7,
    attackSpeed: 0.8,
    level: 1,
    cost: 50,
    upgradeCost: 75,
    targetMode: 'first'
  },
  [TowerType.LASER]: {
    type: TowerType.LASER,
    damage: 8,
    range: 5,
    attackSpeed: 2.0,
    level: 1,
    cost: 40,
    upgradeCost: 60,
    targetMode: 'first'
  },
  [TowerType.SNIPER]: {
    type: TowerType.SNIPER,
    damage: 50,
    range: 12,
    attackSpeed: 0.3,
    level: 1,
    cost: 75,
    upgradeCost: 100,
    targetMode: 'strongest'
  }
};

// Create a new tower
export function createTower(type: TowerType, position: Vector3): Tower {
  const template = TOWER_TEMPLATES[type];
  return {
    ...template,
    id: Math.random().toString(36).substring(2, 9),
    position: position.clone(),
    rotation: 0,
    lastAttackTime: 0
  };
}

// Get tower upgrade cost based on level
export function getUpgradeCost(tower: Tower): number {
  return Math.floor(tower.upgradeCost * Math.pow(1.5, tower.level - 1));
}

// Tower color mapping for visualization
export const TOWER_COLORS = {
  [TowerType.CANNON]: "#e74c3c", // Red
  [TowerType.LASER]: "#3498db",  // Blue
  [TowerType.SNIPER]: "#2ecc71"  // Green
};
