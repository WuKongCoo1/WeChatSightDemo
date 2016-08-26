var dayNames = {};
var monthNames = {};
var lAddEvent = {};
var lAllDay = {};
var lTotalEvents = {};
var lEvent = {};
dayNames['EN'] = new Array('一', '二', '三', '四', '五', '六', '日');
monthNames['EN'] = new Array('01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12');
lAddEvent['EN'] = 'Add New Event';
lAllDay['EN'] = '一天';
lTotalEvents['EN'] = '本月所有事件: ';
lEvent['EN'] = '事件(s)';


$(function () {
    //扩展settings
    var settings = $.extend({
        customDay: new Date(),
        color: '#ff7e6d',
        lang: 'EN',
    });

    //定义年月日
    var d = new Date(settings.customDay);
    var year = d.getFullYear();
    var date = d.getDate();
    var month = d.getMonth();

    //判断是否闰年
    var isLeapYear = function (year1) {
        var f = new Date();
        f.setYear(year1);
        f.setMonth(1);
        f.setDate(29);
        return f.getDate() == 29;
    };
    //是否二月
    var feb;
    var febCalc = function (feb) {
        if (isLeapYear(year) === true) { feb = 29; } else { feb = 28; }
        return feb;
    };
    var monthDays = new Array(31, febCalc(feb), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);


    //构建DOM方法
    var div = function (e, classN) {
        return $(document.createElement(e)).addClass(classN);
    };

    //构建日历
    (function ($) {
        $.fn.canlendar = function () {
            var $this = $(this);
            var div = function (e, classN) {
                return $(document.createElement(e)).addClass(classN);
            };

            //var clockHour = [];
            //var clockMin = [];
            //for (var i = 0; i < 24; i++) {
            //    clockHour.push(div('div', 'option').text(i))
            //}
            //for (var i = 0; i < 59; i += 5) {
            //    clockMin.push(div('div', 'option').text(i))
            //}

            // HTML Tree
            $this.append(
                div('div', 'wood-bottom'),
                div('div', 'jalendar-wood').append(
                    /*div('div', 'close-button'),*/
                    div('div', 'jalendar-pages').append(
                        div('div', 'pages-bottom'),
                        div('div', 'header').css('background-color', settings.color).append(
                            div('a', 'prv-m'),
                            div('h1'),
                            div('a', 'nxt-m'),
                            div('div', 'day-names')
                        ),
                       // div('div', 'total-bar').html(lTotalEvents[settings.lang] + '<b style="color: ' + settings.color + '"></b>').hide(),
                        div('div', 'days')
                    ),
                    div('div', 'add-event').append(
                        div('div', 'add-new').append(

                        )
                    )
                )
            );

            // Adding day boxes
            for (var i = 0; i < 42; i++) {
                $this.find('.days').append(div('div', 'day'));
            }

            // Adding day names fields
            for (var i = 0; i < 7; i++) {
                $this.find('.day-names').append(div('h2').text(dayNames[settings.lang][i]));
            }


            function calcMonth() {

                monthDays[1] = febCalc(feb);

                var weekStart = new Date();
                weekStart.setFullYear(year, month, 0);
                var startDay = weekStart.getDay();

                $this.find('.header h1').html(year + '-' + monthNames[settings.lang][month]);

                $this.find('.day').html('&nbsp;');
                $this.find('.day').removeClass('this-month');
                for (var i = 1; i <= monthDays[month]; i++) {
                    startDay++;
                    $this.find('.day').eq(startDay - 1).addClass('this-month').attr('data-date', i + '/' + (month + 1) + '/' + year).html(i);
                }
                if (month == d.getMonth()) {
                    // $this.find('.day.this-month').removeClass('today').eq(date - 1).addClass('today').css('color', settings.color);
                    $this.find('.day.this-month').removeClass('today').eq(date - 1).addClass('today')
                } else {
                    $this.find('.day.this-month').removeClass('today').attr('style', '');
                }

            }

            calcMonth();
            var dropdown = new Array($this.find('.add-time .select span'), $this.find('.add-time .select .dropdown .option'), $this.find('.add-time .select'));
            var allDay = new Array('.all-day fieldset[data-type="disabled"]', '.all-day fieldset[data-type="enabled"]');
            var $erase = $this.find('.event-single .erase');
            $this.find('.events').css('height', '100px');
            $this.find('.select .dropdown .option').hover(function () {
                $(this).css('background-color', settings.color);
            }, function () {
                $(this).css('background-color', 'inherit');
            });
            var jalendarWoodW = $this.find('.jalendar-wood').width();
            var woodBottomW = $this.find('.wood-bottom').width();
            function prevAddEvent() {
                $this.find('.day').removeClass('selected').removeAttr('style');
                $this.find('.today').css('color', settings.color);
                $this.find('.add-event').hide();
            }



            //点击日期显示奖励
            $this.on('click', '.this-month', function () {
                var day = $(this).attr('data-date');
                var dayint = parseInt(day.substr(0, 2));
                var eventSingle = '';
                if ($(this).find('.event-single').length > 0) {
                    eventSingle = "<div class=\" p26  g-line\"> 获得奖励:</div>"
                    eventSingle += $(this).find('.event-single').html();
                    //console.log(eventSingle);
                } else {
                    return;
                }

                $this.find('.events .event-single').remove();
                prevAddEvent();
                // $(this).addClass('selected').css({ 'background-color': settings.color });
                $(this).addClass('selected');
                $this.children('.jalendar-wood, .wood-bottom').animate({ width: '+=0px' }, 200, function () {
                    if (eventSingle != '' && (date < dayint || date == dayint)) {
                        $this.find('.add-event').show().find('.add-new').html(eventSingle)
                    } else if (date > dayint && eventSingle != '') { //以往的已签到的日期
                        $this.find('.add-event').show().find('.add-new').html(eventSingle)
                    } else if (date > dayint && eventSingle == '') { //以往的未签到的日期
                        if ($('.error').length == 0) {
                            error('不可以查看往日奖励');
                        } else {
                            $('.error').remove();
                            error('不可以查看往日奖励');
                        }
                    } else if ((date < dayint || date == dayint) && eventSingle == '') {
                        if ($('.error').length == 0) {
                            error('没有奖励');
                        } else {
                            $('.error').remove();
                            error('没有奖励');
                        }

                    }
                });
            });
        };

    }(jQuery));

    (function ($) {
        $.fn.jalendar = function () {
            var $this = $(this);
            var div = function (e, classN) {
                return $(document.createElement(e)).addClass(classN);
            };

            var clockHour = [];
            var clockMin = [];
            for (var i = 0; i < 24; i++) {
                clockHour.push(div('div', 'option').text(i))
            }
            for (var i = 0; i < 59; i += 5) {
                clockMin.push(div('div', 'option').text(i))
            }

            // HTML Tree
            $this.append(
                div('div', 'wood-bottom'),
                div('div', 'jalendar-wood').append(
                    /*div('div', 'close-button'),*/
                    div('div', 'jalendar-pages').append(
                        div('div', 'pages-bottom'),
                        div('div', 'header').css('background-color', settings.color).append(
                            div('a', 'prv-m'),
                            div('h1'),
                            div('a', 'nxt-m'),
                            div('div', 'day-names')
                        ),
                      //  div('div', 'total-bar').html( lTotalEvents[settings.lang] + '<b style="color: '+settings.color+'"></b>').hide(),
                        div('div', 'days')
                    ),
                    div('div', 'add-event').append(
                        div('div', 'add-new').append(

                        )
                    )
                )
            );

            // Adding day boxes
            for (var i = 0; i < 42; i++) {
                $this.find('.days').append(div('div', 'day'));
            }

            // Adding day names fields
            for (var i = 0; i < 7; i++) {
                $this.find('.day-names').append(div('h2').text(dayNames[settings.lang][i]));
            }


            function calcMonth() {

                monthDays[1] = febCalc(feb);

                var weekStart = new Date();
                weekStart.setFullYear(year, month, 0);
                var startDay = weekStart.getDay();

                $this.find('.header h1').html(year + '-' + monthNames[settings.lang][month]);

                $this.find('.day').html('&nbsp;');
                $this.find('.day').removeClass('this-month');
                for (var i = 1; i <= monthDays[month]; i++) {
                    startDay++;
                    $this.find('.day').eq(startDay - 1).addClass('this-month').attr('data-date', i + '/' + (month + 1) + '/' + year).html(i);
                }
                if (month == d.getMonth()) {
                    $this.find('.day.this-month').removeClass('today').eq(date - 1).addClass('today').css('color', settings.color);
                } else {
                    $this.find('.day.this-month').removeClass('today').attr('style', '');
                }


                calcTotalDayAgain();

            }

            calcMonth();

            // var arrows = new Array ($this.find('.prv-m'), $this.find('.nxt-m'));
            var dropdown = new Array($this.find('.add-time .select span'), $this.find('.add-time .select .dropdown .option'), $this.find('.add-time .select'));
            var allDay = new Array('.all-day fieldset[data-type="disabled"]', '.all-day fieldset[data-type="enabled"]');
            var $erase = $this.find('.event-single .erase');
            $this.find('.events').css('height', '100px');
            $this.find('.select .dropdown .option').hover(function () {
                $(this).css('background-color', settings.color);
            }, function () {
                $(this).css('background-color', 'inherit');
            });
            var jalendarWoodW = $this.find('.jalendar-wood').width();
            var woodBottomW = $this.find('.wood-bottom').width();

            // calculate for scroll
            function calcScroll() {
                if ($this.find('.events-list').height() < $this.find('.events').height()) { $this.find('.gradient-wood').hide(); $this.find('.events-list').css('border', 'none') } else { $this.find('.gradient-wood').show(); }
            }

            // Calculate total event again
            function calcTotalDayAgain() {
                var eventCount = $this.find('.this-month .event-single').length;
                // $this.find('.total-bar b').text(eventCount);
                $this.find('.events h3 span b').text($this.find('.events .event-single').length)
            }

            function prevAddEvent() {
                $this.find('.day').removeClass('selected').removeAttr('style');
                $this.find('.today').css('color', settings.color);
                $this.find('.add-event').hide();
            }

            //arrows[1].on('click', function () {
            //    if ( month >= 11 ) {
            //        month = 0;
            //        year++;
            //    } else {
            //        month++;   
            //    }
            //    calcMonth();
            //    prevAddEvent();
            //});
            //arrows[0].on('click', function () {
            //    dayClick = $this.find('.this-month');
            //    if ( month === 0 ) {
            //        month = 11;
            //        year--;
            //    } else {
            //        month--;   
            //    }
            //    calcMonth();
            //    prevAddEvent();
            //});

            $this.on('click', '.this-month', function () {
                var eventSingle = $(this).find('.event-single');
                $this.find('.events .event-single').remove();
                prevAddEvent();
                $(this).addClass('selected').css({ 'background-color': settings.color });
                $this.children('.jalendar-wood, .wood-bottom').animate({ width: '+=0px' }, 200, function () {
                    if (eventSingle.length > 0) {
                        $this.find('.add-event').show().find('.add-new').html(eventSingle.clone())
                        calcTotalDayAgain();
                        calcScroll();
                    }
                });
            });

        };
   
    }(jQuery));

    //标记签到
    (function ($) {
        $.fn.mark = function () {
            var type = [], obj;
            var $this = $(this);
            var div = function (e, classN) {
                return $(document.createElement(e)).addClass(classN);
            };
            // added event
            $this.find('.added-event').each(function (i) {
                $(this).attr('data-id', i);
                type[i] = $(this).attr('data-type');

                //获取data-title
                var obj = $(this).find('.data-title')
                //html += '<div>'+ obj.score+ '</div>'
                $this.find('.this-month[data-date="' + $(this).attr('data-date') + '"]').append(
                    div('div', 'event-single').attr('data-id', i).append(
                       // div('p', '').text($(this).attr('data-title'))
                      div('div', 'wow').html(obj)
                    )
                );
                return type;
            });
            $this.find('.day').has('.event-single').each(function (i) {
                if (type[i] == 1) {
                    if ($(this).find('i').length == 0) {
                        $(this).addClass('have-event').prepend(div('i', ''));
                    }
                }
            })
            var ftoday;
            if (month == d.getMonth()) {
                ftoday = $this.find('.today');
                // $this.find('.day.this-month').removeClass('today').eq(date - 1).addClass('today').css('color', settings.color);
            } else {
                if ($this.find('.added-event').length > 0) {
                    var fdatatate = $this.find('.added-event').eq(0).attr('data-date');
                    ftoday = $this.find('.day[data-date ="' + fdatatate + '"]');
                }
            }
            if (ftoday) {
                var eventmark = ftoday.find('.event-single');
                $('.day.selected').removeClass('selected');
                ftoday.addClass('selected');
                var html = '<div class=\" p26  g-line\"> 获得奖励:</div>'
                html += eventmark.html()
                $this.find('.add-event').show().find('.add-new').html(html);
            }
        }
    }(jQuery));

    //加载下个月
    (function ($) {
        $.fn.nextmonth = function (options) {
            var $this = $(this);
            //function calcTotalDayAgain() {
            //    var eventCount = $this.find('.this-month .event-single').length;
            //    $this.find('.total-bar b').text(eventCount);
            //    $this.find('.events h3 span b').text($this.find('.events .event-single').length)
            //}
            function prevAddEvent() {
                $this.find('.day').removeClass('selected').removeAttr('style');
                $this.find('.today').css('color', settings.color);
                $this.find('.add-event').hide();
                $this.find('.added-event').remove()
            }
            function calcMonth() {

                monthDays[1] = febCalc(feb);

                var weekStart = new Date();
                weekStart.setFullYear(year, month, 0);
                var startDay = weekStart.getDay();

                $this.find('.header h1').html(year + '-' + monthNames[settings.lang][month]);

                $this.find('.day').html('&nbsp;');
                $this.find('.day').removeClass('this-month');
                for (var i = 1; i <= monthDays[month]; i++) {
                    startDay++;
                    $this.find('.day').eq(startDay - 1).addClass('this-month').attr('data-date', i + '/' + (month + 1) + '/' + year).html(i);
                }
                if (month == d.getMonth()) {
                    $this.find('.day.this-month').removeClass('today').eq(date - 1).addClass('today').css('color', settings.color);
                } else {
                    $this.find('.day.this-month').removeClass('today').attr('style', '');
                }


                //calcTotalDayAgain();
                return monthNames[settings.lang][month]

            }

            if (month >= 11) {
                month = 0;
                year++;
            } else {
                month++;
            }
            var monthme = calcMonth();
            var dateme = year + '-' + monthme;
            calcMonth();
            prevAddEvent();
            return dateme;
        }
    }(jQuery));

    //加载上个月
    (function ($) {
        $.fn.prvmonth = function (options) {
            var $this = $(this);
            function prevAddEvent() {
                $this.find('.day').removeClass('selected').removeAttr('style');
                $this.find('.today').css('color', settings.color);
                $this.find('.add-event').hide();
                $this.find('.added-event').remove()
            }
            function calcMonth() {

                monthDays[1] = febCalc(feb);

                var weekStart = new Date();
                weekStart.setFullYear(year, month, 0);
                var startDay = weekStart.getDay();

                $this.find('.header h1').html(year + '-' + monthNames[settings.lang][month]);

                $this.find('.day').html('&nbsp;');
                $this.find('.day').removeClass('this-month');
                for (var i = 1; i <= monthDays[month]; i++) {
                    startDay++;
                    $this.find('.day').eq(startDay - 1).addClass('this-month').attr('data-date', i + '/' + (month + 1) + '/' + year).html(i);
                }
                if (month == d.getMonth()) {
                    $this.find('.day.this-month').removeClass('today').eq(date - 1).addClass('today').css('color', settings.color);
                } else {
                    $this.find('.day.this-month').removeClass('today').attr('style', '');
                }
                return monthNames[settings.lang][month]

                // calcTotalDayAgain();

            }
            var arrownxt = $this.find('.nxt-m');
            dayClick = $this.find('.this-month');

            if (month === 0) {
                month = 11;
                year--;
            } else {
                month--;
            }
            calcMonth();
            prevAddEvent();
            $('#myId3').mark();
            var monthme = calcMonth();
            var dateme = year + '-' + monthme;
            return dateme;
        }
    }(jQuery));

    //滑动事件
    (function ($) {
        $.fn.slide = function () {
            var thisId = $(this).attr('id')
            var init = { x: 5, y: 5 };
            var thisObj = document.getElementById(thisId);
            var sartX, endX ,sTime ,eTime,ismove,startY,endY;
            /*定义滑动参数结束*/
            /*定义滑动事件*/
              function touchStart(event) {
                    event.preventDefault();
                    sTime = new Date().getTime();
                    var touch = event.touches[0];
                    startX = touch.pageX;
                    startY = touch.pageY;
                    if (endX) {
                        { ismove = endX;}
                    }
                    $('input').blur();
                }
                function touchMove(event) {
                    event.preventDefault();       
                    var touch = event.touches[0];
                    endX = touch.pageX;
                    endY = touch.pageY;
                }
                function touchEnd(event) {
                    event.preventDefault();
                    var hri = Math.abs(endX - startX);
                    var ver = Math.abs(endY - startY);
                    sTime = new Date().getTime();
                    console.log(hri);
                    console.log(ver);
                    if (hri > ver) {
                    if ((startX - endX) > 50) {
                        console.log("左滑")
                        $(this).nextmonth();
                     }else if ((endX - startX)> 50) {
                         console.log("右滑")
                         $(this).prvmonth();
                    } 
                  }
                }
            /*定义滑动事件结束*/
            /*绑定滑动事件*/
         
                thisObj.addEventListener("touchstart", touchStart, false);
                thisObj.addEventListener("touchmove", touchMove, false);
                thisObj.addEventListener("touchend", touchEnd, false);
      
           //绑定滑动事件结束
        }
    })(jQuery)
});


