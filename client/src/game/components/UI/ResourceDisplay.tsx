import { Card } from "../../../components/ui/card";
import { Coins } from "lucide-react";

interface ResourceDisplayProps {
  gold: number;
}

export default function ResourceDisplay({ gold }: ResourceDisplayProps) {
  return (
    <Card className="bg-yellow-100 border-yellow-400 p-2 flex items-center space-x-2">
      <Coins className="h-5 w-5 text-yellow-600" />
      <span className="font-medium text-yellow-800">{gold}</span>
    </Card>
  );
}
