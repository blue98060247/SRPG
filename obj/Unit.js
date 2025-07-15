import TileMap from './TileMap.js';
import Weapon from './Weapon.js';
import Faction from './Faction.js';
import Point from "./Point.js";

export default class Unit {
  /**
   * @param {object} cfg
   * @param {number} cfg.x
   * @param {number} cfg.y
   * @param {object} cfg.config
   * @param {number} cfg.hp
   * @param {Faction} cfg.faction
   * @param {Weapon[]} cfg.weapons
   */
  constructor({ x, y, config, hp, faction, weapons = [] }) {
    this.pos = new Point(x, y);
    this.config = config;
    //this.name = this.config.name;
    //this.moveRange = this.config.moveRange;
    //this.power = this.config.power;
    //this.hp_max = this.config.hp_max;
    Object.assign(this, config);
    this.hp = hp ?? this.hp_max;
    this.faction = faction;
    this.weapons = weapons; // array of Weapon
  }

  /**
   * Return the best weapon (max damage) that can hit target from origin.
   * @param {Point} origin – tile we attack from
   * @param {Point} targetPosi
   * @param {TileMap} map
   */
  bestWeaponAgainst(origin, targetPosi, map) {
    const targetKey = targetPosi.toString();
    let best = null;
    for (const w of this.weapons) {
      const atk = map.computeReachable(origin, w.range);
      const dead = map.computeReachable(origin, w.deadZone);
      if (atk.has(targetKey) && !dead.has(targetKey)) {
        if (!best || w.power > best.power) best = w;
      }
    }
    return best;
  }

  atk() {

  }
}