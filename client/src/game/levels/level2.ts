import { Vector3 } from "three";
import { EnemyType } from "../data/enemies";
import { LevelConfig, WaveConfig } from "./level1";

// Level 2 configuration
const level2: LevelConfig = {
  id: 2,
  name: "Desert Outpost",
  description: "A more challenging level with a winding path",
  terrain: {
    width: 40,
    height: 40,
    texture: "/textures/sand.jpg"
  },
  startPosition: new Vector3(-15, 0.5, -15),
  basePosition: new Vector3(15, 0.5, 15),
  path: [
    new Vector3(-15, 0.5, -15), // Start
    new Vector3(-15, 0.5, 0),
    new Vector3(-5, 0.5, 0),
    new Vector3(-5, 0.5, 10),
    new Vector3(5, 0.5, 10),
    new Vector3(5, 0.5, -5),
    new Vector3(15, 0.5, -5),
    new Vector3(15, 0.5, 15)    // End
  ],
  waves: [
    // Wave 1
    {
      enemies: [
        { type: EnemyType.BASIC, count: 12, spawnDelay: 1.2 },
        { type: EnemyType.FAST, count: 5, spawnDelay: 1.0 }
      ],
      waveDelay: 10
    },
    // Wave 2
    {
      enemies: [
        { type: EnemyType.BASIC, count: 10, spawnDelay: 1.0 },
        { type: EnemyType.FAST, count: 8, spawnDelay: 0.8 },
        { type: EnemyType.TANK, count: 4, spawnDelay: 2.0 }
      ],
      waveDelay: 15
    },
    // Wave 3
    {
      enemies: [
        { type: EnemyType.BASIC, count: 15, spawnDelay: 0.8 },
        { type: EnemyType.FAST, count: 10, spawnDelay: 0.6 },
        { type: EnemyType.TANK, count: 5, spawnDelay: 1.5 }
      ],
      waveDelay: 15
    },
    // Wave 4
    {
      enemies: [
        { type: EnemyType.BASIC, count: 20, spawnDelay: 0.7 },
        { type: EnemyType.FAST, count: 15, spawnDelay: 0.5 },
        { type: EnemyType.TANK, count: 8, spawnDelay: 1.2 }
      ],
      waveDelay: 0 // Last wave
    }
  ],
  initialGold: 150,
  buildableAreas: [
    { center: new Vector3(-10, 0, -7), width: 10, height: 10 },
    { center: new Vector3(0, 0, 5), width: 15, height: 10 },
    { center: new Vector3(10, 0, -10), width: 12, height: 12 },
    { center: new Vector3(10, 0, 7), width: 8, height: 15 }
  ]
};

export default level2;
