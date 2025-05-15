import { useAudio } from "./stores/useAudio";

// Play sound effects
export const Sounds = {
  playHit: () => {
    useAudio.getState().playHit();
  },
  playSuccess: () => {
    useAudio.getState().playSuccess();
  },
  toggleMute: () => {
    useAudio.getState().toggleMute();
  },
  isMuted: () => {
    return useAudio.getState().isMuted;
  }
};

// Start background music
export const startBackgroundMusic = () => {
  const { backgroundMusic, isMuted } = useAudio.getState();
  if (backgroundMusic && !isMuted) {
    backgroundMusic.play().catch(err => {
      console.log("Error playing background music:", err);
    });
  }
};

// Pause background music
export const pauseBackgroundMusic = () => {
  const { backgroundMusic } = useAudio.getState();
  if (backgroundMusic) {
    backgroundMusic.pause();
  }
};
