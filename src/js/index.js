// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
//加载Vue.js
const Vue = require("./lib/vue.min.js");
const fs = require("fs");
var _data = require("./data/data.json");
var _fan = require("./fan.js");


/**
 * 在页面上显示配置数据
 */
function init() {
    new Vue({
        el: "#container",
        data: {
            data: _data,
			strCoins: "eth, btc"
        },
		
        methods: {
            start: function(){
				//start process
            },
            stop: function(){
                //stop process
            },
			/**
			 * 添加币种
			 */
            addCoin: function() {
				var arrCoins = this.strCoins.split(",");
				arrCoins.forEach(function(name){
					_data.coinList.push({
						name: name,
						count: 0,
						price: 0
					});
				});
				this.getAccountBalance();
			},
			/**
			 * 保存数据到文件，避免重新运行丢失
			 */
			saveData: function() {
				fs.writeFileSync("./data/data.json" , str, 'utf8');
			},
			getAccountBalance: function() {
				var self = this;
				_fan.getAccountInfo().then(function(retData){
					if (retData.result === "success") {
						delete(retData.result);
						for (var item in retData) {
							//更新余额信息
							self.data.balance[item] = retData[item];
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