/**
 * Saber UI
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件基类
 * @author zfkun(zfkun@msn.com)
 */

define(function ( require ) {

    var lang = require( 'saber-lang' );
    var dom = require( 'saber-dom' );
    var emitter = require( 'saber-emitter' );
    var ui = require( 'saber-ui' );
    var helper = require( './helper' );


    /**
     * 控件基类
     * 禁止实例化，只能继承
     * 
     * @constructor
     * @exports Control
     * @class
     * @mixes Emitter
     * @requires saber-lang
     * @requires saber-dom
     * @requires saber-emitter
     * @requires saber-ui
     * @requires saber-control/helper
     * @fires Control#
     * @fires Control#beforeinit
     * @fires Control#init
     * @fires Control#afterinit
     * @fires Control#beforerender
     * @fires Control#afterrender
     * @fires Control#beforedispose
     * @fires Control#afterdispose
     * @fires Control#show
     * @fires Control#hide
     * @fires Control#enable
     * @fires Control#disable
     * @fires Control#propertychange
     * @param {Object=} options 初始化配置参数
     * @param {string=} options.id 控件标识
     * @param {HTMLElement=} options.main 控件主元素
     * @param {string=} options.skin 控件皮肤
     * @param {*=} options.* 其余初始化参数由各控件自身决定
     */
    var Control = function () {
        this.initialize.apply( this, arguments );
    };

    Control.prototype = {

        // 修复构造器引用
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
         * @protected
         * @param {Object} options 构造函数传入的选项
         * @param {string=} options.id 控件标识
         * @param {HTMLElement=} options.main 控件主元素
         * @param {string=} options.skin 控件皮肤
         * @param {*=} options.* 其余初始化参数由各控件自身决定
         */
        initOptions: function ( options ) {
            // 处理`onxxx`形式的监听方法参数
            var key, val;
            for ( key in options ) {
                if ( !options.hasOwnProperty( key ) ) {
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

            // 感觉插件机制越搞越像扩展机制了~~~~~
            // 目前，插件初始化配置信息存储在`plugin`对象里
            // 而插件配置信息，不需要作为控件的属性存在
            // 仅保留在初始化配置对象`this.options`内即可，
            // 各插件根据需要，自行获取，则：
            // 1. 这里先从初始化`options`对象里取出
            var pluginOptions = options.plugin;
            delete options.plugin;

            // 2. 待属性设置器`setProperties`操作完成后
            // 这里做了下对象克隆，以防各种不可预知的覆盖错误
            this.options = lang.extend( {}, options );
            this.setProperties( this.options );

            // 3. 再追加回来插件配置集对象`plugin`
            if ( pluginOptions ) {
                this.options.plugin = pluginOptions;
            }
        },

        /**
         * 控件初始化
         * 
         * @protected
         * @param {Object=} options 构造函数传入的配置参数
         * @param {string=} options.id 控件标识
         * @param {HTMLElement=} options.main 控件主元素
         * @param {string=} options.skin 控件皮肤
         * @param {*=} options.* 其余初始化参数由各控件自身决定
         * @fires Control#beforeinit
         * @fires Control#init
         * @fires Control#afterinit
         */
        initialize: function ( options ) {

            if ( this.initialized ) return;

            this.childrenIndex = {};
            this.children = [];
            this.states = {};

            options = options || {};

            this.initOptions( options );

            /**
             * @event Control#beforeinit
             * @param {Object} ev 事件参数对象
             * @param {string} ev.type 事件类型
             * @param {Control} ev.target 触发事件的控件对象
             */
            this.emit( 'beforeinit' );

            if ( !this.id && !options.id ) {
                this.id = helper.getGUID();
            }

            this.main = options.main ? options.main : this.createMain();

            // 存储实例
            ui.add( this );

            if ( isFunction( this.init ) ) {
                this.init( options );
            }

            /**
             * @event Control#init
             * @param {Object} ev 事件参数对象
             * @param {string} ev.type 事件类型
             * @param {Control} ev.target 触发事件的控件对象
             */
            this.emit( 'init' );

            /**
             * @event Control#afterinit
             * @param {Object} ev 事件参数对象
             * @param {string} ev.type 事件类型
             * @param {Control} ev.target 触发事件的控件对象
             */
            this.emit( 'afterinit' );

            this.initialized = true;
        },

        /**
         * 创建控件主元素
         * 
         * @protected
         * @return {HTMLElement}
         */
        createMain: function () {
            return document.createElement('div');
        },

        /**
         * 初始化DOM结构，仅在第一次渲染时调用
         * 
         * @protected
         */
        initStructure: function () {
        },

        /**
         * 渲染控件
         * 
         * @protected
         * @fires Control#beforerender
         * @fires Control#afterrender
         */
        render: function () {
            var rendered = this.rendered;

            if ( !rendered ) {
                this.rendered = true;

                /**
                 * @event Control#beforerender
                 * @param {Object} ev 事件参数对象
                 * @param {string} ev.type 事件类型
                 * @param {Control} ev.target 触发事件的控件对象
                 */
                this.emit( 'beforerender' );

                // DOM相关初始化
                this.initStructure();

                // 确保控件主元素插入到DOM树中
                // 这里根据`this.options.main`分2种情况:
                // 1. 非空
                //    a. `initialize`时传入了`main`
                //    b. `appendTo`或`insertBefore`调用过 
                // 2. 为空
                //    则主元素是由`createMain`方法自动构建生成
                // 
                // 若 情况2 则再检查主元素是否的确不在DOM树中, 不是则插入
                // 
                // TODO: 这里直接通过`body.contains`验证, 想到更好的替换之
                if ( !this.options.main
                    && !document.body.contains( this.main ) ) {
                    document.body.appendChild( this.main );
                }

                // 为控件主元素添加id属性
                if ( !this.main.id ) {
                    this.main.id = helper.getId( this );
                }

                // 为控件主元素添加控件实例标识属性
                this.main.setAttribute(
                    ui.getConfig( 'instanceAttr' ),
                    this.id
                );

                // 为控件主元素添加控件相关的class
                helper.addPartClasses( this );
            }

            // 由子类根据需要覆盖扩展
            this.repaint();

            if ( !rendered ) {
                /**
                 * @event Control#afterrender
                 * @param {Object} ev 事件参数对象
                 * @param {string} ev.type 事件类型
                 * @param {Control} ev.target 触发事件的控件对象
                 */
                this.emit( 'afterrender' );
            }
        },

        /**
         * 重新渲染视图
         * 首次渲染时, 不传入变更属性集合参数
         * 
         * @protected
         * @param {Object=} changes 变更过的属性的集合
         */
        repaint: function ( changes ) {
            var method;

            if ( !changes || changes.hasOwnProperty( 'disabled' ) ) {
                method = this.disabled ? 'addState' : 'removeState';
                this[ method ]( 'disabled' );
            }

            if ( !changes || changes.hasOwnProperty( 'hidden' ) ) {
                method = this.hidden ? 'addState' : 'removeState';
                this[ method ]( 'hidden' );
            }
        },

        /**
         * 销毁控件
         * 
         * @public
         * @fires Control#beforedispose
         * @fires Control#afterdispose
         */
        dispose: function () {
            if ( this.disposed ) {
                return;
            }

            /**
             * @event Control#beforedispose
             * @param {Object} ev 事件参数对象
             * @param {string} ev.type 事件类型
             * @param {Control} ev.target 触发事件的控件对象
             */
            this.emit( 'beforedispose' );

            helper.dispose( this );

            /**
             * @event Control#afterdispose
             * @param {Object} ev 事件参数对象
             * @param {string} ev.type 事件类型
             * @param {Control} ev.target 触发事件的控件对象
             */
            this.emit( 'afterdispose' );

            // 清理绑定的插件
            ui.disposePlugin( this );

            // 清理自定义事件和监听器
            this.off();

            // 做标记
            this.disposed = true;
        },

        /**
         * 将控件添加到页面元素中
         * 
         * @public
         * @param {HTMLElement} wrap 控件要添加到的目标元素
         */
        appendTo: function ( wrap ) {
            // this.main = wrap || this.main;
            wrap.appendChild( this.main );
            this.render();
        },

        /**
         * 将控件添加到页面的某个元素之前
         * 
         * @public
         * @param {HTMLElement} reference 控件要添加到之前的目标元素
         */
        insertBefore: function( reference ) {
            reference.parentNode.insertBefore( this.main, reference );
            this.render();
        },

        /**
         * 设置控件状态为启用
         * 
         * @public
         * @fires Control#enable
         */
        enable: function () {
            if ( !this.isDisabled() ) {
                return;
            }

            this.removeState( 'disabled' );

            /**
             * @event Control#enable
             * @param {Object} ev 事件参数对象
             * @param {string} ev.type 事件类型
             * @param {Control} ev.target 触发事件的控件对象
             */
            this.emit( 'enable' );
        },

        /**
         * 设置控件状态为禁用
         * 
         * @public
         * @fires Control#disable
         */
        disable: function () {
            if ( this.isDisabled() ) {
                return;
            }

            this.addState( 'disabled' );

            /**
             * @event Control#disable
             * @param {Object} ev 事件参数对象
             * @param {string} ev.type 事件类型
             * @param {Control} ev.target 触发事件的控件对象
             */
            this.emit( 'disable' );
        },

        /**
         * 判断控件是否不可用
         * 
         * @public
         * @return {boolean}
         */
        isDisabled: function () {
            return this.hasState( 'disabled' );
        },

        /**
         * 设置控件禁用状态
         * 
         * @public
         * @param {boolean} disabled 是否禁用
         */
        setDisabled: function ( disabled ) {
            this[ disabled ? 'disable' : 'enable' ]();
        },

        /**
         * 设置控件状态为可见
         * 
         * @public
         * @fires Control#show
         */
        show: function() {
            if ( !this.isHidden() ) {
                return;
            }

            this.removeState( 'hidden' );

            /**
             * @event Control#show
             * @param {Object} ev 事件参数对象
             * @param {string} ev.type 事件类型
             * @param {Control} ev.target 触发事件的控件对象
             */
            this.emit( 'show' );
        },

        /**
         * 设置控件状态为不可见
         * 
         * @public
         * @fires Control#hide
         */
        hide: function() {
            if ( this.isHidden() ) {
                return;
            }

            this.addState( 'hidden' );

            /**
             * @event Control#hide
             * @param {Object} ev 事件参数对象
             * @param {string} ev.type 事件类型
             * @param {Control} ev.target 触发事件的控件对象
             */
            this.emit( 'hide' );
        },

        /**
         * 切换控件可见状态
         * 
         * @public
         */
        toggle: function () {
            this[ this.isHidden() ? 'show' : 'hide' ]();
        },

        /**
         * 判断控件是否不可见
         * 
         * @public
         * @return {boolean}
         */
        isHidden: function() {
            return this.hasState( 'hidden' );
        },

        /**
         * 设置控件不可见状态
         * 
         * @public
         * @param {boolean} disabled 是否不可见
         */
        setHidden: function( hidden ) {
            this[ hidden ? 'hide' : 'show' ]();
        },




        /**
         * 获取控件属性
         * 控件属性分成 核心属性、关键信息属性、数据信息属性
         * 
         * @public
         * @param {string} name 属性名
         * @return {*} 返回目标属性的值
         */
        get: function ( name ) {
            var method = this[ 'get' + toPascalize( name ) ];

            if ( 'function' === typeof method ) {
                return method.call( this );
            }

            return this[ name ];
        },

        /**
         * 设置控件属性
         * 
         * @public
         * @param {string} name 属性名
         * @param {*} value 属性值
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
         * @public
         * @param {Object} properties 属性值集合
         * @fires Control#propertychange
         */
        setProperties: function ( properties ) {
            // 确保只有在渲染以前（`initOptions`调用时）才允许设置id
            if ( !this.rendered ) {
                if ( properties.hasOwnProperty( 'id' ) ) {
                    this.id = properties.id;
                }

                if ( properties.hasOwnProperty( 'skin' ) ) {
                    this.skin = properties.skin;
                }
            }

            delete properties.id;
            delete properties.skin;


            // 确保几个状态选项值为`boolean`类型
            // `diabled`, `hidden`
            [ 'disabled', 'hidden' ].forEach( function ( k ) {
                if ( properties.hasOwnProperty( k ) ) {
                    // 静态化构建时，所有属性值从DOM属性而来，均是字符串
                    // 用正则，而没用`!!`，是因为：
                    // 子控件万一需要设置属性默认值为`true`时
                    // 如果静态话配置是`'false'`时，`!!'false'`就失效了为`true`
                    // TODO：找到更好的方式后再替换
                    // properties[ k ] = !!properties[ k ];
                    properties[ k ] = /\s?true\s?/i.test( properties[ k ] );
                }
            });

            var changes = {}, hasChanged, oldValue, newValue;
            for ( var key in properties ) {
                if ( properties.hasOwnProperty( key ) ) {
                    oldValue = this[ key ];
                    newValue = properties[ key ];
                    
                    if ( oldValue !== newValue ) {
                        this[ key ] = newValue;

                        changes[ key ] = {
                            name: key,
                            oldValue: oldValue,
                            newValue: newValue
                        };

                        hasChanged = true;
                    }
                }
            }

            if ( hasChanged ) {
                // render后的属性变化，可能会引起重绘
                if ( this.rendered ) {
                    this.repaint( changes );
                }

                /**
                 * @event Control#propertychange
                 * @param {Object} ev 事件参数对象
                 * @param {string} ev.type 事件类型
                 * @param {Control} ev.target 触发事件的控件对象
                 * @param {Object} changes 变更过的属性的集合
                 */
                this.emit( 'propertychange', changes );
            }
        },




        /**
         * 获取命名子控件
         *
         * @public
         * @param {string} childName 子控件名
         * @return {?Control} 获取到的子控件 
         */
        getChild: function( childName ) {
            return this.childrenIndex[ childName ] || null;
        },

        /**
         * 批量初始化子控件
         * 
         * @public
         * @param {HTMLElement} wrap 容器DOM元素
         */
        initChildren: function ( wrap ) {
            // 未指定父容器元素时，这里暂时采用共享主控元素
            // TODO 像`Button`控件得考虑适当调整(主控元素为<button>自身)
            wrap = wrap || this.main;

            // 生成初始化配置
            // TODO
            //     这里暂时从父控件的`options`获取
            //     视情况定是否采用`esui`的`renderOptions`方式
            var options = lang.extend( {}, this.options );
            options.parent = this;

            ui.init( wrap, options );
        },

        /**
         * 添加子控件
         * 
         * @public
         * @param {Control} control 控件实例
         * @param {string=} childName 子控件名
         */
        addChild: function ( control, childName ) {
            childName = childName || control.childName;

            // 若控件已存在父控件，先断开关系
            if ( control.parent ) {
                control.parent.removeChild( control );
            }

            // 加入子控件列表，并存储父控件引用
            this.children.push( control );
            control.parent = this;

            // 如果指定了控件名
            // 则给子控件存储此命名，且加入父控件的具名子控件索引
            if ( childName ) {
                control.childName = childName;
                this.childrenIndex[ childName ] = control;
            }
        },

        /**
         * 移除子控件
         * 
         * @public
         * @param {Control} control 子控件实例
         */
        removeChild: function ( control ) {
            // 从子控件树列表中移除
            var children = this.children;
            var size = children.length;
            while ( size-- ) {
                if ( children[ size ] === control ) {
                    children.splice( size, 1);
                    // 上面移除了一项，这里修正下下个索引
                    // 正常情况下，子控件不可能重复添加
                    // 这里的优化其实不一定有太大作用
                    // 看情况是否保留 或者 直接 `break`
                    size--;
                }
            }

            // 从具名子控件索引中移除
            var childName = control.childName;
            if ( childName ) {
                this.childrenIndex[ childName ] = null;
            }

            // 断开与父控件的关系
            control.parent = null;
        },


        /**
         * 添加控件状态
         * 
         * @public
         * @param {string} state 状态名
         */
        addState: function ( state ) {
            if ( this.hasState( state ) ) return;
            this.states[ state ] = 1;

            if ( state === 'disabled' ) {
                this.main.setAttribute( state, state );
            }

            helper.addStateClasses( this, state );

            var properties = {};
            properties[ state ] = true;
            this.setProperties( properties );
        },

        /**
         * 移除控件状态
         * 
         * @public
         * @param {string} state 状态名
         */
        removeState: function ( state ) {
            if ( !this.hasState( state ) ) return;
            delete this.states[ state ];

            if ( state === 'disabled' ) {
                this.main.removeAttribute( state );
            }

            helper.removeStateClasses( this, state );

            var properties = {};
            properties[ state ] = false;
            this.setProperties( properties );
        },

        /**
         * 切换控件指定状态
         * 
         * @public
         * @param {string} state 状态名
         */
        toggleState: function ( state ) {
            this[
                this.hasState( state )
                ? 'removeState'
                : 'addState'
            ]( state );
        },

        /**
         * 判断控件是否处于指定状态
         * 
         * @public
         * @param {string} state 状态名
         * @return {boolean}
         */
        hasState: function( state ) {
            return !!this.states[ state ];
        }

    };


    // 混入 emitter 支持
    emitter.mixin( Control.prototype );


    
    /**
     * Control原型的emit方法引用
     * 其是`Emitter`的`emit`方法`mixin`复制而来
     * 
     * @inner
     * @type {Function}
     */
    var orignEmit = Control.prototype.emit;
    
    /**
     * 触发自定义事件
     * 注: 监听器方法调用时第一个参数为
     *    { `type`: 事件类型, `target`: 触发事件的控件对象 }
     * 
     * @override
     * @param {string} type 事件名
     * @param {...*} * 传递给监听器的参数，可以有多个
     * @example
     * // 很多类型事件监听的场景下，可共享同一个 handler 简化代码
     * var handler = function( ev ) {
     *     var args = [].slice.call( arguments, 1 );
     *     console.info( 'event[%s]: ', ev.type, args );
     * };
     * var b = new Button( { content: 'test', onInit: handler } );
     * b.on( 'propertychange', handler);
     * b.render();
     * b.set( 'content', 'foo' );
     * @return {Emitter}
     */
    Control.prototype.emit = function ( type ) {
        // 构造事件参数对象
        var ev = { type: type, target: this };
        
        // 构造新调用参数序列
        var args = [ ev ].concat( [].slice.call( arguments, 1 ) );

        // 先调用直接写在实例上的 "onxxx"
        var handler = this[ 'on' + type ];
        if ( 'function' === typeof handler ) {
            handler.apply( this, args );
        }

        // 然后调用 `Emitter`.`emit` 方法
        // 使用调整后的新参数序列:
        // `type`, `ev`, `args`...
        orignEmit.apply( this, [ type ].concat( args ) );
    };






    var toString = Object.prototype.toString;


    /**
     * 判断是否为字符串
     * 
     * @inner
     * @param {*} obj 目标对象
     * @return {boolean}
     */
    function isString( obj ) {
        return '[object String]' === toString.call( obj );
    }

    /**
     * 判断是否为函数
     * 
     * @inner
     * @param {*} obj 目标对象
     * @return {boolean}
     */
    function isFunction( obj ) {
        return '[object Function]' === toString.call( obj );
    }

    /**
     * 判断是否为对象
     * 
     * @inner
     * @param {*} obj 目标对象
     * @return {boolean}
     */
    function isObject( obj ) {
        return '[object Object]' === toString.call( obj );
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



    return Control;

});
