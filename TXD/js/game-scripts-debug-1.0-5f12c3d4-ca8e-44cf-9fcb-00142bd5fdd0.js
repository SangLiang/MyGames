/**
 * 用户自定义脚本.
 */
(function(window, Object, undefined) {

/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

// 注册粒子系统节点的反序列化方法
qc.Serializer.registerCustomDeserializer('qc.ParticleSystem', function(game, parent, uuid) {
    return new qc.ParticleSystem(game, parent, uuid);
});

/**
 * 粒子系统，扩展自qc.Node
 */
var ParticleSystem = qc.ParticleSystem = function(game, parent, uuid) {
    qc.Node.call(this, new Phaser.Group(game.phaser, null), parent, uuid);

    // 默认名字
    this.name = 'Particle System';

    // 是否处于暂停状态
    this.paused = false;

    // 可视化状态变化事件
    this.onVisibleChanged = new qc.Signal();

    // 发射器对象
    this.emitter = null;

    /**
     * @property {qc.Texture} texture - 粒子使用的贴图
     */
    var builtinAtlas = game.assets.find('__builtin_resource__');
    this.texture = builtinAtlas.getTexture('empty.png');

    /**
     * @property {number} emissionSpace - 发射空间，自身坐标系还是世界坐标系
     */
    this.emissionSpace = qc.ParticleSystem.EmissionSpace.WORLD;

    /**
     * @property {number} rendererType - 渲染类型，暂时只支持一种类型
     */
    this.rendererType = qc.ParticleSystem.Renderer.SPRITE;

    /**
     * @property {number} zoneType - 发射区域，支持四种类型：Zone.POINT、Zone.LINE、Zone.CIRCLE、Zone.RECTANGLE
     */
    this.zoneType = qc.ParticleSystem.Zones.Zone.POINT;

    /**
     * @property {bool} edgeEmission - 是否从区域的边缘发射
     */
    this.edgeEmission = false;

    /**
     * @property {number} zoneLength - 发射区域长度，仅当zoneType为Zone.LINE时起效
     */
    this.zoneLength = 100;

    /**
     * @property {number} zoneRotation - 发射区域旋转角度，仅当zoneType为Zone.LINE时起效
     */
    this.zoneRotation = 0;

    /**
     * @property {number} zoneRadius - 发射区域半径，仅当zoneType为Zone.CIRCLE时起效
     */
    this.zoneRadius = 100;

    /**
     * @property {number} zoneWidth - 发射区域宽度，仅当zoneType为Zone.RECTANGLE时起效
     */
    this.zoneWidth = 100;

    /**
     * @property {number} zoneHeight - 发射区域高度，仅当zoneType为Zone.RECTANGEL时起效
     */
    this.zoneHeight = 100;

    /**
     * @property {number} frequency - 发射频率，即多久发射一次粒子，单位为秒
     */
    this.frequency = 0.1;

    /**
     * @property {number} quantity - 每次发射的粒子数量
     */
    this.quantity = 1;

    /**
     * @property {number} repeat - 重复发射次数，-1表示循环发射
     */
    this.repeat = -1;

    /**
     * @property {number} delay - 发射延迟
     */
    this.delay = 0;

    /**
     * @property {Array} lifespan - 粒子生命时长，在指定范围内随机取值
     */
    this.lifespan = [5, 5];

    /**
     * @property {Array} angle - 粒子发射角度，在指定范围内随机取值
     */
    this.angle = [-120, -60];

    /**
     * @property {Number} blendMode - 混合模式
     */
    this.blendMode = Phaser.blendModes.NORMAL;

    /**
     * @property {qc.Color} startColor - 粒子初始颜色
     */
    this.startColor = new qc.Color(0xFFFFFF);

    /**
     * @property {number} startColorVariation - 粒子初始颜色浮动
     */
    this.startColorVariation = 0;

    /**
     * @property {qc.Color} endColor - 粒子目标颜色
     */
    this.endColor = new qc.Color(0xFFFFFF);

    /**
     * @property {number} endColorVariation - 粒子目标颜色
     */
    this.endColorVariation = 0;

    /**
     * @property {Array} startAlpha - 粒子初始透明度，在指定范围内随机取值
     */
    this.startAlpha = [1, 1];

    /**
     * @property {Array} startScale - 粒子初始缩放，在指定范围内随机取值
     */
    this.startScale = [1, 1];

    /**
     * @property {Array} startRotation - 粒子初始旋转，在指定范围内随机取值
     */
    this.startRotation = [0, 0];

    /**
     * @property {Array} startVelocity - 粒子初始速度，在指定范围内随机取值
     */
    this.startVelocity = [100, 100];

    /**
     * @property {Number} angularVelocity - 粒子旋转角速度，在指定范围内随机取值
     */
    this.angularVelocity = [0, 0];

    /**
     * @property {qc.Point} gravity - 重力
     */
    this.gravity = new qc.Point(0, 0);

    /**
     * @property {number} maxParticles - 最大粒子数量，当粒子数量超过此值时将停止发射粒子
     */
    this.maxParticles = 200;

    /**
     * @property {boolean} playOnAwake - 粒子系统激活时是否自动开始发射
     */
    this.playOnAwake = true;

    /**
     * @property {Array} initialFrame - 粒子播放帧动画时的初始帧，在指定范围内随机取值
     */
    this.initialFrame = [0, 0];

    /**
     * @property {Array} frameRate - 粒子帧动画频率，在指定范围内随机取值
     */
    this.frameRate = [1, 1];

    /**
     * @property {boolean} enableColorCurve - 是否开启颜色控制曲线
     */
    this.enableColorCurve = false;

    /**
     * @property {qc.BezierCurve} colorCurve - 粒子颜色控制曲线，若将此项关闭则粒子颜色将在起始颜色和目标颜色之间线性变化
     */
    this.colorCurve = new qc.BezierCurve(new qc.Keyframe(0, 0, 1, 1), new qc.Keyframe(1, 1, 1, 1));

    /**
     * @property {boolean} enableAlphaCurve - 是否开启透明度控制曲线
     */
    this.enableAlphaCurve = false;

    /**
     * @property {qc.BezierCurve} alphaCurve - 粒子透明度控制曲线
     */
    this.alphaCurve = new qc.BezierCurve(new qc.Keyframe(0, 1, 0, 0), new qc.Keyframe(1, 1, 0, 0));
    
    /**
     * @property {boolean} enableScaleCurve - 是否开启缩放控制曲线
     */
    this.enableScaleCurve = false;

    /**
     * @property {qc.BezierCurve} scaleCurve - 粒子缩放控制曲线
     */
    this.scaleCurve = new qc.BezierCurve(new qc.Keyframe(0, 1, 0, 0), new qc.Keyframe(1, 1, 0, 0));

    /**
     * @property {boolean} enableVelocityCurve - 是否开启速度控制曲线
     */
    this.enableVelocityCurve = false;

    /**
     * @property {qc.BezierCurve} velocityCurve - 粒子速度控制曲线
     */
    this.velocityCurve = new qc.BezierCurve(new qc.Keyframe(0, 1, 0, 0), new qc.Keyframe(1, 1, 0, 0));

    /**
     * @property {boolean} enableAngularVelocityCurve - 是否开启角速度控制曲线
     */
    this.enableAngularVelocityCurve = false;

    /**
     * @property {qc.BezierCurve} angularVelocityCurve - 粒子角速度控制曲线
     */
    this.angularVelocityCurve = new qc.BezierCurve(new qc.Keyframe(0, 1, 0, 0), new qc.Keyframe(1, 1, 0, 0));

    var restore = uuid !== undefined;
    if (!restore) {
        this.initEmitter();
    }
};
ParticleSystem.prototype = Object.create(qc.Node.prototype);
ParticleSystem.prototype.constructor = ParticleSystem;

// 定义命名空间
qc.ParticleSystem.Transitions = {};
qc.ParticleSystem.Zones = {};
qc.ParticleSystem.Renderer = {};

qc.ParticleSystem.Renderer = {
    SPRITE: 1
};

qc.ParticleSystem.EmissionSpace = {
    WORLD: 0,
    LOCAL: 1
};

Object.defineProperties(ParticleSystem.prototype, {
    /**
     * @property {string} class - 类名字
     * @readonly
     * @internal
     */
    'class': {
        get: function() { return 'qc.ParticleSystem'; }
    }
});

/**
 * 帧调度，更新粒子发射器
 */
ParticleSystem.prototype.update = function() {
    if (this.paused)
        return;

    var elapsed = this.game.time.deltaTime * 0.001;
    this.emitter.update(elapsed);
};

/**
 * 初始化发射器
 */
ParticleSystem.prototype.initEmitter = function() {
    var emitter = new qc.ParticleSystem.Emitter(this);
    this.emitter = emitter;

    emitter.init();

    if (!this.isWorldVisible() || !this.playOnAwake)
        this.pause();
    else
        this.start();
};

/**
 * 开始发射粒子
 */
ParticleSystem.prototype.start = function() {
    if (!this.isWorldVisible())
        return;

    this.paused = false;
    this.emitter.start();
};

/**
 * 暂停发射粒子
 */
ParticleSystem.prototype.pause = function() {
    this.paused = true;

    this.emitter.pause();
};

/**
 * 清除所有已发射的粒子
 */
ParticleSystem.prototype.clear = function() {
    this.emitter.clear();
};

/**
 * 重置粒子发射
 */
ParticleSystem.prototype.reset = function() {
    this.emitter.reset();
};

/**
 * 反序列化完成，创建粒子发射器并尝试开始发射
 */
ParticleSystem.prototype.onDeserialized = function() {
    this.initEmitter();
};

/**
 * 销毁粒子系统
 */
ParticleSystem.prototype.onDestroy = function() {
    this.emitter.destroy();
    this.emitter = null;

    // 调用父类的析构
    qc.Node.prototype.onDestroy.call(this);
};

/**
 * 父亲或自身的可见属性发生变化了
 */
ParticleSystem.prototype.onVisibleChange = function() {
    if (this.emitter === null)
        return;

    // 派发事件
    this.onVisibleChanged.dispatch();

    if (this.isWorldVisible())
        this.start();
    else {
        this.clear();
        this.pause();
    }
};

/**
 * 获取需要被序列化的信息描述
 * @overide
 * @internal
 */
ParticleSystem.prototype.getMeta = function() {
    var self = this;

    var s = qc.Serializer;
    var json = qc.Node.prototype.getMeta.call(this);

    json.rendererType           = s.NUMBER;
    json.texture                = s.TEXTURE;
    json.initialFrame           = s.NUMBERS;
    json.frameRate              = s.NUMBERS;
    json.zoneType               = s.NUMBER;
    json.edgeEmission           = s.BOOLEAN;
    json.zoneLength             = s.NUMBER;
    json.zoneRotation           = s.NUMBER;
    json.zoneRadius             = s.NUMBER;
    json.zoneWidth              = s.NUMBER;
    json.zoneHeight             = s.NUMBER;
    json.emissionSpace          = s.NUMBER;
    json.frequency              = s.NUMBER;
    json.quantity               = s.NUMBER;
    json.repeat                 = s.NUMBER;
    json.delay                  = s.NUMBER;
    json.lifespan               = s.NUMBERS;
    json.angle                  = s.NUMBERS;
    json.blendMode              = s.NUMBER;
    json.startColor             = s.COLOR;
    json.endColor               = s.COLOR;
    json.startAlpha             = s.NUMBERS;
    json.startScale             = s.NUMBERS;
    json.startRotation          = s.NUMBERS;
    json.startVelocity          = s.NUMBERS;
    json.angularVelocity        = s.NUMBERS;
    json.gravity                = s.POINT;
    json.maxParticles           = s.NUMBER;
    json.playOnAwake            = s.BOOLEAN;
    json.enableColorCurve       = s.BOOLEAN;
    json.colorCurve             = s.GEOM;
    json.enableAlphaCurve       = s.BOOLEAN;
    json.alphaCurve             = s.GEOM;
    json.enableScaleCurve       = s.BOOLEAN;
    json.scaleCurve             = s.GEOM;
    json.enableVelocityCurve    = s.BOOLEAN;
    json.velocityCurve          = s.GEOM;
    json.enableAngularVelocityCurve = s.BOOLEAN;
    json.angularVelocityCurve   = s.GEOM;

    return json;
};


/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 粒子Transform控制器
 */
var Transform = qc.ParticleSystem.Transitions.Transform = function(particle) {
    this.particle = particle;
    this.particleSystem = particle.emitter.owner;
    this.time = particle.emitter.game.time;
    this.gravity = new Phaser.Point();
    this.x = 0;
    this.y = 0;
    this.anchor = {
        x: 0.5,
        y: 0.5
    }

    this.velocity = {
        x: 0,
        y: 0
    };
    this.originVelocity = {
        x: 0,
        y: 0
    };

    this.scale = this.originScale = 1;
    this.rotation = 0;
    this.originAngularVelocity = 0;
};
Transform.prototype.constructor = Transform;

/**
 * 初始化方法
 */
Transform.prototype.init = function(x, y) {
    this.x = x;
    this.y = y;
    this.gravity = this.particleSystem.gravity;

    var angle = qc.ParticleSystem.Util.getRandom(this.particleSystem.angle);
    var magnitude = qc.ParticleSystem.Util.getRandom(this.particleSystem.startVelocity);
    var radian = angle * Math.PI / 180;
    this.velocity.x = this.originVelocity.x = magnitude * Math.cos(radian);
    this.velocity.y = this.originVelocity.y = magnitude * Math.sin(radian);

    this.scale = this.originScale = qc.ParticleSystem.Util.getRandom(this.particleSystem.startScale);
    this.rotation = qc.ParticleSystem.Util.getRandom(this.particleSystem.startRotation) * Math.PI / 180;
    this.originAngularVelocity = qc.ParticleSystem.Util.getRandom(this.particleSystem.angularVelocity) * Math.PI / 180;
}

/**
 * 帧调度
 */
Transform.prototype.update = function(elapsed, clampLife) {
    var t = clampLife;

    // 重力改变速度
    this.originVelocity.x += this.gravity.x * elapsed;
    this.originVelocity.y += this.gravity.y * elapsed;

    // 通过曲线控制粒子速度
    if (this.particleSystem.enableVelocityCurve) {
        var velocityFactor = this.particleSystem.velocityCurve.evaluate(t);
        this.velocity.x = this.originVelocity.x * velocityFactor;
        this.velocity.y = this.originVelocity.y * velocityFactor;
    }
    else {
        this.velocity.x = this.originVelocity.x;
        this.velocity.y = this.originVelocity.y;
    }

    this.x += this.velocity.x * elapsed;
    this.y += this.velocity.y * elapsed;

    // 通过曲线控制粒子的缩放
    if (this.particleSystem.enableScaleCurve) {
        var scaleFactor = this.particleSystem.scaleCurve.evaluate(t);
        this.scale = this.originScale * scaleFactor;
    }

    // 通过曲线控制粒子的旋转
    if (this.originAngularVelocity !== 0) {
        var angularVelocity = this.originAngularVelocity;
        if (this.particleSystem.enableAngularVelocityCurve) {
            angularVelocity *= this.particleSystem.angularVelocityCurve.evaluate(t);
        }

        this.rotation += angularVelocity * elapsed;
    }
}

/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 发射区域
 */
var Zone = qc.ParticleSystem.Zones.Zone = function(edgeEmission) {
    // 发射的几何形状，可能是Point、Line、Rectangle、Circle等等
    this.geometry = null;

    // 缓存位置
    this._random = new qc.Point();

    // 是否从几何图形的边缘发射
    this.edgeEmission = edgeEmission;
};
Zone.prototype.constructor = Zone;

// 发射区域类型
Zone.POINT      = 1;    // 点
Zone.LINE       = 2;    // 线段
Zone.RECTANGLE  = 3;    // 矩形
Zone.CIRCLE     = 4;    // 圆

/**
 * 生成一个随机发射位置
 */
Zone.prototype.getRandom = function() {
    return this._random;
};

/**
 * 发射粒子
 */
Zone.prototype.emit = function(emitter, quantity) {
    for (var i = 0; i < quantity; i++) {
        this.getRandom();
        emitter.emitParticle(this._random.x, this._random.y, emitter);
    }
};

/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 粒子对象
 */
var Particle = qc.ParticleSystem.Particle = function(emitter) {
    this.emitter        = emitter;
    this.particleSystem = emitter.owner;
    this.renderer       = emitter.renderer;
    this.game           = this.emitter.owner.game;

    // 是否需要手动调用 displayChanged
    this.manualDisplayChanged = this.game.phaser.renderType === Phaser.CANVAS && this.game.dirtyRectangle.enable;

    // 是否存活
    this.alive = true;

    this.life = 0;

    // 粒子对应的Phaser.Sprite对象
    this.sprite = null;

    // 粒子位置变化控制器
    this.transform = new qc.ParticleSystem.Transitions.Transform(this);

    // 粒子颜色变化控制器
    this.color = new qc.ParticleSystem.Transitions.Color(this);
};
Particle.prototype.constructor = Particle;

/**
 * 粒子初始化
 */
Particle.prototype.init = function(x, y) {
    this.life = 0;
    this.alive = true;
    this.lifespan = qc.ParticleSystem.Util.getRandom(this.particleSystem.lifespan);

    // 计算粒子帧动画的每帧间隔时间
    var frameRate = qc.ParticleSystem.Util.getRandom(this.particleSystem.frameRate);
    this.frameInterval = 1 / frameRate;
    this.frameTime = 0;

    this.create(x, y);

    // 缓存生成粒子时发射器的位置，并重载粒子的updateTransform方法，以使粒子位置不受父节点的影响
    if (this.particleSystem.emissionSpace === qc.ParticleSystem.EmissionSpace.WORLD) {
        this.cacheParentWorldTransform();
        this.sprite.updateTransform = Particle.updateTransform;
    }
};

/**
 * 根据粒子配置创建粒子
 */
Particle.prototype.create = function(x, y) {
    var texture = this.particleSystem.texture;

    this.transform.init(x, y);
    this.color.init();

    if (this.alive) {
        var frame;
        if (texture.atlas.meta.spriteSheet) {
            // 如果指定的 texture 是 spriteSheet，则设置粒子的 frame 为配置的初始帧
            this.frameIndex = qc.ParticleSystem.Util.getRandom(this.particleSystem.initialFrame);
            this.frameIndex = Phaser.Math.clamp(Math.round(this.frameIndex), 0, texture.atlas.frameNames.length - 1);
            frame = texture.atlas.frameNames[this.frameIndex];
        }
        else {
            if (texture.frame === 0) {
                // 指定的 texture 是 UIAtlas，则在图集中随机选择一张图片
                frame = this.game.phaser.rnd.pick(texture.atlas.frameNames);
            }
            else {
                // 指定的 texture 是 UIAtlas 中的某张图片，直接使用即可
                frame = texture.frame;
            }
        }
            
        var sprite = this.renderer.add(this, texture, frame);
        this.renderer.update(this);
    }

    // 马上更新一帧，让控制曲线做一次采样
    this.transform.update(0, 0);
    this.color.update(0, 0);

    // canvas模式且开启了脏矩形，需要手动调用displayChanged
    if (this.manualDisplayChanged)
        this.sprite.displayChanged(qc.DisplayChangeStatus.SHOW);
};

/**
 * 帧调度
 */
Particle.prototype.update = function(elapsed) {
    this.life += elapsed;

    if (this.life < this.delay)
        this.sprite.visible = false;
    else
        this.sprite.visible = true;

    this.renderer.update(this);

    var clampLife = Phaser.Math.clamp(this.life / this.lifespan, 0 , 1);
    this.transform.update(elapsed, clampLife);
    this.color.update(elapsed, clampLife);

    if (this.life >= this.lifespan) {
        this.terminate();
        return;
    }

    // 更新粒子帧动画
    if (this.emitter.owner.texture.atlas.meta.spriteSheet) {
        this.frameTime += elapsed;
        if (this.frameTime >= this.frameInterval) {
            this.frameIndex++;
            if (this.frameIndex >= this.emitter.owner.texture.atlas.frameNames.length)
                this.frameIndex = 0;

            this.sprite.frameName = this.particleSystem.texture.atlas.frameNames[this.frameIndex];

            // canvas模式且开启了脏矩形，需要手动调用displayChanged
            if (this.manualDisplayChanged)
                this.sprite.displayChanged(qc.DisplayChangeStatus.SHOW);

            this.frameTime -= this.frameInterval;
        }
    }
};

/**
 * 粒子消亡
 */
Particle.prototype.terminate = function() {
    this.alive = false;

    this.sprite.kill();

    // canvas模式且开启了脏矩形，需要手动调用displayChanged
    if (this.manualDisplayChanged)
        this.sprite.displayChanged(qc.DisplayChangeStatus.HIDE);
};

/**
 * 缓存生成粒子时发射器的位置
 */
Particle.prototype.cacheParentWorldTransform = function() {
    if (!this.sprite)
        return;

    var wt = this.emitter.owner.phaser.worldTransform;
    var wt2 = this.sprite._parentWorldTransform = new qc.Matrix();
    wt2.a = wt.a;
    wt2.b = wt.b;
    wt2.c = wt.c;
    wt2.d = wt.d;
    wt2.tx = wt.tx;
    wt2.ty = wt.ty;
};

/**
 * 重载粒子的updateTransform方法，保证粒子对象不收其父亲的移动影响
 */
Particle.updateTransform = function() {
    if (!this.parent || !this.visible) return;

    // create some matrix refs for easy access
    var pt = this._parentWorldTransform;
    if (!pt) return;
    var wt = this.worldTransform;

    // temporary matrix variables
    var a, b, c, d, tx, ty;

    // so if rotation is between 0 then we can simplify the multiplication process..
    if (this.rotation % PIXI.PI_2)
    {
        // check to see if the rotation is the same as the previous render. This means we only need to use sin and cos when rotation actually changes
        if (this.rotation !== this.rotationCache)
        {
            this.rotationCache = this.rotation;
            this._sr = Math.sin(this.rotation);
            this._cr = Math.cos(this.rotation);
        }

        // get the matrix values of the displayobject based on its transform properties..
        a  =  this._cr * this.scale.x;
        b  =  this._sr * this.scale.x;
        c  = -this._sr * this.scale.y;
        d  =  this._cr * this.scale.y;
        tx =  this.position.x;
        ty =  this.position.y;

        // check for pivot.. not often used so geared towards that fact!
        if (this.pivot.x || this.pivot.y)
        {
            tx -= this.pivot.x * a + this.pivot.y * c;
            ty -= this.pivot.x * b + this.pivot.y * d;
        }

        // concat the parent matrix with the objects transform.
        wt.a  = a  * pt.a + b  * pt.c;
        wt.b  = a  * pt.b + b  * pt.d;
        wt.c  = c  * pt.a + d  * pt.c;
        wt.d  = c  * pt.b + d  * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;
    }
    else
    {
        // lets do the fast version as we know there is no rotation..
        a  = this.scale.x;
        d  = this.scale.y;

        tx = this.position.x - this.pivot.x * a;
        ty = this.position.y - this.pivot.y * d;

        wt.a  = a  * pt.a;
        wt.b  = a  * pt.b;
        wt.c  = d  * pt.c;
        wt.d  = d  * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;
    }

    // multiply the alphas..
    this.worldAlpha = this.alpha;

    //  Custom callback?
    if (this.transformCallback)
    {
        this.transformCallback.call(this.transformCallbackContext, wt, pt);
    }
};


/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

var Sprite = qc.ParticleSystem.Renderer.Sprite = function(emitter) {
    this.emitter = emitter;
    this.game = this.emitter.game;
    this.display = emitter.owner.phaser;
};
Sprite.prototype.constructor = Sprite;

// 创建一个Phaser.Sprite用于呈现粒子
Sprite.prototype.add = function(particle, texture, frame) {
    var url   = texture.atlas.url;

    var sprite = particle.sprite;
    if (sprite) {
        sprite.reset(particle.transform.x, particle.transform.y);
        if (sprite.key !== url) {
            sprite.loadTexture(url, frame);
        }
        else {
            sprite.frameName = frame;
        }
    }
    else {
        sprite = this.display.create(particle.transform.x, particle.transform.y, url, frame);
    }

    // 初始化粒子属性
    sprite.anchor.set(particle.transform.anchor.x, particle.transform.anchor.y);
    sprite.blendMode = particle.color.blendMode;

    particle.sprite = sprite;

    return sprite;
};

/**
 * 帧调度，更新 Sprite 的位置、缩放、颜色等信息
 */
Sprite.prototype.update = function(particle) {
    var displayChangeStatus = 0x0;

    var sprite = particle.sprite;
    if (sprite.x !== particle.transform.x || sprite.y !== particle.transform.y) {
        displayChangeStatus |= qc.DisplayChangeStatus.OFFSET;

        sprite.x = particle.transform.x;
        sprite.y = particle.transform.y;
    }

    if (sprite.scale.x !== particle.transform.scale) {
        displayChangeStatus |= qc.DisplayChangeStatus.SCALE;

        sprite.scale.x = particle.transform.scale;
        sprite.scale.y = particle.transform.scale;
    }

    if (sprite.rotation !== particle.transform.rotation) {
        displayChangeStatus |= qc.DisplayChangeStatus.ROTATION;

        sprite.rotation = particle.transform.rotation;
    }

    if (sprite.tint !== particle.color.tint) {
        displayChangeStatus |= qc.DisplayChangeStatus.TINT;

        sprite.tint = particle.color.tint;
    }

    if (sprite.alpha !== particle.color.alpha) {
        displayChangeStatus |= qc.DisplayChangeStatus.ALPHA;

        sprite.alpha = particle.color.alpha;
    }

    // 由于我们 hack 了 PIXI.DisplayObject 的 updateTransform 方法，增加了通过检查 _isNotNeedCalcTransform
    // 来决定是否要更新 transform 的逻辑；同时，由于粒子系统中的粒子没有经过QICI封装(是Phaser.Sprite)，因此需要手动
    // 设置 _isNotNeedCalcTransform 标记以通知其 transform 更新。
    sprite._isNotNeedCalcTransform = false;

    // canvas模式且开启了脏矩形，需要手动调用displayChanged
    if (particle.manualDisplayChanged) {
        sprite.displayChanged(displayChangeStatus);
    }
};


/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 粒子颜色控制器
 */
var Color = qc.ParticleSystem.Transitions.Color = function(particle) {
    this.particle = particle;
    this.particleSystem = particle.emitter.owner;
    this.time = particle.emitter.game.time;

    // 混合模式
    this.blendMode = Phaser.blendModes.NORMAL;

    // 粒子颜色
    this.tint = 0;

    // 粒子透明度
    this.alpha = this.originAlpha = 1;
};
Color.prototype.constructor = Color;

/**
 * 初始化方法
 */
Color.prototype.init = function() {
    var getRandom = qc.ParticleSystem.Util.getRandom;
    var getRandomByVariation = qc.ParticleSystem.Util.getRandomByVariation;

    this.alpha = this.originAlpha = getRandom(this.particleSystem.startAlpha);
    
    this.startColor = new qc.Color(0xFFFFFF);
    this.startColor.r = getRandomByVariation(this.particleSystem.startColor.r, this.particleSystem.startColorVariation);
    this.startColor.g = getRandomByVariation(this.particleSystem.startColor.g, this.particleSystem.startColorVariation);
    this.startColor.b = getRandomByVariation(this.particleSystem.startColor.b, this.particleSystem.startColorVariation);
    
    this.endColor = new qc.Color(0xFFFFFF);
    this.endColor.r = getRandomByVariation(this.particleSystem.endColor.r, this.particleSystem.endColorVariation);
    this.endColor.g = getRandomByVariation(this.particleSystem.endColor.g, this.particleSystem.endColorVariation);
    this.endColor.b = getRandomByVariation(this.particleSystem.endColor.b, this.particleSystem.endColorVariation);

    this.tint = this.startColor.toNumber();
    this.blendMode = this.particleSystem.blendMode;
};

/**
 * 帧调度
 */
Color.prototype.update = function(elapsed, clampLife) {
    // 通过曲线刷新粒子颜色和透明度
    var t = clampLife;

    var from = this.startColor.rgb;
    var to   = this.endColor.rgb;
    if (from[0] !== to[0] || from[1] !== to[1] || from[2] !== to[2]) {
        var factor;
        if (this.particleSystem.enableColorCurve) {
            factor = this.particleSystem.colorCurve.evaluate(t);
        }
        else {
            factor = t;
        }

        var r = 255, g = 255, b = 255;
        if (from[0] !== to[0])
            r = Phaser.Math.clamp(Math.round(from[0] + factor * (to[0] - from[0])), 0, 255);

        if (from[1] !== to[1])
            g = Phaser.Math.clamp(Math.round(from[1] + factor * (to[1] - from[1])), 0, 255);

        if (from[2] !== to[2])
            b = Phaser.Math.clamp(Math.round(from[2] + factor * (to[2] - from[2])), 0, 255);

        this.tint = r << 16 | g << 8 | b;
    }

    if (this.particleSystem.enableAlphaCurve) {
        var alphaFactor = this.particleSystem.alphaCurve.evaluate(t);
        this.alpha = this.originAlpha * alphaFactor;
    }
};

/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 粒子信息查看器
 * @class qc.EmitterViewer
 */
var EmitterViewer = qc.defineBehaviour('qc.EmitterViewer', qc.Behaviour, function() {
        var self = this;

        self.now = self.game.time.now;
        self.runInEditor = true;
        self.debugOn = true;

        // 多久统计1次，单位为秒
        self.duration = 1;
    },
    {
        debugOn: qc.Serializer.BOOLEAN,
        particleSystem: qc.Serializer.NODE
    }
);

// 菜单上的显示
EmitterViewer.__menu = 'Debug/EmitterViewer';

Object.defineProperties(EmitterViewer.prototype, {
    /**
     * @property {boolean} debugOn - 调试开关是否开启
     */
    debugOn: {
        get: function()  { return this._debugOn; },
        set: function(v) { this._debugOn = v;    }
    },

    /**
     * @property {qc.Node} particleSystem - 关联的粒子系统节点
     */
    particleSystem: {
        get: function()  { return this._particleSystem; },
        set: function(v) { this._particleSystem = v;    }
    }
});

EmitterViewer.prototype.postUpdate = function() {
    if (!this.particleSystem)
        return;

    if (!this.debugOn)
        return;

    var now = this.game.time.now;
    if (now - this.now >= this.duration * 1000) {
        var emitter = this.particleSystem.emitter;
        if (emitter === null)
            return;

        var text = qc.Util.formatString('\n\n({0})\nAlive:{1}\nDead:{2}\nTotal:{3}',
            this.particleSystem.name,
            emitter.list.length,
            emitter.pool.length,
            emitter.list.length + emitter.pool.length);

        if (this.gameObject instanceof qc.UIText)
            this.gameObject.text = text;
        else if (this.gameObject instanceof qc.Dom) {
            text = text.replace(/\n/g, '<br/>');
            this.gameObject.innerHTML = text;
        }
    }
};


/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 粒子系统工具库
 */
qc.ParticleSystem.Util = {
    /**
     * 从指定的最小最大值范围内取一个随机值
     */
    getRandom: function(data) {
        if (!Array.isArray(data) || data.length < 2) {
            return 0;
        }

        var min = data[0] || 0;
        var max = data[1] || 0;

        var t = Math.random();
        var rnd = min + t * (max - min);
        return rnd;
    },

    /**
     * 根据一个初始值和浮动范围生成一个随机值
     */
    getRandomByVariation: function(initial, variation) {
        initial = initial || 0;
        variation = variation || 0;

        return initial + variation * (1 - 2 * Math.random());
    }
};

/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 圆形发射区域
 */
var Circle = qc.ParticleSystem.Zones.Circle = function(radius, edgeEmission) {
    qc.ParticleSystem.Zones.Zone.call(this, edgeEmission);

    this.geometry = new qc.Circle(0, 0, radius * 2);
};
Circle.prototype = Object.create(qc.ParticleSystem.Zones.Zone.prototype);
Circle.prototype.constructor = Circle;

/**
 * 生成一个随机发射位置
 */
Circle.prototype.getRandom = function() {
    var t = 2 * Math.PI * Math.random();

    var radius = this.geometry.radius * (this.edgeEmission ? 1 : Math.random());
    this._random.x = this.geometry.x + radius * Math.cos(t);
    this._random.y = this.geometry.y + radius * Math.sin(t);
};


/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 直线发射区域
 */
var Line = qc.ParticleSystem.Zones.Line = function(length, rotation) {
    qc.ParticleSystem.Zones.Zone.call(this);

    var radian = rotation * Math.PI / 180;
    var x1 = length / 2 * Math.cos(radian);
    var y1 = length / 2 * Math.sin(radian);
    var x2 = -x1;
    var y2 = -y1;
    this.geometry = new qc.Line(x1, y1, x2, y2);
};
Line.prototype = Object.create(qc.ParticleSystem.Zones.Zone.prototype);
Line.prototype.constructor = Line;

/**
 * 生成一个随机发射位置
 */
Line.prototype.getRandom = function() {
    var t = Math.random();

    this._random.x = this.geometry.start.x + t * (this.geometry.end.x - this.geometry.start.x);
    this._random.y = this.geometry.start.y + t * (this.geometry.end.y - this.geometry.start.y);
}


/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 点状发射区域
 */
var Point = qc.ParticleSystem.Zones.Point = function() {
    qc.ParticleSystem.Zones.Zone.call(this);

    this.geometry = new qc.Point();
};
Point.prototype = Object.create(qc.ParticleSystem.Zones.Zone.prototype);
Point.prototype.constructor = Point;

/**
 * 生成一个随机发射位置
 */
Point.prototype.getRandom = function() {
    this._random = this.geometry;
}


/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 矩形发射区域
 */
var Rectangle = qc.ParticleSystem.Zones.Rectangle = function(width, height, edgeEmission) {
    qc.ParticleSystem.Zones.Zone.call(this, edgeEmission);

    var x = -width / 2;
    var y = -height / 2;
    this.geometry = new qc.Rectangle(x, y, width, height);
};
Rectangle.prototype = Object.create(qc.ParticleSystem.Zones.Zone.prototype);
Rectangle.prototype.constructor = Rectangle;

/**
 * 生成一个随机发射位置
 */
Rectangle.prototype.getRandom = function() {
    if (! this.edgeEmission) {
        this._random.x = this.geometry.x + Math.random() * this.geometry.width;
        this._random.y = this.geometry.y + Math.random() * this.geometry.height;
    }
    else {
        var w, h;
        var t = Math.random() * this.geometry.perimeter;
        if (t <= this.geometry.width) {
            w = t;
            h = 0;
        }
        else if ( t <= this.geometry.width + this.geometry.height) {
            w = this.geometry.width;
            h = t - this.geometry.width;
        }
        else if ( t <= this.geometry.width * 2 + this.geometry.height) {
            w = this.geometry.width * 2 + this.geometry.height - t;
            h = this.geometry.height;
        }
        else {
            w = 0;
            h = this.geometry.perimeter - t;
        }

        this._random.x = this.geometry.x + w;
        this._random.y = this.geometry.y + h;
    }
};


/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 粒子发射器
 */
var Emitter = qc.ParticleSystem.Emitter = function(owner) {
    this.game  = owner.game.phaser;

    // 发射器所属的粒子系统
    this.owner = owner;

    // 粒子类型
    this.particleClass = qc.ParticleSystem.Particle;

    // 正在显示的粒子列表
    this.list = [];

    // 被回收的粒子列表
    this.pool = [];

    // 是否处于暂停状态
    this.paused = false;
};
Emitter.prototype.constructor = Emitter;

/**
 * 初始化粒子发射器
 */
Emitter.prototype.init = function() {
    // 创建粒子渲染器
    this.renderer = this.createRenderer(this.owner.rendererType);

    // 初始化粒子发射区域
    this.zone = this.createZone();

    // 创建发射定时器
    this.timer = this.game.time.create(false);
};

/**
 * 开始发射粒子
 */
Emitter.prototype.start = function() {
    this.paused = false;

    if (!this.timer.running) {
        var repeat = this.owner.repeat;

        var frequency = this.owner.frequency * 1000;
        if (repeat === -1) {
            this.timer.loop(frequency, this.emitImp, this);
        }
        else if (repeat > 0) {
            this.timer.repeat(frequency, repeat, this.emitImp, this);
        }
        this.timer.start(this.owner.delay * 1000);
    }
    else {
        this.timer.resume();
    }
};

/**
 * 暂停发射粒子
 */
Emitter.prototype.pause = function() {
    this.paused = true;

    this.timer.pause();
};

/**
 * 帧调度，更新所有粒子
 */
Emitter.prototype.update = function(elapsed) {
    // 反向遍历，以便在循环中删除元素
    for (var i = this.list.length - 1; i >= 0; i--) {
        var particle = this.list[i];

        particle.update(elapsed);

        // 粒子已死亡，从显示队列中移除，并放入回收队列
        if (!particle.alive) {
            this.pool.push(particle);
            this.list.splice(i, 1);
        }
    }
};

/**
 * 清除所的粒子
 */
Emitter.prototype.clear = function() {
    for (var i = 0; i < this.list.length; i++) {
        var particle = this.list[i];
        particle.terminate();
    }

    this.list = [];
    this.pool = [];
};

/**
 * 重置粒子发射器，通常用于编辑器调用
 */
Emitter.prototype.reset = function() {
    this.clear();

    this.renderer = null;
    this.zone = null;
    this.timer.destroy();

    this.init();
};

/**
 * 销毁发射器
 */
Emitter.prototype.destroy = function() {
    this.clear();

    this.renderer = null;
    this.zone = null;
    this.timer.destroy();
    this.timer = null;
};

/**
 * 生成一个粒子
 */
Emitter.prototype.emitParticle = function(x, y, emitter) {
    // 超过粒子数量上限，不再发射
    if (this.list.length >= this.owner.maxParticles)
        return;

    var particle = this.pool.pop();
    if (!particle)
        particle = new this.particleClass(this);

    // 初始化粒子
    particle.init(x, y);

    if (particle.alive) {
        this.list.push(particle);
    }
    else {
        this.pool.push(particle);
    }
};

Emitter.prototype.emitImp = function() {
    var quantity = this.owner.quantity;

    if (this.zone) {
        this.zone.emit(this, quantity);
    }
};

/**
 * 创建粒子渲染器
 * @private
 */
Emitter.prototype.createRenderer = function(rendererType) {
    rendererType = rendererType || qc.ParticleSystem.RENDER_TYPE_SPRITE;

    var renderer;
    switch (rendererType) {
        case qc.ParticleSystem.Renderer.SPRITE:
            renderer = new qc.ParticleSystem.Renderer.Sprite(this);
            break;

        default:
            console.error("Invalid renderer type " + rendererType);
    }

    return renderer;
};

/**
 * 创建粒子发射区域
 * @private
 */
Emitter.prototype.createZone = function() {
    var type = this.owner.zoneType;
    var edgeEmission = this.owner.edgeEmission;

    var zone;
    switch (type) {
        case qc.ParticleSystem.Zones.Zone.POINT:
            zone = new qc.ParticleSystem.Zones.Point();
            break;

        case qc.ParticleSystem.Zones.Zone.LINE:
            var length = this.owner.zoneLength;
            var rotation = this.owner.zoneRotation;
            zone = new qc.ParticleSystem.Zones.Line(length, rotation);
            break;

        case qc.ParticleSystem.Zones.Zone.CIRCLE:
            var radius = this.owner.zoneRadius;
            zone = new qc.ParticleSystem.Zones.Circle(radius, edgeEmission);
            break;

        case qc.ParticleSystem.Zones.Zone.RECTANGLE:
            var width = this.owner.zoneWidth;
            var height = this.owner.zoneHeight;
            zone = new qc.ParticleSystem.Zones.Rectangle(width, height, edgeEmission);
            break;

        default:
           console.error("Invalid zone type " + zoneType);
    }

    return zone;
};

/**
 * Description: 游戏入口文件
 * Author: nishu
 * Email: nishu@supernano.com
 */

// 禁止浏览器弹性拉动
document.body.addEventListener('touchmove', function (event) {
    event.preventDefault();
}, false);

// 全局变量
window.fs = qc.fs = {
    // 初始化模块
    // 游戏管理
    GameManager: null,
    // 游戏配置数据
    ConfigManager: null,
    // Layer层管理
    LayerManager: null
};

// 初始化游戏
qc.initGame = function(game) {

    // 记录游戏实列
    fs.Game = game;
};

/**
 * Description: 游戏配置数据管理
 * Author: nishu
 * Email: nishu@supernano.com
 */

var ConfigManager = qc.defineBehaviour('qc.engine.ConfigManager', qc.Behaviour, function () {
    var self = this;

    // 设置到全局
    fs.ConfigManager = self;

    // 当前关卡
    // self.levelID = fs.levelManger.levelNumber;
    self.levelID = 1;

    // 棋盘尺寸
    self.row = 8;
    self.colunm = 9;

    // 方格宽高
    self.gridW = 80;
    self.gridH = 80;

    // excel配置文件
    self.excelData = {
        tiles: null,
        zone: null
    };

    // UI
    self.UI = null;

    // 关卡配置文件
    self.levelData = null;

    // 特效文件
    self.spriteData = {};

    // 角色文件
    self.actorData = null;

    // 场景背景文件
    self.sceneBgData = {};

    // 音效文件
    self.soundData = [];

    // 资源准备
    self.isReady = {
        level: false,
        sprite: false,
        actor: false,
        sceneBg: false,
        sound: false
    }

}, {
        // 导入美术资源
        uiAsset: qc.Serializer.TEXTURE,

        // 导入excel配置文件
        tilesConfig: qc.Serializer.TEXTASSET,
        zoneConfig: qc.Serializer.TEXTASSET,

        tileListConfig: qc.Serializer.TEXTASSET,
        fillidConfig: qc.Serializer.TEXTASSET,
        fillRuleConfig: qc.Serializer.TEXTASSET,
        purchaseConfig: qc.Serializer.TEXTASSET,
        audioConfig: qc.Serializer.TEXTASSET,

        // Boss技能配置
        skillConfig: qc.Serializer.TEXTASSET,
        skillAreaConfig: qc.Serializer.TEXTASSET
    });

// 获取excel及关卡配置文件
ConfigManager.prototype.awake = function () {
    var self = this;

    // 获取UI资源
    self.UI = self.uiAsset;

    // 获取预加载的excel配置文件
    self.excelData = {
        tiles: JSON.parse(self.tilesConfig.text),
        zone: JSON.parse(self.zoneConfig.text),

        tilesList: JSON.parse(self.tileListConfig.text),
        fillid: JSON.parse(self.fillidConfig.text),
        fillRule: JSON.parse(self.fillRuleConfig.text),
        purchase: JSON.parse(self.purchaseConfig.text),
        audio: JSON.parse(self.audioConfig.text),

        skill: JSON.parse(self.skillConfig.text),
        skillArea: JSON.parse(self.skillAreaConfig.text)
    };

    // 获取关卡文件
    self.getLevelConfig();

    // 获取特效资源
    self.spriteAssetsLoad();

    // 获取音效资源
    self.soundAssetsLoad();

    // 背景资源载入
    self.backGroundAssetsLoad();

    // 角色资源载入
    self.actorAssetsLoad();
};

// 获取关卡配置文件
ConfigManager.prototype.getLevelConfig = function (callback) {
    var self = this;

    var _levelTmx = self.excelData.zone[self.levelID].tmx;
    var _levelPath = 'Assets/level/' + _levelTmx + '.bin';

    // 动态加载当前关卡配置文件
    self.game.assets.load('levelConfig', _levelPath, function (texture) {
        self.levelData = JSON.parse(texture.text);
        self.isReady.level = true;
    });
};

// 特效资源加载
ConfigManager.prototype.spriteAssetsLoad = function () {
    var self = this;

    var items = [
        {
            key: 'bee',
            url: 'Assets/sprite/bee.bin'
        },
        /* {
         key : 'caihongquan',
         url : 'Assets/sprite/caihongquan.bin'
         },*/
        {
            key: 'cow',
            url: 'Assets/sprite/cow.bin'
        },
        {
            key: 'fengmi',
            url: 'Assets/sprite/fengmi.bin'
        },
        {
            key: 'jelly',
            url: 'Assets/sprite/jelly.bin'
        },
        {
            key: 'particle',
            url: 'Assets/sprite/particle.bin'
        },
        {
            key: 'port_down',
            url: 'Assets/sprite/port_down.bin'
        },
        {
            key: 'port_up',
            url: 'Assets/sprite/port_up.bin'
        },
        {
            key: 'skill',
            url: 'Assets/sprite/skill.bin'
        },
        {
            key: 'teng',
            url: 'Assets/sprite/teng.bin'
        },
        {
            key: 'tile_blue',
            url: 'Assets/sprite/tile_blue.bin'
        },
        {
            key: 'tile_cracker',
            url: 'Assets/sprite/tile_cracker.bin'
        },
        {
            key: 'tile_green',
            url: 'Assets/sprite/tile_green.bin'
        },
        {
            key: 'tile_ice',
            url: 'Assets/sprite/tile_ice.bin'
        },
        {
            key: 'tile_normal',
            url: 'Assets/sprite/tile_normal.bin'
        },
        {
            key: 'tile_orange',
            url: 'Assets/sprite/tile_orange.bin'
        },
        {
            key: 'tile_purple',
            url: 'Assets/sprite/tile_purple.bin'
        },
        {
            key: 'tile_red',
            url: 'Assets/sprite/tile_red.bin'
        },
        {
            key: 'tile_white',
            url: 'Assets/sprite/tile_white.bin'
        },
        {
            key: 'tile_yellow',
            url: 'Assets/sprite/tile_yellow.bin'
        }
    ];

    self.game.assets.loadBatch(items, function () {
        for (var i = 0; i < items.length; i++) {
            var key = items[i].key;
            var asset = items[i].asset
            self.spriteData[key] = asset;
        }

        self.isReady.sprite = true;
    });
};


// 载入音效文件
ConfigManager.prototype.soundAssetsLoad = function () {
    var self = this;
    var gameMode = self.excelData.zone[self.levelID].type;
    var gameModeArray = {
        47: "trouble",
        49: "dogfood",
        53: "juice",
        54: "popsicle"
    }

    // 音效列表
    var audioList = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 47, 49, 51, 52, 53, 54, 56, 60,
        61, 62, 63, 64, 65, 66, 67, 68, 69,
        70, 76, 78, 79, 86, 87, 88, 89, 90,
        91, 92, 93, 94, 95, 96, 97, 98, 99,
        100, 101, 109, 110, 111, 112, 113, 114,
        118, 119, 120
    ];

    var len = readyCount = audioList.length;

    var actionReady = function () {
        if (--readyCount <= 0) {

            // 创建音效节点
            for (var i = 0; i < len; i++) {
                var _key = audioList[i];
                var audioName = self.excelData.audio[_key].name;
                var audioId = self.excelData.audio[_key].id;

                if (!audioName) {
                    continue;
                }

                if (gameModeArray[audioId] != undefined && gameModeArray[audioId] != gameMode) {
                    continue;
                } else if (gameModeArray[audioId] == gameMode) {
                    _key = 0;
                }

                var sound = self.soundData[_key] = self.game.add.sound(qc.N('audio'));
                var soundKey = 'audio_' + audioId;
                var audio = self.game.assets.find(soundKey);

                sound.name = "" + audioId;

                sound.destroyWhenStop = false;

                // 赋予音效资源
                sound.audio = audio;
            }

            self.isReady.sound = true;
            // fs.GameManager.isAudioReady = true;
        }
    };

    for (var i = 0; i < len; i++) {
        var _key = audioList[i];
        var audioName = self.excelData.audio[_key].name;
        var audioId = self.excelData.audio[_key].id;

        if (!audioName) {
            actionReady();
            continue;
        }

        if (gameModeArray[audioId] != undefined && gameModeArray[audioId] != gameMode) {
            actionReady();
            continue;
        }

        var _path = 'Assets/audio/' + audioName + '.bin';
        var _key = 'audio_' + audioId;

        self.game.assets.load(_key, _path, function (audio) {
            actionReady();
        });
    }
};

//角色动作资源动态载入
ConfigManager.prototype.actorAssetsLoad = function () {
    var self = this;
    var gameMode = self.excelData.zone[self.levelID].type;
    var _completeCount = 0;
    console.warn(gameMode);

    var actorNode = qc.N('actorNode');

    //异步加载完成监听
    var isReady = function () {
        if (_completeCount == 1) {
            self.isReady.actor = true;
        }
    }
    var _setSprite = function (callback) {
        if (gameMode == "juice") {
            self.game.assets.load("Assets/sprite/zhangliang.bin", function (asset) {
                // 显示出来
                actorNode.texture = asset;
                actorNode.resetNativeSize();
                actorNode.scaleX = 1.5;
                actorNode.scaleY = 1.5;
                actorNode.x = 3.507;
                actorNode.y = 431.808;
                _completeCount++;
                actorNode.alpha = 0;
                callback();
            });
        } else if (gameMode == "trouble") {
            self.game.assets.load("Assets/sprite/boss.bin", function (asset) {
                // 显示出来
                actorNode.texture = asset;
                actorNode.resetNativeSize();
                actorNode.scaleX = 2;
                actorNode.scaleY = 2;
                actorNode.x = -17.1;
                actorNode.y = 484.2;
                actorNode.alpha = 0;
                _completeCount++;
                callback();
            });
        } else if (gameMode == "popsicle") {
            self.game.assets.load("Assets/sprite/wangjiaer.bin", function (asset) {
                // 显示出来
                actorNode.texture = asset;
                actorNode.resetNativeSize();
                actorNode.scaleX = 2.4;
                actorNode.scaleY = 2.4;
                actorNode.x = 15.46;
                actorNode.y = 396.627;
                actorNode.alpha = 0;
                _completeCount++;
                callback();
            });
        } else if (gameMode == "dogfood") {
            self.game.assets.load("Assets/sprite/shenmengchen.bin", function (asset) {
                // 显示出来
                actorNode.texture = asset;
                actorNode.resetNativeSize();
                actorNode.scaleX = 1.9;
                actorNode.scaleY = 1.9;
                actorNode.x = 50;
                actorNode.y = 126.995;
                actorNode.alpha = 0;
                _completeCount++;
                callback();
            });
        }
    }

    _setSprite(isReady);

}

//游戏背景资源动态载入
ConfigManager.prototype.backGroundAssetsLoad = function () {
    var self = this;
    var _completeCount = 0;
    var zoneData = self.excelData.zone[self.levelID];

    // 初始化顶部背景图
    var setBackGroundTexture = function (obj, place, callback) {
        if (place == "grid") {
            self.game.assets.load("Assets/texture/window-top/" + zoneData.girdBackground.split(".")[0] + ".bin", function (asset) {
                // 显示出来
                obj.texture = asset;
                _completeCount++;
                callback();
            });
        } else if (place == "top") {
            self.game.assets.load("Assets/texture/window-top/" + zoneData.background.split(".")[0] + ".bin", function (asset) {
                // 显示出来
                obj.texture = asset;
                _completeCount++;
                callback();
            });
        }

    }

    //异步加载完成监听
    var isReady = function () {
        if (_completeCount == 2) {
            self.isReady.sceneBg = true;
        }
    }

    // 初始化游戏盘面背景图
    setBackGroundTexture(fs.ScenesUI.backGround.gridBg, "grid", isReady);
    setBackGroundTexture(fs.ScenesUI.backGround.topBg, "top", isReady);

}

/**
 * Description: 游戏管理，游戏运行状态，状态机管理
 * Author: nishu
 * Email: nishu@supernano.com
 */
var GameManager = qc.defineBehaviour('qc.engine.GameManager', qc.Behaviour, function () {
    var self = this;

    // 设置到全局
    fs.GameManager = self;

    // 状态机
    self.FSM = {};

    // 主逻辑开关
    self.isMainLogicSwitch = false;

    // 主逻辑外部控制开关
    self.externalLogicSwitch = true;

    // 游戏执行过程中逻辑开关计数
    self.gameSwitch = 0;

    // 默认禁止触摸
    self.game.input.mouse.enable = false;
    self.game.input.touch.enable = false;

    // 盘面准备（特效）
    self.isBoardReady = false;
    // 场景准备
    self.isSceneUIReady = false;
    // 音效准备
    self.isAudioReady = false;

    // 消除提示数组
    self.eliminateNoticeList = [];

    // 提示消除开关
    self.eliminateNoticeSwitch = true;

    self.noticeTime = function () {
    };

    // 是否重排数组
    self.isgoShuffle = 0;

    // 游戏暂停
    self.gamePause = false;

    // combo计数，用来产生提示
    self.comboCount = 0;

}, {
        // fields need to be serialized
    });

GameManager.prototype.onEnable = function () {
    var self = this;
    self.initFSM();
};

// 初始化状态机
GameManager.prototype.initFSM = function () {
    var self = this;

    // 状态列表
    self.FSM.list = [
        'initGame',         // 初始化游戏
        'gameStart',        // 开始游戏
        'waitUser',         // 等待用户操作
        // 'propsAction',   // 使用道具
        // 'waitUser',      // 等待用户操作
        'waitMapAction',    // 等待地图操作
        'mapAction',        // 开始地图操作
        'waitTileAction',   // 等待Tile操作
        'tileAction',       // 开始Tile操作
        'waitActorAction',  // 等待角色操作
        'actorAction'       // 开始角色操作（角色完成后又进入等待用户操作）
    ];

    // 设置默认状态
    self.FSM.state = 'initGame';

    // 创建初始化定时器
    self.iTimer = self.game.timer.loop(100, self.initGame.bind(self));
};

GameManager.prototype.noticeTimeBuilder = function () {
    var self = this
    //交换提示定时器
    self.noticeTime = fs.Game.timer.loop(3500, fs.DisFactory.eliminateNotice.bind(self));
}

// 清除交换提示的定时器
GameManager.prototype.removeTimeBuilder = function () {
    var self = this;
    fs.Game.timer.remove(self.noticeTime);
}

// 初始化游戏
GameManager.prototype.initGame = function () {
    var self = this;

    if (fs.ConfigManager.isReady.level == true &&
        fs.ConfigManager.isReady.sprite == true &&
        fs.ConfigManager.isReady.actor == true &&
        fs.ConfigManager.isReady.sceneBg == true &&
        fs.ConfigManager.isReady.sound == true
    ) {
        self.game.timer.remove(self.iTimer);

        // 生成盘面
        fs.LayerManager.init();

        // 生成UI界面
        fs.ScenesUI.initLevelUI();

        // 初始化角色动作
        fs.ActorAnimation.initActorAnimation();

        // 开始游戏
        self.gameStart();
    }
};

// 开始游戏
GameManager.prototype.gameStart = function () {
    var self = this;

    // 更新节点缓存
    fs.CacheAsBitmap.updateCache();

    //tipSetting面板初始化 
    fs.ScenesUI.tipPanelControl();

    // 开启状态机
    self.FSM.switch = true;

    // 关闭初始化界面
    qc.N('initial').visible = false;

    // 播放背景音乐
    fs.AudioManager.playSound(0, true);

    fs.LayerManager.showBoard();

   
};

// 切换状态机状态
GameManager.prototype.changeFSM = function (state) {
    var self = this;

    if (!self.FSM.switch) return;

    // 设置状态
    if (state != undefined) {
        self.FSM.state = state;
    } else {
        // 如果角色完成，则又进入等待用户操作
        if (self.FSM.state == 'actorAction') {
            self.FSM.state = 'waitUser';
        } else {
            var index = self.FSM.list.indexOf(self.FSM.state) + 1;
            self.FSM.state = self.FSM.list[index];
        }
    }

    // 根据状态调整逻辑开关
    // 开始游戏
    if (self.FSM.state == 'gameStart') {
        self.isMainLogicSwitch = true;          // 开始游戏主逻辑
    }

    // 等待用户触摸操作
    if (self.FSM.state == 'waitUser') {

        fs.TaskLogic.bossDownHP = fs.TaskLogic.bossHP;
        // 检测是否游戏结束
        fs.TaskLogic.checkGameResult();

        self.comboCount = 0;

        self.eliminateNoticeSwitch = true;      // 播放消除提示
        self.game.input.mouse.enable = true;    // 允许触摸
        self.game.input.touch.enable = true;
        self.isMainLogicSwitch = false;         // 禁止游戏主逻辑

        // 首先移出之前的定时器
        self.removeTimeBuilder();


        // 死图检测
        self.eliminateNoticeList = fs.DisFactory.checkMapDie();

        if (self.eliminateNoticeList === true) {
            // 首先移出之前的定时器
            self.removeTimeBuilder();
            fs.PopManager.playPopAnimation('nomatch');

        } else {
            self.eliminateNoticeList = fs.DisFactory.checkMapDie();
        }
    }

    // 用户操作完成，combo过程并等待地图操作
    if (self.FSM.state == 'waitMapAction') {
        self.isgoShuffle = 0;                   // 重排提示数组
        self.eliminateNoticeSwitch = false;     // 禁止消除提示
        fs.DisFactory.switchTime = false;

        self.game.input.mouse.enable = false;   // 禁止触摸
        self.game.input.touch.enable = false;
        self.isMainLogicSwitch = true;          // 开始游戏主逻辑

        // 步数减一
        fs.ScenesUI.stepLogic();

        fs.BossSkill.skillStepCount += 1;

    }

    // 开始地图操作
    if (self.FSM.state == 'mapAction') {
        self.eliminateNoticeSwitch = false;     // 禁止消除提示
        self.game.input.mouse.enable = false;   // 禁止触摸
        self.game.input.touch.enable = false;
        self.isMainLogicSwitch = false;         // 禁止游戏主逻辑
    }

    // 地图操作完成，combo过程并等待Tile元素操作
    if (self.FSM.state == 'waitTileAction') {
        self.eliminateNoticeSwitch = false;     // 禁止消除提示
        self.game.input.mouse.enable = false;   // 禁止触摸
        self.game.input.touch.enable = false;
        self.isMainLogicSwitch = true;          // 开始游戏主逻辑
    }

    // 开始Tile元素操作
    if (self.FSM.state == 'tileAction') {
        self.eliminateNoticeSwitch = false;     // 禁止消除提示
        self.game.input.mouse.enable = false;   // 禁止触摸
        self.game.input.touch.enable = false;
        self.isMainLogicSwitch = false;         // 禁止游戏主逻辑
    }

    // Tile元素操作完成，combo过程并等待角色操作
    if (self.FSM.state == 'waitActorAction') {
        self.eliminateNoticeSwitch = false;     // 禁止消除提示
        self.game.input.mouse.enable = false;   // 禁止触摸
        self.game.input.touch.enable = false;
        self.isMainLogicSwitch = true;          // 开始游戏主逻辑
    }

    // 开始角色操作
    if (self.FSM.state == 'actorAction') {

        self.eliminateNoticeSwitch = false;      // 禁止消除提示
        self.game.input.mouse.enable = false;    // 禁止触摸
        self.game.input.touch.enable = false;
        self.isMainLogicSwitch = false;          // 禁止游戏主逻辑
    }
    self.game.log.trace('当前状态: {0}', self.FSM.state);
    console.dir(fs.LayerManager.tilesList);
};

// 开始主逻辑
GameManager.prototype.start = function () {
    var self = this;

    if (--self.gameSwitch == 0) {
        self.externalLogicSwitch = true;
    }
}

// 关闭主逻辑
GameManager.prototype.stop = function () {
    var self = this;

    self.gameSwitch++;
    self.externalLogicSwitch = false;
}

// 主逻辑定时器
GameManager.prototype.update = function () {
    var self = this;

    if (self.isMainLogicSwitch && self.externalLogicSwitch && self.FSM.switch) {

        // 执行元素生成（性能优化版，需要注释）
        // fs.LayerManager.TileGenerator();

        // 执行元素掉落
        fs.LayerManager.dropAll();

        // 始终等待所有元素掉落完成
        if (!fs.LayerManager.checkDropComplete()) {
            return;
        }

        // 始终等待所有新加入元素掉落完成
        if (!fs.LayerManager.checkNewTileComplete()) {
            return;
        }

        if (self.FSM.state == 'gameStart') {
            if (!fs.DisFactory.checkElement(true) && fs.LayerManager.checkDisComplete()) {
                self.changeFSM();
            } else {
                self.FSM.switch = false;
                console.warn('初始化棋盘存在可消除元素，已关闭状态机。');
            }
        }

        // 等待用户操作
        if (self.FSM.state == 'waitUser') {

        }

        if (self.FSM.state == 'waitMapAction') {
            if (!fs.DisFactory.checkElement(true) && fs.LayerManager.checkDisComplete()) {

                // 执行自动释放技能
                if (!fs.DisFactory.actionAutoDoSkill()) {
                    // combo提示
                    fs.PopManager.playComboAnimation(self.comboCount);
                    self.comboCount = 0;

                    self.changeFSM();

                    // 执行传送带
                    fs.ConveyorLayer.move();
                }

            } else {
                fs.DisFactory.checkElement();
            }
        }

        // 开始地图操作
        if (self.FSM.state == 'mapAction') {

        }

        // 地图操作完成，combo过程并等待Tile元素操作
        if (self.FSM.state == 'waitTileAction') {
            if (!fs.DisFactory.checkElement(true) && fs.LayerManager.checkDisComplete()) {
                self.changeFSM();

                // Tile动作执行
                fs.LayerManager.tileAction();
            } else {
                fs.DisFactory.checkElement();
            }
        }

        // 开始Tile元素操作
        if (self.FSM.state == 'tileAction') {

        }

        // Tile元素操作完成，combo过程并等待角色操作
        if (self.FSM.state == 'waitActorAction') {
            if (!fs.DisFactory.checkElement(true) && fs.LayerManager.checkDisComplete()) {
                self.changeFSM();
            } else {
                fs.DisFactory.checkElement();
            }
        }

        // 开始角色操作
        if (self.FSM.state == 'actorAction') {
            qc.N('tempScoreText').text = fs.ScenesUI.gameScore.toString();
            // 计分盘逻辑
            fs.ScenesUI.scorePanelControl();
            // 无聊消除逻辑
            fs.ScenesUI.checkIsBoringDis(fs.ScenesUI.isTargetDis);
            // 如果消除三次都是非目标元素  播放无聊动画
            fs.ScenesUI.boringLogic();
            //boss技能逻辑
            fs.BossSkill.bossSkillLogic();
        }
    }
};
/**
 * Description: 奶牛
 * Author: nishu
 * Email: nishu@supernano.com
 */

var CowTile = qc.fs.CowTile = {};

// 元素通用事件执行方法
CowTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_round' || action == 'action_skill' || action == 'action_props') {

        // 发送任务数据
		self.sendTaskData();
        self.moo();
        self.setDelFlag(false);
        return true;
    }
};

// 牛叫
CowTile.moo = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    self.explode.visible = true;

    self.explode.playAnimation(self.playExplode);

    self.explode.onFinished.addOnce(function () {
        self.explode.visible = false;
    });

    // 动画执行完成后回调
    self.icon_ani.onFinished.addOnce(function () {
                
    });

    self.icon_ani.playAnimation("animation2");

    fs.AudioManager.playSound(64);
};
/**
 * levelManger:关卡管理类
 */
var levelManger = qc.defineBehaviour('qc.engine.levelManger', qc.Behaviour, function () {
   	var self = this;
    fs.levelManger = self;
   	self.levelNumber = 0;
}, {
        levelNodes: qc.Serializer.NODES
    });

levelManger.prototype.awake = function () {
    var self = this;
    self.levelNodes.forEach(function (item) {
        //添加按钮监听
        self.addListener(item.onClick, self.onItemClick, self);
    });
};

levelManger.prototype.onItemClick = function (item) {
    var self = this;
    self.levelNumber = parseInt(item.name);
    fs.Game.scene.load("fight", true, function () {
        console.log('Start loading assets.');
    }, function () {
        console.log('Loaded ok.');
    });
}



/**
 * PageControl:页面控制类
 * 
 */
var PageControl = qc.defineBehaviour('qc.engine.PageControl', qc.Behaviour, function() {
	var self = this;
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
    self.pageCount = 1;
}, {
    // fields need to be serialized
    nextButton:qc.Serializer.NODE,
    preButton:qc.Serializer.NODE,
    page1:qc.Serializer.NODE,
    page2:qc.Serializer.NODE
});

PageControl.prototype.awake = function() {
    var self = this;

    self.preButton.visible = false;
    self.addListener(self.nextButton.onClick, self.nextButtonClick, self);
    self.addListener(self.preButton.onClick, self.preButtonClick, self);
};

PageControl.prototype.nextButtonClick = function() {
    var self = this;
    self.page1.visible = false;
    self.page2.visible = true;
    self.pageCount = 2;
    self.nextButton.visible = false;
    self.preButton.visible = true;
    console.log(self.pageCount);

}

PageControl.prototype.preButtonClick = function() {
    var self = this;
    self.page1.visible = true;
    self.page2.visible = false;
    self.pageCount = 1;
    self.preButton.visible = false;
    self.nextButton.visible = true;
    console.log(self.pageCount);
}

// define a user behaviour
var plus = qc.defineBehaviour('qc.engine.plus', qc.Behaviour, function() {
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
}, {
    // fields need to be serialized
});

// Called when the script instance is being loaded.
//plus.prototype.awake = function() {
//
//};

plus.prototype.onClick = function() {
    var self = this;
    
    self.level = fs.ConfigManager.levelId;
    fs.ConfigManager.excelData.zone[self.level].step++;
};

// Called every frame, if the behaviour is enabled.
//plus.prototype.update = function() {
//
//};

// define a user behaviour
var step = qc.defineBehaviour('qc.engine.step', qc.Behaviour, function() {
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
}, {
    // fields need to be serialized
});

// Called when the script instance is being loaded.
step.prototype.onEnable = function() {
    var self = this;
    
    fs.ConfigManager.getLevelConfig(self.show)
    // self.getStep();
};

step.prototype.show = function (res) {
    console.dir(res);
};

// 获取剩余步数
step.prototype.getStep = function () {
    var self = this;
    
    self.level = fs.ConfigManager.levelId;
    self.step = fs.ConfigManager.excelData.zone[self.level].step;
    self.gameObject.text = '' + self.step;
};

// 更新剩余步数
// step.prototype.update = function() {
//     var self = this;
    
//     self.gameObject.text = '' + fs.ConfigManager.excelData.zone[self.level].step;
// };
// define a user behaviour
var target = qc.defineBehaviour('qc.engine.target', qc.Behaviour, function() {
    // need this behaviour be scheduled in editor
    //this.runInEditor = true;
}, {
    // fields need to be serialized
});

// Called when the script instance is being loaded.
target.prototype.onEnable = function() {
    
    var self = this;
    
    var level = fs.ConfigManager.levelId;
    var background = fs.ConfigManager.excelData.zone[level].background;
    self.gameObject.text = '' + background;
};

// Called every frame, if the behaviour is enabled.
//target.prototype.update = function() {
//
//};

/**
 * Description: 常用盘面逻辑
 * Author: nishu
 * Email: nishu@supernano.com
 */

var BaseLayer = qc.fs.BaseLayer = {};

// Tile元素是否可交换
// direction 方向
// up 上
// down 下
// left 左
// right 右
// left_down 左下
// right_down 右下
BaseLayer.isCanSwap = function (index, direction) {
    var toIndex;
    switch (direction) {
        case 'up':
            toIndex = index - fs.ConfigManager.colunm;
            break;
        case 'down':
            toIndex = index + fs.ConfigManager.colunm;
            break;
        case 'left':
            toIndex = index - 1;
            break;
        case 'right':
            toIndex = index + 1;
            break;
        default:
            break;
    }

    // 判断交换是否超出盘面边界
    if (index < 9 && direction == 'up') {
        return false;
    } else if (index > 62 && (direction == 'down' || direction == 'left_down' || direction == 'right_down')) {
        return false;
    } else if (index % 9 == 0 && (direction == 'left' || direction == 'left_down')) {
        return false;
    } else if (index % 9 == 8 && (direction == 'right' || direction == 'right_down')) {
        return false;
    }

    // 判断交换元素都不是空地形
    if (fs.ConfigManager.levelData.layers[0].data[index] == 1 || fs.ConfigManager.levelData.layers[0].data[toIndex] == 1) {
        return false;
    }

    // 网兜
    if ((fs.LayerManager.tilesList.aboveElement[index] != null && !fs.LayerManager.tilesList.aboveElement[index].isSwap) ||
        fs.LayerManager.tilesList.aboveElement[toIndex] != null && !fs.LayerManager.tilesList.aboveElement[toIndex].isSwap) {
        return false;
    }

    return true;
};

// 是否能被GeneralTile消除
BaseLayer.hasCanRemoveGeneralTile = function (index) {
    var tile = fs.LayerManager.tilesList.element[index];
    var ceilTile = fs.LayerManager.tilesList.aboveElement[index];

    if (tile == null) {
        return false;
    }

    if (ceilTile == null) {
        return true;
    }

    return false;
};

// 是否被网兜束缚
BaseLayer.isBinded = function (index) {
    var ceilTile = fs.LayerManager.tilesList.aboveElement[index];

    if (ceilTile != null && !ceilTile.isSwap) {
        return true;
    }

    return false;
};

// 当前列的元素是否可通过该方格
BaseLayer.hasCross = function (index) {
    var self = this;

    // 不能移动到生成器位置上
    for (var i in fs.LayerManager.generator) {
        if (index + fs.ConfigManager.colunm == i) {
            return false;
        }
    }

    // 循环向上判断是否存在障碍
    var prev = index;
    while (prev >= 0) {
        var tile = fs.LayerManager.tilesList.element[prev];
        if (tile != null && !tile.isCross && tile.canSwapByDirection != undefined) {
            if (!tile.canSwapByDirection('down')) {
                // 判断中间是否存在生成器
                var up = index,
                    isGenerator = false;
                while (up != prev) {
                    for (var i in fs.LayerManager.generator) {
                        if (up == i) {
                            isGenerator = true;
                            break;
                        }
                    }
                    up -= fs.ConfigManager.colunm;
                }

                if (isGenerator) {
                    return false;
                } else {
                    // 判断中间是否有虫洞出口
                    var up = index;
                    while (up != prev) {
                        var portal = fs.LayerManager.tilesList.portal[up];

                        if (portal != null && portal.id == 2602) {
                            // 根据出口获取入口元素掉落情况
                            return self.hasSourcePortal(up, index);
                        }
                        
                        up -= fs.ConfigManager.colunm;
                    }

                    return true;
                }
            } else {
                return false;
            }
        }
        prev -= fs.ConfigManager.colunm;
    }

    // 上方没有方块，则判断是否有生成器
    var top = index;
    while (top >= 0) {
        for (var i in fs.LayerManager.generator) {
            if (top == i) {
                return false;
            }
        }
        top -= fs.ConfigManager.colunm;
    }

    // 上方没有方块，则判断是否有虫洞出口
    var top = index;
    while (top >= 0) {
        var portal = fs.LayerManager.tilesList.portal[top];
        if (portal != null && portal.id == 2602) {
            // 根据出口获取入口元素掉落情况
            return self.hasSourcePortal(top, index);
        }
        top -= fs.ConfigManager.colunm;
    }

    return true;
};

// 根据虫洞出口判断入口元素是否可掉落
BaseLayer.hasSourcePortal = function (_index, pos) {
    var self = this;
    var sourceTile = null,
        sourceIndex = null;

    // 获取入口元素
    for (var i = 0, len = fs.LayerManager.wormholeData.length; i < len; i++) {
        var _obj = fs.LayerManager.wormholeData[i];
        if (_obj.hasOwnProperty("transferPosition") && _obj.transferPosition == _index) {
            sourceTile = fs.LayerManager.tilesList.element[_obj.index];
            sourceIndex = _obj.index;
        }
    }

    if (sourceTile != null) {
        // 虫洞入口元素被网兜束缚了
        if (self.isBinded(sourceIndex)) {
            return true;
        }

        // 虫洞出口到当前检测的位置中间是否有障碍物
        if (sourceTile != null && sourceTile.isSwap) {
            var up = pos;
            while (up != _index) {
                var _tile = fs.LayerManager.tilesList.element[up];

                if (_tile != null && _tile.canSwapByDirection != undefined && !_tile.canSwapByDirection('down')) {
                    return true;
                }
                
                up -= fs.ConfigManager.colunm;
            }
            
            return false;
        }else {
            
            return true;
        }
    }

    return true;
};

// 重排数组方法
BaseLayer.sortNumber = function (a, b) {
    return a - b;
};

// 根据颜色得到方块id
BaseLayer.getTileIDByColor = function (color) {
    for (var i in fs.ConfigManager.excelData.tiles) {
        var item = fs.ConfigManager.excelData.tiles[i];
        if (item.class1 == 'base' && item.color == color) {
            return item.id;
        }
    }
};

// 得到双技能交换后产生的技能功能ID
BaseLayer.getDoubleSkillType = function (aClass3, bClass3) {
    var skillType = "";

    if ((aClass3 == "horizon" || aClass3 == "vertical") && (bClass3 == "horizon" || bClass3 == "vertical")) {

        skillType = "SKILL_HORIZON_VERTICAL";

    }else if (((aClass3 == "horizon" || aClass3 == "vertical") && bClass3 == "jelly") || 
              ((bClass3 == "horizon" || bClass3 == "vertical") && aClass3 == "jelly")) {

        skillType = "SKILL_HV_JELLY";

    }else if (((aClass3 == "horizon" || aClass3 == "vertical") && bClass3 == "rainbow") || 
              ((bClass3 == "horizon" || bClass3 == "vertical") && aClass3 == "rainbow")) {

        skillType = "SKILL_HV_RAINBOW";

    }else if (((aClass3 == "horizon" || aClass3 == "vertical") && bClass3 == "magnet") || 
              ((bClass3 == "horizon" || bClass3 == "vertical") && aClass3 == "magnet")) {

        skillType = "SKILL_HV_MAGNET";

    }else if (((aClass3 == "horizon" || aClass3 == "vertical") && bClass3 == "xx") || 
              ((bClass3 == "horizon" || bClass3 == "vertical") && aClass3 == "xx")) {

        skillType = "SKILL_HV_XBOMB";

    }else if ((aClass3 == "xx" && bClass3 == "jelly") || (bClass3 == "xx" && aClass3 == "jelly")) {

        skillType = "SKILL_XBOMB_JELLY";
        
    }else if ((aClass3 == "xx" && bClass3 == "rainbow") || (bClass3 == "xx" && aClass3 == "rainbow")) {

        skillType = "SKILL_XBOMB_RAINBOW";
        
    }else if ((aClass3 == "xx" && bClass3 == "magnet") || (bClass3 == "xx" && aClass3 == "magnet")) {

        skillType = "SKILL_XBOMB_MAGNET";
        
    }else if (aClass3 == "xx" && bClass3 == "xx") {

        skillType = "SKILL_XBOMB_XBOMB";
        
    }else if (aClass3 == "jelly" && bClass3 == "jelly") {

        skillType = "SKILL_JELLY_JELLY";
        
    }else if (aClass3 == "jelly" && bClass3 == "jelly") {

        skillType = "SKILL_JELLY_JELLY";
        
    }else if ((aClass3 == "jelly" && bClass3 == "rainbow") || (bClass3 == "jelly" && aClass3 == "rainbow")) {

        skillType = "SKILL_JELLY_RAINBOW";
        
    }else if ((aClass3 == "jelly" && bClass3 == "magnet") || (bClass3 == "jelly" && aClass3 == "magnet")) {

        skillType = "SKILL_JELLY_MAGNET";
        
    }else if (aClass3 == "rainbow" && bClass3 == "rainbow") {

        skillType = "SKILL_RAINBOW_RAINBOW";
        
    }else if ((aClass3 == "magnet" && bClass3 == "rainbow") || (bClass3 == "magnet" && aClass3 == "rainbow")) {

        skillType = "SKILL_RAINBOW_MAGNET";
        
    }else if (aClass3 == "rainbow" && bClass3 == "rainbow") {

        skillType = "SKILL_RAINBOW_RAINBOW";
        
    }else if (aClass3 == "magnet" && bClass3 == "magnet") {

        skillType = "SKILL_MAGNET_MAGNET";
        
    }

    return skillType;
};

// 根据位置获取离边框的距离
BaseLayer.getRangeBorder = function (index) {
    var pos = fs.CommonLayer.getRowColunm(index);
    return [pos[0], 7-pos[0], pos[1], 8-pos[1]];
};

// 根据位置找出周围num个满足条件的方格位置
BaseLayer.getRoundPosArray = function (index, len, fun) {
    var layer = 1,
        isSearch = true,
        targetArray = [];

    var originRange = fs.BaseLayer.getRangeBorder(index);
    
    // 是否超出边界
    var isOverflow = function (place, direction) {
        var _range = fs.BaseLayer.getRangeBorder(place);
        if (direction == 'up' && (originRange[0] - _range[0] == layer)) {
            return true;
        }
        if (direction == 'right' && (_range[2] - originRange[2] == layer)) {
            return true;
        }
        if (direction == 'down' && (_range[0] - originRange[0] == layer)) {
            return true;
        }
        if (direction == 'left' && (_range[3] - originRange[3] == layer)) {
            return true;
        }

        return false;
    };

    var addIndex = function (place, direction) {
        if (len == targetArray.length) {
            return;
        }

        if (!isOverflow(place, direction)) {
            return;
        }

        if (fun(place)) {
            targetArray.push(place);
        }
    };

    while (layer <= 8 && isSearch) {
        // 上
        for (var i = 0; i < layer * 2; i++) {
            var newIndex = (index - 10 * layer) + i;
            addIndex(newIndex, 'up');
        }

        // 右
        for (var i = 0; i < layer * 2; i++) {
            var newIndex = (index - 8 * layer) + (i * 9);
            addIndex(newIndex, 'right');
        }

        // 下
        for (var i = 0; i < layer * 2; i++) {
            var newIndex = (index + 10 * layer) - i;
            addIndex(newIndex, 'down');
        }

        // 左
        for (var i = 0; i < layer * 2; i++) {
            var newIndex = (index + 8 * layer) - (i * 9);
            addIndex(newIndex, 'left');
        }

        if (len == targetArray.length) {
            isSearch = false;
        }

        layer++;
    }

    return targetArray;
};

// 获取技能ID
// color 元素颜色
// class3 元素class3类型
// isSquare 是否为正方形消除
BaseLayer.getSkillTileID = function (color, class3, isSquare) {
    var tiles = fs.ConfigManager.excelData.tiles;

    // 如果为正方形消除，则随机一个横竖技能
    if (isSquare) {
        var skillArray = ["horizon", "vertical"];
        var _m = fs.Game.math.random(0, skillArray.length - 1);
        class3 = skillArray[_m];
    }

    if (class3 == 'rainbow') {
        return 1031;
    }

    if (class3 == 'magnet') {
        return 1032;
    }

    for (var i in tiles) {
        if (tiles[i].color == color && tiles[i].class3 == class3) {
            return tiles[i].id;
        }
    }
}

// 获取技能生成点
// color 元素颜色
// disArray 消除列表
// isSquare 是否为正方形消除
BaseLayer.getSkillPosition = function (color, disArray, isSquare) {
    var self = this;

    var skillPosition;
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var otherlist = [];

    // 默认最左边和最上面为技能生成点
    disArray = disArray.sort(fs.BaseLayer.sortNumber);
    skillPosition = disArray[0];

    if (isSquare) {
        // 如果为正方形消除，则随机盘面其他同色的基本元素任意位置
        for (var i = 0; i < len; i++) {
            var _tile = fs.LayerManager.tilesList.element[i];
            if (_tile != null && !_tile.delFlag && _tile.color == color && _tile.class1 == 'base' && self.hasCanRemoveGeneralTile(i)) {
                var flag = false;
                disArray.forEach(function (item) {
                    if (item == i) {
                        flag = true;
                    }
                })
                if (!flag) {
                    otherlist.push(i);
                }
            }
        }

        if (otherlist.length) {
            var _m = fs.Game.math.random(0, otherlist.length - 1);
            skillPosition = otherlist[_m];
        } else {
            // 盘面没有同色元素情况下，则随机任意位置为生成点
            var flag = true,
                disFlag = false;

            while (flag) {
                var _m = fs.Game.math.random(0, len - 1);

                disArray.forEach(function (item) {
                    if (item == _m) {
                        disFlag = true;
                    }
                })

                if (!disFlag) {
                    var _tile = fs.LayerManager.tilesList.element[_m];
                    if (_tile != null && !_tile.delFlag && _tile.class1 == 'base' && self.hasCanRemoveGeneralTile(_m)) {
                        skillPosition = _m;
                        flag = false;
                    }
                }else {
                    disFlag = false;
                }
            }
        }
    } else {
        // 如果为用户操作，则默认操作的交换点为技能生成点
        disArray.forEach(function (index) {
            if (index == fs.LayerManager.skillPos[0] || index == fs.LayerManager.skillPos[1]) {
                skillPosition = index;
            }
        })
    }
    
    return [skillPosition];
}

// 生成技能
// skillID:技能ID
// skillPos:技能生成点
// color:当次消除颜色
// isSquare:是否为正方形消除技能
BaseLayer.makeSkill = function (skillID, skillPos, color, pos, isSquare, toIndex) {
    var self = this;

    var prope = {
        "tileID": skillID
    };

    var firstPos = skillPos[0];

    if (isSquare) {
        // 正方形技能

        // 正方形始终重新获取技能生成点
        firstPos = fs.BaseLayer.getSkillPosition(color, pos, true)[0];

        var target = fs.LayerManager.tilesList.element[firstPos];

        // 将导弹目标设为删除状态
        target.setDelFlag(true);

        // 导弹动画
        self.rocketFlyAnimation(toIndex, firstPos, target, prope, skillID);

    } else {
        // 播放生成技能音效
        if (skillID == 1031) {
            fs.AudioManager.playSound(17);
        }else if (skillID == 1032) {
            fs.AudioManager.playSound(20);
        }else if ((skillID >= 1025 && skillID <= 1030) || skillID == 1035) {
            fs.AudioManager.playSound(18);
        }else if ((skillID >= 1007 && skillID <= 1012) || (skillID >= 1013 && skillID <= 1018)) {
            fs.AudioManager.playSound(19);
        }else if ((skillID >= 1019 && skillID <= 1024) || skillID == 1034) {
            fs.AudioManager.playSound(22);
        }

        // 其他技能
        skillPos.forEach(function (item, index) {
            var _st = fs.TileFactory.buildTile(item, prope, 'element');
            fs.LayerManager.tilesList.element[item] = _st;
        });

        // 在技能生成点播放合成技能动画，香菇不播放动画
        if (skillID != 1104) {
            var tile = fs.LayerManager.tilesList.element[firstPos];
            tile.playMakeSkill();
        }
    }
};

// 获取方块周围不重复的位置集
// disArray 本次消除位置集
BaseLayer.getRangePos = function (disArray) {
    var self = this;
    var indexArray = [];

    disArray.forEach(function (index) {
        var pos = fs.CommonLayer.getRowColunm(index);

        // 四方查找
        [
            index - 9,  // 上
            index + 9,  // 下
            index - 1,  // 左
            index + 1  // 右
        ].forEach(function (direction, place) {
            var tile = fs.LayerManager.tilesList.element[direction];

            if (tile == null || tile.delFlag || !self.hasCanRemoveGeneralTile(direction)) {
                return;
            }

            if (disArray.indexOf(direction) != -1) {
                return;
            }
            // 上
            if (place == 0 && index > 8) {
                indexArray.push(direction);
            }
            // 下
            if (place == 1 && index < 63) {
                indexArray.push(direction);
            }
            // 左
            if (place == 2 && pos[1] > 0) {
                indexArray.push(direction);
            }
            // 右
            if (place == 3 && pos[1] < 8) {
                indexArray.push(direction);
            }
        })
    });

    return indexArray;
}

/**
 * rocketFlyAnimation :正方形消除导弹逻辑
 * @param {int} start: 发射位置开始index
 * @param {int} end： 发射位置结束index
 * @param {obj} target :目标位置信息
 * @prope {}
 * @param {number} skillID: 技能id
 */
BaseLayer.rocketFlyAnimation = function (start, end, target, prope, skillID) {
    var self = this;
    // 停掉主逻辑
    fs.GameManager.stop();
    var rocketObj = fs.Game.add.clone(fs.LayerManager.rocketPrefab, qc.N("element"));
    rocketObj.x = fs.CommonLayer.pivotX(start);
    rocketObj.y = fs.CommonLayer.pivotY(start);

    // 导弹生成音效
    fs.AudioManager.playSound(21);

    var tp = rocketObj.getScript('qc.TweenPosition');

    tp.from = new qc.Point(rocketObj.x, rocketObj.y);
    tp.to = new qc.Point(fs.CommonLayer.pivotX(end), fs.CommonLayer.pivotY(end));

    tp.duration = 0.5;
    var ro = self.rocketRotate(start, end);
    rocketObj.rotation = (ro * Math.PI / 180);
    
    tp.onFinished.addOnce(function () {
        rocketObj.destroy();

        // 回收导弹目标
        fs.TilePool.recoverTile(target);
        fs.LayerManager.tilesList.element[end] = null;

        // 生成技能
        var _st = fs.TileFactory.buildTile(end, prope, 'element');
        fs.LayerManager.tilesList.element[end] = _st;

        // 在技能生成点播放合成技能动画，香菇不播放动画
        if (skillID != 1104) {
            var tile = fs.LayerManager.tilesList.element[end];
            tile.playMakeSkill();
        }

        fs.GameManager.start();
    });

    tp.resetToBeginning();
    tp.playForward();

    // 导弹飞行音效
    fs.AudioManager.playSound(95);
}

/**
 * rocketRotate：导弹方向设置
 * @param {int} start : 发射位置index
 * @param {int} end :目标位置index
 * @return {number} tan ：角度信息 
 */
BaseLayer.rocketRotate = function (start, end) {
    var sx = fs.CommonLayer.pivotX(start);
    var sy = fs.CommonLayer.pivotY(start);
    var ex = fs.CommonLayer.pivotX(end);
    var ey = fs.CommonLayer.pivotY(end);

    if (sy > ey && sx == ex) {
        tan = 270;
        return tan;
    } else if (sy < ey && sx == ex) {
        tan = 90;
        return tan;
    }

    var tan = Math.atan(Math.abs(ey - sy) / (ex - sx)) * 180 / Math.PI;

    if (sy == ey && sx < ex) {
        return tan;
    } else if (ex > sx && ey > sy) {//1象限
        return tan;
    } else if (ex > sx && ey < sy) {//2象限
        return -tan;
    } else if (ex < sx && ey > sy) {
        return tan - 180;
    }
    else {
        return 180 - tan;
    }
}
/**
 * Description: Layer层公共方法
 * Author: nishu
 * Email: nishu@supernano.com
 */

var CommonLayer = qc.fs.CommonLayer = {};


CommonLayer.DropPoint = [1, 2, 3];

// 随机一个鱼片层
CommonLayer.getPopsicle = function () {
    var self = this;
    var popsicleArray = ["popsicle", "popsicle1", "popsicle2"];
    var _m = fs.Game.math.random(0, popsicleArray.length - 1);
    return popsicleArray[_m];
};

// 获取tmx文件tileproperties属性
// type type小于1001为盘面配置类型，大于为tileid
CommonLayer.getTmxPro = function (type) {
    var tp = null;

    if (type < 1001) {
        fs.ConfigManager.levelData.tilesets.forEach(function (item, index) {
            if (item.firstgid == type) {
                tp = item.tileproperties[0];
            }
        });
    } else {
        fs.ConfigManager.levelData.tilesets.forEach(function (item, index) {
            if (item.tileproperties[0].tileID == type) {
                tp = item.tileproperties[0];
            }
        });
    }

    return tp;
};

// 获取URL中的指定参数值
CommonLayer.getUrlParam = function (param) {
    var urlSearch = (window.location.search).substring(1);
    var urlArray = urlSearch.split("&");

    for (var i = 0, len = urlArray.length; i < len; i++) {
        var item = urlArray[i];

        if (item.indexOf(param) != -1) {
            var _c = item.split("=");

            return +_c[1];
        }
    }

    return false;
};

// 根据方格位置计算x坐标
CommonLayer.pivotX = function (index) {
    var x = (index % fs.ConfigManager.colunm) * fs.ConfigManager.gridW + 40;
    return x;
};

// 根据方格位置计算y坐标
CommonLayer.pivotY = function (index) {
    var y = fs.Game.math.floorTo(index / fs.ConfigManager.colunm) * fs.ConfigManager.gridH + 40;
    return y;
};

// 根据第几列计算出x坐标
CommonLayer.colPivotX = function(col) {
    var x = col * fs.ConfigManager.gridH + 40;
    return x;
}

// 根据第几行计算出y坐标
CommonLayer.rowPivotY = function(row) {
    var y = row * fs.ConfigManager.gridW + 40;
    return y;
}

// 根据横纵坐标来确定一个元素的索引位置
CommonLayer.getIndexFromRowAndCol = function(col,row){
    var self =this;
    var _x =  self.colPivotX(col);
    var _y = self.rowPivotY(row);

    var resultIndex = self.getIndex(_x,_y);

    return resultIndex;
}

// 根据坐标计算水果位于第几个方格
CommonLayer.getIndex = function (x, y) {
    var self = this;
    var len = fs.ConfigManager.colunm;
    var colunm = fs.Game.math.floorTo(x / fs.ConfigManager.gridW),
        row = fs.Game.math.floorTo(y / fs.ConfigManager.gridH);
    return row * len + colunm;
}

// 根据方格位置获取位于几行几列
CommonLayer.getRowColunm = function (index) {
    var row = fs.Game.math.floorTo(index / 9);
    var colunm = fs.Game.math.floorTo(index % 9);
    return [row, colunm];
}

// 获取对象长度
CommonLayer.getObjectLength = function (obj) { 
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
}

/**
 * 获取两个格子的关系
 * @param a - 第一个格子位置
 * @param b - 第二个格子位置
 * @return
 * left - a在b左边
 * right - a在b右边
 * top - a在b上边
 * bottom - a在b下面
 * undefined - 不相邻
 */
CommonLayer.getRelation = function (a, b) {
    var self = this;

    var size = fs.ConfigManager.colunm;
    var col1 = a % size,
        row1 = fs.Game.math.floorTo(a / size);

    var col2 = b % size,
        row2 = fs.Game.math.floorTo(b / size);

    if (col1 + 1 === col2 && row1 === row2) return 'left';
    if (col1 - 1 === col2 && row1 === row2) return 'right';
    if (col1 === col2 && row1 + 1 === row2) return 'top';
    if (col1 === col2 && row1 - 1 === row2) return 'bottom';
};

// 交换方格数据
CommonLayer.getSwapData = function (index1, index2) {

    // 复制一份当前关卡棋盘配置数据，并预先交换位置
    var grids = fs.LayerManager.tilesList.element.concat();
    var temp = grids[index1];
    grids[index1] = grids[index2],
        grids[index2] = temp;

    return grids
};

// 数组去重
CommonLayer.removeDuplicateArray = function (arr){
    var n = [];
    for(var i = 0; i < arr.length; i++){
        if (n.indexOf(arr[i]) == -1) n.push(arr[i]);
    }
    return n;
};

/**
 * [transformIDtoColor 将一个元素的id转换为颜色信息]
 * @param  {[int]} id [传入的真实id(如2001)]
 * @return {[type]}    [description]
 */
CommonLayer.transformIDtoColor = function (id) {
    // console.error(id);
    if(id==null){
        return 0;
    }
    var m = fs.ConfigManager.excelData.tiles[id].color;
    // console.log(m + "-" + id);

    if (m != null && m!=undefined) {
        return m;
    } else {
        // console.log('该元素没有颜色信息 ' + id);
        return 0;
    }

}

// 判断某个位置是否在盘面边缘
CommonLayer.hasInBorder = function (direction, index) {
    var pos = fs.CommonLayer.getRowColunm(index);

    if (direction == "row") {
        if (pos[0] == 0 || pos[0] == 7) {
            return true;
        }
    }else if (direction == "col") {
        if (pos[1] == 0 || pos[1] == 8) {
            return true;
        }
    }else if (direction == "full") {
        if (pos[0] == 0 || pos[0] == 7 || pos[1] == 0 || pos[1] == 8) {
            return true;
        }
    }

    return false;
};

/**
 * 传送带逻辑
 * Author:Sangliang
 * Email:sangliang@supernano.com
 */

var ConveyorLayer = fs.ConveyorLayer = {};

ConveyorLayer.specialTransferPosition = [];
// 传送点信息
ConveyorLayer.transformPosition = [];

ConveyorLayer.transformAboveLayer = [];

ConveyorLayer.transformBelowLayer = [];
/**
 * move: 执行传送带事件
 */
ConveyorLayer.move = function () {
    var self = this;

    //获取特殊传送的位置
    self.getSpecialConveyorPosition();
    self.transformElement = self.getElementConveyorPosition();
    self.transformAboveLayer = self.getAboveLayerConveyorPosition();
    self.transformBelowLayer = self.getBelowLayerConveyorPosition();
    if (self.transformElement.length == 0) {
        fs.GameManager.changeFSM();
        return;
    }

    self.doTransPosition(self.transformElement, "element");
    self.doTransPosition(self.transformAboveLayer, "aboveElement");
    self.doTransPosition(self.transformBelowLayer, "belowElement");
    self.conveyorTimer = fs.Game.timer.loop(100, fs.ConveyorLayer.hasMoveComplete.bind(self));

}

/*
 * 监听传送带是否滚动完成
 */
ConveyorLayer.hasMoveComplete = function () {
    var self = this;
    var flag = false;

    for (var i = 0, len = self.transformElement.length; i < len; i++) {
        var tile = self.transformElement[i].element;

        if (tile == null) continue;

        if (tile.moveFlag) {
            flag = true;
            break;
        }
    }
    // 元素下层的需要传送
    if (self.transformBelowLayer.length > 0) {
        for (var i = 0, len = self.transformBelowLayer.length; i < len; i++) {
            var tile = self.transformBelowLayer[i].element;

            if (tile == null) continue;

            if (tile.moveFlag) {
                flag = true;
                break;
            }
        }
    }

    if (!flag) {
        fs.Game.timer.remove(self.conveyorTimer);
        fs.GameManager.changeFSM();
    }
};

/**
 * getConveyorPosition : 获取特殊传送的索引
 */
ConveyorLayer.getSpecialConveyorPosition = function () {
    var self = this;
    var conveyorObj = {};
    var terrainList = fs.LayerManager.tilesList['terrain']

    var _temp = [];

    //拿到所有特殊点的位置索引
    for (var i = 0; i < self.specialTransferPosition.length; i++) {
        if (self.specialTransferPosition[i] != undefined && self.specialTransferPosition[i].transferPosition != undefined) {
            var _positionString = self.specialTransferPosition[i].transferPosition.split(",");
            // console.log(_positionString);
            var _index = fs.CommonLayer.getIndexFromRowAndCol(parseInt(_positionString[0]) - 1, parseInt(_positionString[1]) - 1);

        } else {
            var _index = null;
        }

        var _info = {
            "id": self.specialTransferPosition[i].tileID,
            "specialIndex": _index,
            "index": self.specialTransferPosition[i].index
        };

        _temp.push(_info);
    }
    self.transformPosition = _temp;
}

/**
 * [getElementConveyorPosition 获取element层中的位于传送带位置的元素索引]
 * @return {array} [_resultElementList] element层位于传送带上的元素数组
 */
ConveyorLayer.getElementConveyorPosition = function () {
    var self = this;

    var _elementList = fs.LayerManager.tilesList.element;

    // 处于传送带上的元素数组
    var _resultElementList = [];
    for (var i = 0; i < _elementList.length; i++) {
        for (var j = 0; j < ConveyorLayer.transformPosition.length; j++) {
            if (ConveyorLayer.transformPosition[j]) {
                if (ConveyorLayer.transformPosition[j].index == i) {
                    var _tempObj = {};
                    _tempObj.element = _elementList[i];
                    _tempObj.index = i;
                    _resultElementList.push(_tempObj);
                }
            }
        }
    }
    return _resultElementList;
}

// 网兜层的
ConveyorLayer.getAboveLayerConveyorPosition = function () {
    var self = this;

    var _aboveLayerList = fs.LayerManager.tilesList.aboveElement;

    var _resultElementList = [];

    for (var i = 0; i < _aboveLayerList.length; i++) {
        for (var j = 0; j < ConveyorLayer.transformPosition.length; j++) {
            if (ConveyorLayer.transformPosition[j]) {
                if (ConveyorLayer.transformPosition[j].index == i) {
                    var _tempObj = {};
                    _tempObj.element = _aboveLayerList[i];
                    _tempObj.index = i;
                    _resultElementList.push(_tempObj);
                }
            }
        }
    }
    return _resultElementList;
}

ConveyorLayer.getBelowLayerConveyorPosition = function () {
    var self = this;

    var _belowLayerList = fs.LayerManager.tilesList.belowElement;

    var _resultElementList = [];

    for (var i = 0; i < _belowLayerList.length; i++) {
        for (var j = 0; j < ConveyorLayer.transformPosition.length; j++) {
            if (ConveyorLayer.transformPosition[j]) {
                if (ConveyorLayer.transformPosition[j].index == i) {
                    var _tempObj = {};
                    _tempObj.element = _belowLayerList[i];
                    _tempObj.index = i;
                    _resultElementList.push(_tempObj);
                }
            }
        }
    }
    return _resultElementList;
}

/**
 * [doTransPosition 开始传送元素]
 * @param {array} element 需要做传送的数组
 * @return {[type]} [description]
 */
ConveyorLayer.doTransPosition = function (element, layer) {
    var self = this;

    for (var i = 0; i < element.length; i++) {
        self.getTransDirection(element[i].index, element[i], layer);
    }
}

/**
 * getTransDirection 传送方向获取
 * @param {int} index 传送元素位置索引
 * @param {array} transformElement 传送元素对象数组
 */
ConveyorLayer.getTransDirection = function (index, element, layer) {
    var self = this;
    for (var i = 0; i < self.transformPosition.length; i++) {

        if (self.transformPosition[i].index == index) {
            // id为2104且特殊传送位置为null
            // 左
            if ((self.transformPosition[i].id == "2104" || self.transformPosition[i].id == "2102" || self.transformPosition[i].id == "2111") && self.transformPosition[i].specialIndex == null) {
                self.moveDirection("left", element, null, layer);
            } else if ((self.transformPosition[i].id == "2104" || self.transformPosition[i].id == "2102" || self.transformPosition[i].id == "2111") && self.transformPosition[i].specialIndex != null) {
                self.moveDirection("left", element, self.transformPosition[i].specialIndex, layer);
            }

            // 右
            if ((self.transformPosition[i].id == "2103" || self.transformPosition[i].id == "2107" || self.transformPosition[i].id == "2112") && self.transformPosition[i].specialIndex == null) {
                self.moveDirection("right", element, null, layer);
            } else if ((self.transformPosition[i].id == "2103" || self.transformPosition[i].id == "2107" || self.transformPosition[i].id == "2112") && self.transformPosition[i].specialIndex != null) {
                self.moveDirection("right", element, self.transformPosition[i].specialIndex, layer);
            }

            // 上
            if ((self.transformPosition[i].id == "2106" || self.transformPosition[i].id == "2109" || self.transformPosition[i].id == "2110") && self.transformPosition[i].specialIndex == null) {
                self.moveDirection("top", element, null, layer);
            } else if ((self.transformPosition[i].id == "2106" || self.transformPosition[i].id == "2109" || self.transformPosition[i].id == "2110") && self.transformPosition[i].specialIndex != null) {
                self.moveDirection("top", element, self.transformPosition[i].specialIndex, layer);
            }

            // 下
            if ((self.transformPosition[i].id == "2101" || self.transformPosition[i].id == "2105" || self.transformPosition[i].id == "2108") && self.transformPosition[i].specialIndex == null) {
                self.moveDirection("bottom", element, null, layer);
            } else if ((self.transformPosition[i].id == "2101" || self.transformPosition[i].id == "2105" || self.transformPosition[i].id == "2108") && self.transformPosition[i].specialIndex != null) {
                self.moveDirection("bottom", element, self.transformPosition[i].specialIndex, layer);
            }
        }

    }

}

/**
 * [moveDirection 按指定的方向进行移动]
 * @param  {[string]} direction        [传送的方向]
 * @param  {[obj]} transformElement [需要做传送的对象]
 * @param  {[int]} specialIndex     [特殊传送点的位置]
 * @return {[type]}                  [description]
 */
ConveyorLayer.moveDirection = function (direction, element, specialIndex, layer) {
    var self = this;

    var objLayer = fs.LayerManager.tilesList[layer];
    // 左移
    if (direction == "left") {

        if (element.index != null && specialIndex == null) {
            if (element.element == null) {
                element.index -= 1;
                objLayer[element.index] = element.element;
                return;
            }
            element.element.setMoveFlag(true);

            element.index -= 1;

            var _prX = element.element.gameObject.x;
            var _prY = element.element.gameObject.y;
            var tp = element.element.gameObject.getScript('qc.TweenPosition');
            element.element.gameObject.x = fs.CommonLayer.pivotX(element.index);
            element.element.gameObject.y = fs.CommonLayer.pivotY(element.index);
            objLayer[element.index] = element.element;

            // 移动方块
            tp.from = new qc.Point(_prX, _prY);
            tp.to = new qc.Point(element.element.gameObject.x, element.element.gameObject.y);

            tp.duration = 0.1;
            tp.resetToBeginning();
            tp.playForward();

            tp.onFinished.addOnce(function () {
                // 更新状态
                element.element.setMoveFlag(false);
            });

        } else if (specialIndex != null) {

            if (element.element == null) {
                element.index = specialIndex;
                objLayer[element.index] = element.element;
                return;
            }
            element.element.setMoveFlag(true);

            element.index = specialIndex;
            element.element.gameObject.x = fs.CommonLayer.pivotX(element.index);
            element.element.gameObject.y = fs.CommonLayer.pivotY(element.index);
            objLayer[element.index] = element.element;
            element.element.setMoveFlag(false);
        }
    }

    // 右移
    if (direction == "right") {

        if (element.index != null && specialIndex == null) {
            if (element.element == null) {
                element.index += 1;
                objLayer[element.index] = element.element;
                return;
            }
            element.element.setMoveFlag(true);

            element.index += 1;
            var _prX = element.element.gameObject.x;
            var _prY = element.element.gameObject.y;
            var tp = element.element.gameObject.getScript('qc.TweenPosition');

            element.element.gameObject.x = fs.CommonLayer.pivotX(element.index);
            element.element.gameObject.y = fs.CommonLayer.pivotY(element.index);
            objLayer[element.index] = element.element;

            // 移动方块
            tp.from = new qc.Point(_prX, _prY);
            tp.to = new qc.Point(element.element.gameObject.x, element.element.gameObject.y);

            tp.duration = 0.1;
            tp.resetToBeginning();
            tp.playForward();

            tp.onFinished.addOnce(function () {
                // 更新状态
                element.element.setMoveFlag(false);
            });

        } else if (specialIndex != null) {

            if (element.element == null) {
                element.index = specialIndex;
                objLayer[element.index] = element.element;
                return;
            }
            element.element.setMoveFlag(true);

            element.index = specialIndex;
            element.element.gameObject.x = fs.CommonLayer.pivotX(element.index);
            element.element.gameObject.y = fs.CommonLayer.pivotY(element.index);
            objLayer[element.index] = element.element;
            element.element.setMoveFlag(false);
        }

    }

    // 上移
    if (direction == "top") {

        if (element.index != null && specialIndex == null) {

            if (element.element == null) {
                element.index -= 9;
                objLayer[element.index] = element.element;
                return;
            }
            element.element.setMoveFlag(true);

            element.index -= 9;
            var _prX = element.element.gameObject.x;
            var _prY = element.element.gameObject.y;
            var tp = element.element.gameObject.getScript('qc.TweenPosition');
            element.element.gameObject.x = fs.CommonLayer.pivotX(element.index);
            element.element.gameObject.y = fs.CommonLayer.pivotY(element.index);
            objLayer[element.index] = element.element;
            // 移动方块
            tp.from = new qc.Point(_prX, _prY);
            tp.to = new qc.Point(element.element.gameObject.x, element.element.gameObject.y);

            tp.duration = 0.1;
            tp.resetToBeginning();
            tp.playForward();

            tp.onFinished.addOnce(function () {
                // 更新状态
                element.element.setMoveFlag(false);
            });

        } else if (specialIndex != null) {

            if (element.element == null) {
                element.index = specialIndex;
                objLayer[element.index] = element.element;
                return;
            }
            element.element.setMoveFlag(true);

            element.index = specialIndex;
            element.element.gameObject.x = fs.CommonLayer.pivotX(element.index);
            element.element.gameObject.y = fs.CommonLayer.pivotY(element.index);
            objLayer[element.index] = element.element;
            element.element.setMoveFlag(false);
        }

    }

    if (direction == "bottom") {

        if (element.index != null && specialIndex == null) {
            if (element.element == null) {
                element.index += 9;
                objLayer[element.index] = element.element;
                return;
            }
            element.element.setMoveFlag(true);
            element.index += 9;

            var _prX = element.element.gameObject.x;
            var _prY = element.element.gameObject.y;
            var tp = element.element.gameObject.getScript('qc.TweenPosition');

            element.element.gameObject.x = fs.CommonLayer.pivotX(element.index);
            element.element.gameObject.y = fs.CommonLayer.pivotY(element.index);
            objLayer[element.index] = element.element;

            // 移动方块
            tp.from = new qc.Point(_prX, _prY);
            tp.to = new qc.Point(element.element.gameObject.x, element.element.gameObject.y);

            tp.duration = 0.1;
            tp.resetToBeginning();
            tp.playForward();

            tp.onFinished.addOnce(function () {
                // 更新状态
                element.element.setMoveFlag(false);
            });

        } else if (specialIndex != null) {

            if (element.element == null) {
                element.index = specialIndex;
                objLayer[element.index] = element.element;
                return;
            }
            element.element.setMoveFlag(true);

            element.index = specialIndex;
            element.element.gameObject.x = fs.CommonLayer.pivotX(element.index);
            element.element.gameObject.y = fs.CommonLayer.pivotY(element.index);
            objLayer[element.index] = element.element;
            element.element.setMoveFlag(false);
        }

    }
}



/**
 * Description: Tile消除工厂，查找消除元素，消除逻辑
 * Author: nishu
 * Email: nishu@supernano.com
 */

var DisFactory = qc.fs.DisFactory = {};

// 在执行动作，待移除的方块计数
DisFactory.waitRemoveNum = 0;

// 重排次数统计
DisFactory.rebuildTimesCount = 0;

// 自动释放技能数组
DisFactory.autoDoSkillArray = [];

// 执行自动释放技能
DisFactory.actionAutoDoSkill = function () {
    var self = this,
        tile = null,
        len = self.autoDoSkillArray.length;

    if (len == 0) {
        return false;
    }

    var _m = fs.Game.math.random(0, len - 1);
    tile = self.autoDoSkillArray[_m];

    if (!tile.delFlag) {
        var index = fs.CommonLayer.getIndex(tile.gameObject.x, tile.gameObject.y);
        tile.setDelFlag(true);
        fs.LayerManager.layerPropagation(index, tile.color, 'action_skill');
    }

    self.autoDoSkillArray.splice(_m, 1);

    return true;
};

// 消除元素
// result 待消除的集合
DisFactory.disappear = function (result) {

    // 每个组合消除过程中，关掉主逻辑
    fs.GameManager.isMainLogicSwitch = false;

    var color = result.color,
        pos = result.pos,
        skillID = result.skillID,
        skillPos = result.skillPos,
        isSquare = result.isSquare;

    var _obj = fs.LayerManager.tilesList.element;
    for (var i = 0; i < 72; i++) {
        for (var j = 0; j < pos.length; j++) {
            if (i == pos[j]) {
                if ('disCount' in _obj[i]) {
                    _obj[i].disCount = pos.length;
                }
            }
        }
    }

    // 消除计数
    var disCount = 0;
    var len = pos.length;

    fs.DisFactory.waitRemoveNum += len;

    // 获取技能合成点
    var toIndex = skillPos ? skillPos[0] : undefined;

    /*if (isSquare) {
        // 如果为正方形则重新获取最左上角或用户操作点为合成点
        pos = pos.sort(fs.BaseLayer.sortNumber);
        toIndex = pos[0];

        pos.forEach(function (item) {
            if (item == fs.LayerManager.skillPos[0] || item == fs.LayerManager.skillPos[1]) {
                toIndex = item;
            }
        })
    }*/

    // 循环消除当前集合中的元素
    for (var j in pos) {
        // 获取方格位置
        var index = pos[j];
        var tile = fs.LayerManager.tilesList.element[index];

        var tileAction = function () {
            // 如果有技能生成的话，则把技能ID传过去，因为生成技能的消除是不需要考虑绳子
            var actionValue = skillID || null;

            // 每消除一个元素加一
            disCount++;
            fs.DisFactory.waitRemoveNum--;

            // 执行层事件
            if (skillID == undefined) {
                fs.LayerManager.layerPropagation(index, color, 'action_self', actionValue, len);
            }

            // 所有方格处理完成
            if (disCount == len) {

                // 技能消除并生成技能
                if (skillID != undefined) {
                    // 循环消除
                    for (var k in pos) {
                        var place = pos[k];
                        fs.LayerManager.layerPropagation(place, color, 'action_self', actionValue, len);
                    }
                    // 生成技能
                    fs.BaseLayer.makeSkill(skillID, skillPos, color, pos, isSquare, toIndex);
                }

                // 旁格消除
                var rangePosList = fs.BaseLayer.getRangePos(pos);
                for (var l in rangePosList) {
                    var rangeIndex = rangePosList[l];
                    var rangeTile = fs.LayerManager.tilesList.element[rangeIndex];

                    if (rangeTile != null && rangeTile.hasOwnProperty("delFlag") && !rangeTile.delFlag) {
                        fs.LayerManager.layerPropagation(rangeIndex, color, 'action_round', actionValue);
                    }
                }

                if (fs.DisFactory.waitRemoveNum == 0) {
                    if (fs.GameManager.comboCount == 1) {
                        fs.AudioManager.playSound(1);
                    } else if (fs.GameManager.comboCount == 2) {
                        fs.AudioManager.playSound(2);
                    } else {
                        fs.AudioManager.playSound(3);
                    }

                    // 延迟开启主逻辑，主要用于爆炸后延迟掉落
                    fs.Game.timer.add(350, function () {
                        fs.GameManager.isMainLogicSwitch = true;
                    });
                }
            }
        };

        // 如果为横竖技能生成或香菇
        if (skillID != undefined && (skillID == 1104 || (skillID >= 1007 && skillID <= 1018))) {
            // 执行技能合成动画，完成后回调生成技能（只有横竖技能和香菇有合成效果）
            tile.moveSkill(toIndex, tileAction);
        } else {
            // 其他技能消除或三消
            tileAction();
        }
    }

};

// 检测元素消除
// model 为true时只进行检测
DisFactory.checkElement = function (model, table) {
    var source = table || fs.LayerManager.tilesList.element;

    // 获取相连元素组合集
    var mData = fs.DisFactory.getLinkPosition(source);

    // 根据相连元素，进一步判断形状
    var sData = fs.DisFactory.getShape(mData);

    // 检测模式只返回布尔值，非检测模式执行消除
    if (model) {
        if (sData.length <= 0) {
            return false;
        } else {
            return true;
        }
    } else if (sData.length > 0) {
        // 设置待消除元素为删除状态
        for (var i = 0, len = sData.length; i < len; i++) {
            var single = sData[i].pos;
            for (var j = 0, _len = single.length; j < _len; j++) {
                var _tile = fs.LayerManager.tilesList.element[single[j]];
                _tile.setDelFlag(true);
            }
        }

        // 执行消除
        for (var i in sData) {
            fs.DisFactory.disappear(sData[i]);
        }
    }
};

// 根据连在一起元素位置列表，过滤掉无法消除的组合
DisFactory.getShape = function (linkRes) {
    var result = [];
    var sRes = linkRes[0];
    var mRes = linkRes[1];
    var tRes = linkRes[2];

    // 循环结果集
    sRes.forEach(function (item, index) {
        var curData = mRes[index],
            otherArray = {},
            _r = [],
            aArray = [],
            bArray = [],
            cArray = [],
            dArray = [],
            eArray = [],
            fArray = [],
            hcArray = [],
            vcArray = [];

        //其他相连方块是否可形成消除
        var checkOtherLink = function (res, model) {
            // 检测模式检测是否有其他方块
            if (model) {
                if (item.length > res.length) {
                    return true;
                } else {
                    return false;
                }
            } else {
                if (item.length > res.length) {
                    // 获取其他相连元素位置
                    item.forEach(function (tile, pos) {
                        if (res.indexOf(tile) == -1) {
                            otherArray[pos] = tile;
                        }
                    });

                    // 判断其他相连元素是否可形成消除
                    curData.forEach(function (tile, pos) {
                        if (otherArray.hasOwnProperty(pos)) {
                            if (tile.hc >= 3 || tile.vc >= 3) {
                                res.push(otherArray[pos]);
                            } else if (tile.hc == 2 && tile.vc == 2) {
                                // 是否可形成正方形
                                var a = 0,
                                    b = 0,
                                    c = 0,
                                    d = 0,
                                    oa = otherArray[pos];

                                var pos = fs.CommonLayer.getRowColunm(otherArray[pos]);

                                // 是否和已排除元素相连，如果相连则排除
                                [
                                    oa - 9, // 上
                                    oa - 9 - 1, // 左上
                                    oa - 1 // 左

                                ].forEach(function (direction) {
                                    var index = fs.CommonLayer.getRowColunm(direction);
                                    if (tRes[index[0]] && (tRes[index[0]][index[1]].color == tRes[pos[0]][pos[1]].color)) {
                                        a++;
                                    }
                                });

                                [
                                    oa - 9, // 上
                                    oa - 9 + 1, // 右上
                                    oa + 1 // 右

                                ].forEach(function (direction) {
                                    var index = fs.CommonLayer.getRowColunm(direction);
                                    if (tRes[index[0]] && (tRes[index[0]][index[1]].color == tRes[pos[0]][pos[1]].color)) {
                                        b++;
                                    }
                                });

                                [
                                    oa - 1, // 左
                                    oa + 9 - 1, // 左下
                                    oa + 9 // 下

                                ].forEach(function (direction) {
                                    var index = fs.CommonLayer.getRowColunm(direction);
                                    if (tRes[index[0]] && (tRes[index[0]][index[1]].color == tRes[pos[0]][pos[1]].color)) {
                                        c++;
                                    }
                                });

                                [
                                    oa + 1, // 右
                                    oa + 9 + 1, // 右下
                                    oa + 9 // 下

                                ].forEach(function (direction) {
                                    var index = fs.CommonLayer.getRowColunm(direction);
                                    if (tRes[index[0]] && (tRes[index[0]][index[1]].color == tRes[pos[0]][pos[1]].color)) {
                                        d++;
                                    }
                                });

                                if (a == 3 || b == 3 || c == 3 || d == 3) {
                                    res.push(oa);
                                }
                            }

                        }
                    });
                }
                return res;
            }
        };

        // 检测是否形成磁铁
        var checkMagnet = function (res) {

            // 重排数组
            res = res.sort(fs.BaseLayer.sortNumber);

            // 获取其他相连元素位置
            item.forEach(function (tile, pos) {
                if (res.indexOf(tile) == -1) {
                    otherArray[pos] = tile;
                }
            });

            // 判断是否有相连元素位于中间位置
            for (var i in otherArray) {
                if (otherArray[i] + 9 == res[2] || otherArray[i] - 9 == res[2] || otherArray[i] + 1 == res[2] || otherArray[i] - 1 == res[2]) {
                    res.push(otherArray[i]);
                    return [true, res];
                }
            }
            return [false, res];
        };

        // 横竖大于5则为磁铁
        item.forEach(function (element, place) {
            if (curData[place].hc >= 6 || curData[place].vc >= 6) {
                aArray.push(element);
            }
        });

        if (aArray.length > 0) {
            // 是磁铁
            var _r = checkOtherLink(aArray);
            var resObj = fs.DisFactory.getDisResult(curData[0].color, _r, false, 'magnet');
            result.push(resObj);
            fs.Game.log.trace('磁铁: {0}', _r);
            return;
        }

        // 如果横竖都为5，则判断磁铁或彩虹
        item.forEach(function (element, place) {
            if (curData[place].hc == 5 || curData[place].vc == 5) {
                bArray.push(element);
            }
        });

        if (bArray.length > 0) {
            if (checkOtherLink(bArray, true)) {
                var _res = checkMagnet(bArray);
                if (_res[0]) {
                    // 是磁铁
                    var _r = checkOtherLink(_res[1]);
                    var resObj = fs.DisFactory.getDisResult(curData[0].color, _r, false, 'magnet');
                    result.push(resObj);
                    fs.Game.log.trace('磁铁: {0}', _r);
                    return;
                } else {
                    // 是彩虹
                    var _r = checkOtherLink(bArray);
                    var resObj = fs.DisFactory.getDisResult(curData[0].color, _r, false, 'rainbow');
                    result.push(resObj);
                    fs.Game.log.trace('彩虹: {0}', _r);
                    return;
                }
            } else {
                // 没有其他多余方块则为彩虹
                var resObj = fs.DisFactory.getDisResult(curData[0].color, bArray, false, 'rainbow');
                result.push(resObj);
                fs.Game.log.trace('彩虹: {0}', bArray);
                return;
            }
        }

        // T形和L形消
        var crossPoint;
        item.forEach(function (element, place) {
            // 获取交叉点
            if ((curData[place].hc <= 4 && curData[place].hc >= 3) && (curData[place].vc <= 4 && curData[place].vc >= 3)) {
                crossPoint = element;
            }

            // 获取横列
            if (curData[place].hc <= 4 && curData[place].hc >= 3) {
                hcArray.push(element);
            }

            // 获取竖列
            if (curData[place].vc <= 4 && curData[place].vc >= 3) {
                vcArray.push(element);
            }

            if ((curData[place].hc <= 4 && curData[place].hc >= 3) || (curData[place].vc <= 4 && curData[place].vc >= 3)) {
                cArray.push(element);
            }
        });

        // 如果存在交叉点则进一步判断是T形或L形
        if (crossPoint) {
            var h = hcArray.length - 1;
            var v = vcArray.length - 1;

            // 重排横竖数组
            hcArray = hcArray.sort(fs.BaseLayer.sortNumber);
            vcArray = vcArray.sort(fs.BaseLayer.sortNumber);

            if ((crossPoint == hcArray[h] && crossPoint == vcArray[v]) || (crossPoint == hcArray[0] && crossPoint == vcArray[v]) || (crossPoint == hcArray[h] && crossPoint == vcArray[0]) || (crossPoint == hcArray[0] && crossPoint == vcArray[0])) {
                // 是L形
                var _r = checkOtherLink(cArray);
                var resObj = fs.DisFactory.getDisResult(curData[0].color, _r, false, 'jelly');
                result.push(resObj);
                fs.Game.log.trace('L形: {0}', _r);
                return;
            } else {
                // 是T形
                var _r = checkOtherLink(cArray);
                var resObj = fs.DisFactory.getDisResult(curData[0].color, _r, false, 'xx');
                result.push(resObj);
                fs.Game.log.trace('T形: {0}', _r);
                return;
            }
        }

        // 正方形消
        var fourArray = [];

        item.forEach(function (element, place) {
            if (curData[place].hc >= 2 && curData[place].vc >= 2) {
                fourArray.push(element);
            }
        });

        if (fourArray.length >= 4) {

            fourArray = fourArray.sort(fs.BaseLayer.sortNumber);
            var newFourArray = fourArray.slice(0, 4);

            var sum = newFourArray.reduce(function (previous, current, index, array) {
                return previous + current;
            });

            if (!(sum % 4)) {
                var _r = checkOtherLink(newFourArray);
                var resObj = fs.DisFactory.getDisResult(curData[0].color, _r, true, 'randomHV');
                result.push(resObj);
                fs.Game.log.trace('正方形消: {0}', _r);
                return;
            }
        }

        // 竖向四消
        item.forEach(function (element, place) {
            if (curData[place].vc === 4) {
                dArray.push(element);
            }
        });

        if (dArray.length) {
            var _r = checkOtherLink(dArray);
            var resObj = fs.DisFactory.getDisResult(curData[0].color, _r, false, 'horizon');
            result.push(resObj);
            fs.Game.log.trace('竖向四消: {0}', _r);
            return;
        }

        // 横向向四消
        item.forEach(function (element, place) {
            if (curData[place].hc === 4) {
                eArray.push(element);
            }
        });

        if (eArray.length) {
            var _r = checkOtherLink(eArray);
            var resObj = fs.DisFactory.getDisResult(curData[0].color, _r, false, 'vertical');
            result.push(resObj);
            fs.Game.log.trace('横向四消: {0}', _r);
            return;
        }

        // 三消
        item.forEach(function (element, place) {
            if (curData[place].hc == 3 || curData[place].vc == 3) {
                fArray.push(element);
            }
        });

        if (fArray.length) {
            var _r = checkOtherLink(fArray);
            var resObj = fs.DisFactory.getDisResult(curData[0].color, _r, false);
            result.push(resObj);
            fs.Game.log.trace('三消: {0}', _r);
            return;
        }

    });
    return result;
};

// 组合消除对象
// color 消除的颜色
// disArray 消除位置列表
// class3 元素Tile表格class3类型
// isSquare 是否为正方形消除
DisFactory.getDisResult = function (color, disArray, isSquare, class3) {
    var resObj = {
        "pos": disArray,
        "color": color
    };

    // 只有基本的6色方块才能形成技能
    if (color <= 6 && class3 != undefined) {
        // 获取技能ID
        resObj.skillID = fs.BaseLayer.getSkillTileID(color, class3, isSquare);
        // 获取技能生成点
        resObj.skillPos = fs.BaseLayer.getSkillPosition(color, disArray, false);
        resObj.isSquare = isSquare;
    }

    // 香菇
    if (color == 9) {
        // 获取技能ID
        resObj.skillID = 1104;
        resObj.isSquare = false;

        // 从小到大重新排序
        var c = disArray.slice(0);
        c.sort(fs.BaseLayer.sortNumber);

        // 生成点始终减2
        var _len = c.length - 2;
        var _dis = c.slice(0, _len);

        // 获取技能生成点
        resObj.skillPos = _dis;
    }

    return resObj;
};

// 获取连在一起的元素位置组合
DisFactory.getLinkPosition = function (sourceTable, w, h, limit) {
    var list;
    var table = [];
    var i, j, k;
    var head, tail;
    var count, lastColor, color;
    var slot;
    var xi, xj, yi, yj, yslot;
    var output = [
        [],
        []
    ],
        singleOutput;
    var multipleOutput = [];
    w = w || 9;
    h = h || 8;
    limit = limit || 2;

    var hash = function (i, j) {
        return i * w + j;
    };

    for (i = 0; i < h; i++) {
        table.push([]);
        for (j = 0; j < w; j++) {
            // 已删除或没有三消属性的元素color默认为null
            var c = sourceTable[hash(i, j)] && !sourceTable[hash(i, j)].delFlag && sourceTable[hash(i, j)].isElimination ? sourceTable[hash(i, j)].color : null;
            table[i].push({
                color: c
            });
        }
    }

    // 横向统计
    for (i = 0; i < h; i++) {
        lastColor = -1;
        for (j = 0; j <= w; j++) {
            slot = table[i][j] || {};
            color = slot.color;

            if (color !== lastColor) {
                // 向前找所有跟我一样的 slot，记录横向数量
                for (k = j - 1; k >= 0; k--) {

                    if (table[i][k].color === lastColor) {

                        // 如果为没有颜色的方块（空阻挡、空可通过、初始空方格等）则默认count为1
                        if (table[i][k].color != null) {
                            table[i][k].hc = count;
                        } else {
                            table[i][k].hc = 1;
                        }
                    } else {
                        break;
                    }

                }
                count = 1;
                lastColor = color;
            } else count++;
        }
    }

    // 纵向统计
    for (j = 0; j < w; j++) {
        lastColor = -1;
        for (i = 0; i <= h; i++) {
            slot = (i == h ? {} : table[i][j]);
            color = slot.color;

            if (color !== lastColor) {
                // 向上找所有跟我一样的 slot，记录纵向数量
                for (k = i - 1; k >= 0; k--) {
                    if (table[k][j].color === lastColor) {

                        // 如果为没有颜色的方块（空阻挡、空可通过、初始空方格等）则默认count为1
                        if (table[k][j].color != null) {
                            table[k][j].vc = count;
                        } else {
                            table[k][j].vc = 1;
                        }

                    } else {
                        break;
                    }
                }
                count = 1;
                lastColor = color;
            } else count++;
        }
    }

    // 广度优先遍历，查询相连在一起元素
    for (i = 0; i < h; i++) {
        for (j = 0; j < w; j++) {

            // 获取方格对象
            slot = table[i][j];

            // 判断是否到达基本消除数量、是否已被访问
            if (slot.hc < limit && slot.vc < limit) continue;
            if (slot.visited) continue;

            // new begin slot
            list = [];

            // 记录可消除位置
            singleOutput = [hash(i, j)];
            multipleOutput = [slot];

            list.push([i, j]);

            slot.visited = true;

            head = 0;
            tail = 1;

            color = slot.color;

            while (head < tail) {
                xi = list[head][0];
                xj = list[head][1];
                head++;

                // 四方查找
                [
                    [-1, 0], // 上
                    [1, 0], // 下
                    [0, -1], // 左
                    [0, 1] // 右
                ].forEach(function (direction) {
                    yi = xi + direction[0];
                    yj = xj + direction[1];

                    if (!table[yi]) return;
                    if (!(yslot = table[yi][yj])) return;

                    if (yslot.visited ||
                        yslot.color !== color ||
                        (yslot.hc < limit && yslot.vc < limit))
                        return;

                    list.push([yi, yj]);
                    tail++;
                    yslot.visited = true;

                    singleOutput.push(hash(yi, yj));
                    multipleOutput.push(yslot);
                });
            }

            // 排除3个以下的相连组合
            if (singleOutput.length > 2) {
                // 获取只有位置的数组
                output[0].push(singleOutput);
                // 获取带有颜色类型、横竖记录的数组，用于后面进一步筛选消除形状
                output[1].push(multipleOutput);
            }
        }
    }
    // 获取整个盘面的记录
    output[2] = table;
    return output;
};

/**
 * [changeObjBuilder 提示消除位置]
 * @param  {[int]} i      [位置索引]
 * @param  {[string]} checkStyle [检测的方式]
 * @return {[obj]}  _positionInfo   [返回一个带交换位置的信息]
 *_positionInfo = {
 *      index:[索引],
 *      changeTarget_first: [可交换元素1号],
 *      changeTarget_second:[可交换元素2号]
 *}
 */
DisFactory.changeObjBuilder = function (i, checkStyle) {
    var self = this;
    // 纵向的检测
    if (checkStyle == "verticalTopLeft") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 18;
        _positionInfo.changeTarget_second = i - 19;

        return _positionInfo;
    }

    if (checkStyle == "verticalTopRight") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 18;
        _positionInfo.changeTarget_second = i - 17;

        return _positionInfo;

    }
    if (checkStyle == "verticalBottomLeft") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i + 9;
        _positionInfo.changeTarget_second = i + 8;

        return _positionInfo;

    }
    if (checkStyle == "verticalBottomRight") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i + 9;
        _positionInfo.changeTarget_second = i + 10;

        return _positionInfo;

    }
    if (checkStyle == "verticalDoubleLeft") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 9;
        _positionInfo.changeTarget_second = i - 10;

        return _positionInfo;

    }
    if (checkStyle == "verticalDoubleRight") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 9;
        _positionInfo.changeTarget_second = i - 8;

        return _positionInfo;

    }
    if (checkStyle == "verticalTopTop") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 18;
        _positionInfo.changeTarget_second = i - 27;

        return _positionInfo;

    }
    if (checkStyle == "verticalBottomBottom") {
        var _positionInfo = {};

        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i + 9;
        _positionInfo.changeTarget_second = i + 18;

        return _positionInfo;

    }

    // 横向的检测
    if (checkStyle == "horizontalTopLeft") {
        var _positionInfo = {};

        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 2;
        _positionInfo.changeTarget_second = i - 11;

        return _positionInfo;

    }

    if (checkStyle == "horizontalTopRight") {
        var _positionInfo = {};

        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i + 1;
        _positionInfo.changeTarget_second = i - 8;

        return _positionInfo;

    }

    if (checkStyle == "horizontalBottomLeft") {
        var _positionInfo = {};

        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 2;
        _positionInfo.changeTarget_second = i + 7;

        return _positionInfo;

    }

    if (checkStyle == "horizontalBottomRight") {
        var _positionInfo = {};

        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i + 1;
        _positionInfo.changeTarget_second = i + 10;

        return _positionInfo;

    }

    if (checkStyle == "horizontalDoubleTop") {
        var _positionInfo = {};

        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 1;
        _positionInfo.changeTarget_second = i - 10;

        return _positionInfo;

    }

    if (checkStyle == "horizontalDoubleBottom") {
        var _positionInfo = {};

        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 1;
        _positionInfo.changeTarget_second = i + 8;

        return _positionInfo;

    }

    if (checkStyle == "horizontalLeftLeft") {
        var _positionInfo = {};

        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i - 2;
        _positionInfo.changeTarget_second = i - 3;

        return _positionInfo;

    }

    if (checkStyle == "horizontalRightRight") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i + 1;
        _positionInfo.changeTarget_second = i + 2;
        return _positionInfo;
    }

    // 技能交换
    if (checkStyle == "skillTop") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i;
        _positionInfo.changeTarget_second = i - 9;
        return _positionInfo;
    }

    if (checkStyle == "skillBottom") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i;
        _positionInfo.changeTarget_second = i + 9;
        return _positionInfo;
    }

    if (checkStyle == "skillLeft") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i;
        _positionInfo.changeTarget_second = i - 1;
        return _positionInfo;
    }

    if (checkStyle == "skillRight") {
        var _positionInfo = {};
        _positionInfo.index = i;
        _positionInfo.changeTarget_first = i;
        _positionInfo.changeTarget_second = i + 1;
        return _positionInfo;
    }
}

/**
 * [checkMapDie 死图逻辑]
 * @param [obj] obj [整个生成的地图对象]
 * @return [bolean] [true:死图]
 */
DisFactory.checkMapDie = function () {
    var self = this;
    var obj = fs.LayerManager.tilesList.element;
    var _flagList = [];

    for (var i = 0; i < 72; i++) {

        if (obj[i] != null && obj[i]["class1"] == "skill") {
            // 第一排
            if (i < 9) {
                // 检测技能下方
                if (self.checkPosition(i, "skillBottom")) {
                    var _m = self.changeObjBuilder(i, "skillBottom");
                    _flagList.push(_m);
                }
                // 检测技能左侧
                if (i % 9 > 0) {
                    if (self.checkPosition(i, "skillLeft")) {
                        var _m = self.changeObjBuilder(i, "skillLeft");
                        _flagList.push(_m);
                    }
                }
                // 检测技能右侧
                if (i % 9 < 8) {
                    if (self.checkPosition(i, "skillRight")) {
                        var _m = self.changeObjBuilder(i, "skillRight");
                        _flagList.push(_m);
                    }
                }

            }

            // 2~倒数第2排
            if (i >= 9 && i < 63) {
                // 检测技能下方
                if (self.checkPosition(i, "skillBottom")) {
                    var _m = self.changeObjBuilder(i, "skillBottom");
                    _flagList.push(_m);
                }
                // 检测技能左侧
                if (i % 9 > 0) {
                    if (self.checkPosition(i, "skillLeft")) {
                        var _m = self.changeObjBuilder(i, "skillLeft");
                        _flagList.push(_m);
                    }
                }
                // 检测技能右侧
                if (i % 9 < 8) {
                    if (self.checkPosition(i, "skillRight")) {
                        var _m = self.changeObjBuilder(i, "skillRight");
                        _flagList.push(_m);
                    }
                }
                // 检测技能上方
                if (self.checkPosition(i, "skillTop")) {
                    var _m = self.changeObjBuilder(i, "skillTop");
                    _flagList.push(_m);
                }
            }

            if (i >= 63) {
                // 检测技能上方
                if (self.checkPosition(i, "skillTop")) {
                    var _m = self.changeObjBuilder(i, "skillTop");
                    _flagList.push(_m);
                }
                // 检测技能左侧
                if (i % 9 > 0) {
                    if (self.checkPosition(i, "skillLeft")) {
                        var _m = self.changeObjBuilder(i, "skillLeft");
                        _flagList.push(_m);
                    }
                }
                // 检测技能右侧
                if (i % 9 < 8) {
                    if (self.checkPosition(i, "skillRight")) {
                        var _m = self.changeObjBuilder(i, "skillRight");
                        _flagList.push(_m);
                    }
                }
            }

        }
        // 用来记录信息，如果有双连的情况，则记录
        //检查第一个
        if (i == 0) {
            continue;
        } else if (obj[i] != undefined && (obj[i].id <= 1030 || obj[i].id == 1101 || obj[i].id == 1103 || obj[i].id == 1104)) {
            // i不等于0的情况
            // 只有在id<=1030前的元素才带有颜色信息
            // 第一排
            if (i > 0 && i < 9) {
                // 横排情况  两连接加斜角
                if (i % 9 > 1) {
                    // 横排两连左下角检测
                    if (self.checkPosition(i, "horizontalBottomLeft")) {
                        var _m = self.changeObjBuilder(i, "horizontalBottomLeft");
                        _flagList.push(_m);
                    }

                    // 横排中空下检测
                    if (self.checkPosition(i, "horizontalDoubleBottom")) {
                        var _m = self.changeObjBuilder(i, "horizontalDoubleBottom");
                        _flagList.push(_m);
                    }

                    // 横排2连左左
                    if (i % 9 > 2 && i % 9 < 8) {
                        if (self.checkPosition(i, "horizontalLeftLeft")) {
                            var _m = self.changeObjBuilder(i, "horizontalLeftLeft");
                            _flagList.push(_m);
                        }
                    }
                }

                //横排两连右右
                if (i % 9 < 7 && i % 9 > 0) {
                    if (self.checkPosition(i, "horizontalRightRight")) {
                        var _m = self.changeObjBuilder(i, "horizontalRightRight");
                        // console.log(_m);

                        _flagList.push(_m);
                    }
                }

                // 横排两连右下角
                if (i % 9 < 8) {
                    if (self.checkPosition(i, "horizontalBottomRight")) {
                        var _m = self.changeObjBuilder(i, "horizontalBottomRight");
                        _flagList.push(_m);
                    }
                }
            }

            // 2到7排
            if (i >= 9 && i < 63) {

                if (i % 9 < 7 && i % 9 > 0) {
                    //横排两连右右
                    if (self.checkPosition(i, "horizontalRightRight")) {
                        var _m = self.changeObjBuilder(i, "horizontalRightRight");
                        _flagList.push(_m);
                    }
                }

                // 横排2连左左
                if (i % 9 > 2) {
                    if (self.checkPosition(i, "horizontalLeftLeft")) {
                        var _m = self.changeObjBuilder(i, "horizontalLeftLeft");
                        _flagList.push(_m);
                    }
                }

                if (i % 9 < 8) {
                    // 竖排两连右下角
                    if (self.checkPosition(i, "verticalBottomRight")) {
                        var _m = self.changeObjBuilder(i, "verticalBottomRight");
                        _flagList.push(_m);
                    }
                }

                if (i % 9 > 0) {
                    // 竖排两连左下角
                    if (self.checkPosition(i, "verticalBottomLeft")) {
                        var _m = self.changeObjBuilder(i, "verticalBottomLeft");
                        _flagList.push(_m);
                    }
                }

                if (i % 9 != 0) {
                    if (i % 9 < 8) {
                        // 横排两连右下角（排除最后一列的情况）
                        if (self.checkPosition(i, "horizontalBottomRight")) {
                            var _m = self.changeObjBuilder(i, "horizontalBottomRight");
                            _flagList.push(_m);
                        }
                        // 横排两连右上角
                        if (self.checkPosition(i, "horizontalTopRight")) {
                            var _m = self.changeObjBuilder(i, "horizontalTopRight");
                            _flagList.push(_m);
                        }
                    }

                    if (i % 9 > 1) {

                        // 横排两连左下角（排除第一排和第二排情况）
                        if (self.checkPosition(i, "horizontalBottomLeft")) {
                            var _m = self.changeObjBuilder(i, "horizontalBottomLeft");
                            _flagList.push(_m);
                        }

                        // 横排两连左上角（排除第一排和第二排情况）
                        if (self.checkPosition(i, "horizontalTopLeft")) {
                            var _m = self.changeObjBuilder(i, "horizontalTopLeft");
                            _flagList.push(_m);
                        }

                        // 横排中空上
                        if (self.checkPosition(i, "horizontalDoubleTop")) {
                            var _m = self.changeObjBuilder(i, "horizontalDoubleTop");
                            _flagList.push(_m);
                        }

                        // 横排中空下
                        if (self.checkPosition(i, "horizontalDoubleBottom")) {
                            var _m = self.changeObjBuilder(i, "horizontalDoubleBottom");
                            _flagList.push(_m);
                        }
                    }

                }

                // 竖排情况(必须要从第三排开始计算)
                if (i <= 53) {
                    // 竖排两连下下
                    if (self.checkPosition(i, "verticalBottomBottom")) {
                        var _m = self.changeObjBuilder(i, "verticalBottomBottom");
                        _flagList.push(_m);
                    }
                }

                if (i > 17) {
                    if (i % 9 > 0) {
                        if (i % 9 > 1) {
                            // 检测竖排两连左上角(排除最左侧)
                            if (self.checkPosition(i, "verticalTopLeft")) {
                                var _m = self.changeObjBuilder(i, "verticalTopLeft");
                                _flagList.push(_m);
                            }
                        }

                        // 竖排中空左检测
                        if (self.checkPosition(i, "verticalDoubleLeft")) {
                            var _m = self.changeObjBuilder(i, "verticalDoubleLeft");
                            _flagList.push(_m);
                        }
                    }

                    if (i % 9 < 8) {
                        if (i % 9 < 8) {
                            // 竖排两连右上角(排除最右侧)
                            if (self.checkPosition(i, "verticalTopRight")) {
                                var _m = self.changeObjBuilder(i, "verticalTopRight");
                                _flagList.push(_m);
                            }
                        }

                        // s竖排中空右
                        if (self.checkPosition(i, "verticalDoubleRight")) {
                            var _m = self.changeObjBuilder(i, "verticalDoubleRight");
                            _flagList.push(_m);
                        }
                    }

                    if (i >= 27) {
                        // 竖排两连上上
                        if (self.checkPosition(i, "verticalTopTop")) {
                            var _m = self.changeObjBuilder(i, "verticalTopTop");
                            _flagList.push(_m);
                        }
                    }
                }
            }

            // 最后一排
            if (i >= 63) {
                if (self.checkPosition(i, "verticalTopTop")) {
                    var _m = self.changeObjBuilder(i, "verticalTopTop");
                    _flagList.push(_m);
                }

                if (i % 9 > 0) {
                    //横排
                    if (i % 9 > 1) {
                        // 横排两连左上角检测
                        if (self.checkPosition(i, "horizontalTopLeft")) {
                            var _m = self.changeObjBuilder(i, "horizontalTopLeft");
                            _flagList.push(_m);
                        }

                        // 横排中空上检测
                        if (self.checkPosition(i, "horizontalDoubleTop")) {
                            var _m = self.changeObjBuilder(i, "horizontalDoubleTop");
                            _flagList.push(_m);
                        }

                        // 横排2连左左
                        if (i % 9 > 2 && i % 9 < 8) {
                            if (self.checkPosition(i, "horizontalLeftLeft")) {
                                var _m = self.changeObjBuilder(i, "horizontalLeftLeft");
                                _flagList.push(_m);
                            }
                        }

                        // 横排2连右右
                        if (i % 9 < 7 && i % 9 > 0) {
                            if (self.checkPosition(i, "horizontalRightRight")) {
                                var _m = self.changeObjBuilder(i, "horizontalRightRight");
                                _flagList.push(_m);
                            }
                        }

                        // 检测竖排两连左上角(排除最左侧)
                        if (self.checkPosition(i, "verticalTopLeft")) {
                            var _m = self.changeObjBuilder(i, "verticalTopLeft");
                            _flagList.push(_m);
                        }
                    }

                    // 竖排中空左检测
                    if (self.checkPosition(i, "verticalDoubleLeft")) {
                        var _m = self.changeObjBuilder(i, "verticalDoubleLeft");
                        _flagList.push(_m);
                    }
                }

                if (i % 9 < 8) {
                    // 竖排两连右上角(排除最右侧)
                    if (self.checkPosition(i, "verticalTopRight")) {
                        var _m = self.changeObjBuilder(i, "verticalTopRight");
                        _flagList.push(_m);
                    }

                    //    竖排中空右
                    if (self.checkPosition(i, "verticalDoubleRight")) {
                        var _m = self.changeObjBuilder(i, "verticalDoubleRight");
                        _flagList.push(_m);
                    }

                    if (i % 9 > 0) {
                        // 横排两连右上角
                        if (self.checkPosition(i, "horizontalTopRight")) {
                            var _m = self.changeObjBuilder(i, "horizontalTopRight");
                            _flagList.push(_m);
                        }
                    }
                }
            }
        }
    }

    var _tempFlagList = [];

    for (var item in _flagList) {
        if (!fs.BaseLayer.isBinded(_flagList[item].changeTarget_first) && !fs.BaseLayer.isBinded(_flagList[item].changeTarget_second)) {
            _tempFlagList.push(_flagList[item]);
        }
    }

    _flagList = _tempFlagList;

    if (_flagList.length == 0) {
        console.warn('死图了');
        return true;
    } else {
        //没死图则返回可交换元素的列表
        return _flagList;
    }
}

/**
 * [eliminateNotice 消除元素提示]
 * @param  {[type]} _flagList [description]
 * @return {[type]}           [description]
 */
DisFactory.eliminateNotice = function (_flagList) {
    var self = this;
    _flagList = self.eliminateNoticeList;
    // console.log(_flagList);
    if (_flagList === true) {
        return;
    }
    if (fs.GameManager.FSM.state == 'waitUser') {

        if (fs.GameManager.eliminateNoticeSwitch == true) {
            if (self.isgoShuffle == 0) {
                _flagList = fs.Game.math.shuffle(_flagList);
                // 打乱提示列表的数字，生成一个随机的元素消除提示点
                self.isgoShuffle = 1;
            }
            // 第一个可交换的元素
            var firstNode = _flagList[0].changeTarget_first;
            // 第二个可交换的元素
            var secondNode = _flagList[0].changeTarget_second;
            var relation = fs.CommonLayer.getRelation(firstNode, secondNode);
            // 播放不能交换动画
            var a = fs.LayerManager.tilesList.element[firstNode];
            var b = fs.LayerManager.tilesList.element[secondNode];
            var _swapCount = 2;

            var swapComplete = function () {
                if (--_swapCount <= 0) {
                    self.game.input.mouse.enable = true;
                    self.game.input.touch.enable = true;
                }
            }

            if (a != null && b != null) {

                if (relation == 'left') {
                    a.noticeSwap('right', swapComplete);
                    b.noticeSwap('left', swapComplete);
                }

                if (relation == 'right') {
                    a.noticeSwap('left', swapComplete);
                    b.noticeSwap('right', swapComplete);
                }

                if (relation == 'top') {
                    a.noticeSwap('bottom', swapComplete);
                    b.noticeSwap('top', swapComplete);
                }

                if (relation == 'bottom') {
                    a.noticeSwap('top', swapComplete);
                    b.noticeSwap('bottom', swapComplete);
                }

            }
        } else {
            self.isgoShuffle = 0;
        }
    }

}

/**
 * [checkPosition 位置检测管理器]
 * @param  {[int]} index [检测元素的位置]
 * @param  {[string]} name  [所要检测方向和类型]
 * @return {[bolean]}       [是否为可消元素]
 */
DisFactory.checkPosition = function (index, name) {
    var self = this;

    // 纵向的检测
    if (name == "verticalTopLeft") {
        return self.verticalTopLeft(index);
    }

    if (name == "verticalTopRight") {
        return self.verticalTopRight(index);
    }

    if (name == "verticalBottomLeft") {
        return self.verticalBottomLeft(index);
    }

    if (name == "verticalBottomRight") {
        return self.verticalBottomRight(index);
    }

    if (name == "verticalDoubleLeft") {
        return self.verticalDoubleLeft(index);
    }

    if (name == "verticalDoubleRight") {
        return self.verticalDoubleRight(index);
    }

    if (name == "verticalTopTop") {
        return self.verticalTopTop(index);
    }

    if (name == "verticalBottomBottom") {
        return self.verticalBottomBottom(index);
    }

    // 横向的检测
    if (name == "horizontalTopLeft") {
        return self.horizontalTopLeft(index);
    }

    if (name == "horizontalTopRight") {
        return self.horizontalTopRight(index);
    }

    if (name == "horizontalBottomLeft") {
        return self.horizontalBottomLeft(index);
    }

    if (name == "horizontalBottomRight") {
        return self.horizontalBottomRight(index);
    }

    if (name == "horizontalDoubleTop") {
        return self.horizontalDoubleTop(index);
    }

    if (name == "horizontalDoubleBottom") {
        return self.horizontalDoubleBottom(index);
    }

    if (name == "horizontalLeftLeft") {
        return self.horizontalLeftLeft(index);
    }

    if (name == "horizontalRightRight") {
        return self.horizontalRightRight(index);
    }

    //技能检测 
    if (name == "skillTop") {
        return self.skillTop(index);
    }
    if (name == "skillBottom") {
        return self.skillBottom(index);
    }
    if (name == "skillLeft") {
        return self.skillLeft(index);
    }
    if (name == "skillRight") {
        return self.skillRight(index);
    }
}

// 技能检测上
DisFactory.skillTop = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    // 磁铁和彩虹的判断
    if (obj[index].id == 1031 || obj[index].id == 1032) {
        if (obj[index - 9] != null && obj[index - 9].class1 == "base") {
            return true;

        } else {
            return false;
        }
    }

    if (obj[index - 9] != null && obj[index].class1 == obj[index - 9].class1) {
        return true;
    } else {
        return false;
    }
}

// 技能检测下
DisFactory.skillBottom = function (index) {
    var obj = fs.LayerManager.tilesList.element;

    // 磁铁和彩虹的判断
    if (obj[index].id == 1031 || obj[index].id == 1032) {
        if (obj[index + 9] != null && obj[index + 9].class1 == "base") {
            return true;

        } else {
            return false;
        }
    }

    if (obj[index + 9] != null && obj[index].class1 == obj[index + 9].class1) {
        return true;
    } else {
        return false;
    }
}

// 技能检测左
DisFactory.skillLeft = function (index) {
    var obj = fs.LayerManager.tilesList.element;

    // 磁铁和彩虹的判断
    if (obj[index].id == 1031 || obj[index].id == 1032) {
        if (obj[index - 1] != null && obj[index - 1].class1 == "base") {
            return true;

        } else {
            return false;
        }
    }

    if (obj[index - 1] != null && obj[index].class1 == obj[index - 1].class1) {
        return true;
    } else {
        return false;
    }
}

// 技能检测右
DisFactory.skillRight = function (index) {
    var obj = fs.LayerManager.tilesList.element;

    // 磁铁和彩虹的判断
    if (obj[index].id == 1031 || obj[index].id == 1032) {
        if (obj[index + 1] != null && obj[index + 1].class1 == "base") {
            return true;
        } else {
            return false;
        }
    }

    if (obj[index + 1] != null && obj[index].class1 == obj[index + 1].class1) {
        return true;
    } else {
        return false;
    }
}

// 竖排2连上上
DisFactory.verticalTopTop = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 9] == null || obj[index - 27] == null || obj[index - 18] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 9].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 27].id) && obj[index - 18].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 竖排2连下下
DisFactory.verticalBottomBottom = function (index) {
    // console.log(index);
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 9] == null || obj[index + 18] == null || obj[index + 9] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 9].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index + 18].id) && obj[index + 9].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 竖排2连左上角检测
DisFactory.verticalTopLeft = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 9] == null || obj[index - 19] == null || obj[index - 18] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 9].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 19].id) && obj[index - 18].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 竖排2连右上角
DisFactory.verticalTopRight = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 9] == null || obj[index - 17] == null || obj[index - 18] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 9].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 17].id) && obj[index - 18].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 竖排两连左下角
DisFactory.verticalBottomLeft = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 9] == null || obj[index + 8] == null || obj[index + 9] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 9].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index + 8].id) && obj[index + 9].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 竖排2连右下角
DisFactory.verticalBottomRight = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 9] == null || obj[index + 10] == null || obj[index + 9] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 9].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index + 10].id) && obj[index + 9].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 竖排中空左
DisFactory.verticalDoubleLeft = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 18] == null || obj[index - 10] == null || obj[index - 9] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 18].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 10].id) && obj[index - 9].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 竖排中空右
DisFactory.verticalDoubleRight = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 18] == null || obj[index - 8] == null || obj[index - 9] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 18].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 8].id) && obj[index - 9].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 横排两连左左
DisFactory.horizontalLeftLeft = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 1] == null || obj[index - 3] == null || obj[index - 2] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 1].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 3].id) && obj[index - 2].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 横排两连右右
DisFactory.horizontalRightRight = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 1] == null || obj[index + 2] == null || obj[index + 1] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 1].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index + 2].id) && obj[index + 1].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 横排两连左上角
DisFactory.horizontalTopLeft = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 1] == null || obj[index - 2] == null || obj[index - 11] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 1].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 11].id) && obj[index - 2].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 横排2连右上角
DisFactory.horizontalTopRight = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 1] == null || obj[index - 8] == null || obj[index + 1] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 1].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 8].id) && obj[index + 1].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 横排2连左下角
DisFactory.horizontalBottomLeft = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 1] == null || obj[index + 7] == null || obj[index - 2] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 1].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index + 7].id) && obj[index - 2].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 横排2连右下角
DisFactory.horizontalBottomRight = function (index) {
    var obj = fs.LayerManager.tilesList.element;

    if (obj[index] == null || obj[index - 1] == null || obj[index + 10] == null || obj[index + 1] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 1].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index + 10].id) && obj[index + 1].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 横排中空上
DisFactory.horizontalDoubleTop = function (index) {
    var obj = fs.LayerManager.tilesList.element;

    if (obj[index] == null || obj[index - 2] == null || obj[index - 10] == null || obj[index - 1] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 2].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 10].id) && obj[index - 1].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 横排中空下
DisFactory.horizontalDoubleBottom = function (index) {
    var obj = fs.LayerManager.tilesList.element;
    if (obj[index] == null || obj[index - 2] == null || obj[index + 8] == null || obj[index - 1] == null) {
        return;
    }
    if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index - 2].id)) {
        if (fs.CommonLayer.transformIDtoColor(obj[index].id) == fs.CommonLayer.transformIDtoColor(obj[index + 8].id) && obj[index - 1].isSwap == 1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

/**
 * [DieMapRebuild] [ 死图重排逻辑 ]
 * @return bolean [true：代表重排完毕,否则返回一个可交换元素的列表]
 */
DisFactory.dieMapRebuild = function () {
    var self = this;
    var obj = [].concat(fs.LayerManager.tilesList.element);
    var obj2 = [].concat(fs.LayerManager.tilesList.element);
    var _elementTempList = [];
    var _tempObj = [];
    var _count = 0;

    // 提取所有的元素数组
    for (var i = 0; i < 72; i++) {
        // 防止当obj[i]为null时，后面的代码发生报错
        if (obj[i] == null) {
            continue;
        }

        if (obj[i].id <= 1006 && fs.BaseLayer.isBinded(i) == false) {
            _elementTempList[_count] = obj2[i];
            _elementTempList[_count].gameObject.x = -10;
            _elementTempList[_count].gameObject.y = -10;
            _elementTempList[_count].gameObject.alpha = 0;
            _count++;
            obj[i] = "element";
        }

    }

    // 开始重建盘面
    for (var k = 0; k < 72; k++) {
        if (obj[k] == "element") {
            var _randomIndex = fs.Game.math.random(0, _elementTempList.length - 1);
            fs.LayerManager.tilesList.element[k] = _elementTempList.splice(_randomIndex, 1)[0];
            fs.LayerManager.tilesList.element[k].gameObject.x = fs.CommonLayer.pivotX(k);
            fs.LayerManager.tilesList.element[k].gameObject.y = fs.CommonLayer.pivotY(k);
        } else {
            fs.LayerManager.tilesList.element[k] = obj[k];
        }
    }

    // 如果生成的地图为死图或者存在3消
    if (self.checkMapDie() === true || self.checkElement(true) == true) {
        // 重排次数为三次以上仍然失败则进行失败判定
        if (self.rebuildTimesCount > 10) {
            // 复原重排之前的盘面
            for (var i = 0; i < 72; i++) {
                if (obj[i] == "element") {
                    fs.LayerManager.tilesList.element[i] = obj2[i];
                    fs.LayerManager.tilesList.element[i].gameObject.x = fs.CommonLayer.pivotX(i);
                    fs.LayerManager.tilesList.element[i].gameObject.y = fs.CommonLayer.pivotY(i);
                } else {
                    fs.LayerManager.tilesList.element[i] = obj[i];
                }
            }

            fs.TaskLogic.gameResult = "fail";
            fs.ScenesUI.resultControl(fs.TaskLogic.gameResult);
        } else {
            self.rebuildTimesCount += 1;
            console.warn(self.rebuildTimesCount);
            self.dieMapRebuild();
        }
    } else {
        self.rebuildTimesCount = 0;
        fs.GameManager.eliminateNoticeList = self.checkMapDie();
        console.log("新地图哦");
        return true;
    }

}

/**
 * Description: 游戏战斗控制逻辑
 * Author: nishu
 * Email: nishu@supernano.com
 */

var FightControl = qc.defineBehaviour('qc.engine.FightControl', qc.Behaviour, function () {
    var self = this;

    fs.FightControl = self;

    // 是否正在执行互换动作
    self.isAction = false;

    // 是否正在拖拽
    self.isDragging = false;

}, {
    // fields need to be serialized
});

// 开始拖拽事件
FightControl.prototype.onDragStart = function (event) {
    var self = this;
    if (fs.GameManager.gamePause) return;
    // 执行互换动作过程中禁止拖拽
    if (self.isAction) return;

    var source = event.source,
        // 指定x、y坐标构造一个点
        pt = new qc.Point(source.x, source.y),
        // 将世界坐标，转换为相对于本节点的本地坐标
        point = self.gameObject.toLocal(pt);

    // 获取初始拖拽的水果位于第几个方格，用于拖拽中比较是否达到互换条件
    self.initDragIndex = fs.CommonLayer.getIndex(point.x, point.y);

    // 排除无效方格
    if (!fs.LayerManager.tilesList.element[self.initDragIndex]) return;

    // 是否可交换
    if (!fs.LayerManager.tilesList.element[self.initDragIndex].isSwap || fs.BaseLayer.isBinded(self.initDragIndex)) return;

    // 设置为正在拖拽
    self.isDragging = true;
    self.game.log.trace('开始拖拽: {0}', self.initDragIndex);

};

// 进行中拖拽事件
FightControl.prototype.onDrag = function (event) {
    var self = this;

    if (!self.isDragging) return;

    // 实时获取当前拖拽坐标
    var source = event.source,
        pt = new qc.Point(source.x, source.y),
        point = self.gameObject.toLocal(pt);
    var activeIndex = fs.CommonLayer.getIndex(point.x, point.y);

    // 排除无效方格
    if (!fs.LayerManager.tilesList.element[activeIndex]) return;

    // 是否拖拽点移动到其他方格
    if (activeIndex == self.initDragIndex) return;

    // 是否可交换
    if (!fs.LayerManager.tilesList.element[activeIndex].isSwap || fs.BaseLayer.isBinded(activeIndex)) return;

    // 获取两个方格之间的关系
    var relation = fs.CommonLayer.getRelation(self.initDragIndex, activeIndex);

    // 不存在相邻关系则取消拖拽
    if ( !relation ) {
        self.game.log.trace('强制取消拖拽: {0}', activeIndex);
        return;
    }

    // 获取用户操作点，用于判断技能合成位置
    fs.LayerManager.skillPos = [activeIndex, self.initDragIndex];

    // 技能交换
    if (self.skillSwap(self.initDragIndex, activeIndex, false)) {
        return;
    }

    // 交换方格数据
    self.swapData = fs.CommonLayer.getSwapData(activeIndex, self.initDragIndex);

    // 根据交换数据查找可消除元素
    if (!fs.DisFactory.checkElement(true, self.swapData)) {

        fs.AudioManager.playSound(78);

        self.isDragging = false;
        // 设置动作为执行状态
        self.isAction = true;

        // 播放不能交换动画
        var a = fs.LayerManager.tilesList.element[self.initDragIndex];
        var b = fs.LayerManager.tilesList.element[activeIndex];

        var _swapCount = 2;
        var swapComplete = function () {
            if (--_swapCount <= 0) {
                self.isAction = false;
                // 打开提示动画开关
                if (fs.GameManager.FSM.state == "waitUser") {
                    //动画播放完成后添加新的交换提示定时器
                    fs.GameManager.noticeTimeBuilder();
                    // console.warn('新的定时器已经添加');
                }
            }
        }

        //移出提示定时器
        fs.GameManager.removeTimeBuilder();    

        if (relation == 'left') {
            // console.warn("定时器已经移出");
            a.cantSwap('right', swapComplete);
            b.cantSwap('left', swapComplete);
        }

        if (relation == 'right') {
            // console.warn("定时器已经移出");
            a.cantSwap('left', swapComplete);
            b.cantSwap('right', swapComplete);
        }

        if (relation == 'top') {
            // console.warn("定时器已经移出");
            a.cantSwap('bottom', swapComplete);
            b.cantSwap('top', swapComplete);
        }

        if (relation == 'bottom') {
            // console.warn("定时器已经移出");
            a.cantSwap('top', swapComplete);
            b.cantSwap('bottom', swapComplete);
        }
        return;
    }

    // 触发互换，拖拽结束
    self.isDragging = false;

    // 执行互换
    fs.GameManager.eliminateNoticeSwitch = false;
    self.switch(activeIndex, self.initDragIndex);
};

// 结束拖拽事件
FightControl.prototype.onDragEnd = function (event) {
    var self = this;

    self.game.log.trace('拖拽结束');
    self.isDragging = false;
};

/**
 * 互换方格位置
 * @param currentIndex
 * @param toIndex
 */
FightControl.prototype.switch = function (currentIndex, toIndex) {
    var self = this;
    var currentTile = fs.LayerManager.tilesList.element[currentIndex];
    var toTile = fs.LayerManager.tilesList.element[toIndex];

    fs.AudioManager.playSound(76);

    // 设置互换动作为执行状态
    self.isAction = true;

    // 互换计数
    var switchNum = 2;

    var waitEnd = function () {
        // 判断是否互换完成
        if (--switchNum <= 0) {
            switchAfter();
        }
    };

    // 互换后
    var switchAfter = function () {
        // 更新棋盘数据
        fs.LayerManager.tilesList.element = self.swapData;

        self.game.log.trace('开始消除');

        self.isAction = false;

        //移出提示定时器
        fs.GameManager.removeTimeBuilder();

        // 更改游戏状态
        fs.GameManager.changeFSM();
    };

    // 执行互换
    currentTile.move(toIndex, waitEnd);
    toTile.move(currentIndex, waitEnd);
};

// 技能交换处理
// srcPos:交换方格1
// targetPos:交换方格2
// checkModule:检测模式
// 如果返回true则表示符合技能交换
FightControl.prototype.skillSwap = function (srcPos, targetPos, checkModule) {
    var self = this;

    var isSkillSwap = false,
        doubleSkill = false,
        color = '';

    // 触发互换，拖拽结束
    self.isDragging = false;

    var srcTile = fs.LayerManager.tilesList.element[srcPos];
    var targetTile = fs.LayerManager.tilesList.element[targetPos];

    if (srcTile != null && targetTile != null) {
        if ((srcTile.class3 == 'rainbow' && (targetTile.class1 == 'base' || targetTile.class1 == 'skill')) || (targetTile.class3 == 'rainbow' && (srcTile.class1 == 'base' || srcTile.class1 == 'skill'))) {
            // 彩虹技能
            isSkillSwap = true;
            color = srcTile.color || targetTile.color;

        } else if ((srcTile.class3 == 'magnet' && (targetTile.class1 == 'base' || targetTile.class1 == 'skill')) || (targetTile.class3 == 'magnet' && (srcTile.class1 == 'base' || srcTile.class1 == 'skill'))) {
            // 磁铁技能
            isSkillSwap = true;
            color = srcTile.color || targetTile.color;
        }
        if (srcTile.class1 == 'skill' && targetTile.class1 == 'skill') {
            // 双技能
            isSkillSwap = true;
            doubleSkill = true;
            color = srcTile.color || targetTile.color;
        }
    }

    if (isSkillSwap) {
        // 交换数据
        var swapData = fs.CommonLayer.getSwapData(srcPos, targetPos);
        // 更新棋盘数据
        fs.LayerManager.tilesList.element = swapData;

        var switchNum = 2;
        var switchAction = function () {
            if (--switchNum <= 0) {
                var disObj = {};
                
                if (srcTile.class2 == 'super' && targetTile.class2 == 'super') {
                    
                    // 双超级技能，保留磁铁
                    if (srcTile.class3 == 'magnet') {
                        targetTile.type = "SKILL_NOTHING";
                        srcTile.type = fs.BaseLayer.getDoubleSkillType(srcTile.class3, targetTile.class3);
                    }else {
                        srcTile.type = "SKILL_NOTHING";
                        targetTile.type = fs.BaseLayer.getDoubleSkillType(srcTile.class3, targetTile.class3);
                    }
                    
                    // 特效=========
                    if (srcTile.class3 == 'rainbow' && targetTile.class3 == 'rainbow') {
                        fs.AudioManager.playSound(94);
                    }else if (srcTile.class3 == 'magnet' && targetTile.class3 == 'magnet') {
                        fs.AudioManager.playSound(93);
                    }else if ((srcTile.class3 == 'rainbow' && targetTile.class3 == 'magnet') || (srcTile.class3 == 'magnet' && targetTile.class3 == 'rainbow')) {
                        fs.AudioManager.playSound(93);
                    }

                    // 设置消除对象
                    disObj = {
                        "pos": [srcPos, targetPos],
                        "color": color
                    };

                }else if (targetTile.class2 == 'super' && srcTile.class1 == 'skill') {

                    // 普通技能产生旁格影响
                    var rangePosList = fs.BaseLayer.getRangePos([targetPos]);
                    for (var l in rangePosList) {
                        var rangeIndex = rangePosList[l];
                        var rangeTile = fs.LayerManager.tilesList.element[rangeIndex];

                        if (rangeTile != null && rangeTile.hasOwnProperty("delFlag") && !rangeTile.delFlag) {
                            fs.LayerManager.layerPropagation(rangeIndex, srcTile.color, 'action_round');
                        }
                    }

                    // 超级技能变异
                    targetTile.type = fs.BaseLayer.getDoubleSkillType(srcTile.class3, targetTile.class3);

                    if (targetTile.class3 == 'magnet') {
                        fs.AudioManager.playSound(93);
                    }else if (targetTile.class3 == 'rainbow') {
                        fs.AudioManager.playSound(94);
                    }

                    // 设置消除对象
                    disObj = {
                        "pos": [srcPos],
                        "color": color
                    };

                }else if (srcTile.class2 == 'super' && targetTile.class1 == 'skill') {

                    // 普通技能产生旁格影响
                    var rangePosList = fs.BaseLayer.getRangePos([srcPos]);
                    for (var l in rangePosList) {
                        var rangeIndex = rangePosList[l];
                        var rangeTile = fs.LayerManager.tilesList.element[rangeIndex];

                        if (rangeTile != null && rangeTile.hasOwnProperty("delFlag") && !rangeTile.delFlag) {
                            fs.LayerManager.layerPropagation(rangeIndex, targetTile.color, 'action_round');
                        }
                    }

                    // 超级技能变异
                    srcTile.type = fs.BaseLayer.getDoubleSkillType(srcTile.class3, targetTile.class3);

                    if (srcTile.class3 == 'magnet') {
                        fs.AudioManager.playSound(93);
                    }else if (srcTile.class3 == 'rainbow') {
                        fs.AudioManager.playSound(94);
                    }

                    // 设置消除对象
                    disObj = {
                        "pos": [targetPos],
                        "color": color
                    };

                }else if (srcTile.class1 == 'skill' && targetTile.class1 == 'skill') {
                    
                    // targetTile技能产生旁格影响
                    var rangePosList = fs.BaseLayer.getRangePos([srcPos]);
                    for (var l in rangePosList) {
                        var rangeIndex = rangePosList[l];
                        var rangeTile = fs.LayerManager.tilesList.element[rangeIndex];

                        if (rangeTile != null && rangeTile.hasOwnProperty("delFlag") && !rangeTile.delFlag) {
                            fs.LayerManager.layerPropagation(rangeIndex, targetTile.color, 'action_round');
                        }
                    }

                    
                    // srcTile技能变异
                    srcTile.type = fs.BaseLayer.getDoubleSkillType(srcTile.class3, targetTile.class3);
                    targetTile.type = "SKILL_NOTHING";

                    // 设置消除对象
                    disObj = {
                        "pos": [targetPos],
                        "color": color
                    };

                }else if (srcTile.class1 == 'skill' && targetTile.class1 == 'base') {

                    // targetTile产生旁格影响
                    var rangePosList = fs.BaseLayer.getRangePos([srcPos]);
                    for (var l in rangePosList) {
                        var rangeIndex = rangePosList[l];
                        var rangeTile = fs.LayerManager.tilesList.element[rangeIndex];

                        if (rangeTile != null && rangeTile.hasOwnProperty("delFlag") && !rangeTile.delFlag) {
                            fs.LayerManager.layerPropagation(rangeIndex, targetTile.color, 'action_round');
                        }
                    }

                    if (srcTile.class3 == 'magnet') {
                        fs.AudioManager.playSound(93);
                    }else if (srcTile.class3 == 'rainbow') {
                        fs.AudioManager.playSound(94);
                    }
                    
                    // 设置消除对象
                    disObj = {
                        "pos": [targetPos],
                        "color": color
                    };

                }else if (targetTile.class1 == 'skill' && srcTile.class1 == 'base') {

                    // srcTile产生旁格影响
                    var rangePosList = fs.BaseLayer.getRangePos([targetPos]);
                    for (var l in rangePosList) {
                        var rangeIndex = rangePosList[l];
                        var rangeTile = fs.LayerManager.tilesList.element[rangeIndex];

                        if (rangeTile != null && rangeTile.hasOwnProperty("delFlag") && !rangeTile.delFlag) {
                            fs.LayerManager.layerPropagation(rangeIndex, srcTile.color, 'action_round');
                        }
                    }

                    if (targetTile.class3 == 'magnet') {
                        fs.AudioManager.playSound(93);
                    }else if (targetTile.class3 == 'rainbow') {
                        fs.AudioManager.playSound(94);
                    }

                    // 设置消除对象
                    disObj = {
                        "pos": [srcPos],
                        "color": color
                    };

                }

                // 执行消除
                fs.DisFactory.disappear(disObj);

                //移出提示定时器
                fs.GameManager.removeTimeBuilder();

                // 更改游戏状态
                fs.GameManager.changeFSM();
            }
        };

        //执行互换
        srcTile.move(targetPos, switchAction);
        targetTile.move(srcPos, switchAction);
    }

    return isSkillSwap;
};
/**
 * description: 地板生成
 * author: Sangliang
 * email: sangliang@supernano.com
 */

// define a user behaviour
var FloorBuilder = qc.defineBehaviour('qc.engine.FloorBuilder', qc.Behaviour, function () {

}, {

    });

/**
 * [builder 地板生成]
 * @param {[object]} data [获取的配置文件中的地图信息]
 */
FloorBuilder.prototype.builder = function () {
    var self = this;
    // 设置计数器
    var _count = 0;

    var data = fs.ConfigManager.levelData;
    
    // 初始化宽高
    self.width = fs.ConfigManager.gridW;
    self.height = fs.ConfigManager.gridH;
    self.row = fs.ConfigManager.row;
    self.colunm = fs.ConfigManager.colunm;

    //遍历所有格子
    for (var i = 0; i < self.row; i++) {
        for (j = 0; j < self.colunm; j++) {
            // 为所有地板格子生成相应的节点
            var flooTile = self.game.add.node(self.gameObject);
            flooTile.name = 'FloorTile_' + _count + '';
            flooTile.width = self.width;
            flooTile.height = self.height;
            flooTile.x = j * 80;
            flooTile.y = i * 80;
            _count = _count + 1;

            // 给所有格子节点添加图片子节点
            var floorImage = self.game.add.image(flooTile);
            floorImage.name = 'floorImage';
            floorImage.texture = self.floorTexture;

            if (data.layers[0].data[_count - 1] == 1 || data.layers[0].data[_count - 1] == 2) {
                floorImage.alpha = 0;
            }

            // 根据格子的索引值来确定地板的图片种类
            // light_tile.png为浅色地板
            // dark_tile.png为深色地板
            if (_count % 2 == 0) {
                floorImage.frame = 'light_tile.png'
                floorImage.resetNativeSize();

            } else {
                floorImage.frame = 'dark_tile.png'
                floorImage.resetNativeSize();
            }
        }
    }

    self.borderBuilder(self, data);
}

/**
 * [isBorderNode 判断是否为边界节点]
 * @param  {[obj]}  _self  [调用对象]
 * @param  {[obj]}  data  [从配置表中读到的数据]
 * @param  {[int]}  index [需要判断元素的索引]
 * @return {object}       [反映周围位置信息的一个对象]
 */
FloorBuilder.prototype.isBorderNode = function (_self, data, index) {
    // 节点标识符数组，用来存储一个节点是否是上（下，左，右）边界的数组
    var _nodeFlag = [];
    _nodeFlag[index] = {};
    _nodeFlag[index].index = index;

    if (index <= (_self.row * _self.colunm)) {
        // 如果检测节点左侧的位置为空
        if ((data.layers[0].data[index - 1] == 1) || (data.layers[0].data[index - 1] == 2)) {
            // console.log(index + "左边界");
            _nodeFlag[index].left = true;
        }

        // 如果检测节点右侧为空
        if ((data.layers[0].data[index + 1] == 1) || (data.layers[0].data[index + 1] == 2)) {
            // console.log(index + "右边界");
            _nodeFlag[index].right = true;
        }
    }

    if (index >= 0) {
        // 检测节点下边界为空
        if (data.layers[0].data[index + 9] == 1 || data.layers[0].data[index + 9] == 2) {
            // console.log(index + "下边界");
            _nodeFlag[index].bottom = true;
        }

        // 检测节点上边界为空
        if ((data.layers[0].data[index - 9] == 1) || (data.layers[0].data[index - 9] == 2)) {
            // console.log(index + "上边界");
            _nodeFlag[index].top = true;
        }

    }

    // 上顶边情况
    if (index <= 8) {
        // console.log(index + '上底边界');
        _nodeFlag[index].top = true;
    }

    // 下顶边情况
    if (index >= (_self.row * _self.colunm - 9)) {
        // console.log(index + '下底边界');
        _nodeFlag[index].bottom = true;
    }

    // 左顶边情况
    if (index % 9 == 0) {
        // console.log(index + '左顶边界');
        _nodeFlag[index].left = true;
    }

    // 右顶边情况
    if (index % 9 == 8) {
        // console.log(index + '右顶边界');
        _nodeFlag[index].right = true;
    }

    return (_nodeFlag[index]);

}

/**
 * [borderImgBuilder 生成边界]
 * @param  {[obj]}  _self  [调用对象]
 * @param  {[array]}  imgname  [图片名称数组]
 * @param  {[string]}  position  [生成边界所在的位置]
 * @param  {[int]}  index [需要生成边界的元素的索引]
 */
FloorBuilder.prototype.borderImgBuilder = function (_self, imgname, position, index) {
    var self = this;
    
    if (position == 'top') {
        var borderImg = self.game.add.image(self.gameObject.getChildAt(index));
        borderImg.name = "top";
        borderImg.texture = self.floorTexture;
        borderImg.frame = imgname[0] + "_" + imgname[1] + "_" + imgname[2] + ".png";
        borderImg.resetNativeSize();
        borderImg.x = -11.4;
        borderImg.y = -11.4;
    }

    if (position == 'left') {
        var borderImg = self.game.add.image(self.gameObject.getChildAt(index));
        borderImg.name = "left";
        borderImg.texture = self.floorTexture;
        borderImg.frame = imgname[0] + "_" + imgname[1] + "_" + imgname[2] + ".png";
        borderImg.resetNativeSize();
        borderImg.x = -11.4;
        borderImg.y = -11.4;
    }

    if (position == 'bottom') {
        var borderImg = self.game.add.image(self.gameObject.getChildAt(index));
        borderImg.name = "bottom";
        borderImg.texture = self.floorTexture;
        borderImg.frame = imgname[0] + "_" + imgname[1] + "_" + imgname[2] + ".png";
        borderImg.resetNativeSize();
        borderImg.x = -11.4;
        borderImg.y = 80;
    }

    if (position == 'right') {
        var borderImg = self.game.add.image(self.gameObject.getChildAt(index));
        borderImg.name = "right";
        borderImg.texture = self.floorTexture;
        borderImg.frame = imgname[0] + "_" + imgname[1] + "_" + imgname[2] + ".png";
        borderImg.resetNativeSize();
        borderImg.x = 80;
        borderImg.y = -11.4;
    }
}

/**
 * [borderBuilder 边界生成函数]
 * @param {[obj]} _self [调用对象]
 * @param {[obj]} data  [配置表中的数据]
 */
FloorBuilder.prototype.borderBuilder = function (_self, data) {
    var self = this;
    self.data = data;

    // 遍历所有的floor节点检测是否存在border节点
    for (var i = 0; i < (_self.row * _self.colunm); i++) {
        if (data.layers[0].data[i] != 1 && data.layers[0].data[i] != 2) {
            // 检测该节点是否为border节点
            var _borderNode = self.isBorderNode(self, self.data, i);
            // 筛选border节点，只操作要生成border的节点
            if (_borderNode.top == true || _borderNode.bottom == true || _borderNode.left == true || _borderNode.right == true) {
                // 上边界生成
                if (_borderNode.top == true) {
                    var imgName = [];
                    imgName[0] = 'top';
                    if (i <= 8) {
                        if (data.layers[0].data[i - 1] == 1 || data.layers[0].data[i - 1] == 2) {
                            // console.log(data.layers[0].data[i - 1]);
                            imgName[1] = 'left_corner';
                        } else {
                            if (i % 9 == 0) {
                                imgName[1] = 'left_corner';
                            } else {
                                imgName[1] = 'top';

                            }
                        }
                        if (data.layers[0].data[i + 1] == 1 || data.layers[0].data[i + 1] == 2) {
                            imgName[2] = 'right_corner';

                        } else {
                            if (i % 9 == 8) {
                                imgName[2] = 'right_corner';
                            } else {

                                imgName[2] = "top";
                            }

                        }

                        self.borderImgBuilder(self, imgName, "top", i);
                    }

                    if (i > 8 && i < (_self.row * _self.colunm)) {
                        if (data.layers[0].data[i - 10] == 1 || data.layers[0].data[i - 10] == 2) {
                            if (data.layers[0].data[i - 1] == 1 || data.layers[0].data[i - 1] == 2) {
                                imgName[1] = 'left_corner';
                            } else {
                                imgName[1] = 'top';
                            }
                        } else {
                            if (i % 9 != 0) {
                                imgName[1] = 'left_bevel';
                            } else {
                                imgName[1] = 'left_corner';
                            }
                        }

                        if (i % 9 != 8) {
                            if (data.layers[0].data[i - 8] == 1 || data.layers[0].data[i - 8] == 2) {
                                if (data.layers[0].data[i + 1] == 1 || data.layers[0].data[i + 1] == 2) {
                                    imgName[2] = 'right_corner';
                                } else {
                                    imgName[2] = "top";
                                }
                            } else {
                                if (i % 9 != 8) {
                                    imgName[2] = 'right_bevel';
                                } else {
                                    imgName[2] = "right_corner";
                                }
                            }
                        } else {
                            if (data.layers[0].data[i - 9] == 1 || data.layers[0].data[i - 9] == 2) {
                                imgName[2] = 'right_corner';
                            }
                        }
                        self.borderImgBuilder(self, imgName, "top", i);
                    }
                }

                // 左边界生成
                if (_borderNode.left == true) {
                    var imgName = [];
                    imgName[0] = 'left';
                    //左侧顶边 
                    if (i % 9 == 0) {
                        // console.log("lalalal"+i)
                        if (data.layers[0].data[i - 9] == 1 || data.layers[0].data[i - 9] == 2) {
                            imgName[1] = 'top_corner';
                        } else {
                            if (i <= 8) {
                                imgName[1] = 'top_corner';
                            } else {
                                imgName[1] = 'left';
                            }
                        }
                        if (data.layers[0].data[i + 9] == 1 || data.layers[0].data[i + 9] == 2) {
                            imgName[2] = 'bottom_corner';

                        } else {
                            if (i >= 62) {
                                imgName[2] = 'bottom_corner';
                            } else {
                                imgName[2] = 'left';
                            }
                        }
                        self.borderImgBuilder(self, imgName, "left", i);
                    }

                    //非左侧顶边左边界
                    if (i % 9 != 0) {
                        if (data.layers[0].data[i - 10] == 1 || data.layers[0].data[i - 10] == 2) {
                            if (data.layers[0].data[i - 9] == 1 || data.layers[0].data[i - 9] == 2) {
                                imgName[1] = 'top_corner';
                            } else {
                                imgName[1] = 'left';
                            }
                        } else {
                            if (i <= 8) {
                                imgName[1] = 'top_corner';
                            } else {
                                imgName[1] = 'top_bevel';
                            }
                        }
                        if (data.layers[0].data[i + 8] == 1 || data.layers[0].data[i + 8] == 2) {
                            if (data.layers[0].data[i + 9] == 1 || data.layers[0].data[i + 9] == 2) {
                                imgName[2] = 'bottom_corner';
                            } else {
                                imgName[2] = 'left';
                            }
                        } else {
                            if (i >= 62) {
                                imgName[2] = 'bottom_corner';
                            } else {
                                imgName[2] = 'bottom_bevel';
                            }
                        }
                        self.borderImgBuilder(self, imgName, "left", i);
                    }

                }

                // 底部边界生成
                if (_borderNode.bottom == true) {
                    var imgName = [];
                    imgName[0] = 'bottom';
                    if (i >= 63) {
                        if (data.layers[0].data[i - 1] == 1 || data.layers[0].data[i - 1] == 2) {
                            imgName[1] = 'left_corner';
                        } else {
                            if (i % 9 == 0) {
                                imgName[1] = 'left_corner';
                            } else {
                                imgName[1] = 'bottom';
                            }
                        }
                        if (data.layers[0].data[i + 1] == 1 || data.layers[0].data[i + 1] == 2) {
                            imgName[2] = 'right_corner';

                        } else {
                            if (i % 9 == 8) {
                                imgName[2] = 'right_corner';
                            } else {
                                imgName[2] = "bottom";
                            }
                        }

                        self.borderImgBuilder(self, imgName, "bottom", i);
                    }

                    if (i < 63) {
                        if (data.layers[0].data[i + 8] == 1 || data.layers[0].data[i + 8] == 2) {
                            if (data.layers[0].data[i - 1] == 1 || data.layers[0].data[i - 1] == 2) {
                                imgName[1] = 'left_corner';
                            } else {
                                imgName[1] = "bottom";
                            }
                        } else {
                            if (i % 9 != 0) {
                                imgName[1] = 'left_bevel';
                            } else {
                                imgName[1] = 'left_corner';
                            }
                        }

                        if (data.layers[0].data[i + 10] == 1 || data.layers[0].data[i + 10] == 2) {
                            if (data.layers[0].data[i + 1] == 1 || data.layers[0].data[i + 1] == 2) {
                                imgName[2] = 'right_corner';
                            } else {
                                imgName[2] = "bottom";
                            }
                        } else {
                            if (i % 9 != 8) {
                                imgName[2] = 'right_bevel';

                            } else {
                                imgName[2] = "right_corner";
                            }
                        }
                        self.borderImgBuilder(self, imgName, "bottom", i);
                    }
                }

                // 右边界生成
                if (_borderNode.right == true) {
                    var imgName = [];
                    imgName[0] = 'right';
                    if (i % 9 == 8) {
                        if (data.layers[0].data[i - 9] == 1 || data.layers[0].data[i - 9] == 2) {
                            imgName[1] = 'top_corner';
                        } else {
                            if (i <= 8) {
                                imgName[1] = 'top_corner';
                            } else {
                                imgName[1] = 'right';
                            }
                        }

                        if (data.layers[0].data[i + 9] == 1 || data.layers[0].data[i + 9] == 2) {
                            imgName[2] = 'bottom_corner';

                        } else {
                            if (i >= 62) {
                                imgName[2] = 'bottom_corner';
                            } else {
                                imgName[2] = 'right';
                            }
                        }
                        self.borderImgBuilder(self, imgName, "right", i);
                    }

                    if (i % 9 != 8) {
                        if (data.layers[0].data[i - 8] == 1 || data.layers[0].data[i - 8] == 2) {
                            if (data.layers[0].data[i - 9] == 1 || data.layers[0].data[i - 9] == 2) {
                                imgName[1] = 'top_corner';
                            } else {
                                imgName[1] = 'right';
                            }
                        } else {
                            if (i <= 8) {
                                imgName[1] = 'top_corner';
                            } else {
                                imgName[1] = 'top_bevel';
                            }
                        }

                        if (data.layers[0].data[i + 10] == 1 || data.layers[0].data[i + 10] == 2) {
                            if (data.layers[0].data[i + 9] == 1 || data.layers[0].data[i + 9] == 2) {
                                imgName[2] = 'bottom_corner';
                            } else {
                                imgName[2] = 'right';
                            }
                        } else {
                            if (i >= 62) {
                                imgName[2] = 'bottom_corner';

                            } else {
                                imgName[2] = 'bottom_bevel';
                            }
                        }
                        self.borderImgBuilder(self, imgName, "right", i);
                    }
                }
            }
        }
    }
    // 地形生成完成
    fs.LayerManager.isBorderReady = true;
}

/**
 * [init] 初始化
 */
FloorBuilder.prototype.init = function () {
    var self = this;

    // 取得生成floor所需要的ui素材
    self.floorTexture = fs.ConfigManager.UI;

    // 回调取得配置表中的所有关卡信息
    self.builder();
}
/**
 * [ActorAnimation 角色动画管理器]
 * @author: Sangliang
 * @email:sangliang@supernano.com
 */

var ActorAnimation = fs.ActorAnimation = {};

ActorAnimation.isActorMove = false;

/**
 * 角色状态相关参数说明
 * ingame:进入游戏后的初始化动作(ready,trouble模式为up)
 * get:获取task目标的动作(juice中为get1,get2,get3,trouble模式中为,behit)
 * boring:三次消除后没有拿到目标元素进入boring状态(trouble模式无boring状态  *循环状态*)
 * idle:角色常规动作  *循环状态*
 * nervous:最后三步的时候，角色开始进入焦虑状态  *循环状态*
 * ready:trouble模式中 boss放大招前的状态  *循环状态*
 * stun:trouble模式中，boss被眩晕的状态  *循环状态*
 * complete:任务完成
 * dance:任务完成动画播完后跳舞循环庆祝状态  *循环状态*
 * fail:任务失败
 * cry:任务失败动画播完后的哭泣状态  *循环状态*
 */
ActorAnimation.actorState = null;
/**
 * [initActorAnimation 初始化角色动画]
 * @param  {[obj]} data [数据与UI所有的信息]
 */
ActorAnimation.initActorAnimation = function () {
    var self = this;
    var actorNode = qc.N("actorNode");
    actorNode.alpha = 1;

    fs.ActorAnimation.actorState = "ready";
    fs.ActorAnimation.playActorAnimation();

}

/*
 * playActorAnimation:根据角色的不同状态来播放角色动画
 *
 */
ActorAnimation.playActorAnimation = function (juiceGetNum) {
    var self = this;
    var gameMode = fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID].type;
    if (fs.ScenesUI.gameMode == "trouble") {//boss模式状态
        if (self.actorState == "ready") {
            self.actorAnimationPlayControl(gameMode, "up", fs.ScenesUI, false);
        } else if (self.actorState == "get") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "behit", fs.ScenesUI, false);
        } else if (self.actorState == "stun") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "stun", fs.ScenesUI, false, "stun");
        } else if (self.actorState == "attack") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "attack", fs.ScenesUI, false, null);
        } else if (self.actorState == "fail") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "fail", fs.ScenesUI, false, "result");
        } else if (self.actorState == "prepare") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "ready", fs.ScenesUI, false, "ready");
        } else if (self.actorState == "win") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, 'win', fs.ScenesUI, false, "result");

        }
    } else if (gameMode == "juice") {//果汁模式状态

        if (self.actorState == "ready") {
            self.actorAnimationPlayControl(gameMode, "ready", fs.ScenesUI, false);
        } else if (self.actorState == "get") {
            self.actorAnimationPlayControl(gameMode, "get" + juiceGetNum, fs.ScenesUI, false);
        } else if (self.actorState == "complete") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "complete", fs.ScenesUI, false, fs.ActorAnimation.actorAnimationPlayControl(gameMode, "dance", fs.ScenesUI, false, "dance"));
        } else if (self.actorState == "boring") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "boring", self, false, "boring");
        } else if (self.actorState == "nervous") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "nervous", self, false, null);
        } else if (self.actorState == "fail") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, 'fail', fs.ScenesUI, false, "cry");
        }
    } else {//其他模式

        if (self.actorState == "ready") {
            self.actorAnimationPlayControl(gameMode, "ready", fs.ScenesUI, false);
        } else if (self.actorState == "get") {
            self.actorAnimationPlayControl(gameMode, "get", fs.ScenesUI, false);
        } else if (self.actorState == "complete") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "complete", fs.ScenesUI, false, fs.ActorAnimation.actorAnimationPlayControl(gameMode, "dance", fs.ScenesUI, false, "dance"));
        } else if (self.actorState == "boring") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "boring", self, false, "boring");
        } else if (self.actorState == "nervous") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, "nervous", self, false, null);
        } else if (self.actorState == "fail") {
            fs.ActorAnimation.actorAnimationPlayControl(gameMode, 'fail', fs.ScenesUI, false, "cry");
        }
    }
}

/**
 * actorAnimationPlayControl : 角色动画控制
 * @param {string} gameMode 游戏模式
 * @param {string} animationType 播放的动作名称
 */
ActorAnimation.actorAnimationPlayControl = function (gameMode, animationType, data, isloop, callback) {
    var self = this;
    var objNode = qc.N('actorNode');

    if (isloop == null) {
        isloop = false;
    }
    // 果汁模式角色动画
    if (gameMode == "juice") {
        if (self.isActorMove == false) {
            self.isActorMove = true;
            objNode.playAnimation(animationType, 1, isloop);
            // 指定动画播完的回调
            objNode.onFinished.addOnce(function () {

                if (callback == "boring") {
                    objNode.playAnimation('boring', 1, true);
                    self.isActorMove = false;
                } else if (callback == "cry") {
                    fs.ScenesUI.resultControl(fs.TaskLogic.gameResult);
                    objNode.playAnimation('cry', 1, true);
                    self.isActorMove = true;
                } else if (callback == "dance") {
                    fs.ScenesUI.resultControl(fs.TaskLogic.gameResult);
                    objNode.playAnimation('dance', 1, true);
                    self.isActorMove = true;
                } else if (callback != null) {
                    callback();
                    self.isActorMove = false;
                } else {
                    if (fs.ScenesUI.stepCount <= 3 && fs.ScenesUI.stepCount > 0) {
                        objNode.playAnimation('nervous', 1, true);
                        self.isActorMove = false;
                    } else {
                        objNode.playAnimation('idle', 1, true);
                        self.isActorMove = false;
                    }

                }
            });
        }
    }

    // boss模式角色动画
    if (gameMode == "trouble") {
        if (self.isActorMove == false) {
            self.isActorMove = true;
            objNode.playAnimation(animationType, 1, isloop);
            // 指定动画播完的回调
            objNode.onFinished.addOnce(function () {
                if (callback == "boring") {
                } else if (callback == "ready") {
                    if (self.actorState == "win" || self.actorState == "fail") {
                        return;
                    }
                    objNode.playAnimation('ready', 1, true);
                    self.isActorMove = false;
                } else if (callback == "stun") {
                    if (self.actorState == "win" || self.actorState == "fail") {
                        return;
                    }
                    objNode.playAnimation('stun', 1, true);
                    self.isActorMove = false;
                } else if (callback == "result") {
                    self.isActorMove = true
                    fs.ScenesUI.resultControl(fs.TaskLogic.gameResult);
                } else if (callback != null) {
                    self.isActorMove = false;
                } else {
                    if (self.actorState == "win" || self.actorState == "fail") {
                        return;
                    }
                    objNode.playAnimation('idle', 1, true);
                    self.isActorMove = false;
                }
            });
        }
    }

    if (gameMode == "dogfood") {
        if (self.isActorMove == false) {
            self.isActorMove = true;
            objNode.playAnimation(animationType, 1, isloop);
            // 指定动画播完的回调
            objNode.onFinished.addOnce(function () {
                if (callback == "boring") {
                    objNode.playAnimation('boring', 1, true);
                    self.isActorMove = false;
                } else if (callback == "cry") {//结束动画
                    fs.ScenesUI.resultControl(fs.TaskLogic.gameResult);
                    objNode.playAnimation('cry', 1, true);
                    self.isActorMove = true;
                } else if (callback == "dance") {
                    fs.ScenesUI.resultControl(fs.TaskLogic.gameResult);
                    objNode.playAnimation('dance', 1, true);
                    self.isActorMove = true;
                } else if (callback != null) {
                    callback();
                } else {
                    if (fs.ScenesUI.stepCount <= 3) {
                        objNode.playAnimation('nervous', 1, true);
                        self.isActorMove = false;
                    } else {
                        objNode.playAnimation('idle', 1, true);
                        self.isActorMove = false;
                    }
                }
            });
        }
    }

    if (gameMode == "popsicle") {
        if (self.isActorMove == false) {
            self.isActorMove = true;
            objNode.playAnimation(animationType, 1, isloop);
            // 指定动画播完的回调
            objNode.onFinished.addOnce(function () {
                if (callback == "boring") {
                    objNode.playAnimation('boring', 1, true);
                    self.isActorMove = false;
                } else if (callback == "cry") {
                    fs.ScenesUI.resultControl(fs.TaskLogic.gameResult);
                    objNode.playAnimation('cry', 1, true);
                    self.isActorMove = true;
                } else if (callback == "dance") {
                    fs.ScenesUI.resultControl(fs.TaskLogic.gameResult);
                    objNode.playAnimation('dance', 1, true);
                    self.isActorMove = true;
                } else if (callback != null) {
                    callback();
                    self.isActorMove = false;
                } else {
                    console.info(fs.ScenesUI.stepCount);
                    if (fs.ScenesUI.stepCount <= 3) {
                        objNode.playAnimation('nervous', 1, true);
                        self.isActorMove = false;
                    } else {
                        objNode.playAnimation('idle', 1, true);
                        self.isActorMove = false;
                    }
                }
            });
        }
    }
}


/**
 * descript:新手引导
 * author:Sangliang
 * sangliang@supernano.com
 */

var Guide = qc.defineBehaviour('qc.engine.Guide', qc.Behaviour, function () {
    var self = this;

    fs.Guide = self;
    self.contentObj = [
        {
            "contentText": "组成L形状，会行成一个果冻，果冻消除时可用炸掉他临近的元素",
            "contentTexture": "none"
        },
        {
            "contentText": "2",
            "contentTexture": "none"
        },
        {
            "contentText": "3",
            "contentTexture": "none"
        },
        {
            "contentText": "4",
            "contentTexture": "none"
        }
    ];

    self.pageIndex = 0;
}, {
        guideNode: qc.Serializer.NODE,
        closeButton: qc.Serializer.NODE,
        preButotn: qc.Serializer.NODE,
        nextButton: qc.Serializer.NODE,
        tipPanel: qc.Serializer.NODE
    });

Guide.prototype.awake = function () {
    var self = this;
    self.init();
}


Guide.prototype.init = function () {
    var self = this;

    // 给按钮添加事件
    self.addListener(self.nextButton.onClick, self.nextButtonEvent, self);
    self.addListener(self.preButotn.onClick, self.preButtonEvent, self);
    self.addListener(self.closeButton.onClick, self.closePanel, self);

    self.guideNode.find('guideText').text = self.contentObj[self.pageIndex]["contentText"];
    // self.guideNode.find('guideImg').
}

// 点击下一页提示
Guide.prototype.nextButtonEvent = function () {
    var self = this;
    if (self.pageIndex < self.contentObj.length - 1) {
        self.pageIndex += 1;
    } else {
        self.pageIndex = 0;
    }

    self.init();
}

// 点击上一页的提示
Guide.prototype.preButtonEvent = function () {
    var self = this;
    if (self.pageIndex > 0) {
        self.pageIndex -= 1;
    } else {
        self.pageIndex = self.contentObj.length - 1;
    }

    self.init();
}

// 关闭提示
Guide.prototype.closePanel = function () {
    var self = this;
    self.gameObject.visible = false;
    self.tipPanel.visible = true;
    fs.ScenesUI.tipPanelTimeout();

    // 初始化生成一个新的定时器
    fs.GameManager.noticeTimeBuilder();
}



/**
 * Description: Layer层逻辑，构建和管理Layer层数据对象，创建棋盘等
 * Author: nishu
 * Email: nishu@supernano.com
 */

var LayerManager = qc.defineBehaviour('qc.engine.LayerManager', qc.Behaviour, function () {
    var self = this;

    // 设置到全局
    fs.LayerManager = self;

    self.isLock = false;

    // 生成器
    self.generator = null;

    // 禁止生成数组，当周围存在相同元素时，为了使初始化之后不出现三消情况
    self.excludElementId = [];

    // 鱼片层数据
    self.popsicleInfoList = [];

    // 虫洞数据
    self.wormholeData = [];

    // 所有层的Tile对象
    self.tilesList = {
        terrain: [],
        transfer: [],
        skill: [],
        popsicle: [],
        portal: [],
        belowElement: [],
        element: [],
        aboveElement: [],
        obstacleTransverse: [],
        obstacleVertical: []
    };

    // Layer层节点对象
    self.node = {
        board: qc.N('board'),
        terrain: qc.N('terrain'),
        transfer: qc.N('transfer'),
        skill: qc.N('skill'),
        popsicle: qc.N('popsicle'),
        portal: qc.N('portal'),
        belowElement: qc.N('belowElement'),
        element: qc.N('element'),
        aboveElement: qc.N('aboveElement'),
        obstacleTransverse: qc.N('obstacleTransverse'),
        obstacleVertical: qc.N('obstacleVertical'),
        pop:qc.N('pop')
    };
}, {
        // 载入Tile预制
        tilePrefab: qc.Serializer.PREFAB,
        // 载入导弹预制
        rocketPrefab: qc.Serializer.PREFAB
    });

// 初始化盘面
LayerManager.prototype.init = function () {
    var self = this;
    // console.log(self.isLock);
    if (self.isLock) return;
    self.isLock = true;

    // 隐藏盘面
    // self.gameObject.x = 750;

    // 生成地形
    var floor = self.gameObject.find('floor');
    var floorScript = floor.getScript('qc.engine.FloorBuilder');
    floorScript.init();

    // 生成元素
    self.buildLayer();
};

/**
 * [initialElementBuilder 拿到数据表中的元素生成列表和生成概率]
 *  @return [array] _initialElementIdList 初始化元素数组
 */
LayerManager.prototype.initialElementBuilder = function () {
    var self = this;
    var _randomElement = {};
    //zone配置表
    var _zoneConfig = fs.ConfigManager.excelData.zone;

    // fillid配置表
    var _fillidConfig = fs.ConfigManager.excelData.fillid;

    var _fillRulesConfig = fs.ConfigManager.excelData.fillRule;
    // 获取当前关卡
    var _level = fs.ConfigManager.levelID;

    // 获取本关的fillID
    var _fillID = _zoneConfig[_level].fillID;
    // 在fillid配置表中查找本关的fillID所对应的初始化规则
    var _initialFillid = _fillidConfig[_fillID].initialFillRule;
    var _fillRule = _fillRulesConfig[_initialFillid];
    var _initialElement = {};

    _initialElement.idList = _fillRule.tileList;
    _initialElement.idPosibility = _fillRule.tileProbability;
    // console.log(_initialElement);
    return _initialElement;

}

// 重新生成一个包含特殊生成点tilelistId和新的随机返回数组
LayerManager.prototype.reSetList = function () {
    var self = this;

    // 特殊生成点，生成的随机元素
    var randomNewList = {};

    var _templist = [];

    var list = [];

    // 记录数组
    randomNewList.recordList = [];
    // 重排后的记录数组
    randomNewList.realList = [];
    // element层元素数组
    randomNewList.element = [];

    // 对所有的元素进行遍历
    for (var x = 0; x < 72; x++) {
        var _indexList = [];
        // 获取tmx中元素层的信息
        var pre_tl = fs.ConfigManager.levelData.layers[8].data[x];
        // 将tmx中的信息转换为property
        var pre_tp = fs.CommonLayer.getTmxPro(pre_tl);

        // 如果该位置的元素是==2004，说明是一个随机元素
        if (pre_tp != null && pre_tp.tileID == 2004) {
            // 记录一下随机的tilelistID,随机的元素表
            if (randomNewList.recordList.indexOf(parseInt(pre_tp.tileListID)) == -1) {
                // 记录tilelistID，如果之后的元素是使用同一张tilelist表，则使用相同的重组列表，否则用新的tilelist表用新的规则去打乱
                randomNewList.recordList.push(parseInt(pre_tp.tileListID));
                // list:指定随机生成点的数组
                list = fs.ConfigManager.excelData.tilesList[pre_tp.tileListID].tilelist.split(';');
                var _length = list.length;
                // 初始数组
                for (var k = 0; k < _length; k++) {
                    _templist[k] = parseInt(list[k]);
                }

                // 打乱后的tileList生成表
                var shuffleList = fs.Game.math.shuffle(_templist);

                for (var j = 0; j < list.length; j++) {
                    _indexList[j] = null;
                }

                // 建立新的tile property
                var _newTp = {
                    "tileID": shuffleList[pre_tp.num - 1]
                }
                randomNewList.element.push(_newTp);
                // 新的数组
                randomNewList.realList[pre_tp.tileListID] = [].concat(shuffleList);//使用concat方法，解决指向同一引用产生的bug

            } else {

                // 记录中存在tilelistID走之前记录的规则，不生成新的规则
                var _newTp = {
                    "tileID": randomNewList.realList[pre_tp.tileListID][pre_tp.num - 1]
                }

                randomNewList.element.push(_newTp);

            }
        }
        else {
            randomNewList.element.push(pre_tp);
        }
    }

    // randomNewLists：包含特殊掉落点tilelistId和新的随机返回数组的对象
    return randomNewList;

}

// 普通初始化随机元素的检测方法
// 检测左边2格
LayerManager.prototype.checkLeftTwo = function (index) {
    var self = this;

    if (self.tilesList.element[index - 1] != "randomElement" && self.tilesList.element[index - 2] != "randomElement") {
        if (self.tilesList.element[index - 1] == null || self.tilesList.element[index - 2] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 1].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 2].id)) {
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 1].id);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// 检测右边2格
LayerManager.prototype.checkRightTwo = function (index) {
    var self = this;
    if (self.tilesList.element[index + 1] != "randomElement" && self.tilesList.element[index + 2] != "randomElement") {
        if (self.tilesList.element[index + 2] == null || self.tilesList.element[index + 1] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 1].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 2].id)) {
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 1].id);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// 检测上边2格
LayerManager.prototype.checkTopTwo = function (index) {
    var self = this;
    if (self.tilesList.element[index - 9] != "randomElement" && self.tilesList.element[index - 18] != "randomElement") {
        if (self.tilesList.element[index - 9] == null || self.tilesList.element[index - 18] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 9].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 18].id)) {
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 9].id);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// 检测下边2格
LayerManager.prototype.checkBottomTwo = function (index) {
    var self = this;
    if (self.tilesList.element[index + 9] != "randomElement" && self.tilesList.element[index + 18] != "randomElement") {
        if (self.tilesList.element[index + 9] == null || self.tilesList.element[index + 18] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 9].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 18].id)) {
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 18].id);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// 检测左上角
LayerManager.prototype.checkLeftTopCorner = function (index) {
    var self = this;
    if (self.tilesList.element[index - 1] != "randomElement" && self.tilesList.element[index - 9] != "randomElement" && self.tilesList.element[index - 10] != "randomElement") {
        if (self.tilesList.element[index - 1] == null || self.tilesList.element[index - 9] == null || self.tilesList.element[index - 10] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 1].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 9].id) && fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 9].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 10].id)) {
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 1].id);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// 检测右上角
LayerManager.prototype.checkRightTopCorner = function (index) {
    var self = this;
    if (self.tilesList.element[index + 1] != "randomElement" && self.tilesList.element[index - 9] != "randomElement" && self.tilesList.element[index - 8] != "randomElement") {
        if (self.tilesList.element[index + 1] == null || self.tilesList.element[index - 9] == null || self.tilesList.element[index - 8] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 1].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 9].id) && fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 9].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 8].id)) {
            // _excludElementId.push(fs.CommonLayer.transformIDtoColor[self.tilesList.element[index + 1]]);
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 1].id);
        } else {
            return null
        }
    } else {
        return null
    }
}

// 检测左下角
LayerManager.prototype.checkLeftBottomCorner = function (index) {
    var self = this;
    if (self.tilesList.element[index - 1] != "randomElement" && self.tilesList.element[index + 9] != "randomElement" && self.tilesList.element[index + 8] != "randomElement") {
        if (self.tilesList.element[index - 1] == null || self.tilesList.element[index + 9] == null || self.tilesList.element[index + 8] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 1].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 9].id) && fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 9].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 8].id)) {
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 1].id);
        } else {
            return null
        }
    } else {
        return null
    }
}

// 检测右下角
LayerManager.prototype.checkRightBottomCorner = function (index) {
    var self = this;
    if (self.tilesList.element[index + 1] != "randomElement" && self.tilesList.element[index + 9] != "randomElement" && self.tilesList.element[index + 10] != "randomElement") {
        if (self.tilesList.element[index + 1] == null || self.tilesList.element[index + 9] == null || self.tilesList.element[index + 10] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 1].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 9].id) && fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 9].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 10].id)) {
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 1].id);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// 检测横空心
LayerManager.prototype.checkHorizontalCenter = function (index) {
    var self = this;
    if (self.tilesList.element[index + 1] != "randomElement" && self.tilesList.element[index - 1] != "randomElement") {
        if (self.tilesList.element[index + 1] == null || self.tilesList.element[index - 1] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 1].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 1].id)) {
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 1].id);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// 检测竖空心
LayerManager.prototype.checkVerticalCenter = function (index) {
    var self = this;
    if (self.tilesList.element[index + 9] != "randomElement" && self.tilesList.element[index - 9] != "randomElement") {
        if (self.tilesList.element[index + 9] == null || self.tilesList.element[index - 9] == null) {
            return null;
        }
        if (fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 9].id) == fs.CommonLayer.transformIDtoColor(self.tilesList.element[index - 9].id)) {
            return fs.CommonLayer.transformIDtoColor(self.tilesList.element[index + 9].id);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

/**
 * [buildCommonElement] 生成普通的随机元素
 * @param [index] int [需要生成的元素的位置]
 * @param [res] obj [配置数据]
 */
LayerManager.prototype.buildCommonElement = function (index) {
    var self = this;

    // 需要排除的颜色数组
    var _excludElementColor = [];

    // 0~9
    if (index < 9) {
        // 检测下面两个
        _excludElementColor.push(self.checkBottomTwo(index));

        if (index % 9 > 0) {
            // 检测左下角
            _excludElementColor.push(self.checkLeftBottomCorner(index));
        }

        if (index % 9 > 1) {
            // 检测左边两个
            _excludElementColor.push(self.checkLeftTwo(index));
        }

        if (index % 9 < 7) {
            // 检测右边两个
            _excludElementColor.push(self.checkRightTwo(index));
        }

        if (index % 9 < 8) {
            // 检测右下角
            _excludElementColor.push(self.checkRightBottomCorner(index));
        }

        if (index % 9 > 0 && index % 9 < 8) {
            // 检测横向中空
            _excludElementColor.push(self.checkHorizontalCenter(index));
        }
    }

    // 9~63
    if (index > 8 && index < 63) {
        // 检测竖空心
        _excludElementColor.push(self.checkVerticalCenter(index));

        if (index % 9 > 1) {
            // 检测左边两个
            _excludElementColor.push(self.checkLeftTwo(index));
        }

        if (index % 9 < 7) {
            // 检测右边两个
            _excludElementColor.push(self.checkRightTwo(index));
        }

        if (index < 54) {
            // 检测下面两个
            _excludElementColor.push(self.checkBottomTwo(index));
        }

        if (index > 17) {
            // 检测上面两个
            _excludElementColor.push(self.checkTopTwo(index));
        }

        if (index % 9 > 0) {
            // 检测左上角
            _excludElementColor.push(self.checkLeftTopCorner(index));

            // 检测左下角
            _excludElementColor.push(self.checkLeftBottomCorner(index));
        }

        if (index % 9 < 8) {
            // 检测右下角
            _excludElementColor.push(self.checkRightBottomCorner(index));

            // 检测右上角
            _excludElementColor.push(self.checkRightTopCorner(index));
        }

        if (index % 9 > 0 && index % 9 < 8) {
            // 检测横向中空
            _excludElementColor.push(self.checkHorizontalCenter(index));
        }

    }

    // 63~71
    if (index >= 63) {
        // 检测上面两个
        _excludElementColor.push(self.checkTopTwo(index));

        if (index % 9 > 0) {
            // 检测左上角
            _excludElementColor.push(self.checkLeftTopCorner(index));

        }

        if (index % 9 < 8) {
            // 检测右下角
            _excludElementColor.push(self.checkRightTopCorner(index));
        }

        if (index % 9 > 1) {
            // 检测左边两个
            _excludElementColor.push(self.checkLeftTwo(index));
            // 检测左上角
            _excludElementColor.push(self.checkLeftTopCorner(index));
        }

        if (index % 9 < 7) {
            // 检测右边两个
            _excludElementColor.push(self.checkRightTwo(index));
            // 检测右上角
            _excludElementColor.push(self.checkRightTopCorner(index));
        }

        if (index % 9 > 0 && index % 9 < 8) {

            // 检测横向中空
            _excludElementColor.push(self.checkHorizontalCenter(index));
        }
    }

    // _indexList：包含生成列表和生成概率两个对象
    var _initialList = self.initialElementBuilder();
    var _elementID = self.randomElementBuilder(_initialList, _excludElementColor);
    if (_elementID.indexOf('_') == -1) { // 如果elementID带生命值信息
        self.checkInitialCombo(index, parseInt(_elementID));
    } else {
        var _tempElementID = _elementID.split('_');
        self.checkInitialCombo(index, parseInt(_tempElementID[0]), parseInt(_tempElementID[1]));
    }

}

/**
 * [checkInitialCombo 生成初始随机元素]
 * @param [number] index [需要检测元素的位置(序号)]
 * @param [obj] res [配置表对象]
 */
LayerManager.prototype.checkInitialCombo = function (index, randomElementId, life) {
    var self = this;
    // 随机出来的与周围不构成三消的id
    var _randomElementId = randomElementId;
    // 生成

    if (life == null) {
        var _randomElement = {
            "tileID": _randomElementId
        }
    } else {
        var _randomElement = {
            "tileID": _randomElementId,
            "hp": life
        }
    }


    var _to = fs.TileFactory.buildTile(index, _randomElement, 'element');
    self.tilesList.element[index] = _to;
}

/**
 * [randomElementBuilder 生成一个符合要求的element]
 * @param [obj] elementslist [包含生成对象元素id的数组和一个概率数组]
 * @return [int] _elementList[_randomBuildElementIndex] [返回一个随机的生成元素]
 */
LayerManager.prototype.randomElementBuilder = function (elementslist, excludElementColor) {
    var self = this;
    var _resultIndex = null;
    var _result = null;
    var _elementList = elementslist.idList.split(';');
    var _elementPosibility = elementslist.idPosibility.split(';');
    var Aindex = [];
    var _deleteCount = 0;

    //需要排除的颜色
    var _excludElementColor = excludElementColor;

    var clerSameList = function (parmList) {
        parmList.sort();
        var re = [parmList[0]];
        for (var i = 1; i < parmList.length; i++) {
            if (parmList[i] !== re[re.length - 1]) {
                re.push(parmList[i]);
            }
        }
        return re;
    }
    _excludElementColor = clerSameList(_excludElementColor);

    for (var _l = 0; _l < _excludElementColor.length; _l++) {
        if (_excludElementColor[_l] != null) {
            for (var _m = 0; _m < _elementList.length; _m++) {
                if (_excludElementColor[_l] == fs.CommonLayer.transformIDtoColor(parseInt(_elementList[_m]))) {
                    Aindex.push(_m);
                }
            }
        }
    }

    // 将元素数组转换为颜色数组
    var _elementColorList = [];
    for (var _x = 0; _x < _elementList.length; _x++) {
        _elementColorList[_x] = fs.CommonLayer.transformIDtoColor(parseInt(_elementList[_x]));
    }

    for (var i = 0; i < Aindex.length; i++) {
        if (Aindex.length == 0) {
            break;
        }

        if (_deleteCount == 0) {
            _elementList.splice(Aindex[i], 1);
            _elementPosibility.splice(Aindex[i], 1);
            _deleteCount++;
        } else {
            _elementList.splice(Aindex[i] - _deleteCount, 1);
            _elementPosibility.splice(Aindex[i] - _deleteCount, 1);
            _deleteCount++;
        }
    }

    // 转化为int
    for (var _i = 0; _i < _elementPosibility.length; _i++) {
        _elementPosibility[_i] = parseInt(_elementPosibility[_i]);
    }

    var _randomBuildElementIndex = self.buildTileByPosibility(_elementList, _elementPosibility);

    return _elementList[_randomBuildElementIndex];

}

/**
 * [buildLayer 生成棋盘元素]
 */
LayerManager.prototype.buildLayer = function () {
    var self = this,
        len = fs.ConfigManager.row * fs.ConfigManager.colunm;

    // 获取生成点
    self.generator = fs.TileBuilder.getInfo();

    // 随机获取一个鱼片层
    var popsicleName = fs.CommonLayer.getPopsicle();

    // 冰棒层鱼片数量计数器
    var _popsicleInfoCount = 0;

    var randomNewList = self.reSetList(fs.ConfigManager.levelData);

    // 虫洞数组计数器
    var wormholeDataCount = 0;
    // 遍历Layer配置文件，生成棋盘元素
    for (var i = 0; i < len; i++) {

        for (var j = 0, tlen = fs.ConfigManager.levelData.layers.length; j < tlen; j++) {
            var tl = fs.ConfigManager.levelData.layers[j];

            // type : 每层元素的id
            var type = tl.data[i];

            // tile property的值  包含tileID和hp一类
            var tp = fs.CommonLayer.getTmxPro(type);
            // 地形层

            if (tl.name == 'terrain') {
                if (type == 0) {
                    self.tilesList.terrain.push(null);
                } else {
                    if (tp.tileID != 2001 && tp.tileID != 2002 && tp.tileID != 2003 && tp.tileID != 2501) {
                        var _to = fs.TileFactory.buildTile(i, tp, tl.name);
                        self.tilesList.terrain.push(_to);
                        var _tempObj = {};
                        _tempObj.tileID = tp.tileID;
                        if (tp.transferPosition) {
                            _tempObj.transferPosition = tp.transferPosition;
                        }
                        _tempObj.index = i;
                        fs.ConveyorLayer.specialTransferPosition.push(_tempObj);
                        // fs.ConveyorLayer.commomTransferPosition.push(i);
                    } else {
                        self.tilesList.terrain.push(null);
                    }
                }
            }

            // 地形传送层
            if (tl.name == 'transfer') {

            }

            // 地形传送层2
            if (tl.name == 'transfer2') {

            }

            // 技能层
            if (tl.name == 'skill') {

            }

            // 鱼片层
            if (tl.name == popsicleName) {
                if (type == 0) {
                    self.tilesList.popsicle.push(null);
                } else {
                    var _to = fs.TileFactory.buildTile(i, tp, "popsicle");
                    var tileObj = fs.ConfigManager.excelData.tiles[tp.tileID];
                    // 将符合要求的元素push到popsicleInfoList数组中
                    self.popsicleInfoList[_popsicleInfoCount] = [];

                    // 鱼排位置数组生成方法
                    var popsicleInfoBuilder = function (height, width, i) {
                        if (height == null && width == null) {
                            // 长度为1宽度为1
                            self.popsicleInfoList[_popsicleInfoCount].push(i);
                        } else {
                            var widthlist = [];
                            // 宽度
                            for (var colnum = 0; colnum < width; colnum++) {
                                var _position = (i + colnum) % 9;
                                widthlist.push(_position);
                            }
                            // 高度
                            for (var rownum = i - (height - 1) * 9; rownum <= i + (width - 1); rownum++) {
                                for (var _m = 0; _m < widthlist.length; _m++) {
                                    if (rownum % 9 == widthlist[_m]) {
                                        self.popsicleInfoList[_popsicleInfoCount].push(rownum);
                                    }
                                }
                            }

                        }
                    }

                    popsicleInfoBuilder(tileObj.height, tileObj.width, i);

                    var pop = self.popsicleInfoList[_popsicleInfoCount];
                    _to.range = self.popsicleInfoList[_popsicleInfoCount];

                    for (var k = 0, popLen = pop.length; k < popLen; k++) {
                        var place = pop[k];
                        self.tilesList.popsicle[place] = _to;
                    }

                    _popsicleInfoCount++;
                }
            }

            // 特殊掉落点层
            if (tl.name == 'portal') {
                if (type == 0) {
                    self.tilesList.portal.push(null);
                } else {
                    if (tp.tileID == "2601") {
                        var _tempTransferPosition = tp.transferPosition.split(",");
                        var _index = fs.CommonLayer.getIndexFromRowAndCol(parseInt(_tempTransferPosition[0]) - 1, parseInt(_tempTransferPosition[1]) - 1);
                        self.wormholeData[wormholeDataCount] = {};
                        self.wormholeData[wormholeDataCount].tileID = tp.tileID;
                        self.wormholeData[wormholeDataCount].transferPosition = _index;
                        self.wormholeData[wormholeDataCount].index = i;
                        wormholeDataCount++;
                    } else if (tp.tileID == "2602") {
                        self.wormholeData[wormholeDataCount] = {};
                        self.wormholeData[wormholeDataCount].tileID = tp.tileID;
                        self.wormholeData[wormholeDataCount].index = i;
                        wormholeDataCount++;
                    }
                    var _to = fs.TileFactory.buildTile(i, tp, tl.name);
                    self.tilesList.portal.push(_to);
                }
            }
            // 元素下层
            if (tl.name == 'belowElement') {
                if (type == 0) {
                    self.tilesList.belowElement.push(null);
                } else {
                    var _to = fs.TileFactory.buildTile(i, tp, tl.name);
                    self.tilesList.belowElement.push(_to);
                }
            }

            // 元素层
            if (tl.name == 'element') {
                // 第一次生成，仅仅生成预设地图层
                // 检测是否为空阻挡或空可通过
                var _d = fs.ConfigManager.levelData.layers[0].data[i];

                if (type != 0) {
                    if (tp.tileID == 2004) {

                        // tp.tileID为2004说明该点为指定随机生成点，需要根据指定的规则来进行生成
                        self.tilesList.element.push("specialElement");
                    } else {
                        var _to = fs.TileFactory.buildTile(i, tp, tl.name);
                        self.tilesList.element.push(_to);
                    }
                }

                if (type == 0) {
                    if (_d == 1 || _d == 2) {
                        // _d ==1或者 _d==2为有阻挡的情况
                        tp = fs.CommonLayer.getTmxPro(_d);
                        var _to = fs.TileFactory.buildTile(i, tp, tl.name);
                        self.tilesList.element.push(_to);
                    } else {
                        //留一个'randomElement'作为占位标记，在后面进行填充生成
                        self.tilesList.element.push("randomElement");
                    }
                }

            }

            // 元素上层
            if (tl.name == 'aboveElement') {
                if (type == 0) {
                    self.tilesList.aboveElement.push(null);
                } else {
                    var _to = fs.TileFactory.buildTile(i, tp, tl.name);
                    self.tilesList.aboveElement.push(_to);
                }
            }

            // 障碍物横层
            if (tl.name == 'obstacleTransverse') {

            }

            // 障碍物竖层
            if (tl.name == 'obstacleVertical') {

            }
        }

    }



    var elementThirdBuilder = function () {
        // element层第三次生成，生成普通随机元素
        for (var _j = 0; _j < 72; _j++) {
            var tl = fs.ConfigManager.levelData.layers[8];
            // type : 每层元素的id
            var type = tl.data[_j];
            // tile property的值  包含tileID和hp一类
            var tp = fs.CommonLayer.getTmxPro(type);
            var _d = fs.ConfigManager.levelData.layers[0].data[_j];

            if (self.tilesList.element[_j] == "randomElement") {
                self.buildCommonElement(_j);
            }
        }
        // 如果初始化死图，再进行一次第三次element生成
        while (fs.DisFactory.checkMapDie() === true/* || fs.DisFactory.checkElement(true)*/) {
            console.error('存在三消元素,重构地图');
            elementSecondBuilder();
        }
    }

    var elementSecondBuilder = function () {
        // element层第二次生成，生成特殊规则生成点位置
        for (var _i = 0; _i < 72; _i++) {
            var tl = fs.ConfigManager.levelData.layers[8];
            // type : 每层元素的id
            var type = tl.data[_i];
            // tile property的值  包含tileID和hp一类
            var tp = fs.CommonLayer.getTmxPro(type);
            var _d = fs.ConfigManager.levelData.layers[0].data[_i];

            if (type != 0) {
                if (self.tilesList.element[_i] == "specialElement") {
                    // tp.tileID为2004说明该点为指定随机生成点，需要根据指定的规则来进行生成
                    var _to = fs.TileFactory.buildTile(_i, randomNewList.element[_i], "element");
                    self.tilesList.element[_i] = _to;
                }
            }
        }
        // 进行第三次生成
        elementThirdBuilder();
    }
    // 第二和第三次生成
    elementSecondBuilder();

    // 填充对象池
    fs.TilePool.supplyTile();
}

// 从左往右滑出盘面
LayerManager.prototype.showBoard = function () {
    var self = this;
    var boardNode = self.gameObject;
    tp = boardNode.getScript('qc.TweenPosition');

    tp.from = new qc.Point(boardNode.x, boardNode.y);
    tp.to = new qc.Point(-360, boardNode.y);

    tp.duration = 0.8;

    // 添加TweenPosition完成后事件，触发后自动被移除
    tp.onFinished.addOnce(function () {
        // 更改状态
        fs.GameManager.changeFSM();
    });

    tp.resetToBeginning();
    tp.playForward();
};

// 检测所有元素是否掉落完成
LayerManager.prototype.checkDropComplete = function () {
    var self = this;
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;
    for (var i = 0; i < len; i++) {
        if (fs.LayerManager.tilesList.element[i]) {
            if (fs.LayerManager.tilesList.element[i].moveFlag) {
                return false;
            }
        }
    }
    return true;
};

// 检测元素是否消除完成
LayerManager.prototype.checkDisComplete = function () {
    var self = this;
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;
    for (var i = 0; i < len; i++) {
        if (fs.LayerManager.tilesList.element[i]) {
            if (fs.LayerManager.tilesList.element[i].delFlag) {
                return false;
            }
        }
    }
    return true;
};

// 检测新加元素是否掉落完成
LayerManager.prototype.checkNewTileComplete = function () {
    var self = this;
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;
    for (var i = 0; i < len; i++) {
        if (fs.LayerManager.tilesList.element[i]) {
            if (fs.LayerManager.tilesList.element[i].newFlag) {
                return false;
            }
        }
    }
    // 添加combo计数
    fs.GameManager.comboCount++;
    return true;
};

// 掉落全部方块
LayerManager.prototype.dropAll = function () {
    var self = this;

    // 从倒数第一行开始
    for (var row = fs.ConfigManager.row - 1; row >= 0; row--) {
        for (var col = 0; col < fs.ConfigManager.colunm; col++) {
            // 获取当前方格位置
            var index = col + row * fs.ConfigManager.colunm;
            self.dropOne(index);
        }
    }
};

// 掉落单个方块
LayerManager.prototype.dropOne = function (index) {
    var self = this;

    var tile = fs.LayerManager.tilesList.element[index];

    // 检测当前掉落位置是否为生成点位置（性能优化版）
    if (tile == null) {
        for (var i in fs.LayerManager.generator) {
            if (i == index) {
                // 如果为生成点，则到对象池拿元素
                var tile = fs.LayerManager.tilesList.element[index] = fs.TilePool.getTile(index);
            }
        }
    }

    if (tile != null) {
        // 只有可交换的元素才能掉落，并且该元素没有在正在掉落中
        if (tile.isSwap && !tile.moveFlag) {

            // 移动路径记录
            var movePath = [];
            var isDrop = true;

            var newIndex = index;

            if (tile.newFlag) {
                movePath.push(newIndex);
            }

            // 规划掉落路线
            while (isDrop) {

                // 正常掉落
                if (fs.LayerManager.tilesList.element[newIndex + 9] == null && fs.BaseLayer.isCanSwap(newIndex, 'down')) {
                    // 下移
                    newIndex = newIndex + 9;
                    movePath.push(newIndex);
                } else if (fs.LayerManager.tilesList.element[newIndex + 9] != null && fs.LayerManager.tilesList.element[newIndex + 9].isCross) {
                    // 空可通过
                    var _nextIndex = newIndex + 9,
                        flag = false,
                        total = 0;

                    while (_nextIndex < 71) {
                        var nextTile = fs.LayerManager.tilesList.element[_nextIndex];
                        if (nextTile != null && !nextTile.isCross) {
                            // 跳出
                            _nextIndex = 71;
                        } else if (nextTile == null && tile.canSwapByDirection('down') && fs.BaseLayer.isCanSwap(newIndex - 9, 'down')) {
                            total++;
                        }
                        _nextIndex += 9;
                    }

                    if (total > 0) {
                        for (var i = 0; i < total; i++) {
                            newIndex = newIndex + 9;
                            movePath.push(newIndex);
                        }
                        isDrop = true;
                        flag = true;
                    }

                    // 如果下面有空可通过方块但又不能往下移动，则判断左右移动
                    if (!flag) {
                        if (newIndex % 9 > 0 && fs.LayerManager.tilesList.element[newIndex + 9 - 1] == null && fs.BaseLayer.isCanSwap(newIndex, 'left_down')) {
                            // 左移
                            if (fs.BaseLayer.hasCross(newIndex - 1)) {
                                newIndex = newIndex + 9 - 1;
                                movePath.push(newIndex);

                                isDrop = true;
                            } else {
                                isDrop = false;
                            }

                        } else if (newIndex % 9 != 8 && fs.LayerManager.tilesList.element[newIndex + 9 + 1] == null && fs.BaseLayer.isCanSwap(newIndex, 'right_down')) {
                            // 右移
                            if (fs.BaseLayer.hasCross(newIndex + 1)) {
                                newIndex = newIndex + 9 + 1;
                                movePath.push(newIndex);

                                isDrop = true;
                            } else {
                                isDrop = false;
                            }
                        } else {
                            isDrop = false;
                        }
                    }

                } else if (newIndex % 9 > 0 && fs.LayerManager.tilesList.element[newIndex + 9 - 1] == null && fs.BaseLayer.isCanSwap(newIndex, 'left_down')) {
                    // 左移
                    if (fs.BaseLayer.hasCross(newIndex - 1)) {
                        newIndex = newIndex + 9 - 1;
                        movePath.push(newIndex);

                        isDrop = true;
                    } else {
                        isDrop = false;
                    }

                } else if (newIndex % 9 != 8 && fs.LayerManager.tilesList.element[newIndex + 9 + 1] == null && fs.BaseLayer.isCanSwap(newIndex, 'right_down')) {
                    // 右移
                    if (fs.BaseLayer.hasCross(newIndex + 1)) {
                        newIndex = newIndex + 9 + 1;
                        movePath.push(newIndex);

                        isDrop = true;
                    } else {
                        isDrop = false;
                    }

                } else {
                    // 三个方向都不能移动了
                    isDrop = false;
                }

                // 虫洞判断
                var transferIndex = self.isTransfer(newIndex);
                if (transferIndex != null && !fs.BaseLayer.isBinded(newIndex)) {
                    newIndex = transferIndex;
                    movePath.push(newIndex);
                    isDrop = true;
                }
            }

            var len = movePath.length;
            // 执行掉落
            if (len > 0) {
                var dropCount = 0;
                var gridNode = tile.gameObject;
                var ts = gridNode.getScript('qc.TweenScale');
                var tp = gridNode.getScript('qc.TweenPosition');

                // 掉落完成执行回调
                var waitFn = function () {
                    ts.from = new qc.Point(0.8, 1.2);
                    ts.to = new qc.Point(1, 0.75);
                    tp.from = new qc.Point(gridNode.x, gridNode.y);
                    tp.to = new qc.Point(gridNode.x, gridNode.y + 10);
                    ts.duration = 0.06;
                    tp.duration = 0.06;
                    ts.resetToBeginning();
                    ts.playForward();
                    tp.resetToBeginning();
                    tp.playForward();

                    tp.onFinished.addOnce(function () {
                        ts.from = new qc.Point(1, 0.75);
                        ts.to = new qc.Point(1, 0.7);
                        ts.duration = 0.05;
                        ts.resetToBeginning();
                        ts.playForward();

                        ts.onFinished.addOnce(function () {
                            ts.from = new qc.Point(1, 0.7);
                            ts.to = new qc.Point(1, 1);
                            tp.from = new qc.Point(gridNode.x, gridNode.y);
                            tp.to = new qc.Point(gridNode.x, gridNode.y - 16);
                            ts.duration = 0.08;
                            tp.duration = 0.08;
                            ts.resetToBeginning();
                            ts.playForward();
                            tp.resetToBeginning();
                            tp.playForward();

                            tp.onFinished.addOnce(function () {
                                tp.from = new qc.Point(gridNode.x, gridNode.y);
                                tp.to = new qc.Point(gridNode.x, gridNode.y + 6);
                                tp.duration = 0.08;
                                tp.resetToBeginning();
                                tp.playForward();

                                tp.onFinished.addOnce(function () {
                                    // 更新状态
                                    tile.setMoveFlag(false);
                                    tile.setNewFlag(false);
                                });
                            });
                        });
                    });
                };

                // 设置为正在移动状态
                tile.setMoveFlag(true);

                // 改变形状
                ts.from = new qc.Point(1, 1);
                ts.to = new qc.Point(0.8, 1.2);
                ts.duration = 0.08;
                ts.resetToBeginning();
                ts.playForward();

                // 设置每个格子移动时间
                var dt = 0.1;
                if (len > 4) {
                    dt = 0.05;
                } else if (len > 3) {
                    dt = 0.07;
                }

                // 开始移动
                tile.dropMove(movePath, dropCount, dt, waitFn);

                // 移动后变更TileList数据
                if (tile.newFlag && len == 1) {
                    fs.LayerManager.tilesList.element[newIndex] = tile;
                } else {
                    fs.LayerManager.tilesList.element[newIndex] = tile;
                    if (tile.newFlag) {
                        // 如果为新加元素，延迟对生成器位置赋null，主要实现新加元素有层次的掉落效果
                        fs.Game.timer.add(160, function () {
                            fs.LayerManager.tilesList.element[index] = null;
                        });
                    } else {
                        fs.LayerManager.tilesList.element[index] = null;
                    }
                }
            }
        }
    }
};

// 通过当前方格位置得到虫洞出口位置
// 如果返回null，则没有虫洞或虫洞出口有方块
LayerManager.prototype.isTransfer = function (index) {
    var self = this,
        targetIndex = null;

    for (var i = 0, len = self.wormholeData.length; i < len; i++) {
        var _obj = self.wormholeData[i];
        if (_obj.index == index && _obj.hasOwnProperty("transferPosition")) {
            if (fs.LayerManager.tilesList.element[_obj.transferPosition] == null) {
                targetIndex = _obj.transferPosition;
                break;
            }
        }
    }

    return targetIndex;
};

// 方块生成器
LayerManager.prototype.TileGenerator = function () {
    var self = this;

    for (var i in fs.LayerManager.generator) {
        var tile = fs.LayerManager.tilesList.element[i];
        if (tile == null) {
            var prop = self.getRandomProp(i);
            var _to = fs.TileFactory.buildTile(i, prop, 'element', true);
            self.tilesList.element[i] = _to;
        }
    }
};

// 获取随机生成元素的属性
LayerManager.prototype.getRandomProp = function (index) {
    var self = this,
        properties = {};

    var rule = fs.LayerManager.generator[index];

    var rLen = Object.keys(rule).length;

    if (rLen > 1) {
        for (var i in rule) {
            if (rule[i].useTime > 0) {
                var _elementPosibility = rule[i].dropPosibility;//掉落概率
                var _elementList = rule[i].elementList;// 掉落元素列表
                var _randomBuildElementIndex = self.buildTileByPosibility(_elementList, _elementPosibility)

                var tileid = rule[i].elementList[_randomBuildElementIndex];
                rule[i].useTime--;
                break;
            } else if (rule[i].useTime == -1) {
                var _elementPosibility = rule[i].dropPosibility;//掉落概率
                var _elementList = rule[i].elementList;// 掉落元素列表
                var _randomBuildElementIndex = self.buildTileByPosibility(_elementList, _elementPosibility)

                var tileid = rule[i].elementList[_randomBuildElementIndex];
            }
        }
    } else {
        var _elementPosibility = rule[0].dropPosibility;//掉落概率
        var _elementList = rule[0].elementList;// 掉落元素列表
        var _randomBuildElementIndex = self.buildTileByPosibility(_elementList, _elementPosibility)

        if (rule[0].elementList.length == undefined) {
            var tileid = rule[0].elementList;
        } else {
            // var m = self.game.math.random(0, rule[0].elementList.length - 1);
            var tileid = rule[0].elementList[_randomBuildElementIndex];
        }
    }
    if (tileid.length != undefined) {
        var tileArray = tileid.split('_');
    } else {
        var tileArray = [tileid];
    }

    properties.tileID = tileArray[0];
    if (tileArray[1]) {
        properties.hp = tileArray[1];
    }

    return properties;
};

/**
 * buildTileByPosibility:通过生成概率来生成元素
 * @param {array} _elementList:生成元素id列表
 * @param {array} _elementPosibility:生成元素概率列表
 * */
LayerManager.prototype.buildTileByPosibility = function (_elementList, _elementPosibility) {
    var _tempList = [];
    // 制造一个概率池，让在概率池中随机取数来制造随机元素
    for (var _j = 0; _j < _elementPosibility.length; _j++) {
        _tempList[0] = _elementPosibility[0];
        if (_j != 0) {
            _tempList[_j] = _elementPosibility[_j] + _tempList[_j - 1];
        }
    }

    var _randomIndex = Math.ceil(Math.random() * _tempList[_tempList.length - 1]);
    var _randomBuildElementIndex;

    // 拿到生成元素的索引，根据概率
    for (var _k = 0; _k < _tempList.length; _k++) {
        if (_tempList[_k] >= _randomIndex) {
            _randomBuildElementIndex = _k;
            break;
        }
    }
    return _randomBuildElementIndex;
}

// 元素动作执行
LayerManager.prototype.tileAction = function () {
    var self = this;
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var count = 0;

    self.fruitArray = [];

    // Tile元素执行后回调
    var hasFruitComplete = function () {
        if (--count <= 0) {

        }
    };

    // 获取可释放技能的果树
    for (var i = 0; i < len; i++) {
        var tile = fs.LayerManager.tilesList.element[i];
        if (tile != null && tile.class3 == 'tree' && tile.hp == 3) {
            self.fruitArray.push(tile);
        }
    }

    if (self.fruitArray.length) {
        // 释放果树技能
        self.fruitArray.forEach(function (tile, index) {
            count++;
            tile.updateRounds(hasFruitComplete);
        });
    } else {
        fs.GameManager.changeFSM();
        return;
    }

    // 设置监听定时器
    self.tileActionTimer = fs.Game.timer.loop(100, self.hasTileComplete.bind(self));
};

// 监听元素动作是否完成
LayerManager.prototype.hasTileComplete = function () {
    var self = this;
    var flag = false;

    for (var i = 0, len = self.fruitArray.length; i < len; i++) {
        var tile = self.fruitArray[i];

        if (tile.moveFlag) {
            flag = true;
            break;
        }
    }

    if (!flag) {
        fs.Game.timer.remove(self.tileActionTimer);
        // 延迟时间切换状态
        fs.Game.timer.add(500, function () {
            fs.GameManager.changeFSM();
        });
    }
};


// 层事件传播
// index:当前tile位置
// action:事件类型
// color: 当前消除的颜色
// actionValue:当action为action_self时，actValue值代表技能ID; 当action为action_props时，actValue值代表道具ID
// total: 本次消除的个数(默认为1) 用于后面的元素逻辑，待增加
LayerManager.prototype.layerPropagation = function (index, color, action, actionValue, total) {
    if (total == undefined) {
        total = 1;
    }
    if (actionValue == undefined) {
        actionValue = null;
    }

    var tile = fs.LayerManager.tilesList.element[index];
    if (tile == null) {
        return;
    }

    var isPropagate = false,
        layers = 4;

    for (var i = 0; i < layers; i++) {
        var element = null;

        if (i == 0) {
            element = fs.LayerManager.tilesList.aboveElement[index];
        }
        if (i == 1) {
            element = tile;
        }
        if (i == 2) {
            element = fs.LayerManager.tilesList.belowElement[index];
        }
        if (i == 3) {
            element = fs.LayerManager.tilesList.popsicle[index];
        }

        if (element != null) {
            if (!isPropagate) {
                isPropagate = element.doAction(color, action, actionValue, total);
            } else {
                break;
            }
        }
    }
};

/**
 * [TaskLogic 任务管理器]
 * author:Sangliang
 * email:sangliang@supernano.com
 */
var TaskLogic = qc.fs.TaskLogic = {};

//消除目标的数组 
TaskLogic.targetElement = [];

// 消除目标的数量数组
TaskLogic.elementNum = [];

// 目标对象数组(包含数量和数组)
TaskLogic.taskObj = [];
// 剩余目标
TaskLogic.restTaskObj = [];

//boss的当前血量
TaskLogic.bossHP = null;

//boss掉的hp
TaskLogic.bossDownHP = 0;

//boss的默认血量
TaskLogic.bossHPDefault = null;

//游戏的最终结果
TaskLogic.gameResult = null;

/**
 * juiceTaskControl 果汁模式任务控制初始化
 * @param {obj} data : 从SceneUI传过来包含UI界面的数据
 * @zoneData {obj} zoneData: zone表配置文件
 */
TaskLogic.juiceTaskControl = function (data, zoneData) {
    var self = this;

    self.setTargetListData(zoneData);
    self.refreshJuiceTask(data);
    console.log(self.taskObj);
    console.log(self.restTaskObj);
}

// 刷新task UI 界面
TaskLogic.refreshJuiceTask = function (data) {
    var self = this;
    var targetNodeList = data.gameModeTarget.juiceTarget.target.children;

    // 初始化三个待消除的元素
    for (var i = 0; i < 3; i++) {
        console.info();
        targetNodeList[i].children[0].frame = self.taskObj[i].showPic;
        targetNodeList[i].children[0].scaleX = self.taskObj[i].scale;
        targetNodeList[i].children[0].scaleY = self.taskObj[i].scale;
        targetNodeList[i].children[1].find('UIText').text = self.taskObj[i].elementNumber.toString();
    }
    data.gameModeTarget.juiceTarget.rest.find('restNum').text = self.restTaskObj.length.toString();
}

/**
 * popsicleControl boss模式任务控制初始化
 * @param {obj} data : 从SceneUI传过来包含UI界面的数据
 * @zoneData {obj} zoneData: zone表配置文件
 */
TaskLogic.bossTaskControl = function (data, zoneData) {
    var self = this;

    self.setTargetListData(zoneData);

    // boss血量
    self.bossHPDefault = parseInt(self.taskObj[0].ai.split(';'));
    self.bossHP = self.bossHPDefault;

    self.refreshBossTask(data);
}

// 刷新boss界面  
TaskLogic.refreshBossTask = function (data) {
    var self = this;
    var _hpText = qc.N('hpPercentText');

    for (var j = 0; j < 4; j++) {
        data.gameModeTarget.bossTarget.ui.children[0].children[j].visible = false;
    }

    for (var i = 0; i < self.taskObj.length; i++) {
        data.gameModeTarget.bossTarget.ui.children[0].children[i].visible = true;
        data.gameModeTarget.bossTarget.ui.children[0].children[i].frame = self.taskObj[i].showPic;
    }

    var _percent = self.bossHP / self.bossHPDefault;
    
    if(_percent<=0){
        _percent = 0;
    }

    _hpText.text =""+Math.ceil(_percent*100)+""; 


    var fullOffset = -340;

    // 血条的位置变化
    var hpPic = data.gameModeTarget.bossTarget.hp.children[0];

    hpPic.x = fullOffset - (fullOffset * _percent);

}

/**
 * popsicleControl 鱼片模式任务控制初始化
 * @param {obj} data : 从SceneUI传过来包含UI界面的数据
 * @zoneData {obj} zoneData: zone表配置文件
 */
TaskLogic.popsicleControl = function (data, zoneData) {
    var self = this;

    self.setTargetListData(zoneData);
    self.refreshPopsicleTask(data);
}
// 刷新 鱼片层UI数据
TaskLogic.refreshPopsicleTask = function (data) {
    var self = this;
    data.gPd.find("icon").frame = self.taskObj[0].showPic;
    data.gPd.find("icon").frame.scaleX = self.taskObj[0].scale;
    data.gPd.find("icon").frame.scaleY = self.taskObj[0].scale;
    data.gPd.find("numBg").find("UIText").text = self.taskObj[0].elementNumber.toString();

}

TaskLogic.dogfoodControl = function (data, zoneData) {
    var self = this;

    self.setTargetListData(zoneData);
    self.refreshDogfoodTask(data);
}

TaskLogic.refreshDogfoodTask = function (data) {
    var self = this;
    data.gPd.find("icon").frame = self.taskObj[0].showPic;
    data.gPd.find("icon").frame.scaleX = self.taskObj[0].scale;
    data.gPd.find("icon").frame.scaleY = self.taskObj[0].scale;
    data.gPd.find("numBg").find("UIText").text = self.taskObj[0].elementNumber.toString();
}

/**
 * setTargetListData : 给self.taskObj设置所有目标对象的数据信息
 * @param {obj} zoneData:数据配置表
 */
TaskLogic.setTargetListData = function (zoneData) {

    var self = this;

    var _purchase = zoneData.purchase;
    var _num = zoneData.num;
    var _ai = zoneData.ai;

    if (fs.ScenesUI.gameMode == "juice" || fs.ScenesUI.gameMode == "trouble") {// 当目标元素有多个时,适用于果汁和Boss模式
        if (_purchase.length != null) {
            self.targetElement = _purchase.split(';');
        } else {
            self.targetElement = [_purchase];
        }
        if (_num != null) {
            self.elementNum = _num.split(";");
        }
        for (var i = 0; i < self.targetElement.length; i++) {
            self.taskObj[i] = {};
            // 任务元素id
            self.taskObj[i].elementID = fs.ConfigManager.excelData.purchase[self.targetElement[i]].includeTileList;

            // 任务元素数量
            self.taskObj[i].elementNumber = parseInt(self.elementNum[i]);

            // 设置目标背景图
            self.taskObj[i].showPic = fs.ConfigManager.excelData.purchase[self.targetElement[i]].resource;

            // 设置任务元素class
            if (fs.ConfigManager.excelData.purchase[self.targetElement[i]].class1 != undefined) {
                self.taskObj[i].class1 = fs.ConfigManager.excelData.purchase[self.targetElement[i]].class1;

            } else {
                self.taskObj[i].class1 = null;
            }
            if (fs.ConfigManager.excelData.purchase[self.targetElement[i]].class2 != undefined) {
                self.taskObj[i].class2 = fs.ConfigManager.excelData.purchase[self.targetElement[i]].class2;

            } else {
                self.taskObj[i].class2 = null;
            }
            if (fs.ConfigManager.excelData.purchase[self.targetElement[i]].class3 != undefined) {
                self.taskObj[i].class3 = fs.ConfigManager.excelData.purchase[self.targetElement[i]].class3;

            } else {
                self.taskObj[i].class3 = null;
            }

            // 任务元素的缩放
            self.taskObj[i].scale = fs.ConfigManager.excelData.purchase[self.targetElement[i]].scale;

            // 任务元素的颜色
            self.taskObj[i].color = fs.ConfigManager.excelData.purchase[self.targetElement[i]].color;

            //
            self.taskObj[i].ai = _ai;
        }

        if (self.taskObj.length > 3) {
            var _count = 0;
            var _temp = [].concat(self.taskObj);
            for (var i = 3; i < self.taskObj.length; i++) {
                self.restTaskObj[_count] = _temp[i];
                _count++;
            }
        }
    } else {//只有一个目标元素时，适用于鱼片和饼干模式
        self.targetElement = _purchase;
        self.elementNum = _num;
        self.taskObj[0] = {};
        self.taskObj[0].elementID = fs.ConfigManager.excelData.purchase[self.targetElement].includeTileList;
        self.taskObj[0].elementNumber = self.elementNum;
        self.taskObj[0].showPic = fs.ConfigManager.excelData.purchase[self.targetElement].resource;

        // 设置任务元素class
        if (fs.ConfigManager.excelData.purchase[self.targetElement].class1 != undefined) {
            self.taskObj[0].class1 = fs.ConfigManager.excelData.purchase[self.targetElement].class1;
        } else {
            self.taskObj[0].class1 = null;
        }
        if (fs.ConfigManager.excelData.purchase[self.targetElement].class2 != undefined) {
            self.taskObj[0].class2 = fs.ConfigManager.excelData.purchase[self.targetElement].class2;

        } else {
            self.taskObj[0].class2 = null;
        }
        if (fs.ConfigManager.excelData.purchase[self.targetElement].class3 != undefined) {
            self.taskObj[0].class3 = fs.ConfigManager.excelData.purchase[self.targetElement].class3;

        } else {
            self.taskObj[0].class3 = null;
        }

        // 任务元素的缩放
        self.taskObj[0].scale = fs.ConfigManager.excelData.purchase[self.targetElement].scale;

        // 任务元素的颜色
        self.taskObj[0].color = fs.ConfigManager.excelData.purchase[self.targetElement].color;
    }
}

// 判断游戏结束条件
TaskLogic.checkGameResult = function () {
    var self = this;
    // 果汁模式通关条件
    if (fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID].type == "juice") {
        if (fs.ScenesUI.gameModeTarget.juiceTarget.target.children[0].visible == false && fs.ScenesUI.gameModeTarget.juiceTarget.target.children[1].visible == false && fs.ScenesUI.gameModeTarget.juiceTarget.target.children[2].visible == false) {
            fs.ActorAnimation.isActorMove = false;
            fs.ActorAnimation.actorState = "complete";
            fs.ActorAnimation.playActorAnimation();
            self.gameResult = "sucess";
            fs.ScenesUI.scorePanelControl();
            fs.FightControl.isAction = true;
            console.warn("****************************");
            console.warn("********恭喜您过关啦*********");
            console.warn("*你的分数为：" + fs.ScenesUI.gameScore + "分*");
            console.warn("****************************");
            return;
        }
    }

    // boss模式
    if (fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID].type == "trouble") {
        if (self.bossHP <= 0) {
            fs.ActorAnimation.isActorMove = false;
            self.gameResult = "sucess";
            fs.ScenesUI.scorePanelControl();
            fs.FightControl.isAction = true;
            fs.ActorAnimation.actorState = "fail";
            fs.ActorAnimation.playActorAnimation();
            console.warn("****************************");
            console.warn("********恭喜您过关啦*********");
            console.warn("*你的分数为：" + fs.ScenesUI.gameScore + "分*");
            console.warn("****************************");
            return;
        }
    }

    // 鱼片模式
    if (fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID].type == "popsicle") {

        if (fs.ScenesUI.gPd.find("numBg").find("UIText").text == "0") {
            fs.ActorAnimation.isActorMove = false;
            self.gameResult = "sucess";
            fs.ScenesUI.scorePanelControl();
            fs.FightControl.isAction = true;
            fs.ActorAnimation.actorState = "complete";
            fs.ActorAnimation.playActorAnimation();
            console.warn("****************************");
            console.warn("********恭喜您过关啦*********");
            console.warn("*你的分数为：" + fs.ScenesUI.gameScore + "分*");
            console.warn("****************************");
            return;
        }
    }

    // 饼干模式
    if (fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID].type == "dogfood") {

        if (fs.ScenesUI.gPd.find("numBg").find("UIText").text == "0") {
            self.gameResult = "sucess";
            fs.ScenesUI.scorePanelControl();
            fs.FightControl.isAction = true;
            fs.ActorAnimation.isActorMove = false;
            fs.ActorAnimation.actorState = "complete";
            fs.ActorAnimation.playActorAnimation();
            console.warn("****************************");
            console.warn("********恭喜您过关啦*********");
            console.warn("*你的分数为：" + fs.ScenesUI.gameScore + "分*");
            console.warn("****************************");
            return;
        }
    }

    // 步数判断
    if (fs.ScenesUI.stepCount == 0) {
        self.gameResult = "fail";
        fs.FightControl.isAction = true;

        if (fs.ScenesUI.gameMode == "trouble") {
            fs.ActorAnimation.isActorMove = false;
            fs.FightControl.isAction = true;

            fs.ActorAnimation.actorState = 'win';
            fs.ActorAnimation.playActorAnimation();

            fs.AudioManager.stopSound(0);
            fs.AudioManager.playSound(56);
            console.warn("****************************");
            console.warn("*你的步数用完了，游戏结束哦*");
            console.warn("****************************");
            return;
        } else {
            fs.ActorAnimation.isActorMove = false;
            fs.FightControl.isAction = true;

            fs.ActorAnimation.actorState ="fail";
            fs.ActorAnimation.playActorAnimation();

            fs.AudioManager.stopSound(0);
            fs.AudioManager.playSound(56);

            console.warn("****************************");
            console.warn("*你的步数用完了，游戏结束哦*");
            console.warn("****************************");
            return;
        }

    }
}

/**
 * Description: 技能基类
 * Author: nishu
 * Email: nishu@supernano.com
 */
var BaseSkill = qc.fs.BaseSkill = {};

// 筛选施放哪种技能
BaseSkill.filterSkill = function (color) {
    var self = this;

    if (self.type == 'SKILL_NOTHING') {
        self.doNothing(color)
    }else if (self.type == 'SKILL_HORIZON') {
        // 横排技能
        self.horizon(color);
    }else if (self.type == 'SKILL_VERTICAL') {
        // 竖排技能
        self.vertical(color);
    }else if (self.type == 'SKILL_XBOMB') {
        // xx炸弹技能
        self.xbomb(color);
    }else if (self.type == 'SKILL_XBOMB_SHORT') {
        // 短xx炸弹技能
        self.xbombShort(color);
    }else if (self.type == 'SKILL_JELLY') {
        // 果冻技能
        self.jelly(color);
    }else if (self.type == 'SKILL_JELLY_SHORT') {
        // 短果冻技能
        self.jellyShort(color);
    }else if (self.type == 'SKILL_RAINBOW') {
        // 彩虹技能
        self.rainbow(color);
    }else if (self.type == 'SKILL_MAGNET') {
        // 磁铁技能
        self.magnet(color);
    }else if (self.type == 'SKILL_HORIZON_VERTICAL') {
        // 横+竖
        self.horizonAndVertical(color);
    }else if (self.type == 'SKILL_HV_JELLY') {
        // 横/竖+果冻
        self.hvAndjelly(color);
    }else if (self.type == 'SKILL_HV_RAINBOW') {
        // 横/竖+彩虹
        self.hvAndRainbow(color);
    }else if (self.type == 'SKILL_HV_MAGNET') {
        // 横/竖+磁铁
        self.hvAndMagnet(color);
    }else if (self.type == 'SKILL_HV_XBOMB') {
        // 横/竖+x炸弹
        self.hvAndXBomb(color);
    }else if (self.type == 'SKILL_XBOMB_JELLY') {
        // x炸弹+果冻
        self.xBombAndJelly(color);
    }else if (self.type == 'SKILL_XBOMB_RAINBOW') {
        // x炸弹+彩虹
        self.xBombAndRainbow(color);
    }else if (self.type == 'SKILL_XBOMB_MAGNET') {
        // x炸弹+磁铁
        self.xBombAndMagnet(color);
    }else if (self.type == 'SKILL_XBOMB_XBOMB') {
        // x炸弹+x炸弹
        self.xBombAndXBomb(color);
    }else if (self.type == 'SKILL_JELLY_JELLY') {
        // 果冻+果冻
        self.jellyAndJelly(color);
    }else if (self.type == 'SKILL_JELLY_RAINBOW') {
        // 果冻+彩虹
        self.jellyAndRainbow(color);
    }else if (self.type == 'SKILL_JELLY_MAGNET') {
        // 果冻+磁铁
        self.jellyAndMagnet(color);
    }else if (self.type == 'SKILL_RAINBOW_RAINBOW') {
        // 彩虹+彩虹
        self.rainbowAndRainbow(color);
    }else if (self.type == 'SKILL_RAINBOW_MAGNET') {
        // 彩虹+磁铁
        self.rainbowAndMagnet(color);
    }else if (self.type == 'SKILL_MAGNET_MAGNET') {
        // 磁铁+磁铁
        self.magnetAndMagnet(color);
    }
}

// doNothing
BaseSkill.doNothing = function (color) {
};

// 横向技能
BaseSkill.horizon = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];
    var initIndex = pos[0] * 9;
    for (var i = 0; i < 9; i++) {
        if (initIndex == index) {
            initIndex++;
            continue;
        }
        disArray.push(initIndex);
        initIndex++;
    }

    // 播放爆炸
    fs.AudioManager.playSound(98);
    self.disappear();

    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];

        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
}

// 竖向技能
BaseSkill.vertical = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];
    var initIndex = pos[1];
    for (var i = 0; i < 8; i++) {
        if (initIndex == index) {
            initIndex += 9;
            continue;
        }
        disArray.push(initIndex);
        initIndex += 9;
    }

    // 播放爆炸
    fs.AudioManager.playSound(98);
    self.disappear();
    
    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        
        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
}

// xx炸弹技能
BaseSkill.xbomb = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];
    
    // 循环层
    var layerCount = 1;

    // 获取技能点距离边界的距离
    var range = [pos[0], 7-pos[0], pos[1], 8-pos[1]];
    var isSearch = true;
    var count = 0;

    while(isSearch) {
        // 四方查找
        [
            index - (10 * layerCount),  // 上左
            index - (8  * layerCount),  // 上右
            index + (8  * layerCount),  // 下左
            index + (10 * layerCount)   // 下右
        ].forEach(function(direction, place) {
            // 是否超出边界
            // 超出上边界
            if ((place == 0 || place == 1) && layerCount > range[0]) {
                count++;
                return;
            }
            // 超出下边界
            if ((place == 2 || place == 3) && layerCount > range[1]) {
                count++;
                return;
            }
            // 超出左边界
            if ((place == 0 || place == 2) && layerCount > range[2]) {
                count++;
                return;
            }
            // 超出右边界
            if ((place == 1 || place == 3) && layerCount > range[3]) {
                count++;
                return;
            }

            disArray.push(direction);
        });

        if (count >= 4) {
            isSearch = false;
        }else {
            count = 0;
        }

        layerCount++;
    }

    // 播放爆炸
    fs.AudioManager.playSound(100);
    self.disappear();
    
    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        
        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
}

// 短xx炸弹技能
BaseSkill.xbombShort = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];
    // 左上
    if (index > 8 && pos[1] > 0) {
        disArray.push(index - 10);
        if (index > 17 && pos[1] > 1) {
            disArray.push(index - 20);
        }
    }
    // 左下
    if (index < 63 && pos[1] > 0) {
        disArray.push(index + 8);
        if (index < 54 && pos[1] > 1) {
            disArray.push(index + 16);
        }
    }
    // 右上
    if (index > 8 && pos[1] < 8) {
        disArray.push(index - 8);
        if (index > 17 && pos[1] < 7) {
            disArray.push(index - 16);
        }
    }
    // 右下
    if (index < 63 && pos[1] < 8) {
        disArray.push(index + 10);
        if (index < 54 && pos[1] < 7) {
            disArray.push(index + 20);
        }
    }

    // 播放爆炸
    fs.AudioManager.playSound(100);
    self.disappear();
    
    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        
        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
}

// 果冻技能
// 5格的菱形
BaseSkill.jelly = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    fs.AudioManager.playSound(88);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];
    // 上
    if (index > 8) {
        disArray.push(index - 9);
        if (index > 17) {
            disArray.push(index - 18);
        }
        if (pos[1] > 0) {
            disArray.push(index - 9 - 1);
        }
        if (pos[1] < 8) {
            disArray.push(index - 9 + 1);
        }
    }
    // 下
    if (index < 63) {
        disArray.push(index + 9);
        if (index < 54) {
            disArray.push(index + 18);
        }
        if (pos[1] > 0) {
            disArray.push(index + 9 - 1);
        }
        if (pos[1] < 8) {
            disArray.push(index + 9 + 1);
        }
    }
    // 左
    if (pos[1] > 0) {
        disArray.push(index - 1);
        if (pos[1] > 1) {
            disArray.push(index - 2);
        }
    }
    // 右
    if (pos[1] < 8) {
        disArray.push(index + 1);
        if (pos[1] < 7) {
            disArray.push(index + 2);
        }
    }

    // 播放爆炸
    self.disappear();
    
    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        
        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
}

// 短果冻技能
// 3格
BaseSkill.jellyShort = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    fs.AudioManager.playSound(88);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];
    // 上
    if (index > 8) {
        disArray.push(index - 9);
    }
    // 下
    if (index < 63) {
        disArray.push(index + 9);
    }
    // 左
    if (pos[1] > 0) {
        disArray.push(index - 1);
    }
    // 右
    if (pos[1] < 8) {
        disArray.push(index + 1);
    }

    // 播放爆炸
    self.disappear();
    
    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        
        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
}

// 彩虹技能
BaseSkill.rainbow = function (color, disArray, isSuper) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    var isSkillSwap = disArray;
    
    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取同色受技能影响的位置
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;

    if (disArray == undefined) {
        var disArray = [];
        for (var i = 0; i < len; i++) {
            var _tile = fs.LayerManager.tilesList.element[i];

            if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color == color && fs.BaseLayer.hasCanRemoveGeneralTile(i)) {
                disArray.push(i);
            }
        }
    }

    disArray.forEach(function (item) {
        var tile = fs.LayerManager.tilesList.element[item];
        tile.setDelFlag(true);
        tile.scoreMultiple = 2;
    })
    
    // 循环播放特效
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
   
        tile.baofa.visible = true;
        tile.baofa.playAnimation('baofa');
    }

    fs.Game.timer.add(700, function() {
        if (isSkillSwap == undefined || isSuper) {
            fs.AudioManager.playSound(4);

            for (var i in disArray) {
                var place = disArray[i];
                // 执行层事件
                fs.LayerManager.layerPropagation(place, color, 'action_skill');
            }

            fs.Game.timer.add(500, function() {
                fs.GameManager.start();
            });
        }else {
            fs.AudioManager.playSound(5);

            for (var i in disArray) {
                var place = disArray[i];
                var tile = fs.LayerManager.tilesList.element[place];
                
                fs.DisFactory.autoDoSkillArray.push(tile);

                tile.setDelFlag(false);
            }
            
            fs.GameManager.start();
        }
    });
}

// 磁铁技能
BaseSkill.magnet = function (color, disArray, isSuper) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    var isSkillSwap = disArray;
    
    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取同色受技能影响的位置
    var tileLen = fs.ConfigManager.row * fs.ConfigManager.colunm;

    if (disArray == undefined) {
        var disArray = [];
        for (var i = 0; i < tileLen; i++) {
            var _tile = fs.LayerManager.tilesList.element[i];
            if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color == color) {
                disArray.push(i);
            }
        }
    }

    disArray.forEach(function (item) {
        var tile = fs.LayerManager.tilesList.element[item];
        tile.setDelFlag(true);
        tile.scoreMultiple = 2;
    })

    // 判断位置是否能放置
    var isCanPlace = function (item) {
        var _tile = fs.LayerManager.tilesList.element[item];

        if (_tile != null && fs.BaseLayer.hasCanRemoveGeneralTile(item) && (_tile.class1 == 'base' || (_tile.class1 =='skill' && _tile.class2 =='normal') || (_tile.class1 =='skill' && _tile.class2 =='special'))) {
            return true;
        }else {
            return false;
        }
    };
    
    // 获取磁铁周边放置位置
    var targetArray = fs.BaseLayer.getRoundPosArray(index, disArray.length, isCanPlace);
    
    var removeArray = [];
    // 将放置位置的方块标记为删除状态防止layerPropagation时被删除
    targetArray.forEach(function (item) {
        var tile = fs.LayerManager.tilesList.element[item];
        if (tile != null && !tile.delFlag) {
            tile.setDelFlag(true);
            removeArray.push(item);
        }
    })

    // 循环消除磁铁周围元素，为同色吸过来的元素留位置
    for (var i in removeArray) {
        var place = removeArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        
        // 执行层事件
        fs.LayerManager.layerPropagation(place, color, 'action_skill');
    }

    var len = disArray.length,
        _tempEleList = [];

    // 元素移动后回调
    var actionBack = function () {
        if (--len <= 0) {
            // 全部元素移动完成后，交换数据
            for (var i in targetArray) {
                var place = targetArray[i];
                fs.LayerManager.tilesList.element[place] = _tempEleList[i];
            }

            fs.Game.timer.add(200, function() {
                // 循环消除受影响位置
                for (var i in targetArray) {
                    var place = targetArray[i];
                    // 执行层事件
                    fs.LayerManager.layerPropagation(place, color, 'action_skill');
                }

                // 将原位置数据删除
                for (var i in disArray) {
                    var place = disArray[i];
                    fs.LayerManager.tilesList.element[place] = null;
                }

                // 延迟开启主逻辑
                if (isSkillSwap == undefined || isSuper) {
                    fs.Game.timer.add(500, function() {
                        fs.GameManager.start();
                    });
                }else {
                    fs.GameManager.start();
                }
            });
        }
    };
    
    // 将同色元素吸过来
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        var len = targetArray.length;

        var targetIndex = targetArray[i];
        tile.move(targetIndex, actionBack, 0.35);

        _tempEleList.push(tile);

        // 移除掉上层的网兜
        var ceil = fs.LayerManager.tilesList.aboveElement[place];
        if (ceil != null && !ceil.delFlag) {
            ceil.removeTile();
        }

        // 播放爆发特效
        tile.baofa.visible = true;
        tile.baofa.playAnimation('baofa');
    }

    // 被技能触发又没有同色元素的情况
    if (len == 0) {
         // 延迟开启主逻辑
        fs.Game.timer.add(700, function() {
            fs.GameManager.start();
        });
    }
}

// 横+竖
BaseSkill.horizonAndVertical = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];

    // 横向
    var initIndex = pos[0] * 9;
    for (var i = 0; i < 9; i++) {
        if (initIndex == index) {
            initIndex++;
            continue;
        }
        disArray.push(initIndex);
        initIndex++;
    }

    // 竖向
    var initIndex = pos[1];
    for (var i = 0; i < 8; i++) {
        if (initIndex == index) {
            initIndex += 9;
            continue;
        }
        disArray.push(initIndex);
        initIndex += 9;
    }

    // 设置技能爆炸动画
    fs.AudioManager.playSound(96);
    self.playExplode = "shizi99";
    self.disappear();

    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];

        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
};

// 横/竖+果冻
// 三横三竖
BaseSkill.hvAndjelly = function (color) {
    fs.BaseSkill.threeHVSkill.call(this, color);
};

// 横/竖+彩虹技能
// 同色元素随机变成横竖，一个一个引爆
BaseSkill.hvAndRainbow = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);
    var randomArray = {
        1: [1007,1013],
        2: [1008,1014],
        3: [1009,1015],
        4: [1010,1016],
        5: [1011,1017],
        6: [1012,1018]
    };

    // 获取同色受技能影响的位置
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var disArray = [];
    for (var i = 0; i < len; i++) {
        var _tile = fs.LayerManager.tilesList.element[i];

        if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color == color && fs.BaseLayer.hasCanRemoveGeneralTile(i)) {
            disArray.push(i);
        }
    }

    // 循环改变元素
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];

        if (tile.class1 == 'base') {
            var _m = fs.Game.math.random(0, randomArray[color].length - 1);
            var prope = {
                "tileID": randomArray[color][_m]
            };

            // 回收目标
            fs.TilePool.recoverTile(tile);
            tile = null;

            var _st = fs.TileFactory.buildTile(place, prope, 'element');
            var _tile = fs.LayerManager.tilesList.element[place] = _st;

            // 播放生成特效
            _tile.playMakeSkill();
        }
    }

    fs.BaseSkill.rainbow.call(this, color, disArray);
};

// 横/竖+磁铁
// 同色元素随机变成横竖，吸过来一个个引爆
BaseSkill.hvAndMagnet = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);
    var randomArray = {
        1: [1007,1013],
        2: [1008,1014],
        3: [1009,1015],
        4: [1010,1016],
        5: [1011,1017],
        6: [1012,1018]
    };

    // 获取同色受技能影响的位置
    var tileLen = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var disArray = [];
    for (var i = 0; i < tileLen; i++) {
        var _tile = fs.LayerManager.tilesList.element[i];
        if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color == color) {
            disArray.push(i);
        }
    }

    // 循环改变元素
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];

        if (tile.class1 == 'base') {
            var _m = fs.Game.math.random(0, randomArray[color].length - 1);
            var prope = {
                "tileID": randomArray[color][_m]
            };

            // 回收目标
            fs.TilePool.recoverTile(tile);
            tile = null;

            var _st = fs.TileFactory.buildTile(place, prope, 'element');
            var _tile = fs.LayerManager.tilesList.element[place] = _st;
            
            // 播放生成特效
            _tile.playMakeSkill();
        }
    }

    fs.BaseSkill.magnet.call(this, color, disArray);
};

// 横/竖+x炸弹
// 米字引爆
BaseSkill.hvAndXBomb = function (color) {
    fs.BaseSkill.miSkill.call(this, color);
};

// x炸弹+果冻
// 三横三竖
BaseSkill.xBombAndJelly = function (color) {
    fs.BaseSkill.threeHVSkill.call(this, color);
};

// x炸弹+彩虹
// 同色元素变成短x炸弹，一个一个引爆
BaseSkill.xBombAndRainbow = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 获取同色受技能影响的位置
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var disArray = [];
    for (var i = 0; i < len; i++) {
        var _tile = fs.LayerManager.tilesList.element[i];

        if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color == color && fs.BaseLayer.hasCanRemoveGeneralTile(i)) {
            disArray.push(i);
        }
    }

    // 循环改变元素
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];

        var prope = {
            "tileID": 1034
        };

        // 回收目标
        fs.TilePool.recoverTile(tile);
        tile = null;

        var _st = fs.TileFactory.buildTile(place, prope, 'element');
        var _tile = fs.LayerManager.tilesList.element[place] = _st;
        
        // 播放生成特效
        _tile.playMakeSkill();
    }

    fs.BaseSkill.rainbow.call(this, color, disArray);
};

// x炸弹+磁铁
// 同色元素变成短x炸弹，吸过来一个一个引爆
BaseSkill.xBombAndMagnet = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 获取同色受技能影响的位置
    var tileLen = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var disArray = [];
    for (var i = 0; i < tileLen; i++) {
        var _tile = fs.LayerManager.tilesList.element[i];
        if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color == color) {
            disArray.push(i);
        }
    }

    // 循环改变元素
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        
        var prope = {
            "tileID": 1034
        };

        // 回收目标
        fs.TilePool.recoverTile(tile);
        tile = null;

        var _st = fs.TileFactory.buildTile(place, prope, 'element');
        var _tile = fs.LayerManager.tilesList.element[place] = _st;
        
        // 播放生成特效
        _tile.playMakeSkill();
    }

    fs.BaseSkill.magnet.call(this, color, disArray);
};

// x炸弹+x炸弹
// 米字引爆
BaseSkill.xBombAndXBomb = function (color) {
    fs.BaseSkill.miSkill.call(this, color);
};

// 果冻+果冻
// 大果冻 上下3格
BaseSkill.jellyAndJelly = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    fs.AudioManager.playSound(87);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];
    
    // 循环层
    var layerCount = 1;

    // 获取技能点距离边界的距离
    var range = [pos[0], 7-pos[0], pos[1], 8-pos[1]];

    var isSearch = true;

    while(isSearch) {
        // 八方查找
        [
            index - 9 * layerCount,  // 上
            index + 9 * layerCount,  // 下
            index - 1 * layerCount,  // 左
            index + 1 * layerCount,  // 右
            index - (9 * layerCount) - 1,  // 上左
            index - (9 * layerCount) + 1,  // 上右
            index + (9 * layerCount) - 1,  // 下左
            index + (9 * layerCount) + 1   // 下右
        ].forEach(function(direction, place) {
            // 是否超出边界
            // 超出上边界
            if ((place == 0 || place == 4 || place == 5) && layerCount > range[0]) {
                return;
            }
            // 超出下边界
            if ((place == 1 || place == 6 || place == 7) && layerCount > range[1]) {
                return;
            }
            // 超出左边界
            if (place == 2 && layerCount > range[2]) {
                return;
            }
            // 超出右边界
            if (place == 3 && layerCount > range[3]) {
                return;
            }

            if ((place == 4 || place == 6) && range[2] < 1) {
                return;
            }

            if ((place == 5 || place == 7) && range[3] < 1) {
                return;
            }

            if (layerCount == 3 && place == 4) {
                direction = index - 10 - 1;
            }
            if (layerCount == 3 && place == 5) {
                direction = index - 8 + 1;
            }
            if (layerCount == 3 && place == 6) {
                direction = index + 8 - 1;
            }
            if (layerCount == 3 && place == 7) {
                direction = index + 10 + 1;
            }

            disArray.push(direction);
        });

        if (layerCount == 3) {
            isSearch = false;
        }
        layerCount++;
    }

    // 设置技能爆炸动画
    self.playExplode = "area3";
    self.disappear();
    
    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        
        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
};

// 果冻+彩虹
// 同色元素变成短果冻，一个一个引爆
BaseSkill.jellyAndRainbow = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 获取同色受技能影响的位置
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var disArray = [];
    for (var i = 0; i < len; i++) {
        var _tile = fs.LayerManager.tilesList.element[i];

        if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color == color && fs.BaseLayer.hasCanRemoveGeneralTile(i)) {
            disArray.push(i);
        }
    }

    // 循环改变元素
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];

        var prope = {
            "tileID": 1035
        };

        // 回收目标
        fs.TilePool.recoverTile(tile);
        tile = null;

        var _st = fs.TileFactory.buildTile(place, prope, 'element');
        var _tile = fs.LayerManager.tilesList.element[place] = _st;
        
        // 播放生成特效
        _tile.playMakeSkill();
    }

    fs.BaseSkill.rainbow.call(this, color, disArray);
};

// 果冻+磁铁
// 同色元素变成短果冻，吸过来一个一个引爆
BaseSkill.jellyAndMagnet = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 获取同色受技能影响的位置
    var tileLen = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var disArray = [];
    for (var i = 0; i < tileLen; i++) {
        var _tile = fs.LayerManager.tilesList.element[i];
        
        if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color == color) {
            disArray.push(i);
        }
    }

    // 循环改变元素
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];

        var prope = {
            "tileID": 1035
        };

        // 回收目标
        fs.TilePool.recoverTile(tile);
        tile = null;

        var _st = fs.TileFactory.buildTile(place, prope, 'element');
        var _tile = fs.LayerManager.tilesList.element[place] = _st;
        
        // 播放生成特效
        _tile.playMakeSkill();
    }

    fs.BaseSkill.magnet.call(this, color, disArray);
};

// 彩虹+彩虹
// 除了超级技能，全屏引爆
BaseSkill.rainbowAndRainbow = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 获取同色受技能影响的位置
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var disArray = [];
    for (var i = 0; i < len; i++) {
        var _tile = fs.LayerManager.tilesList.element[i];

        if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.class2 != 'super') {
            disArray.push(i);
        }
    }

    fs.BaseSkill.rainbow.call(this, color, disArray, true);
};

// 彩虹+磁铁
// 除了超级技能，全屏基础元素吸过来，一个一个引爆
BaseSkill.rainbowAndMagnet = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 获取同色受技能影响的位置
    var tileLen = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var disArray = [];
    for (var j = 1; j < 7; j++) {
        for (var i = 0; i < tileLen; i++) {
            var _tile = fs.LayerManager.tilesList.element[i];
            if (_tile.color == j) {
                if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color <= 6 && _tile.color != null && _tile.class2 != 'super') {
                    disArray.push(i);
                }
            }
        }
    }
    
    fs.BaseSkill.magnet.call(this, color, disArray, true);
};

// 磁铁+磁铁
// 除了超级技能，全屏基础元素吸过来，一个一个引爆
BaseSkill.magnetAndMagnet = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 获取同色受技能影响的位置
    var tileLen = fs.ConfigManager.row * fs.ConfigManager.colunm;
    var disArray = [];
    for (var j = 1; j < 7; j++) {
        for (var i = 0; i < tileLen; i++) {
            var _tile = fs.LayerManager.tilesList.element[i];
            if (_tile.color == j) {
                if (_tile != null && _tile.hasOwnProperty("delFlag") && !_tile.delFlag && _tile.color <= 6 && _tile.color != null && _tile.class2 != 'super') {
                    disArray.push(i);
                }
            }
        }
    }
    
    fs.BaseSkill.magnet.call(this, color, disArray, true);
};

// 三横三竖引爆
BaseSkill.threeHVSkill = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];

    // 三横向
    var initIndex = pos[0] * 9;
    for (var i = 0; i < 9; i++) {
        if (initIndex == index) {
            initIndex++;
            continue;
        }
        disArray.push(initIndex);
        disArray.push(initIndex + 9);
        disArray.push(initIndex - 9);
        initIndex++;
    }

    // 三竖向
    var initIndex = pos[1];
    for (var i = 0; i < 8; i++) {
        if (initIndex == index) {
            initIndex += 9;
            continue;
        }
        disArray.push(initIndex);
        disArray.push(initIndex - 1);
        disArray.push(initIndex + 1);
        initIndex += 9;
    }

    // 设置技能爆炸动画
    fs.AudioManager.playSound(92);
    self.explode.texture = self.game.assets.find('line');
    self.playExplode = "shizi100";
    self.disappear();

    // 去掉重复位置
    disArray = fs.CommonLayer.removeDuplicateArray(disArray);

    

    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];

        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
};

// 米字引爆
BaseSkill.miSkill = function (color) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var pos = fs.CommonLayer.getRowColunm(index);

    // 消除过程中，关掉主逻辑
    fs.GameManager.stop();

    // 获取受技能影响的位置
    var disArray = [];
    
    // 循环层
    var layerCount = 1;

    // 获取技能点距离边界的距离
    var range = [pos[0], 7-pos[0], pos[1], 8-pos[1]];
    var isSearch = true;
    var count = 0;

    while(isSearch) {
        // 八方查找
        [   
            index - 9 * layerCount,  // 上
            index + 9 * layerCount,  // 下
            index - 1 * layerCount,  // 左
            index + 1 * layerCount,  // 右
            index - (10 * layerCount),  // 上左
            index - (8  * layerCount),  // 上右
            index + (8  * layerCount),  // 下左
            index + (10 * layerCount)   // 下右
        ].forEach(function(direction, place) {
            // 是否超出边界
            // 超出上边界
            if ((place == 0 || place == 4 || place == 5) && layerCount > range[0]) {
                count++;
                return;
            }
            // 超出下边界
            if ((place == 1 || place == 6 || place == 7) && layerCount > range[1]) {
                count++;
                return;
            }
            // 超出左边界
            if ((place == 2 || place == 4 || place == 6) && layerCount > range[2]) {
                count++;
                return;
            }
            // 超出右边界
            if ((place == 3 || place == 5 || place == 7) && layerCount > range[3]) {
                count++;
                return;
            }

            disArray.push(direction);
        });

        if (count >= 8) {
            isSearch = false;
        }else {
            count = 0;
        }
        layerCount++;
    }

    // 设置技能爆炸动画
    fs.AudioManager.playSound(97);
    self.playExplode = "mi99";
    self.disappear();
    
    // 循环消除受影响位置
    for (var i in disArray) {
        var place = disArray[i];
        var tile = fs.LayerManager.tilesList.element[place];
        
        if (tile != null && tile.hasOwnProperty("delFlag") && !tile.delFlag) {
            tile.setDelFlag(true);
            // 执行层事件
            fs.LayerManager.layerPropagation(place, color, 'action_skill');
        }
    }

    // 延迟开启主逻辑
    fs.Game.timer.add(500, function() {
        fs.GameManager.start();
    });
};
/**
 * Description: Tile预制基类
 * Author: nishu
 * Email: nishu@supernano.com
 */

var BaseTile = qc.defineBehaviour('qc.engine.BaseTile', qc.Behaviour, function () {
    var self = this;

    // 标记是否删除
    self.delFlag = false;

    // 是否正在移动
    self.moveFlag = false;

    // 是否为新添加的方块
    self.newFlag = false;

    // 连消个数
    self.disCount = 1;

    self.scoreMultiple = 1;
}, {
        // 载入icon节点
        icon: qc.Serializer.NODE,
        // 载入icon_ani节点
        icon_ani: qc.Serializer.NODE,
        // 载入explode节点
        explode: qc.Serializer.NODE,
        // 载入技能合成节点
        make_skill: qc.Serializer.NODE,
        // 载入爆发
        baofa: qc.Serializer.NODE
    });

// 继承
BaseTile.prototype.extend = function (Parent) {
    var self = this;

    for (var item in Parent) {
        self[item] = Parent[item];
        if (item == 'setType') {
            self.setType();
        }
        if (item == 'init') {
            self.init();
        }
    }
};

// 设置Tile数据
BaseTile.prototype.setData = function (index, properties, isNew) {
    var self = this;
    var tileID = parseInt(properties.tileID);
    var tileObj = fs.ConfigManager.excelData.tiles[tileID]; //excel表中的数据

    // 设置tile各属性到游戏对象
    // 设置格子中的元素生命值
    if (properties.hasOwnProperty("hp")) {
        self.hp = parseInt(properties.hp);
    }

    for (var item in tileObj) {

        if (item == 'foreground') {
            if (tileObj[item] == null) {
                self.icon.alpha = 0;
            } else if (tileObj[item].indexOf('%d') != -1) {
                // 修正含%d的图片命名
                var _name = tileObj[item].split("%d");
                self.icon.frame = _name[0] + self.hp + _name[1];
            } else {
                self.icon.frame = tileObj[item];
            }
        }

        // 根据获取的height核width的值来进行图片的缩放
        if (item == "height") {
            if (tileObj[item] == 2) {
                self.icon.height = 2 * self.icon.height;
                self.icon.y = -40;
            }
            if (tileObj[item] == 3) {
                self.icon.height = 3 * self.icon.height;
                self.icon.y = -80;
            }
            if (tileObj[item] == 5) {
                self.icon.height = 5 * self.icon.height;
                self.icon.y = -160;
            }
            if (tileObj[item] == 4) {
                self.icon.height = 4 * self.icon.height;
                self.icon.y = -120;
            }
        }
        if (item == "width") {
            if (tileObj[item] == 2) {
                self.icon.width = 2 * self.icon.width;
                self.icon.x = 40;
            }
            if (tileObj[item] == 3) {
                self.icon.width = 3 * self.icon.width;
                self.icon.x = 80;
            }
            if (tileObj[item] == 4) {
                self.icon.width = 4 * self.icon.width;
                self.icon.x = 120;
            }
        }
        self[item] = tileObj[item];
    }

    // 设置元素x, y轴
    if (isNew) {
        // 新加元素往上移一格
        self.gameObject.x = fs.CommonLayer.pivotX(index);
        self.gameObject.y = fs.CommonLayer.pivotY(index) - fs.ConfigManager.gridH;

        // 标记为新添加
        self.newFlag = true;
    } else {
        self.gameObject.x = fs.CommonLayer.pivotX(index);
        self.gameObject.y = fs.CommonLayer.pivotY(index);
    }

    // 设置icon图标
    self.icon.frame = tileObj.foreground;

    // 虫洞icon位置单独设置
    if (tileID == 2601) {
        self.icon.resetNativeSize();
        self.icon.y += 55;
    }
    if (tileID == 2602) {
        self.icon.resetNativeSize();
        self.icon.y -= 55;
    }

    /**
     * 设置icon特效
     */

    // 设置icon特效路径
    if (tileID == 2601) {
        // 虫洞入口
        self.icon_ani.visible = true;
        self.icon_ani.y += 55;
        self.icon_ani.texture = fs.ConfigManager.spriteData["port_up"];

        // 虫洞特效自动播放
        self.icon_ani.playAnimation("port_up");

    } else if (tileID == 2602) {
        // 虫洞出口
        self.icon_ani.visible = true;
        self.icon_ani.y -= 55;
        self.icon_ani.texture = fs.ConfigManager.spriteData["port_down"];

        // 虫洞特效自动播放
        self.icon_ani.playAnimation("port_down");
        
    } else if (tileID == 1201) {
        // 奶牛
        self.icon.visible = false;
        self.icon_ani.visible = true;
        self.icon_ani.texture = fs.ConfigManager.spriteData["cow"];
        self.icon_ani.defaultAnimation = "animation2"
    } else if (tileID == 1101) {
        // 蜜蜂
        self.icon_ani.texture = fs.ConfigManager.spriteData["bee"];
    } else {
        // 其他元素加通用粒子特效
        self.icon_ani.texture = fs.ConfigManager.spriteData["particle"];
    }

    /**
     * 设置爆炸特效
     */

    // 设置爆炸特效路径
    if (tileObj.spine) {
        self.explode.texture = fs.ConfigManager.spriteData[tileObj.spine];

        // 普通+彩虹或磁铁
        if (tileID == 2401) {
            // 网兜
            self.playExplode = "wangdou";
        } else {
            // 普通元素
            self.playExplode = tileObj.spine;
        }
    } else if ((tileID >= 1007 && tileID <= 1024) || tileID == 1034) {
        // Line技能
        self.explode.texture = fs.ConfigManager.spriteData["skill"];

        // 横技能
        if (tileID >= 1007 && tileID <= 1012) {
            self.playExplode = "heng";
        }
        // 竖技能
        if (tileID >= 1013 && tileID <= 1018) {
            self.playExplode = "shu";
        }
        // xx技能
        if (tileID >= 1019 && tileID <= 1024) {
            self.playExplode = "xx99";
        }
        // 短xx炸弹技能
        if (tileID == 1034) {
            self.playExplode = "xx2";
        }
    } else if ((tileID >= 1025 && tileID <= 1030) || tileID == 1035) {
        // 果冻
        self.explode.texture = fs.ConfigManager.spriteData["jelly"];

        // 果冻技能
        if (tileID >= 1025 && tileID <= 1030) {
            self.playExplode = "area2";
        }
        // 短果冻炸弹技能
        if (tileID == 1035) {
            self.playExplode = "area1";
        }
    }
};

// 移动元素
BaseTile.prototype.move = function (targetIndex, callback, duration) {
    var self = this;
    var gridNode = self.gameObject;
    var dt = duration || 0.08;

    // 获取当前方格中水果TweenPosition逻辑脚本对象
    var tp = gridNode.getScript('qc.TweenPosition');

    tp.from = new qc.Point(gridNode.x, gridNode.y);
    tp.to = new qc.Point(fs.CommonLayer.pivotX(targetIndex), fs.CommonLayer.pivotY(targetIndex));

    // 动作持续时间
    tp.duration = dt;

    // 添加TweenPosition完成后事件，触发后自动被移除
    tp.onFinished.addOnce(function () {
        if (typeof callback == 'function') {
            // 延迟100毫秒执行回调，防止进程冲突
            self.game.timer.add(100, callback);
        };
    });

    tp.resetToBeginning();
    tp.playForward();
};

// 移动合成技能
BaseTile.prototype.moveSkill = function (targetIndex, callback) {
    var self = this;
    var gridNode = self.gameObject;

    // 克隆icon到element层尾部
    var icon = self.game.add.clone(self.icon, fs.LayerManager.node.element);
    icon.x = gridNode.x;
    icon.y = gridNode.y;

    // 隐藏自身icon
    self.icon.visible = false;

    // 获取当前方格中水果TweenPosition逻辑脚本对象
    var tp = icon.getScript('qc.TweenPosition');

    tp.from = new qc.Point(icon.x, icon.y);
    tp.to = new qc.Point(fs.CommonLayer.pivotX(targetIndex), fs.CommonLayer.pivotY(targetIndex));

    // 动作持续时间
    tp.duration = 0.15;

    // 添加TweenPosition完成后事件
    tp.onFinished.addOnce(function () {
        // 动画完成后销毁克隆的icon对象
        icon.destroy();

        if (typeof callback == 'function') {
            callback();
        };
    });

    tp.resetToBeginning();
    tp.playForward();
};

// 掉落
BaseTile.prototype.dropMove = function (path, dropCount, dt, callback) {
    var self = this,
        len = path.length
    isPortal = false;

    var gridNode = self.gameObject;
    var tp = gridNode.getScript('qc.TweenPosition');

    // 获取目标位置
    var targetIndex = path[dropCount];

    // 判断目标位置是否为虫洞出口
    fs.LayerManager.wormholeData.forEach(function (item) {
        if (item.index == targetIndex && !item.hasOwnProperty("transferPosition")) {
            isPortal = true;
        }
    }, this);

    // 移动每一格所花时间
    tp.duration = dt;

    if (isPortal) {
        // 虫洞掉落
        tp.from = new qc.Point(gridNode.x, gridNode.y);
        tp.to = new qc.Point(gridNode.x, gridNode.y + fs.ConfigManager.gridH);

        tp.onFinished.addOnce(function () {
            // 将位置设置到虫洞出口
            gridNode.x = fs.CommonLayer.pivotX(targetIndex);
            gridNode.y = fs.CommonLayer.pivotY(targetIndex) - fs.ConfigManager.gridH;

            // 移动方块
            tp.from = new qc.Point(gridNode.x, gridNode.y);
            tp.to = new qc.Point(fs.CommonLayer.pivotX(targetIndex), fs.CommonLayer.pivotY(targetIndex));

            tp.onFinished.addOnce(function () {
                dropCount++;
                // 是否到达目的地
                if (dropCount < len) {
                    // 递归移动自身
                    self.game.timer.add(1, function () { self.dropMove(path, dropCount, dt, callback) });
                } else {
                    // 到达目的地后执行回调
                    if (typeof callback == 'function') callback();
                }
            });
            tp.resetToBeginning();
            tp.playForward();
        });

        tp.resetToBeginning();
        tp.playForward();

    } else {
        // 正常掉落
        tp.from = new qc.Point(gridNode.x, gridNode.y);
        tp.to = new qc.Point(fs.CommonLayer.pivotX(targetIndex), fs.CommonLayer.pivotY(targetIndex));

        tp.onFinished.addOnce(function () {
            dropCount++;
            // 是否到达目的地
            if (dropCount < len) {
                // 递归移动自身
                self.game.timer.add(1, function () { self.dropMove(path, dropCount, dt, callback) });
            } else {
                // 到达目的地后执行回调
                if (typeof callback == 'function') callback();
            }
        });
        tp.resetToBeginning();
        tp.playForward();
    }
};

// 播放爆炸特效
BaseTile.prototype.disappear = function (callback) {
    var self = this;

    // 隐藏icon
    self.icon.visible = false;

    self.explode.visible = true;

    // 动画执行完成后回调
    self.explode.onFinished.addOnce(function () {
        // 销毁节点
        self.gameObject.destroy();

        if (typeof callback == 'function') callback();
    });

    self.explode.playAnimation(self.playExplode);
};

// 设置删除状态
BaseTile.prototype.setDelFlag = function (flag) {
    var self = this;
    self.delFlag = flag;
};

// 设置移动状态
BaseTile.prototype.setMoveFlag = function (flag) {
    var self = this;
    self.moveFlag = flag;
};

// 设置新增状态
BaseTile.prototype.setNewFlag = function (flag) {
    var self = this;
    self.newFlag = flag;
};

// 不能交换提示
BaseTile.prototype.cantSwap = function (direction, callback) {
    var self = this;
    var gridNode = self.gameObject;

    //  关闭消除提示
    var ts = gridNode.getScript('qc.TweenScale');
    var tp = gridNode.getScript('qc.TweenPosition');

    var dist = 25;

    if (direction == 'left') {
        ts.from = new qc.Point(1, 1);
        ts.to = new qc.Point(0.7, 1.3);

        tp.from = new qc.Point(gridNode.x, gridNode.y);
        tp.to = new qc.Point(gridNode.x - dist, gridNode.y);

    } else if (direction == 'right') {
        ts.from = new qc.Point(1, 1);
        ts.to = new qc.Point(0.7, 1.3);

        tp.from = new qc.Point(gridNode.x, gridNode.y);
        tp.to = new qc.Point(gridNode.x + dist, gridNode.y);

    } else if (direction == 'top') {
        ts.from = new qc.Point(1, 1);
        ts.to = new qc.Point(1.3, 0.7);

        tp.from = new qc.Point(gridNode.x, gridNode.y);
        tp.to = new qc.Point(gridNode.x, gridNode.y - dist);

    } else if (direction == 'bottom') {
        ts.from = new qc.Point(1, 1);
        ts.to = new qc.Point(1.3, 0.7);

        tp.from = new qc.Point(gridNode.x, gridNode.y);
        tp.to = new qc.Point(gridNode.x, gridNode.y + dist);
    }

    ts.duration = 0.15;
    tp.duration = 0.15;

    ts.onFinished.addOnce(function () {
        var ts_newfrom = ts.to;
        var ts_newto = ts.from;
        ts.from = ts_newfrom;
        ts.to = ts_newto;
        ts.resetToBeginning();
        ts.playForward();

        // 反向播放后执行回调
        ts.onFinished.addOnce(function () {
            if (typeof callback == 'function') callback();
        });
    });

    tp.onFinished.addOnce(function () {
        var tp_newfrom = tp.to;
        var tp_newto = tp.from;
        tp.from = tp_newfrom;
        tp.to = tp_newto;
        tp.resetToBeginning();
        tp.playForward();
    });

    ts.resetToBeginning();
    ts.playForward();

    tp.resetToBeginning();
    tp.playForward();
};

// 播放技能生成动画
BaseTile.prototype.playMakeSkill = function () {
    var self = this;

    self.make_skill.visible = true;

    // 动画执行完成后回调
    self.make_skill.onFinished.addOnce(function () {
        self.make_skill.visible = false;
    });

    self.make_skill.playAnimation('skill_normal');
};

// 交换提示
BaseTile.prototype.noticeSwap = function (direction, callback) {
    var self = this;
    var gridNode = self.gameObject;

    // 初始化gridNode位置
    var _index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);
    var _x = fs.CommonLayer.pivotX(_index);
    var _y = fs.CommonLayer.pivotY(_index);

    var ts = gridNode.getScript('qc.TweenScale');
    var tp = gridNode.getScript('qc.TweenPosition');

    self.game.input.mouse.enable = false;
    self.game.input.touch.enable = false;

    var dist = 20;

    if (fs.GameManager.FSM.state == "waitUser") {
        if (direction == 'left') {
            ts.from = new qc.Point(1, 1);
            ts.to = new qc.Point(0.8, 1.2);

            tp.from = new qc.Point(_x, _y);
            tp.to = new qc.Point(_x - dist, _y);

        } else if (direction == 'right') {
            ts.from = new qc.Point(1, 1);
            ts.to = new qc.Point(0.8, 1.2);

            tp.from = new qc.Point(_x, _y);
            tp.to = new qc.Point(_x + dist, _y);

        } else if (direction == 'top') {
            ts.from = new qc.Point(1, 1);
            ts.to = new qc.Point(1.2, 0.8);

            tp.from = new qc.Point(_x, _y);
            tp.to = new qc.Point(_x, _y - dist);

        } else if (direction == 'bottom') {
            ts.from = new qc.Point(1, 1);
            ts.to = new qc.Point(1.2, 0.8);

            tp.from = new qc.Point(_x, _y);
            tp.to = new qc.Point(_x, _y + dist);
        }

        ts.duration = 0.17;
        tp.duration = 0.17;

        ts.onFinished.addOnce(function () {
            var ts_newfrom = ts.to;
            var ts_newto = ts.from;
            ts.from = ts_newfrom;
            ts.to = ts_newto;
            ts.resetToBeginning();
            ts.playForward();

            ts.onFinished.addOnce(function () {
                var ts_newfrom = ts.to;
                var ts_newto = ts.from;
                ts.from = ts_newfrom;
                ts.to = ts_newto;
                ts.resetToBeginning();
                ts.playForward();

                ts.onFinished.addOnce(function () {
                    var ts_newfrom = ts.to;
                    var ts_newto = ts.from;
                    ts.from = ts_newfrom;
                    ts.to = ts_newto;
                    ts.resetToBeginning();
                    ts.playForward();

                });

            });

        });

        tp.onFinished.addOnce(function () {
            var tp_newfrom = tp.to;
            var tp_newto = tp.from;
            tp.from = tp_newfrom;
            tp.to = tp_newto;
            tp.resetToBeginning();
            tp.playForward();

            tp.onFinished.addOnce(function () {
                var tp_newfrom = tp.to;
                var tp_newto = tp.from;
                tp.from = tp_newfrom;
                tp.to = tp_newto;

                tp.resetToBeginning();
                tp.playForward();

                tp.onFinished.addOnce(function () {
                    var tp_newfrom = tp.to;
                    var tp_newto = tp.from;
                    tp.from = tp_newfrom;
                    tp.to = tp_newto;

                    tp.resetToBeginning();
                    tp.playForward();

                    if (typeof callback == 'function') callback();
                });


            });

        });

        ts.resetToBeginning();
        ts.playForward();

        tp.resetToBeginning();
        tp.playForward();

    }
};

// 根据方向得到能否可交换或下落
// 只有该元素具有可交换属性，并且当前状态能允许被交换，才返回true
// direction: 方向
BaseTile.prototype.canSwapByDirection = function (direction) {
    var self = this;
    var gridNode = self.gameObject;
    var index = fs.CommonLayer.getIndex(gridNode.x, gridNode.y);

    if (self.isSwap && fs.BaseLayer.isCanSwap(index, direction)) {
        return true;
    } else {
        return false;
    }
};

// 发送任务数据
BaseTile.prototype.sendTaskData = function () {
    var self = this;
    //发送UI数据 
    fs.ScenesUI.getDisTarget(self);
};
/**
 * Description: 蜜蜂
 * Author: nishu
 * Email: nishu@supernano.com
 */

var BeeTile = qc.fs.BeeTile = {};

// 元素通用事件执行方法（默认返回false）
BeeTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {

        // 发送任务数据
		self.sendTaskData();

        self.removeTile();

    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 移除自身
BeeTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 关掉主逻辑
    fs.GameManager.stop();

    self.icon.visible = false;
    self.icon_ani.visible = true;

    // 动画完成后
    self.icon_ani.onFinished.addOnce(function () {

        self.icon_ani.visible = false;

        self.explode.visible = true;

        self.explode.playAnimation(self.playExplode);

        // 生产蜂蜜
        self.produce(index);

        fs.AudioManager.playSound(62);

        // 从数组中删除数据
        fs.LayerManager.tilesList.element[index] = null;

        self.explode.onFinished.addOnce(function () {
            // 销毁节点
            self.gameObject.destroy();
        })

        // 打开主逻辑
        fs.GameManager.start();
    });

    // 播放死亡动画
    self.icon_ani.playAnimation("die");
};

// 生产蜂蜜
BeeTile.produce = function (index) {
    var self = this;

    // 延迟生产蜂蜜，主要是在底下已经有蜂蜜的情况下，先消除已有蜂蜜再生产
    fs.Game.timer.add(100, function() {
        var prope = {
            "tileID": 1102
        }
        var honey = fs.TileFactory.buildTile(index, prope, 'belowElement');
        fs.LayerManager.tilesList.belowElement[index] = honey;
    });
}

/**
 * Description: 网兜
 * Author: nishu
 * Email: nishu@supernano.com
 */

var CeilTile = qc.fs.CeilTile = {};

// 元素通用事件执行方法
CeilTile.doAction = function(color, action, actionValue, total) {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    var tile = fs.LayerManager.tilesList.element[index];
    if (tile != null) {
        tile.setDelFlag(false);
    }

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {

        self.removeTile();

        if (action == 'action_self' && actionValue) {
            return false;
        }else {
            return true;
        }
    }
};

// 移除自身
CeilTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    fs.AudioManager.playSound(67);

    // 从aboveElement层数组中删除数据
    fs.LayerManager.tilesList.aboveElement[index] = null;

    // 播放爆炸
    self.disappear();
};
/**
 * Description: 大香菇
 * Author: nishu
 * Email: nishu@supernano.com
 */

var CoconutJuiceTile = qc.fs.CoconutJuiceTile = {};

// 元素通用事件执行方法（默认返回false）
CoconutJuiceTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {

        // 发送任务数据
		self.sendTaskData();

        self.removeTile();
        
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 移除自身
CoconutJuiceTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    fs.AudioManager.playSound(63);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    // 隐藏icon
    self.icon.visible = false;
    
    self.explode.visible = true;

    // 动画执行完成后回调
    self.explode.onFinished.addOnce(function () {
        // 回收对象
        fs.TilePool.recoverTile(self);
    });

    self.explode.playAnimation(self.playExplode);
};
/**
 * Description: 小香菇
 * Author: nishu
 * Email: nishu@supernano.com
 */

var CoconutTile = qc.fs.CoconutTile = {};

// 元素通用事件执行方法（默认返回false）
CoconutTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {

        // 发送任务数据
		self.sendTaskData();

        // 被技能消除会变成大香菇
        if (action == 'action_skill') {
            self.changeSelf();
        }else {
            self.removeTile();
        }
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 变成大香菇
CoconutTile.changeSelf = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);
    var prope = {
        "tileID" : 1104
    };

    // 移除本身
    self.removeTile();

    // 生成大香菇
    var _st = fs.TileFactory.buildTile(index, prope, 'element');
    fs.LayerManager.tilesList.element[index] = _st;
};

// 移除自身
CoconutTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    // 隐藏icon
    self.icon.visible = false;
    
    self.explode.visible = true;

    // 动画执行完成后回调
    self.explode.onFinished.addOnce(function () {
        // 回收对象
        fs.TilePool.recoverTile(self);
    });

    self.explode.playAnimation(self.playExplode);
};

/**
 * Description: 饼干
 * Author: nishu
 * Email: nishu@supernano.com
 */

var CookieTile = qc.fs.CookieTile = {};

// 移除自身
CookieTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    fs.AudioManager.playSound(65);

    // 从数组中删除数据
    fs.LayerManager.tilesList.belowElement[index] = null;

    // 播放爆炸
    self.disappear();
};
/**
 * Description: boss技能逻辑
 * Author: sangliang
 * Email: sangliang@supernano.com
 */
var BossSkill = qc.fs.BossSkill = {};

BossSkill.skillObj = {};

BossSkill.skillStepCount = 0;

BossSkill.bossState = null;
/**
 * initBossSkillData: boss技能数据获取
 */
BossSkill.initBossSkillData = function () {
    var self = this;

    var zoneData = fs.ConfigManager.excelData.zone;
    var skillData = fs.ConfigManager.excelData.skill;
    var skillAreaData = fs.ConfigManager.excelData.skillArea;

    if (fs.ScenesUI.gameMode != "trouble") {
        //当为其他关卡时，切换状态机的状态
        fs.GameManager.changeFSM();
        return;
    }

    var _aiList = zoneData[fs.ConfigManager.levelID]["ai"].split(';');
    var _skillDataId = parseInt(_aiList[2]);

    // 本关boss的技能数据
    var _skillData = skillData[_skillDataId];

    var _skillArea = skillAreaData[_skillData.area];

    if (_aiList.length > 3) {
        var _skillAreaList = skillAreaData[parseInt(_aiList[3])].areaList;
    }

    self.skillObj.aiList = _aiList;
    self.skillObj.tileID = _skillData.tileID;
    self.skillObj.tileNumber = _skillData.tileNumber;
    self.skillObj.tileRate = _skillData.tileRate;
    self.skillObj.tileHP = _skillData.tileHP;
    self.skillObj.area = _skillData.area;

    self.getSkillObjPosition();

}

/**
 *getSkillObjPosition：获取boss扔东西的位置
 */
BossSkill.getSkillObjPosition = function () {
    var self = this;

    var _positionIndex = [];
    if (self.skillObj.area == 7) {
        //朝盘面没有被覆盖的普通元素上扔东西
        var _element = fs.LayerManager.tilesList.element;
        for (var i = 0; i < _element.length; i++) {
            if (_element[i] == null) {
                continue;
            }

            if (_element[i].class1 == 'base' && fs.BaseLayer.isBinded(i) == false) {
                //基础元素，而且没有被捆绑住
                _positionIndex.push(i);
            }
        }
    }

    if (self.skillObj.area == 11) {
        // 朝盘面指定的特殊位置扔
        var _skillAreaData = fs.ConfigManager.excelData.skillArea;

        var _position = _skillAreaData[parseInt(self.skillObj.aiList[3])].areaList;
        _position = _position.split(';');

        for (var j = 0; j < _position.length; j++) {
            var _temp = _position[j].split('_');
            _temp[0] = parseInt(_temp[0]);
            _temp[1] = parseInt(_temp[1]);

            var resultIndex = fs.CommonLayer.getIndexFromRowAndCol(_temp[0] - 1, _temp[1] - 1);
            if (fs.LayerManager.tilesList.element[resultIndex] == null) {
                continue;
            }
            if (fs.BaseLayer.isBinded(resultIndex) == false && fs.LayerManager.tilesList.element[resultIndex].class1 == 'base') {
                _positionIndex.push(resultIndex);
            }
        }
    }

    self.skillObj.skillPosition = _positionIndex;
    self.doThrowSkillObj();
}

/**
 * doThrowSkillObj：扔技能方块
 */
BossSkill.doThrowSkillObj = function () {
    var self = this;

    var _objLayer = null;
    var _throwTimes = self.skillObj.tileNumber;
    var stateControlCount = 0;
    // 先打乱要扔位置的数组
    fs.Game.math.shuffle(self.skillObj.skillPosition);

    if (self.skillObj.tileID == 2401) {
        _objLayer = "aboveElement"
    } else if (self.skillObj.tileID == 1109 || self.skillObj.tileID == 1096) {
        _objLayer = "element"
    }

    // boss技能准备动作
    if (self.skillStepCount == (parseInt(self.skillObj.aiList[1]))) {
        fs.ActorAnimation.actorState = "prepare";
        fs.ActorAnimation.playActorAnimation();
        fs.AudioManager.playSound(6);
        self.bossState = "ready";
        fs.GameManager.changeFSM();
    } else if (self.skillStepCount == (parseInt(self.skillObj.aiList[1]) + 1)) {
        //播放技能
        fs.GameManager.stop();
        // 禁止触摸事件
        fs.GameManager.game.input.touch.enable = false;
        fs.GameManager.game.input.mouse.enable = false;

        fs.ActorAnimation.isActorMove = false;
        //Boss攻击动画
        fs.ActorAnimation.actorState = "attack";
        fs.ActorAnimation.playActorAnimation();
        //丢东西的音效
        fs.AudioManager.playSound(10);
        var ani = function (_index, tp, _objLayer, callback) {
            if (_index == null) {
                stateControlCount += 1;
            } else {
                var _viewTo = fs.TileFactory.buildTile(_index, tp, "obstacleVertical");

                _viewTo.gameObject.x = 360;
                _viewTo.gameObject.y = -160;

                var _tweenPotition = _viewTo.getScript('qc.TweenPosition');
                _tweenPotition.from = new qc.Point(360, -110);
                _tweenPotition.to = new qc.Point(fs.CommonLayer.pivotX(_index), fs.CommonLayer.pivotY(_index));
                _tweenPotition.duration = 0.4;
                _tweenPotition.delay = 0.4;

                _tweenPotition.resetToBeginning();
                _tweenPotition.playForward();

                _tweenPotition.onFinished.addOnce(function () {
                    stateControlCount += 1;
                    _viewTo.gameObject.destroy();
                    if (_objLayer == "element") {
                        fs.TilePool.recoverTile(fs.LayerManager.tilesList[_objLayer][_index]);
                    }
                    var _to = fs.TileFactory.buildTile(_index, tp, _objLayer);
                    fs.LayerManager.tilesList[_objLayer][_index] = _to;
                    callback();
                });
            }
        }

        var isComplete = function () {
            if (stateControlCount == _throwTimes) {
                fs.GameManager.start();
                fs.GameManager.changeFSM();
            }
        }

        for (var i = 0; i < _throwTimes; i++) {
            var _index = self.skillObj.skillPosition.pop();
            var tp = {};
            tp.tileID = self.skillObj.tileID;
            tp.hp = self.skillObj.tileHP;

            if (_objLayer == "element") {
                ani(_index, tp, _objLayer, isComplete);
            } else if (_objLayer == "aboveElement") {
                ani(_index, tp, _objLayer, isComplete);
            }
        }

        self.skillStepCount = 0;
    } else {
        fs.GameManager.changeFSM();
    }
}

/**
 * bossSkillLogic:boss技能主逻辑(外部调用入口)
 */
BossSkill.bossSkillLogic = function () {
    var self = this;

    if ((fs.TaskLogic.bossDownHP - fs.TaskLogic.bossHP) / fs.TaskLogic.bossHPDefault > 0.1) {
        //打断boss技能逻辑
        fs.ActorAnimation.actorState = "stun";
        fs.ActorAnimation.playActorAnimation();
        //被打晕的音效
        fs.AudioManager.playSound(11);
        if (self.bossState == "ready") {
            self.skillStepCount = 0;
        } else {
            self.skillStepCount -= 1;
        }
        fs.GameManager.changeFSM();
    } else {

        //boss技能
        self.initBossSkillData();
    }
}

/**
 * Description: 继承方法
 * Author: nishu
 * Email: nishu@supernano.com
 */

var extend = qc.fs.extend = function (Child, Parent) {
    var p = Parent.prototype;
    var c = Child.prototype;
    
    for (var i in p) {
        c[i] = p[i];
    }
    c.uber = p;
};

/**
 * Description: 基本6种元素
 * Author: nishu
 * Email: nishu@supernano.com
 */

var GeneralTile = qc.fs.GeneralTile = {};

// 元素通用事件执行方法（默认返回false）
GeneralTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {

        // 发送任务数据
		self.sendTaskData();

        self.removeTile();
        
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 移除自身
GeneralTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);
    var count = 2;

    fs.AudioManager.playSound(79);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    // 隐藏icon
    self.icon.visible = false;
    
    self.explode.visible = true;
    self.icon_ani.visible = true;

    var callBack = function () {
        if (--count <= 0) {
            // 回收对象
            fs.TilePool.recoverTile(self);
        }
    }

    // 动画执行完成后回调
    self.explode.onFinished.addOnce(function () {
        self.explode.visible = false;
        callBack();
    });

    self.icon_ani.onFinished.addOnce(function () {
        self.icon_ani.visible = false;
        callBack();
    });

    self.explode.playAnimation(self.playExplode);
    self.icon_ani.playAnimation("tile_lizi");
};
/**
 * Description: 蜂蜜
 * Author: nishu
 * Email: nishu@supernano.com
 */

var HoneyTile = qc.fs.HoneyTile = {};

// 元素通用事件执行方法
HoneyTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {

        // 发送任务数据
		self.sendTaskData();

        self.removeTile();

        // 蜂蜜除了使用道具外，其他消除事件统一返回true
        return true;
    }
};

// 移除自身
HoneyTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    fs.AudioManager.playSound(66);

    // 从belowElement层数组中删除数据
    fs.LayerManager.tilesList.belowElement[index] = null;

    // 播放爆炸
    self.disappear();
};
/**
 * Description: 有生命的元素
 * Author: nishu
 * Email: nishu@supernano.com
 */

var HPTile = qc.fs.HPTile = {};

// 元素通用事件执行方法
HPTile.doAction = function (color, action, actionValue, total) {
    var self = this;

    if (self.id == 1109 || self.id == 1096) {
        fs.AudioManager.playSound(70);
    }

    // 减去生命
    self.hp--;

    if (self.hp == 0) {
        self.removeTile();
    } else {
        self.updateIcon();
        self.setDelFlag(false);
    }
     // 发送任务数据
    self.sendTaskData();

    return true;
};

// 更新ICON
HPTile.updateIcon = function () {
    var self = this;

    var n = self.icon.frame.match(/\d+/g);
    var m = self.icon.frame.split(n);

    self.icon.frame = m[0] + self.hp + m[1];

    self.explode.visible = true;
    self.explode.onFinished.addOnce(function () {
        self.explode.visible = false;
    });
    self.explode.playAnimation(self.playExplode);
}

// 移除自身
HPTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    // 播放爆炸
    self.disappear();
};
/**
 * Description: 冰
 * Author: nishu
 * Email: nishu@supernano.com
 */
var IceTile = qc.fs.IceTile = {};

// 元素通用事件执行方法
IceTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    fs.AudioManager.playSound(68);
    
    // 减去生命
    self.hp--;

    if (self.hp == 0) {
        self.removeTile();
    }else {
        self.updateIcon();
        self.setDelFlag(false);
    }

    return false;
};

// 更新ICON
IceTile.updateIcon = function () {
    var self = this;
    var n = self.icon.frame.match(/\d+/g);
    var m = self.icon.frame.split(n);
    
    self.icon.frame = m[0] + self.hp + m[1];
    
    self.explode.visible = true;
    self.explode.onFinished.addOnce(function () {
        self.explode.visible = false;
    });
    self.explode.playAnimation(self.playExplode);
}

// 移除自身
IceTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.belowElement[index] = null;

    // 播放爆炸
    self.disappear();
};
/**
 * Description: 鱼片
 * Author: nishu
 * Email: nishu@supernano.com
 */

var PopsicleTile = qc.fs.PopsicleTile = {};

// 元素通用事件执行方法
PopsicleTile.doAction = function(color, action, actionValue, total) {
    var self = this;
    
    if (self.hasCanRemove()) {
        // 发送任务数据
        self.sendTaskData();
        self.removeTile();
    }

    return true;
};

// 是否可移除鱼片
PopsicleTile.hasCanRemove = function () {
    var self = this;
    var flag = true;

    self.range.forEach(function(index) {
        if (fs.LayerManager.tilesList.belowElement[index] != null) {
            flag = false;
        }
    });

    return flag;
};

// 播放移除特效
PopsicleTile.playRemoveSprite = function (params) {
    var self = this;
    var gridNode = self.gameObject;
    var icon = self.icon;


    // 添加动作对象
    var ts = icon.addScript('qc.TweenScale');
    var tp = icon.addScript('qc.TweenPosition');
    var ta = icon.addScript('qc.TweenAlpha');

    // 移动鱼片节点到board尾部
    fs.LayerManager.node.board.addChild(gridNode);
    
    ts.duration = 0.3;
    tp.duration = 0.3;
    ta.duration = 0.3;

    // 执行扩大动画
    ts.from = new qc.Point(1, 1);
    ts.to = new qc.Point(1.5, 1.5);

    ts.onFinished.addOnce(function () {

        // 执行移动动画
        tp.from = new qc.Point(icon.x, icon.y);
        tp.to = new qc.Point(icon.x, icon.y - 200);

        // 执行渐隐动画
        ta.from = 1;
        ta.to = 0;

        tp.onFinished.addOnce(function () {
            // 销毁节点
            gridNode.destroy();
        });

        tp.resetToBeginning();
        tp.playForward();

        ta.resetToBeginning();
        ta.playForward();
    });

    ts.resetToBeginning();
    ts.playForward();
};

// 移除自身
PopsicleTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    fs.AudioManager.playSound(69);

    // 从数组中删除数据
    self.range.forEach(function(index) {
        fs.LayerManager.tilesList.popsicle[index] = null;
    });

    // 播放移除特效
    self.playRemoveSprite();
};

/**
 * Description: 彩虹冰块
 * Author: nishu
 * Email: nishu@supernano.com
 */

var RainbowiceTile = qc.fs.RainbowiceTile = {};

// 元素通用事件执行方法
RainbowiceTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_skill' || action == 'action_props') {
        // 发送任务数据
		self.sendTaskData();
        self.removeTile();
    }else if (action == 'action_round') {
        // 发送任务数据
		self.sendTaskData();
        self.changeSelf(color);
    }

    return true;
};

// 改变自身
RainbowiceTile.changeSelf = function (color) {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    var fruitID = fs.BaseLayer.getTileIDByColor(color);
    
    // 移除本身
    self.removeTile();

    // 从对象池中拿取指定水果
    var tile = fs.TilePool.getTile(index, fruitID);

    // 变成旁边的元素
    fs.LayerManager.tilesList.element[index] = tile;

    tile.icon_ani.visible = true;
    tile.explode.onFinished.addOnce(function () {
        tile.icon_ani.visible = false;
    });
    tile.icon_ani.playAnimation("tile_lizi");
};

// 移除自身
RainbowiceTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    // 回收对象
    fs.TilePool.recoverTile(self);

    return;

    // 隐藏icon
    self.icon.visible = false;
    
    self.explode.visible = true;

    // 动画执行完成后回调
    self.explode.onFinished.addOnce(function () {
        // 回收对象
        fs.TilePool.recoverTile(self);
    });

    self.explode.playAnimation(self.playExplode);
};
/**
 * Description: 横向技能
 * Author: nishu
 * Email: nishu@supernano.com
 */

var SkillHorizonTile = qc.fs.SkillHorizonTile = {};

SkillHorizonTile.setType = function () {
    var self = this;
    self.type = 'SKILL_HORIZON';
}

// 元素通用事件执行方法（默认返回false）
SkillHorizonTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {
        // 发送任务数据
		self.sendTaskData();
        
        // 施放技能
        self.doSkill(color);
        
        self.removeTile()
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 释放技能
SkillHorizonTile.doSkill = function (color) {
    var self = this;
    
    self.filterSkill(color);
};

// 移除自身
SkillHorizonTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;
    
    if (self.type == 'SKILL_NOTHING') {
        self.icon.visible = false;
        self.icon_ani.visible = true;

        // 动画执行完成后回调
        self.icon_ani.onFinished.addOnce(function () {
            // 销毁节点
            self.gameObject.destroy();
        });

        self.icon_ani.playAnimation("tile_lizi");
    }
};
/**
 * Description: 短果冻炸弹技能
 * Author: nishu
 * Email: nishu@supernano.com
 */

var SkillJellyShortTile = qc.fs.SkillJellyShortTile = {};

SkillJellyShortTile.setType = function () {
    var self = this;
    self.type = 'SKILL_JELLY_SHORT';
}

// 元素通用事件执行方法（默认返回false）
SkillJellyShortTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {
        // 发送任务数据
		self.sendTaskData();
        
        // 施放技能
        self.doSkill(color);
        
        self.removeTile()
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 释放技能
SkillJellyShortTile.doSkill = function (color) {
    var self = this;
    
    self.filterSkill(color);
};

// 移除自身
SkillJellyShortTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    if (self.type == 'SKILL_NOTHING') {
        self.icon.visible = false;
        self.icon_ani.visible = true;

        // 动画执行完成后回调
        self.icon_ani.onFinished.addOnce(function () {
            // 销毁节点
            self.gameObject.destroy();
        });

        self.icon_ani.playAnimation("tile_lizi");
    }
};
/**
 * Description: 果冻炸弹技能
 * Author: nishu
 * Email: nishu@supernano.com
 */

var SkillJellyTile = qc.fs.SkillJellyTile = {};

SkillJellyTile.setType = function () {
    var self = this;
    self.type = 'SKILL_JELLY';
}

// 元素通用事件执行方法（默认返回false）
SkillJellyTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {
        // 发送任务数据
		self.sendTaskData();
        
        // 施放技能
        self.doSkill(color);
        
        self.removeTile()
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 释放技能
SkillJellyTile.doSkill = function (color) {
    var self = this;
    
    self.filterSkill(color);
};

// 移除自身
SkillJellyTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    if (self.type == 'SKILL_NOTHING') {
        self.icon.visible = false;
        self.icon_ani.visible = true;

        // 动画执行完成后回调
        self.icon_ani.onFinished.addOnce(function () {
            // 销毁节点
            self.gameObject.destroy();
        });

        self.icon_ani.playAnimation("tile_lizi");
    }
};
/**
 * Description: 磁铁技能
 * Author: nishu
 * Email: nishu@supernano.com
 */

var SkillMagnetTile = qc.fs.SkillMagnetTile = {};

SkillMagnetTile.setType = function () {
    var self = this;
    self.type = 'SKILL_MAGNET';
}

// 元素通用事件执行方法（默认返回false）
SkillMagnetTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {
        // 发送任务数据
		self.sendTaskData();
        
        // 施放技能
        self.doSkill(color);
        
        self.removeTile()
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 释放技能
SkillMagnetTile.doSkill = function (color) {
    var self = this;
    
    self.filterSkill(color);
};

// 移除自身
SkillMagnetTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 播放爆发特效
    self.baofa.visible = true;
    self.baofa.playAnimation('baofa');
    
    // 延迟销毁对象，和交换的同色元素动画同步
    fs.Game.timer.add(700, function() {
        self.gameObject.destroy();
        // 从数组中删除数据
        fs.LayerManager.tilesList.element[index] = null;
    });
};
/**
 * Description: 彩虹技能
 * Author: nishu
 * Email: nishu@supernano.com
 */

var SkillRainbowTile = qc.fs.SkillRainbowTile = {};

SkillRainbowTile.setType = function () {
    var self = this;
    self.type = 'SKILL_RAINBOW';
}

// 元素通用事件执行方法（默认返回false）
SkillRainbowTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {
        // 发送任务数据
		self.sendTaskData();
        
        // 施放技能
        self.doSkill(color);

        self.removeTile();
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 释放技能
SkillRainbowTile.doSkill = function (color) {
    var self = this;
    
    self.filterSkill(color);
};

// 移除自身
SkillRainbowTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 播放爆发特效
    self.baofa.visible = true;
    self.baofa.playAnimation('baofa');
    
    // 延迟销毁对象，和交换的同色元素动画同步
    fs.Game.timer.add(700, function() {
        self.gameObject.destroy();
        // 从数组中删除数据
        fs.LayerManager.tilesList.element[index] = null;
    });
};
/**
 * Description: 竖向技能
 * Author: nishu
 * Email: nishu@supernano.com
 */

var SkillVerticalTile = qc.fs.SkillVerticalTile = {};

SkillVerticalTile.setType = function () {
    var self = this;
    self.type = 'SKILL_VERTICAL';
}

// 元素通用事件执行方法（默认返回false）
SkillVerticalTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {
        // 发送任务数据
		self.sendTaskData();
        
        // 施放技能
        self.doSkill(color);
        
        self.removeTile()
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 释放技能
SkillVerticalTile.doSkill = function (color) {
    var self = this;
    
    self.filterSkill(color);
};

// 移除自身
SkillVerticalTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    if (self.type == 'SKILL_NOTHING') {
        self.icon.visible = false;
        self.icon_ani.visible = true;

        // 动画执行完成后回调
        self.icon_ani.onFinished.addOnce(function () {
            // 销毁节点
            self.gameObject.destroy();
        });

        self.icon_ani.playAnimation("tile_lizi");
    }
};
/**
 * Description: 短xx炸弹技能
 * Author: nishu
 * Email: nishu@supernano.com
 */

var SkillXBombShortTile = qc.fs.SkillXBombShortTile = {};

SkillXBombShortTile.setType = function () {
    var self = this;
    self.type = 'SKILL_XBOMB_SHORT';
}

// 元素通用事件执行方法（默认返回false）
SkillXBombShortTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {
        // 发送任务数据
		self.sendTaskData();
        
        // 施放技能
        self.doSkill(color);
        
        self.removeTile()
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 释放技能
SkillXBombShortTile.doSkill = function (color) {
    var self = this;
    
    self.filterSkill(color);
};

// 移除自身
SkillXBombShortTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    if (self.type == 'SKILL_NOTHING') {
        self.icon.visible = false;
        self.icon_ani.visible = true;

        // 动画执行完成后回调
        self.icon_ani.onFinished.addOnce(function () {
            // 销毁节点
            self.gameObject.destroy();
        });

        self.icon_ani.playAnimation("tile_lizi");
    }
};
/**
 * Description: xx炸弹技能
 * Author: nishu
 * Email: nishu@supernano.com
 */

var SkillXBombTile = qc.fs.SkillXBombTile = {};

SkillXBombTile.setType = function () {
    var self = this;
    self.type = 'SKILL_XBOMB';
}

// 元素通用事件执行方法（默认返回false）
SkillXBombTile.doAction = function(color, action, actionValue, total) {
    var self = this;

    if (action == 'action_self' || action == 'action_skill' || action == 'action_props') {
        // 发送任务数据
		self.sendTaskData();
        
        // 施放技能
        self.doSkill(color);
        
        self.removeTile()
    }else if (action == 'action_round') {
        // 旁格影响不往下传递事件
        return true;
    }

    return false;
};

// 释放技能
SkillXBombTile.doSkill = function (color) {
    var self = this;
    
    self.filterSkill(color);
};

// 移除自身
SkillXBombTile.removeTile = function () {
    var self = this;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);

    // 从数组中删除数据
    fs.LayerManager.tilesList.element[index] = null;

    if (self.type == 'SKILL_NOTHING') {
        self.icon.visible = false;
        self.icon_ani.visible = true;

        // 动画执行完成后回调
        self.icon_ani.onFinished.addOnce(function () {
            // 销毁节点
            self.gameObject.destroy();
        });

        self.icon_ani.playAnimation("tile_lizi");
    }
};
/**
 * Description: 生成点生成器
 * Author: sangliang
 * Email: sangliang@supernano.com
 */

var TileBuilder = qc.fs.TileBuilder = {};

// 获取生成点信息
TileBuilder.getInfo = function () {
    var self = this;
    var aes = fs.Game.assets.find('levelConfig');
    return TileBuilder.getDropPointList(JSON.parse(aes.text));
}

/**
 * [getDropPointList] 获取特殊掉落点
 * @param [res] [obj] 配置数据
 * @return [self.dropPointList] [array] 掉落点的对象数组
 */
TileBuilder.getDropPointList = function (res) {
    var self = this;
    var levelID = fs.ConfigManager.levelID;
    var info = fs.ConfigManager.excelData.zone;
    var _fillID = [];
    var _profillID = []

    //获取配置表中的id，是否为数组，或者为1个元素
    var _isMutiBuildWay = info[levelID].fillID.toString().indexOf(';');

    if (_isMutiBuildWay != -1) {
        _fillID = _isMutiBuildWay.split(";");
    }
    else {
        _fillID.push(info[levelID].fillID);
    }

    for (var k = 0; k < _fillID.length; k++) {
        var _fillIDRule = fs.ConfigManager.excelData.fillid[_fillID[k]].fillRule;
        var _element = fs.ConfigManager.excelData.fillRule[_fillIDRule].tileList.split(';');
        var _realElementent = [];
        var _posibility = fs.ConfigManager.excelData.fillRule[_fillIDRule].tileProbability;
        var _useTimes = fs.ConfigManager.excelData.fillRule[_fillIDRule].useRuleTime;
        self.dropPointList = [];
        var _realPosibility = [];
        var _temp = _posibility.split(";");
        var _sum = 0;

        for (var s = 0; s < _temp.length; s++) {
            _sum += parseInt(_temp[s]);
        }

        for (var i = 0; i < _temp.length; i++) {
            _realPosibility[i] = parseInt(_temp[i]);
        }
        // console.log(res);
        // 遍历第一排的掉落元素
        for (var i = 0; i < 9; i++) {

            // res.layers[0].data[i]!=1 !=2 说明该点为元素掉落所使用的生成点
            if (res.layers[0].data[i] != 1 && res.layers[0].data[i] != 2 && res.layers[6].data[i]==0) {
                self.dropPointList[i] = {};
                self.dropPointList[i][k] = {}
                self.dropPointList[i][k].elementList = _element;
                self.dropPointList[i][k].dropPosibility = _realPosibility;
                self.dropPointList[i][k].useTime = _useTimes;
            } else {
                continue;
            }

        }

        // 获取特殊掉落点位置
        var _proList = [];
        for (var i = 0; i < 72; i++) {
            if (res.layers[6].data[i] != 0) {
                _proList[i] = {};
                _proList[i] = self.transformID(i, res, res.layers[6].data[i]);

                if (_proList[i].tileID == "2602" || _proList[i].tileID == "2601") {
                    continue;
                }

                // console.log(fs.ConfigManager.excelData.fillid[parseInt(_proList[i].fillID)]);
                // 拿到元素的掉落规则id
                var _profillIDRule = fs.ConfigManager.excelData.fillid[_proList[i].fillID].fillRule;
                self.dropPointList[i] = {};

                if (_profillIDRule.toString().indexOf(';') != -1) {
                    // 当fillID为数组时
                    _profillID = _profillIDRule.toString().split(';');
                } else {
                    // 当fillId为单个元素时
                    if (fs.ConfigManager.excelData.fillRule[_profillIDRule].tileList.length == undefined) {
                        var _proelement = fs.ConfigManager.excelData.fillRule[_profillIDRule].tileList;

                    } else {
                        var _proelement = fs.ConfigManager.excelData.fillRule[_profillIDRule].tileList.split(';');
                    }

                    var _realproelement = [];
                    var _proposibility = fs.ConfigManager.excelData.fillRule[_profillIDRule].tileProbability;
                    var _prouseTimes = fs.ConfigManager.excelData.fillRule[_profillIDRule].useRuleTime;
                    var _prorealPosibility = [];
                    var _protemp = _proposibility;

                    if (_proposibility.length == undefined) {
                        var _temp1 = _proposibility;
                        _prorealPosibility = [_temp1];
                    } else {
                        var _temp1 = _proposibility.split(';');
                        for (var j = 0; j < _temp1.length; j++) {
                            _prorealPosibility[j] = parseInt(_temp1[j]);
                        }
                    }

                    self.dropPointList[i][k] = {};
                    self.dropPointList[i][k].elementList = _proelement;
                    self.dropPointList[i][k].dropPosibility = _prorealPosibility;
                    self.dropPointList[i][k].useTime = _prouseTimes;
                }

                for (var k = 0; k < _profillID.length; k++) {

                    var _proelement = fs.ConfigManager.excelData.fillRule[_profillID[k]].tileList.split(';');
                    var _proposibility = fs.ConfigManager.excelData.fillRule[_profillID[k]].tileProbability;
                    var _prouseTimes = fs.ConfigManager.excelData.fillRule[_profillID[k]].useRuleTime;
                    var _prorealPosibility = [];
                    var _protemp = _proposibility.split(";");
                    var _realproelement = [];

                    for (var j = 0; j < _protemp.length; j++) {
                        _prorealPosibility[j] = parseInt(_protemp[j]);
                    }

                    self.dropPointList[i][k] = {};
                    self.dropPointList[i][k].elementList = _proelement;
                    self.dropPointList[i][k].dropPosibility = _prorealPosibility;
                    self.dropPointList[i][k].useTime = _prouseTimes;
                }

            } else {
                _proList[i] = null;
            }
        }
    }
    // console.info(self.dropPointList);
    return self.dropPointList;
}

// 获取真实的id
TileBuilder.transformID = function (index, res, element) {
    var _tilesets = res.tilesets;
    var _realID = null;

    for (var item in _tilesets) {
        if (_tilesets[item].firstgid == element) {
            _realID = _tilesets[item].tileproperties[0];
        }
    }

    return _realID;
}
/**
 * Description: Tile工厂
 * Author: nishu
 * Email: nishu@supernano.com
 */

var TileFactory = function () {
    var self = this;
};

/**
 * [buildTile 制造Tile元素]
 * @param  {[number]} index      [生成位置]
 * @param  {[object]} properties [tileID和相关属性]
 * @param  {[string]} layerName  [生成到对应层的名称]
 * @return {[object]}            [已生成的Tile对象]
 */
TileFactory.prototype.buildTile = function (index, properties, layerName, isNew) {
    var self = this;
    // console.log(index + ' ' + properties.tileID);
    var tileID = parseInt(properties.tileID);

    // 空方块，只用来在Tile数组中占位
    if (tileID == 2001 || tileID == 2002 || tileID == 2003) {
        var _t = fs.ConfigManager.excelData.tiles[tileID];
        return _t;
    }

    // 初始空元素
    if (tileID == 2006) {
        return null;
    }

    // 复制Tile预制到相关Layer层，创建一个Tile元素
    var tp = fs.Game.add.clone(fs.LayerManager.tilePrefab, fs.LayerManager.node[layerName]);
    var tileObj = tp.getScript('qc.engine.BaseTile');

    // 设置Tile相关属性
    tileObj.setData(index, properties, isNew);

    // 继承
    // 基本6种元素
    if (tileID <= 1006) {
        // 继承Tile基类
        tileObj.extend(fs.GeneralTile);
    }

    // 横向炸弹技能
    if (tileID >= 1007 && tileID <= 1012) {
        tileObj.extend(fs.BaseSkill);
        tileObj.extend(fs.SkillHorizonTile);
    }

    // 竖向炸弹技能
    if (tileID >= 1013 && tileID <= 1018) {
        tileObj.extend(fs.BaseSkill);
        tileObj.extend(fs.SkillVerticalTile);
    }

    // xx炸弹技能
    if (tileID >= 1019 && tileID <= 1024) {
        tileObj.extend(fs.BaseSkill);
        tileObj.extend(fs.SkillXBombTile);
    }
    // 短xx炸弹技能
    if (tileID == 1034) {
        tileObj.extend(fs.BaseSkill);
        tileObj.extend(fs.SkillXBombShortTile);
    }

    // 果冻炸弹技能
    if (tileID >= 1025 && tileID <= 1030) {
        tileObj.extend(fs.BaseSkill);
        tileObj.extend(fs.SkillJellyTile);
    }
    // 短果冻炸弹技能
    if (tileID == 1035) {
        tileObj.extend(fs.BaseSkill);
        tileObj.extend(fs.SkillJellyShortTile);
    }

    // 彩虹技能
    if (tileID == 1031) {
        tileObj.extend(fs.BaseSkill);
        tileObj.extend(fs.SkillRainbowTile);
    }
    // 磁铁技能
    if (tileID == 1032) {
        tileObj.extend(fs.BaseSkill);
        tileObj.extend(fs.SkillMagnetTile);
    }

    // 网兜
    if (tileID == 2401) {
        tileObj.extend(fs.CeilTile);
    }

    // 蜜蜂
    if (tileID == 1101) {
        tileObj.extend(fs.BeeTile);
    }

    // 奶牛
    if (tileID == 1201) {
        tileObj.extend(fs.CowTile);
    }

    // 果树
    if (tileID >= 1301 && tileID <= 1307) {
        tileObj.extend(fs.TreeTile);
    }

    // 蜂蜜
    if (tileID == 1102) {
        tileObj.extend(fs.HoneyTile);
    }

    // 鱼片
    if (tileID >= 2201 && tileID <= 2209) {
        tileObj.extend(fs.PopsicleTile);
    }

    // 小香菇
    if (tileID == 1103) {
        tileObj.extend(fs.CoconutTile);
    }

    // 大香菇
    if (tileID == 1104) {
        tileObj.extend(fs.CoconutJuiceTile);
    }

    // 冰
    if (tileID == 2501) {
        tileObj.extend(fs.IceTile);
    }

    // 彩虹冰块
    if (tileID == 1204) {
        tileObj.extend(fs.RainbowiceTile);
    }

    // 有生命的元素（冰盒子，饼干, 蛋糕）
    if (tileID == 1109 || tileID == 1108 || tileID == 1096) {
        tileObj.extend(fs.HPTile);

        // 饼干
        if (tileID == 1108) {
            tileObj.extend(fs.CookieTile);
        }
    }

    // 随机基本方块
    if (tileID == 2004) {
        tileObj.extend(fs.GeneralTile);
    }

    // 虫洞
    if (tileID == 2601 || tileID == 2602) {
        tileObj.extend(fs.GeneralTile);
    }

    return tileObj;
};

qc.fs.TileFactory = new TileFactory();
/**
 * Description: 对象池
 * Author: nishu
 * Email: nishu@supernano.com
 */

var TilePool = function () {
    var self = this;

    self.poolSize = 72;

    // 对象存储数组
    self.list = [];
};

// 填充对象池
TilePool.prototype.supplyTile = function () {
    var self = this;

    while (self.list.length < self.poolSize) {
        for (var i in fs.LayerManager.generator) {
            if (self.list.length < self.poolSize) {
                var prop = fs.LayerManager.getRandomProp(i);
                // 创建对象到棋盘左上角
                var _to = fs.TileFactory.buildTile(0, prop, 'element', true);
                self.list.push(_to);
            } else {
                break;
            }
        }
    }

    // 棋盘生成完成
    fs.GameManager.isBoardReady = true;
}

// 重置元素属性
TilePool.prototype.restTile = function (tile, index, pointID) {
    var self = this;
    
    // 设置位置
    tile.gameObject.x = fs.CommonLayer.pivotX(index);
    tile.gameObject.y = pointID ? fs.CommonLayer.pivotY(index) : fs.CommonLayer.pivotY(index) - fs.ConfigManager.gridH;

    // 设置显示隐藏状态
    tile.icon.visible = true;
    tile.explode.visible = false;
    tile.make_skill.visible = false;
    tile.baofa.visible = false;

    // 标记为新添加
    tile.newFlag = pointID ? false : true;
    tile.delFlag = false;
    tile.moveFlag = false;
};

// 获取对象
TilePool.prototype.getTile = function (index, pointID) {
    var self = this,
        tile = null,
        prop = null;

    // 根据生成点随机出一个元素属性，或使用指定ID
    if (pointID != undefined) {
        prop = {
            tileID: pointID
        };
    }else {
        prop = fs.LayerManager.getRandomProp(index);
    }

    var tileID = prop.tileID;

    // 根据元素属性查找对象池
    for (var i = 0, len = self.list.length; i < len; i++) {
        var element = self.list[i];

        // 如果对象池存在元素，则返回元素，并从对象池中删除
        if (element.id == tileID) {
            tile = element;
            self.list.splice(i, 1);
            break;
        }
    }

    // 如果对象池不存在元素，则创建一个
    if (tile == null) {
        tile = fs.TileFactory.buildTile(index, prop, 'element', true);
    }

    // 重置元素属性
    self.restTile(tile, index, pointID);

    return tile;
};

// 回收对象
TilePool.prototype.recoverTile = function (tile) {
    var self = this;

    // 放置到左上角
    tile.gameObject.x = 40;
    tile.gameObject.y = -40;

    // 设置为删除状态
    tile.setDelFlag(true);

    self.list.push(tile);
};

qc.fs.TilePool = new TilePool();
/**
 * Description: 果树
 * Author: nishu
 * Email: nishu@supernano.com
 */

var TreeTile = qc.fs.TreeTile = {};

// 初始化
TreeTile.init = function () {
    var self = this;
    var treeArray = {
        1301: 1001,
        1302: 1002,
        1303: 1003,
        1304: 1004,
        1305: 1005,
        1306: 1006,
        1307: 1102
    };

    // 果树生成水果ID
    self.fruitID = treeArray[self.id];
};

// 元素通用事件执行方法
TreeTile.doAction = function(color, action, actionValue, total) {
    var self = this;
    
    if (self.hp < 3) {
        self.hp++;
    }

    self.updateIcon();
    self.setDelFlag(false);

    return true;
};

// 获取生成水果的位置
TreeTile.getFruitTilePos = function () {
    var self = this;
    var len = fs.ConfigManager.row * fs.ConfigManager.colunm;

    var baseArray = [],
        posArray = [];
    
    for (var i = 0; i < len; i++) {
        var tile = fs.LayerManager.tilesList.element[i];
        if (tile != null && tile.class1 == 'base' && !tile.delFlag && !tile.moveFlag && tile.id != self.fruitID) {
            baseArray.push(i);
        }
    }

    for (var i = 0; i < 3; i++) {
        var randFlag = true;
        while (randFlag) {
            var _m = fs.Game.math.random(0, baseArray.length - 1);
            if (posArray.indexOf(baseArray[_m]) == -1) {
                posArray.push(baseArray[_m]);
                randFlag = false;
            }
        }
    }

    return posArray;
};

// 释放生成技能
TreeTile.doSkill = function (callback) {
    var self = this;

    var targetArray = self.getFruitTilePos();

    targetArray.forEach(function(item, index) {
        self.moveFruitToTile(item, callback);
    });
};

// 生成水果到指定方格
TreeTile.moveFruitToTile = function (toIndex, callback) {
    var self = this;
    var tile = null;
    var index = fs.CommonLayer.getIndex(self.gameObject.x, self.gameObject.y);
    var toTile = fs.LayerManager.tilesList.element[toIndex];

    fs.GameManager.stop();

    // console.info(index);
    // 从对象池中拿取同色水果
    tile = fs.TilePool.getTile(index, self.fruitID);

    // 回收目标水果
    fs.TilePool.recoverTile(toTile);
    fs.LayerManager.tilesList.element[toIndex] = null;
    fs.LayerManager.tilesList.element[toIndex] = tile;
    
    // 设置为移动状态
    tile.setMoveFlag(true);

    // 移动生成水果到目标位置
    tile.move(toIndex, function() {
        tile.setMoveFlag(false);
        fs.GameManager.start();

        if (typeof callback == 'function') callback();
    }, 0.35);
};

// 更新ICON
TreeTile.updateIcon = function () {
    var self = this;
    var iconNum = self.hp;
    
    var n = self.icon.frame.match(/\d+/g);
    var m = self.icon.frame.split(n);
    
    self.icon.frame = m[0] + iconNum + m[1];

    // 执行扩大动画
    var gridNode = self.gameObject;

    var ts = gridNode.addScript('qc.TweenScale');

    ts.duration = 0.2;
    
    ts.from = new qc.Point(1, 1);
    ts.to = new qc.Point(1.3, 1.3);

    ts.onFinished.addOnce(function () {
        ts.from = new qc.Point(1.3, 1.3);
        ts.to = new qc.Point(1, 1);

        ts.resetToBeginning();
        ts.playForward();
    });

    ts.resetToBeginning();
    ts.playForward();
}

// 更新回合
TreeTile.updateRounds = function (callback) {
    var self = this;

    if (self.hp == 3) {
        self.hp = 0;
        self.doSkill(callback);
        self.updateIcon();
    }
};
/**
 * Description: 音效管理
 * Author: nishu
 * Email: nishu@supernano.com
 */

var AudioManager = qc.defineBehaviour('qc.engine.AudioManager', qc.Behaviour, function() {
    var self = this;

    // 设置到全局
    fs.AudioManager = self;

    // 声音队列
    self.soundQueue = [];

    self.soundSwitch = false;
    
}, {

});

// 播放声音
AudioManager.prototype.playSound = function (id, isLoop) {
    var self = this;
    var isLoop = isLoop || false;

    var sound = fs.ConfigManager.soundData[id];
    
    if (!sound.isPlaying && !self.soundSwitch) {
        sound.loop = isLoop;
        sound.play();
    }
};

// 停止声音
AudioManager.prototype.stopSound = function (id) {
    var self = this;
    var sound = fs.ConfigManager.soundData[id];
    
    sound.stop();
};

// 暂停声音
AudioManager.prototype.pauseSound = function (id) {
    var self = this;
    var sound = fs.ConfigManager.soundData[id];
    
    sound.pause();
};

// 继续播放声音
AudioManager.prototype.resumeSound = function (id) {
    var self = this;
    var sound = fs.ConfigManager.soundData[id];
    
    sound.resume();
};
/**
 * Description: 节点缓存图片管理
 * Author: nishu
 * Email: nishu@supernano.com
 */

var CacheAsBitmap = qc.defineBehaviour('qc.engine.CacheAsBitmap', qc.Behaviour, function() {
    var self = this;

    // 设置到全局
    fs.CacheAsBitmap = self;

    // 被缓存的节点
    self.cacheNode = [
        // qc.N('topBg'),
        // qc.N('gridBg'),
        qc.N('bossTarget'),
        qc.N('floor')
    ];
    
}, {

});

// 更新缓存
CacheAsBitmap.prototype.updateCache = function () {
    var self = this;
    
    for (var i = 0, len = self.cacheNode.length; i < len; i++) {
        var node = self.cacheNode[i];
        var cache = node.getScript('qc.CacheAsBitmap');
        cache.dirty = true;
    }
};
/**
 * Description: 游戏暂停管理
 * Author: nishu
 * Email: nishu@supernano.com
 */

var pauseManager = qc.defineBehaviour('qc.engine.pauseManager', qc.Behaviour, function() {
    var self = this;

    // 获取节点对象
    self.node = {
        pauseDialog: qc.N('pauseDialog'),   // 暂停UI
        pauseBtn: qc.N('pauseBtn'),         // 暂停游戏
        continueBtn: qc.N('continueBtn'),   // 继续游戏
        homeBackBtn: qc.N('homeBackBtn'),   // 返回主页
        restartBtn: qc.N('restartBtn'),     // 重玩游戏
        soundOnBtn: qc.N('soundOnBtn'),     // 声音开
        soundOffBtn: qc.N('soundOffBtn'),    // 声音关

        addStep: qc.N('addStep'),
        minusStep: qc.N('minusStep')
    };
    
}, {
   
});

pauseManager.prototype.awake = function() {
    var self = this;


    // 注册事件的监听
    self.node.pauseBtn.onClick.add(self.pauseFn.bind(self));
    self.node.continueBtn.onClick.add(self.continueFn.bind(self));
    self.node.homeBackBtn.onClick.add(self.homeBackFn.bind(self));
    self.node.restartBtn.onClick.add(self.restartFn.bind(self));
    self.node.soundOnBtn.onClick.add(self.soundOnFn.bind(self));
    self.node.soundOffBtn.onClick.add(self.soundOffFn.bind(self));

    qc.N('addStep').onClick.add(self.addStepFn.bind(self));
    qc.N('minusStep').onClick.add(self.minusStepFn.bind(self));
};

// 暂停游戏
pauseManager.prototype.pauseFn = function () {
    var self = this;

    fs.AudioManager.playSound(16);
    
    self.node.pauseDialog.visible = true;
    fs.FightControl.isAction = true;
};

// 继续游戏
pauseManager.prototype.continueFn = function () {
    var self = this;

    fs.AudioManager.playSound(16);

    self.node.pauseDialog.visible = false;
    fs.FightControl.isAction = false;
};

// 返回主页
pauseManager.prototype.homeBackFn = function () {
    var self = this;

    fs.AudioManager.playSound(16);
};

// 重玩游戏
pauseManager.prototype.restartFn = function () {
    var self = this;

    fs.GameManager.removeTimeBuilder();
    fs.TilePool.list = [];
    fs.BossSkill.skillStepCount = 0;
    fs.BossSkill.bossState = null;
    // qc.N('floor').removeChildren();
    // qc.N('element').removeChildren();
    // fs.LayerManager.tilesList.element = [];
    // fs.LayerManager.isLock = false;
    // fs.LayerManager.init();
    fs.Game.scene.load("fight", true, function () {
        console.log('Start loading assets.');
    }, function () {
        console.log('Loaded ok.');
    });
    fs.AudioManager.playSound(16);

    // location.reload();
};

// 声音关
pauseManager.prototype.soundOnFn = function () {
    var self = this;

    fs.AudioManager.playSound(16);

    // 暂停背景音乐
    fs.AudioManager.pauseSound(0);
    
    fs.AudioManager.soundSwitch = true;
    self.node.soundOffBtn.visible = true;
    self.node.soundOnBtn.visible = false;
};

// 声音开
pauseManager.prototype.soundOffFn = function () {
    var self = this;

    fs.AudioManager.playSound(16);

    // 继续播放背景音乐
    fs.AudioManager.resumeSound(0);
    
    fs.AudioManager.soundSwitch = false;
    self.node.soundOffBtn.visible = false;
    self.node.soundOnBtn.visible = true;
};

pauseManager.prototype.addStepFn = function () {
    var self = this;

    fs.ScenesUI.stepCount += 5;

    qc.N('stepNum').text = String(fs.ScenesUI.stepCount);
};

pauseManager.prototype.minusStepFn = function () {
    var self = this;

    if (fs.ScenesUI.stepCount > 5) {
        fs.ScenesUI.stepCount -= 5;

        qc.N('stepNum').text = String(fs.ScenesUI.stepCount);
    }
};
/**
 * Description: 提示动画
 * Author: sangliang
 * Email: sangliang@supernano.com
 */
var PopManager = qc.defineBehaviour('qc.engine.PopManager', qc.Behaviour, function () {
    var self = this;

    fs.PopManager = self;

}, {
        // combo提示
        comboPopNode: qc.Serializer.NODE,
        // 重排漩涡
        rebuildNode: qc.Serializer.NODE,
        rebuildNodeOut: qc.Serializer.NODE
    });

PopManager.prototype.playComboAnimation = function (comboCount) {
    var self = this;

    var popstyle = "";

    fs.GameManager.removeTimeBuilder();

    if (comboCount == 4) {
        popstyle = "good";
    } else if (comboCount == 5) {
        popstyle = "great";
    } else if (comboCount == 6) {
        popstyle = "amazing";
    } else if (comboCount > 6) {
        popstyle = "unbelievable";
    } else {
        return;
    }

    self.playPopAnimation(popstyle);
}

/**
 * [playPopAnimation 播放提示动画]
 * @param  {[string]} popstyle [动画名称]
 */
PopManager.prototype.playPopAnimation = function (popstyle) {
    var self = this;
    if(fs.TaskLogic.gameResult != null){
        return;
    }
    self.comboPopNode.alpha = 1;
    self.comboPopNode.resetNativeSize();

    self.comboPopNode.playAnimation(popstyle, 1, false);
    if(popstyle =="nomatch"){
        fs.FightControl.isAction = true;
        fs.AudioManager.playSound(114);
    }

    if (popstyle=="good"){
        fs.AudioManager.playSound(109);
    }
    if (popstyle=="great"){
        fs.AudioManager.playSound(110);
    }
    if(popstyle=="amazing"){
        fs.AudioManager.playSound(111);
    }
    if(popstyle=="unbelievable"){
        fs.AudioManager.playSound(112);
    }
    if (popstyle == "nomatch") {
        self.comboPopNode.onFinished.addOnce(function () {
            self.playVortexAnimation();
            self.comboPopNode.alpha = 0;

        });
    }

}

// 漩涡动画
PopManager.prototype.playVortexAnimation = function () {
    var self = this;

    
    self.rebuildNode.alpha = 1;
    // self.rebuildNode.resetNativeSize();
    // self.rebuildNode.y = 0;
    // self.rebuildNode.x = 178.868;
    self.rebuildNode.playAnimation("in", 1, false);
    //重排漩涡的音效
    fs.AudioManager.playSound(101);
    fs.DisFactory.dieMapRebuild();
    self.rebuildNode.onFinished.addOnce(function () {
        fs.PopManager.playVortexAnimationOut();
    });

}

// 爆炸动画
PopManager.prototype.playVortexAnimationOut = function () {
    var self = this;
    self.rebuildNodeOut.alpha = 1;
    // self.rebuildNodeOut.resetNativeSize();
    // self.rebuildNodeOut.y = 102;
    // self.rebuildNodeOut.x = 200;
    self.rebuildNodeOut.playAnimation("out", 1, false);
    // 重新显示地图
    for (var i = 0; i < 72; i++) {
        if (fs.LayerManager.tilesList.element[i] == null) {
            continue;
        }
        if (fs.LayerManager.tilesList.element[i].id <= 1006) {
            fs.LayerManager.tilesList.element[i].gameObject.alpha = 1;
        }
    }
    self.rebuildNodeOut.onFinished.addOnce(function () {
        fs.FightControl.isAction = false;
        fs.GameManager.noticeTimeBuilder();
    });
}
/**
 * 重新开始游戏按钮
 */
var RestartButton = qc.defineBehaviour('qc.engine.RestartButton', qc.Behaviour, function() {

}, {
});

RestartButton.prototype.onClick = function(){
    var self = this;

    if(fs.ScenesUI.resultState =="start"){
    	return;
    }

    fs.GameManager.removeTimeBuilder();
    fs.TilePool.list = [];
    fs.BossSkill.skillStepCount = 0;
    fs.BossSkill.bossState = null;
    fs.TaskLogic.gameResult = null;
    fs.ActorAnimation.isActorMove = false;
	fs.ActorAnimation.actorState = null;
	fs.ScenesUI.scorePanelSoundList = [false, false, false];
    // qc.N('floor').removeChildren();
    // qc.N('element').removeChildren();
    // fs.LayerManager.tilesList.element = [];
    // fs.LayerManager.isLock = false;
    // fs.LayerManager.init();
    fs.Game.scene.load("fight", true, function () {
        console.log('Start loading assets.');
    }, function () {
        console.log('Loaded ok.');
    });
    fs.AudioManager.playSound(16);
}
/**
 * descript:游戏中的UI元素
 * author:Sangliang
 * sangliang@supernano.com
 */

var ScenesUI = qc.defineBehaviour('qc.engine.ScenesUI', qc.Behaviour, function () {
    var self = this;

    fs.ScenesUI = self;

    // 游戏步数：到0时决定游戏结束
    self.stepCount = null;

    // 游戏的分数
    self.gameScore = 0;

    // 无聊动作触发点
    self.boringCount = 0;

    // 目标消除数组
    self.isTargetDis = [];

    // 游戏模式
    self.gameMode = null;

    // 游戏评星数组
    self.starScoreList = [];

    //游戏评级
    self.gameLevel = 0;

    // 正在消除的元素flag   以后要用到的
    self.disFlag = [];

    // 计分盘获得星星声音播放数组
    self.scorePanelSoundList = [false, false, false];
}, {
        topBg: qc.Serializer.NODE,          // 顶部背景图片
        gridBg: qc.Serializer.NODE,         // 底部背景图片

        levelIcon: qc.Serializer.NODE,

        juiceUI: qc.Serializer.NODE,       // 果汁模式节点
        bossUI: qc.Serializer.NODE,        // boss目标
        bossHPUI: qc.Serializer.NODE,
        pdUI: qc.Serializer.NODE,          // 饼干模式的饼干目标
        gPd: qc.Serializer.NODE,
        nodePur: qc.Serializer.NODE,       //果汁模式下的目标
        restBg: qc.Serializer.NODE,        //果汁模式下剩余的目标数量

        tipSetting: qc.Serializer.NODE,    //开局任务提示面板
        tips: qc.Serializer.NODE,
        des: qc.Serializer.NODE,           // 消除目标提示
        pauseActive: qc.Serializer.NODE,   //菜单按钮组

        pauseBtn: qc.Serializer.NODE,
        soundBtnOn: qc.Serializer.NODE,    //声音开关
        soundBtnOff: qc.Serializer.NODE,
        soundBgOn: qc.Serializer.NODE,     // 背景音乐开关
        soundBgOff: qc.Serializer.NODE,
        startBtn: qc.Serializer.NODE,
        stop: qc.Serializer.NODE,

        step: qc.Serializer.NODE,          //游戏步数

        scorePanel: qc.Serializer.NODE,     //左上角积分盘

        resultSucessPanel: qc.Serializer.NODE,
        resultFailPanel: qc.Serializer.NODE
    });

ScenesUI.prototype.awake = function () {
    var self = this;
    // 背景图
    self.backGround = {
        topBg: self.topBg,                // 顶部背景图片
        gridBg: self.gridBg               // 底部背景图片
    };

    // 游戏模式过关目标ui
    self.gameModeTarget = {
        step: self.step,
        juiceTarget: {
            ui: self.juiceUI,
            target: self.nodePur,
            rest: self.restBg
        },
        bossTarget: {
            ui: self.bossUI,
            hp: self.bossHPUI
        },
        poAnddgTarget: {
            ui: self.pdUI
        }
    }

    // 按钮管理
    self.buttonsManager = {
        soundBtnOn: self.soundBtnOn,
        soundBtnOff: self.soundBtnOff,
        soundBgOn: self.soundBgOn,
        soundBgOff: self.soundBgOff,
        pauseBtn: self.pauseBtn,
        startBtn: self.startBtn,
        stop: self.stop
    };

    // 提示界面
    self.tipSettingPanel = {
        tipSettingNode: self.tipSetting,
        tips: self.tips,
        des: self.des,
        tipIcon: self.levelIcon
    }

}

/**
 * [getDisTarget 接受被消除的目标]
 * @param  {[obj]} tileObj [被消除的节点]
 */
ScenesUI.prototype.getDisTarget = function (tileObj) {
    // console.info(tileObj);
    // console.log(fs.TaskLogic.taskObj);
    // console.info(tileObj.disCount);
    // console.log(tileObj.class1);
    // console.log(tileObj.class2);
    // console.log(tileObj.class3);
    var self = this;

    self.getScore(tileObj);

    // 果汁模式消除
    if (fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID].type == "juice") {

        if (fs.TaskLogic.taskObj[0].elementID == fs.TaskLogic.taskObj[1].elementID && fs.TaskLogic.taskObj[0].elementNumber > 0 && fs.TaskLogic.taskObj[1].elementNumber > 0) {
            if (fs.TaskLogic.taskObj[0].elementNumber >= fs.TaskLogic.taskObj[1].elementNumber) {
                self.disFlag.push(0);
            } else if (fs.TaskLogic.taskObj[0].elementNumber < fs.TaskLogic.taskObj[1].elementNumber) {
                self.disFlag.push(1);
            }
        } else if (fs.TaskLogic.taskObj[0].elementID == fs.TaskLogic.taskObj[2].elementID && fs.TaskLogic.taskObj[0].elementNumber > 0 && fs.TaskLogic.taskObj[2].elementNumber > 0) {
            if (fs.TaskLogic.taskObj[0].elementNumber >= fs.TaskLogic.taskObj[2].elementNumber) {
                self.disFlag.push(0);
            } else if (fs.TaskLogic.taskObj[0].elementNumber < fs.TaskLogic.taskObj[2].elementNumber) {
                self.disFlag.push(2);
            }
        } else if (fs.TaskLogic.taskObj[1].elementID == fs.TaskLogic.taskObj[2].elementID && fs.TaskLogic.taskObj[1].elementNumber > 0 && fs.TaskLogic.taskObj[2].elementNumber > 0) {
            if (fs.TaskLogic.taskObj[1].elementNumber >= fs.TaskLogic.taskObj[2].elementNumber) {
                self.disFlag.push(1);
            } else if (fs.TaskLogic.taskObj[1].elementNumber < fs.TaskLogic.taskObj[2].elementNumber) {
                self.disFlag.push(2);
            }
        } else {
            self.disFlag = null;
            self.disFlag = [];
        }

        for (var i = 0; i < 3; i++) {
            //豆腐以及其他元素
            if (tileObj.color == fs.TaskLogic.taskObj[i].color && tileObj.class3 == "tile") {
                if ((self.disFlag.length != 0 && self.disFlag[0] == i) || fs.TaskLogic.taskObj[i].elementNumber <= 0) {
                    continue;
                }

                fs.TaskLogic.taskObj[i].elementNumber -= 1;
                var _getNum = (4 - (i + 1));
                fs.ActorAnimation.actorState = "get";
                fs.ActorAnimation.playActorAnimation(_getNum);
                // 播放收集目标的动画
                self.gameScore += 100;

                var ts = self.gameModeTarget.juiceTarget.target.children[i].getScript('qc.TweenScale');
                ts.from = new qc.Point(1, 1);
                ts.to = new qc.Point(1.4, 1.4);
                ts.duration = 0.2;
                ts.resetToBeginning();
                ts.playForward();
                ts.onFinished.addOnce(function () {
                    ts.from = new qc.Point(1.4, 1.4);
                    ts.to = new qc.Point(1, 1);
                    ts.resetToBeginning();
                    ts.playForward();
                });
                // 剩余的目标为0时，加入新的目标元素
                if (fs.TaskLogic.taskObj[i].elementNumber <= 0) {
                    fs.TaskLogic.taskObj[i].class1 = null;
                    if (fs.TaskLogic.restTaskObj.length > 0) {
                        fs.TaskLogic.taskObj[i] = fs.TaskLogic.restTaskObj.pop();
                    } else if (fs.TaskLogic.restTaskObj.length <= 0) {
                        var ts = self.gameModeTarget.juiceTarget.target.children[i].getScript('qc.TweenScale');
                        ts.from = new qc.Point(1, 1);
                        ts.to = new qc.Point(1.4, 1.4);
                        ts.duration = 0.2;
                        ts.resetToBeginning();
                        ts.playForward();
                        ts.onFinished.addOnce(function () {
                            ts.from = new qc.Point(1.4, 1.4);
                            ts.to = new qc.Point(1, 1);
                            ts.resetToBeginning();
                            ts.playForward();
                            ts.onFinished.addOnce(function () {
                                // 补充列表为空时,移出task元素
                                self.gameModeTarget.juiceTarget.target.children[i].visible = false;
                            });
                        });

                    }
                }
                fs.TaskLogic.refreshJuiceTask(self);
                self.isTargetDis.push(true);
                self.boringCount = 0;
                return;
            }

            // 基本元素的消除
            if (tileObj.class1 != null && fs.TaskLogic.taskObj[i].class1 != null) {
                var m = fs.TaskLogic.taskObj[i].class1.indexOf(';');
                if (m != -1) {
                    var task = fs.TaskLogic.taskObj[i].class1.split(';');
                    for (var j = 0; j < task.length; j++) {

                        if (tileObj.class1 == task[j]) {
                            if (tileObj.color == fs.TaskLogic.taskObj[i].color) {
                                if ((self.disFlag.length != 0 && self.disFlag[0] == i) || fs.TaskLogic.taskObj[i].elementNumber <= 0) {
                                    continue;
                                }
                                fs.TaskLogic.taskObj[i].elementNumber -= 1;
                                // 播放收集目标的动画
                                var _getNum = (4 - (i + 1));
                                fs.ActorAnimation.actorState = "get";
                                fs.ActorAnimation.playActorAnimation(_getNum);
                                self.gameScore += 100;

                                var ts = self.gameModeTarget.juiceTarget.target.children[i].getScript('qc.TweenScale');

                                ts.from = new qc.Point(1, 1);
                                ts.to = new qc.Point(1.4, 1.4);
                                ts.duration = 0.2;
                                ts.resetToBeginning();
                                ts.playForward();

                                ts.onFinished.addOnce(function () {
                                    ts.from = new qc.Point(1.4, 1.4);
                                    ts.to = new qc.Point(1, 1);
                                    ts.resetToBeginning();
                                    ts.playForward();
                                });

                                // 剩余的目标为0时，加入新的目标元素
                                if (fs.TaskLogic.taskObj[i].elementNumber <= 0) {
                                    fs.TaskLogic.taskObj[i].class1 = null;
                                    if (fs.TaskLogic.restTaskObj.length > 0) {
                                        fs.TaskLogic.taskObj[i] = fs.TaskLogic.restTaskObj.pop();
                                    } else if (fs.TaskLogic.restTaskObj.length <= 0) {
                                        var ts = self.gameModeTarget.juiceTarget.target.children[i].getScript('qc.TweenScale');

                                        ts.from = new qc.Point(1, 1);
                                        ts.to = new qc.Point(1.4, 1.4);
                                        ts.duration = 0.2;
                                        ts.resetToBeginning();
                                        ts.playForward();

                                        ts.onFinished.addOnce(function () {
                                            ts.from = new qc.Point(1.4, 1.4);
                                            ts.to = new qc.Point(1, 1);
                                            ts.resetToBeginning();
                                            ts.playForward();
                                            ts.onFinished.addOnce(function () {
                                                // 补充列表为空时,移出task元素
                                                self.gameModeTarget.juiceTarget.target.children[i].visible = false;
                                            });
                                        });
                                    }
                                }

                                fs.TaskLogic.refreshJuiceTask(self);
                                self.isTargetDis.push(true);
                                self.boringCount = 0;
                                return;
                            }

                        }

                    }
                }

            }

            if (tileObj.class2 != null && fs.TaskLogic.taskObj[i].class2 != null) {
                var m = fs.TaskLogic.taskObj[i].class2.indexOf(';');
                if (m != -1) {
                    var task = fs.TaskLogic.taskObj[i].class2.split(';');
                    for (var j = 0; j < task.length; j++) {
                        if (tileObj.class2 == task[j]) {
                            if (tileObj.color == fs.TaskLogic.taskObj[i].color) {
                                fs.TaskLogic.taskObj[i].elementNumber -= 1;
                                // 播放收集目标的动画
                                var _getNum = (4 - (i + 1));
                                fs.ActorAnimation.actorState = "get";
                                fs.ActorAnimation.playActorAnimation(_getNum);
                                fs.TaskLogic.refreshJuiceTask(self);
                                self.isTargetDis.push(true);
                                self.boringCount = 0;
                                return;
                            }
                        }
                    }
                }

            }

            if (tileObj.class3 != null && fs.TaskLogic.taskObj[i].class3 != null) {
                var m = fs.TaskLogic.taskObj[i].class3.indexOf(';');
                if (m != -1) {
                    var task = fs.TaskLogic.taskObj[i].class3.split(';');
                } else {
                    var task = fs.TaskLogic.taskObj[i].class3;
                }

                if (tileObj.class3 == task) {
                    if ((self.disFlag.length != 0 && self.disFlag[0] == i) || fs.TaskLogic.taskObj[i].elementNumber <= 0) {
                        continue;
                    }
                    fs.TaskLogic.taskObj[i].elementNumber -= 1;
                    // 播放收集目标的动画
                    var _getNum = (4 - (i + 1));
                    fs.ActorAnimation.actorState = "get";
                    fs.ActorAnimation.playActorAnimation(_getNum);
                    self.gameScore += 100;

                    var ts = self.gameModeTarget.juiceTarget.target.children[i].getScript('qc.TweenScale');
                    ts.from = new qc.Point(1, 1);
                    ts.to = new qc.Point(1.4, 1.4);
                    ts.duration = 0.2;
                    ts.resetToBeginning();
                    ts.playForward();
                    ts.onFinished.addOnce(function () {
                        ts.from = new qc.Point(1.4, 1.4);
                        ts.to = new qc.Point(1, 1);
                        ts.resetToBeginning();
                        ts.playForward();
                    });

                    if (fs.TaskLogic.taskObj[i].elementNumber <= 0) {
                        fs.TaskLogic.taskObj[i].class3 = null;
                        if (fs.TaskLogic.restTaskObj.length > 0) {
                            fs.TaskLogic.taskObj[i] = fs.TaskLogic.restTaskObj.pop();
                        } else if (fs.TaskLogic.restTaskObj.length <= 0) {
                            var ts = self.gameModeTarget.juiceTarget.target.children[i].getScript('qc.TweenScale');

                            ts.from = new qc.Point(1, 1);
                            ts.to = new qc.Point(1.4, 1.4);
                            ts.duration = 0.2;
                            ts.resetToBeginning();
                            ts.playForward();
                            ts.onFinished.addOnce(function () {
                                ts.from = new qc.Point(1.4, 1.4);
                                ts.to = new qc.Point(1, 1);
                                ts.resetToBeginning();
                                ts.playForward();
                                ts.onFinished.addOnce(function () {
                                    // 补充列表为空时,移出task元素
                                    self.gameModeTarget.juiceTarget.target.children[i].visible = false;
                                });
                            });

                        }
                    }
                    fs.TaskLogic.refreshJuiceTask(self);
                    self.isTargetDis.push(true);
                    self.boringCount = 0;
                    return;
                }
            }
            self.disFlag = null;
            self.disFlag = [];
            // 如果执行到这里，说明消除中没有符合要求的元素
            self.isTargetDis.push(false);
        }

    }

    // 鱼片模式
    if (fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID].type == "popsicle") {

        if (tileObj.class3 == "popsicle") {
            if (fs.TaskLogic.taskObj[0].elementNumber > 0) {
                fs.TaskLogic.taskObj[0].elementNumber -= 1;
                self.boringCount = 0;
                fs.ActorAnimation.isActorMove = false;
                fs.ActorAnimation.actorState = "get";
                fs.ActorAnimation.playActorAnimation();
                var ts = self.gPd.getScript('qc.TweenScale');
                ts.from = new qc.Point(1.2, 1.2);
                ts.to = new qc.Point(1.6, 1.6);
                ts.duration = 0.2;
                ts.resetToBeginning();
                ts.playForward();
                ts.onFinished.addOnce(function () {
                    ts.from = new qc.Point(1.6, 1.6);
                    ts.to = new qc.Point(1.2, 1.2);
                    ts.resetToBeginning();
                    ts.playForward();
                    ts.onFinished.addOnce(function () {
                        if (fs.TaskLogic.taskObj[0].elementNumber == 0) {
                            self.gPd.visible = false;
                        }
                    });

                });
                self.isTargetDis.push(true);
            }
            fs.TaskLogic.refreshPopsicleTask(self);
        } else {
            self.isTargetDis.push(false);
        }

    }

    // 饼干模式
    if (fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID].type == "dogfood") {
        if (tileObj.class3 == "cookies") {
            if (fs.TaskLogic.taskObj[0].elementNumber > 0) {
                fs.TaskLogic.taskObj[0].elementNumber -= 1;
                fs.ActorAnimation.actorState = "get";
                fs.ActorAnimation.playActorAnimation();
                var ts = self.gPd.getScript('qc.TweenScale');
                ts.from = new qc.Point(1.2, 1.2);
                ts.to = new qc.Point(1.6, 1.6);
                ts.duration = 0.2;
                ts.resetToBeginning();
                ts.playForward();
                ts.onFinished.addOnce(function () {
                    ts.from = new qc.Point(1.6, 1.6);
                    ts.to = new qc.Point(1.2, 1.2);
                    ts.resetToBeginning();
                    ts.playForward();

                    ts.onFinished.addOnce(function () {
                        if (fs.TaskLogic.taskObj[0].elementNumber == 0) {
                            self.gPd.visible = false;
                        }
                    });
                });
                self.boringCount = 0;
                self.isTargetDis.push(true);
            }
            fs.TaskLogic.refreshDogfoodTask(self);
        } else {
            self.isTargetDis.push(false);
        }
    }

    // boss模式
    if (fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID].type == "trouble") {
        for (var i = 0; i < fs.TaskLogic.taskObj.length; i++) {
            if (tileObj.color == fs.TaskLogic.taskObj[i].color || (tileObj.class3 == fs.TaskLogic.class3 && tileObj.class3 != null)) {

                fs.TaskLogic.bossHP -= 1;
                fs.ActorAnimation.actorState = "get";
                fs.ActorAnimation.playActorAnimation();
                self.boringCount = 0;
                self.isTargetDis.push(true);
                //boss受伤音效
                fs.AudioManager.playSound(8);
            } else {
                self.isTargetDis.push(false);
            }
        }
        fs.TaskLogic.refreshBossTask(self);
    }
}

// 初始化界面UI 在layermanager里面的初始化中调用
ScenesUI.prototype.initLevelUI = function () {
    var self = this;

    // 初始化角色动作
    fs.ActorAnimation.initActorAnimation(self);

    var zoneData = fs.ConfigManager.excelData.zone[fs.ConfigManager.levelID];

    // 给游游戏步数初始化
    self.stepCount = zoneData.step;
    // 初始化步数
    self.gameModeTarget.step.text = zoneData.step.toString();

    self.starScoreList.push(zoneData["star1Score"]);
    self.starScoreList.push(zoneData["star2Score"]);
    self.starScoreList.push(zoneData["star3Score"]);

    // 游戏模式的确定
    var gameMode = zoneData.type;

    self.gameMode = gameMode;

    // 初始化四种模式所需要的元素
    // 果汁模式
    if (gameMode == "juice") {
        // self.actSprite.zhangliang.visible = true;
        self.gameModeTarget.juiceTarget.ui.visible = true;
        fs.TaskLogic.juiceTaskControl(self, zoneData);
        console.log("果汁模式");
    }
    // boss模式
    if (gameMode == "trouble") {
        //self.actSprite.boss.visible = true;
        self.gameModeTarget.bossTarget.ui.visible = true;
        self.gameModeTarget.bossTarget.hp.visible = true;
        fs.TaskLogic.bossTaskControl(self, zoneData);
        console.log("boss模式");
    }
    if (gameMode == "popsicle") {
        //self.actSprite.wangjiaer.visible = true;
        self.gameModeTarget.poAnddgTarget.ui.visible = true;
        fs.TaskLogic.popsicleControl(self, zoneData);
        //fs.AudioManager.playSound(54, true);
        console.log("鱼片模式");
    }

    if (gameMode == "dogfood") {
        //self.actSprite.shenmengcheng.visible = true;
        self.gameModeTarget.poAnddgTarget.ui.visible = true;
        fs.TaskLogic.dogfoodControl(self, zoneData);
        //fs.AudioManager.playSound(49, true);
        console.log("饼干模式");
    }
    // 左上角计分板初始化
    self.scorePanelControl();
}

// stepLogic:步数控制逻辑
ScenesUI.prototype.stepLogic = function () {
    var self = this;

    if (self.stepCount != 0) {
        self.stepCount -= 1;
        self.gameModeTarget.step.text = self.stepCount.toString();
    }
}

// 分数控制
ScenesUI.prototype.getScore = function (disObj) {
    var self = this;

    // 磁铁和彩虹技能
    if (disObj.id == 1031 || disObj.id == 1032) {
        if (fs.GameManager.comboCount == 0) {
            self.gameScore += 2 * disObj.basicScore
        } else {
            self.gameScore += 2 * disObj.basicScore * fs.GameManager.comboCount;
        }
    }

    if (disObj.disCount >= 3) {
        // 分数算法
        var m = Math.ceil(Math.ceil(disObj.basicScore * disObj.scoreMultiple * fs.GameManager.comboCount * (Math.pow((disObj.disCount - 3), 1.25) + 1)) / 10) * 10;
        self.gameScore += m;
    } else {
        if (fs.GameManager.comboCount == 0) {
            self.gameScore += disObj.basicScore * 1 * disObj.scoreMultiple;
        } else {
            self.gameScore += disObj.basicScore * fs.GameManager.comboCount * disObj.scoreMultiple;
        }
    }
}

/**
 * checkIsBoringDis 检测是否为无聊消除
 * @param {array} disList 消除的的消息数组
 */
ScenesUI.prototype.checkIsBoringDis = function () {
    var self = this;
    if (self.isTargetDis.length == 0) {
        return;
    }
    for (var i = 0; i < self.isTargetDis.length; i++) {
        if (self.isTargetDis[i] === true) {
            self.isTargetDis = [];
            return;
        }
    }
    self.boringCount += 1;
    self.isTargetDis = [];
}

/**
 * scorePanelControl : 计分盘逻辑
 */
ScenesUI.prototype.scorePanelControl = function () {
    var self = this;

    var scoreBar = self.scorePanel.find('mask').find('curScore');
    var maskBar = self.scorePanel.find('mask');
    var star1 = self.scorePanel.find('one');
    var star2 = self.scorePanel.find('two');
    var star3 = self.scorePanel.find('three');

    if (fs.TaskLogic.gameResult == "sucess") {
        self.gameScore += self.stepCount * 2500;
        qc.N('tempScoreText').text = self.gameScore.toString();
        //步数减少
        var _timer = fs.Game.timer.loop(100, function () {
            if (self.stepCount > 0) {
                self.stepCount--;
                self.gameModeTarget.step.text = self.stepCount.toString();
            } else {
                fs.Game.timer.remove(_timer);
            }
        });
    }
    if (self.gameScore < self.starScoreList[0]) {
        // 一星以下
        var _percent = self.gameScore / self.starScoreList[0];
        scoreBar.rotation = ((125 - 30 * _percent) * Math.PI / 180);
    }

    if (self.gameScore >= self.starScoreList[0]) {
        // 1到2星的情况
        star1.frame = 'gameboard_yellowStar.png';
        self.gameLevel = 1;
        if (self.scorePanelSoundList[0] == false) {
            fs.AudioManager.playSound(13);
            self.scorePanelSoundList[0] = true;
        }
        var _percent = self.gameScore / self.starScoreList[1];
        scoreBar.rotation = ((95 - 50 * _percent) * Math.PI / 180);
    }
    if (self.gameScore >= self.starScoreList[1]) {
        //2 到 3星之间
        star2.frame = 'gameboard_yellowStar.png';
        self.gameLevel = 2;
        if (self.scorePanelSoundList[1] == false) {
            fs.AudioManager.playSound(14);
            self.scorePanelSoundList[1] = true;
        }
        var _percent = self.gameScore / self.starScoreList[2];
        scoreBar.rotation = ((45 - 45 * _percent) * Math.PI / 180);
    }
    if (self.gameScore >= self.starScoreList[2]) {
        star3.frame = 'gameboard_yellowStar.png';
        self.gameLevel = 3;
        if (self.scorePanelSoundList[2] == false) {
            fs.AudioManager.playSound(15);
            self.scorePanelSoundList[2] = true;
        }
        var _percent = self.gameScore / self.starScoreList[2];
        if (_percent >= 1) {
            _percent = 1;
        }
        scoreBar.rotation = 0;
    }
}

/**
 * tipPanelControl:提示面板
 */
ScenesUI.prototype.tipPanelControl = function () {
    var self = this;

    // 果汁模式
    if (fs.ScenesUI.gameMode == "juice") {
        self.tipSettingPanel.tipIcon.frame = "level_icon_juice.png";
        self.tipSettingPanel.des.find('des1').text = "帮助亮哥收集";

        self.tipSettingPanel.des.find('desNum').text = "" + fs.TaskLogic.taskObj.length + "";
        self.tipSettingPanel.des.find('des2').text = "份食材";
    }

    // 鱼片模式
    if (fs.ScenesUI.gameMode == "popsicle") {
        self.tipSettingPanel.tipIcon.frame = "level_icon_popsicle.png";
        self.tipSettingPanel.des.find('des1').text = "帮Jacson收集";
        console.log(fs.TaskLogic.taskObj);
        self.tipSettingPanel.des.find('desNum').text = "" + fs.TaskLogic.taskObj[0]["elementNumber"] + "";
        self.tipSettingPanel.des.find('des2').text = "份鱼片";
    }

    // 饼干模式
    if (fs.ScenesUI.gameMode == "dogfood") {
        self.tipSettingPanel.tipIcon.frame = "level_icon_cracker.png";
        self.tipSettingPanel.des.find('des1').text = "帮辰辰收集";
        console.log(fs.TaskLogic.taskObj);
        self.tipSettingPanel.des.find('desNum').text = "" + fs.TaskLogic.taskObj[0]["elementNumber"] + "";
        self.tipSettingPanel.des.find('des2').text = "份饼干";
    }

    // boss模式
    if (fs.ScenesUI.gameMode == "trouble") {
        self.tipSettingPanel.tipIcon.frame = "level_icon_boss.png";
        self.tipSettingPanel.des.find('bossTxt').text = "赶走捣乱者!";
    }
}

ScenesUI.prototype.tipPanelTimeout = function(){
    var self = this;
    var _limtTime = 1500;
    var s = fs.Game.timer.add(_limtTime, function () {
        self.tipSettingPanel.tipSettingNode.visible = false;
    });
}

/**
 *boringLogic:角色无聊动作逻辑
 */
ScenesUI.prototype.boringLogic = function () {
    var self = this;

    if (self.boringCount >= 3 && fs.ActorAnimation.isActorMove == false && self.stepCount > 3) {
        if (self.gameMode != 'trouble') {
            fs.ActorAnimation.actorState = "boring";
            fs.ActorAnimation.playActorAnimation();
        } 
    } else if (self.stepCount <= 3 && self.stepCount > 0) {
        if (self.gameMode != 'trouble') {
            fs.ActorAnimation.actorState = "nervous";
            fs.ActorAnimation.playActorAnimation();
        } 
    }
}

/**
 * resultPanel:分数结算
 */
ScenesUI.prototype.resultControl = function (gameResult) {
    var self = this;

    var normalScale = 1;
    var bigScale = 1.4;
    var duration = 0.1;

    self.resultState = "start";
    fs.GameManager.removeTimeBuilder();

    if (gameResult == "fail") {
        // 播放失败音乐
        fs.AudioManager.playSound(52);
        fs.GameManager.stop();
        self.resultFailPanel.visible = true;

        self.resultState = "complete";

    } else if (gameResult == "sucess") {
        fs.AudioManager.stopSound(0);
        // 播放胜利音乐
        fs.AudioManager.playSound(51);
        fs.GameManager.stop();
        self.resultSucessPanel.visible = true;

        if (self.gameLevel == 0){
             self.resultState = "complete";
        }

        if (self.gameLevel == 1) {
            fs.Game.timer.add(500, function () {
                self.resultSucessPanel.find('starBg').children[0].frame = 'start_1.png';
                var ts1 = self.resultSucessPanel.find('starBg').children[0].getScript('qc.TweenScale');

                ts1.from = new qc.Point(normalScale, normalScale);
                ts1.to = new qc.Point(bigScale, bigScale);
                ts1.resetToBeginning();
                ts1.playForward();
                ts1.duration = duration;

                ts1.onFinished.addOnce(function () {
                    ts1.from = new qc.Point(bigScale, bigScale);
                    ts1.to = new qc.Point(normalScale, normalScale);
                    ts1.resetToBeginning();
                    ts1.playForward();
                     self.resultState = "complete";
                });

                fs.AudioManager.playSound(118);
            });
        }

        if (self.gameLevel == 2) {

            fs.Game.timer.add(500, function () {
                self.resultSucessPanel.find('starBg').children[0].frame = 'start_1.png';
                fs.AudioManager.playSound(118);

                var ts1 = self.resultSucessPanel.find('starBg').children[0].getScript('qc.TweenScale');

                ts1.from = new qc.Point(normalScale, normalScale);
                ts1.to = new qc.Point(bigScale, bigScale);
                ts1.resetToBeginning();
                ts1.playForward();
                ts1.duration = duration;

                ts1.onFinished.addOnce(function () {
                    ts1.from = new qc.Point(bigScale, bigScale);
                    ts1.to = new qc.Point(normalScale, normalScale);
                    ts1.resetToBeginning();
                    ts1.playForward();
                });

            });

            fs.Game.timer.add(900, function () {
                self.resultSucessPanel.find('starBg').children[1].frame = 'start_1.png';

                var ts2 = self.resultSucessPanel.find('starBg').children[1].getScript('qc.TweenScale');

                ts2.from = new qc.Point(normalScale, normalScale);
                ts2.to = new qc.Point(bigScale, bigScale);
                ts2.resetToBeginning();
                ts2.playForward();
                ts2.duration = duration;

                ts2.onFinished.addOnce(function () {
                    ts2.from = new qc.Point(bigScale, bigScale);
                    ts2.to = new qc.Point(normalScale, normalScale);
                    ts2.resetToBeginning();
                    ts2.playForward();
                     self.resultState = "complete";
                });

                fs.AudioManager.playSound(119);
            });
        }

        if (self.gameLevel == 3) {
            fs.Game.timer.add(500, function () {
                self.resultSucessPanel.find('starBg').children[0].frame = 'start_1.png';
                fs.AudioManager.playSound(118);

                var ts1 = self.resultSucessPanel.find('starBg').children[0].getScript('qc.TweenScale');

                ts1.from = new qc.Point(normalScale, normalScale);
                ts1.to = new qc.Point(bigScale, bigScale);
                ts1.resetToBeginning();
                ts1.playForward();
                ts1.duration = duration;

                ts1.onFinished.addOnce(function () {
                    ts1.from = new qc.Point(bigScale, bigScale);
                    ts1.to = new qc.Point(normalScale, normalScale);
                    ts1.resetToBeginning();
                    ts1.playForward();
                });

            });

            fs.Game.timer.add(900, function () {
                self.resultSucessPanel.find('starBg').children[1].frame = 'start_1.png';
                fs.AudioManager.playSound(119);

                var ts2 = self.resultSucessPanel.find('starBg').children[1].getScript('qc.TweenScale');

                ts2.from = new qc.Point(normalScale, normalScale);
                ts2.to = new qc.Point(bigScale, bigScale);
                ts2.resetToBeginning();
                ts2.playForward();
                ts2.duration = duration;

                ts2.onFinished.addOnce(function () {
                    ts2.from = new qc.Point(bigScale, bigScale);
                    ts2.to = new qc.Point(normalScale, normalScale);
                    ts2.resetToBeginning();
                    ts2.playForward();
                });

            });
            fs.Game.timer.add(1300, function () {
                self.resultSucessPanel.find('starBg').children[2].frame = 'start_1.png';
                fs.AudioManager.playSound(120);

                var ts3 = self.resultSucessPanel.find('starBg').children[2].getScript('qc.TweenScale');

                ts3.from = new qc.Point(normalScale, normalScale);
                ts3.to = new qc.Point(bigScale, bigScale);
                ts3.resetToBeginning();
                ts3.playForward();
                ts3.duration = duration;

                ts3.onFinished.addOnce(function () {
                    ts3.from = new qc.Point(bigScale, bigScale);
                    ts3.to = new qc.Point(normalScale, normalScale);
                    ts3.resetToBeginning();
                    ts3.playForward();
                });
                 self.resultState = "complete";
            });
        }
    }
}

}).call(this, this, Object);
