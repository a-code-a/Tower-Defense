import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useTowerDefense } from "../lib/stores/useTowerDefense";
import { pauseBackgroundMusic } from "../lib/sounds";

export default function GameOver() {
  const { levelId } = useTowerDefense();
  
  useEffect(() => {
    // Pause background music on game over
    pauseBackgroundMusic();
  }, []);
  
  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-gradient-to-b from-red-900 to-red-700"
    >
      <Card className="p-8 w-96 bg-white bg-opacity-90">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-800 mb-2">Game Over</h1>
          <p className="text-gray-600">Your base has been destroyed!</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          {levelId && (
            <Link to={`/game/${levelId}`}>
              <Button className="w-full" variant="default">
                Try Again
              </Button>
            </Link>
          )}
          
          <Link to="/levels">
            <Button className="w-full" variant="outline">
              Select Level
            </Button>
          </Link>
          
          <Link to="/">
            <Button className="w-full" variant="outline">
              Main Menu
            </Button>
          </Link>
          
          <div className="text-center mt-4 text-sm text-gray-500">
            <p>Tip: Build towers early to defend against the first wave</p>
            <p>Tip: Upgrade your towers to deal with stronger enemies</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
