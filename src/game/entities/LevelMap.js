import { STAGE_MAP_MAX_SIZE, tileMap } from 'engine/constants/LevelData.js';
import { drawTile } from 'engine/context.js';
import { Scene } from 'engine/Scene.js';
import { TILE_SIZE } from 'game/constants/game.js';

export class LevelMap extends Scene {
  image = document.querySelector('img#stage');
  stageImage = new OffscreenCanvas(STAGE_MAP_MAX_SIZE, STAGE_MAP_MAX_SIZE);
  tileMap = [...tileMap];
  stageImageContext = this.stageImage.getContext('2d');

  constructor() {
    super({ x: 0, y: 0 });

    this.buildStage();
  }

  buildStage() {
    for (let rowIndex = 0; rowIndex < this.tileMap.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.tileMap[rowIndex].length; colIndex++) {
        const tile = this.tileMap[rowIndex][colIndex];
        this.updateStageImageAt(colIndex, rowIndex, tile);
      }
    }
  }

  updateStageImageAt(colIndex, rowIndex, tile) {
    drawTile(this.stageImageContext, this.image, tile, colIndex * TILE_SIZE, rowIndex * TILE_SIZE, TILE_SIZE);
  }

  update = () => undefined;

  draw(context, camera) {
    // Add your main draw calls here
    context.drawImage(this.stageImage, -camera.position.x, -camera.position.y);
  }
}
