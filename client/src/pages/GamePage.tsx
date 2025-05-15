import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Game from "../game/Game";
import { useTowerDefense } from "../lib/stores/useTowerDefense";
import { useNavigate } from "react-router-dom";

export default function GamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { phase } = useTowerDefense();
  const navigate = useNavigate();
  
  // Redirect if no level ID or invalid format
  useEffect(() => {
    if (!levelId || isNaN(parseInt(levelId))) {
      navigate("/levels");
    }
  }, [levelId, navigate]);
  
  // Handle game phase changes (handled in useGameState hook inside Game component)
  
  return (
    <div className="w-full h-full">
      <Game />
    </div>
  );
}
