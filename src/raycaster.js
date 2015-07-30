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

        me._core = new Core();
        me._adaptationManager = new AdaptationManager();

        me.init = function() {
            me._core.init();
            me._adaptationManager.init( me._core );

            me._core.onDraw.Add(function(fps) {
                me._adaptationManager.do(fps);
            });
        };

        me.setConfig = function(config) {
            me._core.setConfig(config);
            me._core.renderData(images);
        };

        me.renderData = function(images) {
            me._core.renderData(images);
        };

        me.setSteps = function(steps_number) {
            me._core.setSteps(steps_number);
        };

        me.autoStepsOn = function(flag) {
            me._stepManager.switchOn(flag);
        };

        me.setSlicesGap = function(from, to) {
            me._core.setSlicesGap(from, to);
        };

        me.setOpacityFactor = function(opacity_factor) {
            me._core.setOpacityFactor(opacity_factor);
        };

        me.setColorFactor = function(color_factor) {
            me._core.setColorFactor(color_factor);
        };

        me.setAbsorptionMode = function(mode_index) {
            me._core.setAbsorptionMode(mode_index);
        };

        me.setBordersXX = function(x0, x1) {
            me._core.setBordersXX(x0, x1);
        };

        me.setBordersYY = function(y0, y1) {
            me._core.setBordersYY(y0, y1);
        };

        me.setBordersZZ = function(z0, z1) {
            me._core.setBordersZZ(z0, z1);
        };

        return me;

    };

    namespace.RaycasterLib = RaycasterLib();

})(window);