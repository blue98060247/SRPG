export default class Weapon {
  /**
   * @param {object} cfg
   * @param {string} cfg.name
   * @param {number} cfg.range   – attack range (same rule: int=4‑dir, .5=8‑dir)
   * @param {number} cfg.deadZone
   * @param {number} cfg.power
   */
  constructor({ name, range, deadZone = 0, power }) {
    this.name = name;
    this.range = range;
    this.deadZone = deadZone;
    this.power = power;
  }
}