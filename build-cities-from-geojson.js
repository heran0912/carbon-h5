// 使用中国县级 GeoJSON 生成地点选择页用的城市/区县数据
// 运行方式（在 PowerShell / cmd 中）：
//   cd d:\碳计算H5小程序
//   npm install pinyin
//   node build-cities-from-geojson.js
//
// 脚本会读取同目录下的 `中国_县.geojson`，
// 按每个 Feature：
//   - properties.name  作为县级中文名称
//   - geometry         取第一个坐标点作为代表经纬度
//   - 用 pinyin 库生成全拼与首字母
// 并覆盖写入 `cities.cn.js`，结构为：
//   window.CN_CITIES = [{ name, pinyin, initial, lat, lon }, ...];

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const GEOJSON_PATH = path.join(ROOT, '中国_县.geojson');
const OUTPUT_PATH = path.join(ROOT, 'cities.cn.js');

// 兼容不同版本的 pinyin 包导出方式
let pinyinFn, STYLE_NORMAL;
try {
  const pinyinLib = require('pinyin');
  // 尝试多种可能的导出方式
  if (typeof pinyinLib === 'function') {
    pinyinFn = pinyinLib;
    STYLE_NORMAL = 0; // 默认值
  } else if (typeof pinyinLib.pinyin === 'function') {
    pinyinFn = pinyinLib.pinyin;
    STYLE_NORMAL = pinyinLib.STYLE_NORMAL || 0;
  } else if (typeof pinyinLib.default === 'function') {
    pinyinFn = pinyinLib.default;
    STYLE_NORMAL = pinyinLib.STYLE_NORMAL || 0;
  } else {
    throw new Error('无法识别 pinyin 包导出方式');
  }
} catch (err) {
  console.error('加载 pinyin 包失败:', err.message);
  process.exit(1);
}

// 取一个代表经纬度点（第一个点）
function pickFirstPoint(geometry) {
  if (!geometry) return null;
  const { type, coordinates } = geometry;

  if (type === 'Point') {
    const [lon, lat] = coordinates;
    return { lon, lat };
  }

  if (type === 'Polygon') {
    const first = coordinates && coordinates[0] && coordinates[0][0];
    if (!first) return null;
    const [lon, lat] = first;
    return { lon, lat };
  }

  if (type === 'MultiPolygon') {
    const first =
      coordinates &&
      coordinates[0] &&
      coordinates[0][0] &&
      coordinates[0][0][0];
    if (!first) return null;
    const [lon, lat] = first;
    return { lon, lat };
  }

  return null;
}

// 中文 -> 拼音（无声调、小写、无空格）
function toPinyinSimple(name) {
  if (!name) return '';
  try {
    const arr = pinyinFn(name, { style: STYLE_NORMAL, heteronym: false });
    return Array.isArray(arr) ? arr.flat().join('') : '';
  } catch (err) {
    console.warn('拼音转换失败:', name, err.message);
    return '';
  }
}

function buildNameInfo(chineseName) {
  const py = toPinyinSimple(chineseName); // 例如 'shenmushi'
  const initial = py ? py[0].toUpperCase() : '#';
  const pinyinText = py;
  return { pinyin: pinyinText, initial };
}

function buildList(geojson) {
  const features = Array.isArray(geojson.features)
    ? geojson.features
    : Array.isArray(geojson)
    ? geojson
    : [];

  const list = [];

  for (const f of features) {
    const props = f && f.properties;
    const geometry = f && f.geometry;
    const name = props && props.name;
    if (!name) continue;

    const pt = pickFirstPoint(geometry);
    if (!pt || typeof pt.lon !== 'number' || typeof pt.lat !== 'number') {
      continue;
    }

    const { pinyin, initial } = buildNameInfo(name);

    list.push({
      name,
      pinyin,
      initial,
      lat: pt.lat,
      lon: pt.lon
    });
  }

  // 按首字母 + 拼音排序，方便前端直接分组/索引
  list.sort((a, b) => {
    const ia = (a.initial || '#');
    const ib = (b.initial || '#');
    const di = ia.localeCompare(ib);
    if (di !== 0) return di;
    const pa = (a.pinyin || a.name || '');
    const pb = (b.pinyin || b.name || '');
    return pa.localeCompare(pb);
  });

  return list;
}

function main() {
  if (!fs.existsSync(GEOJSON_PATH)) {
    console.error('找不到文件：', GEOJSON_PATH);
    process.exit(1);
  }

  console.log('读取 GeoJSON：', GEOJSON_PATH);
  const raw = fs.readFileSync(GEOJSON_PATH, 'utf8');
  const geojson = JSON.parse(raw);

  console.log('解析县级要素...');
  const list = buildList(geojson);
  console.log('共生成条目：', list.length);

  const header =
    '// 由 build-cities-from-geojson.js 自动生成，请勿手工编辑大段数据。\n' +
    '// 字段：\n' +
    '// - name: 中文名（县/区/市）\n' +
    '// - pinyin: 全拼（小写、无空格、无声调）\n' +
    '// - initial: 首字母（A-Z）\n' +
    '// - lat/lon: 代表经纬度（WGS84），取多边形第一个点\n';

  const body =
    'window.CN_CITIES = ' + JSON.stringify(list, null, 2) + ';\n';

  fs.writeFileSync(OUTPUT_PATH, header + body, 'utf8');
  console.log('已写入：', OUTPUT_PATH);
}

main();

