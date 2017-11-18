// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
//加载Vue.js
const Vue = require("./lib/vue.min.js");
const fs = require("fs");
window._data = require("./data/data.json");
var _fan = require("./fan.js");
var _lastDataString;
var _coinListPos = 0;
var _timer = null;
/**
 * 在页面上显示配置数据
 */
function init() {
    var vm = new Vue({
        el: "#container",
        data: {
            data: _data,
			strCoins: "",
			cloneSingleCoinMoneyAmt: _data.singleCoinMoneyAmt,
			dealingCoinName: ""
        },
		computed: {
			totalAsset: function() {
				var totalAsset = _data.balance.usd;
				_data.coinList.forEach(function(coinItem){
					totalAsset += coinItem.count * coinItem.price;
				});
				return totalAsset;
			}
		},
        methods: {
			updatePrice: function() {
				var self = this,
					item = self.data.coinList[_coinListPos];
				return _fan.getCoinBook(item.name).then(function(retData){
					if (retData.result === "success") {
						item.price = retData.buy;
					}
					//更新失败继续
					if (_coinListPos < self.data.coinList.length - 1) {
						_coinListPos += 1;
						return self.updatePrice();
					}
					else {
						_coinListPos = 0;
					}
				});
			},
			//start process
            start: function(){
				var self = this;

				var recordData = function() {
					var dataString = JSON.stringify(_data);
					if (dataString !== _lastDataString) {
						self.saveData();
						_lastDataString = dataString;
					}
				};

				var pingCang = function() {
					var nowTime = new Date().getHours() + ":" + new Date().getMinutes();
					var isTimeToPingCang = _data.dealTime.split(",").findIndex(function(item){
						return item == nowTime;
					});

					if (isTimeToPingCang > -1) {
						return self.pingCang();
					}
				};

				var run = function() {


					self.updatePrice().then(function(){
						return self.getAccountBalance();
					}).then(function(){
						pingCang();
					}).then(function(){
						recordData();
					}).catch(function(e){
						recordData();
					});
					

					
				}
				if (!_timer) {
					run();
					_timer = setInterval(run, 50000);
				}
            },
            stop: function(){
				clearInterval(_timer);
            },
			/**
			 * 自动买卖单一币至设定仓位
			 */
			pingCangSingleCoin: function(coinItem) {
				var self = this;
				self.dealingCoinName = coinItem.name;
				return _fan.getCoinBook(coinItem.name).then(function(retData){
					if (retData.result === "success") {
						var price = retData.buy;
						var coinMoney = coinItem.count * price;
						var diffMoney = coinMoney - self.data.singleCoinMoneyAmt;
						var absDiffMoney = Math.abs(diffMoney);
						var diffPercent = absDiffMoney / self.data.singleCoinMoneyAmt * 100;
						//超过设定值
						if (diffPercent > _data.dealDiffPercent) {
							if (diffMoney > 0) {
								return _fan.sellCoin(coinItem.name, absDiffMoney, retData).then(function(retData){
									if (retData.result === "success") {
										coinItem.lastDealPrice = price;
									}
									self.dealingCoinName = "";
								});
							}
							else {
								return _fan.buyCoin(coinItem.name, absDiffMoney, retData).then(function(retData){
									if (retData.result === "success") {
										coinItem.lastDealPrice = price;
									}
									self.dealingCoinName = "";
								});
							}
						}
						else {
							self.dealingCoinName = "";
						}
					}
					else {
						self.dealingCoinName = "";
						return true;
					}
				});
			},
			/**
			 * 自动买卖至设定仓位
			 */
			pingCang: function() {
				var self = this;
				var cloneCoinList = [];
				var _coinPingCangPos = 0;
				_data.coinList.forEach(function(coinItem){
					//if (coinItem.name !== "xrp") {
						cloneCoinList.push(coinItem);
					//}
				});

				//按当天收益金额大小排序，以免后面的币不够钱买
				cloneCoinList.sort(function(a, b){
					return a.count * a.price < b.count * b.price;
				});

				var startPingCang = function() {
					return self.pingCangSingleCoin(cloneCoinList[_coinPingCangPos]).then(function(){
						
						if (_coinPingCangPos < cloneCoinList.length - 1) {
							_coinPingCangPos += 1;
							return startPingCang();
						}
					});
				}

				return _fan.getAccountInfo().then(startPingCang).then(_fan.getAccountInfo);
			},
			/**
			 * 添加币种
			 */
            addCoin: function() {
				var arrCoins = this.strCoins.replace(/\s/g, "").split(",");
				arrCoins.forEach(function(name){
					var existIndex = _data.coinList.findIndex(function(coinItem){
						return coinItem.name == name;
					});
					if (existIndex < 0) {
						_data.coinList.push({
							name: name,
							count: 0,
							price: 0
						});
					}
				});
			},

			setCoinMoneyAmt: function() {
				this.data.singleCoinMoneyAmt = this.cloneSingleCoinMoneyAmt;
			},
			/**
			 * 保存数据到文件，避免重新运行丢失
			 */
			saveData: function() {
				fs.writeFileSync("./src/js/data/data.json" , JSON.stringify(_data), 'utf8');
			},

			getAccountBalance: function() {
				var self = this;
				return _fan.getAccountInfo().then(function(retData){
					if (retData.result === "success") {
						delete(retData.result);
						for (var item in retData) {
							//更新余额信息
							_data.balance[item] = retData[item];
							var coinItem = _data.coinList.find(function(coinItem){
								return coinItem.name == item;
							});
							if (coinItem) {
								coinItem.count = _data.balance[item];
							}
						}
					}
				});
			}
        },
        watch: {

        }
    });
}

module.exports.init = init;