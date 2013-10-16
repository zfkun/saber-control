/**
 * Saber UI
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件基类
 * @author zfkun(zfkun@msn.com)
 */

define(function ( require ) {
    var Emitter = require( 'saber-emitter' );
    var counter = 0x861005;

    /**
     * 控件基类
     * 
     * 禁止实例化，只能继承
     * @constructor
     * @exports Control
     * @fires module:Control#beforeinit
     * @fires module:Control#afterinit
     * @fires module:Control#beforerender
     * @fires module:Control#afterrender
     * @fires module:Control#beforedispose
     * @fires module:Control#afterdispose
     * @fires module:Control#show
     * @fires module:Control#hide
     * @param {Object} options 初始化配置参数
     */
    var Control = function ( options ) {
        this.initialize.apply( this, arguments );
    };

    Control.prototype = {

        constructor: Control,

        /**
         * 控件类型标识
         * 
         * @private
         * @type {string}
         */
        type: 'Control',

        /**
         * 控件可用状态
         * 
         * @type {boolean}
         */
        disabled: false,

        /**
         * 控件可见状态
         * 
         * @type {boolean}
         */
        hidden: false,

        /**
         * 初始化控件选项
         *
         * @param {Object} options 构造函数传入的选项
         * @protected
         */
        initOptions: function ( options ) {
            options = options || {};

            var key, val;
            for ( key in options ) {
                if ( !Object.prototype.hasOwnProperty.call( options, key ) ) {
                    continue;
                }

                val = options[ key ];

                if ( /^on[A-Z]/.test( key ) && isFunction( val ) ) {
                    // 移除on前缀，并转换第3个字符为小写，得到事件类型
                    this.on(
                        key.charAt( 2 ).toLowerCase() + key.slice( 3 ),
                        val
                    );
                    delete options[ key ];
                }
            }

            this.setProperties( options );
        },

        /**
         * 控件初始化
         * 
         * @param {Object} options 配置参数
         * @fires module:Control#beforeinit
         * @fires module:Control#afterinit
         * @protected
         */
        initialize: function ( options ) {
            var self = this;
            
            options = options || {};

            self.initOptions( options );

            /**
             * @event module:Control#beforeinit
             */
            self.emit( 'beforeinit' );

            if ( !self.id && !options.id ) {
                self.id = getGUID();
            }

            self.children = [];

            self.main = options.main ? options.main : self.createMain();

            if ( isFunction( self.init ) ) {
                self.init( options );
            }

            /**
             * @event module:Control#afterinit
             */
            self.emit( 'afterinit' );
        },

        /**
         * 创建控件主元素
         * 
         * @return {HTMLElement}
         * @protected
         */
        createMain: function() {
            return document.createElement('div');
        },

        /**
         * 渲染控件
         * 
         * @abstract
         * @protected
         * @fires module:Control#beforerender
         * @fires module:Control#afterrender
         */
        render: function () {
            throw new Error( 'not implement render' );
        },

        // repaint: function() {
        //     throw new Error( 'not implement repaint' );  
        // },

        /**
         * 销毁控件
         * 
         * @public
         * @fires module:Control#beforedispose
         * @fires module:Control#afterdispose
         */
        dispose: function () {
            /**
             * @event module:Control#beforedispose
             */
            this.emit( 'beforedispose' );

            var child;
            while ( ( child = this.children.pop() ) ) {
                child.dispose();
            }

            /**
             * @event module:Control#afterdispose
             */
            this.emit( 'afterdispose' );
        },

        /**
         * 将控件添加到页面元素中
         * 
         * @public
         * @param {HTMLElement=} wrap 被添加到的页面元素
         */
        appendTo: function ( wrap ) {
            this.main = wrap || this.main;
            this.render();
        },

        /**
         * 设置控件状态为启用
         * 
         * @public
         * @fires module:Control#enable
         */
        enable: function () {
            this.disabled = false;

            /**
             * @event module:Control#enable
             */
            this.emit( 'enable' );
        },

        /**
         * 设置控件状态为禁用
         * 
         * @public
         * @fires module:Control#disable
         */
        disable: function () {
            this.disabled = true;

            /**
             * @event module:Control#disable
             */
            this.emit( 'disable' );
        },

        /**
         * 判断控件是否不可用
         * 
         * @return {boolean}
         * @public
         */
        isDisabled: function () {
            return this.disabled;
        },

        /**
         * 设置控件禁用状态
         * 
         * @param {boolean} disabled 是否禁用
         * @public
         */
        setDisabled: function ( disabled ) {
            this[ disabled ? 'disable' : 'enable' ]();
        },

        /**
         * 设置控件状态为可见
         * 
         * @public
         * @fires module:Control#show
         */
        show: function() {
            this.hidden = false;

            /**
             * @event module:Control#show
             */
            this.emit( 'show' );
        },

        /**
         * 设置控件状态为不可见
         * 
         * @public
         * @fires module:Control#hide
         */
        hide: function() {
            this.hidden = true;

            /**
             * @event module:Control#hide
             */
            this.emit( 'hide' );
        },

        /**
         * 判断控件是否不可见
         * 
         * @return {boolean}
         * @public
         */
        isHidden: function() {
            return this.hidden;
        },

        /**
         * 设置控件不可见状态
         * 
         * @param {boolean} disabled 是否不可见
         * @public
         */
        setHidden: function( hidden ) {
            this[ hidden ? 'hide' : 'show' ]();
        },




        /**
         * 获取控件属性
         * 
         * 控件属性分成 核心属性、关键信息属性、数据信息属性
         * @param {string} name 属性名
         * @return {*} 返回目标属性的值
         * @public
         */
        get: function ( name ) {
            var method = this[ 'get' + lib.pascalize( name ) ];

            if ( 'function' === typeof method ) {
                return method.call( this );
            }

            return this[ name ];
        },

        /**
         * 设置控件属性
         * 
         * @param {string} name 属性名
         * @param {*} value 属性值
         * @public
         */
        set: function ( name, value ) {
            var method = this[ 'set' + toPascalize( name ) ];

            if ( 'function' === typeof method ) {
                return method.call( this, value );
            }

            var property = {};
            property[ name ] = value;
            this.setProperties( property );
        },

        /**
         * 批量设置控件的属性值
         * 
         * @param {Object} properties 属性值集合
         * @public
         */
        setProperties: function ( properties ) {
            // TODO
        },




        /**
         * 获取命名子控件
         *
         * @public
         * @param {string} childName 子控件名
         * @return {module:Control} 获取到的子控件 
         */
        getChild: function( childName ) {
            // TODO
        },

        /**
         * 批量初始化子控件
         * 
         * @public
         * @param {HTMLElement} wrap 容器DOM元素
         */
        initChildren: function ( wrap ) {
            // TODO
        },

        /**
         * 添加子控件
         * 
         * @public
         * @param {module:Control} control 控件实例
         * @param {string=} childName 子控件名
         */
        addChild: function ( control, childName ) {
            // TODO
        },

        /**
         * 移除子控件
         * 
         * @public
         * @param {module:Control} control 子控件实例
         */
        removeChild: function ( control ) {
            // TODO
        }

    };

    // 混入 Emitter 支持
    Emitter.mixin( Control.prototype );


    /**
     * 生成继承自己的新类
     * 
     * @return {[type]} [return description]
     */
    Control.inherits = function ( subClass ) {
        return inherits( subClass, Control );
    };


    /**
     * 数组切片方法
     * 
     * @inner
     * @param {Array} array 输入数组或类数组
     * @param {number} startIndex 切片的开始索引
     * @param {number} endIndex 切片的结束索引
     * 
     * @return {Array} 新的数组
     */
    var slice = generic( Array.prototype.slice );


    /**
     * 生成全局唯一id
     * 
     * @inner
     * @param {string=} prefix 前缀
     * @return {string} 新唯一id字符串
     */
    function getGUID( prefix ) {
        prefix = prefix || 'sui';
        return prefix + counter++;
    }

    /**
     * 判断是否为字符串
     * 
     * @inner
     * @param {*} obj 目标对象
     * @return {boolean}
     */
    function isString( obj ) {
        return '[object String]' === Object.prototype.toString.call( obj );
    }

    /**
     * 判断是否为函数
     * 
     * @inner
     * @param {*} obj 目标对象
     * @return {boolean}
     */
    function isFunction( obj ) {
        return '[object Function]' === Object.prototype.toString.call( obj );
    }



    /**
     * 将字符串转换成camel格式
     * 
     * @inner
     * @param {string} source 源字符串
     * @return {string}
     */
    function toCamelize( source ) {
        if ( !isString( source ) || !source ) {
            return '';
        }

        return source.replace( 
            /-([a-z])/g,
            function ( alpha ) {
                return alpha.toUpperCase();
            }
        );
    }

    /**
     * 将字符串转换成pascal格式
     * 
     * @inner
     * @param {string} source 源字符串
     * @return {string}
     */
    function toPascalize( source ) {
        if ( !isString( source ) || !source ) {
            return '';
        }

        return source.charAt( 0 ).toUpperCase()
            + toCamelize( source.slice( 1 ) );
    }

    /**
     * 方法静态化
     * 
     * 反绑定、延迟绑定
     * @inner
     * @param {Function} method 待静态化的方法
     * 
     * @return {Function} 静态化包装后方法
     */
    function generic( method ) {
        return function () {
            return Function.call.apply( method, arguments );
        };
    }

    /** 
     * 为函数提前绑定参数（柯里化）
     * 
     * @see http://en.wikipedia.org/wiki/Currying
     * @method module:lib.fn.curry
     * @param {Function} fn 要绑定的函数
     * @param {...args=} args 函数执行时附加到执行时函数前面的参数
     *
     * @return {Function} 封装后的函数
     */
    function curry( fn ) {
        var args = slice( arguments, 1 );
        return function () {
            return fn.apply(
                this, args.concat( slice( arguments ) )
            );
        };
    }


    /**
     * 为类型构造器建立继承关系
     * 
     * @inner
     * @param {Function} subClass 子类构造器
     * @param {Function} superClass 父类构造器
     */
    function inherits( subClass, superClass ) {
        var Empty = function () {};
        Empty.prototype = superClass.prototype;
        var selfPrototype = subClass.prototype;
        var proto = subClass.prototype = new Empty();

        for (var key in selfPrototype) {
            proto[key] = selfPrototype[key];
        }

        proto.constructor = subClass;
        proto.parent = curry( parent, superClass );
        subClass.superClass = superClass.prototype;

        return subClass;
    }

    /**
     * 调用父类方法
     * 
     * @inner
     * @param {Class} superClass 父类
     * @param {string} methodName 父类方法名
     */
    function parent( superClass, methodName ) {
        var method = superClass.prototype[ methodName ];
        if ( method ) {
            return method.apply( this, [].slice.call( arguments, 2 ) );
        }
        throw new Error( 'parent Class has no method named ' + methodName );
    }

    return Control;
});

