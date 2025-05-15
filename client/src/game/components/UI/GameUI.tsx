import { useState } from "react";
import { useTowerDefense } from "../../../lib/stores/useTowerDefense";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import TowerSelector from "./TowerSelector";
import ResourceDisplay from "./ResourceDisplay";
import WaveInfo from "./WaveInfo";
import HealthBar from "./HealthBar";
import { LevelConfig } from "../../levels/level1";
import { startBackgroundMusic, pauseBackgroundMusic, Sounds } from "../../../lib/sounds";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface GameUIProps {
  levelConfig: LevelConfig;
  onStartWave: () => void;
  waveInProgress: boolean;
}

export default function GameUI({ levelConfig, onStartWave, waveInProgress }: GameUIProps) {
  const [isPaused, setIsPaused] = useState(false);
  
  const { 
    gold, 
    lives,
    currentWave,
    totalWaves,
    phase,
    setPhase
  } = useTowerDefense();
  
  // Handle pause
  const handlePause = () => {
    if (isPaused) {
      setPhase("playing");
      setIsPaused(false);
      startBackgroundMusic();
    } else {
      setPhase("paused");
      setIsPaused(true);
      pauseBackgroundMusic();
    }
  };
  
  // Handle mute toggle
  const handleMuteToggle = () => {
    Sounds.toggleMute();
    toast.info(Sounds.isMuted() ? "Sound muted" : "Sound enabled");
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top bar with resources and health */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-auto">
        <div className="flex space-x-4">
          <ResourceDisplay gold={gold} />
          <HealthBar lives={lives} />
        </div>
        
        <WaveInfo 
          currentWave={currentWave + 1} 
          totalWaves={totalWaves} 
          levelName={levelConfig.name}
        />
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMuteToggle}
          >
            {Sounds.isMuted() ? "Unmute" : "Mute"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePause}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </div>
      </div>
      
      {/* Tower selector - bottom of screen */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center pointer-events-auto">
        <div className="flex flex-col items-center space-y-4">
          <TowerSelector />
          
          <Button
            disabled={waveInProgress}
            size="lg"
            variant="default"
            onClick={onStartWave}
          >
            {currentWave === 0 ? "Start Game" : 
             currentWave >= totalWaves ? "All Waves Complete!" : 
             `Start Wave ${currentWave + 1}`}
          </Button>
        </div>
      </div>
      
      {/* Pause menu */}
      {isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-auto">
          <Card className="p-6 w-96">
            <h2 className="text-2xl font-bold mb-4 text-center">Game Paused</h2>
            
            <div className="flex flex-col space-y-3">
              <Button onClick={handlePause}>Resume Game</Button>
              <Button variant="outline" onClick={handleMuteToggle}>
                {Sounds.isMuted() ? "Unmute" : "Mute"}
              </Button>
              <Link to="/levels" className="w-full">
                <Button variant="destructive" className="w-full">
                  Quit to Level Select
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
