/**
 * Res is a resource manager ,you can define images,fonts ,sound's name and path
 * When game init , the resource which define in Res will load first
 */

var Res = {
    "images": [
        //---UI
        { "href": "./public/resource/background.png", "name": "background" },//背景图片
        { "href": "./public/resource/hp_background.png", "name": "hp_background" },
        { "href": "./public/resource/fighter_hero.png", "name": "fighter_hero" },//战士头像
        { "href": "./public/resource/enemy_turn_button.png", "name": "enemy_turn_button" },//对手回合按钮
        { "href": "./public/resource/hero_turn_button.png", "name": "hero_turn_button" },//玩家回合
        { "href": "./public/resource/shot_card.png", "name": "shot_card" },//出牌按钮
        { "href": "./public/resource/card_back.png", "name": "card_back" },//卡背
        { "href": "./public/resource/fee.png", "name": "fee" },//水晶计数器
        
        //---卡片和战斗角色
        { "href": "./public/resource/fishman_baby.png", "name": "fishman_baby" },//鱼人宝宝卡片
        { "href": "./public/resource/fishman_baby_fight.png", "name": "fishman_baby_fight" },//鱼人宝宝战斗
        { "href": "./public/resource/freshwater_crocodile.png", "name": "freshwater_crocodile" },//淡水鳄卡片
        { "href": "./public/resource/freshwater_crocodile_fight.png", "name": "freshwater_crocodile_fight" },//淡水鳄战斗
        { "href": "./public/resource/ogre.png", "name": "ogre" }, //蓝胖子
        { "href": "./public/resource/ogre_fight.png", "name": "ogre_fight" }, //蓝胖子战斗
        { "href": "./public/resource/dead_wing.png", "name": "dead_wing" },
        { "href": "./public/resource/dead_wing_fight.png", "name": "dead_wing_fight" },

        // 测试加载进度界面图片
        { "href": "./public/resource/1.jpg", "name": "1" },
        { "href": "./public/resource/2.jpg", "name": "2" },
        { "href": "./public/resource/3.jpg", "name": "3" },
        { "href": "./public/resource/4.jpg", "name": "4" },
        { "href": "./public/resource/5.jpg", "name": "5" },
    ],
    "fonts": [],
    "sound": []
};