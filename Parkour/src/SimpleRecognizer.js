function Point(x, y)
{
    this.X = x;
    this.Y = y;
}

// 定义类
function SimpleRecognizer()
{
    this.points = [];
    this.result = "";
}

//被onTouchBegan调用
SimpleRecognizer.prototype.beginPoint = function(x, y) {
    this.points = [];
    this.result = "";
    this.points.push(new Point(x, y));
}

// 被 onTouchMoved调用
SimpleRecognizer.prototype.movePoint = function(x, y) {
    this.points.push(new Point(x, y));

    if (this.result == "not support") {
        return;
    }

    var newRtn = "";
    var len = this.points.length;
    var dx = this.points[len - 1].X - this.points[len - 2].X;
    var dy = this.points[len - 1].Y - this.points[len - 2].Y;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
            newRtn = "right";
        } else {
            newRtn = "left";
        }
    } else {
        if (dy > 0) {
            newRtn = "up";
        } else {
            newRtn = "down";
        }
    }

    // 第一步的结果设置
    if (this.result == "") {
        this.result = newRtn;
        return;
    }


    if (this.result != newRtn) {
        this.result = "not support";
    }
}


SimpleRecognizer.prototype.endPoint = function() {
    if (this.points.length < 3) {
        return "error";
    }
    return this.result;
}

SimpleRecognizer.prototype.getPoints = function() {
    return this.points;
}
