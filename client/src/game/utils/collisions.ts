import { Vector3, Box3 } from "three";
import { Tower } from "../data/towers";
import { Enemy } from "../data/enemies";
import { LevelConfig } from "../levels/level1";

// Check if a point is inside a box defined by center, width and height
export function isPointInBox(
  point: Vector3,
  center: Vector3,
  width: number,
  height: number
): boolean {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  return (
    point.x >= center.x - halfWidth &&
    point.x <= center.x + halfWidth &&
    point.z >= center.z - halfHeight &&
    point.z <= center.z + halfHeight
  );
}

// Check if a position is valid for tower placement
export function isValidTowerPosition(
  position: Vector3,
  towers: Tower[],
  level: LevelConfig | null,
  minDistance: number = 1.5
): boolean {
  // If level is null, tower placement is invalid
  if (!level) return false;
  // Check if the position is inside any buildable area
  const isInBuildableArea = level.buildableAreas.some(area => 
    isPointInBox(position, area.center, area.width, area.height)
  );
  
  if (!isInBuildableArea) {
    return false;
  }
  
  // Check if the position is too close to the path
  const isTooCloseToPath = level.path.some(pathPoint => {
    const distance = new Vector3().subVectors(position, pathPoint).length();
    return distance < minDistance;
  });
  
  if (isTooCloseToPath) {
    return false;
  }
  
  // Check if the position is too close to other towers
  const isTooCloseToTowers = towers.some(tower => {
    const distance = new Vector3().subVectors(position, tower.position).length();
    return distance < minDistance * 2; // Double the min distance for tower-to-tower
  });
  
  return !isTooCloseToTowers;
}

// Check if a tower can attack an enemy (is in range)
export function canTowerAttackEnemy(tower: Tower, enemy: Enemy): boolean {
  const distance = new Vector3().subVectors(tower.position, enemy.position).length();
  return distance <= tower.range;
}

// Get all enemies in range of a tower
export function getEnemiesInRange(tower: Tower, enemies: Enemy[]): Enemy[] {
  return enemies.filter(enemy => canTowerAttackEnemy(tower, enemy));
}

// Get the closest enemy to the tower
export function getClosestEnemy(tower: Tower, enemies: Enemy[]): Enemy | null {
  const enemiesInRange = getEnemiesInRange(tower, enemies);
  
  if (enemiesInRange.length === 0) {
    return null;
  }
  
  return enemiesInRange.reduce((closest, current) => {
    const closestDistance = new Vector3().subVectors(tower.position, closest.position).length();
    const currentDistance = new Vector3().subVectors(tower.position, current.position).length();
    
    return currentDistance < closestDistance ? current : closest;
  });
}

// Get target enemy based on tower's targeting mode
export function getTargetEnemy(tower: Tower, enemies: Enemy[]): Enemy | null {
  const enemiesInRange = getEnemiesInRange(tower, enemies);
  
  if (enemiesInRange.length === 0) {
    return null;
  }
  
  switch (tower.targetMode) {
    case 'first':
      // Target enemy furthest along the path
      return enemiesInRange.reduce((furthest, current) => 
        current.currentWaypoint > furthest.currentWaypoint ? current : furthest
      );
      
    case 'last':
      // Target enemy least far along the path
      return enemiesInRange.reduce((least, current) => 
        current.currentWaypoint < least.currentWaypoint ? current : least
      );
      
    case 'strongest':
      // Target enemy with most health
      return enemiesInRange.reduce((strongest, current) => 
        current.health > strongest.health ? current : strongest
      );
      
    case 'weakest':
      // Target enemy with least health
      return enemiesInRange.reduce((weakest, current) => 
        current.health < weakest.health ? current : weakest
      );
      
    default:
      // Default to closest
      return getClosestEnemy(tower, enemiesInRange);
  }
}

// Calculate the direction from start to end
export function calculateDirection(start: Vector3, end: Vector3): Vector3 {
  const dir = new Vector3().subVectors(end, start).normalize();
  return dir;
}
