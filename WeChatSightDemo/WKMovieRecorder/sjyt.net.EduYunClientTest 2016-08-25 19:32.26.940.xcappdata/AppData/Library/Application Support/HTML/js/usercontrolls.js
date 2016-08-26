/// <reference path="jquery-1.10.2.min.js" />
/// <reference path="com.js" />

var checkAll = "<label id=\"chk_all_label\" class='mlper6 wb mtonerem bb1 patb bold'><div class='relative label' onclick='event.stopPropagation();ischeck(this,true)'><input type=\"checkbox\" id=\"chk_all\" class='ckbox ckboxout' /></div><span class='mlp6'>全选</span></label>";

//#region 选择班级控件begin
var chk_class_ids = request("chk_class_ids");
var chk_class_names = request("chk_class_names");
var chk_class_count = 0;
var chk_class_isallchk = 0;

//加载班级列表   is_set:当只有一个班级时，是否默认选中？  一般情况下不选中就隐藏
function selectClass(uid, user_type, school_id, is_set, class_id, message_type_id) {
    is_set = true;
    if (strIsNullOrEmpty(message_type_id)) {
        message_type_id = null;
    }
    if (user_type != "0") {
        chk_class_ids = class_id;
        return;
    }

    if (isNaN(class_id) || (school_id != 0 && school_id != "0")) {
        class_id = "";
    }

    if (strIsNullOrEmpty(uid) || strIsNullOrEmpty(user_type) || user_type != "0") {
        return;
    }

    if (strIsNullOrEmpty(school_id)) {
        school_id = "0";
    }

    var listStr = "";
    $.ajax({
        type: "get",
        async: false,
        url: domain + "api/HomeSchoolCommunication/ClassSelTeacherBySchoolId",
        data: {
            uid: uid,
            school_id: school_id,
            class_id: class_id,
            message_type_id: message_type_id
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");
        }, success: function (data) {
            chk_class_count = data.rows.length;
            var grade_ids = "";

            if (chk_class_count > 1) {
                listStr += checkAll;
            }

            for (var i = 0; i < data.rows.length; i++) {
                if (("," + grade_ids + ",").indexOf("," + data.rows[i].grade_id + ",") < 0) {
                    if (!strIsNullOrEmpty(data.rows[i].grade_name)) {
                        listStr += "<div class='bb1 bgwhite  widper95 acenter '>";
                        listStr += "<div class='classitem  indentb wb mlper6 widper90'>";
                        listStr += "<div class='label relative mtonerem ' onclick='event.stopPropagation();ischeck(this,true)' >";
                        listStr += "<input class='ckbox ckboxout' type=\"checkbox\" id=\"grade_" + data.rows[i].grade_id + "\" name=\"chk_grade\" value=\"" + data.rows[i].grade_id + "\" />";
                        listStr += "</div>";
                        listStr += "<label class=' block  widper85 nowrap bold' val=\"" + data.rows[i].grade_id + "\" name=\"grade_name\">" + data.rows[i].grade_name + "</label>";
                        listStr += "<div class='widper10 tleft'><img class='icon 'src='../../images/next.png'> </div>";
                        listStr += "</div>";
                        listStr += "</div>"
                    }

                    for (var j = 0; j < data.rows.length; j++) {
                        if ((("," + chk_class_ids + ",").indexOf("," + data.rows[j].id + ",") >= 0 || (is_set && data.rows.length == 1)) && ("," + chk_class_names + ",").indexOf("," + data.rows[i].grade_name + data.rows[j].name + "班,") < 0 && data.rows[i].grade_id == data.rows[j].grade_id) {
                            //  chk_class_names += data.rows[i].grade_name + data.rows[j].name + "班,";
                            var class_name = "";
                            if (!strIsNullOrEmpty(data.rows[j].name)) {
                                class_name = data.rows[j].name + "班 ";
                            }
                            var remark = "";
                            if (!strIsNullOrEmpty(data.rows[j].remark)) {
                                remark = data.rows[j].remark;
                            }
                            chk_class_names += (strIsNullOrEmpty(data.rows[i].grade_name) ? "" : data.rows[i].grade_name) + class_name + remark + ',';
                        }
                        var is_check = "";
                        if (("," + chk_class_ids + ",").indexOf("," + data.rows[j].id + ",") >= 0 || (is_set && data.rows.length == 1)) {
                            is_check = "checked=\"checked\"";
                        }
                        if (data.rows[i].grade_id == data.rows[j].grade_id) {
                            var class_name = "";
                            if (!strIsNullOrEmpty(data.rows[j].name)) {
                                class_name = data.rows[j].name + "班 ";
                            }
                            var remark = "";
                            if (!strIsNullOrEmpty(data.rows[j].remark)) {
                                remark = data.rows[j].remark;
                            }
                            listStr += "<div class='bgwhite bbd1'  name=\"chk_class_" + data.rows[j].grade_id + "\">"
                            listStr += "<div class='mlrem intentb classitem  '>";
                            listStr += "<div class='widper100'><label class='label relative widper90 mlper10 classitem'><input type=\"checkbox\" " + is_check + " class=' ckbox ckboxout chk_class 'grade_id=\"" + data.rows[j].grade_id + "\" name=\"real_chk_class_" + data.rows[j].grade_id + "\" class_name=\""
                                        + (strIsNullOrEmpty(data.rows[i].grade_name) ? "" : data.rows[i].grade_name) + class_name + remark + "\" value=\"" + data.rows[j].id + "\" /><span class=' mlonerem inline widper80'>" + class_name + remark + "</span></label></div>";
                            listStr += "</div>";
                            listStr += "</div>";
                        }
                    }
                    grade_ids += data.rows[i].grade_id + ",";
                }

            }
            if (!strIsNullOrEmpty(listStr) && strIsNullOrEmpty(type)) {
                listStr += "<input type=\"button\" id=\"sel_class_ok\" value=\"完成\" />";
            }


        }
    });
    return listStr;

}

//设置年级班级之间的隐藏显示和自动勾选
function gradeClassOption() {

    $("[name=chk_grade]").each(function () {
        var grade_id = $(this).val();
        var chk_count = $("[name=chk_class_" + grade_id + "] :checked").length;
        var count = $("[name=chk_class_" + grade_id + "]").length;
        if (chk_count == count) {
            $(this).attr("checked", "checked");
        }
    });

    if (($("[name=chk_grade]:checked").length + $(".chk_class:checked").length) == ($("[name=chk_grade]").length + $(".chk_class").length)) {
        $("#chk_all").attr("checked", "checked");
    }

    $("[name^=chk_class_]").hide();
    $("[name=chk_class_0]").show();

    $("[name=grade_name]").click(function () {
        var grade_id = $(this).attr("val");
        $("[name=chk_class_" + grade_id + "]").toggle();
    });
    $("[name=chk_grade]").click(function (event) {
        var grade_id = $(this).val();
        if (isChecked($(this))) {
            $("[name=chk_class_" + grade_id + "] .chk_class").attr("checked", "checked")

            //判断是否全选
            if ($("[name=chk_grade]:checked").length == $("[name=chk_grade]").length) {
                $("#chk_all").attr("checked", "checked");
            }
            else {
                $("#chk_all").removeAttr("checked");
            }

        }
        else {
            $("[name=chk_class_" + grade_id + "] .chk_class").removeAttr("checked")
            $("#chk_all").removeAttr("checked");
        }
        ischeck($("[name=chk_class_" + grade_id + "] .chk_class"), false);
        ischeck($("#chk_all"), false);
        ischeck($(this), false);
    });

    $(".chk_class").click(function () {
        var grade_id = $(this).attr("grade_id");
        if (isChecked($(this))) {
            var chk_count = $("[name=real_chk_class_" + grade_id + "]:checked").length;
            var count = $("[name=real_chk_class_" + grade_id + "]").length;
            if (chk_count == count) {
                $("#grade_" + grade_id).attr("checked", "checked");
                //判断是否全选
                if ($("[name=chk_grade]:checked").length == $("[name=chk_grade]").length) {
                    $("#chk_all").attr("checked", "checked");
                }
                else {
                    $("#chk_all").removeAttr("checked");
                }
            }
            else {
                $("#grade_" + grade_id).removeAttr("checked");
                $("#chk_all").removeAttr("checked");
            }
        }
        else {
            $("#grade_" + grade_id).removeAttr("checked");
            $("#chk_all").removeAttr("checked");
        }
        ischeck($("#grade_" + grade_id), false);
        ischeck($("#chk_all"), false);
        ischeck($(this), false);
    });

    //全选
    $("#chk_all").click(function () {
        if (isChecked($(this))) {
            $("[name=chk_grade]").attr("checked", "checked");
            $(".chk_class").attr("checked", "checked");
        }
        else {
            $("[name=chk_grade]").removeAttr("checked");
            $(".chk_class").removeAttr("checked");
        }
        ischeck($("[name=chk_grade]"), false);
        ischeck($(".chk_class"), false);
        ischeck($("#chk_all"), false);
    });
    ischeck($(".chk_class"), false);
    ischeck($("[name=chk_grade]"), false);
    ischeck($("#chk_all"), false);

}

//获取选中的班级
function getClassSelValue() {
    var class_ids = "";
    var class_names = "";
    if (school_id != "0" && $(".chk_class:checked").length == $(".chk_class").length) {
        chk_class_isallchk = 1;
    }
    $(".chk_class").each(function (i) {
        if (isChecked($(this))) {
            if (!strIsNullOrEmpty(class_ids)) {
                class_ids += "," + $(this).val();
                class_names += "," + $(this).attr("class_name");
            }
            else {
                class_ids += $(this).val();
                class_names += $(this).attr("class_name");
            }
        }
    });
    chk_class_ids = class_ids;
    chk_class_names = class_names;
}

//#endregion


//#region 选择考勤时段控件begin 
var chk_attendance_ids = request("chk_attendance_ids");
var chk_attendance_names = request("chk_attendance_names");
var chk_attendance_count = 0;

function selectAttendance(school_id, type, uid) {
    if (strIsNullOrEmpty(school_id)) {
        return;
    }

    var listStr = "";
    $.ajax({
        type: "get",
        async: false,
        url: domain + "api/HomeSchoolCommunication/GetAttendanceList",
        data: {
            uid: uid,
            school_id: school_id,
            type: type
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");
        }, success: function (data) {
            chk_attendance_count = data.rows.length;
            var grade_ids = "";

            if (chk_attendance_count > 1) {
                listStr += checkAll;
            }
            listStr += "<div class=' patb'>"
            for (var j = 0; j < data.rows.length; j++) {

                var is_check = "";
                if (("," + chk_attendance_ids + ",").indexOf("," + data.rows[j].id + ",") >= 0 || data.rows.length == 1) {
                    is_check = "checked=\"checked\"";
                    chk_attendance_names += data.rows[j].name + ",";
                }
                if (data.rows.length - j == 1) {
                    listStr += "<div class='bgitem mlper6 oneline last'>"
                } else {
                    listStr += "<div class='bgitem mlper6 oneline'>"
                }
                listStr += "<label class='label relative'><input type=\"checkbox\" " + is_check + " class=\" ckbox ckboxout chk_attendance\" class_name=\"" + data.rows[j].name + "\" value=\"" + data.rows[j].id + "\" /><span class='mlrem'>" + data.rows[j].name + "</span></label>"
                listStr += "</div>";
            }
            listStr += "</div>"
            if (!strIsNullOrEmpty(listStr) && strIsNullOrEmpty(type)) {
                listStr += "<input type=\"button\" id=\"sel_attendance_ok\" value=\"完成\" />";
            }


        }
    });
    return listStr;

}

function attendanceOption() {

    if (($(".chk_attendance:checked").length) == ($(".chk_attendance").length)) {
        $("#chk_all").attr("checked", "checked");
    }
    ischeck($("#chk_all"), false);
    ischeck($(".chk_attendance"), false);

    $(".chk_attendance").click(function () {
        if (isChecked($(this))) {

            if (($(".chk_attendance:checked").length) == ($(".chk_attendance").length)) {
                $("#chk_all").attr("checked", "checked");
            }
            else {
                $("#chk_all").removeAttr("checked");
            }
        }
        else {
            $("#chk_all").removeAttr("checked");
        }
        ischeck($("#chk_all"), false);
        ischeck($(this), false);
    });

    //全选
    $("#chk_all").click(function () {
        if (isChecked($(this))) {
            $(".chk_attendance").attr("checked", "checked");
        }
        else {
            $(".chk_attendance").removeAttr("checked");
        }
        ischeck($(this), false);
        ischeck($(".chk_attendance"), false);
    });
}

function getAttendanceSelValue() {
    var attendance_ids = "";
    var attendance_names = "";
    $(".chk_attendance").each(function (i) {
        if (isChecked($(this))) {
            if (!strIsNullOrEmpty(attendance_ids)) {
                attendance_ids += "," + $(this).val();
                attendance_names += "," + $(this).attr("class_name");
            }
            else {
                attendance_ids += $(this).val();
                attendance_names += $(this).attr("class_name");
            }
        }
    });
    chk_attendance_ids = attendance_ids;
    chk_attendance_names = attendance_names;
}
//#endregion 


//#region  选择宿舍控件begin  

var chk_room_ids = request("chk_room_ids");
var chk_room_names = request("chk_room_names");
var chk_room_count = 0;

//加载宿舍列表  
function selectRoom(school_id) {

    if (strIsNullOrEmpty(school_id)) {
        return;
    }

    var listStr = "";
    $.ajax({
        type: "get",
        async: false,
        url: domain + "api/HomeSchoolCommunication/GetAllRoom",
        data: {
            school_id: school_id
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");
        }, success: function (data) {
            chk_room_count = data.rows.length;
            var dorm_ids = "";

            if (chk_room_count > 1) {
                listStr += checkAll;
            }
            for (var i = 0; i < data.rows.length; i++) {
                if (("," + dorm_ids + ",").indexOf("," + data.rows[i].dorm_id + ",") < 0) {
                    listStr += "<div class=' bgwhite mt2 bb1 '>";
                    listStr += "<div class='classitem indentb wb widper90'><div class='relative label mtonerem mlper6'><input class='ckbox ckboxout ' type=\"checkbox\" id=\"dorm_" + data.rows[i].dorm_id + "\" name=\"chk_dorm\" value=\"" + data.rows[i].dorm_id + "\" /></div>"
                    listStr += "<label class='block widper80'  name=\"dorm_name\" val=\"" + data.rows[i].dorm_id + "\"><div class='widper70'>" + data.rows[i].dorm_name + "</div></label></div>";
                    listStr += "</div>"

                    for (var j = 0; j < data.rows.length; j++) {
                        if ((("," + chk_room_ids + ",").indexOf("," + data.rows[j].id + ",") >= 0 || data.rows.length == 1) && ("," + chk_room_names + ",").indexOf("," + data.rows[j].name + ",") < 0 && data.rows[i].dorm_id == data.rows[j].dorm_id) {
                            chk_room_names += data.rows[j].name + ",";
                        }
                        var is_check = "";
                        if (("," + chk_room_ids + ",").indexOf("," + data.rows[j].id + ",") >= 0 || data.rows.length == 1) {
                            is_check = "checked=\"checked\"";
                        }
                        if (data.rows[i].dorm_id == data.rows[j].dorm_id) {
                            listStr += "<div class='dormitry' name=\"chk_room_" + data.rows[j].dorm_id + "\">"
                            listStr += "<label  class='relative label'><input type=\"checkbox\" " + is_check + " name=\"real_chk_room_" + data.rows[j].dorm_id + "\" dorm_id=\"" + data.rows[j].dorm_id + "\" class=\" ckbox ckboxout chk_room\" room_name=\"" + data.rows[j].name + "\" value=\"" + data.rows[j].id + "\" /><div class='tcenter mt3 break'>" + data.rows[j].name + "</div></label>"
                            listStr += "</div>";
                        }
                    }
                    dorm_ids += data.rows[i].dorm_id + ",";
                }

            }
            if (!strIsNullOrEmpty(listStr) && strIsNullOrEmpty(type)) {
                listStr += "<input type=\"button\" id=\"sel_room_ok\" value=\"完成\" />";
            }


        }
    });
    return listStr;

}

//设置栋和宿舍之间的隐藏显示和自动勾选
function dormRoomOption() {

    $("[name=chk_dorm]").each(function () {
        var dorm_id = $(this).val();
        var chk_count = $("[name=chk_room_" + dorm_id + "] :checked").length;
        var count = $("[name=chk_room_" + dorm_id + "]").length;
        if (chk_count == count) {
            $(this).attr("checked", true);
        }
    });

    if (($("[name=chk_dorm]:checked").length + $(".chk_room:checked").length) == ($("[name=chk_dorm]").length + $(".chk_room").length)) {
        $("#chk_all").attr("checked", "checked");
    }

    ischeck($("[name=chk_dorm]"), false);
    ischeck($(".chk_room"), false);
    ischeck($("#chk_all"), false);

    $("[name=dorm_name]").click(function () {
        var dorm_id = $(this).attr("val");
        $("[name=chk_room_" + dorm_id + "]").toggle();
    });

    $("[name=chk_dorm]").click(function (event) {
        var dorm_id = $(this).val();
        if (isChecked($(this))) {
            $("[name=chk_room_" + dorm_id + "] .chk_room").attr("checked", "checked")

            //判断是否全选
            if ($("[name=chk_dorm]:checked").length == $("[name=chk_dorm]").length) {
                $("#chk_all").attr("checked", "checked");
            }
            else {
                $("#chk_all").removeAttr("checked");
            }
        }
        else {
            $("[name=chk_room_" + dorm_id + "] .chk_room").removeAttr("checked")
            $("#chk_all").removeAttr("checked");
        }
        event.stopPropagation();

        ischeck($("[name=chk_room_" + dorm_id + "] .chk_room"), false);
        ischeck($("#chk_all"), false);
        ischeck($(this), false);
    });

    $(".chk_room").click(function () {
        var dorm_id = $(this).attr("dorm_id");
        if (isChecked($(this))) {
            var chk_count = $("[name=real_chk_room_" + dorm_id + "]:checked").length;
            var count = $("[name=real_chk_room_" + dorm_id + "]").length;
            if (chk_count == count) {
                $("#dorm_" + dorm_id).attr("checked", "checked");
                //判断是否全选
                if ($("[name=chk_dorm]:checked").length == $("[name=chk_dorm]").length) {
                    $("#chk_all").attr("checked", "checked");
                }
                else {
                    $("#chk_all").removeAttr("checked");
                }
            }
            else {
                $("#dorm_" + dorm_id).removeAttr("checked");
                $("#chk_all").removeAttr("checked");
            }
        }
        else {
            $("#dorm_" + dorm_id).removeAttr("checked");
            $("#chk_all").removeAttr("checked");
        }

        ischeck($("#dorm_" + dorm_id), false);
        ischeck($("#chk_all"), false);
        ischeck($(this), false);
    });

    //全选
    $("#chk_all").click(function () {
        if (isChecked($(this))) {
            $("[name=chk_dorm]").attr("checked", "checked");
            $(".chk_room").attr("checked", "checked");
        }
        else {
            $("[name=chk_dorm]").removeAttr("checked");
            $(".chk_room").removeAttr("checked");
        }
        ischeck($("[name=chk_dorm]"), false);
        ischeck($(".chk_room"), false);
        ischeck($(this), false);
    });
}

//获取选中的宿舍
function getRoomSelValue() {
    var room_ids = "";
    var room_names = "";
    $(".chk_room").each(function (i) {
        if (isChecked($(this))) {
            if (!strIsNullOrEmpty(room_ids)) {
                room_ids += "," + $(this).val();
                room_names += "," + $(this).attr("room_name");
            }
            else {
                room_ids += $(this).val();
                room_names += $(this).attr("room_name");
            }
        }
    });
    chk_room_ids = room_ids;
    chk_room_names = room_names;
}


//#endregion


//#region 选择用户组控件begin 
var chk_group_ids = request("chk_group_ids");
var chk_group_names = request("chk_group_names");
var chk_group_count = 0;
var has_teacher = 0;
var has_group = 0;
var has_genearch = 0;

function selectGroup(school_id, uid, obj_type) {
    if (strIsNullOrEmpty(school_id)) {
        return;
    }

    var chk_gen = "";
    var chk_teach = "";
    if (((obj_type == "0" || obj_type == "4" || obj_type == "6") && !strIsNullOrEmpty(chk_group_ids)) || obj_type == "2") {
        chk_gen = " checked=\"checked\"";
        has_genearch = 1;
    }
    else {
        has_genearch = 0;
    }
    if (((obj_type == "0" || obj_type == "4" || obj_type == "5") && !strIsNullOrEmpty(chk_group_ids)) || obj_type == "1") {
        chk_teach = " checked=\"checked\"";
        has_teacher = 1;
    }
    else {
        has_teacher = 0;
    }
    var genearch = "<div class='bb1 oneline'><label class='mlper6 label relative'><input type=\"checkbox\" " + chk_gen + " id=\"genearch\" class='ckbox ckboxout' /><span class='mlrem'>家长</span></label></div>";
    var listStr = "";
    $.ajax({
        type: "get",
        async: false,
        url: domain + "api/HomeSchoolCommunication/GetUserGroup",
        data: {
            schoolId: school_id,
            name: null,
            agentId: null,
            uid: uid
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");
        }, success: function (data) {
            chk_group_count = data.rows.length + 1;
            var grade_ids = "";
            listStr  += "<div class='classbg'>"
            listStr += checkAll;
            listStr += genearch;
            listStr += "<div class='bb1 oneline'>"
            for (var j = 0; j < data.rows.length; j++) {
                has_group = 1;
                var is_check = "";
                if (("," + chk_group_ids + ",").indexOf("," + data.rows[j].id + ",") >= 0 || data.rows.length == 1) {
                    is_check = "checked=\"checked\"";
                    chk_group_names += data.rows[j].name + ",";
                }
                if (data.rows.length - j == 1) {
                    listStr += "<div class='oneline bgwhite '>"
                } else {
                    listStr += "<div class='oneline bgwhite bb1'>"
                }
                listStr += "<label class='mlper6 label relative '><input type=\"checkbox\" " + is_check + " class=\" ckbox ckboxout chk_group\" group_name=\"" + data.rows[j].name + "\" value=\"" + data.rows[j].id + "\" /><span class='mlrem'>" + data.rows[j].name + "</span></label></div>";

            }
            if (data.rows.length == 0) {
                listStr += "<label class='mlper6 label relative'><input type=\"checkbox\" " + chk_teach + " id=\"teacher\" class='ckbox ckboxout' /><span class='mlrem'>老师</span></label>";
                chk_group_count++;
            }
            listStr += "</div>";
            if (!strIsNullOrEmpty(listStr) && strIsNullOrEmpty(type)) {
                listStr += "<input type=\"button\" id=\"sel_group_ok\" value=\"完成\" />";
            }
           listStr += "</div>"


        }
    });
    return listStr;

}

function groupOption() {

    if (($(".chk_group:checked").length) == ($(".chk_group").length) && isChecked($("#genearch")) && (($(".chk_group").length == 0 && isChecked($("#teacher"))) || $(".chk_group").length > 0)) {
        $("#chk_all").attr("checked", "checked");
        ischeck($("#chk_all"), false);
    }
    ischeck($(".chk_group"), false);
    ischeck($("#genearch"), false);
    ischeck($("#teacher"), false);

    $(".chk_group").click(function () {
        if (isChecked($(this))) {
            if (($(".chk_group:checked").length) == ($(".chk_group").length) && isChecked($("#genearch"))) {
                $("#chk_all").attr("checked", "checked");
            }
            else {
                $("#chk_all").removeAttr("checked");
            }
        }
        else {
            $("#chk_all").removeAttr("checked");
        }
        ischeck($("#chk_all"), false);
        ischeck($(this), false);
    });
    $("#genearch").click(function () {
        var chk_teacher = isChecked($("#teacher"));
        if (has_group == 1) {
            chk_teacher = true;
        }
        if (isChecked($(this))) {
            has_genearch = 1;
            if (($(".chk_group:checked").length) == ($(".chk_group").length) && isChecked($("#genearch")) && chk_teacher) {
                $("#chk_all").attr("checked", "checked");
            }
            else {
                $("#chk_all").removeAttr("checked");
            }
        }
        else {
            has_genearch = 0;
            $("#chk_all").removeAttr("checked");
        }
        ischeck($("#chk_all"), false);
        ischeck($(this), false);
    });
    $("#teacher").click(function () {
        if (isChecked($(this))) {
            has_teacher = 1;
            if (isChecked($("#teacher")) && isChecked($("#genearch"))) {
                $("#chk_all").attr("checked", "checked");
            }
            else {
                $("#chk_all").removeAttr("checked");
            }
        }
        else {
            has_teacher = 0;
            $("#chk_all").removeAttr("checked");
        }
        ischeck($("#chk_all"), false);
        ischeck($(this), false);
    });
    //全选
    $("#chk_all").click(function () {
        if (isChecked($(this))) {
            $(".chk_group").attr("checked", "checked");
            $("#genearch").attr("checked", "checked");
            $("#teacher").attr("checked", "checked");
        }
        else {
            $(".chk_group").removeAttr("checked");
            $("#genearch").removeAttr("checked");
            $("#teacher").removeAttr("checked");
        }
        ischeck($(".chk_group"), false);
        ischeck($(this), false);
        ischeck($("#genearch"), false);
        ischeck($("#teacher"), false);
    });
}

function getGroupSelValue() {
    var group_ids = "";
    var group_names = "";
    $(".chk_group").each(function (i) {
        if (isChecked($(this))) {
            has_teacher = 1;
            if (!strIsNullOrEmpty(group_ids)) {
                group_ids += "," + $(this).val();
                group_names += "," + $(this).attr("group_name");
            }
            else {
                group_ids += $(this).val();
                group_names += $(this).attr("group_name");
            }
        }
    });
    if (isChecked($("#genearch"))) {
        has_genearch = 1;
        if (!strIsNullOrEmpty(group_names)) {
            group_names = "家长," + group_names;
        }
        else {
            group_names = "家长";
        }
    }
    else {
        has_genearch = 0;
    }
    if (isChecked($("#teacher"))) {
        has_teacher = 1;
        if (!strIsNullOrEmpty(group_names)) {
            group_names = group_names + ",老师";
        }
        else {
            group_names = "老师";
        }
    }
    else {
        has_teacher = 0;
    }
    if (!strIsNullOrEmpty(group_ids)) {
        has_teacher = 1;
    }

    chk_group_ids = group_ids;
    chk_group_names = group_names;
}

//#endregion


//#region 选择子女控件begin
var chk_student_id = request("chk_student_id");
var chk_student_name = request("chk_student_name");
var chk_student_count = 0;

function selectStudent(uid, classid) {
    if (strIsNullOrEmpty(classid) || strIsNullOrEmpty(uid)) {
        return "";
    }

    var listStr = "";
    $.ajax({
        type: "get",
        async: false,
        url: domain + "api/HSCForImageURL/GetGenearchList",
        data: {
            classid: classid,
            uid: uid
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            error("您当前的网络不稳定，请稍后重试。(" + XMLHttpRequest.status.toString() + ")");
        }, success: function (data) {
            chk_student_count = data.rows.length;
            var grade_ids = "";

            for (var j = 0; j < data.rows.length; j++) {

                var is_check = "";
                if (chk_student_id == data.rows[j].uid) {
                    is_check = "checked=\"checked\"";
                    chk_student_name += data.rows[j].real_name_child;
                }
                listStr += "<div class='wb widper100 bb1 bgwhite pab'>"
                if (strIsNullOrEmpty(data.rows[j].u_img)) {
                    listStr += '<img class="headimg"  src="../../images/default-avatar.png" />';
                }
                else {
                    listStr += '<img class="headimg" onerror="onerror=null;src=\'../../images/default-avatar.png\'"  src="' + data.rows[j].u_img + '" />';
                }
                listStr += "<label class='block  palr oneline mtonerem '><input type=\"radio\" " + is_check + " class='chk_student' student_name=\"" + data.rows[j].real_name_child
                            + "\" grade_id=\"" + data.rows[j].grade_id + "\" class_id=\"" + data.rows[j].class_id + "\" value=\"" + data.rows[j].uid_child + "\" />"
                            + data.rows[j].real_name_child + "</label></div>";

            }


        }
    });
    return listStr;

}

function getStudentSelValue() {
    $(".chk_student").each(function (i) {
        if (isChecked($(this))) {
            chk_student_id = $(this).val();
            chk_student_name = $(this).attr("student_name");
            return;
        }
    });
}
//#endregion

