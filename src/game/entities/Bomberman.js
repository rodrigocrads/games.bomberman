import { collisionMap, CollisionTile } from 'engine/constants/LevelData.js';
import { drawFrameOrigin } from 'engine/context.js';
import { Entity } from 'engine/Entity.js';
import * as control from 'engine/inputHandler.js';
import { animations, BombermanStateType, frames, WALK_SPEED } from 'game/constants/bomberman.js';
import { Control } from 'game/constants/controls.js';
import { CounterDirectionsLookup, Direction, MovementLookup } from 'game/constants/entities.js';
import { FRAME_TIME, HALF_TILE_SIZE, TILE_SIZE } from 'game/constants/game.js';
import { isZero } from 'game/utils/utils.js';

export class Bomberman extends Entity {
  image = document.querySelector('img#bomberman');
  id = 0;
  direction = Direction.DOWN;
  baseSpeedTime = WALK_SPEED;
  speedMultiplier = 1.2;
  animation = animations.moveAnimations[this.direction];

  bombAmount = 5;
  bombStrength = 2;
  availableBombs = this.bombAmount;
  lastBombCell = undefined;

  constructor(position, time, getStageCollisionTileAt, onBombPlaced) {
    super({ x: (position.x * TILE_SIZE) + HALF_TILE_SIZE, y: (position.y * TILE_SIZE) + HALF_TILE_SIZE });

    this.states = {
      [BombermanStateType.IDLE]: {
        type: BombermanStateType.IDLE,
        init: this.handleIdleInit,
        update: this.handleIdleState,
      },
      [BombermanStateType.MOVING]: {
        type: BombermanStateType.MOVING,
        init: this.handleMovingInit,
        update: this.handleMovingState,
      },
      [BombermanStateType.DEATH]: {
        type: BombermanStateType.DEATH,
        init: this.handleDeathInit,
        update: this.handleDeathState,
      }
    };

    this.startPosition = { ...this.position };
    this.onBombPlaced = onBombPlaced;
    this.getStageCollisionTileAt = getStageCollisionTileAt;

    this.changeState(BombermanStateType.IDLE, time);
  }

  getCollisionCoords(direction) {
    switch (direction) {
      case Direction.UP:
        return [
          { row: Math.floor((this.position.y - 9) / TILE_SIZE), column: Math.floor((this.position.x - 8) / TILE_SIZE) },
          { row: Math.floor((this.position.y - 9) / TILE_SIZE), column: Math.floor((this.position.x + 7) / TILE_SIZE) },
        ];
      case Direction.LEFT:
        return [
          { row: Math.floor((this.position.y - 8) / TILE_SIZE), column: Math.floor((this.position.x - 9) / TILE_SIZE) },
          { row: Math.floor((this.position.y + 7) / TILE_SIZE), column: Math.floor((this.position.x - 9) / TILE_SIZE) },
        ];
      case Direction.RIGHT:
        return [
          { row: Math.floor((this.position.y - 8) / TILE_SIZE), column: Math.floor((this.position.x + 8) / TILE_SIZE) },
          { row: Math.floor((this.position.y + 7) / TILE_SIZE), column: Math.floor((this.position.x + 8) / TILE_SIZE) },
        ];
      case Direction.DOWN:
        return [
          { row: Math.floor((this.position.y + 8) / TILE_SIZE), column: Math.floor((this.position.x - 8) / TILE_SIZE) },
          { row: Math.floor((this.position.y + 8) / TILE_SIZE), column: Math.floor((this.position.x + 7) / TILE_SIZE) },
        ];
      default:
    }
  }

  shouldBlockMovement(tileCoords) {
    const tileCoordsMatch = tileCoords[0].column === tileCoords[1].column && tileCoords[0].row === tileCoords[1].row;
    const collisionTiles = [this.getCollisionTile(tileCoords[0]), this.getCollisionTile(tileCoords[1])];

    if ((tileCoordsMatch && collisionTiles[0] >= CollisionTile.WALL)
      || (collisionTiles[0] >= CollisionTile.WALL && collisionTiles[1] >= CollisionTile.WALL)) return true;

    return false;
  }

  performWallCheck(direction) {
    const collisionCoords = this.getCollisionCoords(direction);

    if (this.shouldBlockMovement(collisionCoords)) return [this.direction, { x: 0, y: 0 }];

    const counterDirections = CounterDirectionsLookup[direction];
    if (this.getCollisionTile(collisionCoords[0]) >= CollisionTile.WALL) {
      return [counterDirections[0], { ...MovementLookup[counterDirections[0]] }];
    }
    if (this.getCollisionTile(collisionCoords[1]) >= CollisionTile.WALL) {
      return [counterDirections[1], { ...MovementLookup[counterDirections[1]] }];
    }

    return [direction, { ...MovementLookup[direction] }];
  }

  getMovement() {
    if (control.isLeft(this.id)) {
      return this.performWallCheck(Direction.LEFT);
    } else if (control.isRight(this.id)) {
      return this.performWallCheck(Direction.RIGHT);
    } else if (control.isUp(this.id)) {
      return this.performWallCheck(Direction.UP);
    } else if (control.isDown(this.id)) {
      return this.performWallCheck(Direction.DOWN);
    }

    return [this.direction, { x: 0, y: 0 }];
  };

  changeState(newState, time) {
    this.currentState = this.states[newState];
    this.animationFrame = 0;
    this.currentState.init(time);
    this.animationTimer = time.previous + this.animation[this.animationFrame][1] * FRAME_TIME;
  }

  resetVelocity = () => {
    this.velocity.x = 0;
    this.velocity.y = 0;
  };

  reset(time) {
    this.animationFrame = 0;
    this.direction = Direction.DOWN;
    this.position = { ...this.startPosition };
    this.resetVelocity();
    this.changeState(BombermanStateType.IDLE, time);
  }

  getCollisionTile(cell) {
    if (
      this.lastBombCell && cell.row === this.lastBombCell.row
      && cell.column === this.lastBombCell.column
    ) return CollisionTile.EMPTY;

    return this.getStageCollisionTileAt(cell);
  }

  handleIdleInit = () => {
    this.resetVelocity();
  };

  handleMovingInit = () => {
    this.animationFrame = 1;
  };

  handleDeathInit = () => {
    this.resetVelocity();
    this.animation = animations.deathAnimation;
  }

  handleGeneralState = (time) => {
    const [direction, velocity] = this.getMovement();
    if (control.isControlPressed(this.id, Control.ACTION)) {
      this.handleBombPlacement(time);
    }
    this.animation = animations.moveAnimations[direction];
    this.direction = direction;

    return velocity;
  };

  handleIdleState = (time) => {
    const velocity = this.handleGeneralState(time);
    if (isZero(velocity)) return;
    this.changeState(BombermanStateType.MOVING, time);
  };

  handleMovingState = (time) => {
    this.velocity = this.handleGeneralState(time);
    if (!isZero(this.velocity)) return;
    this.changeState(BombermanStateType.IDLE, time);
  };

  handleDeathState = (time) => {
    if (this.animationFrame >= animations.deathAnimation.length - 1) {
      this.reset(time);
    }
  }

  handleBombPlacement(time) {
    if (this.availableBombs <= 0) return;

    const playerCell = {
      row: Math.floor(this.position.y / TILE_SIZE),
      column: Math.floor(this.position.x / TILE_SIZE),
    };

    if (this.getStageCollisionTileAt(playerCell) !== CollisionTile.EMPTY) return;

    this.availableBombs -= 1;
    this.lastBombCell = playerCell;

    this.onBombPlaced(playerCell, this.bombStrength, time, this.handleBombExploded);
  }

  handleBombExploded = () => {
    if (this.availableBombs < this.bombAmount) {
      this.availableBombs += 1;
    }
  }

  updatePosition(time) {
    this.position.x += (this.velocity.x * this.baseSpeedTime * this.speedMultiplier) * time.secondsPassed;
    this.position.y += (this.velocity.y * this.baseSpeedTime * this.speedMultiplier) * time.secondsPassed;
  }

  updateConstraints() {
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.y < 0) this.position.y = 0;
    if (this.position.x > (collisionMap[0].length - 1) * TILE_SIZE) {
      this.position.x = (collisionMap[0].length - 1) * TILE_SIZE;
    }
    if (this.position.y > (collisionMap.length - 1) * TILE_SIZE) {
      this.position.y = (collisionMap.length - 1) * TILE_SIZE;
    }
  }

  updateAnimation(time) {
    if (time.previous < this.animationTimer || this.currentState.type === BombermanStateType.IDLE) return;
    this.animationFrame += 1;
    if (this.animationFrame >= this.animation.length) {
      this.animationFrame = 0;
    }
    this.animationTimer = time.previous + (this.animation[this.animationFrame][1] * FRAME_TIME);
  }

  checkFlameTileCollision(playerCell, time) {
    if (
      this.getCollisionTile(playerCell) !== CollisionTile.FLAME
      || this.currentState.type === BombermanStateType.DEATH
    ) return;
    this.changeState(BombermanStateType.DEATH, time);
  }

  updateCellUnderneath(time) {
    const playerCell = {
      row: Math.floor(this.position.y / TILE_SIZE),
      column: Math.floor(this.position.x / TILE_SIZE),
    };

    this.resetLastBombCell(playerCell);
    this.checkFlameTileCollision(playerCell, time);
  }

  update(time) {
    this.updatePosition(time);
    this.currentState.update(time);
    this.updateAnimation(time);
    this.updateCellUnderneath(time);
  }

  resetLastBombCell(playerCell) {
    if (!this.lastBombCell) return;

    if (
      (playerCell.row === this.lastBombCell.row && playerCell.column === this.lastBombCell.column)
      && this.getStageCollisionTileAt(this.lastBombCell) === CollisionTile.BOMB
    ) return;

    this.lastBombCell = undefined;
  }

  draw(context, camera) {
    const [frameKey] = this.animation[this.animationFrame];
    const frame = frames.get(frameKey);

    drawFrameOrigin(
      context, this.image, frame,
      Math.floor(this.position.x - camera.position.x),
      Math.floor(this.position.y - camera.position.y),
      [this.direction === Direction.RIGHT ? -1 : 1, 1],
    );
  }
}
