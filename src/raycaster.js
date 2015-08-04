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

        me._needRedraw = true;

        me._clock = new THREE.Clock();

        me._core = new RC.Core();
        me._adaptationManager = new RC.AdaptationManager();

        me.init = function() {
            me._core.init();
            me._adaptationManager.init( me._core );

            me.addOnCameraChangeCallback(function() {
                me._needRedraw = true;

            });

            function animate() {

                requestAnimationFrame( animate );

                if(me._needRedraw) {
                    var delta = me._clock.getDelta();
                    var fps = 1 / delta;

                    me._core.draw(fps);
                    me._needRedraw = false;

                }

            };

            animate();

        };

        me.setConfig = function(config) {
            if(config['images']) {
                me.setImages( config['images'] );
            }

            if(config['slices_gap']) {
                me._core.setSlicesGap( config['slices_gap'][0], config['slices_gap'][1] );
            }

            if(config['steps']) {
                me._core.setSteps( config['steps'] );
            }

            if(config['row_col']) {
                me._core.setRowCol( config['row_col'][0], config['row_col'][1] );
            }

            if(config['min_gray']) {
                me._core.setMinGrayValue( config['min_gray'] );
            }

            if(config['max_gray']) {
                me._core.setMaxGrayValue( config['max_gray'] );
            }

            if(config['border_XX']) {
                me._core.setBordersXX( config['border_XX'][0], config['border_XX'][1] );
            }

            if(config['border_YY']) {
                me._core.setBordersYY( config['border_YY'][0], config['border_YY'][1] );                
            }

            if(config['border_ZZ']) {
                me._core.setBordersZZ( config['border_ZZ'][0], config['border_ZZ'][1] );
            }

            if(config['opacity_factor']) {
                me._core.setOpacityFactor( config['opacity_factor'] );
            }

            if(config['color_factor']) {
                me._core.setColorFactor( config['color_factor'] );   
            }
            
            if(config['backgound']) {
                me._core.setBackgoundColor( config['backgound'] );
            }

            if(config['autoStepsOn']) {
                me._adaptationManager.switchOn( config['autoStepsOn'] );
            }

            if(config['absorptionMode']) {
                me._core.setAbsorptionMode( config['absorption_mode'] );
            }

            if(config['resolution']) {
                me.setResolution( config['resolution'][0], config['resolution'][1] );
            }

            me._needRedraw = true;
        };

        me.setImages = function(images) {
            var ctx = rcl._core._renderer.getContext()
            var maxTexSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE);

            var firstImage = images[0];

            if(Math.max(firstImage.width, firstImage.height) > maxTexSize) {
                throw Error("Size of slice bigger than maximum possible on current GPU. Maximum size of texture: " + maxTexSize);                

            } else {
                me._core.setImages(images);
                me._needRedraw = true;
            }

        };

        me.setSteps = function(steps_number) {
            me._core.setSteps(steps_number);
            me._needRedraw = true;

        };

        me.autoStepsOn = function(flag) {
            me._adaptationManager.switchOn(flag);
            me._needRedraw = true;

        };

        me.setSlicesGap = function(from, to) {
            me._core.setSlicesGap(from, to);
            me._needRedraw = true;

        };

        me.setOpacityFactor = function(opacity_factor) {
            me._core.setOpacityFactor(opacity_factor);
            me._needRedraw = true;

        };

        me.setColorFactor = function(color_factor) {
            me._core.setColorFactor(color_factor);
            me._needRedraw = true;

        };

        me.setAbsorptionMode = function(mode_index) {
            me._core.setAbsorptionMode(mode_index);
            me._needRedraw = true;

        };

        me.setBordersXX = function(x0, x1) {
            me._core.setBordersXX(x0, x1);
            me._needRedraw = true;

        };

        me.setBordersYY = function(y0, y1) {
            me._core.setBordersYY(y0, y1);
            me._needRedraw = true;

        };

        me.setBordersZZ = function(z0, z1) {
            me._core.setBordersZZ(z0, z1);
            me._needRedraw = true;

        };

        me.setResolution = function(width, height) {
            var ctx = rcl._core._renderer.getContext()
            var maxRenderbufferSize = ctx.getParameter(ctx.MAX_RENDERBUFFER_SIZE);
            if(Math.max(width, height) > maxRenderbufferSize) {
                console.warn("Size of canvas setted in " + maxRenderbufferSize + "x" + maxRenderbufferSize + ". Max render buffer size is " + maxRenderbufferSize + ".");
                me._core.setResolution(maxRenderbufferSize, maxRenderbufferSize);

            } else {
                me._core.setResolution(width, height);

            }

            me._needRedraw = true;

        };

        me.setBackgoundColor = function(color) {
            me._core.setBackgoundColor(color);
            me._needRedraw = true;

        };

        me.setRowCol = function(row, col) {
            me._core.setRowCol(row, col);
            me._needRedraw = true;

        };

        me.setMinGrayValue = function(value) {
            me._core.setMinGrayValue(value);
            me._needRedraw = true;

        };

        me.setMaxGrayValue = function(value) {
            me._core.setMaxGrayValue(value);
            me._needRedraw = true;

        };

        me.addOnResizeCallback = function(onResize) {
            me._core.onResize.Add(onResize);
            me._needRedraw = true;

        };

        me.addOnCameraChangeCallback = function(onChange) {
            me._core.onCameraChange.Add(onChange);
            me._needRedraw = true;
        };

        me.addOnCameraChangeStartCallback = function(onChangeStart) {
            me._core.onCameraChangeStart.Add(onChangeStart);
            me._needRedraw = true;
        };

        me.addOnCameraChangeEndCallback = function(onChangeEnd) {
            me._core.onCameraChangeEnd.Add(onChangeEnd);
            me._needRedraw = true;
        };

        me.addPreDraw = function(onPreDraw) {
            me._core.onPreDraw.Add(onPreDraw);
            me._needRedraw = true;

        };

        me.addOnDraw = function(onDraw) {
            me._core.onDraw.Add(onDraw);
            me._needRedraw = true;

        };

        me.draw = function() {
            me._core.draw();
        };

        me.init();

        return me;

    };

    namespace.RaycasterLib = RaycasterLib;

})(window.RC);