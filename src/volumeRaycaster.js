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
    var VolumeRaycaster = function(config) {

        var me = {};

        me._needRedraw = true;

        me._isStart = false;

        me._clock = new THREE.Clock();

        me._core = new VRC.Core( config['dom_container_id'] );
        me._adaptationManager = new VRC.AdaptationManager();

        me.init = function() {
            me._core.init();
            me._adaptationManager.init( me._core );

            me.addOnCameraChangeCallback(function() {
                me._needRedraw = true;

            });

            function animate() {

                requestAnimationFrame( animate );

                if(me._needRedraw && me._isStart) {
                    var delta = me._clock.getDelta();
                    var fps = 1 / delta;

                    me._core.draw(fps);
                    me._needRedraw = false;

                }

                // me._core._controls.update();

            };

            animate();

        };

        me.setSlicemapsImages = function(images) {
            var ctx = me._core._renderer.getContext()
            var maxTexSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE);

            var firstImage = images[0];

            if(Math.max(firstImage.width, firstImage.height) > maxTexSize) {
                throw Error("Size of slice bigger than maximum possible on current GPU. Maximum size of texture: " + maxTexSize);                

            } else {
                me._core.setSlicemapsImages(images);
                me._needRedraw = true;
            }

        };

        me.uploadSlicemapsImages = function(imagesPaths, userOnLoadImage, userOnLoadImages, userOnError) {
            var downloadImages = function(imagesPaths, onLoadImage, onLoadImages, onError) {
                var downloadedImages = [];
                var downloadedImagesNumber = 0;

                try {
                    for (var imageIndex = 0; imageIndex < imagesPaths.length; imageIndex++) {
                        var image = new Image();
                        (function(image, imageIndex) {
                            image.onload = function() {
                                downloadedImages[imageIndex] = image;
                                downloadedImagesNumber++;
                                
                                onLoadImage(image);
                                
                                if(downloadedImagesNumber == imagesPaths.length) {
                                    onLoadImages(downloadedImages);
                                };

                            };

                            image.onerror = onError;
                            image.src = imagesPaths[imageIndex];

                        })(image, imageIndex);

                    };
                }
                catch(e) {
                    onError(e);

                };

            };

            downloadImages(imagesPaths,
                function(image) {
                    // downloaded one of the images
                    if(userOnLoadImage != undefined) userOnLoadImage(image);
                },
                function(images) {
                    // downloaded all images
                    me.setSlicemapsImages(images);
                    // me.start();

                    if(userOnLoadImages != undefined) userOnLoadImages(images);

                },
                function(error) {
                    // error appears
                    if(userOnError != undefined) {
                        userOnError(error);
                    } else {
                        console.error(error);

                    }
                }
            )

        };

        me.start = function() {
            me._isStart = true;
        };

        me.stop = function() {
            me._isStart = false;
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

            if(value > me._core.getGeometryDimension()["xmax"]) {
                throw Error("Min X should be lower than max X!");
            }

            me._core.setGeometryDimension("xmin", value);
            me._needRedraw = true;


        };

        me.setGeometryMaxX = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value < me._core.getGeometryDimension()["xmin"]) {
                throw Error("Max X should be bigger than min X!");
            }

            me._core.setGeometryDimension("xmax", value);
            me._needRedraw = true;


        };

        me.setGeometryMinY = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value > me._core.getGeometryDimension()["ymax"]) {
                throw Error("Min Y should be lower than max Y!");
            }

            me._core.setGeometryDimension("ymin", value);
            me._needRedraw = true;

        };

        me.setGeometryMaxY = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value < me._core.getGeometryDimension()["ymin"]) {
                throw Error("Max Y should be bigger than min Y!");

            }

            me._core.setGeometryDimension("ymax", value);
            me._needRedraw = true;

        };

        me.setGeometryMinZ = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value > me._core.getGeometryDimension()["zmax"]) {
                throw Error("Min Z should be lower than max Z!");
            }

            me._core.setGeometryDimension("zmin", value);
            me._needRedraw = true;

        };

        me.setGeometryMaxZ = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value < me._core.getGeometryDimension()["zmin"]) {
                throw Error("Max Z should be bigger than min Z!");
            }

            me._core.setGeometryDimension("zmax", value);
            me._needRedraw = true;

        };

        me.setResolution = function(width, height) {
            var ctx = me._core._renderer.getContext()
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

        me.setGrayMinValue = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Gray value should be in range [0.0 - 1.0] !");
            }

            if(value > me.getGrayMaxValue()) {
                throw Error("Gray min value should be lower than max value!");
            }

            me._core.setGrayMinValue(value);
            me._needRedraw = true;

        };

        me.setGrayMaxValue = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Gray value should be in range [0.0 - 1.0] !");
            }

            if(value < me.getGrayMinValue()) {
                throw Error("Gray max value should be bigger than min value!");
            }

            me._core.setGrayMaxValue(value);
            me._needRedraw = true;

        };

        me.setTransferFunctionByColors = function(colors) {
            me._core.setTransferFunctionByColors(colors);
            me._needRedraw = true;

        };

        me.setTransferFunctionByImage = function(image) {
            me._core.setTransferFunctionByImage(image);
            me._needRedraw = true;

        };

        me.addOnResizeCallback = function(onResize) {
            me._core.onResize.add(onResize);
            me._needRedraw = true;

        };

        me.addOnCameraChangeCallback = function(onChange) {
            me._core.onCameraChange.add(onChange);
            me._needRedraw = true;
        };

        me.addOnCameraChangeStartCallback = function(onChangeStart) {
            me._core.onCameraChangeStart.add(onChangeStart);
            me._needRedraw = true;
        };

        me.addOnCameraChangeEndCallback = function(onChangeEnd) {
            me._core.onCameraChangeEnd.add(onChangeEnd);
            me._needRedraw = true;
        };

        me.addPreDraw = function(onPreDraw) {
            me._core.onPreDraw.add(onPreDraw);
            me._needRedraw = true;

        };

        me.addOnDraw = function(onDraw) {
            me._core.onDraw.add(onDraw);
            me._needRedraw = true;

        };

        me.getGrayMaxValue = function() {
            return me._core.getGrayMaxValue();
        };

        me.getGrayMinValue = function() {
            return me._core.getGrayMinValue();
        };

        me.getSteps = function() {
            return me._core.getSteps();
        };

        me.getSlicesGap = function() {
            return me._core.getSlicesGap();
        };

        me.getRowCol = function() {
            return me._core.getRowCol();
        };

        me.getGrayValue = function() {
            return [me._core.getGrayMinValue(), me._core.getGrayMaxValue()]
        };

        me.getGeometryDimension = function() {
            return me._core.getGeometryDimension();
        };

        me.getOpacityFactor = function() {
            return me._core.getOpacityFactor();
        };

        me.getColorFactor = function() {
            return me._core.getColorFactor();
        };

        me.getBackgound = function() {
            return me._core.getBackgound();
        };

        me.getAbsorptionMode = function() {
            return me._core.getAbsorptionMode();
        };

        me.getResolution = function() {
            return me._core.getResolution();
        };

        me.getAbsorptionMode = function() {
            return me._core.getAbsorptionMode();
        };

        me.getSlicemapsPaths = function() {
            return me._core.getSlicemapsPaths();
        };

        me.getDomContainerId = function() {
            return me._core.getDomContainerId();
        };

        me.getCameraSettings = function() {
            return me._core.getCameraSettings();
        };

        me.getGeometrySettings = function() {
            return me._core.getGeometrySettings();
        };

        me.getDomContainerId = function() {
            return me._core.getDomContainerId();
        };

        me.getClearColor = function() {
            return me._core.getClearColor();
        };

        me.getTransferFunctionColors = function() {
            return me._core.getTransferFunctionColors();
        };

        me.getDomContainerId = function() {
            return me._core.getDomContainerId();
        };

        me.draw = function() {
            me._core.draw();
        };

        me.setConfig = function(config) {
            if(config['gap_slices'] != undefined) {
                me._core.setSlicesGap( config['gap_slices'][0], config['gap_slices'][1] );
            }

            if(config['steps'] != undefined) {
                me._core.setSteps( config['steps'] );
            }

            if(config['row_col'] != undefined) {
                me._core.setRowCol( config['row_col'][0], config['row_col'][1] );
            }

            if(config['gray_min'] != undefined) {
                me._core.setGrayMinValue( config['gray_min'] );
            }

            if(config['gray_max'] != undefined) {
                me._core.setGrayMaxValue( config['gray_max'] );
            }

            if(config['x_min'] != undefined) {
                me._core.setGeometryDimension( "xmin", config['x_min'] );
            }

            if(config['x_max'] != undefined) {
                me._core.setGeometryDimension( "xmax", config['x_max'] );
            }

            if(config['y_min'] != undefined) {
                me._core.setGeometryDimension( "ymin", config['y_min'] );
            }

            if(config['y_max'] != undefined) {
                me._core.setGeometryDimension( "ymax", config['y_max'] );
            }

            if(config['z_min'] != undefined) {
                me._core.setGeometryDimension( "zmin", config['z_min'] );
            }

            if(config['z_max'] != undefined) {
                me._core.setGeometryDimension( "zmax", config['z_max'] );
            }

            if(config['opacity_factor'] != undefined) {
                me._core.setOpacityFactor( config['opacity_factor'] );
            }

            if(config['color_factor'] != undefined) {
                me._core.setColorFactor( config['color_factor'] );   
            }
            
            if(config['backgound'] != undefined) {
                me._core.setBackgoundColor( config['backgound'] );
            }

            if(config['auto_steps'] != undefined) {
                me.setAutoStepsOn( config['auto_steps'] );
            }

            if(config['absorption_mode'] != undefined) {
                me._core.setAbsorptionMode( config['absorption_mode'] );
            }

            if(config['resolution'] != undefined) {
                me.setResolution( config['resolution'][0], config['resolution'][1] );
            }

            if(config['slicemaps_images'] != undefined) {
                me.setSlicemapsImages( config['slicemaps_images'] );
            }

            if(config['slicemaps_paths'] != undefined) {
                me.uploadSlicemapsImages(
                    config['slicemaps_paths'],
                    function(image) {
                    },
                    function(images) {
                        me.start();
                    }

                );
                
            }

            me._needRedraw = true;
        };

        me.getConfig = function() {
            var config = {
                "steps": me.getSteps(),
                "slices_gap": me.getSlicesGap(),
                "slicemap_row_col": me.getRowCol(),
                "gray_value": [me.getGrayMinValue(), me.getGrayMaxValue()],
                "slicemaps_paths": [-1],
                "opacity_factor": me.getOpacityFactor(),
                "color_factor": me.getColorFactor(),
                "absorption_mode_index": me.getAbsorptionMode(),
                "render_resolution": me.getResolution(),
                "render_clear_color": me.getClearColor(),
                "transfer_function_as_array": [-1],
                "transfer_function_path": [-1],
                "transfer_function_colors": me.getTransferFunctionColors(),
                "geometry_dimension": me.getGeometryDimension(),
                "dom_container_id": me.getDomContainerId(),
                "camera_settings": {
                    "rotation": {
                        x: 0.0,
                        y: 0.0,
                        z: 0.0
                    },
                    "position": {
                        "x": 0,
                        "y": 0,
                        "z": 2
                    },
                },
                "geometry_settings": {
                    "rotation": {
                        x: 0.0,
                        y: 0.0,
                        z: 0.0
                    },
                    "position": {
                        "x": -0.5,
                        "y": -0.5,
                        "z": -0.5
                    }
                }
            };

            return config;

        };

        me.init();

        me.setConfig(config);

        return me;

    };

    namespace.VolumeRaycaster = VolumeRaycaster;

})(window.VRC);