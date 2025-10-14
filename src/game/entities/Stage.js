import {
  STAGE_MAP_MAX_SIZE,
  CollisionTile,
  MapToCollisionTileLookup,
  stageData,
} from 'engine/constants/LevelData.js';
import { drawTile } from 'engine/context.js';
import { Entity } from 'engine/Entity.js';
import { TILE_SIZE } from 'game/constants/game.js';

export class Stage extends Entity {
  tileMap = structuredClone(stageData.tiles);
  collisionMap = stageData.tiles.map(row => row.map(tile => MapToCollisionTileLookup[tile]));

  image = document.querySelector('img#stage');
  stageImage = new OffscreenCanvas(STAGE_MAP_MAX_SIZE, STAGE_MAP_MAX_SIZE);

  constructor() {
    super({ x: 0, y: 0 });

    this.stageImageContext = this.stageImage.getContext('2d');

    this.buildStageMap();
  }

  getCollisionTileAt = (cell) => {
    return this.collisionMap[cell.row][cell.column] ?? CollisionTile.EMPTY;
  };

  buildStageMap() {
    for (let rowIndex = 0; rowIndex < this.tileMap.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.tileMap[rowIndex].length; colIndex++) {
        const tile = this.tileMap[rowIndex][colIndex];
        this.updateMapAt({ row: rowIndex, column: colIndex }, tile);
      }
    }
  }

  updateMapAt = (cell, tile) => {
    this.tileMap[cell.row][cell.column] = tile;
    this.collisionMap[cell.row][cell.column] = MapToCollisionTileLookup[tile];

    drawTile(this.stageImageContext, this.image, tile, cell.column * TILE_SIZE, cell.row * TILE_SIZE, TILE_SIZE);
  }

  update = () => undefined;

  draw(context, camera) {
    context.drawImage(this.stageImage, -camera.position.x, -camera.position.y);
  }
}
