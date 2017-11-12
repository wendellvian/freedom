var path = require('path');
var $ = require('jquery');

var bfApi = require(path.join(__dirname, './src/js/fan-fake'));


// var bfkind = ['BTC', 'LTC', 'ETH', 'ETC', 'IOTA', 'NEO', 'BCH', 'OMG', 'BTG', 'QTUM'];
// btc,ltc,eth,etc,iota,neo,bch,omg,btg,qtum

var saveJson = {
	'bfkind': [], // bitfinex平台币种
	'coinAmt': {}, // 币种数量
	'usd': '', // 可用余额
	'ratedusd': ''  // 额定仓位
};

// 获取平台可用余额
function getUsd(){
	bfApi.getAccountInfo().then(function (data){
		if(data.result == 'success'){
			saveJson['usd'] = data.usd;
		}
	});
}
// 获取平台币的数量
function getCoin(){
	bfApi.getAccountInfo().then(function (data){
		if(data.result == 'success'){
			for(var i=0;i<saveJson['bfkind'].length;i++){
				saveJson['coinAmt'][saveJson['bfkind'][i]] = data[saveJson['bfkind'][i]];
			}
			console.log(saveJson.coinAmt);
		}
	});
}
// 总资产
// 余额+总利润
function showAllUsd(){
	$('#js-allUsd').html(saveJson['usd']);
}

// 以上是数据

// 余额
function showUsd(){
	$('#js-usd').html(saveJson['usd']);
}

// 币数量
function showCoinAmt(){
	$('#js-list').empty();
	var htmlStr = '';
	for(var i=0;i<saveJson['bfkind'].length;i++){
		htmlStr += '<ul>'
						+'<li>'+saveJson['bfkind'][i].toUpperCase()+'</li>'
						+'<li id="'+saveJson['bfkind'][i]+'_amt">'+saveJson['coinAmt'][saveJson['bfkind'][i]]+'</li>'
						+'<li id="'+saveJson['bfkind'][i]+'_val">0</li>'
						+'<li id="'+saveJson['bfkind'][i]+'_gap">0</li>'
						+'<li id="'+saveJson['bfkind'][i]+'_amp">0</li>'
					+'</ul>';
	}
	$('#js-list').html(htmlStr);
}

// 实时更新数据
var requestAnimationFrame = window.requestAnimationFrame || 
                            window.webkitRequestAnimationFrame || 
                            window.mozRequestAnimationFrame ||
                            window.msRequestAnimationFrame ||
                            function (cb){
                                setTimeout(cb, 1000/60);
                            };
function updateData(){
	setTimeout(function (){
		requestAnimationFrame(updateData);
	}, 5000);

	// 获取数据
	getUsd();
	getCoin();

	// 显示数据
	showAllUsd();
	showUsd();
	showCoinAmt();
}


// 数组去重
Array.prototype.delrepeat = function (){
	var arr = this,
		i,
		obj = {},
		result = [],
		len = arr.length;
	for(i = 0; i< arr.length; i++){
		if(!obj[arr[i]]){  //如果能查找到，证明数组元素重复了
			obj[arr[i]] = 1;
			result.push(arr[i]);
		}
	}
	return result;
};

// 添加币种
function addCoin(){
	$('#addbtn').on('click', function (){
		var str = $('#addinput').val().split(',').delrepeat();
		saveJson['bfkind'] = str;

		
		$('#js-bcount').html(saveJson['bfkind'].length);

		$('#mask').hide();
	});
}

// 分配额定金额
function ratedLimit(){
	// 录入额度，不可超过均分金额
	$('#js-ratedinput').on('input porpertychange', this, function (){
		if(!(/\D/.test(this.value))){
			if(this.value >= saveJson['usd']/saveJson['bfkind'].length){
				this.value = saveJson['usd']/saveJson['bfkind']['length'];
			}else{
				this.value = this.value != '0' ? this.value : '0';
			}
		}else{
			this.value = '';
		}
		if(this.value == ''){
			$('#js-ratedbtn').addClass('hide');
		}else{
			$('#js-ratedbtn').removeClass('hide');
		}
		saveJson['ratedusd'] = this.value;
	});

	// 显示分配金额
	$('#js-ratedbtn').on('click', function (){
		$('#js-ratedmoney').html(saveJson['ratedusd']);
		$('#js-ratedamount').hide();
		$('#js-repair').removeClass('hide');
		$('#js-xdbtn').removeClass('hide');
	});

	// 分配金额修改
	$('#js-repair').on('click', function (){
		$('#js-ratedamount').show();
	});
}

// 下单
function payCoin(){
	$('#js-xdbtn').on('click', function (){
		bfApi.getCoinBook('eth').then(function (data){
			console.log(data);
			if(data.result == 'success'){
				// 固定金额/买价＝可买数量
				var buyVal = data.buy;
				var sellVal = data.sell;
				var moneyAmt = saveJson['ratedusd']/buyVal;
				bfApi.buyCoin('eth', moneyAmt).then(function (data){
					if(data.result == 'success'){
						$('#'+'eth'+'_val').html(moneyAmt*sellVal); // 持币价值
					}
				});
			}else{
				return;
			}
		});
	});
}

var init = function (){
	updateData();
	addCoin();
	ratedLimit();
	payCoin();
}();







