import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useTowerDefense } from "../lib/stores/useTowerDefense";
import { startBackgroundMusic, Sounds } from "../lib/sounds";

export default function MainMenu() {
  const { setPhase } = useTowerDefense();
  
  useEffect(() => {
    // Reset game state when returning to main menu
    setPhase("menu");
    // Start background music
    startBackgroundMusic();
  }, [setPhase]);
  
  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-700"
    >
      <Card className="p-8 w-96 bg-white bg-opacity-90">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">3D Tower Defense</h1>
          <p className="text-gray-600">Defend your base against waves of enemies!</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Link to="/levels">
            <Button className="w-full text-lg py-6" size="lg">
              Play Game
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => Sounds.toggleMute()}
          >
            {Sounds.isMuted() ? "Unmute" : "Mute"} Sound
          </Button>
          
          <div className="text-center mt-4 text-sm text-gray-500">
            <p>Use the mouse to place towers</p>
            <p>Defend your base from enemy waves</p>
            <p>Build stronger towers to face tougher enemies</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
