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

            if(config['gap_slices']) {
                me._core.setSlicesGap( config['gap_slices'][0], config['gap_slices'][1] );
            }

            if(config['steps']) {
                me._core.setSteps( config['steps'] );
            }

            if(config['row_col']) {
                me._core.setRowCol( config['row_col'][0], config['row_col'][1] );
            }

            if(config['gray_min']) {
                me._core.setMinGrayValue( config['gray_min'] );
            }

            if(config['gray_max']) {
                me._core.setMaxGrayValue( config['gray_max'] );
            }

            if(config['x_min']) {
                me._core.setGeometryMinX( config['x_min'] );
            }

            if(config['x_max']) {
                me._core.setGeometryMaxX( config['x_max'] );
            }

            if(config['y_min']) {
                me._core.setGeometryMinY( config['y_min'] );
            }

            if(config['y_max']) {
                me._core.setGeometryMaxY( config['y_max'] );
            }

            if(config['z_min']) {
                me._core.setGeometryMinZ( config['z_min'] );
            }

            if(config['z_max']) {
                me._core.setGeometryMaxZ( config['z_max'] );
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

            if(config['auto_steps']) {
                me.setAutoStepsOn( config['auto_steps'] );
            }

            if(config['absorption_mode']) {
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

        me.setAutoStepsOn = function(flag) {
            me._adaptationManager.run(flag);
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

        me.setGeometryMinX = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value > me._core.getGeometryMaxX()) {
                throw Error("Min X should be lower than max X!");
            }

            me._core.setGeometryMinX(value);
            me._needRedraw = true;


        };

        me.setGeometryMaxX = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value < me._core.getGeometryMinX()) {
                throw Error("Max X should be bigger than min X!");
            }

            me._core.setGeometryMaxX(value);
            me._needRedraw = true;


        };

        me.setGeometryMinY = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value > me._core.getGeometryMaxY()) {
                throw Error("Min Y should be lower than max Y!");
            }

            me._core.setGeometryMinY(value);
            me._needRedraw = true;

        };

        me.setGeometryMaxY = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value < me._core.getGeometryMinY()) {
                throw Error("Max Y should be bigger than min Y!");

            }

            me._core.setGeometryMaxY(value);
            me._needRedraw = true;

        };

        me.setGeometryMinZ = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value > me._core.getGeometryMaxZ()) {
                throw Error("Min Z should be lower than max Z!");
            }

            me._core.setGeometryMinZ(value);
            me._needRedraw = true;

        };

        me.setGeometryMaxZ = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value < me._core.getGeometryMinZ()) {
                throw Error("Max Z should be bigger than min Z!");
            }

            me._core.setGeometryMaxZ(value);
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

        me.setTransferFunction = function(colors, size) {
            me._core.setTransferFunction(colors, size);
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