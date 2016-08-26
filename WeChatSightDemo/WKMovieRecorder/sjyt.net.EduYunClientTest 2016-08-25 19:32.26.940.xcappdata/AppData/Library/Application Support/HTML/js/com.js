
//测试地址

//本地测试
//var domain = 'http://localhost:6199/';
//var domain = 'http://182.148.123.132:10001/';
//var adminURL = "http://182.148.123.132:10000/"; // 全网平台路径
//var avatarURL = "http://182.148.123.132:10002/"; // 前台网站头像路径
//var uploadMesImageUrl = "http://182.148.123.132:10002/api/Avatar/FileUpload?uploadType=3&schoolId=";
//var downloadMesImageUrl = "http://182.148.123.132:10000/upload_mes_img/";
//var deleteMesImageUrl = "http://182.148.123.132:10002/api/Avatar/DelMessageImg";

//测试地址

var domain = 'http://apiv3.edu-yun.com/';
var adminURL = "http://glv3.edu-yun.com/"; // 全网平台路径
var avatarURL = "http://webv3.edu-yun.com/"; // 前台网站头像路径
var uploadMesImageUrl = "http://webv3.edu-yun.com/api/Avatar/FileUpload?uploadType=3&schoolId=";
var downloadMesImageUrl = "http://glv3.edu-yun.com/upload_mes_img/";
var deleteMesImageUrl = "http://webv3.edu-yun.com/api/Avatar/DelMessageImg";


//正式地址
/*
var domain = 'http://api.edu-yun.com/';
var adminURL = "http://gl.edu-yun.com/"; //全网平台路径
var avatarURL = "http://www.edu-yun.com/"; //前台网站头像路径
var uploadMesImageUrl = "http://www.edu-yun.com/api/Avatar/FileUpload?uploadType=3&schoolId=";
var deleteMesImageUrl = "http://www.edu-yun.com/api/Avatar/DelMessageImg";
*/


var ossURL = "";
var ossURLThumbnail = "";
$.ajax({
    type: "get",
    async: true,
    url: domain + "api/HomeSchoolCommunication/GetOssUrl",
    data: {},
    error: function (XMLHttpRequest, textStatus, errorThrown) {
        error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");
    }, success: function (data) {
        ossURL = data.OssUrl;
        ossURLThumbnail = data.OssThumbnailUrl;
    }
});

var type = request("type");     //空:网页，0:安卓，1：IOS
var bridge;

var axdg_category_id = "0";//爱心打拐


$(function () {
    // 设置jQuery Ajax全局的参数  
    $.ajaxSetup({
        timeout: 60000,
        complete: function (XMLHttpRequest, status) { //请求完成后最终执行参数
            if (status == 'timeout') {//超时,status还有success,error等值的情况
                clearpop();
                error("您当前的网络不稳定，请稍后重试。(" + status.toString() + ")");
                $(".loading").remove();
            }
        }
    });
    //if (type == "1" || type == "0") {
    //    document.addEventListener('WebViewJavascriptBridgeReady', function (event) {
    //        bridge = event.bridge;
    //        bridge.init(function (message, responseCallback) { });
    //    }, false);
    //}

    if (window.location.href.indexOf('/homeschoolcommunication/exam/') != -1) {
        var windowHeight = $(window).height();
        var windowWidth = $(window).width();

        $('body').append(
            '<style>' +
            'body {height: ' + (windowHeight + 10) + 'px;}' +
            '.chartmap{height: ' + (windowHeight - 100) + 'px;width:' + windowWidth + 'px;}' +
            '.first{height: ' + (windowHeight - 80) + 'px;width:' + windowWidth + 'px;}' +
            '.first .teacherdiv{height: ' + (windowHeight - 80) + 'px;}' +
            '</style>');
    }


    $(".number").bind('input', function () {
        var val = $(this).val();
        var maxlength = $(this).attr('maxlength');
        if (!isInt(val)) {
            $(this).val(val.substr(0, val.length - 1));
        }
        if (!strIsNullOrEmpty(maxlength) && parseInt(maxlength) && parseInt(maxlength) < val.length) {
            $(this).val(val.substr(0, val.length - 1));
        }
    });


    $(".numberpwd").bind('paste', function () {
        return false;
    });

    $(".numberpwd").bind('input', function () {

        var val = $(this).val();
        var oldval = $(this).attr("oldvalue");
        if (!oldval) {
            oldval = "";
        }

        var vals = val.split('');
        var oldvals = oldval.split('');
        var cursurPosition = -1;
        if (!strIsNullOrEmpty($(this).context.selectionStart)) {//非IE浏览器
            cursurPosition = $(this).context.selectionStart;
        }
        if (vals.length == oldvals.length) {
            return;
        }
        if (vals.length > oldvals.length) {
            var curval = vals[cursurPosition - 1];
            if (!isInt(curval)) {
                if (cursurPosition == 0) {
                    cursurPosition = 1;
                }
                vals.splice(cursurPosition - 1, 1);
                $(this).val(vals.join(''));
            }
            else {
                oldvals.splice(cursurPosition - 1, 0, vals[cursurPosition - 1]);
                $(this).attr("oldvalue", oldvals.join(''));
                var newval = "";
                for (var i = 0; i < val.length; i++) {
                    newval += "*";
                }
                $(this).val(newval);
                var inputCallback = $(this).attr("inputCallback");
                var maxlength = $(this).attr('maxlength');

                if (!strIsNullOrEmpty(maxlength) && parseInt(maxlength) && parseInt(maxlength) == newval.length) {
                    $(this).blur();
                    var ischeck = $(this).attr('ischeck');
                    var pwd = $(this).attr("oldvalue");
                    //是否需要验证密码简单
                    if (!strIsNullOrEmpty(ischeck) && ischeck == "true") {
                        //密码简单验证
                        if (checkPwdEazy(pwd)) {
                            error('密码过于简单');
                            var btnid = $(this).attr('sbtn');
                            $("#" + btnid).attr("disabled", true);
                        }
                    }
                }
                if (!strIsNullOrEmpty(maxlength) && !strIsNullOrEmpty(inputCallback) && parseInt(maxlength) == newval.length) {
                    eval(inputCallback);
                }
            }
        }
        else {
            oldvals.splice(cursurPosition, 1);
            $(this).attr("oldvalue", oldvals.join(''));
            var btnid = $(this).attr('sbtn');
            if (!strIsNullOrEmpty(btnid)) {
                $("#" + btnid).attr("disabled", false);
            }
        }

    });
});

function checkPwdEazy(pwd) {
    if (!strIsNullOrEmpty(pwd)) {
        var epwd = '0123456789';
        if (epwd.indexOf(pwd) > -1) {
            return true;
        }
        var f = pwd.substring(0, 1);
        var regx = new RegExp('^' + f + '*$');
        if (regx.test(pwd)) {
            return true;
        }
    }
    return false;
}

function removeCharacterWithKeyCode(obj, e) {

    if ((e.keyCode == 39 || e.keyCode == 37 || e.keyCode == 8 || e.keyCode == 13 || e.keyCode == 46)
        || (e.keyCode >= 48 && e.keyCode <= 57)
    || (e.keyCode >= 96 && e.keyCode <= 105)) {
        return;
    } else {
        $(obj).val(removeChar($(obj).val()));
    }
}
function removeCharacter(obj) {
    $(obj).val(removeChar($(obj).val()));
}

function removeChar(value) {
    var reg = /[^\d]/g;
    return value.replace(reg, '');
}

function trimAll() {
    $('input[type=text],txtarea').each(function () {
        if ($(this).is('textarea')) {
            $(this).text($.trim($(this).text()));
        } else {
            $(this).val($.trim($(this).val()));
        }
    });
}

//获取页面 url 参数
//paramName：参数名称
function request(paramName) {
    var paramValue = "";
    var params = window.location.href.split('?')[1];
    if (params == null || params == "")
        return paramValue;
    var arr = params.split('&');
    if (arr.length >= 1) {
        for (var i = 0; i < arr.length; i++) {
            var name = arr[i].substring(0, arr[i].indexOf("="));
            if (name == paramName) {
                var begin = arr[i].indexOf("=");
                var end = arr[i].length;
                paramValue = removeHTMLTag(arr[i].substring(begin + 1, end));
                break;
            }
        }
    }
    return paramValue;
}
function removeHTMLTag(str) {
    str = str.replace(/<script[^>]*?>[\s\S]*?<\/script>/ig, ''); //去掉<script>;
    str = str.replace(/<style[^>]*?>[\s\S]*?<\/style>/ig, ''); //去掉<style>;
    str = str.replace(/<\/?[^>]*>/g, ''); //去除HTML tag
    str = str.replace(/[ | ]*\n/g, '\n'); //去除行尾空白
    str = str.replace(/\n[\s| | ]*\r/g, '\n'); //去除多余空行
    str = str.replace(/(^\s*)|(\s*$)/g, ""); //去掉空格
    str = str.replace(/&nbsp;/ig, ''); //去掉&nbsp;
    return str;
}
/*通知app处理页面跳转
paramArray: 传递给app的参数, 格式如下，其中urlType = 1 表示为跳转新的地址，urlType = 2表示js。安卓的执行js前需添加 javascript：
{
    title: '添加收货地址',
    url: 'addadress.html',
    urlType: 1,
    close： true，        //这个是通知添加/编辑成功后关闭当前页面，由app刷新前一个页面
    children: [
    {
        title: '保存',
        url: 'save()',
        urlType: 2,
        childTitle:'', 
        children: [{
                        title: "搜索",
                        url: '',
                        urlType: 2

                    }, {
                        title: "发布",
                        url: '',
                        urlType: 2

                    }]
    }]
}
*/
function appRedirect(paramArray) {
    var from_type = request('from_type');   //来源枚举
    var original_id = request('original_id'); //来源id
    var receive_uids = request('receive_uids');
    var receive_names = request('receive_names');
    var class_ids = request('class_ids');
    var class_names = request('class_names');
    var has_class = request('has_class');
    if (!strIsNullOrEmpty(paramArray.url) && !strIsNullOrEmpty(paramArray.urlType)) {

        if (from_type && (paramArray.urlType == 3 || paramArray.urlType == 1) && (paramArray.url.indexOf('?from_type=') == -1 && paramArray.url.indexOf('&from_type=') == -1)) {
            if (paramArray.url.indexOf('?') > 0) {
                paramArray.url += '&from_type=' + from_type;
            }
            else {
                paramArray.url += '?from_type=' + from_type;
            }
        }
        if (original_id && (paramArray.urlType == 3 || paramArray.urlType == 1) && (paramArray.url.indexOf('?original_id=') == -1 && paramArray.url.indexOf('&original_id=') == -1)) {
            if (paramArray.url.indexOf('?') > 0) {
                paramArray.url += '&original_id=' + original_id;
            }
            else {
                paramArray.url += '?original_id=' + original_id;
            }
        }
        if (receive_uids && (paramArray.urlType == 3 || paramArray.urlType == 1) && (paramArray.url.indexOf('?receive_uids=') == -1 && paramArray.url.indexOf('&receive_uids=') == -1)) {
            if (paramArray.url.indexOf('?') > 0) {
                paramArray.url += '&receive_uids=' + receive_uids;
            }
            else {
                paramArray.url += '?receive_uids=' + receive_uids;
            }
        }
        if (receive_names && (paramArray.urlType == 3 || paramArray.urlType == 1) && (paramArray.url.indexOf('?receive_names=') == -1 && paramArray.url.indexOf('&receive_names=') == -1)) {
            if (paramArray.url.indexOf('?') > 0) {
                paramArray.url += '&receive_names=' + decodeURIComponent(receive_names);
            }
            else {
                paramArray.url += '?receive_names=' + decodeURIComponent(receive_names);
            }
        }
        if (class_ids && (paramArray.urlType == 3 || paramArray.urlType == 1) && (paramArray.url.indexOf('?class_ids=') == -1 && paramArray.url.indexOf('&class_ids=') == -1)) {
            if (paramArray.url.indexOf('?') > 0) {
                paramArray.url += '&class_ids=' + class_ids;
            }
            else {
                paramArray.url += '?class_ids=' + class_ids;
            }
        }
        if (class_names && (paramArray.urlType == 3 || paramArray.urlType == 1) && (paramArray.url.indexOf('?class_names=') == -1 && paramArray.url.indexOf('&class_names=') == -1)) {
            if (paramArray.url.indexOf('?') > 0) {
                paramArray.url += '&class_names=' + decodeURIComponent(class_names);
            }
            else {
                paramArray.url += '?class_names=' + decodeURIComponent(class_names);
            }
        }
        if (type && (paramArray.urlType == 3 || paramArray.urlType == 1) && (paramArray.url.indexOf('?type=') == -1 && paramArray.url.indexOf('&type=') == -1)) {
            if (paramArray.url.indexOf('?') > 0) {
                paramArray.url += '&type=' + type;
            }
            else {
                paramArray.url += '?type=' + type;
            }
        }
        if (has_class && (paramArray.urlType == 3 || paramArray.urlType == 1) && (paramArray.url.indexOf('?has_class=') == -1 && paramArray.url.indexOf('&has_class=') == -1)) {
            if (paramArray.url.indexOf('?') > 0) {
                paramArray.url += '&has_class=' + has_class;
            }
            else {
                paramArray.url += '?has_class=' + has_class;
            }
        }


        if ((paramArray.urlType == 3 || paramArray.urlType == 1)) {
            paramArray.url = paramArray.url.toLowerCase();
        }
    }


    if (type == "0") {       //安卓
        //if (paramArray.urlType == 2 && paramArray.url.indexOf('javascript:') == -1) {
        //    paramArray.url = 'javascript:' + paramArray.url;
        //}
        if (paramArray.children && paramArray.children.length > 0) {
            $.each(paramArray.children, function (i, n) {
                var url = n.url;
                if (n.urlType == 2 && url.indexOf('javascript:') == -1) {
                    //url = 'javascript:' + url;
                } else if (n.urlType == 1 || n.urlType == 3) {
                    if (type && (url.indexOf('?type=') == -1 && url.indexOf('&type=') == -1)) {
                        if (url.indexOf('?') > 0) {
                            url += '&type=' + type;
                        }
                        else {
                            url += '?type=' + type;
                        }
                    }
                    url = url.toLowerCase();
                }
                n.url = url;
            });
        }
        bridge.callHandler('jsredirect', paramArray);
        //   surfaceView.jsredirect(JSON.stringify(paramArray));
    } else if (type == "1" && bridge) {       //iOS
        if (paramArray.children && paramArray.children.length > 0) {
            $.each(paramArray.children, function (i, n) {
                var url = n.url;
                if (n.urlType == 1 || n.urlType == 3) {
                    if (type && (url.indexOf('?type=') == -1 && url.indexOf('&type=') == -1)) {
                        if (url.indexOf('?') > 0) {
                            url += '&type=' + type;
                        }
                        else {
                            url += '?type=' + type;
                        }
                    }
                    url = url.toLowerCase();
                }
                //alert(url)
                n.url = url;
            });
        }
        bridge.send(paramArray);
    } else {
        if ((paramArray.urlType == 1 || paramArray.urlType == 3) && 'chartDispose' != paramArray.url) {
            location.href = paramArray.url;
        } else {
            eval(paramArray.url);
        }
    }
}

/*调用iOS和安卓 重设Title栏，paramArray格式如下：
{
    title: '添加收货地址',
    children: [{
        title: "搜索",
        url: 'search()',
        urlType: 2

    }, {
        title: "发布",
        url: 'publish()',
        urlType: 2

    }]
}
*/
function resetTitle(paramArray) {
    if (type == "1" || type == "0") {
        bridge.callHandler("resetTitle", paramArray);
    }
    else {
        //error('重设标题栏仅针对iOS和安卓');
    }
    //else if (type == 0 && 'surfaceView' in window) {
    //    surfaceView.resetTitle(JSON.stringify(paramArray));
    //} 

}

//验证正整数
function isInt(value) {
    var reg = /^[0-9]\d*$/;
    return reg.test(value);
}

//验证小数
function isDecimal(value, digits) {
    var reg = new RegExp('^[0-9]\d*$');;
    if (digits && digits > 0)
        reg = new RegExp('^[0-9]\d*?(\.[0-9]{1,' + digits + '})?$');
    return reg.test(value);
}

//验证 4~16 位字母数字下划线组合
function checkStr(value) {
    var reg = /^[a-zA-Z0-9_]{4,16}$/;
    return reg.test(value);
}

//验证手机号码格式
function isMobilePhone(value) {
    var reg = /^(13[0-9]|14[0-9]|15[0-9]|17[0-9]|18[0-9])\d{8}$/;
    return reg.test(value);
}

function checkLength(value, paramName, min, max) {
    if (!min || min <= 0)
        min = 0;
    if (!max || max <= 0)
        max = 0;
    if (min && max && max < min) {
        error('参数错误！');
        return false;
    }
    if (min > 0 && max <= 0 && value.length < min) {
        error(paramName + '请至少输入' + min + '个字！');
        return false;
    } else if (max > 0 && min <= 0 && value.length > max) {
        error(paramName + '最多只能输入' + max + '个字！');
        return false;
    } else if (min > 0 && max > 0 && max > min && (value.length > max || value.length < min)) {
        error(paramName + '请输入' + min + '到' + max + '个字！');
        return false;
    } else if (min > 0 && max > 0 && max == min && value.length != max) {
        error(paramName + '请输入' + max + '个字！');
        return false;
    }
    return true;
}

//转换json返回的时间
function ChangeDateFormatNoTime(cellval) {
    try {
        var date = new Date(parseInt(cellval.replace("/Date(", "").replace(")/", ""), 10));
        var month = date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
        var currentDate = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();

        return date.getFullYear() + "-" + month + "-" + currentDate;
    } catch (e) {
        return "";
    }
}
function ChangeDateFormatTime(cellval) {
    try {
        var date = new Date(parseInt(cellval.replace("/Date(", "").replace(")/", ""), 10));
        var month = date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
        var currentDate = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        var hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        var minute = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        var second = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

        return date.getFullYear() + "-" + month + "-" + currentDate + " " + hour + ":" + minute + ":" + second;
    } catch (e) {
        return "";
    }
}
//转换json返回的时间为Int
function ChangeDateFormatInt(cellval) {
    try {
        var date = new Date(parseInt(cellval.replace("/Date(", "").replace(")/", ""), 10));
        var month = date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
        var currentDate = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();

        var getHours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        var minute = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        var second = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
        return parseInt(date.getFullYear() + month + currentDate + getHours + minute + second);
    } catch (e) {
        return "";
    }
}

function strIsNullOrEmpty(str) {
    if (str == undefined || str == null || str === "") {
        return true;
    }

    return false;
}


function getOrderPayTypeName(type_id) {
    if (strIsNullOrEmpty(type_id)) {
        return "";
    }
    switch (type_id) {
        case 1: return "支付宝";
        case 2: return "网银支付";
        case 3: return "银联购买";
        case 4: return "积分";
        case 5: return "爱心币";
        default: return "";
    }
}

function getMoneyUnitName(type_id) {
    if (strIsNullOrEmpty(type_id)) {
        return "";
    }
    switch (type_id) {
        case 1: return "元";
        case 2: return "元";
        case 3: return "元";
        case 4: return "积分";
        case 5: return "爱心币";
        default: return "";
    }
}

function getOrdeStatus(status) {
    if (strIsNullOrEmpty(status)) {
        return "";
    }
    switch (status) {
        case 0: return "待支付";
        case 1: return "支付成功";
        case 2: return "支付失败";
        case 3: return "待发货";
        case 4: return "已发货";
        case 5: return "确认收货";
        case 6: return "交易完成";
        case 7: return "交易关闭";
        case 8: return "交易取消";
        case 9: return "已退款";
        case 10: return "申请取消订单";
        case 11: return "取消订单失败";
        case 12: return "订单失效";
        default: return "";
    }
}

function getPayAmount(value, payTypeId) {
    if (strIsNullOrEmpty(value) || strIsNullOrEmpty(payTypeId)) {
        return "";
    }
    switch (payTypeId) {
        case 0: return "￥" + parseFloat(value).toFixed(2);
        case 1: return "￥" + parseFloat(value).toFixed(2);
        case 2: return "￥" + parseFloat(value).toFixed(2);
        case 3: return "￥" + parseFloat(value).toFixed(2);
        case 4: return value + "积分";
        case 5: return "￥" + parseFloat(value).toFixed(2);
        case 6: return "￥" + parseFloat(value).toFixed(2);
        case 8: return "￥" + parseFloat(value).toFixed(2);
        default: return "";
    }
}

function getAttendanceResult(attResult) {
    if (strIsNullOrEmpty(attResult)) {
        return "";
    }
    switch (attResult) {
        case 0: return "正常";
        case 1: return "迟到";
        case 2: return "早退";
        case 3: return "请假";
        case 4: return "缺卡";
        default: return "";
    }
}
function getManualAttendanceResult(attResult) {
    if (strIsNullOrEmpty(attResult)) {
        return "";
    }
    switch (attResult) {
        case 0: return "正常";
        case 1: return "迟到";
        case 2: return "早退";
        case 3: return "请假";
        case 4: return "缺勤";
        default: return "";
    }
}

function parseISO8601(dateStringInRange) {
    if (dateStringInRange == null) {
        return null;
    }
    var isoExp = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d).*/,
        date = new Date(), month,
        parts = isoExp.exec(dateStringInRange);
    if (parts) {
        month = +parts[2];
        date.setFullYear(parts[1], month - 1, parts[3]);
        date.setHours(parts[4]);
        date.setMinutes(parts[5]);
        date.setSeconds(parts[6]);
    }
    else {
        date = new Date(dateStringInRange)
    }
    return date;
    //var date;
    //try {
    //    date = new Date(dateStringInRange);
    //}
    //catch (e) {
    //    date = new Date();
    //}
    //return date;
}

//2015-05-11 16:55:34
function convertDateTimeToString(date) {
    if (date == null) {
        return '';
    }
    return date.getFullYear() + "-" + padLeft((date.getMonth() + 1), 2) + "-" + padLeft(date.getDate(), 2) + " " + padLeft(date.getHours(), 2) + ":" + padLeft(date.getMinutes(), 2) + ":" + padLeft(date.getSeconds(), 2);
}

//2015-05-11 16:55
function convertDateTimeToStringNoSec(date) {
    if (date == null) {
        return '';
    }
    return date.getFullYear() + "-" + padLeft((date.getMonth() + 1), 2) + "-" + padLeft(date.getDate(), 2) + " " + padLeft(date.getHours(), 2) + ":" + padLeft(date.getMinutes(), 2);
}

//2015-05-11
function convertDateToString(date) {
    if (date == null) {
        return '';
    }
    return date.getFullYear() + "-" + padLeft((date.getMonth() + 1), 2) + "-" + padLeft(date.getDate(), 2);
}
//2015-05-11 -> 5/11/2015
function formatDateStr(str) {
    if (str == null) {
        return '';
    }
    var dateArray = str.split('-');
    return parseInt(dateArray[2], 10) + '/' + parseInt(dateArray[1], 10) + '/' + parseInt(dateArray[0], 10);
}

//2015-05-11
function convertStringToDate(str) {
    if (str == null) {
        return '';
    }
    var date = new Date();
    var dateArray = str.split('-');
    date.setFullYear(parseInt(dateArray[0], 10), parseInt(dateArray[1], 10) - 1, parseInt(dateArray[2], 10));
    return date;
}


//05-11
function convertMothDayToString(date) {
    if (date == null) {
        return '';
    }
    return padLeft((date.getMonth() + 1), 2) + "-" + padLeft(date.getDate(), 2);
}

//8:40
function convertTimeToString(date) {
    if (date == null) {
        return '';
    }
    return padLeft(date.getHours(), 2) + ":" + padLeft(date.getMinutes(), 2);
}

//2015
function convertYearToString(date) {
    if (date == null) {
        return '';
    }
    return date.getFullYear();
}

//12
function convertMothToString(date) {
    if (date == null) {
        return '';
    }
    return padLeft((date.getMonth() + 1), 2);
}

//24
function convertDayToString(date) {
    if (date == null) {
        return '';
    }
    return padLeft(date.getDate(), 2);
}

function convertMonthToChina(month) {
    switch (month) {
        case '01':
            return '一';
        case '02':
            return '二';
        case '03':
            return '三';
        case '04':
            return '四';
        case '05':
            return '五';
        case '06':
            return '六';
        case '07':
            return '七';
        case '08':
            return '八';
        case '09':
            return '九';
        case '10':
            return '十';
        case '11':
            return '十一';
        case '12':
            return '十二';
        default:
            return "";

    }

}

function padLeft(num, fill, char) {
    var len = ('' + num).length;
    return (Array(
        fill > len ? fill - len + 1 || 0 : 0
    ).join(char ? char : 0) + num);
}

function padRight(num, n, char) {
    var len = ('' + num).length;
    return (num + Array(
        fill > len ? fill - len + 1 || 0 : 0
    ).join(char ? char : 0));
}

//错误
//function error(mes) {
//    var mes_ = mes;
//    //console.log(22);
//    var height = $(window).height();
//    var obj = '<div  class="error" style="position:fixed;background-color:rgba(45,45,45,.8);padding:6px 0px;width:56%;z-index:20000;display:none;text-align:center;color:#fafafa;top:50%;left:22%;border-radius:6px;"></div>';
//    $('body').append(obj);
//    $('.error').fadeIn(200).text(mes).delay(1000);
//    $('.error').fadeOut(200, function () {
//        $('.error').remove();
//    }); 
//}
//错误
function error(mes) {
    setTimeout(function () {
        var mes_ = mes;
        var height = $(window).height();
        if ($('.error').length > 0) {
            $('.error').fadeIn(100).text(mes).delay(2000);
            $('.error').fadeOut(100, function () {
            });
        } else {
            var obj = '<div  class="error" style="position:fixed;background-color:rgba(45,45,45,.8);padding:6px 0px;width:56%;z-index:20000;display:none;text-align:center;color:#fafafa;top:50%;left:22%;border-radius:6px;"></div>';
            $('body').append(obj);
            $('.error').fadeIn(100).text(mes).delay(2000);
            $('.error').fadeOut(100, function () {
            });
        }

    }, 500)
}

//数组去重
function unique(arr) {
    var result = [], hash = {};
    for (var i = 0, elem; (elem = arr[i]) != null; i++) {
        if (!hash[elem]) {
            result.push(elem);
            hash[elem] = true;
        }
    }
    return result;
}

//对话框，包含确定取消，确定执行callback，取消关闭对话框
function dialogbox(content, callback) {
    var hei_ = $(window).height();

    if ($(".overlay").length > 0) {
        $(".overlay").remove();
    }
    var htmldiv = '<div class="overlay"><div class="popupdiv"><div class="popcontent tleft  g-line lh16"> ' + content + '</div><div class="popbutton "><div class="widper50 brshadow"> <span class="g-font  operate2 block tcenter">取消</span></div><div class="widper50"> <span class="y-font  operate1 block tcenter">确定</span></div></div></div></div>';
    $('body').append(htmldiv);
    $('.overlay').show();
    $('.overlay').css('height', hei_);
    $('.operate1').click(function () {
        callback();
        //console.log(8);
        $('.overlay').hide();
    });
    $('.operate2').click(function () {
        $('.overlay').hide();
    });
}

//两个选择无标题
function choicetwo(content, msg, callback, msg2, callback2) {
    var hei_ = $(window).height();

    if ($(".overlay").length > 0) {
        $(".overlay").remove();
    }
    var htmldiv = '<div class="overlay"><div class="popupdiv"><div class="popcontent tcenter oneline"> ' + content + '</div><div class="popbutton "><div class="widper50 brshadow"><a class="  operate1">' + msg + '</a></div><div class="widper50"><a class="y-font operate2">' + msg2 + '</a></div></div></div></div>';
    $('body').append(htmldiv);
    $('.overlay').show();
    $('.overlay').css('height', hei_);
    $('.operate1').click(function () {
        callback();
        $('.overlay').hide();
    });
    $('.operate2').click(function () {
        callback2();
        $('.overlay').hide();
    });
}

//一个选择无标题
function choiceone(content, msg, callback) {
    var hei_ = $(window).height();
    if ($(".overlay").length > 0) {
        $(".overlay").remove();
    }
    var htmldiv = '<div class="overlay"><div class="popupdiv"><div class="popcontent tcenter oneline"> ' + content + '</div><div class="popbutton "><div class="widper100 "><a class="y-font  operate1">' + msg + '</a></div></div></div></div>';
    $('body').append(htmldiv);
    $('.overlay').show();
    $('.overlay').css('height', hei_);
    $('.operate1').click(function () {
        if (callback && typeof (callback) == "function") {
            callback();
        }
        $('.overlay').hide();
    });
}


//两个选择，无标题五内容
function choicebox(msg, callback, msg2, callback2) {
    var hei_ = $(window).height();
    if ($(".overlay").length > 0) {
        $(".overlay").remove();
    }
    var htmldiv = '<div class="overlay" style="display:none;">';
    htmldiv += '<div class="popupdiv">';
    htmldiv += ' <div class="foot">';
    htmldiv += '<div class="operate1">' + msg + '</div>';
    htmldiv += ' <div class="operate2">' + msg2 + '</div>';
    htmldiv += '</div>';
    htmldiv += '</div>';
    htmldiv += '</div>';
    $('body').append(htmldiv);
    $('.overlay').show();
    $('.overlay').css('height', hei_);
    $('.operate1').click(function () {
        callback();
    });
    $('.operate2').click(function () {
        callback2();
    });
}

function choiceboxhastitle(title, content, msg, callback, msg2, callback2) {
    var hei_ = $(window).height();
    if ($(".overlay").length > 0) {
        $(".overlay").remove();
    }
    var htmldiv = '<div class="overlay" style="display:none;">';

    htmldiv += '<div class="popupdiv">';
    htmldiv += '<div class="title tcenter">' + title + '</div>';

    htmldiv += '<div class="popcontent">' + content + '</div>';
    htmldiv += ' <div class="foot tcenter">';
    htmldiv += '<div class="operate1 y-font patb">' + msg + '</div>';
    htmldiv += ' <div class="operate2 y-font patb">' + msg2 + '</div>';
    htmldiv += '</div>';
    htmldiv += '</div>';
    htmldiv += '</div>';
    $('body').append(htmldiv);
    $('.overlay').show();
    $('.overlay').css('height', hei_);
    $('.operate1').click(function () {
        callback();
    });
    $('.operate2').click(function () {
        callback2();
    });
}
function choiceboxhastitle1(title, content, msg, callback, msg2, callback2) {
    var hei_ = $(window).height();
    if ($(".overlay").length > 0) {
        $(".overlay").remove();
    }
    var htmldiv = '<div class="overlay" style="display:none;">';

    htmldiv += '<div class="popupdiv">';
    htmldiv += '<div class="title tcenter">' + title + '</div>';

    htmldiv += '<div class="popcontent">' + content + '</div>';
    htmldiv += ' <div class="foot tcenter wb bt1">';
    htmldiv += '<div class="op1 g-font patb widper50 btnr1">' + msg + '</div>';
    htmldiv += ' <div class="op2 y-font patb widper50">' + msg2 + '</div>';
    htmldiv += '</div>';
    htmldiv += '</div>';
    htmldiv += '</div>';
    $('body').append(htmldiv);
    $('.overlay').show();
    $('.overlay').css('height', hei_);
    $('.op1').click(function () {
        callback();
    });
    $('.op2').click(function () {
        callback2();
    });
}
function choiceboxhasclose(title, content, msg, callback, isclose) {
    var hei_ = $(window).height();
    if ($(".overlay").length > 0) {
        $(".overlay").remove();
    }
    var htmldiv = '<div class="overlay" style="display:none;">';

    // htmldiv += '<div class="title">' + title + '</div>';
    htmldiv += '<div class="popupdiv" style="padding-top: 1rem;">';
    htmldiv += ' <div class="wb bb1 oneline tcenter p18"><div class=" widper90">' + title + '</div>';
    if (isclose) {
        htmldiv += '<div class="widper10 bankclose"> x</div>';
    }
    htmldiv += '</div><div class="popcontent">' + content + '</div>';
    htmldiv += ' <div class="popbutton">';
    htmldiv += '<div class="widper100"><a class="y-font operate1">' + msg + '</a></div>';
    htmldiv += '</div>';
    htmldiv += '</div>';
    htmldiv += '</div>';
    $('body').append(htmldiv);
    $('.overlay').show();
    $('.overlay').css('height', hei_);
    $('.operate1').click(function () {
        callback();
    });
    $('.bankclose').click(function () {
        $('.overlay').hide();
    });
}




function isChecked(obj) {
    if ($(obj).is(":checked") || $(obj).is(":checked") == "checked" || $(obj).attr("checked") == true) {
        return true;
    }
    else {
        return false;
    }
}

function getMesTypeId(name) {
    switch (name) {
        case "留言": return 1;
        case "通知": return 2;
        case "作业": return 3;
        case "活动": return 8;
        case "日常考勤": return 26;
        case "宿舍考勤": return 27;
        case "成绩": return 4;
    }
}
function getMesTypeName(id, short) {
    if (strIsNullOrEmpty(short)) {

        switch (id) {
            case 1: return "留言";
            case 2: return "学校通知";
            case 3: return "家庭作业";
            case 8: return "学校活动";
            case 6: return "考勤信息";
            case 4: return "考试成绩";
            case "1": return "留言";
            case "2": return "学校通知";
            case "3": return "家庭作业";
            case "8": return "学校活动";
            case "6": return "考勤信息";
            case "4": return "考试成绩";
            default: return "";
        }
    }
    else {
        switch (id) {
            case 2: return "通知";
            case 3: return "作业";
            case 8: return "活动";
            case "2": return "通知";
            case "3": return "作业";
            case "8": return "活动";
            default: return "";
        }
    }
}


function subStr(str, number) {
    var newStr = '';
    if (strIsNullOrEmpty(str) || str.length <= number) {
        newStr = str;
    } else {
        newStr = str.substr(0, number - 1) + '…';
    }
    return newStr;
}
function getCurDate(Day) {
    var week = "";
    switch (Day) {
        case 1: week = "星期一"; break;
        case 2: week = "星期二"; break;
        case 3: week = "星期三"; break;
        case 4: week = "星期四"; break;
        case 5: week = "星期五"; break;
        case 6: week = "星期六"; break;
        default: week = "星期天";
    }
    return week;
}

function chartDispose() {
    if (type == 1) {
        var array = {
            url: "chartDispose",
            title: "",
            close: false,
            children: []
        };
        appRedirect(array);
    }
}

function disposeChart() {
    $('.chartmap').each(function () {
        var id = $(this).attr('id');
        var mychart = echarts.init(document.getElementById(id));
        mychart.clear();
        mychart.dispose();
    });
}



function eqo() {
    $('tr').each(function () {
        var td_ = $(this).find('td').first().text();
        if (td_.length > 3) {
            var tdstr = td_.substr(0, 2);
            $(this).find('td').first().text(tdstr + '...');
        }
    });
}

function sub(str) {
    if (str.length > 4) {
        return "(" + str.substring(str.length - 4, str.length) + ")";
    }
}

//礼物状态
function eumStatus(status, searchType, product_type) {
    if (searchType == "2") {
        switch (status) {
            case 1:
                // return "对方暂未接收";
                return "对方暂未接收";
            case 2:
                return "对方已经接收";
            case 3:
                return "对方已经拒收";
                //case 4:
                //    return "隐藏";
            case 5:
                return "对方已经接收";
            case 6:
                return "对方接收超时";
            default: "";
        }
    }
    else {
        switch (status) {
            case 1:
                return "超过3天未接收将退还";
            case 2:
                if (product_type == 1) {
                    return "已积分接收";
                }
                else {
                    return "已接收";
                }
            case 3:
                return "已拒收";
                //case 4:
                //    return "隐藏";
            case 5:
                return "已实物接收";
            case 6:
                return "接收超时";
            case 7:
                return "正在充值";
            default: "";
        }
    }
}


function giftSource(sourceType) {
    switch (sourceType) {
        case "1":
            return "在 成长足迹 中";
        case "3":
            return "在 成长足迹 中";
        case "2":
            return "在 聊天 中";
        case "5":
            return "在 相册 中";
        default: return "";
    }
}


function myDecodeURI(url) {
    var temp = decodeURIComponent(url);
    if (temp.indexOf('?') > -1 || temp.indexOf('&') > -1) {
        return temp;
    }
    else {
        return myDecodeURI(temp);
    }
}


function pop(msg) {
    if ($(".besaving").length > 0) {
        $(".besaving").remove();
    }
    $('body').append('<div class="save"><div class="besaving">' + msg + '</div><div>');
}

function clearpop() {
    $(".save").remove();
}

//function ischeck(a,isParent) {
//    var this_ = $(a);
//    if (isParent) {
//        if (this_.find('input[type="checkbox"]').is(':checked')) {
//            this_.find('input[type="checkbox"]').removeClass('ckboxout');
//            this_.find('input[type="checkbox"]').addClass('ckboxon');
//        } else {
//            this_.find('input[type="checkbox"]').removeClass('ckboxon');
//            this_.find('input[type="checkbox"]').addClass('ckboxout');
//        }
//    }
//    else {
//        if (this_.is(':checked')) {
//            this_.removeClass('ckboxout');
//            this_.addClass('ckboxon');
//        } else {
//            this_.removeClass('ckboxon');
//            this_.addClass('ckboxout');
//        }
//    }
//    //$("#chk_all").click();
//}
function ischeck(a, isParent) {
    var this_ = $(a);
    this_.each(function () {
        if (isParent) {
            if (isChecked(this_.find('input[type="checkbox"]'))) {
                this_.find('input[type="checkbox"]').removeClass('ckboxout');
                this_.find('input[type="checkbox"]').addClass('ckboxon');
            } else {
                this_.find('input[type="checkbox"]').removeClass('ckboxon');
                this_.find('input[type="checkbox"]').addClass('ckboxout');
            }
        }
        else {
            if (isChecked($(this))) {
                $(this).removeClass('ckboxout');
                $(this).addClass('ckboxon');
            } else {
                $(this).removeClass('ckboxon');
                $(this).addClass('ckboxout');
            }
        }
    });
    //$("#chk_all").click();
}

//数字用千分号分隔
function formatNumberRgx(num) {
    var parts = num.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

//银行卡图标添加
function bankchoose() {
    $('img.bankicon').each(function (i, n) {
        var bankname = $(this).attr('alt');
        //var num = $(this).attr('data-img');
        switch (bankname) {
            case "中国工商银行": {
                $(this).attr('src', '../images/bank/gongshang.png');
                $(this).parents('.bankcard').css('background-color', '#c55054');
                break;
            }
            case "招商银行": {

                $(this).attr('src', '../images/bank/zhaohang.png');
                $(this).parents('.bankcard').css('background-color', '#c55054');
                break;
            }
            case "中国光大银行": {
                $(this).attr('src', '../images/bank/guangda.png');
                $(this).parents('.bankcard').css('background-color', '#5c0b6c');
                break;
            }
            case "中信银行": {
                $(this).attr('src', '../images/bank/zhongxin.png');
                $(this).parents('.bankcard').css('background-color', '#c55054');
                break;
            }
            case "浦发银行": {
                $(this).attr('src', '../images/bank/pufa.png');
                $(this).parents('.bankcard').css('background-color', '#1f67ce');

                break;
            }
            case "广发银行": {
                $(this).attr('src', '../images/bank/guangfa.png');
                $(this).parents('.bankcard').css('background-color', '#c55054');
                break;
            }
            case "华夏银行": {
                $(this).attr('src', '../images/bank/huaxia.png');
                $(this).parents('.bankcard').css('background-color', '#c55054');
                break;
            }
            case "中国建设银行": {
                $(this).attr('src', '../images/bank/jianhang.png');
                $(this).parents('.bankcard').css('background-color', '#1f67ce');
                break;
            }
            case "交通银行": {
                $(this).attr('src', '../images/bank/jiaohang.png');
                $(this).parents('.bankcard').css('background-color', '#1f67ce');
                break;
            }
            case "中国银行": {
                $(this).attr('src', '../images/bank/zhonghang.png');
                $(this).parents('.bankcard').css('background-color', '#c55054');
                break;
            }
            case "中国民生银行": {
                $(this).attr('src', '../images/bank/minsheng.png');
                $(this).parents('.bankcard').css('background-color', '#009174');
                break;
            }
            case "兴业银行": {
                $(this).attr('src', '../images/bank/xingye.png');
                $(this).parents('.bankcard').css('background-color', '#1f67ce');
                break;
            }
            case "中国农业银行": {
                $(this).attr('src', '../images/bank/nonghang.png');
                $(this).parents('.bankcard').css('background-color', '#009174');
                break;
            }
            case "平安银行": {
                $(this).attr('src', '../images/bank/pingan.png');
                //#f60 ff9900
                $(this).parents('.bankcard').css('background-color', '#f60');
                //$(this).parents('.bankcard').css('background-color', '#c55054');
                break;
            }
            case "中国邮政储蓄银行": {
                $(this).attr('src', '../images/bank/youzheng.png');
                $(this).parents('.bankcard').css('background-color', '#009174');
                break;
            }
        }
    })
}
function banklistchoose() {
    $('img.banklisticon').each(function (i, n) {
        var bankname = $(this).attr('alt');
        //var num = $(this).attr('data-img');
        switch (bankname) {
            case "中国工商银行": {
                $(this).attr('src', '../images/bank/gongshang.png');
                break;
            }
            case "招商银行": {
                $(this).attr('src', '../images/bank/zhaohang.png');
                break;
            }
            case "中国光大银行": {
                $(this).attr('src', '../images/bank/guangda.png');
                break;
            }
            case "中信银行": {
                $(this).attr('src', '../images/bank/zhongxin.png');
                break;
            }
            case "浦发银行": {
                $(this).attr('src', '../images/bank/pufa.png');
                break;
            }
            case "广发银行": {
                $(this).attr('src', '../images/bank/guangfa.png');
                break;
            }
            case "华夏银行": {
                $(this).attr('src', '../images/bank/huaxia.png');
                break;
            }
            case "中国建设银行": {
                $(this).attr('src', '../images/bank/jianhang.png');
                break;
            }
            case "交通银行": {
                $(this).attr('src', '../images/bank/jiaohang.png');
                break;
            }
            case "中国银行": {
                $(this).attr('src', '../images/bank/zhonghang.png');
                break;
            }
            case "中国民生银行": {
                $(this).attr('src', '../images/bank/minsheng.png');
                break;
            }
            case "兴业银行": {
                $(this).attr('src', '../images/bank/xingye.png');
                break;
            }
            case "中国农业银行": {
                $(this).attr('src', '../images/bank/nonghang.png');
                break;
            }
            case "平安银行": {
                $(this).attr('src', '../images/bank/pingan.png');
                break;
            }
            case "中国邮政储蓄银行": {
                $(this).attr('src', '../images/bank/youzheng.png');
                break;
            }
        }
    })
}
//键盘模拟
$(function () {
    if (type == 1) {
        $('.sblock').click(function () {
            $('.keyboard').show(200);
            $('.keyboard').animate({
                bottom: '0.5rem',
                opacity: '1'
            }, 200);
        });
    } else {
        $('.sblock').click(function () {
            $('.keyboard').show(200);
            $('.keyboard').animate({
                bottom: '0',
                opacity: '1'
            }, 200);
        });
    }
})

//function clickkeyborad() {
//    $('.itemnum').each(function () {
//        $(this).click(function () {
//            console.log(lj);
//            if (lj < 6) {
//                var itemvar = $(this).attr('data-name')
//                var pasvar = $('.numberpwd').attr("oldvalue");
//                var pasnew = pasvar + itemvar;
//                var divold = $('.divpwd').text();
//                $('.numberpwd').attr("oldvalue", pasnew);
//                $('.divpwd').text(divold + "*");
//                lj++;
//            }
//        })
//    })
//}
//copen:点击弹出键盘的classid, pwdtxtid：密码文本框id, pwddivid：显示*号的div ,flag:是否有焦点
var tipword;
function loadkyboard(copen, pwdtxtid, pwddivid, flag) {
    var obj = '<div class="in-focus"></div>';
    $('.' + copen).click(function () {
        $('.keyboard').show(200);
        if (type == 1) {
            $('.keyboard').animate({
                bottom: '0.5rem',
                opacity: '1'
            }, 200);
        } else {
            $('.keyboard').animate({
                bottom: '0.2rem',
                opacity: '1'
            }, 200);
        }
    })
    if (flag == 'true') {
        if ($('.in-focus').length > 0) {
            $('.in-focus').remove();
        }
        $('#' + copen).append(obj);
        tipword = $('#' + copen).attr('dataname');
        if ($('#' + pwddivid).text() == "输入密码" || $('#' + pwddivid).text() == "确认密码") {
            $('.in-focus').css('left', '0rem')
        }
    }
    if ($(".keyboard").length > 0) {
        $(".keyboard").remove();
    }
    var html = '<div class="keyboard" ' + (type == 1 ? 'style ="bottom: 0.5rem;" ' : "") + '>';
    html += '  <div class="keyfinish tright">';
    html += '  <span class="mronerem finish">收起</span>';
    html += ' </div>';
    html += ' <div class="wb">';
    html += '     <div class="widthree itemnum br1 bb1" data-name="1">1</div>';
    html += ' <div class="widthree itemnum br1 bb1" data-name="2">2</div>';
    html += ' <div class="widthree itemnum br1 bb1" data-name="3">3</div>';
    html += '</div>';
    html += '<div class="wb">';
    html += ' <div class="widthree itemnum br1 bb1" data-name="4"> 4 </div>';
    html += ' <div class="widthree itemnum br1 bb1" data-name="5">5 </div>';
    html += '    <div class="widthree itemnum br1 bb1" data-name="6"> 6 </div>';
    html += '</div>';
    html += '<div class="wb">';
    html += ' <div class="widthree itemnum br1 bb1" data-name="7"> 7</div>';
    html += ' <div class="widthree itemnum br1 bb1" data-name="8">8</div>';
    html += ' <div class="widthree itemnum br1 bb1" data-name="9"> 9 </div>';
    html += '  </div>';
    html += '<div class="tcenter bgdg relative">';
    html += '<div class="itemnum widthree acenter" data-name="0">0</div>';
    html += ' <div class="keydelete widthree">';
    html += ' </div>';
    html += '</div>';
    html += '</div>';
    $('body').append(html);

    $('.itemnum').each(function () {
        $(this).bind('touchstart', function () {
            if (strIsNullOrEmpty(pwddivid)) {
                var obj = $('#' + pwdtxtid);
                var maxlength = obj.attr("maxlength");
                var itemvalue = $(this).attr('data-name');
                var oldValue = obj.val();
                if (!strIsNullOrEmpty(maxlength) && (oldValue.replace(/\s/g, '')).length >= maxlength) {
                    return;
                }
                var newvalue = '';
                if (!obj.attr('readonly')) {
                    var cursorPos = getCursorPos(pwdtxtid);
                    var nextCursorPos = cursorPos + 1;
                    newvalue = oldValue.substr(0, cursorPos) + itemvalue + oldValue.substr(cursorPos);
                    setCursorPos(pwdtxtid, nextCursorPos);
                } else {
                    newvalue = oldValue + itemvalue;
                    if (obj.hasClass('cardnumber')) {
                        var deimiter = ' ';
                        newvalue = newvalue.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, "$1" + ' ');
                    }
                    obj.val(newvalue);
                    if (obj.next('.inputclear')) {
                        obj.next('.inputclear').fadeIn(100);
                        $('.inputclear').click(function () {
                            if (strIsNullOrEmpty(pwddivid)) {
                                $('#' + pwdtxtid).val('');
                                $('#' + pwddivid).text('');
                                $('.inputclear').fadeOut(100);
                            }
                        })
                    }
                }

            } else {
                var pasvar = $('#' + pwdtxtid).attr("oldvalue");
                var max = $('#' + pwdtxtid).attr("maxlength");
                if (strIsNullOrEmpty(max)) {
                    max = 6;
                }
                var lj = pasvar.length;
                if (lj < 6) {
                    var itemvar = $(this).attr('data-name');
                    var pasnew = pasvar + itemvar;
                    var divold = $('#' + pwddivid).text();
                    if (divold.trim() == '输入密码' || divold.trim() == '确认密码') {
                        divold = '';
                    }
                    $('#' + pwdtxtid).attr("oldvalue", pasnew);
                    $('#' + pwddivid).text(divold + "*");
                    $('.in-focus').css({ 'right': '0rem', 'left': 'auto' });
                    var ischeck = $('#' + pwdtxtid).attr('ischeck');
                    if (!strIsNullOrEmpty(ischeck) && ischeck == "true" && pasnew.length == max) {
                        if (checkPwdEazy(pasnew)) {
                            error('密码过于简单');
                            $('#' + pwdtxtid).attr("oldvalue", '');
                            $('#' + pwddivid).text('');
                        }
                    }
                    if (pasnew.length == max) {
                        var callback = $('#' + pwdtxtid).attr("inputcallback");
                        if (!strIsNullOrEmpty(callback)) {
                            eval(callback);
                        }
                    }
                }
            }
        })
    })

    $('.keydelete').bind('touchstart', function () {
        if (strIsNullOrEmpty(pwddivid)) {
            var oldValue = $('#' + pwdtxtid).val();
            if (oldValue.length > 0) {
                $('#' + pwdtxtid).val(oldValue.substr(0, oldValue.length - 1));
            }

        } else {
            $('#' + pwdtxtid).attr("oldvalue", '');
            var itemvalue = $('#' + copen).attr('dataname');
            if (strIsNullOrEmpty(itemvalue)) {
                $('#' + pwddivid).text('');

            }
            else {
                $('#' + pwddivid).text(tipword);
                $('.in-focus').css('left', '0rem')
            }
        }
    });

    $('.finish').bind('touchstart', function () {
        $('.keyboard').animate({
            bottom: '-10rem',
            opacity: '0'
        }, 200)
        $('.keyboard').hide(200);
    });

}

function closekeyboard() {
    $('.keyboard').animate({
        bottom: '-10rem',
        opacity: '0'
    }, 200)
    $('.keyboard').hide(200);
}
//function keydelete() {
//    $('.numberpwd').text('');
//    $('.divpwd').text('');
//    lj = 0
//}


/**
* 设置光标在短连接输入框中的位置
* @param inputId 框Id
* @param pos
* @return {*}s
*/
function setCursorPos(inputId, pos) {
    var inpObj = document.getElementById(inputId);
    if (navigator.userAgent.indexOf("MSIE") > -1) {
        var range = document.selection.createRange();
        var textRange = inpObj.createTextRange();
        textRange.moveStart('character', pos);
        textRange.collapse();
        textRange.select();
    } else {
        inpObj.setSelectionRange(pos, pos);
        inpObj.focus();
    }
}
/**
* 获取光标在短连接输入框中的位置
* @param inputId 框Id
* @return {*}
*/
function getCursorPos(inputId) {
    var inpObj = document.getElementById(inputId);
    if (navigator.userAgent.indexOf("MSIE") > -1) { // IE
        var range = document.selection.createRange();
        range.text = '';
        range.setEndPoint('StartToStart', inpObj.createTextRange());
        return range.text.length;
    } else {
        return inpObj.selectionStart;
    }

}

//size:100X100,50X50
function headimg(img, size) {
    if (strIsNullOrEmpty(img)) {
        return "";
    }
    var reg = /\.[^\\.\/]+$/;
    var result = img.match(reg);
    return img + '_' + size + result;
    //return img + "@100h_100w";

}

//资讯点击更多
var mlclick = 1;
function morelead() {
    if (mlclick % 2 == 1) {
        $('.leadheader').css('height', 'auto');
        $('.more').hide(200);
        $('.less').fadeIn(200);
    } else {
        $('.leadheader').css('height', '42px');
        $('.less').fadeOut(200);
        $('.more').show(200);
    }
    mlclick++;


}





//判断用户是否拥有相应的权限（添加/审核）
function hasRole(uid, school_id, class_id, user_type, message_type_id) {

    var res = false;
    if (window.localStorage && !strIsNullOrEmpty(localStorage.publish_notice)) {
        if (message_type_id == "2") {
            return localStorage.publish_notice == "true" ? true : false;
        }
        if (message_type_id == "3") {
            return localStorage.publish_homework == "true" ? true : false;
        }
        if (message_type_id == "8") {
            return localStorage.publish_active == "true" ? true : false;
        }
        if (message_type_id == "12") {
            return localStorage.add_leave == "true" ? true : false;
        }
        if (message_type_id == "13") {
            return localStorage.audit_leave == "true" ? true : false;
        }
    }
    else {
        $.ajax({
            type: "get",
            async: false,
            url: domain + "api/HomeSchoolCommunication/JudgeUserPopItem",
            data: {
                uid: uid,
                school_id: school_id,
                class_id: class_id,
                user_type: user_type
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                //error("您当前的网络不稳定，请稍后重试。")
                error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");
            }, success: function (data) {
                if (window.localStorage) {
                    localStorage.publish_homework = data.rows[0].publish_homework;
                    localStorage.publish_notice = data.rows[0].publish_notice;
                    localStorage.publish_active = data.rows[0].publish_active;
                    localStorage.add_leave = data.rows[0].add_leave;
                    localStorage.audit_leave = data.rows[0].audit_leave;
                }
                if (message_type_id == "2") {
                    res = data.rows[0].publish_notice;
                }
                if (message_type_id == "3") {
                    res = data.rows[0].publish_homework;
                }
                if (message_type_id == "8") {
                    res = data.rows[0].publish_active;
                }
                if (message_type_id == "12") {
                    res = data.rows[0].add_leave;
                }
                if (message_type_id == "13") {
                    res = data.rows[0].audit_leave;
                }
            }
        });
    }
    return res;
}



function UnreadClear(uid, school_id, user_type, class_id, clear_type) {   //clear_type:   1：家校   2：考勤   3：通知     0：全部
    var bl = false;

    $.ajax({
        type: "get",
        async: false,
        url: domain + 'api/HomeSchoolCommunication/UnreadClear',
        data: {
            uid: uid,
            school_id: school_id,
            user_type: user_type,
            class_id: class_id,
            clear_type: clear_type
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            //error("您当前的网络不稳定，请稍后重试。");
            error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");;
        },
        success: function (data) {
            if (data.res > 0) {
                bl = true;
            }
        }
    });
    return bl;
}


function getPicBig(url, name) {
    if (name.substr(0, 4) == "oss-") {
        return ossURL + url.replace("upload_product_img/1/", "upload_product_img/") + name;
    }
    else {
        return adminURL + url + name;
    }
};
function getPicThumbnail(url, name, size) {
    if (name.substr(0, 4) == "oss-") {
        return ossURLThumbnail + url.replace("upload_product_img/1/", "upload_product_img/") + name + (strIsNullOrEmpty(size) ? "@100h_100w" : size);
    }
    else {
        return adminURL + url + "thumbnail_" + name;
    }
};
function getHeadImg(url, name, size) {
    if (name.substr(0, 4) == "oss-") {
        return ossURLThumbnail + url + name + (strIsNullOrEmpty(size) ? "@100h_100w" : size);
    }
    else {
        return avatarURL + "Images/" + url + headimg(name, '100X100');
    }
};


