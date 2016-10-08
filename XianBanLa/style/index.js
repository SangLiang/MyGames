function GetTime() {
    var Xiaoshi = document.getElementById("Xiaoshi").value;
    var Fenzhong = document.getElementById("Fenzhong").value;
    var DontDisplay = false;
    var myDate = new Date();
    var DateHour = myDate.getHours();//获得机器当前小时
    var DateMin = myDate.getMinutes();//获得机器当前分钟
    if (Fenzhong == "0" || Fenzhong == "00") {
        Fenzhong = Fenzhong + 60;
        DateHour = DateHour + 1;
    }
    var Cha_Xiaoshi = Xiaoshi - DateHour;
    var Cha_Fenzhong = Fenzhong - DateMin;
    if (Cha_Fenzhong < 0) {
        Cha_Fenzhong += 60;
        Cha_Xiaoshi = Cha_Xiaoshi - 1;
        if (Cha_Xiaoshi < 0) {
            DontDisplay=true;
            alert("错误");
        }
    }
    if(DontDisplay==false){
        alert("现在距离下班还要" + Cha_Xiaoshi + "小时" + Cha_Fenzhong + "分钟");
    }
}