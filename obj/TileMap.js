import chalk from 'chalk';

import Point from './Point.js';

const relationshipIcon = {
  'player'  : 'P',
  'target'  : 'T',
  'enemy'   : 'E',
  'ally'    : 'A',
  'friendly': 'F',
}

export default class TileMap {

  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.ORTHO = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];
    this.DIAG = [
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: -1 }
    ];
  }
  inBounds(p) {
    return p.x >= 0 && p.x < this.width && p.y >= 0 && p.y < this.height;
  }
  /**
   * @param {Point|string} start
   * @param {Number} range
   * @param {Set<string>} range
   */
  computeReachable(start, range, blocked = new Set()) {
    if(typeof start === 'string') start = new Point(start);
    const allowDiag = range % 1 !== 0;
    const maxSteps = Math.floor(range);
    const dirs = allowDiag ? [...this.ORTHO, ...this.DIAG] : this.ORTHO;

    const visited = new Set([start.toString()]);
    const queue = [{ p: start, d: 0 }];

    while (queue.length) {
      const { p, d } = queue.shift();
      if (d >= maxSteps) continue;
      for (const { dx, dy } of dirs) {
        const n = new Point(p.x + dx, p.y + dy);
        const key = n.toString();
        if (this.inBounds(n) && !visited.has(key) && !blocked.has(key)) {
          visited.add(key);
          queue.push({ p: n, d: d + 1 });
        }
      }
    }
    return visited; // Set<string>
  }
  /**
   * 
   * @param {Unit} targetUnit                                  --顯示指定的對象，若為空，則以player陣營的第一個單位為target
   * @param {boolean} isFactionRelationBasedOnTarget           --若為 true，地圖在顯示陣營關係時會以目標單位 target 作為參考
   * @param {boolean} showTargetUnitMoveRange                  --是否顯示對象單位的可移動範圍
   * @param {boolean} showTargetAttackRangeAtCurrentPosition   --是否顯示目標單位原地可攻擊範圍
   * @param {boolean} showTargetAttackRangesAlongMovementPaths --是否顯示目標單位所有可行進路徑上的可攻擊範圍
   * @param {boolean} showTargetAllEnemiesAttackRanges         --是否顯示指定目標單位所有敵人的可攻擊範圍
   */
  drawBoard = (units, {
    targetUnit = null,
    isFactionRelationBasedOnTarget = false,
    showTargetUnitMoveRange = false,
    showTargetAttackRangeAtCurrentPosition = false,
    showTargetAttackRangesAlongMovementPaths = false,
    showTargetAllEnemiesAttackRanges = false,
  }) => {
    // 1. 初始化空格子
    const g = Array.from({ length: this.height }, () => Array(this.width).fill('.'));

    // 2. 決定目標物件
    const target =
      targetUnit && units.includes(targetUnit)
        ? targetUnit
        : units.find((u) => u.faction.id === 'player');

    // 3-1. 計算目標移動範圍 --showTargetUnitMoveRange
    const moveRangeSet = new Set();
    if (showTargetUnitMoveRange && target) {
      const enemies = units.filter((u) => target.faction.isHostile(u.faction) && u.hp > 0);
      const blockedEnemy = new Set(enemies.map((e) => e.pos.toString()));
      this.computeReachable(target.pos, target.moveRange, blockedEnemy).forEach((k) => {
        moveRangeSet.add(k);
      });
    }

    // 3-2. 計算原地攻擊範圍 --showTargetAttackRangeAtCurrentPosition
    const currentPosiAtkRangeSet = new Set();
    if (showTargetAttackRangeAtCurrentPosition && target) {
      let targetWeaponsList = target.weapons;
      for(let weapon of targetWeaponsList){
        const atk = this.computeReachable(target.pos, weapon.range);
        const dead = this.computeReachable(target.pos, weapon.deadZone);
        atk.forEach((aKey) => {
          if (!dead.has(aKey)) currentPosiAtkRangeSet.add(aKey);
        });
      }
    }

    // 3-3. 計算所有攻擊範圍 --showTargetAttackRangesAlongMovementPaths
    const allAtkRangeSet = new Set();
    if (showTargetAttackRangesAlongMovementPaths && target) {
      let moveableRangeSet = new Set();
      if(moveableRangeSet.size === 0) {
        const enemies = units.filter((u) => target.faction.isHostile(u.faction) && u.hp > 0);
        const blockedEnemy = new Set(enemies.map((e) => e.pos.toString()));
        this.computeReachable(target.pos, target.moveRange, blockedEnemy).forEach((k) => {
          moveableRangeSet.add(k);
        });
      }
      else moveableRangeSet = moveRangeSet;

      for(let moveablePosi of moveableRangeSet){
        let targetWeaponsList = target.weapons;
        for(let weapon of targetWeaponsList){
          const atk = this.computeReachable(moveablePosi, weapon.range);
          const dead = this.computeReachable(moveablePosi, weapon.deadZone);
          atk.forEach((aKey) => {
            if (!dead.has(aKey)) allAtkRangeSet.add(aKey);
          });
        }
      }
    }

    // 3-4. 計算所有敵對勢力的可攻擊範圍
    const allEnemiesAtkableRangeSet = new Set();
    if (showTargetAllEnemiesAttackRanges && target){
      // 先求得所有敵人
      const enemies = units.filter((u) => target.faction.isHostile(u.faction) && u.hp > 0);
      let factionsHostileDict = {};
      for(let enemy of enemies){
        // 求得一敵人的所有可行動路徑
        // 確認該敵人所屬陣營之敵對單位陣列是否存在，若不存在則創建
        let faction = factionsHostileDict[enemy.faction.id];
        if(!faction){
          const hostileUnits = units.filter((u) => enemy.faction.isHostile(u.faction) && u.hp > 0);
          const hostileUnitsPosiSet = new Set(hostileUnits.map((u) => u.pos.toString()));
          faction = {
            ...enemy.faction,
            hostileUnits,
            hostileUnitsPosiSet,
          };
          factionsHostileDict[faction.id] = faction;
        }

        let blocked = faction.hostileUnitsPosiSet;
        let moveableRangeSet = new Set();
        this.computeReachable(enemy.pos, enemy.moveRange, blocked).forEach((k) => {
          moveableRangeSet.add(k);
        });
        let targetWeaponsList = enemy.weapons;
        for(let moveablePosi of moveableRangeSet){
          for(let weapon of targetWeaponsList){
            const atk = this.computeReachable(moveablePosi, weapon.range);
            const dead = this.computeReachable(moveablePosi, weapon.deadZone);
            atk.forEach((aKey) => {
              if (!dead.has(aKey)) allEnemiesAtkableRangeSet.add(aKey);
            });
          }
        }
      }
    }

    // 4. 填入代表陣營/關係圖示
    //units.forEach((u) => {
    //  if (u.hp > 0) g[u.pos.y][u.pos.x] = relationshipIcon[u.relationship];
    //});
    
    units.forEach((u) => {
      if (u.hp <= 0) return;
      let rel;
      if (isFactionRelationBasedOnTarget && target) {
        if (u.id === target.id) rel = 'target';
        else if (u.faction.id === target.faction.id) rel = 'friendly';
        else if (target.faction.isHostile(u.faction)) rel = 'enemy';
        else rel = 'ally';
      } else {
        rel = u.relationship;
      }
      g[u.pos.y][u.pos.x] = relationshipIcon[rel];
    });

    // 5. 繪製並套色
    for (let y = 0; y < this.height; y++) {
      let line = '';
      for (let x = 0; x < this.width; x++) {
        const key = `${x},${y}`;
        const cell = g[y][x];
        const unit = units.find(u => u.hp > 0 && u.pos.x === x && u.pos.y === y);
        
        let style = chalk;
        // 在地上顯示所需的格子資訊
        // 格子資訊可能包含 目標移動範圍/原地攻擊範圍/所有攻擊範圍/敵對勢力的可攻擊範圍
        // 原地攻擊範圍 不考慮範圍內是否包含單位 其優先於全部
        if (showTargetAttackRangeAtCurrentPosition && currentPosiAtkRangeSet.has(key)) {
          style = style.bgRed;
        }
        // 目標移動範圍 僅在空地上顯示 其僅次於原地攻擊範圍
        else if (!unit && showTargetUnitMoveRange && moveRangeSet.has(key)) {
          style = style.bgBlue;
        }
        // 所有攻擊範圍 不考慮範圍內是否包含單位 劣於目標移動範圍
        else if (showTargetAttackRangesAlongMovementPaths && allAtkRangeSet.has(key)) {
          style = style.bgRed;
          //line += chalk.bgRed(cell) + ' ';
        }
        // 敵對勢力的可攻擊範圍 不考慮範圍內是否包含單位 所有攻擊範圍
        else if (showTargetAllEnemiesAttackRanges && allEnemiesAtkableRangeSet.has(key)) {
          style = style.bgRedBright;
          //line += chalk.bgRed(cell) + ' ';
        }
        

        if (unit) {
          const color = unit.faction.color;  // 例如 'red' 或 '#ff00ff'
          // 1) 如果 chalk 有這個顏色的方法，就直接用
          // 2) 否則，如果是 #hex，就用 chalk.hex
          // 3) 最後 fallback 成白色
          if (typeof chalk[color] === 'function') {
            style = style[color];
          } else if (/^#?[0-9A-Fa-f]{6}$/.test(color)) {
            // 支援 '#rrggbb' 或 'rrggbb'
            style = style.hex(color.startsWith('#') ? color : `#${color}`);
          } else {
            style = style.white;
          }
        }
        line += style(cell) + ' ';
      }
      console.log(line);
    }
  }
}