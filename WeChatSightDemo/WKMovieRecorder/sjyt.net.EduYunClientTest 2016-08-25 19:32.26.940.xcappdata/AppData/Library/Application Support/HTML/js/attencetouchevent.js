function touchev(a) {
  
    var tar_ = a;
    var showsearch = 1
    var obj = [];
    var init = { x: 5, y: 5 };
    $(tar_).each(function (i, n) {
        obj[i] = n;
    })
    //console.log(2);
    var sartX, endX ,sTime ,eTime,ismove,startY,endY;

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
    };
    function touchMove(event) {
        event.preventDefault();       
        var touch = event.touches[0];
        endX = touch.pageX;
        endY = touch.pageY;
    }
    function touchEnd(event) {
       
        event.preventDefault();
        var hri = Math.abs(endX - startX);
        var ver = Math.abs(endY - startY)
        //console.log(hri);
       // console.log(ver);
        if (hri > ver) {
            if ((startX - endX) > 50) {

                // console.log("左滑");
                $('.nitem').removeClass('movethreeleft').addClass('movethreeright');
                $(this).removeClass('movethreeright');
                $(this).addClass('movethreeleft');
                $(this).prev('div').removeClass('movethreeright');
                $(this).prev('div').addClass('movethreeleft');
                $(this).parent().find('.andelete').addClass('hide');
            }
            if (endX - startX > 50) {
                //console.log("右滑");
                if ($(this).hasClass('movethreeleft')) {
                    $(this).removeClass('movethreeleft');
                    $(this).addClass('movethreeright');
                    $(this).prev('div').removeClass('movethreeleft');
                    $(this).prev('div').addClass('movethreeright');
                }
            }
        } else if(hri < ver) {
            var nowscroll = $('body').scrollTop();
            if (endY > startY) {
                if (showsearch == 1 && nowscroll==0) {
                    $('.searchname').fadeIn(200);
                    $('.searchname').css('display', '-webkit-box')
                    showsearch++;
                } else {
                   
                    $('body').scrollTop(nowscroll - 200);
                }                
            } else if (startY > endY) {
                var nowscroll = $('body').scrollTop();
                $('body').scrollTop(nowscroll + 200);
            }
         
        }  
      
    }
    for (var i =0; i < obj.length; i++) {
        obj[i].addEventListener("touchstart", touchStart, false);
        obj[i].addEventListener("touchmove", touchMove, false);
        obj[i].addEventListener("touchend", touchEnd, false);
    }
    
}
function cancel(a) {
    var this_ = $(a);
    this_.parents('.andelete').addClass('hide');
}

function showload(){
    $('.loaddiv').show(100);
    $('.load').show(100);
    $('.loading').hide();
    $('.loadover').hide();

}
function showloading(){
    $('.load').hide();
    $('.loading').show(100);
    $('.loadover').hide();
}
function showloadover(){
    $('.load').hide();
    $('.loading').hide(100);
    $('.loadover').fadeIn(200);
}
function hidediv(){
    $('.loaddiv').hide(200);
}
function touchdiv(target){
    var ini = 1;
    console.log(22);
   var  contentId  =  target;
   var startY ,endY;
   function touchStart(event){  
     var touch = event.targetTouches[0]; 
     startY =touch.pageY;
 }
  function touchMove(event){  
     var touch = event.targetTouches[0]; 
     endY =touch.pageY;
     if( ini == 1 && endY - startY <50){
        $('.searchdiv').removeClass('hide');
        ini ++;
     }else{
         if( endY - startY >50){
            showload();
        }
     }
 }
  function touchEnd(event){  
    if(ini != 1){
        showloading(200);
         setTimeout(function(){  
           showloadover(); 
        },2500)
         setTimeout(function(){  
           hidediv();
        },3000)    
    }
 }
    content = document.getElementById(contentId); 
    content.addEventListener("touchstart",touchStart,false); 
    content.addEventListener("touchmove",touchMove,false); 
    content.addEventListener("touchend",touchEnd,false); 

}