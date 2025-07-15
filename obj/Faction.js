export default class Faction {
  /**
   * @param {object} cfg
   * @param {string} cfg.id        – unique faction identifier
   * @param {string} cfg.name      – display name
   * @param {string} cfg.color     – display color
   * @param {string[]} cfg.hostileTo – array of other faction ids this faction is hostile to
   */
  constructor({ id, name, color, hostileTo = [] }) {
    this.id = id;
    this.name = name;
    this.hostileTo = new Set(hostileTo);
    this.color = color;
  }

  /**
   * Check if this faction is hostile to another
   * @param {Faction} other
   * @returns {boolean}
   */
  isHostile(other) {
    return this.hostileTo.has(other.id);
  }
}