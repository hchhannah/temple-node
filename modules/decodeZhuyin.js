const decodeZhuyin = input => {
    const dict = require(__dirname+'/../data/dict.js');
    const reverseDict = Object.fromEntries(Object.entries(dict).map(([key, value]) => [value, key]));
    const zhuyinArray = input.split('');
    const chineseResult = zhuyinArray.map(zhuyin => reverseDict[zhuyin] || '').join('');
    return chineseResult;
};

module.exports = decodeZhuyin;
