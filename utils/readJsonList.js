// readJsonList.js
import { readdirSync, readFileSync } from 'fs';
import { extname, join } from 'path';

/**
 * 讀取資料夾下所有 JSON 檔案，並回傳解析後的物件陣列
 * @param {string} dirPath - 要讀取的資料夾路徑
 * @returns {Array<Object>} - 解析後的 JSON 物件列表
 */
function readJsonFiles(dirPath) {
  // 取得資料夾內所有檔名
  const files = readdirSync(dirPath)
    // 篩選出 .json 檔案
    .filter(file => extname(file).toLowerCase() === '.json');

  // 逐一讀取並解析
  const list = files.map(file => {
    const filePath = join(dirPath, file);
    const raw = readFileSync(filePath, 'utf-8');
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error(`❌ 解析 ${file} 時發生錯誤：`, err.message);
      return null;
    }
  })
  // 去除解析失敗的項目
  .filter(item => item !== null);

  return list;
}

// 如果直接執行此檔案，可替換資料夾名稱為你的目錄
if (import.meta.url === `file://${process.argv[1]}`) {
  const folder = join(__dirname, 'your-json-folder'); // 改成你的資料夾名稱
  const jsonList = readJsonFiles(folder);
  console.log('📦 讀取到的 JSON 物件列表：', jsonList);
}

export default readJsonFiles;
