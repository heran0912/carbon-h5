// 全国区县数据分片索引（仅国内）
// 设计目标：数据量大时避免一次性加载/渲染导致卡顿。
//
// 使用方式：
// - 为每个首字母创建一个分片脚本：./counties/A.js、./counties/B.js ... ./counties/Z.js
// - 每个分片脚本往 window.CN_COUNTIES_CHUNKS 写入：
//   window.CN_COUNTIES_CHUNKS['A'] = [ { name, pinyin, initial, lat, lon, prov, city, county }, ... ]
//
// 说明：
// - name 建议为“省 市 县/区”或“市 县/区”便于区分重名
// - pinyin 为 name 的无声调全拼（小写），用于搜索
// - lat/lon 为区县中心点经纬度（WGS84 近似即可）
//
// 你可以用脚本把公开行政区划/区县经纬度数据转换成这些分片文件（见项目 README/脚本说明）。
(function () {
  window.CN_COUNTIES_CHUNKS = window.CN_COUNTIES_CHUNKS || {};

  // 仅示例：真实项目中请生成全量 A-Z 分片文件
  window.CN_COUNTIES_INDEX = {
    level: 'county',
    scope: 'CN',
    chunks: {
      // 示例分片（当前仓库未提供全量区县数据文件）
      A: './counties/A.js',
      B: './counties/B.js',
      C: './counties/C.js',
      D: './counties/D.js',
      E: './counties/E.js',
      F: './counties/F.js',
      G: './counties/G.js',
      H: './counties/H.js',
      J: './counties/J.js',
      K: './counties/K.js',
      L: './counties/L.js',
      M: './counties/M.js',
      N: './counties/N.js',
      P: './counties/P.js',
      Q: './counties/Q.js',
      R: './counties/R.js',
      S: './counties/S.js',
      T: './counties/T.js',
      W: './counties/W.js',
      X: './counties/X.js',
      Y: './counties/Y.js',
      Z: './counties/Z.js'
    }
  };
})();

