import { useEffect, useCallback } from "react";
import { useTowerDefense } from "../../lib/stores/useTowerDefense";
import { useNavigate, useParams } from "react-router-dom";
import { startBackgroundMusic, pauseBackgroundMusic } from "../../lib/sounds";
import level1 from "../levels/level1";
import level2 from "../levels/level2";
import level3 from "../levels/level3";
import { LevelConfig } from "../levels/level1";

// This hook manages the overall game state
export function useGameState() {
  const { 
    phase, 
    setPhase, 
    levelId,
    setLevelId,
    resetGame,
    setGold,
    setLives
  } = useTowerDefense();
  
  const navigate = useNavigate();
  const { levelId: levelIdParam } = useParams<{ levelId: string }>();
  
  // Load level data
  const getLevel = useCallback((id: number): LevelConfig | null => {
    switch (id) {
      case 1:
        return level1;
      case 2:
        return level2;
      case 3:
        return level3;
      default:
        return null;
    }
  }, []);
  
  // Initialize the game
  useEffect(() => {
    if (levelIdParam) {
      const parsedLevelId = parseInt(levelIdParam, 10);
      
      // Check if level exists
      const level = getLevel(parsedLevelId);
      if (!level) {
        navigate("/levels");
        return;
      }
      
      // Set level ID and init the game
      setLevelId(parsedLevelId);
      resetGame();
      
      // Set initial resources based on level
      setGold(level.initialGold);
      setLives(20);
      
      // Start the game
      setPhase("playing");
      startBackgroundMusic();
    }
    
    return () => {
      // Clean up when unmounting
      pauseBackgroundMusic();
    };
  }, [levelIdParam, setLevelId, resetGame, setPhase, navigate, getLevel, setGold, setLives]);
  
  // Handle game over and victory conditions
  useEffect(() => {
    if (phase === "gameOver") {
      // Navigate to game over screen
      navigate("/game-over");
    } else if (phase === "victory") {
      // Navigate to victory screen
      navigate("/victory");
    }
  }, [phase, navigate]);
  
  return {
    levelId,
    phase,
    getLevel
  };
}
