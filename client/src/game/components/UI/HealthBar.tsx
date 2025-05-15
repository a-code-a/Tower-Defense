import { Card } from "../../../components/ui/card";
import { Heart } from "lucide-react";

interface HealthBarProps {
  lives: number;
}

export default function HealthBar({ lives }: HealthBarProps) {
  // Calculate health percentage and color
  const healthPercent = (lives / 20) * 100; // Assuming max lives is 20
  const healthColor = healthPercent > 60 
    ? 'bg-green-500' 
    : healthPercent > 30 
      ? 'bg-yellow-500' 
      : 'bg-red-500';
  
  return (
    <Card className="bg-red-100 border-red-400 p-2 flex items-center space-x-2">
      <Heart className="h-5 w-5 text-red-600" />
      <div className="w-24 flex flex-col">
        <span className="font-medium text-red-800">{lives} Lives</span>
        <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
          <div 
            className={`h-full ${healthColor} rounded-full`}
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
