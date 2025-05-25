import { Scene } from 'engine/Scene.js';
import { LevelMap } from 'game/entities/LevelMap.js';

export class BattleScene extends Scene {
  constructor() {
    super();

    this.stage = new LevelMap();
  }

  update(time, context, camera) {
    // Add your main update calls here
  }

  draw(context, camera) {
    this.stage.draw(context, camera);
  }
}
