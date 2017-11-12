var _crypto = require("crypto"),
    _key = require("./data/key.json");
    _log = require("./log.js");

var _publicKey = _key.publicKey,
    _privateKey = _key.privateKey;
    _nonceIncrease = 1;

var _baseUrl = "https://api.bitfinex.com";


var _coinInfo = {
}
/**
 * v2 disabled
 */
/*function _getHeaders(apiPath, body) {
    _nonceIncrease += 1;
    if (_nonceIncrease === 100) {
        _nonceIncrease = 1;
    }
    var nonce = new Date().getTime() * 1000 + _nonceIncrease,
        encryptContent = `/api/`+ apiPath + nonce + JSON.stringify(body),
        signature = _crypto.createHmac("sha384", _privateKey).update(encryptContent).digest("hex");
    
    return {
        'bfx-nonce': nonce,
        'bfx-apikey': _publicKey,
        'bfx-signature': signature
    };
}*/

function _getNonce() {
    _nonceIncrease += 1;
    if (_nonceIncrease === 100) {
        _nonceIncrease = 1;
    }
    return (new Date().getTime() * 1000 + _nonceIncrease).toString();
}

/**
 * 获得请求header
 * @param {Object} body 请求内容
 * @return {Object}
 */
function _getHeaders(body) {
    var payload = new Buffer(JSON.stringify(body)).toString("base64"),
        signature = _crypto.createHmac("sha384", _privateKey).update(payload).digest("hex");
    
    return {
        'X-BFX-APIKEY': _publicKey,
        'X-BFX-PAYLOAD': payload,
        'X-BFX-SIGNATURE': signature,
        "Content-Type": "application/x-www-form-urlencoded"
    };
}

/**
 * 将请求参数JSON转换成url request parameters
 * @param {Object} par 请求参数
 * @return {String}
 */
function _joinPar(par) {
    var parArr = [];
    for (var item in par) {
        parArr.push(item + "="+par[item]);
    }
    parArr.sort(function(a, b){return a > b});
    return parArr.join("&");
}

/**
 * 获取币种的最小交易量限制及价格精度限制
 * @return {Object}
 */
function getCoinInfo() {
    var apiPath = "/v1/symbols_details";
    return fetch(_baseUrl + apiPath, {
        method: "get"
    }).then(function(response){
        return response.json();
    }).then(function(resJson){
        if (resJson.length > 0) {
            resJson.forEach(function(item){
                if (/usd$/.test(item.pair)) {
                    _coinInfo[item.pair.replace("usd", "")] = {
                        minCount: parseFloat(item.minimum_order_size),
                        precision: parseFloat(item.price_precision)
                    };
                }
            });
        }
        return true;
    });
}

/**
 * 获取用户账户余额
 * @return {Object}
 */
function getAccountInfo(isDebug) {
    var start = function() {
        var apiPath = "/v1/balances",
            body = {
                request: apiPath,
                nonce: _getNonce()
            },
            headers = _getHeaders(body);

        return fetch(_baseUrl + apiPath, {
            method: "post",
            headers: headers,
            body: _joinPar(body)
        }).then(function(response){
            return response.json();
        }).then(function(resJson){
            _log.logApi("获取账户余额信息返回:" + JSON.stringify(resJson));
            var retData = {
                result: "fail"
            };
            if (resJson instanceof Array) {
                retData.result = "success";
                resJson.forEach(function(item){
                    if (item.type == "exchange") {
                        retData[item.currency] = parseFloat(item.amount);
                    }
                });
                for (var coin in _coinInfo) {
                    if (typeof retData[coin] === "undefined") {
                        retData[coin] = 0;
                    }
                }
            }

            return retData;
        });
    };

    if (!_coinInfo["btc"]) {
        return getCoinInfo().then(start)
    }
    else {
        return start();
    }
}

/**
 * 查询订单状态
 * @param {String} coinName 币种小写
 * @param {String} orderId 订单id
 * @return {Object}
 */
function _queryOrder(coinName, orderId) {
    var apiPath = "/v1/order/status",
        body = {
            request: apiPath,
            nonce: _getNonce(),
            order_id: orderId
        },
        headers = _getHeaders(body);
    _log.logApi(coinName + ": 开始查询订单" + orderId);
    return fetch(_baseUrl + apiPath, {
        method: "post",
        headers: headers,
        body: _joinPar(body)
    }).then(function(response){
        return response.json();
    }).then(function(resJson){
        _log.logApi(coinName + ": 查询订单"+ orderId +",返回:" + JSON.stringify(resJson));
        var retData = {
            result: "fail"
        };
        if (resJson.id) {
            retData.result = "success";
            retData.count = parseFloat(resJson.original_amount);
            retData.avgPrice = parseFloat(resJson.avg_execution_price);
            retData.amt = retData.count * retData.avgPrice;
        }
        return retData;
    });
}

/**
 * 新增买/卖订单
 * @param {String} coinName 币种小写
 * @param {String} type "sell" or "buy"
 * @param {Number} price 下单价格
 * @param {Number} count 下单数量
 * @return {Object}
 */
function _addOrder(coinName, type, price, count, isDebug) {
    var apiPath = "/v1/order/new",
        body = {
            request: apiPath,
            nonce: _getNonce(),
            symbol: (coinName + "USD").toUpperCase(),
            price: price,
            amount: count,
            side: type,
            type: "exchange market", //"exchange market",  //market为一定成交, 这时候price参数无用
            exchange: "bitfinex"
        },
        headers = _getHeaders(body);

    return fetch(_baseUrl + apiPath, {
        method: "post",
        headers: headers,
        body: _joinPar(body)
    }).then(function(response){
        return response.json();
    }).then(function(resJson){
        _log.logApi(coinName + ": "+ type + ", 数量:" + count +", 价格:"+ price +", 返回:" + JSON.stringify(resJson));
        var retData = {
            result: "fail"
        };
        if (resJson.id) {
            return _queryOrder(coinName, resJson.id);
        }
        else {
            return retData;
        }
    });
}


/**
 * 获取买/卖挂单列表
 * @param {String} coinName 币种小写
 * @return {Object}
 */
function getCoinBook(coinName, isDebug) {
    var apiPath = "/v1/book/"+ coinName + "usd?limit_bids=3&limit_asks=3";

    return fetch(_baseUrl + apiPath, {
        method: "get"
    }).then(function(response){
        return response.json();
    }).then(function(resJson){
        var retData = {
            result: "fail"
        };
        if (resJson.bids) {
            retData.result = "success";
            retData.buy = parseFloat(resJson.bids[0].price);
            retData.sell = parseFloat(resJson.asks[0].price);
        }
        return retData;
    });
}

/**
 * 购买虚拟币
 * @param {String} coinName 币种小写
 * @param {Number} montyAmt 金额
 * @return {Object}
 */
function buyCoin(coinName, moneyAmt, isDebug) {
    var start = function(){
        return getCoinBook(coinName).then(function(retData){
            var buyPrice = retData.sell,
                count = moneyAmt/buyPrice,
                precision = _coinInfo[coinName].precision,
                minOrderCount = _coinInfo[coinName].precision;
            _log.logApi(coinName + ": 准备buy, 金额:"+ moneyAmt +", 计算数量:"+ count +", 价格:"+ buyPrice);
            if (count < minOrderCount) {
                 _log.logApi(coinName + ": 取消sell，原因是欲成交数量小于最小值"+ minOrderCount);
                return {
                    result: "fail",
                    msg: coinName + "交易数量不能小于" + minOrderCount
                };
            }
            //todo, minimal and decimal deal
            return _addOrder(coinName, "buy", buyPrice.toFixed(precision), count.toFixed(precision));
        });
    };
    if (!_coinInfo[coinName]) {
        return getCoinInfo().then(start);
    }
    else {
        return start();
    }
    
}

/**
 * 出售虚拟币
 * @param {String} coinName 币种小写
 * @param {Number} montyAmt 金额
 * @return {Object}
 */
function sellCoin(coinName, moneyAmt, isDebug) {
    var start = function() {
        return getCoinBook(coinName).then(function(retData){
            var sellPrice = retData.buy,
                count = moneyAmt/sellPrice,
                precision = _coinInfo[coinName].precision,
                minOrderCount = _coinInfo[coinName].precision;
            _log.logApi(coinName + ": 准备sell, 金额:" + moneyAmt + ", 计算数量:" + count + ", 价格:" + sellPrice);
            if (count < minOrderCount) {
                 _log.logApi(coinName + ": 取消sell，原因是欲成交数量小于最小值" + minOrderCount);
                return {
                    result: "fail",
                    msg: coinName + "交易数量不能小于" + minOrderCount
                };
            }
            //todo, minimal and decimal deal
            return _addOrder(coinName, "sell", sellPrice.toFixed(precision), count.toFixed(precision));
        });
    };
    if (!_coinInfo[coinName]) {
        return getCoinInfo().then(start);
    }
    else {
        return start();
    }
}

module.exports = {
    getAccountInfo: getAccountInfo,
    getCoinBook: getCoinBook,
    sellCoin: sellCoin,
    buyCoin: buyCoin
};