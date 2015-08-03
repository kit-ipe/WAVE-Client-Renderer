/**
 * @classdesc
 * RaycasterLib
 * 
 * @class RaycasterLib
 * @this {RaycasterLib}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 * @version 0.1
 *
 */

(function(namespace) {
    var RaycasterLib = function() {

        var me = {};

        me._core = new RC.Core();
        me._adaptationManager = new RC.AdaptationManager();

        me.init = function() {
            me._core.init();
            me._adaptationManager.init( me._core );

            // me.addOnCameraChangeCallback(function() {
            //     me.draw();
            // });

            function animate() {

                requestAnimationFrame( animate );

                // controls.update();

                me.draw();

                // render();
                // stats.update();
            };

            animate();
            // me.draw();

        };

        me.setConfig = function(config) {
            me._core.setConfig(config);
            me._core.draw();
        };

        me.setImages = function(images) {
            me._core.setImages(images);
            me._core.draw();
        };

        me.setSteps = function(steps_number) {
            me._core.setSteps(steps_number);
            me._core.draw();
        };

        me.autoStepsOn = function(flag) {
            me._adaptationManager.switchOn(flag);
        };

        me.setSlicesGap = function(from, to) {
            me._core.setSlicesGap(from, to);
            me._core.draw();
        };

        me.setOpacityFactor = function(opacity_factor) {
            me._core.setOpacityFactor(opacity_factor);
            me._core.draw();
        };

        me.setColorFactor = function(color_factor) {
            me._core.setColorFactor(color_factor);
            me._core.draw();
        };

        me.setAbsorptionMode = function(mode_index) {
            me._core.setAbsorptionMode(mode_index);
            me._core.draw();
        };

        me.setBordersXX = function(x0, x1) {
            me._core.setBordersXX(x0, x1);
            me._core.draw();
        };

        me.setBordersYY = function(y0, y1) {
            me._core.setBordersYY(y0, y1);
            me._core.draw();
        };

        me.setBordersZZ = function(z0, z1) {
            me._core.setBordersZZ(z0, z1);
            me._core.draw();
        };

        me.setResolution = function(width, height) {
            me._core.setResolution(width, height);
            me._core.draw();
        };

        me.setBackgoundColor = function(color) {
            me._core.setBackgoundColor(color);
            me._core.draw();
        };

        me.setRowCol = function(row, col) {
            me._core.setRowCol(row, col);
            me._core.draw();
        };

        me.setMinGrayValue = function(value) {
            me._core.setMinGrayValue(value);
            me._core.draw();
        };

        me.setMaxGrayValue = function(value) {
            me._core.setMaxGrayValue(value);
            me._core.draw();
        };

        me.addOnResizeCallback = function(onResize) {
            me._core.onResize.Add(onResize);
        };

        me.addOnCameraChangeCallback = function(onChange) {
            me._core.onCameraChange.Add(onChange);
        };

        me.addOnDraw = function(onDraw) {
            me._core.onDraw.Add(onDraw);
        };

        me.draw = function() {
            me._core.draw();
        };

        me.init();

        return me;

    };

    namespace.RaycasterLib = RaycasterLib;

})(window.RC);