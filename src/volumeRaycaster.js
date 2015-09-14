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

        me._onLoadSlicemap              = new VRC.EventDispatcher();
        me._onLoadSlicemaps             = new VRC.EventDispatcher();

        me._core = new VRC.Core( config['dom_container_id'] );
        me._adaptationManager = new VRC.AdaptationManager();

        me.init = function() {
            me._core.init();
            me._adaptationManager.init( me._core );

            me.addCallback("onCameraChange", function() {
                me._needRedraw = true;

            });

            var frames = 0;

            function animate() {

                requestAnimationFrame( animate );
                if(me._needRedraw) {
                    frames = 10;
                }

                if(frames > 0 && me._isStart) {
                    var delta = me._clock.getDelta();
                    var fps = 1 / delta;

                    me._core.draw(fps);
                    frames--;

                    me._needRedraw = false;
                }

            };

            animate();

        };

        me.setSlicemapsImages = function(images, imagesPaths) {
            var maxTexSize = me._core.getMaxTextureSize();
            var maxTexturesNumber = me._core.getMaxTexturesNumber();

            var firstImage = images[0];
            var imagesNumber = images.length;

            if( imagesNumber > maxTexturesNumber ) {
                throw Error("Number of slicemaps bigger then number of available texture units. Available texture units: " + maxTexturesNumber);
            };

            if( (Math.max(firstImage.width, firstImage.height) > maxTexSize) || (imagesNumber > maxTexturesNumber) ) {
                throw Error("Size of slice bigger than maximum possible on current GPU. Maximum size of texture: " + maxTexSize);
            };

            me._core.setSlicemapsImages(images, imagesPaths);
            me._needRedraw = true;

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
                    me._onLoadSlicemap.call(image);
                    if(userOnLoadImage != undefined) userOnLoadImage(image);
                },
                function(images) {
                    // downloaded all images
                    me.setSlicemapsImages(images, imagesPaths);
                    // me.start();

                    me._onLoadSlicemaps.call(images);

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
            console.log("VRC: start()");
        };

        me.stop = function() {
            me._isStart = false;
            console.log("VRC: stop()");
        };

        me.setSteps = function(steps_number) {
            if( steps_number <= me._core.getMaxStepsNumber() ) {
                me._core.setSteps(steps_number);
                me._needRedraw = true;

            } else {
                throw Error("Number of steps should be lower of equal length of min volume dimension.");

            }

        };

        me.setAutoStepsOn = function(flag) {
            me._adaptationManager.run(flag);
            me._needRedraw = true;

        };

        me.setSlicesRange = function(from, to) {
            me._core.setSlicesRange(from, to);
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

        me.setVolumeSize = function(width, height, depth) {
            me._core.setVolumeSize(width, height, depth);
            me._needRedraw = true;
            
        };

        me.setGeometryMinX = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value > me._core.getGeometryDimensions()["xmax"]) {
                throw Error("Min X should be lower than max X!");
            }

            var geometryDimension = me._core.getGeometryDimensions();
            geometryDimension["xmin"] = value;

            me._core.setGeometryDimensions(geometryDimension);
            me._needRedraw = true;


        };

        me.setGeometryMaxX = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value < me._core.getGeometryDimensions()["xmin"]) {
                throw Error("Max X should be bigger than min X!");
            }

            var geometryDimension = me._core.getGeometryDimensions();
            geometryDimension["xmax"] = value;

            me._core.setGeometryDimensions(geometryDimension);
            me._needRedraw = true;


        };

        me.setGeometryMinY = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value > me._core.getGeometryDimensions()["ymax"]) {
                throw Error("Min Y should be lower than max Y!");
            }

            var geometryDimension = me._core.getGeometryDimensions();
            geometryDimension["ymin"] = value;

            me._core.setGeometryDimensions(geometryDimension);
            me._needRedraw = true;

        };

        me.setGeometryMaxY = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value < me._core.getGeometryDimensions()["ymin"]) {
                throw Error("Max Y should be bigger than min Y!");

            }

            var geometryDimension = me._core.getGeometryDimensions();
            geometryDimension["ymax"] = value;

            me._core.setGeometryDimensions(geometryDimension);
            me._needRedraw = true;
        };

        me.setGeometryMinZ = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value > me._core.getGeometryDimensions()["zmax"]) {
                throw Error("Min Z should be lower than max Z!");
            }

            var geometryDimension = me._core.getGeometryDimensions();
            geometryDimension["zmin"] = value;

            me._core.setGeometryDimensions(geometryDimension);
            me._needRedraw = true;
        };

        me.setGeometryMaxZ = function(value) {
            if(value > 1.0 || value < 0.0) {
                throw Error("Geometry size  should be in range [0.0 - 1.0] !");
            }

            if(value < me._core.getGeometryDimensions()["zmin"]) {
                throw Error("Max Z should be bigger than min Z!");
            }

            var geometryDimension = me._core.getGeometryDimensions();
            geometryDimension["zmax"] = value;

            me._core.setGeometryDimensions(geometryDimension);
            me._needRedraw = true;
        };

        me.setRenderSize = function(width, height) {
            var ctx = me._core._render.getContext()
            var maxRenderbufferSize = ctx.getParameter(ctx.MAX_RENDERBUFFER_SIZE);
            if(Math.max(width, height) > maxRenderbufferSize) {
                console.warn("Size of canvas setted in " + maxRenderbufferSize + "x" + maxRenderbufferSize + ". Max render buffer size is " + maxRenderbufferSize + ".");
                me._core.setRenderSize(maxRenderbufferSize, maxRenderbufferSize);

            } else {
                me._core.setRenderSize(width, height);

            }

            me._needRedraw = true;

        };

        me.setRenderCanvasSize = function(width, height) {
            me._core.setRenderCanvasSize(width, height);
            me._needRedraw = true;

        };

        me.setBackgroundColor = function(color) {
            me._core.setBackgroundColor(color);
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

        me.applyThresholding = function(threshold_name) {
            me._core.applyThresholding( threshold_name );
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

        me.addCallback = function(event_name, callback, needStart) {
            switch(event_name) {
                case "onPreDraw": return me._core.onPreDraw.add(callback, needStart);
                case "onPostDraw": return me._core.onPostDraw.add(callback, needStart);
                case "onResizeWindow": return me._core.onResizeWindow.add(callback, needStart);
                case "onCameraChange": return me._core.onCameraChange.add(callback, needStart);
                case "onCameraChangeStart": return me._core.onCameraChangeStart.add(callback, needStart);
                case "onCameraChangeEnd": return me._core.onCameraChangeEnd.add(callback, needStart);
                case "onChangeTransferFunction": return me._core.onChangeTransferFunction.add(callback, needStart);
                case "onLoadSlicemap": return me._onLoadSlicemap.add(callback, needStart);
                case "onLoadSlicemaps": return me._onLoadSlicemaps.add(callback, needStart);
            }
            me._needRedraw = true;

        };

        me.removeCallback = function(event_name, index) {
            switch(event_name) {
                case "onPreDraw": return me._core.onPreDraw.remove(index);
                case "onPostDraw": return me._core.onPostDraw.remove(index);
                case "onResizeWindow": return me._core.onResizeWindow.remove(index);
                case "onCameraChange": return me._core.onCameraChange.remove(index);
                case "onCameraChangeStart": return me._core.onCameraChangeStart.remove(index);
                case "onCameraChangeEnd": return me._core.onCameraChangeEnd.remove(index);
                case "onChangeTransferFunction": return me._core.onChangeTransferFunction.remove(index);
                case "onLoadSlicemap": return me._onLoadSlicemap.remove(callback, needStart);
                case "onLoadSlicemaps": return me._onLoadSlicemaps.remove(callback, needStart);

            }
            me._needRedraw = true;

        };

        me.startCallback = function(event_name, index) {
            switch(event_name) {
                case "onPreDraw": return me._core.onPreDraw.start(index);
                case "onPostDraw": return me._core.onPostDraw.start(index);
                case "onResizeWindow": return me._core.onResizeWindow.start(index);
                case "onCameraChange": return me._core.onCameraChange.start(index);
                case "onCameraChangeStart": return me._core.onCameraChangeStart.start(index);
                case "onCameraChangeEnd": return me._core.onCameraChangeEnd.start(index);
                case "onChangeTransferFunction": return me._core.onChangeTransferFunction.start(index);
                case "onLoadSlicemap": return me._onLoadSlicemap.start(callback, needStart);
                case "onLoadSlicemaps": return me._onLoadSlicemaps.start(callback, needStart);

            }
            me._needRedraw = true;

        };

        me.stopCallback = function(event_name, index) {
            switch(event_name) {
                case "onPreDraw": return me._core.onPreDraw.stop(index);
                case "onPostDraw": return me._core.onPostDraw.stop(index);
                case "onResizeWindow": return me._core.onResizeWindow.stop(index);
                case "onCameraChange": return me._core.onCameraChange.stop(index);
                case "onCameraChangeStart": return me._core.onCameraChangeStart.stop(index);
                case "onCameraChangeEnd": return me._core.onCameraChangeEnd.stop(index);
                case "onChangeTransferFunction": return me._core.onChangeTransferFunction.stop(index);
                case "onLoadSlicemap": return me._onLoadSlicemap.stop(callback, needStart);
                case "onLoadSlicemaps": return me._onLoadSlicemaps.stop(callback, needStart);

            }
            me._needRedraw = true;

        };

        me.isStartCallback = function(event_name, index) {
            switch(event_name) {
                case "onPreDraw": return me._core.onPreDraw.isStart(index);
                case "onPostDraw": return me._core.onPostDraw.isStart(index);
                case "onResizeWindow": return me._core.onResizeWindow.isStart(index);
                case "onCameraChange": return me._core.onCameraChange.isStart(index);
                case "onCameraChangeStart": return me._core.onCameraChangeStart.isStart(index);
                case "onCameraChangeEnd": return me._core.onCameraChangeEnd.isStart(index);
                case "onChangeTransferFunction": return me._core.onChangeTransferFunction.isStart(index);
                case "onLoadSlicemap": return me._onLoadSlicemap.isStart(callback, needStart);
                case "onLoadSlicemaps": return me._onLoadSlicemaps.isStart(callback, needStart);

            }
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

        me.getSlicesRange = function() {
            return me._core.getSlicesRange();
        };

        me.getRowCol = function() {
            return me._core.getRowCol();
        };

        me.getGrayValue = function() {
            return [me._core.getGrayMinValue(), me._core.getGrayMaxValue()]
        };

        me.getGeometryDimensions = function() {
            return me._core.getGeometryDimensions();
        };

        me.getVolumeSize = function() {
            return me._core.getVolumeSize();
        };

        me.getVolumeSizeNormalized = function() {
            return me._core.getVolumeSizeNormalized();
        };

        me.getMaxStepsNumber = function() {
            return me._core.getMaxStepsNumber();
        };

        me.getMaxTextureSize = function() {
            return me._core.getMaxTextureSize();
        };

        me.getMaxTexturesNumber = function() {
            return me._core.getMaxTexturesNumber();
        };

        me.getMaxFramebuferSize = function() {
            return me._core.getMaxFramebuferSize();
        };

        me.getOpacityFactor = function() {
            return me._core.getOpacityFactor();
        };

        me.getColorFactor = function() {
            return me._core.getColorFactor();
        };

        me.getBackground = function() {
            return me._core.getBackground();
        };

        me.getAbsorptionMode = function() {
            return me._core.getAbsorptionMode();
        };

        me.getRenderSize = function() {
            return me._core.getRenderSize();
        };

        me.getRenderSizeInPixels  = function() {
            return me._core.getRenderSizeInPixels();
        };

        me.getRenderCanvasSize = function() {
            return me._core.getCanvasSize();
        };

        me.getRenderCavnvasSizeInPixels  = function() {
            return me._core.getCanvasSizeInPixels();
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

        me.getTransferFunctionAsImage = function() {
            return me._core.getTransferFunctionAsImage();
        };

        me.isAutoStepsOn = function() {
            return me._adaptationManager.isRun();
        };

        me.draw = function() {
            me._core.draw();
        };

        me.setConfig = function(config, onLoadImage, onLoadImages) {
            if(config['slicemaps_images'] != undefined) {
                me.setSlicemapsImages( config['slicemaps_images'] );
            }

            if(config['slicemaps_paths'] != undefined) {
                me.uploadSlicemapsImages(
                    config['slicemaps_paths'],
                    function(image) {
                        if(onLoadImage != undefined) onLoadImage(image);
                    },
                    function(images) {
                        if(config['slices_range'] != undefined) {
                            me.setSlicesRange( config['slices_range'][0], config['slices_range'][1] );
                        }
                        
                        if(onLoadImages != undefined) onLoadImages(images);

                        me.start();
                    }

                );
                
            }

            if(config['slices_range'] != undefined) {
                me.setSlicesRange( config['slices_range'][0], config['slices_range'][1] );
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

            if(config['threshold_indexes'] != undefined) {
                me._core.setThresholdIndexes( config['threshold_indexes']["otsu"], config['threshold_indexes']["isodata"], config['threshold_indexes']["yen"], config['threshold_indexes']["li"] );
            }

            if(config['volume_size'] != undefined) {
                me.setVolumeSize( config['volume_size'][0], config['volume_size'][1], config['volume_size'][2] );
            }

            if(config['x_min'] != undefined) {
                me.setGeometryMinX( config['x_min'] );
            }

            if(config['x_max'] != undefined) {
                me.setGeometryMaxX( config['x_max'] );
            }

            if(config['y_min'] != undefined) {
                me.setGeometryMinY( config['y_min'] );
            }

            if(config['y_max'] != undefined) {
                me.setGeometryMaxY( config['y_max'] );
            }

            if(config['z_min'] != undefined) {
                me.setGeometryMinZ( config['z_min'] );
            }

            if(config['z_max'] != undefined) {
                me.setGeometryMaxZ( config['z_max'] );
            }

            if(config['opacity_factor'] != undefined) {
                me._core.setOpacityFactor( config['opacity_factor'] );
            }

            if(config['color_factor'] != undefined) {
                me._core.setColorFactor( config['color_factor'] );   
            }

            if(config['tf_colors'] != undefined) {
                me._core.setTransferFunctionByColors( config['tf_colors'] );   
            }
            
            if(config['background'] != undefined) {
                me._core.setBackgroundColor( config['background'] );
            }

            if(config['auto_steps'] != undefined) {
                me.setAutoStepsOn( config['auto_steps'] );
            }

            if(config['absorption_mode'] != undefined) {
                me._core.setAbsorptionMode( config['absorption_mode'] );
            }

            if(config['render_size'] != undefined) {
                me.setRenderSize( config['render_size'][0], config['render_size'][1] );
            }

            if(config['render_canvas_size'] != undefined) {
                me.setRenderCanvasSize( config['render_canvas_size'][0], config['render_canvas_size'][1] );
            }

            me._needRedraw = true;
        };

        me.uploadConfig = function(path, onLoad, onError) {
            var xmlhttp;

            if (window.XMLHttpRequest) {
                // code for IE7+, Firefox, Chrome, Opera, Safari
                xmlhttp = new XMLHttpRequest();
            } else {
                // code for IE6, IE5
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            }

            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
                    if(xmlhttp.status == 200){
                        var config = JSON.parse(xmlhttp.responseText);
                        me.setConfig( config );
                        if(onLoad != undefined) onLoad();
                    } else if(xmlhttp.status == 400) {
                        if(userOnError != undefined) userOnError(xmlhttp);
                    } else {
                        if(userOnError != undefined) userOnError(xmlhttp);
                    }
                }

            }

            xmlhttp.open("GET", path, true);
            xmlhttp.send();

        };

        me.getConfig = function() {
            var config = {
                "steps": me.getSteps(),
                "slices_range": me.getSlicesRange(),
                "volume_size": me.getVolumeSize(),
                "row_col": me.getRowCol(),
                "gray_min": me.getGrayMinValue(),
                "gray_max": me.getGrayMaxValue(),
                "slicemaps_paths": me.getSlicemapsPaths(),
                "opacity_factor": me.getOpacityFactor(),
                "color_factor": me.getColorFactor(),
                "absorption_mode": me.getAbsorptionMode(),
                "render_size": me.getRenderSize(),
                "render_canvas_size": me.getRenderCanvasSize(),
                "backgound": me.getClearColor(),
                "tf_path": me.getTransferFunctionAsImage().src,
                "tf_colors": me.getTransferFunctionColors(),
                "x_min": me.getGeometryDimensions()["xmin"],
                "x_max": me.getGeometryDimensions()["xmax"],
                "y_min": me.getGeometryDimensions()["ymin"],
                "y_max": me.getGeometryDimensions()["ymax"],
                "z_min": me.getGeometryDimensions()["zmin"], 
                "z_max": me.getGeometryDimensions()["zmax"],
                "dom_container_id": me.getDomContainerId(),
                "auto_steps": me.isAutoStepsOn()
            };

            return config;

        };

        me.init();

        me.setConfig(config);

        return me;

    };

    namespace.VolumeRaycaster = VolumeRaycaster;

})(window.VRC);