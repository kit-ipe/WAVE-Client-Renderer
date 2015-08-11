/**
 * @classdesc
 * AdaptationManager
 * 
 * @class AdaptationManager
 * @this {AdaptationManager}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 * @version 0.1
 *
 */

(function(namespace) {
    var AdaptationManager = function() {

        var me = {};

        me._core = {};

        me._possible_steps = [32, 64, 128, 256, 512, 1024];
        // me._possible_steps = [10, 20, 50, 80, 100, 150, 200];
        me._current_steps_index = 0;

        me._onPostDrawFuncIndex = -1;
        me._onCameraChangeStartFuncIndex = -1;
        me._onCameraChangeEndFuncIndex = -1;

        me.init = function(core) {
            me._core = core;

            me._onPostDrawFuncIndex = me._core.onPostDraw.add(function(fps) {
                me.do(fps);
            });

            me._onCameraChangeStartFuncIndex = me._core.onCameraChangeStart.add(function() {
                me.pause(true);

            });

            me._onCameraChangeEndFuncIndex = me._core.onCameraChangeEnd.add(function() {
                me.pause(false);
            });

        };

        me.setPossibleSteps = function(possible_steps) {
            me._possible_steps = possible_steps;
        };

        me.run = function(flag) {
            if(flag) {
                me._core.onPostDraw.Start(me._onPostDrawFuncIndex);
                me._core.onCameraChangeStart.Start(me._onCameraChangeEndFuncIndex);
                me._core.onCameraChangeEnd.Start(me._onCameraChangeStartFuncIndex);

            } else {
                me._core.onPostDraw.stop(me._onPostDrawFuncIndex);
                me._core.onCameraChangeStart.stop(me._onCameraChangeEndFuncIndex);
                me._core.onCameraChangeEnd.stop(me._onCameraChangeStartFuncIndex);
               
            }

        };

        me.pause = function(flag) {
            if(flag) {
                me._core.onCameraChangeStart.stop(me._onCameraChangeEndFuncIndex);
                me._core.onPostDraw.stop(me._onPostDrawFuncIndex);
             

            } else {
                me._core.onCameraChangeStart.Start(me._onCameraChangeEndFuncIndex);
                me._core.onPostDraw.Start(me._onPostDrawFuncIndex);

            }

        };

        me.decreaseSteps = function() {
            me._current_steps_index--;
            me._core.setSteps( me.getSteps() );
        };

        me.increaseSteps = function() {
            me._current_steps_index++;
            me._core.setSteps( me.getSteps() );
        };

        me.getSteps = function() {
            return me._possible_steps[me._current_steps_index];
        };

        me.isRun = function() {
            var isRunOnPostDraw = me._core.onPostDraw.IsRun(me._onPostDrawFuncIndex)
            var isRunOnCameraChangeStart = me._core.onCameraChangeStart.IsRun(me._onCameraChangeEndFuncIndex);
            var isRunOnCameraChangeEnd = me._core.onCameraChangeEnd.IsRun(me._onCameraChangeStartFuncIndex);

            return isRunOnPostDraw && isRunOnCameraChangeStart && isRunOnCameraChangeEnd;
        };

        me.isPause = function() {
            var isRunOnPostDraw = me._core.onPostDraw.IsRun(me._onPostDrawFuncIndex)
            var isRunOnCameraChangeStart = me._core.onCameraChangeStart.IsRun(me._onCameraChangeEndFuncIndex);
            var isRunOnCameraChangeEnd = me._core.onCameraChangeEnd.IsRun(me._onCameraChangeStartFuncIndex);

            return !isRunOnPostDraw && !isRunOnCameraChangeStart && isRunOnCameraChangeEnd;
        };

        me.do = function(fps) {
            if( fps < 15 && me._current_steps_index > 0 ) {
                console.log("FPS: " + fps + ", Number of steps: " + me.getSteps() );
                me.decreaseSteps();

            } else if( fps > 40 && me._current_steps_index < me._possible_steps.length-1 ) {
                console.log("FPS: " + fps + ", Number of steps: " + me.getSteps() );
                me.increaseSteps();

            }

        };

        return me;

    };

    namespace.AdaptationManager = AdaptationManager;

})(window.VRC);
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
    var Core = function(domContainerId) {

        var me = {};

        me._steps                 = 20;
        me._slices_gap            = [0,    '*'];
        me._slicemap_row_col      = [16,   16];
        me._gray_value            = [0.0, 1.0];
        me._slicemaps_images      = [];
        me._slicemaps_textures    = [];
        me._opacity_factor        = 1.0;
        me._color_factor          = 1.0;
        me._absorption_mode_index = 0.0;
        me._render_resolution     = ['*', '*'];
        me._render_clear_color    = "#ffffff";
        me._transfer_function     = [];
        me._geometry_dimension    = {"xmin": 0.0, "xmax": 1.0, "ymin": 0.0, "ymax": 1.0, "zmin": 0.0, "zmax": 1.0};

        me._transfer_function_colors = [
                        {"pos": 0.25, "color": "#ff0000"},
                        {"pos": 0.5,  "color": "#00ff00"},
                        {"pos": 0.75, "color": "#0000ff"}]

        me._firtsPassMaterial     = {};
        me._secondPassMaterial    = {};

        me._dom_container_id      = domContainerId != undefined ? domContainerId : "container";
        me._dom_container         = {};
        me._renderer              = {};
        me._camera                = {};
        me._camera_settings       = {
            "rotation": {
                x: 0.0,
                y: 0.0,
                z: 0.0
            },
            "position": {
                "x": 0,
                "y": 0,
                "z": 2
            }
        };

        me._rtTexture             = {};

        me._geometry              = {};
        me._geometry_settings     = {
            "rotation": {
                x: Math.PI,
                y: 0.0,
                z: 0.0
            },
            "position": {
                "x": -0.5,
                "y": -0.5,
                "z": -0.5
            }
        };

        me._materialFirstPass     = {};
        me._materialSecondPass    = {};

        me._sceneFirstPass        = {};
        me._sceneSecondPass       = {};

        me._meshFirstPass         = {};
        me._meshSecondPass        = {};

        me.onPreDraw              = new VRC.EventDispatcher();
        me.onPostDraw             = new VRC.EventDispatcher();
        me.onResize               = new VRC.EventDispatcher();
        me.onCameraChange         = new VRC.EventDispatcher();
        me.onCameraChangeStart    = new VRC.EventDispatcher();
        me.onCameraChangeEnd      = new VRC.EventDispatcher();

        me._onWindowResizeFuncIndex = -1;

        me._shaders = new VRC.Shaders();

        me.init = function() {
            me._container = me.getDOMContainer();

            me._renderer = new THREE.WebGLRenderer();
            me._renderer.setSize( me.getResolution()[0], me.getResolution()[1] );
            me._renderer.setClearColor( me._render_clear_color );
            me._container.appendChild( me._renderer.domElement );

            me._camera = new THREE.PerspectiveCamera( 45, me.getResolution()[0] / me.getResolution()[1], 0.01, 11 );
            me._camera.position.x = me._camera_settings["position"]["x"];
            me._camera.position.y = me._camera_settings["position"]["y"];
            me._camera.position.z = me._camera_settings["position"]["z"];

            me._camera.rotation.x = me._camera_settings["rotation"]["x"];
            me._camera.rotation.y = me._camera_settings["rotation"]["y"];
            me._camera.rotation.z = me._camera_settings["rotation"]["z"];

            me._controls = new THREE.OrbitControls( me._camera, me._renderer.domElement );
            me._controls.center.set( 0.0, 0.0, 0.0 );

            me._rtTexture = new THREE.WebGLRenderTarget( me.getResolution()[0], me.getResolution()[1], { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat} );

            me._rtTexture.wrapS = me._rtTexture.wrapT = THREE.ClampToEdgeWrapping;
            
            me._materialFirstPass = new THREE.ShaderMaterial( {
                vertexShader: me._shaders.firtsPass_vs,
                fragmentShader: me._shaders.firtsPass_fs,
                attributes: {
                    vertColor: {type: 'c', value: [] }
                },
                side: THREE.FrontSide,
                transparent: true
            } );
            
            me._materialSecondPass = new THREE.ShaderMaterial( {
                vertexShader: me._shaders.secondPass_vs,
                fragmentShader: me._shaders.secondPass_fs,
                attributes: {
                    vertColor: {type: 'c', value: [] }
                },
                uniforms: {
                    uBackCoord:           { type: "t",  value: me._rtTexture }, 
                    uSliceMaps:           { type: "tv", value: me._slicemaps_textures }, 
                    uTransferFunction:    { type: "t",  value: me._transfer_function },

                    uSteps:               { type: "f", value: me._steps },
                    uNumberOfSlices:      { type: "f", value: me.getSlicesGap()[1] },
                    uSlicesOverX:         { type: "f", value: me._slicemap_row_col[0] },
                    uSlicesOverY:         { type: "f", value: me._slicemap_row_col[1] },
                    uOpacityVal:          { type: "f", value: me._opacity_factor },
                    uColorVal:            { type: "f", value: me._color_factor },
                    uAbsorptionModeIndex: { type: "f", value: me._absorption_mode_index },
                    uMinGrayVal:          { type: "f", value: me._gray_value[0] },
                    uMaxGrayVal:          { type: "f", value: me._gray_value[1] }
                },
                side: THREE.BackSide,
                transparent: true
            });

            me._sceneFirstPass = new THREE.Scene();
            me._sceneSecondPass = new THREE.Scene();

            // var originalDimension = new GeometryDimension();

            var geometryHelper = new GeometryHelper();
            me._geometry = geometryHelper.createBoxGeometry(me.getGeometryDimension());

            me._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( me._geometry_settings["position"]["x"], me._geometry_settings["position"]["y"], me._geometry_settings["position"]["z"] ) );
            me._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( me._geometry_settings["rotation"]["x"] ));
            me._geometry.applyMatrix( new THREE.Matrix4().makeRotationY( me._geometry_settings["rotation"]["y"] ));
            me._geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( me._geometry_settings["rotation"]["z"] ));
            me._geometry.doubleSided = true;
            
            me._meshFirstPass = new THREE.Mesh( me._geometry, me._materialFirstPass );
            me._meshSecondPass = new THREE.Mesh( me._geometry, me._materialSecondPass );
                    
            me._sceneFirstPass.add( me._meshFirstPass );
            me._sceneSecondPass.add( me._meshSecondPass );

            stats = new Stats();
            // stats.setMode( 1 );
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.top = '0px';
            container.appendChild( stats.domElement );

            window.addEventListener( 'resize', function() {
                me.onResize.call();

            }, false );

            me._controls.addEventListener("change", function() {
                me.onCameraChange.call();

            });

            me._controls.addEventListener("start", function() {
                me.onCameraChangeStart.call();

            });

            me._controls.addEventListener("end", function() {
                me.onCameraChangeEnd.call();

            });

            me._transfer_function = me.setTransferFunctionByColors(me._transfer_function_colors);

            me._onWindowResizeFuncIndex = me.onResize.add(function() {
                me.setResolution('*', '*');

            }, false);

        };

        me._secondPassSetUniformValue = function(key, value) {
            me._materialSecondPass.uniforms[key].value = value;

        };

        me._setSlicemapsTextures = function(images) {
            var textures = [];

            for(var i=0; i<images.length; i++) {
                var texture = new THREE.Texture( images[i] );
                texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearFilter;
                texture.flipY = false;
                texture.needsUpdate = true;

                textures.push(texture);
            };

            me._slicemaps_textures = textures;

        };

        me.setTransferFunctionByImage = function(image) {
            var transferTexture =  new THREE.Texture(image);
            transferTexture.wrapS = transferTexture.wrapT =  THREE.ClampToEdgeWrapping;
            transferTexture.flipY = true;
            transferTexture.needsUpdate = true;

            me._secondPassSetUniformValue("uTransferFunction", transferTexture);

        };

        me.setTransferFunctionByColors = function(colors) {
            var canvas = document.createElement('canvas');
            canvas.width  = 512;
            canvas.height = 2;

            var ctx = canvas.getContext('2d');
            
            var grd = ctx.createLinearGradient(0, 0, canvas.width -1 , canvas.height - 1);

            for(var i=0; i<colors.length; i++) {
                grd.addColorStop(colors[i].pos, colors[i].color);

            }

            ctx.fillStyle = grd;
            ctx.fillRect(0,0,canvas.width ,canvas.height);

            var img = document.getElementById("transferFunctionImg");
            img.src = canvas.toDataURL();
            img.style.width = 20 + " px";
            img.style.height = 512 + " px";

            var transferTexture = me.setTransferFunctionByImage(canvas);

        };

        me._setGeometry = function(geometryDimension) {
            var geometry      = (new GeometryHelper()).createBoxGeometry(geometryDimension);
            var colorArray    = geometry.attributes.vertColor.array;
            var positionArray = geometry.attributes.position.array;

            me._geometry.attributes.vertColor.array = colorArray;
            me._geometry.attributes.vertColor.needsUpdate = true;

            me._geometry.attributes.position.array = positionArray;
            me._geometry.attributes.position.needsUpdate = true;

            me._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( me._geometry_settings["position"]["x"], me._geometry_settings["position"]["y"], me._geometry_settings["position"]["z"] ) );
            me._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( me._geometry_settings["rotation"]["x"] ));
            me._geometry.applyMatrix( new THREE.Matrix4().makeRotationY( me._geometry_settings["rotation"]["y"] ));
            me._geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( me._geometry_settings["rotation"]["z"] ));

            me._geometry.doubleSided = true;
        };

        me.setSlicemapsImages = function(images) {
            me._slicemaps_images = images;
            me._setSlicemapsTextures(images);
            me._secondPassSetUniformValue("uSliceMaps", me._slicemaps_textures);
            console.log("Core: setSlicemapsImages()");
        };

        me.setSteps = function(steps) {
            me._steps = steps;
            me._secondPassSetUniformValue("uSteps", me._steps);
            console.log("Core: setSteps()");
        };

        me.setSlicesGap = function(from, to) {
            me._slices_gap = [from, to];
            me._secondPassSetUniformValue("uNumberOfSlices", me.getSlicesGap()[1])
            console.log("Core: setSlicesGap()");
        };

        me.setOpacityFactor = function(opacity_factor) {
            me._opacity_factor = opacity_factor;
            me._secondPassSetUniformValue("uOpacityVal", me._opacity_factor);
            console.log("Core: setOpacityFactor()");
        };

        me.setColorFactor = function(color_factor) {
            me._color_factor = color_factor;
            me._secondPassSetUniformValue("uColorVal", me._color_factor);
            console.log("Core: setColorFactor()");
        };

        me.setAbsorptionMode = function(mode_index) {
            me._absorption_mode_index = mode_index;
            me._secondPassSetUniformValue("uAbsorptionModeIndex", me._absorption_mode_index);
            console.log("Core: setAbsorptionMode()");
        };

        me.setGeometryMinX = function(value) {
            me._geometry_dimension["xmin"] = value;
            me._setGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMinX()");
        };

        me.setGeometryMaxX = function(value) {
            me._geometry_dimension["xmax"] = value;
            me._setGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMaxX()");
        };

        me.setGeometryMinY = function(value) {
            me._geometry_dimension["ymin"] = value;
            me._setGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMinY()");
        };

        me.setGeometryMaxY = function(value) {
            me._geometry_dimension["ymax"] = value;
            me._setGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMaxY()");
        };

        me.setGeometryMinZ = function(value) {
            me._geometry_dimension["zmin"] = value;
            me._setGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMinZ()");
        };

        me.setGeometryMaxZ = function(value) {
            me._geometry_dimension["zmax"] = value;
            me._setGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMaxZ()");
        };

        me.setResolution = function(width, height) {
            me._render_resolution = [width, height];
            
            if(me._render_resolution[0] == '*' || me._render_resolution[1] == '*') {
                me.onResize.start(me._onWindowResizeFuncIndex);
            }

            var width = me.getResolution()[0];
            var height = me.getResolution()[1];

            if(me._render_resolution[0] == '*') {
                width = window.innerWidth;
            }

            if(me._render_resolution[1] == '*') {
                height = window.innerHeight;
            }

            me._camera.aspect = width / height;
            me._camera.updateProjectionMatrix();

            me._renderer.setSize(width, height);


            console.log("Core: setResolution()");
        };

        me.setBackgoundColor = function(color) {
            me._render_clear_color = color;
            me._renderer.setClearColor(color);
            console.log("Core: setBackgoundColor()");
        };

        me.setRowCol = function(row, col) {
            me._slicemap_row_col = [row, col];
            me._secondPassSetUniformValue("uSlicesOverX", me._slicemap_row_col[0]);
            me._secondPassSetUniformValue("uSlicesOverY", me._slicemap_row_col[1]);
            console.log("Core: setRowCol()");
        };

        me.setGrayMinValue = function(value) {
            me._gray_value[0] = value;
            me._secondPassSetUniformValue("uMinGrayVal", me._gray_value[0]);
            console.log("Core: setMinGrayValue()");
        };

        me.setGrayMaxValue = function(value) {
            me._gray_value[1] = value;
            me._secondPassSetUniformValue("uMaxGrayVal", me._gray_value[1]);
            console.log("Core: setMaxGrayValue()");
        };

        me.draw = function(fps) {
            me.onPreDraw.call(fps.toFixed(3));

            me._renderer.render( me._sceneFirstPass, me._camera, me._rtTexture, true );

            //Render the second pass and perform the volume rendering.
            me._renderer.render( me._sceneSecondPass, me._camera );

            stats.update();

            me.onPostDraw.call(fps.toFixed(3));

        };

        me.getDOMContainer = function() {
            return document.getElementById(me._dom_container_id);

        };

        me.getSteps = function() {
            return me._steps;
        };

        me.getSlicemapsImages = function() {
            return me._slicemaps_images;
        };

        me.getRowCol = function() {
            return me._slicemap_row_col;
        };

        me.getSlicesGap  = function() {
            var from = me._slices_gap[0];
            var to = me._slices_gap[1];
            if(me._slices_gap[1] == '*') {
                to = me.getRowCol()[0] * me.getRowCol()[1] * me.getSlicemapsImages().length;
            }

            return [from, to];
        };

        me.getResolution  = function() {
            var width = me._render_resolution[0];
            var height = me._render_resolution[1];

            if(me._render_resolution[0] == '*') {
                width = window.innerWidth;
            }
            if(me._render_resolution[1] == '*') {
                height = window.innerHeight;
            }

            return [width, height];
        };

        me.getGeometryDimension = function() {
            return me._geometry_dimension;
        };

        me.getGeometryMinX = function() {
            return me._geometry_dimension["xmin"];
        };

        me.getGeometryMaxX = function() {
            return me._geometry_dimension["xmax"];
        };

        me.getGeometryMinY = function() {
            return me._geometry_dimension["ymin"];
        };

        me.getGeometryMaxY = function() {
            return me._geometry_dimension["ymax"];
        };

        me.getGeometryMinZ = function() {
            return me._geometry_dimension["zmin"];
        };

        me.getGeometryMaxZ = function() {
            return me._geometry_dimension["zmax"];
        };

        me.getGrayMinValue = function() {
            return me._gray_value[0];
        };

        me.getGrayMaxValue = function() {
            return me._gray_value[1];
        };

        return me;

    };

    namespace.Core = Core;

})(window.VRC);
/**
 * @classdesc
 * EventDispatcher
 * 
 * @class EventDispatcher
 * @this {RC.EventDispatcher}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 * @version 0.1
 *
 * @requires NamespaceRC.js
 */

(function(namespace) {
    var EventDispatcher = function(O) {

        var me = {};
        me.class = this;

        me._functions = [];
        me._context = window;

        me.add = function(func, is_start) {
            // gizmo.Filter(func, "Function");
            me._functions.push({"is_start": is_start != undefined ? is_start : true, "func": func});
            return me._functions.length-1;

        };

        me.remove = function(index) {
            delete( me._functions[index] );
        };

        me.get = function(index) {
            return me._functions[index];
        };

        me.stop = function(index) {
            me._functions[index]["is_start"] = false;
        };

        me.start = function(index) {
            me._functions[index]["is_start"] = true;
        };

        me.isStart = function(index) {
            return me._functions[index]["is_start"];
        };

        me.call = function(value, context) {
            // var context = gizmo.isSet(context)? context : me._context;
            var context = context ? context : me._context;

            for(i in me._functions) {
                var task = me._functions[i];
                if(task["is_start"]) {
                    task["func"].call(context, value);

                }
            };

        };

        me.isEmpty = function() {
            return me._functions.length == 0;

        };

        me.setConfig = function(O) {
            // gizmo.Filter(O, "Object");
            for(prop in O) {
                switch(prop) {
                    case "context": {
                        // gizmo.Filter(O[prop], "Object");
                        this._context = O[prop];
                    };break;

                };    
            };

        };

        /**
        * Constructor
        *
        * @method EventDispatcher.Constructor
        * @this {RC.EventDispatcher}
        * @EventDispatcher {Object} O
        * @EventDispatcher {Object} O.self         Context for calling
        */
        me.Constructor = function(O) {
            this.setConfig(O);
            
        };

        me.Constructor(O);

        return me;

    };
    
    namespace.EventDispatcher = EventDispatcher;

})(window.VRC);
var GeometryHelper = function() {
    return {
        createBoxGeometry: function(dimension) {
            var vertexPos = [
                //front face first
                [dimension.xmin, dimension.ymin, dimension.zmax],
                [dimension.xmax, dimension.ymin, dimension.zmax],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                //front face second
                [dimension.xmin, dimension.ymin, dimension.zmax],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                [dimension.xmin, dimension.ymax, dimension.zmax],

                // back face first
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmin, dimension.ymax, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmin],
                // back face second
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmin],
                [dimension.xmax, dimension.ymin, dimension.zmin],

                // top face first
                [dimension.xmin, dimension.ymax, dimension.zmin],
                [dimension.xmin, dimension.ymax, dimension.zmax],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                // top face second
                [dimension.xmin, dimension.ymax, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                [dimension.xmax, dimension.ymax, dimension.zmin],

                // bottom face first
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymin, dimension.zmax],
                // bottom face second
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymin, dimension.zmax],
                [dimension.xmin, dimension.ymin, dimension.zmax],

                // right face first
                [dimension.xmax, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                // right face second
                [dimension.xmax, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                [dimension.xmax, dimension.ymin, dimension.zmax],

                // left face first
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmin, dimension.ymin, dimension.zmax],
                [dimension.xmin, dimension.ymax, dimension.zmax],
                // left face second
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmin, dimension.ymax, dimension.zmax],
                [dimension.xmin, dimension.ymax, dimension.zmin]
            ];

            var positions = [];
            var colors = [];

            for(var i = 0; i < vertexPos.length; i++) {
                var backCounter = vertexPos.length - 1 - i,
                    x = vertexPos[backCounter][0],
                    y = vertexPos[backCounter][1],
                    z = vertexPos[backCounter][2];

                positions.push(x);
                positions.push(y);
                positions.push(z);// * volumeDimension.getZStretchFactor());

                colors.push(x);
                colors.push(y);
                colors.push(z);
                colors.push(1.0);
            }

            var geometry = new THREE.BufferGeometry();
            var bufferPositions = new Float32Array(positions);
            geometry.addAttribute( 'position', new THREE.BufferAttribute( bufferPositions, 3 ) );
            geometry.addAttribute( 'vertColor', new THREE.BufferAttribute(new Float32Array(colors), 4));
            geometry.computeBoundingSphere();

            return geometry;
        }
    }
}

var GeometryDimension = function() {
    this.xmin = 0.005;
    this.xmax = 0.5;
    this.ymin = 0.005;
    this.ymax = 0.995;
    this.zmin = 0.005;
    this.zmax = 0.995;
}

/**
 * @classdesc
 * NamespaceKTV
 * 
 * @class NamespaceKTV
 * @this NamespaceKTV;
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 * @version 0.1
 * 
 */

(function(namespace) {

	namespace.VRC = {};
})(window);
/**
 * @classdesc
 * Shaders
 * 
 * @class Shaders
 * @this {RC.Shader}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 * @version 0.1
 *
 * @requires NamespaceRC.js
 */

(function(namespace) {
    var Shaders = function(O) {

        var me = {};
        me.class = this;

        me.firtsPass_vs = [
            "#ifdef GL_FRAGMENT_PRECISION_HIGH",
                "precision highp int;",
                "precision highp float;",
            "#else",
                "precision mediump int;",
                "precision mediump float;",
            "#endif",

            "attribute vec4 vertColor;",

            "varying vec4 backColor;",
            "varying vec4 pos;",

            "void main(void)",
            "{",
            "    backColor = vertColor;",

            "    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "    gl_Position = pos;",
            "}"].join('\n');

        me.firtsPass_fs = [
            "#ifdef GL_FRAGMENT_PRECISION_HIGH",
            "    // highp is supported",
            "    precision highp int;",
            "    precision highp float;",
            "#else",
            "    // high is not supported",
            "    precision mediump int;",
            "    precision mediump float;",
            "#endif",

            "varying vec4 backColor;",

            "void main(void)",
            "{",
            "    gl_FragColor = backColor;",
            "}"
        ].join('\n');

        me.secondPass_vs = [
            "#ifdef GL_FRAGMENT_PRECISION_HIGH",
            "    // highp is supported",
            "    precision highp int;",
            "    precision highp float;",
            "#else",
            "    // high is not supported",
            "    precision mediump int;",
            "    precision mediump float;",
            "#endif",
            
            "attribute vec4 vertColor;",

            "varying vec4 frontColor;",
            "varying vec4 pos;",

            "void main(void)",
            "{",
            "    frontColor = vertColor;",

            "    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "    gl_Position = pos;",
            "}",
        ].join('\n');

        me.secondPass_fs = [
            "#ifdef GL_FRAGMENT_PRECISION_HIGH",
            "    // highp is supported",
            "    precision highp int;",
            "    precision highp float;",
            "#else",
            "    // high is not supported",
            "    precision mediump int;",
            "    precision mediump float;",
            "#endif",

            "varying vec4 frontColor;",
            "varying vec4 pos;",

            "uniform sampler2D uBackCoord;",
            "uniform sampler2D uSliceMaps[10];",
            "uniform sampler2D uTransferFunction;",

            "uniform float uNumberOfSlices;",
            "uniform float uMinGrayVal;",
            "uniform float uMaxGrayVal;",
            "uniform float uOpacityVal;",
            "uniform float uColorVal;",
            "uniform float uAbsorptionModeIndex;",
            "uniform float uSlicesOverX;",
            "uniform float uSlicesOverY;",
            "uniform float uSteps;",

            "//Acts like a texture3D using Z slices and trilinear filtering.",
            "float getVolumeValue(vec3 volpos)",
            "{",
            "    float s1Original, s2Original, s1, s2;",
            "    float dx1, dy1;",
            "    float dx2, dy2;",
            "    float value;",

            "    vec2 texpos1,texpos2;",

            "    float slicesPerSprite = uSlicesOverX * uSlicesOverY;",

            "    s1Original = floor(volpos.z*uNumberOfSlices);",
            "    s2Original = min(s1Original+1.0, uNumberOfSlices);",

            "    int tex1Index = int(floor(s1Original / slicesPerSprite));",
            "    int tex2Index = int(floor(s2Original / slicesPerSprite));",

            "    s1 = mod(s1Original, slicesPerSprite);",
            "    s2 = mod(s2Original, slicesPerSprite);",

            "    dx1 = fract(s1/uSlicesOverX);",
            "    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;",

            "    dx2 = fract(s2/uSlicesOverX);",
            "    dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;",

            "    texpos1.x = dx1+(volpos.x/uSlicesOverX);",
            "    texpos1.y = dy1+(volpos.y/uSlicesOverY);",

            "    texpos2.x = dx2+(volpos.x/uSlicesOverX);",
            "    texpos2.y = dy2+(volpos.y/uSlicesOverY);",

            "    float value1, value2;",
            "    bool value1Set = false, value2Set = false;",

            "    for (int x = 0; x < 10; x++) {",
            "        if(x == tex1Index) {",
            "            value1 = texture2D(uSliceMaps[x],texpos1).x;",
            "            value1Set = true;",
            "        }",

            "        if(x == tex2Index) {",
            "            value2 = texture2D(uSliceMaps[x],texpos2).x;",
            "            value2Set = true;",
            "        }",

            "        if(value1Set && value2Set) {",
            "            break;",
            "        }",

            "    }",

            "    return mix(value1, value2, fract(volpos.z*uNumberOfSlices));",
            "    // return value1;",

            "}",

            "void main(void)",
            "{",
            "    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;",

            "    vec4 backColor = texture2D(uBackCoord,texC);",

            "    vec3 dir = backColor.rgb - frontColor.rgb;",
            "    vec4 vpos = frontColor;",

            "    vec3 Step = dir/uSteps;",

            "    vec4 accum = vec4(0, 0, 0, 0);",
            "    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);",
            "    vec4 color_value = vec4(0, 0, 0, 0);",
            "    float biggest_gray_value = 0.0;",

            "    float opacityFactor = 8.0;//uOpacityVal;",
            "    float lightFactor = 1.3;//uColorVal;",
        
            "    // const 4095 - only example of big number",
            "    // It because expression i > uSteps impossible",
            "    for(float i = 0.0; i < 4095.0; i+=1.0)",
            "    {",
            "    // It because expression i > uSteps impossible",
            "        if(i == uSteps) {",
            "            break;",
            "        }",

            "        float gray_val = getVolumeValue(vpos.xyz);",

            "        if(gray_val < uMinGrayVal || gray_val > uMaxGrayVal) {",
            "            color_value = vec4(0.0);",
            "        } else {",
            "            if(biggest_gray_value < gray_val) {",
            "               biggest_gray_value = gray_val;",
            "            }",
            "            vec2 tf_pos;",
            "            tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);",
            "            tf_pos.y = 0.5;",

            "            color_value = texture2D(uTransferFunction,tf_pos); " ,
            "            // color_value = vec4(pos, pos, pos, 1.0);",

            "            if(uAbsorptionModeIndex == 0.0)",
                "        {",
                "            sample.a = color_value.a * opacityFactor;",
                "            sample.rgb = color_value.rgb * uColorVal;",
                "            accum += sample;",
                "            if(accum.a>=0.95)",
                "               break;",

                "        }",

                "        if(uAbsorptionModeIndex == 1.0)",
                "        {",
                "            sample.a = color_value.a * opacityFactor * (1.0 / uSteps);",
                "            sample.rgb = (1.0 - accum.a) * color_value.rgb * sample.a * lightFactor;",
                "            accum += sample;",
                "            if(accum.a>=0.95)",
                "               break;",

                "        }",
            "        }",

            "        //advance the current position",
            "        vpos.xyz += Step;",

            "        //break if the position is greater than <1, 1, 1>",
            "        if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0)",
            "        {",
            "            break;",
            "        }",

            "    }",

            "    if(uAbsorptionModeIndex == 2.0)",
            "    {",
            "       if(biggest_gray_value == 0.0) {",
            "           accum = vec4(0.0);",                              
            "       } else {",
            "            vec2 tf_pos;",
            "            tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);",
            "            tf_pos.y = 0.5;",

            "            accum = texture2D(uTransferFunction,tf_pos); " ,
            "       }",
                     
            "    }",


            "    gl_FragColor = accum;",

            "}"
        ].join('\n');

        /**
        * Constructor
        *
        * @method Shader.Constructor
        * @this {RC.Shader}
        * @EventDispatcher {Object} O
        */
        me.Constructor = function(O) {
            
        };

        me.Constructor(O);

        return me;

    };
    
    namespace.Shaders = Shaders;

})(window.VRC);
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
                me._core.setGeometryMinX( config['x_min'] );
            }

            if(config['x_max'] != undefined) {
                me._core.setGeometryMaxX( config['x_max'] );
            }

            if(config['y_min'] != undefined) {
                me._core.setGeometryMinY( config['y_min'] );
            }

            if(config['y_max'] != undefined) {
                me._core.setGeometryMaxY( config['y_max'] );
            }

            if(config['z_min'] != undefined) {
                me._core.setGeometryMinZ( config['z_min'] );
            }

            if(config['z_max'] != undefined) {
                me._core.setGeometryMaxZ( config['z_max'] );
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

        me.draw = function() {
            me._core.draw();
        };

        me.init();

        me.setConfig(config);

        return me;

    };

    namespace.VolumeRaycaster = VolumeRaycaster;

})(window.VRC);