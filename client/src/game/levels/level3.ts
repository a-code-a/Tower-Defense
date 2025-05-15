import { Vector3 } from "three";
import { EnemyType } from "../data/enemies";
import { LevelConfig, WaveConfig } from "./level1";

// Level 3 configuration
const level3: LevelConfig = {
  id: 3,
  name: "Urban Battlefield",
  description: "A complex level with multiple paths",
  terrain: {
    width: 50,
    height: 50,
    texture: "/textures/asphalt.png"
  },
  startPosition: new Vector3(-20, 0.5, 0),
  basePosition: new Vector3(20, 0.5, 0),
  path: [
    new Vector3(-20, 0.5, 0),   // Start
    new Vector3(-10, 0.5, 0),
    new Vector3(-10, 0.5, 10),
    new Vector3(0, 0.5, 10),
    new Vector3(0, 0.5, -10),
    new Vector3(10, 0.5, -10),
    new Vector3(10, 0.5, 5),
    new Vector3(20, 0.5, 5),
    new Vector3(20, 0.5, 0)     // End
  ],
  waves: [
    // Wave 1
    {
      enemies: [
        { type: EnemyType.BASIC, count: 15, spawnDelay: 1.0 },
        { type: EnemyType.FAST, count: 8, spawnDelay: 0.8 }
      ],
      waveDelay: 10
    },
    // Wave 2
    {
      enemies: [
        { type: EnemyType.BASIC, count: 12, spawnDelay: 0.9 },
        { type: EnemyType.FAST, count: 10, spawnDelay: 0.7 },
        { type: EnemyType.TANK, count: 5, spawnDelay: 1.8 }
      ],
      waveDelay: 12
    },
    // Wave 3
    {
      enemies: [
        { type: EnemyType.BASIC, count: 18, spawnDelay: 0.8 },
        { type: EnemyType.FAST, count: 12, spawnDelay: 0.6 },
        { type: EnemyType.TANK, count: 8, spawnDelay: 1.5 }
      ],
      waveDelay: 15
    },
    // Wave 4
    {
      enemies: [
        { type: EnemyType.BASIC, count: 20, spawnDelay: 0.7 },
        { type: EnemyType.FAST, count: 15, spawnDelay: 0.5 },
        { type: EnemyType.TANK, count: 10, spawnDelay: 1.3 }
      ],
      waveDelay: 15
    },
    // Wave 5 (Boss wave)
    {
      enemies: [
        { type: EnemyType.BASIC, count: 10, spawnDelay: 0.5 },
        { type: EnemyType.FAST, count: 10, spawnDelay: 0.4 },
        { type: EnemyType.TANK, count: 15, spawnDelay: 1.0 }
      ],
      waveDelay: 0 // Last wave
    }
  ],
  initialGold: 200,
  buildableAreas: [
    { center: new Vector3(-15, 0, -8), width: 10, height: 15 },
    { center: new Vector3(-5, 0, 0), width: 10, height: 10 },
    { center: new Vector3(5, 0, 5), width: 15, height: 15 },
    { center: new Vector3(15, 0, -5), width: 10, height: 10 },
    { center: new Vector3(0, 0, -5), width: 8, height: 8 }
  ]
};

export default level3;
