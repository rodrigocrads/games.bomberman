import {
  collisionMap,
  CollisionTile,
  MapTile,
  MapToCollisionTileLookup,
  MAX_BLOCKS,
  playersStartCoords,
  STAGE_MAP_MAX_SIZE,
  tileMap
} from 'engine/constants/LevelData.js';
import { drawTile } from 'engine/context.js';
import { Entity } from 'engine/Entity.js';
import { TILE_SIZE } from 'game/constants/game.js';

export class Stage extends Entity {
  tileMap = [...tileMap];
  collisionMap = [...collisionMap];

  image = document.querySelector('img#stage');
  stageImage = new OffscreenCanvas(STAGE_MAP_MAX_SIZE, STAGE_MAP_MAX_SIZE);
  stageImageContext = this.stageImage.getContext('2d');

  constructor() {
    super({ x: 0, y: 0 });

    this.buildStage();
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

  addBlockTileAt(cell) {
    const isStartZone = playersStartCoords.some(([startRow, startCol]) => {
      return startRow === cell.row && startCol === cell.column;
    });

    if (isStartZone || this.collisionMap[cell.row][cell.column] !== CollisionTile.EMPTY) return false;

    this.updateMapAt(cell, MapTile.BLOCK);

    return true;
  }

  addBlocks() {
    const blocks = [];
    while (blocks.length < MAX_BLOCKS) {
      const cell = {
        row: 1 + Math.floor(Math.random() * (this.tileMap.length - 3)),
        column: 2 + Math.floor(Math.random() * (this.tileMap[0].length - 4)),
      };
      if (this.addBlockTileAt(cell)) blocks.push(cell);
    }
  }

  buildStage() {
    this.buildStageMap();
    this.addBlocks();
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
