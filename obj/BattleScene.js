import Weapon from "./Weapon.js";
import Unit from "./Unit.js";
import TileMap from "./TileMap.js";
import Faction from "./Faction.js";
import Point from "./Point.js";

export default class BattleScene {

  static unitTemplates = {};
  static weaponTemplates = {};

  /**
   * @param {object} cfg --BattleScene設定物件
   * @param {string} cfg.id  --此BattleScene的唯一流水號
   * @param {{ x: number, y: number }} cfg.map --地圖初始化參數
   * @param {{ x: number, y: number, id: string, factions: string, weapon: string[] }[]} cfg.units --此場景所使用的單位與其初始化資訊
   * @param {{ id: string, name: string, hostileTo: string[] }[]} cfg.factionsConfig --此場景陣營設定
   * @param {object[]} unitsData --單位原始資訊
   * @param {object[]} weaponsData --武器原始資訊
   * @param {boolean} autoGame --是否由玩家控制player陣營
   */
  constructor(cfg, unitsData, weaponsData, autoGame) {
    this.id = cfg.id;
    if (typeof this.id !== 'string') throw new Error('BattleScene.id must be a string');

    const { x: width, y: height } = cfg.map;
    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new Error('BattleScene.map dimensions must be numbers');
    }
    this.map = new TileMap(width, height);

    this.factions = new Map();
    cfg.factionsConfig.forEach((f, i) => {
      if (typeof f.id !== 'string') throw new Error(`factionsConfig[${i}].id must be string`);
      this.factions.set(
        f.id,
        new Faction({ id: f.id, name: f.name, color: f.color, hostileTo: f.hostileTo })
      );
    });

    this.autoGame = autoGame;

    //this.unitsData = unitsData;
    //this.weaponsData = weaponsData;
    unitsData.forEach(unit=>{
      BattleScene.addUnitTemplate(unit);
    });
    weaponsData.forEach(weapon=>{
      BattleScene.addWeaponTemplate(weapon);
    });

    console.log(BattleScene.unitTemplates);
    console.log(BattleScene.weaponTemplates);

    this.units = cfg.units.map((u, i) => {
      const { x, y, id: tplId, factions: facId, weapon: weapIds } = u;
      if (typeof tplId !== 'string') throw new Error(`units[${i}].id must be string`);
      const faction = this.factions.get(facId);
      if (!faction) throw new Error(`units[${i}] faction '${facId}' not found`);

      const template = BattleScene.unitTemplates[tplId];
      if (!template) throw new Error(`unitTemplates['${tplId}'] not found`);

      const weapons = weapIds.map((wid) => {
        const wCfg = BattleScene.weaponTemplates[wid];
        if (!wCfg) throw new Error(`weaponTemplates['${wid}'] not found`);
        return new Weapon(wCfg);
      });

      return new Unit({
        x,
        y,
        moveRange: template.moveRange,
        hp: u.hp ?? template.hp_max,
        faction,
        weapons,
        config: template
      });
    });

    this.updateUnitRelationships();
  }

  /**
   * 
   * @param {object} cfg 
   * @param {Unit} cfg.targetUnit                                  --顯示指定的對象
   * @param {boolean} cfg.isFactionRelationBasedOnTarget           --若為 true，地圖在顯示陣營關係時會以目標單位 target 作為參考
   * @param {boolean} cfg.showTargetUnitMoveRange                  --是否顯示對象單位的可移動範圍
   * @param {boolean} cfg.showTargetAttackRangeAtCurrentPosition   --是否顯示目標單位原地可攻擊範圍
   * @param {boolean} cfg.showTargetAttackRangesAlongMovementPaths --是否顯示目標單位所有可行進路徑上的可攻擊範圍
   * @param {boolean} cfg.showTargetAllEnemiesAttackRanges         --是否顯示指定目標單位所有敵人的可攻擊範圍
   */
  render(cfg) {
    // map 本身不存 units，交給 Scene 來負責傳入
    this.map.drawBoard(this.units, cfg);
  }

  updateUnitRelationships() {
    const playerFac = this.factions.get('player');
    this.units.forEach(u => {
      if (u.faction === playerFac) {
        u.relationship = 'player';
      } else if (playerFac.isHostile(u.faction)) {
        u.relationship = 'enemy';
      } else {
        u.relationship = 'ally';
      }
    });
  }

  /**
   * Get factions in ordered sequence: primary by faction.order if defined, secondary by insertion order
   * @returns {Faction[]}
   */
  getOrderedFactions() {
    const all = Array.from(this.factions.values());
    const withOrder = all
      .filter(f => typeof f.order === 'number')
      .sort((a, b) => a.order - b.order);
    const withoutOrder = all.filter(f => typeof f.order !== 'number');
    return [...withOrder, ...withoutOrder];
  }

  nextStep() {

  }

  /**
   * 動態新增武器模板
   * @param {{ id:string, name:string, range:number, deadZone:number, power:number }} newCfg
   */
  static addWeaponTemplate(newCfg) {
    BattleScene.weaponTemplates[newCfg.id] = {
      name: newCfg.name,
      range: newCfg.range,
      deadZone: newCfg.deadZone,
      power: newCfg.power
    };
  }

  /**
   * 動態新增單位模板
   * @param {{ id:string, name:string, moveRange:number, hp_max:number, power:number }} newCfg
   */
  static addUnitTemplate(newCfg) {
    BattleScene.unitTemplates[newCfg.id] = {
      name: newCfg.name,
      moveRange: newCfg.moveRange,
      hp_max: newCfg.hp_max,
      power: newCfg.power
    };
  }
}