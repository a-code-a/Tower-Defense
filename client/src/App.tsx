import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { Toaster } from "sonner";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import MainMenu from "./pages/MainMenu";
import LevelSelect from "./pages/LevelSelect";
import GamePage from "./pages/GamePage";
import GameOver from "./pages/GameOver";
import VictoryScreen from "./pages/VictoryScreen";
import NotFound from "./pages/not-found";

function App() {
  // Initialize audio elements
  useEffect(() => {
    const backgroundMusic = new Audio("/sounds/background.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;

    const hitSound = new Audio("/sounds/hit.mp3");
    const successSound = new Audio("/sounds/success.mp3");

    const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio.getState();
    setBackgroundMusic(backgroundMusic);
    setHitSound(hitSound);
    setSuccessSound(successSound);

    // Preload all sounds
    backgroundMusic.load();
    hitSound.load();
    successSound.load();

    return () => {
      // Clean up audio on unmount
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    };
  }, []);

  return (
    <>
      <Router>
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/levels" element={<LevelSelect />} />
            <Route path="/game/:levelId" element={<GamePage />} />
            <Route path="/game-over" element={<GameOver />} />
            <Route path="/victory" element={<VictoryScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster position="top-right" closeButton />
    </>
  );
}

export default App;
