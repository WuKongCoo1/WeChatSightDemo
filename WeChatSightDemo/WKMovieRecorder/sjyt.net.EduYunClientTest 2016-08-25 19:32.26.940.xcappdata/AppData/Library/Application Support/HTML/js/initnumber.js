(function ($) {
    // 输入框格式化 
    $.fn.bankInput = function (options) {
        var defaults = {
            min: 10, // 最少输入字数 
            max: 23, // 最多输入字数 
            deimiter: ' ', // 账号分隔符 
            onlyNumber: true, // 只能输入数字 
            copy: true // 允许复制 
        };
        var opts = $.extend({}, defaults, options);
        var obj = $(this);
        obj.css({ imeMode: 'Disabled', borderWidth: '1px', color: '#000', fontFamly: 'Times New Roman' }).attr('maxlength', opts.max);
        if (obj.val() != '') {
            obj.val(obj.val() .replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, "$1" + opts.deimiter));
        } 
        obj.bind('keyup', function (event) {
            if (opts.onlyNumber) {
                if (!(event.keyCode >= 48 && event.keyCode <= 57)) {
                    this.value = this.value.replace(/\D/g, '');
                }
            }
            this.value = this.value.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, "$1" + opts.deimiter);
        }).bind('dragenter', function () {
            return false;
        }).bind('onpaste', function () {
            return !clipboardData.getData('text').match(/\D/);
        }).bind('blur', function () {
            this.value = this.value.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, "$1" + opts.deimiter);
            if (this.value.length < opts.min) {
                error('最少输入' + opts.min + '位账号信息！');
                obj.focus();
            }
        })
    }
    // 列表显示格式化 
    $.fn.bankList = function (options) {
        var defaults = {
            deimiter: ' ' // 分隔符 
        };
        var opts = $.extend({}, defaults, options);
        return this.each(function () {
            $(this).text($(this).text().replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, "$1" + opts.deimiter));
        })
    }
})(jQuery);
//1.默认使用方法：
//$("#account").bankInput();
//2.设置参数
//$("#account").bankInput({min:16,max:25,deimiter,' '});
//3.非文本框格式化显示
//$(".account").bankList();