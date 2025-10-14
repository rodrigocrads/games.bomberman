import { Scene } from 'engine/Scene.js';
import { HALF_TILE_SIZE, STAGE_OFFSET_Y } from 'game/constants/game.js';
import { BattleHud } from 'game/entities/BattleHud.js';
import { Bomberman } from 'game/entities/Bomberman.js';
import { Stage } from 'game/entities/Stage.js';
import { BlockSystem } from 'game/systems/BlockSystem.js';
import { BombSystem } from 'game/systems/BombSystem.js';

export class BattleScene extends Scene {
  constructor(time, camera) {
    super();

    this.stage = new Stage();
    this.hud = new BattleHud();
    this.blockSystem = new BlockSystem(this.stage.updateMapAt, this.stage.getCollisionTileAt);
    this.bombSystem = new BombSystem(this.stage.collisionMap, this.blockSystem.add);
    this.player = new Bomberman(
      { x: 2, y: 1 },
      time,
      this.stage.getCollisionTileAt,
      this.bombSystem.add,
    );

    camera.position = { x: HALF_TILE_SIZE, y: -STAGE_OFFSET_Y };
  }

  update(time) {
    this.blockSystem.update(time);
    this.bombSystem.update(time);
    this.player.update(time);
  }

  draw(context, camera) {
    this.stage.draw(context, camera);
    this.hud.draw(context);
    this.blockSystem.draw(context, camera);
    this.bombSystem.draw(context, camera);
    this.player.draw(context, camera);
  }
}
