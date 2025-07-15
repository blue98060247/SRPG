import readJsonFiles from './utils/readJsonList.js';
import BattleScene from './obj/BattleScene.js';
import Weapon from './obj/Weapon.js';
import Unit from './obj/Unit.js';

// 2. 預設場景編號
let sceneIndex = 0;

// 取得所有參數，從 index 2 開始才是 user 自己帶的
const args = process.argv.slice(2);

// 範例：支援 --ai 或 -a 開啟 AI 模式
const aiMode = args.includes('--ai') || args.includes('-a');

// 3. 逐一檢查，看有沒有 --scene=... 這個參數
args.forEach(arg => {
  if (arg.startsWith('--scene=')) {
    const val = arg.split('=')[1];
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      sceneIndex = num;
    } else {
      console.warn(`警告：無效的 scene 值 "${val}"，將使用預設 ${sceneIndex}`);
    }
  }
});

console.log(`AI 模式：${aiMode}`);

function loadBattleScenes(){
  let battleScenes = readJsonFiles('./data/battlescene');
  return battleScenes;
}

function loadUnits(){
  let units = readJsonFiles('./data/unit');
  return units;
}

function loadWeapons(){
  let weapons = readJsonFiles('./data/weapon');
  return weapons;
}

const units = loadUnits();
const weapons = loadWeapons();
const battleSences = loadBattleScenes();

//console.log(units);
//console.log(weapons);
//console.log(battleSences);

const bs = new BattleScene(battleSences[sceneIndex], units, weapons);

//console.log(bs);

bs.render({showTargetAttackRangesAlongMovementPaths: true});