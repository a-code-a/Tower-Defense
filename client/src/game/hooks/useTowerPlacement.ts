import { useEffect, useCallback, useMemo, useState } from "react";
import { Vector3 } from "three";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";
import { TowerType, createTower, TOWER_TEMPLATES } from "../data/towers";
import { isValidTowerPosition } from "../utils/collisions";
import { LevelConfig } from "../levels/level1";
import { toast } from "sonner";
import { Sounds } from "../../lib/sounds";

export function useTowerPlacement(level: LevelConfig | null) {
  const [hoverPosition, setHoverPosition] = useState<Vector3 | null>(null);
  const [isValidPlacement, setIsValidPlacement] = useState<boolean>(false);
  
  const {
    towers,
    placementMode,
    selectedTowerType,
    setPlacementMode,
    setSelectedTowerType,
    addTower,
    spendGold,
    gold,
  } = useTowerDefense();
  
  // Get cost of selected tower
  const selectedTowerCost = useMemo(() => {
    if (!selectedTowerType) return 0;
    return TOWER_TEMPLATES[selectedTowerType as TowerType].cost;
  }, [selectedTowerType]);
  
  // Function to handle selecting a tower type for placement
  const selectTowerForPlacement = useCallback((towerType: TowerType) => {
    const cost = TOWER_TEMPLATES[towerType].cost;
    
    // Check if player has enough gold
    if (gold < cost) {
      toast.error(`Not enough gold! Need ${cost} gold.`);
      return;
    }
    
    setSelectedTowerType(towerType);
    setPlacementMode("placing");
  }, [gold, setSelectedTowerType, setPlacementMode]);
  
  // Function to cancel tower placement
  const cancelPlacement = useCallback(() => {
    setPlacementMode("none");
    setSelectedTowerType(null);
    setHoverPosition(null);
  }, [setPlacementMode, setSelectedTowerType]);
  
  // Function to handle when mouse position changes during placement
  const updatePlacementPosition = useCallback((position: Vector3) => {
    if (placementMode !== "placing" || !selectedTowerType) return;
    
    // Snap to grid (optional)
    const snappedPosition = new Vector3(
      Math.round(position.x),
      0.5, // Fixed height for towers
      Math.round(position.z)
    );
    
    setHoverPosition(snappedPosition);
    
    // Check if position is valid
    const valid = isValidTowerPosition(snappedPosition, towers, level);
    setIsValidPlacement(valid);
  }, [placementMode, selectedTowerType, towers, level]);
  
  // Function to place a tower at the current position
  const placeTower = useCallback(() => {
    if (placementMode !== "placing" || !selectedTowerType || !hoverPosition || !isValidPlacement) {
      return;
    }
    
    // Check if player has enough gold
    const cost = TOWER_TEMPLATES[selectedTowerType as TowerType].cost;
    if (!spendGold(cost)) {
      toast.error(`Not enough gold! Need ${cost} gold.`);
      return;
    }
    
    // Create and add the tower
    const tower = createTower(selectedTowerType as TowerType, hoverPosition);
    addTower(tower);
    
    // Play sound
    Sounds.playSuccess();
    
    // Continue placement mode
    setHoverPosition(null);
  }, [
    placementMode,
    selectedTowerType,
    hoverPosition,
    isValidPlacement,
    spendGold,
    addTower
  ]);
  
  return {
    placementMode,
    selectedTowerType,
    hoverPosition,
    isValidPlacement,
    selectedTowerCost,
    selectTowerForPlacement,
    cancelPlacement,
    updatePlacementPosition,
    placeTower
  };
}
