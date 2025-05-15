import { Card } from "../../../components/ui/card";
import { Flag } from "lucide-react";

interface WaveInfoProps {
  currentWave: number;
  totalWaves: number;
  levelName: string;
}

export default function WaveInfo({ currentWave, totalWaves, levelName }: WaveInfoProps) {
  return (
    <Card className="bg-blue-100 border-blue-400 p-2 flex items-center space-x-2">
      <Flag className="h-5 w-5 text-blue-600" />
      <div className="flex flex-col">
        <span className="font-medium text-blue-800">
          Wave {currentWave}/{totalWaves}
        </span>
        <span className="text-xs text-blue-600">{levelName}</span>
      </div>
    </Card>
  );
}
