const fs = require("fs");

function _getFileName(needMinute) {
    var da = new Date();
    var fileName = da.getFullYear() + "_" + (da.getMonth()+1) + "_" + da.getDate();
    if (needMinute) {
        fileName = fileName + da.getHours() + "_" + da.getMinutes()
    }
    return fileName;
}

function _getTime() {
    var da = new Date();
    return da.getFullYear() + "/" + (da.getMonth()+1) + "/" + da.getDate() + " " + da.getHours() + ":" + da.getMinutes() + ":" + da.getSeconds();
}

function logApi(str) {
    str = _getTime() + " " + str;
    fs.appendFileSync("./log/api_" + _getFileName() + ".html" , "<p>"+ str + "</p>", 'utf8');
}

module.exports = {
	logApi: logApi
}