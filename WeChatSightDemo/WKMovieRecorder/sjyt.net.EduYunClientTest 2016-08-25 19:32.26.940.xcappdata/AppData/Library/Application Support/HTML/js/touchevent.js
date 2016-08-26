var a;
    //console.log(2);
    var sartX, endX, sTime, eTime, ismove, startY, endY;
    var timeOutEvent;
    function touchStart(event) {
        // event.preventDefault();
        sTime = new Date().getTime();
        var touch = event.touches[0];
        startX = touch.pageX;
        startY = touch.pageY;
        if (endX) {
            { ismove = endX; }
        }
        a = $(this);
        //console.log(a);
        timeOutEvent = setTimeout('longPress()', 500);
    };
    function touchMove(event) {
        // event.preventDefault();       
        var touch = event.touches[0];
        endX = touch.pageX;
        endY = touch.pageY;
        clearTimeout(timeOutEvent);
    }
    function touchEnd(event) {
        clearTimeout(timeOutEvent);
        // event.preventDefault();
        var hri = Math.abs(endX - startX);
        var ver = Math.abs(endY - startY)
        //console.log(hri);
        //console.log(ver);
        if (hri > ver && ver < 100) {

            if ((startX - endX) > 50 && (type == "1" || strIsNullOrEmpty(type))) {

                // console.log("左滑");
                $('.nitem').removeClass('moveleft').addClass('moveright');
                $(this).removeClass('moveright');
                $(this).addClass('moveleft');
                $(this).prev('div').removeClass('moveright');
                $(this).prev('div').addClass('moveleft');
                $(this).parent().find('.andelete').addClass('hide');
            }
            if (endX - startX > 50 && (type == "1" || strIsNullOrEmpty(type))) {
                //console.log("右滑");
                if ($(this).hasClass('moveleft')) {
                    $(this).removeClass('moveleft');
                    $(this).addClass('moveright');
                    $(this).prev('div').removeClass('moveleft');
                    $(this).prev('div').addClass('moveright');
                }
            }
        }
        if (Math.abs(endX - startX) < 20 || !endX || ismove == endX || hri == NaN || ver == NaN) {

            eTime = new Date().getTime();
            if ((eTime - sTime) > 200 && type == "0") {
                //console.log("长按");
                //$('.andelete').addClass('hide');
                //$(this).parent().find('.andelete').removeClass('hide');
                // $(this).parent().find('.andelete').css({ "left": startX});

            }
            else if ((eTime - sTime) < 200) {
                //console.log("点击");
                var clickEvent = $(this).find('.cli').attr('clickEvent');
                eval(clickEvent);
                $(this).parent().find('.andelete').addClass('hide');
            }
        }

    }
    function touchev() {
       // var num = a;
        var obj = [];
        var init = { x: 5, y: 5 };
        $('.nitem').each(function (i, n) {
            obj[i] = n;
            if ($(this).hasClass('moveleft')) {
                $(this).removeClass('moveleft');
                $(this).addClass('moveright');
            }
            
        })
        for (var i = 0; i < obj.length; i++) {
        obj[i].removeEventListener("touchstart", touchStart, false);
        obj[i].removeEventListener("touchmove", touchMove, false);
        obj[i].removeEventListener("touchend", touchEnd, false);
        obj[i].addEventListener("touchstart", touchStart, false);
        obj[i].addEventListener("touchmove", touchMove, false);
        obj[i].addEventListener("touchend", touchEnd, false);
    }
}
//定义android长按删除事件
function longPress() {
    // alert("长按");
    // console.log(b);
    var obj = a;
    $('.andelete').addClass('hide');
    obj.parent().find('.andelete').removeClass('hide');
}
function cancel(a) {
    var this_ = $(a);
    this_.parents('.andelete').addClass('hide');
}


//去掉触摸监听
function removeListener() {
    var obj = [];
    $('.nitem').each(function (i, n) {
        obj[i] = n;
    })
    for (var i = 0; i < obj.length; i++) {
        obj[i].removeEventListener("touchstart", touchStart, false);
        obj[i].removeEventListener("touchmove", touchMove, false);
        obj[i].removeEventListener("touchend", touchEnd, false);
    }
}

//添加触摸监听
function addListener() {
    var obj = [];
    $('.nitem').each(function (i, n) {
        obj[i] = n;
    })
    for (var i = 0; i < obj.length; i++) {
        obj[i].removeEventListener("touchstart", touchStart, false);
        obj[i].removeEventListener("touchmove", touchMove, false);
        obj[i].removeEventListener("touchend", touchEnd, false);
        obj[i].addEventListener("touchstart", touchStart, false);
        obj[i].addEventListener("touchmove", touchMove, false);
        obj[i].addEventListener("touchend", touchEnd, false);
    }
}
