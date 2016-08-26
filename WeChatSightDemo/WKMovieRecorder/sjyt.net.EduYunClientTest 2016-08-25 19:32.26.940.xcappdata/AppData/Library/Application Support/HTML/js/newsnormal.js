var ReplyCommentID = 0;
$(function () {
    var wid_ = $(window).width();
    var hei_ = $(window).height();
    $('.commentword').css('width', wid_ - 70);
    $('.tomorecom').css('width', wid_ - 20);
    $('.overlay').css('height', hei_);

    $('.share').click(function () {
        $('.overlay').show();
        $('.sharediv').show();
    })
    $('.s-close').click(function () {
        $('.overlay').hide();
        $('.sharediv').hide();
    })
    $('.overlay').click(function () {
        $('.overlay').hide();
        $('.sharediv').hide();
        $('.docomdiv').hide();
    })
    documentclick();
    $('.commmit').click(function () {
        $('.docomdiv').hide();
        $('.overlay').hide();
    })

    $('.leadheader .nor').each(function () {

        $(this).click(function () {
            $('.leadheader').css('height', '42px');
            $('.leadheader .nor').removeClass('tabon');
            $(this).addClass('tabon')
            var thisid_ = $(this).attr('id');
            var divid_ = '.' + thisid_ + 'div'
            $('.nordiv').hide();
            $('.nordiv').removeClass('loadmore');
            $(divid_).show();

        })


    })
    setwidth();
    $('.bottom input').focus(function (e) {
        var dhei_ = $(document).height();
        $('body').scrollTop(dhei_);
        //$('.bottom .present').after(dhei_);
        document.addEventListener("touchmove", touchMove, false);
    })
    function touchMove(event) {
        $('.bottom input').blur();
    }
})

var showmodel = function (isshow) {
    if (isshow) {
        $('.leadheader').css('height', 'auto');
        $('.more').hide(200);
        $('.less').fadeIn(200);
    } else {
        $('.leadheader').css('height', '42px');
        $('.less').fadeOut(200);
        $('.more').show(200);
    }
}
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
function setwidth() {
    var wid_ = $(window).width();
    $('.newsinfo').css('width', wid_ - 110);
    $('.nowap').css('width', wid_ - 110);
}
var documentclick = function () {
    $('.docomment').click(function () {
        ReplyCommentID = $(this).attr("article_id");
        $('.overlay').show();
        $('.docomdiv').show();
    })
}
var documentclickshow = function (obj) {
    ReplyCommentID = $(obj).attr("article_id");
    $('.overlay').show();
    $('.docomdiv').show();
}
var PageIndex = 1;
var PageSize = 5;
var IsContinue = true;
var flag = true;
$(window).scroll(function () {
    if (flag == true) {
        var scrollTop = $(this).scrollTop();
        var scrollHeight = $(document).height();
        var windowHeight = $(this).height();
        if (scrollTop + windowHeight == scrollHeight) {
            $('.nordiv').each(function () {
                if ($(this).css('display') == 'block') {
                    $(this).addClass('loadmore');
                }
            })

            setTimeout(function () {
                $('.loading').fadeIn(200);
                var tmpurl = location.href.toLowerCase();
                if (tmpurl.indexOf("/news/list") > 0)
                    additem();
                if (tmpurl.indexOf("/news/comment") > 0) {
                    addcommentitem();
                    flag = false;
                }
                $('.loading').text('加载完毕');
                $('.loading').fadeOut(200);
            }, 500)
        }
    }
    flag = true;
})


var pageIndex_comment = 1;
var pageSize_comment = 10;
var isContinue = true;
function addcommentitem() {
    if (!isContinue) return;
    pageIndex_comment++;
    var id = $(".commmit").attr("article_id");

    //$.post("/News/getJsonComment",
    //       { id: id, pageindex: pageIndex_comment, pagesize: pageSize_comment },
    //       function (data) {
    $.ajax({
        type: "post",
        async: false,
        url: "/News/getJsonComment",
        data: { id: id, pageindex: pageIndex_comment, pagesize: pageSize_comment },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");
        },
        success: function (data) {
            var json = eval(data);
            if (json.length > 0) {
                var comobj = "";
                for (var i = 0; i < json.length; i++) {
                    //[{"id":"62","operator_name":"康克健","comment":"44444444","comment_time":"2015/5/28 15:26:22","parent_uid":"0","parent_user_name":"","parent_comment":"","parent_comment_time":"2015/5/28 15:56:33","parent_photo":"","photo":"/Images/nopic.jpg"}{"id":"61","operator_name":"康克健","comment":"333333333","comment_time":"2015/5/28 15:26:20","parent_uid":"0","parent_user_name":"","parent_comment":"","parent_comment_time":"2015/5/28 15:56:33","parent_photo":"","photo":"/Images/nopic.jpg"}]
                    var tmpUserPhoto = "/Images/nopic.jpg";
                    comobj += '<div class="commentdiv">';
                    if (json[i].parent_uid != 0) {
                        //var tmpImg = getuserphoto(json[i].parent_uid);                        
                        comobj += '<div class="before">';
                        comobj += '<div class="bb1">';
                        comobj += '<div class="wb commentitem mt10">';
                        comobj += '<div class="head" onclick="bighead(this)">';
                        comobj += '<img class="tmp_photo" src="' + json[i].parent_photo + '"  bigimg="' + json[i].parent_photo_big + '" />';//uid="' + json[i].parent_uid + '"
                        comobj += '</div>';
                        comobj += '<div>';
                        comobj += '<span class="blue ml10 mt10">' + json[i].parent_user_name + '<span>的原贴</span></span><br />';
                        comobj += '<div class="commentword"> ' + json[i].parent_comment + ' </div>';
                        comobj += '</div>';
                        comobj += '</div>';
                        comobj += '<span class="gray ml32">' + ChangeDateFormat(json[i].parent_comment_time) + ' </span>';
                        comobj += '</div>';
                        comobj += '</div>';
                    }
                    comobj += '<div class="docomment blue mt10" article_id=' + json[i].id + ' onclick="documentclickshow(this)" style="display:none;">回复</div>' +
                            '<div class="wb commentitem" >' +
                                '<div class="head mt10" onclick="bighead(this)">' +
                                     '<img src="' + json[i].photo + '"  bigimg="' + json[i].photo_big + '" />' +//uid="' + json[i].uid + '"
                                '</div>' +
                                '<div class="mt10">' +
                                    '<span class="blue ml10">' + json[i].operator_name + '</span></br>' +
                                    '<div class="commentword">' + json[i].comment + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<span class="gray ml32"> ' + ChangeDateFormat(json[i].comment_time) + ' </span>';
                    comobj += '</div>';
                }
                $('.commentloadmore').append(comobj);
                loadphoto();
            }
            else { isContinue = false; }
        }
    });
    documentclick();
}

var loadphoto = function () {
    setTimeout(function () {
        //var photocount = 0;
        //$(".tmp_photo").each(function () {
        //    var tmpUid = $(this).attr("uid");
        //    alert(tmpUid);
        //});
    }, 1000);
    //var photocount = 1;
    //var loadphoto = setInterval(function () {
    //    $(".tmp_photo").each(function () {
    //        var tmpUid = $(this).attr("uid");
    //        if (tmpUid != "" && tmpUid != "undefined" && tmpUid != undefined) {
    //            photocount++;
    //            if (photocount > 100) {
    //                window.clearInterval(loadphoto);
    //                return;
    //            }
    //            var tmpStr = "";
    //            if (tmpUid != "0") {
    //                tmpStr = getuserphoto(tmpUid);
    //                $(this).attr("src", "/Images/nopic.jpg");
    //                alert($(this).attr("src"));
    //            }
    //            if (tmpUid == 0 || tmpStr != "") {
    //                $(this).removeClass("tmp_photo");
    //            }
    //        }
    //    });
    //}, 3000);
};

var getuserphoto = function (uid) {
    var tmpStr = "";
    $.ajax({
        type: "get",
        async: false,
        url: domain + "api/HSCForImageURL/GetUserPhoto",
        data: { uid: uid },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");
        },
        success: function (data) {
            tmpStr = data.res;
        }
    });
    return tmpStr;
};


function additem() {
    if (!IsContinue) {
        return;
    }
    //加载新闻列表
    if (typeof (BindNewsPager) != "undefined" && typeof (BindNewsPager) == "function") {
        PageIndex++;
        BindNewsPager(null, category_id, PageIndex, PageSize);
    }

    //var obj= '<div class="newsitem wb ">'+
    //            '<a href="newsdetail.html" class="imga ml10">'+
    //                '<img src="images/news.png"/>'+
    //           ' </a>'+
    //           ' <div class="ml10 newsinfo ">'+
    //               ' <a href="newsdetail.html" >'+
    //                   ' <span>亲子亲子</span></br>'+
    //                    '<span class="gray">亲子亲自 '+
    //                   ' </span></br>'+
    //                    '<div class="wb">'+
    //                        '<div class="gray">2015-05-05</div>'+
    //                        '<div class="gray ml10">3666评论</div>'+
    //                    '</div>'+
    //                '</a>'+
    //           ' </div>'+
    //        '</div>';

    //$('.loadmore').append(obj);
}
$(function () {
    var height_ = $(document).height() - 42;
    $('.nordiv').css('min-height', height_);
    //console.log(height_);
})


//转换json返回的时间
function ChangeDateFormat(cellval) {
    try {
        var date = new Date(parseInt(cellval.replace("/Date(", "").replace(")/", ""), 10));
        var month = date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
        var currentDate = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();

        var getHours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        var minute = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        var second = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
        return date.getFullYear() + "-" + month + "-" + currentDate + " " + getHours + ":" + minute + ":" + second;
    } catch (e) {
        return "";
    }
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
function goback() {
    if (navigator.userAgent.indexOf('Firefox') >= 0 ||
           navigator.userAgent.indexOf('Opera') >= 0 ||
           navigator.userAgent.indexOf('Safari') >= 0 ||
           navigator.userAgent.indexOf('Chrome') >= 0 ||
           navigator.userAgent.indexOf('WebKit') >= 0) {

        if (window.history.length > 1) {
            window.history.go(-1);
        } else {
            window.opener = null; window.close();
        }
    } else { //未知的浏览器  
        window.history.go(-1);
    }
}
function strIsNullOrEmpty(str) {
    if (str == undefined || str == null || str == "") {
        return true;
    }
    return false;
}

//验证域名
function IsURL(value) {
    var strRegex = "^((https|http|ftp|rtsp|mms)?://)"
        + "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp的user@
        + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184
        + "|" // 允许IP和DOMAIN（域名）
        + "([0-9a-z_!~*'()-]+\.)*" // 域名- www.
        + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名
        + "[a-z]{2,6})" // first level domain- .com or .museum
        + "(:[0-9]{1,4})?" // 端口- :80
        + "((/?)|" // a slash isn't required if there is no file name
        + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
    var reg = new RegExp(strRegex);
    return reg.test(value);
}
//解决键盘和底部间距问题

//var pingGao = $(window).height();

//function windowSizeChange() {
//    var linshipinggao = $(window).height();
//    if (linshipinggao < pingGao) {
//        $(".bottom ").css({
//            "position": "absolute",
//            "bottom": 6 + "px",
//        })
//    };
//    if (linshipinggao == pingGao) {
//        $(".bottom ").css({
//            "position": "fixed",
//            "bottom": 0 + "px",
//        })
//    };
//}
//window.addEventListener("resize", windowSizeChange, false);
//评论框
function showcommentdiv() {
    $('.commentdiv2').show();
    $('.commentdiv2').animate({
        top: '0px',
        opacity: '1'
    }, 200)
}
function hidecommentdiv() {

    $('.commentdiv2').animate({
        top: '200px',
        opacity: '0'
    }, 200)
    $('.commentdiv2').hide(300);
}