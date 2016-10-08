//菜单按钮
var MenuLayer = cc.Layer.extend({
    ctor : function(){

        this._super();
    },
    init:function(){

        this._super();

      //得到canvas的大小
        var winsize = cc.director.getWinSize();

        //设置屏幕中心位置
        var centerpos = cc.p(winsize.width / 2, winsize.height / 2);

        //创建背景图像
        var spritebg = new cc.Sprite(res.helloBG_png);
        spritebg.setPosition(centerpos);//设置位置
        this.addChild(spritebg);

     
        cc.MenuItemFont.setFontSize(60);

        //创建一个菜单按钮
		
        var menuItemPlay= new cc.MenuItemSprite(
    		new cc.Sprite(res.start_n_png),
    		new cc.Sprite(res.start_s_png),
            this.onPlay, this);
        var menu = new cc.Menu(menuItemPlay);
        menu.setPosition(cc.p(winsize.width / 2, winsize.height / 2+50));
        this.addChild(menu);
        
        
        var mrSangsButton= new cc.MenuItemSprite(
        		new cc.Sprite(res.mrSang_n_png),
        		new cc.Sprite(res.mrSang_s_png),
        		this.onPlay2, this);
        var menu = new cc.Menu(mrSangsButton);
        menu.setPosition( cc.p(winsize.width / 2, winsize.height / 2-50));
        this.addChild(menu);
    
    },
    
    onPlay2:function(){
    	//window.open("http://www.baidu.com");
    	
    	window.open("http://sangliang.sinaapp.com");
    	
    	cc.log("按钮2已经按下");
    },
    onPlay : function(){
        cc.log("==onplay clicked");
        cc.director.runScene(new PlayScene());
    }
});

		


var MenuScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new MenuLayer();
        layer.init();
        this.addChild(layer);
    }
});
