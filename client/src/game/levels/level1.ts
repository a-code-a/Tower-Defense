import { Vector3 } from "three";
import { EnemyType } from "../data/enemies";

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  terrain: {
    width: number;
    height: number;
    texture: string;
  };
  path: Vector3[];
  startPosition: Vector3;
  basePosition: Vector3;
  waves: WaveConfig[];
  initialGold: number;
  buildableAreas: {
    center: Vector3;
    width: number;
    height: number;
  }[];
}

export interface WaveConfig {
  enemies: {
    type: EnemyType;
    count: number;
    spawnDelay: number; // Delay between each enemy spawn in seconds
  }[];
  waveDelay: number; // Delay before next wave starts in seconds
}

// Level 1 configuration
const level1: LevelConfig = {
  id: 1,
  name: "Green Valley",
  description: "A beginner-friendly level with a simple path",
  terrain: {
    width: 40,
    height: 40,
    texture: "/textures/grass.png"
  },
  startPosition: new Vector3(-15, 0.5, 0),
  basePosition: new Vector3(15, 0.5, 0),
  path: [
    new Vector3(-15, 0.5, 0),
    new Vector3(-5, 0.5, 0),
    new Vector3(-5, 0.5, 5),
    new Vector3(5, 0.5, 5),
    new Vector3(5, 0.5, -5),
    new Vector3(15, 0.5, -5),
    new Vector3(15, 0.5, 0)
  ],
  waves: [
    // Wave 1 - Basic enemies only
    {
      enemies: [
        { type: EnemyType.BASIC, count: 10, spawnDelay: 1.5 }
      ],
      waveDelay: 10
    },
    // Wave 2 - Basic and some Fast enemies
    {
      enemies: [
        { type: EnemyType.BASIC, count: 8, spawnDelay: 1.5 },
        { type: EnemyType.FAST, count: 5, spawnDelay: 1.0 }
      ],
      waveDelay: 15
    },
    // Wave 3 - All types of enemies
    {
      enemies: [
        { type: EnemyType.BASIC, count: 10, spawnDelay: 1.2 },
        { type: EnemyType.FAST, count: 8, spawnDelay: 1.0 },
        { type: EnemyType.TANK, count: 3, spawnDelay: 2.0 }
      ],
      waveDelay: 0 // Last wave
    }
  ],
  initialGold: 120,
  buildableAreas: [
    // Areas beside the path where towers can be built
    { center: new Vector3(-10, 0, -5), width: 10, height: 10 },
    { center: new Vector3(0, 0, 0), width: 10, height: 10 },
    { center: new Vector3(10, 0, 5), width: 10, height: 10 }
  ]
};

export default level1;
