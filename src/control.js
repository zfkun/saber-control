/**
 * Saber UI
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件基类
 * @author zfkun(zfkun@msn.com)
 */

define(function ( require ) {
    var Emitter = require( 'saber-emitter' );

    /**
     * 控件基类
     * 
     * 禁止实例化，只能继承
     * @constructor
     * @exports Control
     * @fires module:Control#beforeinit
     * @fires module:Control#afterinit
     * @param {Object=} options 初始化参数
     */
    var Control = function ( options ) {

        this.children = [];

        /**
         * @event module:Control#beforeinit
         */
        this.emit( 'beforeinit' );

        this.init.apply( this, arguments );

        /**
         * @event module:Control#afterinit
         */
        this.emit( 'afterinit' );

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
         * 控件初始化
         * 
         * @abstract
         * @protected
         */
        init: function () {
            throw new Error( 'not implement init' );
        },

        /**
         * 渲染控件
         * 
         * @abstract
         * @protected
         * @return {module:Control} 当前实例
         */
        render: function() {
            throw new Error( 'not implement render' );
        },

        /**
         * 销毁控件
         * 
         * @public
         * @fires module:Control#dispose
         */
        dispose: function() {
            /**
             * @event module:Control#dispose
             */
            this.emit( 'dispose' );

            var child;
            while ( ( child = this.children.pop() ) ) {
                child.dispose();
            }

            // TODO
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
         * 获取控件属性
         * 
         * 控件属性分成 核心属性、关键信息属性、数据信息属性
         * @param {string} name 属性名
         * @return {*} 返回目标属性的值
         * @public
         */
        get: function( name ) {
            var method = this[ 'get' + lib.pascalize( name ) ];

            if ( 'function' === typeof method ) {
                return method.call( this );
            }

            return this[name];
        },

        /**
         * 设置控件属性
         * 
         * @param {string} name 属性名
         * @param {*} value 属性值
         * @public
         */
        set: function( name, value ) {
            var method = this[ 'set' + lib.pascalize( name ) ];

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
        initChildren: function( wrap ) {
            // TODO
        },

        /**
         * 添加子控件
         * 
         * @public
         * @param {module:Control} control 控件实例
         * @param {string=} childName 子控件名
         */
        addChild: function( control, childName ) {
            // TODO
        },

        /**
         * 移除子控件
         * 
         * @public
         * @param {module:Control} control 子控件实例
         */
        removeChild: function( control ) {
            // TODO
        }

    };

    // 混入 Emitter 支持
    Emitter.mixin( Control.prototype );

    return Control;
});

