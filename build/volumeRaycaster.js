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

        // me._possible_steps = [32, 64, 128, 256, 512, 1024];
        // me._possible_steps = [10, 20, 50, 80, 100, 150, 200];
        me._possible_steps = [10,
 20,
 30,
 40,
 50,
 60,
 70,
 80,
 90,
 100,
 110,
 120,
 130,
 140,
 150,
 160,
 170,
 180,
 190,
 200,
 210,
 220,
 230,
 240,
 250,
 260,
 270,
 280,
 290,
 300,
 310,
 320,
 330,
 340,
 350,
 360,
 370,
 380,
 390,
 400,
 410,
 420,
 430,
 440,
 450,
 460,
 470,
 480,
 490,
 500,
 510,
 520,
 530,
 540,
 550,
 560,
 570,
 580,
 590,
 600,
 610,
 620,
 630,
 640,
 650,
 660,
 670,
 680,
 690,
 700,
 710,
 720,
 730,
 740,
 750,
 760,
 770,
 780,
 790,
 800,
 810,
 820,
 830,
 840,
 850,
 860,
 870,
 880,
 890,
 900,
 910,
 920,
 930,
 940,
 950,
 960,
 970,
 980,
 990,
 1000,
 1010,
 1020,
 1030,
 1040,
 1050,
 1060,
 1070,
 1080,
 1090,
 1100,
 1110,
 1120,
 1130,
 1140,
 1150,
 1160,
 1170,
 1180,
 1190,
 1200,
 1210,
 1220,
 1230,
 1240,
 1250,
 1260,
 1270,
 1280,
 1290,
 1300,
 1310,
 1320,
 1330,
 1340,
 1350,
 1360,
 1370,
 1380,
 1390,
 1400,
 1410,
 1420,
 1430,
 1440,
 1450,
 1460,
 1470,
 1480,
 1490,
 1500,
 1510,
 1520,
 1530,
 1540,
 1550,
 1560,
 1570,
 1580,
 1590,
 1600,
 1610,
 1620,
 1630,
 1640,
 1650,
 1660,
 1670,
 1680,
 1690,
 1700,
 1710,
 1720,
 1730,
 1740,
 1750,
 1760,
 1770,
 1780,
 1790,
 1800,
 1810,
 1820,
 1830,
 1840,
 1850,
 1860,
 1870,
 1880,
 1890,
 1900,
 1910,
 1920,
 1930,
 1940,
 1950,
 1960,
 1970,
 1980,
 1990];

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
                // me.pause(true);

            });

            me._onCameraChangeEndFuncIndex = me._core.onCameraChangeEnd.add(function() {
                // me.pause(false);
            });

        };

        // me.setPossibleSteps = function(possible_steps) {
        //     me._possible_steps = possible_steps;
        // };

        me.run = function(flag) {
            if(flag) {
                me._core.onPostDraw.start(me._onPostDrawFuncIndex);
                me._core.onCameraChangeStart.start(me._onCameraChangeEndFuncIndex);
                me._core.onCameraChangeEnd.start(me._onCameraChangeStartFuncIndex);

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
                me._core.onCameraChangeStart.start(me._onCameraChangeEndFuncIndex);
                me._core.onPostDraw.start(me._onPostDrawFuncIndex);

            }

        };

        me.getNearestSurroundingsPossibleStep = function(steps) {
            var delta = me._possible_steps[1] - me._possible_steps[0];
            var direction = (steps - me.getSteps()) > 0 ? 1 : -1;

            for(var adaptationStep = me._current_steps_index; adaptationStep<me._possible_steps.length; adaptationStep+=direction) {
                if(Math.abs(me._possible_steps[adaptationStep] - steps) <= delta) {
                    if(steps > me._possible_steps[adaptationStep]) {
                        return [adaptationStep, adaptationStep+1];

                    }

                    if(steps > me._possible_steps[adaptationStep]) {
                        return [adaptationStep-1, adaptationStep];

                    }

                    if(steps == me._possible_steps[adaptationStep]) {
                        return [adaptationStep-1, adaptationStep+1];

                    }
                }
            };

            return me._possible_steps.length;
        };

        me.decreaseSteps = function() {
            var nearestSurroundingsPossibleSteps = me.getNearestSurroundingsPossibleStep(me._core.getSteps());

            me._current_steps_index = nearestSurroundingsPossibleSteps[0];
        };

        me.increaseSteps = function() {
            var nearestSurroundingsPossibleSteps = me.getNearestSurroundingsPossibleStep(me._core.getSteps());

            me._current_steps_index = nearestSurroundingsPossibleSteps[1];
        };

        me.getSteps = function() {
            return me._possible_steps[me._current_steps_index];
        };

        me.isRun = function() {
            var isRunOnPostDraw = me._core.onPostDraw.isStart(me._onPostDrawFuncIndex)
            var isRunOnCameraChangeStart = me._core.onCameraChangeStart.isStart(me._onCameraChangeEndFuncIndex);
            var isRunOnCameraChangeEnd = me._core.onCameraChangeEnd.isStart(me._onCameraChangeStartFuncIndex);

            return isRunOnPostDraw && isRunOnCameraChangeStart && isRunOnCameraChangeEnd;
        };

        me.isPause = function() {
            var isRunOnPostDraw = me._core.onPostDraw.isStart(me._onPostDrawFuncIndex)
            var isRunOnCameraChangeStart = me._core.onCameraChangeStart.isStart(me._onCameraChangeEndFuncIndex);
            var isRunOnCameraChangeEnd = me._core.onCameraChangeEnd.isStart(me._onCameraChangeStartFuncIndex);

            return !isRunOnPostDraw && !isRunOnCameraChangeStart && isRunOnCameraChangeEnd;
        };

        me._numberOfChanges = 0;

        me.do = function(fps) {

            if( fps < 10 && me._current_steps_index > 0 ) {
                me._numberOfChanges--;
                // console.log(me._numberOfChanges, "< 15");
                if(me._numberOfChanges == -5) {
                    me.decreaseSteps();
                    console.log("FPS: " + fps + ", Number of steps: " + me.getSteps() );
                    me._numberOfChanges = 0;

                    me._core.setSteps( me.getSteps() );            
                }


            } else if( fps > 30 && me._current_steps_index < me._possible_steps.length-1 ) {
                me._numberOfChanges++;
                // console.log(me._numberOfChanges, "> 40");
                if(me._numberOfChanges == 3) {
                    me.increaseSteps();
                    console.log("FPS: " + fps + ", Number of steps: " + me.getSteps() );
                    me._numberOfChanges = 0;
                    me._core.setSteps( me.getSteps() );
                }

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
    var GeometryHelper = function() {

        var me = {};

        me.createBoxGeometry = function(dimension) {
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
        return me;
        
    }

    namespace.GeometryHelper = GeometryHelper;

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

// (function(namespace) {
    var Core = function(domContainerId) {

        // var me = {};

        this._steps                      = 20;
        this._slices_gap                 = [0,    '*'];
        this._slicemap_row_col           = [16,   16];
        this._gray_value                 = [0.0, 1.0];
        this._slicemaps_images           = [];
        this._slicemaps_paths            = [];
        this._slicemaps_textures         = [];
        this._opacity_factor             = 20.0;
        this._color_factor               = 3.0;
        this._absorption_mode_index      = 0.0;
        this._render_size                = ['*', '*'];
        this._canvas_size                = ['*', '*'];
        this._render_clear_color         = "#ffffff";
        this._transfer_function_as_image = new Image();
        this._geometry_dimension         = {"xmin": 0.0, "xmax": 1.0, "ymin": 0.0, "ymax": 1.0, "zmin": 0.0, "zmax": 1.0};

        this._transfer_function_colors   = [
            {"pos": 0.25, "color": "#892c2c"},
            {"pos": 0.5, "color": "#00ff00"},
            {"pos": 0.75, "color": "#0000ff"}
        ]

        this._dom_container_id           = domContainerId != undefined ? domContainerId : "container";
        this._dom_container              = {};
        this._renderer                   = {};
        this._camera                     = {};
        this._camera_settings            = {
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

        this._rtTexture                  = {};

        this._geometry                   = {};
        this._geometry_settings          = {
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
        };

        this._materialFirstPass          = {};
        this._materialSecondPass         = {};

        this._sceneFirstPass             = {};
        this._sceneSecondPass            = {};

        this._meshFirstPass              = {};
        this._meshSecondPass             = {};

        this.onPreDraw                   = new VRC.EventDispatcher();
        this.onPostDraw                  = new VRC.EventDispatcher();
        this.onResizeWindow              = new VRC.EventDispatcher();
        this.onCameraChange              = new VRC.EventDispatcher();
        this.onCameraChangeStart         = new VRC.EventDispatcher();
        this.onCameraChangeEnd           = new VRC.EventDispatcher();
        this.onChangeTransferFunction    = new VRC.EventDispatcher();

        this._onWindowResizeFuncIndex_canvasSize = -1;
        this._onWindowResizeFuncIndex_renderSize = -1;

    };

    Core.prototype.init = function() {
        var me = this;
        this._container = this.getDOMContainer();

        this._renderer = new THREE.WebGLRenderer();
        this._renderer.setSize( this.getRenderSizeInPixels()[0], this.getRenderSizeInPixels()[1] );
        this._renderer.setClearColor( this._render_clear_color );
        this._renderer.autoClearColor = true;
        this._renderer.autoClearDepth = true;
        this._renderer.autoClearStencil = false;
        this._container.appendChild( this._renderer.domElement );

        this._camera = new THREE.PerspectiveCamera( 45, this.getRenderSizeInPixels()[0] / this.getRenderSizeInPixels()[1], 0.01, 11 );
        this._camera.position.x = this._camera_settings["position"]["x"];
        this._camera.position.y = this._camera_settings["position"]["y"];
        this._camera.position.z = this._camera_settings["position"]["z"];

        this._camera.rotation.x = this._camera_settings["rotation"]["x"];
        this._camera.rotation.y = this._camera_settings["rotation"]["y"];
        this._camera.rotation.z = this._camera_settings["rotation"]["z"];

        this._controls = new THREE.OrbitControls( this._camera, this._renderer.domElement );
        this._controls.center.set( 0.0, 0.0, 0.0 );

        this._rtTexture = new THREE.WebGLRenderTarget( this.getRenderSizeInPixels()[0], this.getRenderSizeInPixels()[1], { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat} );

        this._rtTexture.wrapS = this._rtTexture.wrapT = THREE.ClampToEdgeWrapping;
        
        this._materialFirstPass = new THREE.ShaderMaterial( {
            vertexShader: this._shaders.firstPass.vertexShader,
            fragmentShader: this._shaders.firstPass.fragmentShader,
            attributes: {
                vertColor: {type: 'c', value: [] }
            },
            side: THREE.FrontSide,
            transparent: false
        } );
        
        this._materialSecondPass = new THREE.ShaderMaterial( {
            vertexShader: this._shaders.secondPass.vertexShader,
            fragmentShader: this._shaders.secondPass.fragmentShader,
            attributes: {
                vertColor: {type: 'c', value: [] }
            },
            uniforms: {
                uBackCoord:           { type: "t",  value: this._rtTexture }, 
                uSliceMaps:           { type: "tv", value: this._slicemaps_textures }, 
                uTransferFunction:    { type: "t",  value: this._transfer_function },

                uSteps:               { type: "f", value: this._steps },
                uNumberOfSlices:      { type: "f", value: this.getSlicesRange()[1] },
                uSlicesOverX:         { type: "f", value: this._slicemap_row_col[0] },
                uSlicesOverY:         { type: "f", value: this._slicemap_row_col[1] },
                uOpacityVal:          { type: "f", value: this._opacity_factor },
                uColorVal:            { type: "f", value: this._color_factor },
                uAbsorptionModeIndex: { type: "f", value: this._absorption_mode_index },
                uMinGrayVal:          { type: "f", value: this._gray_value[0] },
                uMaxGrayVal:          { type: "f", value: this._gray_value[1] }
            },
            side: THREE.BackSide,
            // transparent: true,
            transparent: true
        });

        this._sceneFirstPass = new THREE.Scene();
        this._sceneSecondPass = new THREE.Scene();

        // var originalDimension = new GeometryDimension();

        var geometryHelper = new VRC.GeometryHelper();
        this._geometry = geometryHelper.createBoxGeometry(this.getGeometryDimension());

        this._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( this._geometry_settings["position"]["x"], this._geometry_settings["position"]["y"], this._geometry_settings["position"]["z"] ) );
        this._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( this._geometry_settings["rotation"]["x"] ));
        this._geometry.applyMatrix( new THREE.Matrix4().makeRotationY( this._geometry_settings["rotation"]["y"] ));
        this._geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( this._geometry_settings["rotation"]["z"] ));
        this._geometry.doubleSided = true;
        
        this._meshFirstPass = new THREE.Mesh( this._geometry, this._materialFirstPass );
        this._meshSecondPass = new THREE.Mesh( this._geometry, this._materialSecondPass );
                
        this._sceneFirstPass.add( this._meshFirstPass );
        this._sceneSecondPass.add( this._meshSecondPass );

        window.addEventListener( 'resize', function() {
            me.onResizeWindow.call();

        }, false );

        this._controls.addEventListener("change", function() {
            me.onCameraChange.call();

        });

        this._controls.addEventListener("start", function() {
            me.onCameraChangeStart.call();

        });

        this._controls.addEventListener("end", function() {
            me.onCameraChangeEnd.call();

        });

        this._onWindowResizeFuncIndex_renderSize = this.onResizeWindow.add(function() {
            me.setRendererSize('*', '*');

        }, false);

        this._onWindowResizeFuncIndex_canvasSize = this.onResizeWindow.add(function() {
            me.setRendererCanvasSize('*', '*');

        }, false);

        this.setTransferFunctionByColors(this._transfer_function_colors);

        this.setRendererSize(this.getRenderSize()[0], this.getRenderSize()[1]);
        this.setRendererCanvasSize(this.getCanvasSize()[0], this.getCanvasSize()[1]);

    };

    Core.prototype._secondPassSetUniformValue = function(key, value) {
        this._materialSecondPass.uniforms[key].value = value;

    };

    Core.prototype._setSlicemapsTextures = function(images) {
        var textures = [];

        for(var i=0; i<images.length; i++) {
            console.log("THREE.Texture(");
            var texture = new THREE.Texture( images[i] );
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.magFilter = THREE.LinearFilter;
            // texture.magFilter = THREE.LinearMipMapLinearFilter;
            texture.minFilter = THREE.LinearFilter;
            // texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.flipY = false;
            texture.needsUpdate = true;

            textures.push(texture);
        };

        this._slicemaps_textures = textures;

    };

    Core.prototype.setTransferFunctionByImage = function(image) {
        this._transfer_function_as_image = image;
        var transferTexture =  new THREE.Texture(image);
        transferTexture.wrapS = transferTexture.wrapT =  THREE.ClampToEdgeWrapping;
        transferTexture.magFilter = THREE.LinearFilter;
        // transferTexture.magFilter = THREE.LinearMipMapLinearFilter;
        transferTexture.minFilter = THREE.LinearFilter;
        // transferTexture.minFilter = THREE.LinearMipMapLinearFilter;
        transferTexture.flipY = true;
        transferTexture.needsUpdate = true;

        this._secondPassSetUniformValue("uTransferFunction", transferTexture);
        this.onChangeTransferFunction.call(image);

    };

    Core.prototype.setTransferFunctionByColors = function(colors) {
        this._transfer_function_colors = colors;

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
        var image = new Image();
        image.src = canvas.toDataURL();
        image.style.width = 20 + " px";
        image.style.height = 512 + " px";

        var transferTexture = this.setTransferFunctionByImage(image);

        this.onChangeTransferFunction.call(image);

    };

    Core.prototype.getTransferFunctionAsImage = function() {
        return this._transfer_function_as_image;
    };

    Core.prototype._setGeometry = function(geometryDimension) {
        var geometry      = (new VRC.GeometryHelper()).createBoxGeometry(geometryDimension);
        var colorArray    = geometry.attributes.vertColor.array;
        var positionArray = geometry.attributes.position.array;

        this._geometry.attributes.vertColor.array = colorArray;
        this._geometry.attributes.vertColor.needsUpdate = true;

        this._geometry.attributes.position.array = positionArray;
        this._geometry.attributes.position.needsUpdate = true;

        this._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( this._geometry_settings["position"]["x"], this._geometry_settings["position"]["y"], this._geometry_settings["position"]["z"] ) );
        this._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( this._geometry_settings["rotation"]["x"] ));
        this._geometry.applyMatrix( new THREE.Matrix4().makeRotationY( this._geometry_settings["rotation"]["y"] ));
        this._geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( this._geometry_settings["rotation"]["z"] ));

        this._geometry.doubleSided = true;
    };

    Core.prototype.setSlicemapsImages = function(images, imagesPaths) {
        this._slicemaps_images = images;
        this._slicemaps_paths = imagesPaths != undefined ? imagesPaths : this._slicemaps_paths;
        this._setSlicemapsTextures(images);
        this._secondPassSetUniformValue("uSliceMaps", this._slicemaps_textures);
        console.log("Core: setSlicemapsImages()");
    };

    Core.prototype.setSteps = function(steps) {
        this._steps = steps;
        this._secondPassSetUniformValue("uSteps", this._steps);
        console.log("Core: setSteps()");
    };

    Core.prototype.setSlicesRange = function(from, to) {
        this._slices_gap = [from, to];
        this._secondPassSetUniformValue("uNumberOfSlices", this.getSlicesRange()[1])
        console.log("Core: setSlicesRange()");
    };

    Core.prototype.setOpacityFactor = function(opacity_factor) {
        this._opacity_factor = opacity_factor;
        this._secondPassSetUniformValue("uOpacityVal", this._opacity_factor);
        console.log("Core: setOpacityFactor()");
    };

    Core.prototype.setColorFactor = function(color_factor) {
        this._color_factor = color_factor;
        this._secondPassSetUniformValue("uColorVal", this._color_factor);
        console.log("Core: setColorFactor()");
    };

    Core.prototype.setAbsorptionMode = function(mode_index) {
        this._absorption_mode_index = mode_index;
        this._secondPassSetUniformValue("uAbsorptionModeIndex", this._absorption_mode_index);
        console.log("Core: setAbsorptionMode()");
    };

    Core.prototype.setGeometryDimension = function(key, value) {
        this._geometry_dimension[key] = value;
        this._setGeometry(this._geometry_dimension);
        console.log("Core: setGeometryMaxZ()");
    };

    Core.prototype.setRendererCanvasSize = function(width, height) {
        this._canvas_size = [width, height];
        
        if( (this._canvas_size[0] == '*' || this._canvas_size[1] == '*') && !this.onResizeWindow.isStart(this._onWindowResizeFuncIndex_canvasSize) ) {
            this.onResizeWindow.start(this._onWindowResizeFuncIndex_canvasSize);
        }

        if( (this._canvas_size[0] != '*' || this._canvas_size[1] != '*') && this.onResizeWindow.isStart(this._onWindowResizeFuncIndex_canvasSize) ) {
            this.onResizeWindow.stop(this._onWindowResizeFuncIndex_canvasSize);

        }

        var width = this.getCanvasSizeInPixels()[0];
        var height = this.getCanvasSizeInPixels()[1];

        // var canvas = this._renderer.domElement;
        this._renderer.domElement.style.width = width + "px";
        this._renderer.domElement.style.height = height + "px";

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        console.log("Core: setRendererCanvasSize()");
    };

    Core.prototype.setRendererSize = function(width, height) {
        this._render_size = [width, height];
        
        if( (this._render_size[0] == '*' || this._render_size[1] == '*') && !this.onResizeWindow.isStart(this._onWindowResizeFuncIndex_renderSize) ) {
            this.onResizeWindow.start(this._onWindowResizeFuncIndex_renderSize);
        }

        if( (this._render_size[0] != '*' || this._render_size[1] != '*') && this.onResizeWindow.isStart(this._onWindowResizeFuncIndex_renderSize) ) {
            this.onResizeWindow.stop(this._onWindowResizeFuncIndex_renderSize);

        }

        var width = this.getRenderSizeInPixels()[0];
        var height = this.getRenderSizeInPixels()[1];

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);

        this.setRendererCanvasSize(this.getCanvasSize()[0], this.getCanvasSize()[1]);

        console.log("Core: setRenderSize()");
    };

    Core.prototype.setBackgoundColor = function(color) {
        this._render_clear_color = color;
        this._renderer.setClearColor(color);
        console.log("Core: setBackgoundColor()");
    };

    Core.prototype.setRowCol = function(row, col) {
        this._slicemap_row_col = [row, col];
        this._secondPassSetUniformValue("uSlicesOverX", this._slicemap_row_col[0]);
        this._secondPassSetUniformValue("uSlicesOverY", this._slicemap_row_col[1]);
        console.log("Core: setRowCol()");
    };

    Core.prototype.setGrayMinValue = function(value) {
        this._gray_value[0] = value;
        this._secondPassSetUniformValue("uMinGrayVal", this._gray_value[0]);
        console.log("Core: setMinGrayValue()");
    };

    Core.prototype.setGrayMaxValue = function(value) {
        this._gray_value[1] = value;
        this._secondPassSetUniformValue("uMaxGrayVal", this._gray_value[1]);
        console.log("Core: setMaxGrayValue()");
    };

    Core.prototype.draw = function(fps) {
        this.onPreDraw.call(fps.toFixed(3));

        this._renderer.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
        // this._renderer.render( this._sceneFirstPass, this._camera );

        //Render the second pass and perform the volume rendering.
        this._renderer.render( this._sceneSecondPass, this._camera );

        this.onPostDraw.call(fps.toFixed(3));

    };

    Core.prototype.getDOMContainer = function() {
        return document.getElementById(this._dom_container_id);

    };

    Core.prototype.getRenderSize  = function() {
        var width = this._render_size[0];
        var height = this._render_size[1];

        return [width, height];
    };

    Core.prototype.getRenderSizeInPixels  = function() {
        var width = this.getRenderSize()[0];
        var height = this.getRenderSize()[0];

        if(this._render_size[0] == '*') {
            width = window.outerWidth;
        } 
        if(this._render_size[1] == '*') {
            height = window.outerHeight;
        }

        return [width, height];
    };

    Core.prototype.getCanvasSize = function() {
        var width = this._canvas_size[0];
        var height = this._canvas_size[1];

        return [width, height];
    };

    Core.prototype.getCanvasSizeInPixels = function() {
        var width = this.getCanvasSize()[0];
        var height = this.getCanvasSize()[1];

        if(this._canvas_size[0] == '*') {
            width = window.outerWidth;
        } 
        if(this._canvas_size[1] == '*') {
            height = window.outerHeight;
        }

        return [width, height];
    };

    Core.prototype.getSteps = function() {
        return this._steps;
    };

    Core.prototype.getSlicemapsImages = function() {
        return this._slicemaps_images;
    };

    Core.prototype.getSlicemapsPaths = function() {
        return this._slicemaps_paths;
    };

    Core.prototype.getRowCol = function() {
        return this._slicemap_row_col;
    };

    Core.prototype.getSlicesRange  = function() {
        var from = this._slices_gap[0];
        var to = this._slices_gap[1];
        if(this._slices_gap[1] == '*') {
            to = this.getRowCol()[0] * this.getRowCol()[1] * this.getSlicemapsImages().length;
        }

        return [from, to];
    };

    Core.prototype.getGeometryDimension = function() {
        return this._geometry_dimension;
    };

    Core.prototype.getGrayMinValue = function() {
        return this._gray_value[0];
    };

    Core.prototype.getGrayMaxValue = function() {
        return this._gray_value[1]; 
    }; 

    Core.prototype.getClearColor = function() {
        return this._render_clear_color;
    };

    Core.prototype.getTransferFunctionColors = function() {
        return this._transfer_function_colors;
    };

    Core.prototype.getOpacityFactor = function() {
        return this._opacity_factor;
    };

    Core.prototype.getColorFactor = function() {  
        return this._color_factor;
    };

    Core.prototype.getAbsorptionMode = function() {
        return this._absorption_mode_index;
    };

    Core.prototype.getClearColor = function() {
        return this._render_clear_color;
    };

    Core.prototype.getDomContainerId = function() {
        return this._dom_container_id;
    };

    Core.prototype._shaders = {
        // Here will be inserted shaders with help of grunt

    };

        // return me;

    window.VRC.Core = Core;

    // namespace.Core = Core;

// })(window.VRC);
window.VRC.Core.prototype._shaders.firstPass = {
	uniforms: THREE.UniformsUtils.merge([
		{
		}
	]),
	vertexShader: [
		'#ifdef GL_FRAGMENT_PRECISION_HIGH ',
		' // highp is supported ',
		' precision highp int; ',
		' precision highp float; ',
		'#else ',
		' // high is not supported ',
		' precision mediump int; ',
		' precision mediump float; ',
		'#endif',
		'attribute vec4 vertColor; ',
		'varying vec4 backColor; ',
		'varying vec4 pos; ',
		'void main(void) ',
		'{ ',
		'    backColor = vertColor; ',
		'    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0); ',
		'    gl_Position = pos; ',
		'}  '].join("\n"),
	fragmentShader: [
		'#ifdef GL_FRAGMENT_PRECISION_HIGH ',
		' // highp is supported ',
		' precision highp int; ',
		' precision highp float; ',
		'#else ',
		' // high is not supported ',
		' precision mediump int; ',
		' precision mediump float; ',
		'#endif ',
		'varying vec4 backColor; ',
		'void main(void) ',
		'{ ',
		'    gl_FragColor = backColor; ',
		'} '].join("\n")
};
window.VRC.Core.prototype._shaders.secondPass = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uTransferFunction" : { type: "t", value: null },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSteps" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'#ifdef GL_FRAGMENT_PRECISION_HIGH ',
		' // highp is supported ',
		' precision highp int; ',
		' precision highp float; ',
		'#else ',
		' // high is not supported ',
		' precision mediump int; ',
		' precision mediump float; ',
		'#endif',
		'attribute vec4 vertColor; ',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'void main(void) ',
		'{ ',
		'    frontColor = vertColor; ',
		'    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0); ',
		'    gl_Position = pos; ',
		'} '].join("\n"),
	fragmentShader: [
		'#ifdef GL_FRAGMENT_PRECISION_HIGH ',
		' // highp is supported ',
		' precision highp int; ',
		' precision highp float; ',
		'#else ',
		' // high is not supported ',
		' precision mediump int; ',
		' precision mediump float; ',
		'#endif ',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[10]; ',
		'uniform sampler2D uTransferFunction; ',
		'uniform float uNumberOfSlices; ',
		'uniform float uMinGrayVal; ',
		'uniform float uMaxGrayVal; ',
		'uniform float uOpacityVal; ',
		'uniform float uColorVal; ',
		'uniform float uAbsorptionModeIndex; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float uSteps; ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'float getVolumeValue(vec3 volpos) ',
		'{ ',
		' float s1Original, s2Original, s1, s2; ',
		' float dx1, dy1; ',
		' float dx2, dy2; ',
		' float value; ',
		' vec2 texpos1,texpos2; ',
		' float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		' s1Original = floor(volpos.z*uNumberOfSlices); ',
		' s2Original = min(s1Original+1.0, uNumberOfSlices); ',
		' int tex1Index = int(floor(s1Original / slicesPerSprite)); ',
		' int tex2Index = int(floor(s2Original / slicesPerSprite)); ',
		' s1 = mod(s1Original, slicesPerSprite); ',
		' s2 = mod(s2Original, slicesPerSprite); ',
		' dx1 = fract(s1/uSlicesOverX); ',
		' dy1 = floor(s1/uSlicesOverY)/uSlicesOverY; ',
		' dx2 = fract(s2/uSlicesOverX); ',
		' dy2 = floor(s2/uSlicesOverY)/uSlicesOverY; ',
		' texpos1.x = dx1+(volpos.x/uSlicesOverX); ',
		' texpos1.y = dy1+(volpos.y/uSlicesOverY); ',
		' texpos2.x = dx2+(volpos.x/uSlicesOverX); ',
		' texpos2.y = dy2+(volpos.y/uSlicesOverY); ',
		' float value1, value2; ',
		' bool value1Set = false, value2Set = false; ',
		' for (int x = 0; x < 10; x++) { ',
		'     if(x == tex1Index) { ',
		'         value1 = texture2D(uSliceMaps[x],texpos1).x; ',
		'         value1Set = true; ',
		'     } ',
		'     if(x == tex2Index) { ',
		'         value2 = texture2D(uSliceMaps[x],texpos2).x; ',
		'         value2Set = true; ',
		'     } ',
		'     if(value1Set && value2Set) { ',
		'         break; ',
		'     } ',
		' } ',
		' return mix(value1, value2, fract(volpos.z*uNumberOfSlices)); ',
		'} ',
		'void main(void) ',
		'{ ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' //dir /= length(dir); ',
		' vec4 vpos = frontColor; ',
		'//      vec3 Step = dir/uSteps; ',
		' vec3 Step = dir/uSteps; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		' float biggest_gray_value = 0.0; ',
		' float opacityFactor = uOpacityVal; ',
		' float lightFactor = uColorVal; ',
		' // const 4095 - just example of big number ',
		' // It because expression i > uSteps impossible ',
		' for(float i = 0.0; i < 4095.0; i+=1.0) ',
		' { ',
		' // It because expression i > uSteps impossible ',
		'     if(i == uSteps) { ',
		'         break; ',
		'     } ',
		'     float gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val < uMinGrayVal || gray_val > uMaxGrayVal) { ',
		'         colorValue = vec4(0.0); ',
		'     } else { ',
		'         if(biggest_gray_value < gray_val) { ',
		'            biggest_gray_value = gray_val; ',
		'         } ',
		'         if(uAbsorptionModeIndex == 0.0) ',
		'         { ',
		'             vec2 tf_pos; ',
		'             tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal); ',
		'             tf_pos.y = 0.5; ',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0); ',
		'             sample.a = colorValue.a * opacityFactor; ',
		'             sample.rgb = colorValue.rgb * uColorVal; ',
		'             accum += sample; ',
		'             if(accum.a>=1.0) ',
		'                break; ',
		'         } ',
		'         if(uAbsorptionModeIndex == 1.0) ',
		'         { ',
		'             vec2 tf_pos; ',
		'             tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal); ',
		'             tf_pos.y = 0.5; ',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0); ',
		'             sample.a = colorValue.a * opacityFactor * (1.0 / uSteps); ',
		'             sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * lightFactor; ',
		'             accum += sample; ',
		'             if(accum.a>=1.0) ',
		'                break; ',
		'         } ',
		'         if(uAbsorptionModeIndex == 2.0) ',
		'         { ',
		'             vec2 tf_pos; ',
		'             tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal); ',
		'             tf_pos.y = 0.5; ',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0); ',
		'             sample.a = colorValue.a * opacityFactor; ',
		'             sample.rgb = colorValue.rgb * uColorVal; ',
		'             accum = sample; ',
		'         } ',
		'     } ',
		'     //advance the current position ',
		'     vpos.xyz += Step; ',
		'     //break if the position is greater than <1, 1, 1> ',
		'     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) ',
		'     { ',
		'         break; ',
		'     } ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};

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
                
                // me._core._controls.update();
                // me._needRedraw = true;

            };

            animate();

        };

        me.setSlicemapsImages = function(images, imagesPaths) {
            var ctx = me._core._renderer.getContext()
            var maxTexSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE);

            var firstImage = images[0];

            if(Math.max(firstImage.width, firstImage.height) > maxTexSize) {
                throw Error("Size of slice bigger than maximum possible on current GPU. Maximum size of texture: " + maxTexSize);                

            } else {
                me._core.setSlicemapsImages(images, imagesPaths);
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
            me._core.setSteps(steps_number);
            me._needRedraw = true;

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

        me.setRendererSize = function(width, height) {
            var ctx = me._core._renderer.getContext()
            var maxRenderbufferSize = ctx.getParameter(ctx.MAX_RENDERBUFFER_SIZE);
            if(Math.max(width, height) > maxRenderbufferSize) {
                console.warn("Size of canvas setted in " + maxRenderbufferSize + "x" + maxRenderbufferSize + ". Max render buffer size is " + maxRenderbufferSize + ".");
                me._core.setRendererSize(maxRenderbufferSize, maxRenderbufferSize);

            } else {
                me._core.setRendererSize(width, height);

            }

            me._needRedraw = true;

        };

        me.setRendererCanvasSize = function(width, height) {
            me._core.setRendererCanvasSize(width, height);
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

        me.getRenderSize = function() {
            return me._core.getRenderSize();
        };

        me.getRenderSizeInPixels  = function() {
            return me._core.getRenderSizeInPixels();
        };

        me.getCanvasSize = function() {
            return me._core.getCanvasSize();
        };

        me.getCanvasSizeInPixels = function() {
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

            if(config['tf_colors'] != undefined) {
                me._core.setTransferFunctionByColors( config['tf_colors'] );   
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

            if(config['renderer_size'] != undefined) {
                me.setRendererSize( config['renderer_size'][0], config['renderer_size'][1] );
            }

            if(config['renderer_canvas_size'] != undefined) {
                me.setRendererCanvasSize( config['renderer_canvas_size'][0], config['renderer_canvas_size'][1] );
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
                      onLoad(JSON.parse(xmlhttp.responseText));
                   }
                   else if(xmlhttp.status == 400) {
                      userOnError(xmlhttp);
                   }
                   else {
                        userOnError(xmlhttp);
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
                "row_col": me.getRowCol(),
                "gray_min": me.getGrayMinValue(),
                "gray_max": me.getGrayMaxValue(),
                "slicemaps_paths": me.getSlicemapsPaths(),
                "opacity_factor": me.getOpacityFactor(),
                "color_factor": me.getColorFactor(),
                "absorption_mode": me.getAbsorptionMode(),
                "renderer_size": me.getRenderSize(),
                "renderer_canvas_size": me.getCanvasSize(),
                "backgound": me.getClearColor(),
                "tf_path": me.getTransferFunctionAsImage().src,
                "tf_colors": me.getTransferFunctionColors(),
                "x_min": me.getGeometryDimension()["xmin"],
                "x_max": me.getGeometryDimension()["xmax"],
                "y_min": me.getGeometryDimension()["ymin"],
                "y_max": me.getGeometryDimension()["ymax"],
                "z_min": me.getGeometryDimension()["zmin"], 
                "z_max": me.getGeometryDimension()["zmax"],
                "dom_container_id": me.getDomContainerId(),
                "auto_steps": me.isAutoStepsOn(),
            };

            return config;

        };

        me.init();

        me.setConfig(config);

        return me;

    };

    namespace.VolumeRaycaster = VolumeRaycaster;

})(window.VRC);