import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useTowerDefense } from "../lib/stores/useTowerDefense";
import { startBackgroundMusic } from "../lib/sounds";

export default function VictoryScreen() {
  const { levelId } = useTowerDefense();
  
  useEffect(() => {
    // Start victory music
    startBackgroundMusic();
  }, []);
  
  // Check if there's a next level
  const nextLevelId = levelId && levelId < 3 ? levelId + 1 : null;
  
  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-gradient-to-b from-green-900 to-green-700"
    >
      <Card className="p-8 w-96 bg-white bg-opacity-90">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Victory!</h1>
          <p className="text-gray-600">You've successfully defended your base!</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          {nextLevelId && (
            <Link to={`/game/${nextLevelId}`}>
              <Button className="w-full" variant="default">
                Next Level
              </Button>
            </Link>
          )}
          
          <Link to="/levels">
            <Button className="w-full" variant="outline">
              Level Select
            </Button>
          </Link>
          
          <Link to="/">
            <Button className="w-full" variant="outline">
              Main Menu
            </Button>
          </Link>
          
          <div className="text-center mt-4 text-sm text-gray-500">
            <p>Great job defending your base!</p>
            <p>Try a more challenging level or improve your strategy</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
