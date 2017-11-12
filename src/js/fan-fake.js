/**
 * 购买币
 * @param  {String} coinName 如"btc"，小写
 * @param  {Number} moneyAmt 购买数量
 * @return {Promise}        promise对象
 */
function buyCoin(coinName, moneyAmt, isDebug) {
    return Promise.all([]).then(function(){
        return {
            result: "success",
            count: 4, //购买数量
            amt: 1000, //购买金额
            price: 2500 //购买价格
        };
    });
}

/**
 * 出售币
 * @param  {String} coinName 如"btc"，小写
 * @param  {Number} moneyAmt 出售数量
 * @return {Promise}        promise对象
 */
function sellCoin(coinName, moneyAmt, isDebug) {
    return Promise.all([]).then(function(){
        return {
            result: "success",
            count: 4, //出售数量
            amt: 1000, //出售金额
            price: 2500 //出售价格
        };
    });
}

/**
 * 获取用户信息，包含币的数量，余额
 * @return {Promise}        promise对象
 */
function getAccountInfo(isDebug) {
    return Promise.all([]).then(function(){
        return {
            result: "success",
            eth: 4,   //exchange账户中eth总数量(包含挂单未成交在内)
            etc: 100,
            omg: 50,
            usd: 30000
        };
    });
}

/**
 * 获取coin的exchange市场中的买一价和卖一价
 * @param  {String} coinName 如"btc"，小写
 * @return {Promise}        promise对象
 */
function getCoinBook(coinName, isDebug) {
    return Promise.all([]).then(function(){
        return {
            result: "success",
            buy: 300, //买一价
            sell: 305 //卖一价
        };
    });
}

/**
 * 获取所有币当天的涨跌幅
 * @return {Promise}        promise对象
 */
function getCoinIncrease(isDebug) {
    return Promise.all([]).then(function(){
        return {
            result: "success",
            eth: 0.02,  //涨幅 2%
            etc: -0.02  //涨幅 -2%
        };
    });
}




module.exports = {
    buyCoin: buyCoin,
    sellCoin: sellCoin,
    getAccountInfo: getAccountInfo,
    getCoinBook: getCoinBook,
    getCoinIncrease: getCoinIncrease
};