import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useTowerDefense } from "../lib/stores/useTowerDefense";
import level1 from "../game/levels/level1";
import level2 from "../game/levels/level2";
import level3 from "../game/levels/level3";

export default function LevelSelect() {
  const { setPhase } = useTowerDefense();
  
  useEffect(() => {
    // Set game phase to level select
    setPhase("levelSelect");
  }, [setPhase]);
  
  const levels = [level1, level2, level3];
  
  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-blue-700 p-6"
    >
      <Card className="p-6 w-full max-w-3xl bg-white bg-opacity-90">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">Select Level</h1>
          <p className="text-gray-600">Choose a battlefield to defend</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {levels.map((level) => (
            <Link 
              to={`/game/${level.id}`} 
              key={level.id}
              className="block"
            >
              <Card 
                className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-500"
              >
                <div className="p-4 flex flex-col h-full">
                  <h2 className="text-xl font-bold mb-2 text-blue-700">{level.name}</h2>
                  <p className="text-sm text-gray-600 mb-4 flex-grow">{level.description}</p>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Waves:</span>
                      <span className="font-medium">{level.waves.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Starting Gold:</span>
                      <span className="font-medium">{level.initialGold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Difficulty:</span>
                      <span className="font-medium">
                        {level.id === 1 ? "Easy" : level.id === 2 ? "Medium" : "Hard"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="text-center">
          <Link to="/">
            <Button variant="outline">
              Back to Main Menu
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
