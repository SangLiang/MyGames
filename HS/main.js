/**
 * description:Hamster测试游戏，简化版炉石传说
 * author:Sa
 * e-mail:378305868@qq.com
 * engine version:Hamster-v0.0.1
 * date:2016-11-3
 */
Hamster.init("main", 800, 600);

/**
 * 用户手牌class
 */
function HandCard() {
	this.cardList = this.buildHandCardList(20, 4);
	this.showHandCardFive(this.cardList);
}

// 生成所有的卡组，暂定15张
HandCard.prototype.buildHandCardList = function(num, randomRange) {
		var _list = [];
		for (var i = 0; i < num; i++) {
			var _num = Math.floor(Math.random() * randomRange);
			var _temp = new Hamster.UI.Button({
				"name": "_temp",
				"imageName": CARD_INFO[_num]["name"],
				"x": 180 + 80 * i,
				"y": 460
			});
			_temp.setSize(85, 120);
			_temp.status = "normal"; //卡牌的状态
			_temp.fee = CARD_INFO[_num]["fee"];
			_temp.attack = CARD_INFO[_num]["attack"];
			_temp.hp = CARD_INFO[_num]["hp"];
			_temp.name = CARD_INFO[_num]["name"];
			_temp.cnName = CARD_INFO[_num]["cn_name"];
			_list.push(_temp);
		}
		return _list;
	}
	// 展示手上的4张卡牌
HandCard.prototype.showHandCardFive = function(handCardList) {
	var _templist = handCardList.splice(0, 4);
	GAME_DATA.heroHandCardList = _templist;
	for (var i = 0; i < _templist.length; i++) {
		_templist[i].x = 180 + 80 * i;

		// 给生成出来的卡片添加点击事件
		Hamster.addEventListener(_templist[i], "click", function() {
			if (this.status == "normal") {
				for (var i = 0; i < _templist.length; i++) {
					_templist[i].status = "normal";
					_templist[i].setSize(85, 120);
					_templist[i].y = 460;
					_templist[i].index = 0;
				}
				GAME_DATA.choiseCard = null;
				GAME_DATA.choiseCard = this;
				this.setSize(150, 180);
				this.y = 420;
				this.setIndex(1000);
				this.status = "click";
			} else {
				this.setSize(85, 120);
				this.status = "normal";
				GAME_DATA.choiseCard = null;
				this.y = 460;
				this.index = 0;
			}
		});
		Hamster.add(_templist[i]);
	}
}

HandCard.prototype.refresh = function(side) {
	if (side == "hero") {
		var temp = GAME_DATA.heroHandCardList;
		var _distant = 80;
	} else if (side == "enemy") {
		var temp = GAME_DATA.enemyHandCardList;
		var _distant = 85;
	}

	for (var i = 0; i < temp.length; i++) {
		temp[i].x = 180 + _distant * i;
	}
}

// 补牌
HandCard.prototype.addCard = function() {
	if (this.cardList.length <= 0) {
		return;
	}
	var _temp = this.cardList.splice(0, 1)[0];
	if (GAME_DATA.heroHandCardList.length > 6) {
		alert("您的手牌已经满了");
		return;
	}
	_temp.x = 180 + (GAME_DATA.heroHandCardList.length) * 80;
	Hamster.addEventListener(_temp, "click", function() {
		if (this.status == "normal") {
			for (var i = 0; i < GAME_DATA.heroHandCardList.length; i++) {
				GAME_DATA.heroHandCardList[i].status = "normal";
				GAME_DATA.heroHandCardList[i].setSize(85, 120);
				GAME_DATA.heroHandCardList[i].y = 460;
				GAME_DATA.heroHandCardList[i].index = 0;
			}

			GAME_DATA.choiseCard = null;
			GAME_DATA.choiseCard = this;
			this.setSize(150, 180);
			this.y = 420;
			this.setIndex(1000);
			this.status = "click";
		} else {
			this.setSize(85, 120);
			this.status = "normal";
			GAME_DATA.choiseCard = null;
			this.y = 460;
			this.index = 0;
		}
	});
	GAME_DATA.heroHandCardList.push(_temp);

	Hamster.add(_temp);
}

/**
 * ---敌人手牌类
 */
function EnemyCard() {
	this.cardList = this.buildHandCardList(20, 4);
	this.showHandCardFive(this.cardList);
}
Hamster.extend(EnemyCard, HandCard);

EnemyCard.prototype.buildHandCardList = function(num, randomRange) {
	var _list = [];
	for (var i = 0; i < num; i++) {
		var _num = Math.floor(Math.random() * randomRange);
		var _temp = new Hamster.UI.Button({
			"name": CARD_INFO[_num]["name"],
			"imageName": "card_back",
			"x": 110 + (85 * (i + 1)),
			"y": 20
		});
		_temp.setSize(85, 120);
		_temp.fee = CARD_INFO[_num]["fee"];
		_temp.attack = CARD_INFO[_num]["attack"];
		_temp.hp = CARD_INFO[_num]["hp"];
		_temp.name = CARD_INFO[_num]["name"];
		_temp.cnName = CARD_INFO[_num]["cn_name"];
		_list.push(_temp);
	}
	return _list;
}

// 重写show方法
EnemyCard.prototype.showHandCardFive = function(handCardList) {
	var _templist = handCardList.splice(0, 4);
	GAME_DATA.enemyHandCardList = _templist;
	for (var i = 0; i < _templist.length; i++) {
		Hamster.add(_templist[i]);
	}
}

EnemyCard.prototype.addCard = function() {
	console.log(this.cardList.length);
	if (this.cardList.length <= 0) {
		return;
	}
	var _temp = this.cardList.splice(0, 1)[0];
	_temp.x = 180 + (GAME_DATA.enemyHandCardList.length) * 85;
	GAME_DATA.enemyHandCardList.push(_temp);
	Hamster.add(_temp);
}

/**
 * 玩家战斗角色类
 * @param side {string} "hero":本方角色  "enemy":敌方角色
 */
function HeroFighter(side) {
	this.side = side;
}

/**
 * 生成战斗角色
 * @param obj  
 */
HeroFighter.prototype.buildFighter = function(obj) {
	if (!obj) {
		return;
	}
	var _temp = new Hamster.UI.Button({
		"name": obj.name + "_fighter",
		"imageName": obj.imageName + "_fight",
		"x": 0,
		"y": 300
	});
	_temp.fee = obj.fee;
	_temp.attack = obj.attack;
	_temp.hp = obj.hp;
	_temp.action = 0;
	_temp.side = this.side; //角色阵营
	_temp.cnName = obj.cnName;
	return _temp;
}

// 展示战斗角色
HeroFighter.prototype.showHeroFighter = function() {
	var self = this;
	if (this.side == "enemy") {
		GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].y = 180;
		// setTexture会直接切换图片
		GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].setTexture(GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].name + "_fight");
		GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].x = 180 + (GAME_DATA.enemyFightFieldList.length - 1) * 85;
		GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].fighterAttack = new Hamster.UI.Text({
			"name": GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].name + "_attack",
			"fontSize": 18,
			"color": "#fff",
			"text": GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].attack,
			"x": GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].x + 10,
			"y": GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].y + 110
		});
		GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].fighterHp = new Hamster.UI.Text({
			"name": GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].name + "_hp",
			"fontSize": 18,
			"color": "#fff",
			"text": GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].hp,
			"x": GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].x + 66,
			"y": GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].y + 110
		});

		//战斗事件
		Hamster.addEventListener(GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1], "click", function() {
			if(GAME_DATA.fight_heroChoise.action == 0) return;
			GAME_DATA.fight_enemyChoise = this;
			alert("我方" + GAME_DATA.fight_heroChoise.cnName + "攻击了敌人的" + GAME_DATA.fight_enemyChoise.cnName);

			var nenmyResult = null;
			var heroResult = null;

			//战斗后剩余的血量
			nenmyResult = GAME_DATA.fight_enemyChoise.hp - GAME_DATA.fight_heroChoise.attack;
			heroResult = GAME_DATA.fight_heroChoise.hp - GAME_DATA.fight_enemyChoise.attack;

			if (nenmyResult <= 0) {
				// alert("敌人死翘翘了");
				Hamster.remove(GAME_DATA.fight_enemyChoise);
				for (var i = 0; i < GAME_DATA.enemyFightFieldList.length; i++) {
					if (GAME_DATA.enemyFightFieldList[i].id == GAME_DATA.fight_enemyChoise.id) {
						GAME_DATA.enemyFightFieldList.splice(i, 1);
					}
				}
				Hamster.remove(GAME_DATA.fight_enemyChoise.fighterAttack);
				Hamster.remove(GAME_DATA.fight_enemyChoise.fighterHp);
			} else {
				this.hp = nenmyResult;
				this.fighterHp.setText(nenmyResult);
			}

			if (heroResult <= 0) {
				// alert("我的随从也嗝屁了");
				Hamster.remove(GAME_DATA.fight_heroChoise);
				for (var i = 0; i < GAME_DATA.heroFightFieldList.length; i++) {
					if (GAME_DATA.heroFightFieldList[i].id == GAME_DATA.fight_heroChoise.id) {
						GAME_DATA.heroFightFieldList.splice(i, 1);
					}
				}
				Hamster.remove(GAME_DATA.fight_heroChoise.fighterAttack);
				Hamster.remove(GAME_DATA.fight_heroChoise.fighterHp);
			} else {
				GAME_DATA.fight_heroChoise.hp = heroResult;
				GAME_DATA.fight_heroChoise.fighterHp.setText(heroResult);
			}
			Hamster.cvs.style.cursor = "default";
			GAME_DATA.fight_heroChoise.action = 0;
		});

		Hamster.add(GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].fighterAttack);
		Hamster.add(GAME_DATA.enemyFightFieldList[GAME_DATA.enemyFightFieldList.length - 1].fighterHp);

		// 对随从队列经行重排
		this.reListFightField(GAME_DATA.heroFightFieldList);
		this.reListFightField(GAME_DATA.enemyFightFieldList);

	} else if (this.side == "hero") {
		// 每次只添加一个随从到战场上
		var i = GAME_DATA.heroFightFieldList.length - 1;
		GAME_DATA.heroFightFieldList[i].x = 180 + i * 85;
		Hamster.add(GAME_DATA.heroFightFieldList[i]);
		GAME_DATA.heroFightFieldList[i].fighterAttack = new Hamster.UI.Text({
			"name": GAME_DATA.heroFightFieldList[i].name + "_attack",
			"fontSize": 18,
			"color": "#fff",
			"text": GAME_DATA.heroFightFieldList[i].attack,
			"x": GAME_DATA.heroFightFieldList[i].x + 10,
			"y": GAME_DATA.heroFightFieldList[i].y + 110
		});
		GAME_DATA.heroFightFieldList[i].fighterHp = new Hamster.UI.Text({
			"name": GAME_DATA.heroFightFieldList[i].name + "_hp",
			"fontSize": 18,
			"color": "#fff",
			"text": GAME_DATA.heroFightFieldList[i].hp,
			"x": GAME_DATA.heroFightFieldList[i].x + 66,
			"y": GAME_DATA.heroFightFieldList[i].y + 110
		});

		Hamster.addEventListener(GAME_DATA.heroFightFieldList[i], "click", function() {
			if (this.action == 0) {
				alert("你目前不能操作该随从！");
				return;
			} else if (this.action != 0) {
				GAME_DATA.fight_heroChoise = this;
			}
			Hamster.cvs.style.cursor = "url(./public/resource/attack_icon.png),auto";
		});

		Hamster.add(GAME_DATA.heroFightFieldList[i].fighterAttack);
		Hamster.add(GAME_DATA.heroFightFieldList[i].fighterHp);
	}
}

// 改变战场角色,将睡眠角色转换为攻击状态
HeroFighter.prototype.changeAction = function() {
	for (var i = 0; i < GAME_DATA.heroFightFieldList.length; i++) {
		if (GAME_DATA.heroFightFieldList[i].action == 0) {
			GAME_DATA.heroFightFieldList[i].action = 1;
		}
	}
}

// 战斗结算
HeroFighter.prototype.getFightResult = function() {

}

//重新对战场角色进行排列
HeroFighter.prototype.reListFightField = function(list) {
	if (list.length == 0) {
		return;
	}

	for (var i = 0; i < list.length; i++) {
		list[i].x = 180 + i * 85;
		list[i].fighterAttack.x = list[i].x + 10;
		list[i].fighterAttack.y = list[i].y + 110;

		list[i].fighterHp.x = list[i].x + 66;
		list[i].fighterHp.y = list[i].y + 110;
	}
}

/**
 * 费用管理 
 */
function FeeManager(currentFee, round, x, y) {
	this.currentFee = currentFee;
	this.round = round;
	this.feeCount = null;
	this.currentFeeText = null;
	this.x = x;
	this.y = y;
	this.init();
}

FeeManager.prototype.init = function() {
	// 玩家计费器
	this.feeCount = new Hamster.UI.Button({
		"name": "FeeCount",
		"imageName": "fee",
		"x": this.x,
		"y": this.y
	});

	this.currentFeeText = new Hamster.UI.Text({
		"fontSize": 18,
		"x": this.feeCount.x + 45,
		"y": this.feeCount.y + 32,
		"text": this.currentFee + "/" + this.round,
		"color": "#fff"
	});
	Hamster.add(this.feeCount);
	Hamster.add(this.currentFeeText);
}

FeeManager.prototype.setCurrentFee = function(currentFee) {
	this.currentFee = currentFee;
	this.reFreshText();
}

FeeManager.prototype.setRound = function(round) {
	this.round = round;
	this.reFreshText();
}

FeeManager.prototype.reFreshText = function() {
	this.currentFeeText.setText(this.currentFee + "/" + this.round);
}

// 进入下一轮
FeeManager.prototype.addTurn = function() {

	if (this.round < 9) {
		this.round++;
	}

	this.currentFee = this.round;
	this.reFreshText();
}

/**
 * [EnemyAIController 电脑Ai类]
 */
function EnemyAIController() {
	this.enemyFighter = new HeroFighter("enemy");
}

// 出牌
EnemyAIController.prototype.shotCard = function(enemy) {
	var self = this;
	var shotCardCount = 0;
	//更新剩余卡牌 
	enemyCardRemains.refresh();
	enemy.addCard();
	self.attack();

	if (parseInt(myHeroHp.text) <= 0) {
		return;
	}

	// 如果场上的随从大于5个则不出牌
	if (GAME_DATA.enemyFightFieldList.length >= 5) {
		actionSide = true;
		turn_over_button.setTexture("hero_turn_button");

		// 改变角色状态
		hf.changeAction();

		// 增加回合数
		heroFee.addTurn();
		enemyFee.addTurn();
		hero.addCard();
		return;
	}
	setTimeout(function() {
		shotCardCount = 0;

		// 选择合适的卡
		for (var i = 0; i < GAME_DATA.enemyHandCardList.length; i++) {
			if (GAME_DATA.enemyHandCardList[i].fee <= enemyFee.currentFee) {
				enemyFee.currentFee -= GAME_DATA.enemyHandCardList[i].fee;
				GAME_DATA.enemyFightFieldList.push(GAME_DATA.enemyHandCardList[i]);
				self.enemyFighter.buildFighter(GAME_DATA.enemyHandCardList[i]);
				GAME_DATA.enemyHandCardList.splice(i, 1);
				enemy.refresh("enemy");
				actionSide = true;

				self.enemyFighter.showHeroFighter();
				
				shotCardCount++;
			}
		}

		if (shotCardCount == 0) {
			actionSide = true;
			turn_over_button.setTexture("hero_turn_button");
			alert("电脑选择了不出牌，不知道他有什么阴谋诡计");
			//更新剩余卡牌数刷新 
			heroCardRemains.refresh();
			hero.addCard();
			hf.changeAction();
			heroFee.addTurn();
			enemyFee.addTurn();
			return;
		} else {
			//更新剩余卡牌数刷新 
			heroCardRemains.refresh();

			// 改变角色状态
			hf.changeAction();

			// 增加回合数
			heroFee.addTurn();
			enemyFee.addTurn();
			hero.addCard();

			turn_over_button.setTexture("hero_turn_button");
		}

	}, 500);

}

/**
 * AI核心逻辑
 */
EnemyAIController.prototype.attack = function() {
	var enemyAllAttack = 0; //enemy总的攻击力
	var heroAllAttack = 0; //玩家场上随从的总攻击力

	if (GAME_DATA.enemyFightFieldList.length == 0) {
		console.log("没随从打个屁呀");
		return;
	}

	for (var i = 0; i < GAME_DATA.enemyFightFieldList.length; i++) {
		enemyAllAttack += GAME_DATA.enemyFightFieldList[i].attack;
	}

	for (var j = 0; j < GAME_DATA.heroFightFieldList.length; j++) {
		heroAllAttack += GAME_DATA.heroFightFieldList[j].attack;
	}

	if (enemyAllAttack >= heroAllAttack) {
		alert("敌人开始攻击您的英雄");
		for (var i = 0; i < GAME_DATA.enemyFightFieldList.length; i++) {
			var _result = parseInt(myHeroHp.text) - parseInt(GAME_DATA.enemyFightFieldList[i].fighterAttack.text);
			console.log(GAME_DATA.enemyFightFieldList[i]);
			myHeroHp.setText(_result);

			if (parseInt(myHeroHp.text) <= 0) {
				alert("你被打死了，游戏结束");
				Hamster.removeAll();
				return;
			}
		}
	} else {
		// 攻击力最高的对象
		var max_attack = null;

		for (var i = 0; i < GAME_DATA.heroFightFieldList.length; i++) {
			max_attack = GAME_DATA.heroFightFieldList[0];
			if (GAME_DATA.heroFightFieldList[i].attack > max_attack.attack) {
				max_attack = GAME_DATA.heroFightFieldList[i];
			}
		}

		for (var i = 0; i < GAME_DATA.enemyFightFieldList.length; i++) {

			// 当我放随从的生命值大于0
			if (parseInt(max_attack.fighterHp.text) > 0) {
				var _hurt = 0;
				var _enemyHurt = 0; //敌人受到的上海
				_hurt = parseInt(max_attack.fighterHp.text) - parseInt(GAME_DATA.enemyFightFieldList[i].attack);
				_enemyHurt = parseInt(GAME_DATA.enemyFightFieldList[i].fighterHp.text) - parseInt(max_attack.attack);

				// 更新战斗后的数据
				max_attack.fighterHp.setText(_hurt);
				max_attack.hp = _hurt;

				GAME_DATA.enemyFightFieldList[i].fighterHp.setText(_enemyHurt);
				GAME_DATA.enemyFightFieldList[i].hp = _enemyHurt;

				alert("敌人" + GAME_DATA.enemyFightFieldList[i].cnName + "攻击了我方的" + max_attack.cnName);

				// 结算后如果我方随从死亡
				if (parseInt(max_attack.fighterHp.text) <= 0) {
					Hamster.remove(max_attack);
					for (var i = 0; i < GAME_DATA.heroFightFieldList.length; i++) {
						if (GAME_DATA.heroFightFieldList[i].id == max_attack.id) {
							GAME_DATA.heroFightFieldList.splice(i, 1);
						}
					}
					Hamster.remove(max_attack.fighterAttack);
					Hamster.remove(max_attack.fighterHp);
				}

				for (var j = 0; j < GAME_DATA.enemyFightFieldList.length; j++) {
					if (GAME_DATA.enemyFightFieldList[j].hp <= 0) {
						Hamster.remove(GAME_DATA.enemyFightFieldList[j]);
						Hamster.remove(GAME_DATA.enemyFightFieldList[j].fighterAttack);
						Hamster.remove(GAME_DATA.enemyFightFieldList[j].fighterHp);
						GAME_DATA.enemyFightFieldList.splice(j, 1);
					}
				}

			}

		}
	}
}

//卡牌剩余数量计数器 
function RestCardRecord(side) {
	this.side = side;
	this.init();
}

// 初始化
RestCardRecord.prototype.init = function() {
	if (this.side == "hero") {
		this.card = new Hamster.UI.Button({
			"imageName": "card_back",
			"x": 640,
			"y": 390
		});
		this.card.setSize(45, 70);

		var text = hero.cardList.length;

		this.remain = new Hamster.UI.Text({
			"name": "myHeroHp",
			"text": text,
			"fontSize": "25",
			"color": "#000",
			"x": this.card.x + 50,
			"y": this.card.y + 45
		});
		Hamster.add(this.card);
		Hamster.add(this.remain);
	}

	if (this.side == "enemy") {
		this.card = new Hamster.UI.Button({
			"imageName": "card_back",
			"x": 640,
			"y": 130
		});
		this.card.setSize(45, 70);

		var text = enemy.cardList.length;

		this.remain = new Hamster.UI.Text({
			"name": "myHeroHp",
			"text": text,
			"fontSize": "25",
			"color": "#000",
			"x": this.card.x + 50,
			"y": this.card.y + 45
		});
		Hamster.add(this.card);
		Hamster.add(this.remain);
	}
}

RestCardRecord.prototype.refresh = function() {
	var text = hero.cardList.length;
	this.remain.setText(text);
}

// ---卡片的配置信息
var CARD_INFO = [{
	"name": "fishman_baby",
	"cn_name": "鱼人宝宝",
	"fee": 1,
	"attack": 1,
	"hp": 1
}, {
	"name": "freshwater_crocodile",
	"cn_name": "淡水鳄",
	"fee": 2,
	"attack": 2,
	"hp": 3
}, {
	"name": "ogre",
	"cn_name": "食人魔法师",
	"fee": 4,
	"attack": 4,
	"hp": 4
}, {
	"name": "dead_wing",
	"cn_name": "死亡之翼",
	"fee": 9,
	"attack": 9,
	"hp": 9
}];

// ---游戏中所有用到的公共数据
var GAME_DATA = {
	"choiseCard": null,

	// 手牌和战场角色管理
	"heroHandCardList": [], //玩家手牌列表
	"heroFightFieldList": [], //玩家战斗角色列表
	"enemyHandCardList": [], // 敌人手牌列表
	"enemyFightFieldList": [], //敌人战斗角色列表

	//战斗结算参数
	"fight_heroChoise": null,
	"fight_enemyChoise": null
};

/**
 *  行动对象
 * 	true:代表用户行动
 *  false:代表敌人行动
 **/
var actionSide = true;

var turn_count = 1; // 回合数
var hero_fee = 1; // 水晶数量
var enemy_fee = 1; // 敌人的水晶数量

var hf = new HeroFighter("hero");

//  enemyFighter在ai中作管理
var ai = new EnemyAIController();

var hero = new HandCard();
var enemy = new EnemyCard();
var heroFee = new FeeManager(hero_fee, turn_count, 650, 330);
var enemyFee = new FeeManager(hero_fee, turn_count, 650, 200);

var heroCardRemains = new RestCardRecord("hero");
var enemyCardRemains = new RestCardRecord("enemy");

//---游戏主逻辑
// 背景
var background = new Hamster.sprite({
	"name": "background",
	"imageName": "background",
	"x": 0,
	"y": 0
});
Hamster.add(background);

// 敌人英雄头像
var enemyHero = new Hamster.sprite({
	"name": "enemyHero",
	"imageName": "fighter_hero",
	"x": 10,
	"y": 20
});
enemyHero.isTrigger = true;
Hamster.addEventListener(enemyHero, "click", function() {
	if (GAME_DATA.fight_heroChoise == null) {
		return;
	}
	alert("我方" + GAME_DATA.fight_heroChoise.cnName + "攻击了敌人的英雄");
	var enemyResult = null;
	enemyResult = parseInt(enemyHeroHp.text) - parseInt(GAME_DATA.fight_heroChoise.fighterAttack.text);
	if (enemyResult <= 0) {
		alert("恭喜您获得了游戏的胜利");
		Hamster.removeAll();
	}
	enemyHeroHp.setText(enemyResult);
	Hamster.cvs.style.cursor = "default";
	GAME_DATA.fight_heroChoise.action = 0;
});
Hamster.add(enemyHero);

var myHeroHpBackground = new Hamster.UI.Button({
	"name": "myHeroHpBackground",
	"imageName": "hp_background",
	"x": 10,
	"y": 400
});
Hamster.add(myHeroHpBackground);

var myHeroHp = new Hamster.UI.Text({
	"name": "myHeroHp",
	"text": "20",
	"fontSize": "25",
	"color": "#fff",
	"x": 55,
	"y": 435
});
Hamster.add(myHeroHp);

var enemyHeroHpBackground = new Hamster.UI.Button({
	"name": "enemyHeroHpBackground",
	"imageName": "hp_background",
	"x": 10,
	"y": 180
});
Hamster.add(enemyHeroHpBackground);

var enemyHeroHp = new Hamster.UI.Text({
	"name": "enemyHeroHp",
	"text": "30",
	"fontSize": "25",
	"color": "#fff",
	"x": 55,
	"y": 215
});
Hamster.add(enemyHeroHp);

// 敌人英雄头像
var myHero = new Hamster.sprite({
	"name": "myHero",
	"imageName": "fighter_hero",
	"x": 10,
	"y": 450
});
Hamster.add(myHero);

// 回合结束按钮
var turn_over_button = new Hamster.UI.Button({
	"name": "turn_over_button",
	"imageName": "hero_turn_button",
	"x": 670,
	"y": 260
});
Hamster.addEventListener(turn_over_button, "click", function() {
	if (actionSide) {
		this.setTexture("enemy_turn_button");
		Hamster.cvs.style.cursor = "default";
	} else {
		return;
	}
	actionSide = !actionSide;
	// 电脑在思考哦
	setTimeout(function() {
		ai.shotCard(enemy);
	}, 500);
});
Hamster.add(turn_over_button);

// 出牌按钮
var shot_card_button = new Hamster.UI.Button({
	"name": "shot_card_button",
	"imageName": "shot_card",
	"x": 20,
	"y": 260
});
Hamster.add(shot_card_button);

Hamster.addEventListener(shot_card_button, "click", function() {
	if (!GAME_DATA.choiseCard) {
		return;
	}

	if (GAME_DATA.heroFightFieldList.length > 4) {
		alert("你的随从已经布满全场");
		return;
	}

	if (heroFee.currentFee - GAME_DATA.choiseCard.fee < 0) {
		alert("费用不够");
		return;
	} else {
		heroFee.setCurrentFee(heroFee.currentFee - GAME_DATA.choiseCard.fee);
	}

	if (GAME_DATA.choiseCard.status == "click") {
		// 战斗场景添加角色
		GAME_DATA.heroFightFieldList.push(hf.buildFighter(GAME_DATA.choiseCard));
		hf.showHeroFighter();
		for (var i = 0; i < GAME_DATA.heroHandCardList.length; i++) {
			//从手牌数组中删除
			if (GAME_DATA.choiseCard.id == GAME_DATA.heroHandCardList[i].id) {
				GAME_DATA.heroHandCardList.splice(i, 1);
			}
		}

		Hamster.remove(GAME_DATA.choiseCard);
		hero.refresh("hero");
		GAME_DATA.choiseCard = null;
	}
});
Hamster.add(turn_over_button);