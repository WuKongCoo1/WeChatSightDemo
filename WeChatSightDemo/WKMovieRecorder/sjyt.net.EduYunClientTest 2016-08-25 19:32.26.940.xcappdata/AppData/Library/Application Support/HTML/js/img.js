function picMove() {
    $dragBln = false;

    $(".main_image").touchSlider({
        flexible: true,
        speed: 200,
        btn_prev: $("#btn_prev"),
        btn_next: $("#btn_next"),
        paging: $(".flicking_con a"),
        counter: function (e) {
            $(".flicking_con a").removeClass("on").eq(e.current - 1).addClass("on");
        }
    });

    $(".main_image").bind("mousedown", function () {
        $dragBln = false;
    });

    $(".main_image").bind("dragstart", function () {
        $dragBln = true;
    });

    $(".main_image a").click(function () {
        if ($dragBln) {
            return false;
        }
    });

    timer = setInterval(function () {
        $("#btn_next").click();
    }, 5000);

    $(".main_visual").hover(function () {
        clearInterval(timer);
    }, function () {
        timer = setInterval(function () {
            $("#btn_next").click();
        }, 5000);
    });

    $(".main_image").bind("touchstart", function () {
        clearInterval(timer);
    }).bind("touchend", function () {
        timer = setInterval(function () {
            $("#btn_next").click();
        }, 5000);
        changgetitle()
    });
    changgetitle();
}
function changgetitle(){
		$('.flicking_con a').each(function(){
		if($(this).hasClass('on')){
		    var txt = $(this).text();		    
			$('.hottitle').each(function(){
				if($(this).hasClass(txt)){
				    $('.hottitle').hide();				   
				    $(this).show();
				}
			})
		}
	})
}