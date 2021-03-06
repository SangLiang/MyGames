﻿document.write('<script src="js/value.js"></script>');
document.write('<script src="js/gamePageOne.js"></script>');
document.write('<script src="js/gamePageTwo.js"></script>');
document.write('<script src="js/gameClear.js"></script>');
document.write('<script src="js/nextPage.js"></script>');
document.write('<script src="js/distance.js"></script>');
document.write('<script src="js/ChoosePerson.js"></script>');
document.write('<script src="js/showScore.js"></script>');
document.write('<script src="js/gameOverPage.js"></script>');
document.write('<script src="js/nextPage3.js"></script>');
document.write('<script src="js/gamePageThree.js"></script>');
document.write('<script src="js/nextPage2.js"></script>');

init(1000 / 60, "gamePanel", 900, 640, main);
//ai射门力量
var force = 600;
//var isballLive=true;
//按f2全屏测试
function test2(e) {
	if (e.keyCode == 113) {
		LGlobal.stageScale = LStageScaleMode.SHOW_ALL;
		LGlobal.screen(LStage.FULL_SCREEN);
	}
}

//---------游戏入口---------
function main() {
	LGlobal.webAudio = false;
	sound = new LSound();
	LGlobal.setDebug(true);
	backGroundLayer = new LSprite();
	backGroundLayer.graphics.drawRect(1, "#000", [0, 0, 900, 640], true, "#000");
	addChild(backGroundLayer);

	loadingLayer = new LoadingSample4();
	backGroundLayer.addChild(loadingLayer);

	LLoadManage.load(
		imgData,
		function (progress) {
		loadingLayer.setProgress(progress);
	},
		gameInit);
	LGlobal.box2d = new LBox2d();
	LGlobal.stage.addEventListener(LKeyboardEvent.KEY_DOWN, test2);
}

//-----欢迎页面开始-----
function gameInit(result) {
	imglist = result;
	backGroundLayer.removeChild(loadingLayer);
	loadingLayer = null;

	LGlobal.setDebug(true);
	welcomePage();

}

var player,player2;

function welcomePage() {
	
	var loginInPage = new LSprite();
	loginInPage = new LBitmap(new LBitmapData(imglist["loginIn"]));
	backGroundLayer.addChild(loginInPage);

	var neimaerMove = new LSprite();
	var list = LGlobal.divideCoordinate(167, 332, 4, 4);

	var playerRandom = Math.floor(Math.random() * 4);
	var data = new LBitmapData(imglist["neimaerMove"], 0, 0, 42, 83);
	player = neimaerMove = new LAnimationTimeline(data, list);
	player.setAction(playerRandom);
	player.speed = 5;
	neimaerMove.x = 440;
	neimaerMove.y = 250;
	backGroundLayer.addChild(neimaerMove);

	var clickText = new LTextField();
	backGroundLayer.addChild(clickText);
	clickText.color = "#fff";
	clickText.size = 50;
	clickText.x = 250;
	clickText.y = 120;
	clickText.stroke = true;
	clickText.lineWidth = 2;
	clickText.lineColor = "#57a520";
	backGroundLayer.addChild(clickText);

	var login = new LSprite();
	login.graphics.drawRect(0, '#fff', [0, 0, 195, 34]);
	backGroundLayer.addChild(login);

	theTextField = new LTextField();
	theTextField.setType(LTextFieldType.INPUT, login);
	theTextField.x = 325;
	theTextField.y = 350;
	theTextField.color = '#000';
	backGroundLayer.addChild(theTextField);
	theTextField.addEventListener(LTextEvent.TEXT_INPUT, textInput);

	theTextField.addEventListener(LFocusEvent.FOCUS_IN, onfocus);
	theTextField.addEventListener(LFocusEvent.FOCUS_OUT, outfocus);

	//GO
	var bitmapUp = new LBitmap(new LBitmapData(imglist["GO"]));
	var bitmapOver = new LBitmap(new LBitmapData(imglist["GO"]));
	var buttonEnter = new LButton(bitmapUp, bitmapOver);
	backGroundLayer.addChild(buttonEnter);
	buttonEnter.x = 537;
	buttonEnter.y = 350;
	buttonEnter.addEventListener(LMouseEvent.MOUSE_DOWN, loginIn);

}

function enterCode(e) {
	loginIn();
}

function textInput(e) {

	if (e.keyCode != 13) {
		for (var i = 0; i < 1; i++) {
			userNameArr[i] = e.keyCode;
		}
		for (j = 0; j < userNameArr.length; j++) {
			userNameTemp[j] = String.fromCharCode(userNameArr[j]);
			userName += userNameTemp[j];
			//console.warn(userName.toLowerCase().substring(9));
		}
	} else {
		LGlobal.stage.addEventListener(LKeyboardEvent.KEY_DOWN, enterCode);
	}
}

//-----欢迎页面结束-----

//登录界面
function loginIn() {
	$("#gamePanel_InputTextBox").css('display', 'none');
	window.clearInterval(t);
	window.clearInterval(ai);
	//window.clearInterval(clock_distance);
	//window.clearInterval(getsecond);
	clock_distance_iswork = false;
	isballLive=false;
	backGroundLayer.die();
	backGroundLayer.removeAllChild();

	SysSecondOne = parseInt(startTime);
	selfScore = 0;
	enemyScore = 0;
	var welcomePage = new LSprite();
	welcomePage = new LBitmap(new LBitmapData(imglist["welcome1"]));
	backGroundLayer.addChild(welcomePage);

	//选择人物按钮
	var bitmapUp = new LBitmap(new LBitmapData(imglist["buttons"], 0, 0, 156, 26));
	var bitmapOver = new LBitmap(new LBitmapData(imglist["buttons"], 156, 0, 156, 26));
	var buttonEnter = new LButton(bitmapUp, bitmapOver);
	backGroundLayer.addChild(buttonEnter);
	buttonEnter.x = 390;
	buttonEnter.y = 280;
	buttonEnter.addEventListener(LMouseEvent.MOUSE_DOWN, ChoosePerson);

	//排行榜按钮
    /*
	var bitmapUp = new LBitmap(new LBitmapData(imglist["buttons"], 0, 26, 156, 26));
	var bitmapOver = new LBitmap(new LBitmapData(imglist["buttons"], 156, 26, 156, 26));
	var gradeScore = new LButton(bitmapUp, bitmapOver);
	backGroundLayer.addChild(gradeScore);
	gradeScore.x = 390;
	gradeScore.y = 320;
	gradeScore.addEventListener(LMouseEvent.MOUSE_DOWN, Billboard);
	*/
	var buttonNew = new LSprite();
	buttonNew.graphics.drawRect(0, "#000", [450, 110, 130, 50],false);
	backGroundLayer.addChild(buttonNew);
	var playerName = new LTextField();
	backGroundLayer.addChild(playerName);
	playerName.text = document.getElementById("gamePanel_InputTextBox").value;
	playerName.x = 450;
	playerName.y = 110;
    playerName.size = 30;
	playerName.color = "#92563c";
	playerName.font = "Arial";
	playerName.weight = "bold";
	buttonNew.addChild(playerName);

}
//输入框
function onfocus(e) {
	e.currentTarget.size = 15;
}
function outfocus(e) {
	e.currentTarget.size = 15;
}

//---国家比分-----
function scoreText() {
	resultScore = new LSprite();
	resultScore.graphics.drawRect(0, '#f80', [0, 0, 670, 30], false, '#000');
	resultScore.x = 100;
	resultScore.y = 45;
	backGroundLayer.addChild(resultScore);
	//------------记分牌------------
	resultArgentina = new LTextField();
	scoreNumberLeft = new LTextField();
	scoreNumberLeft.text = selfScore;
	scoreNumberLeft.color = "#FFF";
	scoreNumberLeft.size = "18";
	scoreNumberLeft.x = 317;
	scoreNumberLeft.y = 7;

	if (temp == 0) {
		resultArgentina.text = '阿根廷';
	}
	if (temp == 1) {
		resultArgentina.text = '巴西';
	}
	if (temp == 2) {
		resultArgentina.text = '德国';
	}
	if (temp == 3) {
		resultArgentina.text = '葡萄牙';
	}
	resultArgentina.weight = 'bolder';
	resultArgentina.color = '#fff';
	resultArgentina.x = 20;
	resultArgentina.y = 10;
	resultScore.addChild(resultArgentina);
	resultScore.addChild(scoreNumberLeft);

	resultBrazil = new LTextField();
	scoreNumberRight = new LTextField();
	scoreNumberRight.text = enemyScore;
	scoreNumberRight.x = 380;
	scoreNumberRight.y = 7;
	scoreNumberRight.color = "#FFF";
	scoreNumberRight.size = "18";

	if (tempEn == 0) {
		resultBrazil.text = '阿根廷';
	}
	if (tempEn == 1) {
		resultBrazil.text = '巴西';
	}
	if (tempEn == 2) {
		resultBrazil.text = '德国';
	}
	if (tempEn == 3) {
		resultBrazil.text = '葡萄牙';
	}
	resultBrazil.weight = 'bolder';
	resultBrazil.color = '#fff';
	resultBrazil.x = 600;
	resultBrazil.y = 10;
	resultScore.addChild(resultBrazil);
	resultScore.addChild(scoreNumberRight);
	//----------记分牌结束-------------
	//-----碰撞侦听事件------
	LGlobal.box2d.setEvent(LEvent.POST_SOLVE, postSolve);
}

//------------播放音乐-----------------
function onup(e) {
	if (sound.length == 0) {
		var url = './sound/2014Soccer.mp3';
		sound.load(url);
		sound.addEventListener(LEvent.COMPLETE, loadOver);
	} else if (sound.playing) {
		sound.stop();
	} else {
		sound.play();
	}
}
function loadOver(e) {
	sound.play();
}

//----------物体碰撞边界----------
function Bound() {
	BoundTop = new LSprite();
	backGroundLayer.addChild(BoundTop);
	var shapeArray = [
		[[65, 80], [70, 80], [70, 600], [65, 600]],
		[[65, 80], [845, 80], [845, 85], [65, 85]],
		[[845, 80], [845, 600], [840, 600], [840, 80]],
		[[65, 600], [70, 590], [845, 590], [845, 600]]
	];
	BoundTop.addBodyVertices(shapeArray, 0, 0, 0, .5, .4, .5);

	//-----------设置球门-------------
	ballDoor = new LSprite();
	backGroundLayer.addChild(ballDoor);
	ballDoor.graphics.drawRect(0, '#f47969', [808, 290, 35, 105], true, "#f47969");
	ballDoor.graphics.drawRect(0, '#f47969', [67, 288, 35, 105], true, "#f47969");
}

//给球施加力
function force_ball() {
	if (tag_run == false&&isballLive==true) {
	
			if (enY < 287 / 30) {
				var vec = new LGlobal.box2d.b2Vec2(-force, force);
				ballLayer.box2dBody.ApplyForce(vec, ballLayer.box2dBody.GetWorldCenter());
			}
			if (enY > 392 / 30) {
				var vec = new LGlobal.box2d.b2Vec2(-force, -force);
				ballLayer.box2dBody.ApplyForce(vec, ballLayer.box2dBody.GetWorldCenter());
			} else {
				var vec = new LGlobal.box2d.b2Vec2(-force, 0);
				ballLayer.box2dBody.ApplyForce(vec, ballLayer.box2dBody.GetWorldCenter());
			}
		

	}
}

//-----------------------排行榜界面开始--------------------
function Billboard() {

	backGroundLayer.die();
	backGroundLayer.removeAllChild();
	var scoreChart = new LSprite();
	scoreChart = new LBitmap(new LBitmapData(imglist["demobg"]));
	backGroundLayer.addChild(scoreChart);

	//返回首页
	var bitmapUp = new LBitmap(new LBitmapData(imglist["returnBg"], 11, 5, 187, 60));
	var bitmapOver = new LBitmap(new LBitmapData(imglist["returnBg"], 11, 75, 187, 60));
	var buttonExit = new LButton(bitmapUp, bitmapOver);
	backGroundLayer.addChild(buttonExit);
	buttonExit.x = 690;
	buttonExit.y = 570;
	buttonExit.addEventListener(LMouseEvent.MOUSE_DOWN, loginIn);

}