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

function playerInput(){}

const units = loadUnits();
const weapons = loadWeapons();
const battleSences = loadBattleScenes();

//console.log(units);
//console.log(weapons);
//console.log(battleSences);

const bs = new BattleScene(battleSences[sceneIndex], units, weapons);

//console.log(bs);

bs.render({
  showTargetAttackRangesAlongMovementPaths: true, 
  showTargetAllEnemiesAttackRanges: true, 
  showTargetUnitMoveRange: true
});

const factionsOrder = bs.getOrderedFactions();

async function gameLoop() {
  while (!gameOver) {
    const factionId = factionsOrder[currentIdx];
    const faction = bs.factions.get(factionId);

    // 告知 BattleScene 開始這個陣營的回合
    battle.startTurn(faction);

    if (factionId === 'player') {
      // 玩家控制：等待使用者一系列操作（移動、攻擊…）
      // 你可以透過事件監聽來呼叫 battle.playerAction(...)
      await waitForPlayerActions(battle);
    } else {
      // AI 控制：一次性跑完這個陣營所有單位的行為
      battle.executeAiTurn(faction);
    }

    // 回合後檢查勝負
    if (battle.isVictory() || battle.isDefeat()) {
      gameOver = true;
      break;
    }

    // 畫面更新
    battle.render();

    // 換下一個陣營
    currentIdx = (currentIdx + 1) % factionOrder.length;
  }

  // 跳出迴圈後顯示結果
  battle.showResult();
}