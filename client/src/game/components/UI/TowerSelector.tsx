import { useTowerDefense } from "../../../lib/stores/useTowerDefense";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { TowerType, TOWER_TEMPLATES, TOWER_COLORS } from "../../data/towers";
import { useTowerPlacement } from "../../hooks/useTowerPlacement";
import { toast } from "sonner";
import level1 from "../../levels/level1";
import level2 from "../../levels/level2";
import level3 from "../../levels/level3";

interface TowerSelectorProps {
  className?: string;
}

export default function TowerSelector({ className }: TowerSelectorProps) {
  const { 
    gold,
    placementMode,
    selectedTowerType
  } = useTowerDefense();
  
  // Get level config through the game state
  const levelId = useTowerDefense((state) => state.levelId);
  const level = getLevelById(levelId || 1);
  
  const { 
    selectTowerForPlacement,
    cancelPlacement
  } = useTowerPlacement(level);
  
  // Handle tower selection
  const handleSelectTower = (type: TowerType) => {
    const cost = TOWER_TEMPLATES[type].cost;
    
    if (gold < cost) {
      toast.error(`Not enough gold! Need ${cost} gold.`);
      return;
    }
    
    selectTowerForPlacement(type);
  };
  
  return (
    <Card className={`p-4 ${className || ''}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Select Tower</h3>
        
        {placementMode === "placing" && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={cancelPlacement}
          >
            Cancel
          </Button>
        )}
      </div>
      
      <div className="flex space-x-2">
        {Object.values(TowerType).map((type) => {
          const template = TOWER_TEMPLATES[type];
          const isSelected = selectedTowerType === type;
          const canAfford = gold >= template.cost;
          
          return (
            <Button
              key={type}
              variant={isSelected ? "default" : "outline"}
              className="flex flex-col items-center p-2 h-auto min-w-[80px]"
              disabled={!canAfford}
              onClick={() => handleSelectTower(type)}
              style={{
                borderColor: isSelected ? TOWER_COLORS[type] : undefined,
                backgroundColor: isSelected ? TOWER_COLORS[type] : undefined,
                opacity: canAfford ? 1 : 0.6
              }}
            >
              <div className="w-8 h-8 mb-1 rounded-full" style={{ backgroundColor: TOWER_COLORS[type] }}></div>
              <span className="text-xs font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              <span className="text-xs">{template.cost} gold</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}

// Helper function to get level config by ID
function getLevelById(id: number) {
  switch(id) {
    case 1:
      return level1;
    case 2:
      return level2;
    case 3:
      return level3;
    default:
      return level1;
  }
}
