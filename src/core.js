/**
 * @classdesc
 * Core
 * 
 * @class Core
 * @this {Core}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 * @version 0.1
 *
 */

(function(namespace) {
    var Core = function() {

        var me = {};

        me._steps              = 100;
        me._slices_gap         = [0, '*'];
        me._border_XX          = [0, '*'];
        me._border_YY          = [0, '*'];
        me._border_ZZ          = [0, '*'];
        me._images             = [];
        me._opacity_factor     = 1.0;
        me._color_factor       = 1.0;
        me._render_resolution  = [512, 512];
        me._render_clear_color = "#ffffff";

        me._firtsPassMaterial =  {};
        me._secondPassMaterial = {};

        me._camera = {};
        me._renderer = {};

        me.init = function() {
            // create renderer, camera and etc.
        };

        me.setConfig = function(config) {
            me._steps_number      = config['steps']             ? config['steps'] : me._steps_number;
            me._slices_gap        = config['slices_gap']        ? config['slices_gap'] : me._slices_gap;
            me._border_XX         = config['border_XX']         ? config['border_XX'] : me._border_XX;
            me._border_YY         = config['border_YY']         ? config['border_YY'] : me._border_YY;
            me._border_ZZ         = config['border_ZZ']         ? config['border_ZZ'] : me._border_ZZ;
            me._images            = config['images']            ? config['images'] : me._images;
            me._opacity_factor    = config['opacity_factor']    ? config['opacity_factor'] : me._opacity_factor;
            me._color_factor      = config['color_factor']      ? config['color_factor'] : me._color_factor;
            me._render_resolution = config['resolution']        ? config['resolution'] : me._render_resolution;
            me._render_clear_color= config['backgound']         ? config['backgound'] : me._render_clear_color;

            me._updateUniforms();            
            me._onDraw.Call();
        };

        me.renderData = function(images) {
            me._images = images;
            me._updateUniforms();            
            me._onDraw.Call();
        };

        me.setSteps = function(steps_number) {
            me._steps_number = steps_number;
            me._updateUniforms();            
            me._onDraw.Call();
        };

        me.setSlicesGap = function(from, to) {
            me._slices_gap = [from, to];
            me._updateUniforms();            
            me._onDraw.Call();

        };

        me.setOpacityFactor = function(opacity_factor) {
            me._opacity_factor = opacity_factor;
            me._updateUniforms();            
            me._onDraw.Call();

        };

        me.setColorFactor = function(color_factor) {
            me._color_factor = color_factor;
            me._updateUniforms();            
            me._onDraw.Call();

        };

        me.setAbsorptionMode = function(mode_index) {
            me._absorption_mode_index = mode_index;
            me._updateUniforms();            
            me._onDraw.Call();

        };

        me.setBordersXX = function(x0, x1) {
            me._border_XX = [x0, x1];
            me._updateUniforms();            
            me._onDraw.Call();

        };

        me.setBordersYY = function(y0, y1) {
            me._border_YY = [y0, y1];
            me._updateUniforms();            
            me._onDraw.Call();

        };

        me.setBordersZZ = function(z0, z1) {
            me._border_ZZ = [z0, z1];            
            me._updateUniforms();            
            me._onDraw.Call();

        };

        me.setRenderResolution = function(width, height) {
            me._render_resolution = [width, height];
            me._renderer.setSize(width, height);
            me._updateUniforms();
            me._onDraw.Call();

        };

        me.setBackgoundColor = function(color) {
            me._render_clear_color = color;
            me._renderer.setClearColor(color);
            me._updateUniforms();
            me._onDraw.Call();

        };

        me._updateUniforms = function() {

        };

        me._onDraw = function() {


            var delay = -1;

            me.onDraw(delay);
        };

        me.onDraw = new Delegate();

        me.getStepsNumber = function() {
            return me._steps_number;
        };

        return me;

    };

    namespace.Core = Core();

})(window);