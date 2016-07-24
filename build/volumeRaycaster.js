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
 */

(function(namespace) {
    var EventDispatcher = function(O) {

        var me = {};
        me.class = this;

        me._functions = [];
        me._context = window;

        me.add = function(func, is_start) {
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
            for(prop in O) {
                switch(prop) {
                    case "context": {
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
 *
 */

(function(namespace) {
    var AdaptationManager = function() {

        var me = {};

        me._core = {};

        me._step = 5;
        me._steps = me._step * 2;

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
            var delta = me._step;
            var direction = me._step * (steps - me.getSteps()) > 0 ? 1 : -1;

            for(var adaptationSteps = me.getSteps(); adaptationSteps<me._core.getMaxStepsNumber(); adaptationSteps+=direction) {
                if(Math.abs(adaptationSteps - steps) <= delta) {
                    if(steps > adaptationSteps) {
                        return [adaptationSteps, adaptationSteps+me._step];

                    }

                    if(steps > adaptationSteps) {
                        return [adaptationSteps-me._step, adaptationSteps];

                    }

                    if(steps == adaptationSteps) {
                        return [adaptationSteps-me._step, adaptationSteps+me._step];

                    }
                }
            };

            return [me._core.getMaxStepsNumber()-me._step, me._core.getMaxStepsNumber()];
        };

        me.decreaseSteps = function() {
            var nearestSurroundingsPossibleSteps = me.getNearestSurroundingsPossibleStep(me._core.getSteps());
            me._steps = nearestSurroundingsPossibleSteps[0];
        };

        me.increaseSteps = function() {
            var nearestSurroundingsPossibleSteps = me.getNearestSurroundingsPossibleStep(me._core.getSteps());
            me._steps = nearestSurroundingsPossibleSteps[1];
        };

        me.getSteps = function() {
            return me._steps;
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

            if( fps < 10 && me.getSteps() > (me._step * 2) ) {
                me._numberOfChanges--;
                if(me._numberOfChanges == -5) {
                    me.decreaseSteps();
                    //console.log("FPS: " + fps + ", Number of steps: " + me.getSteps() );
                    me._numberOfChanges = 0;

                    me._core.setSteps( me.getSteps() );
                }


            } else if( fps > 30 && me.getSteps() < me._core.getMaxStepsNumber() ) {
                me._numberOfChanges++;
                if(me._numberOfChanges == 3) {
                    me.increaseSteps();
                    //console.log("FPS: " + fps + ", Number of steps: " + me.getSteps() );
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
 */

(function(namespace) {
    var GeometryHelper = function() {

        var me = {};

        me.createBoxGeometry = function(geometryDimension, volumeSize, zFactor) {
            var vertexPositions = [
                //front face first
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]], 
                //front face second
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]], 

                // back face first
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                // back face second
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],

                // top face first
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                // top face second
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmin * volumeSize[2]],

                // bottom face first
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                // bottom face second
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmax * volumeSize[2]],

                // right face first
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                // right face second
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmax * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmax * volumeSize[2]],

                // left face first
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                // left face second
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymin * volumeSize[1], geometryDimension.zmin * volumeSize[2]],
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmax * volumeSize[2]],
                [geometryDimension.xmin * volumeSize[0], geometryDimension.ymax * volumeSize[1], geometryDimension.zmin * volumeSize[2]]
            ];

            var vertexColors = [
                //front face first
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmax],
                [geometryDimension.xmax, geometryDimension.ymin, geometryDimension.zmax],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmax],
                //front face second
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmax],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmax],
                [geometryDimension.xmin, geometryDimension.ymax, geometryDimension.zmax],

                // back face first
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmin],
                [geometryDimension.xmin, geometryDimension.ymax, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmin],
                // back face second
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymin, geometryDimension.zmin],

                // top face first
                [geometryDimension.xmin, geometryDimension.ymax, geometryDimension.zmin],
                [geometryDimension.xmin, geometryDimension.ymax, geometryDimension.zmax],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmax],
                // top face second
                [geometryDimension.xmin, geometryDimension.ymax, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmax],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmin],

                // bottom face first
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymin, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymin, geometryDimension.zmax],
                // bottom face second
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymin, geometryDimension.zmax],
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmax],

                // right face first
                [geometryDimension.xmax, geometryDimension.ymin, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmax],
                // right face second
                [geometryDimension.xmax, geometryDimension.ymin, geometryDimension.zmin],
                [geometryDimension.xmax, geometryDimension.ymax, geometryDimension.zmax],
                [geometryDimension.xmax, geometryDimension.ymin, geometryDimension.zmax],

                // left face first
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmin],
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmax],
                [geometryDimension.xmin, geometryDimension.ymax, geometryDimension.zmax],
                // left face second
                [geometryDimension.xmin, geometryDimension.ymin, geometryDimension.zmin],
                [geometryDimension.xmin, geometryDimension.ymax, geometryDimension.zmax],
                [geometryDimension.xmin, geometryDimension.ymax, geometryDimension.zmin]
            ];

            var positions = [];
            var colors = [];

            for(var i = 0; i < vertexPositions.length; i++) {
                var backCounter = vertexPositions.length - 1 - i;
                var x = vertexPositions[backCounter][0];
                var y = vertexPositions[backCounter][1];
                var z = vertexPositions[backCounter][2] * zFactor;

                var r = vertexColors[backCounter][0];
                var g = vertexColors[backCounter][1];
                var b = vertexColors[backCounter][2];

                positions.push(x);
                positions.push(y);
                positions.push(z);

                colors.push(r);
                colors.push(g);
                colors.push(b);
                colors.push(1.0);
            }

            var geometry = new THREE.BufferGeometry();
            var bufferPositions = new Float32Array(positions);
            geometry.addAttribute( 'position', new THREE.BufferAttribute( bufferPositions, 3 ) );
            geometry.addAttribute( 'vertColor', new THREE.BufferAttribute(new Float32Array(colors), 4));
            //geometry.computeBoundingSphere();
            geometry.computeBoundingBox();

            return geometry;
        }

        return me;
        
    };

    namespace.GeometryHelper = GeometryHelper;

})(window.VRC);

/**
 * @classdesc
 * Core
 * 
 * @class Core
 * @this {Core}
 * @maintainer nicholas.jerome@kit.edu
 */

var Core = function(conf) {
    // USCT Parameters  
    this.zFactor = conf.zFactor != undefined ? conf.zFactor : 1;
    this.l = conf.l;
    this.s = conf.s;
    this.screwThreshold = conf.screwThreshold;
    this.jointThreshold = conf.s;
  
    this.hMin = conf.hMin;
    this.hMax = conf.hMax;
  
    this.minRefl = conf.minRefl;
    this.minSos = conf.minSos;
    this.minAtten = conf.minAtten;
  
    this.maxRefl = conf.maxRefl;
    this.maxSos = conf.maxSos;
    this.maxAtten = conf.maxAtten;

    // General Parameters
    this._steps = 20;
    this._slices_gap = [0, '*'];
    this._slicemap_row_col = [16, 16];
    this._gray_value = [0.0, 1.0];
    this._slicemaps_images = [];
    this._slicemaps_paths = [];
    this._slicemaps_width = [];
    this._slicemaps_textures = [];
    this._opacity_factor = conf.opacity_factor != undefined ? conf.opacity_factor : 35;
    this._color_factor = conf.color_factor != undefined ? conf.color_factor: 3;
    this._shader_name = conf.shader_name == undefined ? "secondPassDefault" : conf.shader_name;
    this._render_size = conf.renderer_size == undefined ? ['*', '*'] : conf.renderer_size;
    this._canvas_size = conf.renderer_canvas_size;
    this._render_clear_color = "#000";
    this._transfer_function_as_image = new Image();
    this._volume_sizes = [1024.0, 1024.0, 1024.0];
    this._geometry_dimensions = {
        "xmin": 0.0,
        "xmax": 1.0,
        "ymin": 0.0,
        "ymax": 1.0,
        "zmin": 0.0,
        "zmax": 1.0
    };
    this._threshold_otsu_index = 0;
    this._threshold_isodata_index = 0;
    this._threshold_yen_index = 0;
    this._threshold_li_index = 0;
  
    this._transfer_function_colors = [
        {"pos": 0.25, "color": "#892c2c"},
        {"pos": 0.5, "color": "#00ff00"},
        {"pos": 0.75, "color": "#0000ff"}
    ];

    this._dom_container_id = conf.dom_container != undefined ? conf.dom_container : "container";
    this._dom_container = {};
    this._render = {};
    this._camera = {};
    this._camera_settings = {
        "rotation": {
            x: 0.0,
            y: 0.0,
            z: 0.0
        },
        "position": {
            "x": 1, 
            "y": 1,
            "z": 3
        }
    };

    this._rtTexture = {};

    this._geometry = {};
    this._geometry_settings = {
        "rotation": {
            x: 0.0,
            y: 0.0,
            z: 0.0
        }
    };

    this._materialFirstPass = {};
    this._materialSecondPass = {};

    this._sceneFirstPass = {};
    this._sceneSecondPass = {};

    this._meshFirstPass = {};
    this._meshSecondPass = {};

    this.onPreDraw = new VRC.EventDispatcher();
    this.onPostDraw = new VRC.EventDispatcher();
    this.onResizeWindow = new VRC.EventDispatcher();
    this.onCameraChange = new VRC.EventDispatcher();
    this.onCameraChangeStart = new VRC.EventDispatcher();
    this.onCameraChangeEnd = new VRC.EventDispatcher();
    this.onChangeTransferFunction = new VRC.EventDispatcher();

    this._onWindowResizeFuncIndex_canvasSize = -1;
    this._onWindowResizeFuncIndex_renderSize = -1;

    this._callback = conf.callback;

    try {
        if(this._canvas_size[0] > this._canvas_size[1])
            this._camera_settings.position.z = 2; 
    } catch(e){}
};

Core.prototype.init = function() {
    var me = this;
    this._container = this.getDOMContainer();

    this._render = new THREE.WebGLRenderer({ alpha : true });  
    this._render.setSize(this.getRenderSizeInPixels()[0],
                         this.getRenderSizeInPixels()[1]);
    this._render.setClearColor(this._render_clear_color, 0);

    this._container.appendChild( this._render.domElement );

    this._camera = new THREE.PerspectiveCamera(
        45, 
        this.getRenderSizeInPixels()[0] / this.getRenderSizeInPixels()[1],
        0.01,
        11
    );
    this._camera.position.x = this._camera_settings["position"]["x"];
    this._camera.position.y = this._camera_settings["position"]["y"];
    this._camera.position.z = this._camera_settings["position"]["z"];

    this._camera.rotation.x = this._camera_settings["rotation"]["x"];
    this._camera.rotation.y = this._camera_settings["rotation"]["y"];
    this._camera.rotation.z = this._camera_settings["rotation"]["z"];

    this.isAxisOn = false;

    this._controls = new THREE.TrackballControls(this._camera, this._render.domElement);
    this._controls.rotateSpeed = 2.0;
    this._controls.zoomSpeed = 2.0;
    this._controls.panSpeed = 2.0;

    this._controls.noZoom = false;
    this._controls.noPan = false;

    this._controls.staticMoving = true;
    this._controls.dynamicDampingFactor = 0.3;

    this._rtTexture = new THREE.WebGLRenderTarget( this.getRenderSizeInPixels()[0], this.getRenderSizeInPixels()[1], { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat} );
    this._rtTexture.wrapS = this._rtTexture.wrapT = THREE.ClampToEdgeWrapping;
    
    this._materialFirstPass = new THREE.ShaderMaterial( {
        vertexShader: this._shaders.firstPass.vertexShader,
        fragmentShader: this._shaders.firstPass.fragmentShader,
        attributes: {
            vertColor: {type: 'c', value: [] }
        },
        side: THREE.FrontSide,
        transparent: true
    } );
    
    this._materialSecondPass = new THREE.ShaderMaterial( {
        vertexShader: this._shaders[this._shader_name].vertexShader,
        fragmentShader: ejs.render( this._shaders[this._shader_name].fragmentShader, {
          "maxTexturesNumber": me.getMaxTexturesNumber()}),
        attributes: {
            vertColor:                       {type: 'c', value: [] }
        },
        uniforms: {
            uBackCoord:                      { type: "t",  value: this._rtTexture }, 
            uSliceMaps:                      { type: "tv", value: this._slicemaps_textures }, 

            uSteps:                          { type: "f", value: this._steps },
            uSlicemapWidth:                  { type: "f", value: this._slicemaps_width},
            uNumberOfSlices:                 { type: "f", value: this.getSlicesRange()[1] },
            uSlicesOverX:                    { type: "f", value: this._slicemap_row_col[0] },
            uSlicesOverY:                    { type: "f", value: this._slicemap_row_col[1] },
            uOpacityVal:                     { type: "f", value: this._opacity_factor },
            darkness:                        { type: "f", value: this._color_factor },            
            
            screwThreshold:                  { type: "f", value: this.screwThreshold },
            jointThreshold:                  { type: "f", value: this.jointThreshold },
            l:                               { type: "f", value: this.l },
            s:                               { type: "f", value: this.s },
            hMin:                            { type: "f", value: this.hMin },
            hMax:                            { type: "f", value: this.hMax },
          
            minSos:                          { type: "f", value: this.minSos },
            maxSos:                          { type: "f", value: this.maxSos },
            minAtten:                        { type: "f", value: this.minAtten },
            maxAtten:                        { type: "f", value: this.maxAtten },
            minRefl:                         { type: "f", value: this.minRefl },
            maxRefl:                         { type: "f", value: this.maxRefl },  
          
           uTransferFunction:               { type: "t",  value: this._transfer_function },
           uColorVal:                       { type: "f", value: this._color_factor },
           uAbsorptionModeIndex:            { type: "f", value: this._absorption_mode_index },
           uMinGrayVal:                     { type: "f", value: this._gray_value[0] },
           uMaxGrayVal:                     { type: "f", value: this._gray_value[1] }
        },
        side: THREE.BackSide,
        transparent: true
    });

    this._sceneFirstPass = new THREE.Scene();
    this._sceneSecondPass = new THREE.Scene();

    // Created mesh for both passes using geometry helper
    this._initGeometry( this.getGeometryDimensions(), this.getVolumeSizeNormalized() );    
    this._meshFirstPass = new THREE.Mesh( this._geometry, this._materialFirstPass );
    this._meshSecondPass = new THREE.Mesh( this._geometry, this._materialSecondPass );

    //this._axes = buildAxes(0.5);
    this._sceneFirstPass.add(this._meshFirstPass);
    this._sceneSecondPass.add(this._meshSecondPass);
    //this._sceneSecondPass.add(this._axes);
    
    var mesh = new THREE.Mesh(
        new THREE.BoxGeometry( 1, 1, 1 ),
        new THREE.MeshNormalMaterial()
    );
    this._wireframe = new THREE.BoxHelper( mesh );
    this._wireframe.material.color.set( 0xe3e3e3 );
    this._sceneSecondPass.add( this._wireframe );
    
    /*
    var mesh2 = new THREE.Mesh(
        new THREE.BoxGeometry( 0.5, 0.5, 0.5 ),
        new THREE.MeshNormalMaterial()
    );
    this._wireframe2 = new THREE.BoxHelper( mesh2 );
    this._wireframe2.material.color.set( 0xff0000 );
    this._wireframe2.position.set( -0.8, -0.5, 0.5 );
    this._sceneSecondPass.add( this._wireframe2 );
    */
    
    var xdir = new THREE.Vector3( 1, 0, 0 );
    var xorigin = new THREE.Vector3( -0.8, -0.5, 0.5 );
    var xlength = 0.2;
    var xhex = 0xff0000;
    var xarrowHelper = new THREE.ArrowHelper( xdir, xorigin, xlength, xhex );
    this._sceneSecondPass.add( xarrowHelper );
    
    var ydir = new THREE.Vector3( 0, 1, 0 );
    var yorigin = new THREE.Vector3( -0.8, -0.5, 0.5 );
    var ylength = 0.2;
    var yhex = 0x00ff00;
    var yarrowHelper = new THREE.ArrowHelper( ydir, yorigin, ylength, yhex );
    this._sceneSecondPass.add( yarrowHelper );
    
    var zdir = new THREE.Vector3( 0, 0, 1 );
    var zorigin = new THREE.Vector3( -0.8, -0.5, 0.5 );
    var zlength = 0.2;
    var zhex = 0x0000ff;
    var zarrowHelper = new THREE.ArrowHelper( zdir, zorigin, zlength, zhex );
    this._sceneSecondPass.add( zarrowHelper );
    //scene.add( arrowHelper );
    
    /*
    // alternate method
    var helper = new THREE.EdgesHelper( mesh, 0xff0000 );
    scene.add( helper );
    */
      
    // FramesPerSecond
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms, 2: mb
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.right = '10px';
    stats.domElement.style.top = '10px';
    document.body.appendChild( stats.domElement );
    
    var update = function () {
        stats.begin();
        stats.end();
        requestAnimationFrame( update );
    };

    requestAnimationFrame( update );

    window.addEventListener( 'resize', function() {
        me.onResizeWindow.call();
    }, false );

    this._controls.addEventListener("change", function() {
        console.log("Controls Changes");
        me.onCameraChange.call();
    });

    this._controls.addEventListener("start", function() {
        console.log("Controls Starts");
        me.onCameraChangeStart.call();
    });

    this._controls.addEventListener("end", function() {
        console.log("Controls End");
        me.onCameraChangeEnd.call();
    });

    this._onWindowResizeFuncIndex_canvasSize = this.onResizeWindow.add(function() {
        me.setRenderCanvasSize('*', '*');
    }, false);

    this.setTransferFunctionByColors(this._transfer_function_colors);

    this._render.setSize(this.getRenderSizeInPixels()[0], this.getRenderSizeInPixels()[1]); 
    this.setRenderCanvasSize(this.getCanvasSize()[0], this.getCanvasSize()[1]);
    
    try{
        this._callback();   
    } catch(e){}       
};




Core.prototype._secondPassSetUniformValue = function(key, value) {
    this._materialSecondPass.uniforms[key].value = value;
};


Core.prototype._setSlicemapsTextures = function(images) {
    var textures = [];

    for(var i=0; i<images.length; i++) {
        var texture = new THREE.Texture( images[i] );
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.generateMipmaps = false;
        texture.flipY = false;
        texture.needsUpdate = true;

        textures.push(texture);
    };
    this._slicemaps_textures = textures;
};


Core.prototype.setTransferFunctionByImage = function(image) {
    console.log("Core: setTransferFunctionByImage()");
    this._transfer_function_as_image = image;
    var texture = new THREE.Texture(image);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT =  THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.flipY = true;
    texture.needsUpdate = true;

    this._secondPassSetUniformValue("uTransferFunction", texture);
    this.onChangeTransferFunction.call(image);
};


Core.prototype.setScrewThreshold = function(v) {
    this.screwThreshold = v;
    this._secondPassSetUniformValue("screwThreshold", this.screwThreshold);
}


Core.prototype.setJointThreshold = function(v) {
    this.jointThreshold = v;
    this._secondPassSetUniformValue("jointThreshold", this.jointThreshold);
}


Core.prototype.setL = function(v) {
    this.l = v;
    this._secondPassSetUniformValue("l", this.l);
}


Core.prototype.setS = function(v) {
    this.s = v;
    this._secondPassSetUniformValue("s", this.s);
}


Core.prototype.setHMin = function(v) {
    this.hMin = v;
    this._secondPassSetUniformValue("hMin", this.hMin);
}


Core.prototype.setHMax = function(v) {
    this.hMax = v;
    this._secondPassSetUniformValue("hMax", this.hMax);
}


Core.prototype.setMaxRefl = function(v) {
    this.maxRefl = v;
    this._secondPassSetUniformValue("maxRefl", this.maxRefl);
}


Core.prototype.setMaxSos = function(v) {
    this.maxSos = v;
    this._secondPassSetUniformValue("maxSos", this.maxSos);
}


Core.prototype.setMinAtten = function(v) {
    this.minAtten = v;
    this._secondPassSetUniformValue("minAtten", this.minAtten);
}


Core.prototype.setMinRefl = function(v) {
    this.minRefl = v;
    this._secondPassSetUniformValue("minRefl", this.minRefl);
}


Core.prototype.setMinSos = function(v) {
    this.minSos = v;
    this._secondPassSetUniformValue("minSos", this.minSos);
}


Core.prototype.setMaxAtten = function(v) {
    this.maxAtten = v;
    this._secondPassSetUniformValue("maxAtten", this.maxAtten);
}


Core.prototype.setTransferFunctionByColors = function(colors) {
    console.log("Core: setTransferFunctionByColors()");
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


Core.prototype._initGeometry = function(geometryDimensions, volumeSizes) {
    var geometryHelper = new VRC.GeometryHelper();
    this._geometry = geometryHelper.createBoxGeometry(geometryDimensions, volumeSizes, this.zFactor);

    this._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( -volumeSizes[0] / 2, -volumeSizes[1] / 2, -volumeSizes[2] / 2 ) );
    this._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( this._geometry_settings["rotation"]["x"] ));
    this._geometry.applyMatrix( new THREE.Matrix4().makeRotationY( this._geometry_settings["rotation"]["y"] ));
    this._geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( this._geometry_settings["rotation"]["z"] ));
    this._geometry.doubleSided = true;
};


Core.prototype.setMode = function(conf) {  
  this._shader_name =  conf.shader_name;
  
  this._materialSecondPass = new THREE.ShaderMaterial( {
        vertexShader: this._shaders[this._shader_name].vertexShader,
        fragmentShader: ejs.render( this._shaders[this._shader_name].fragmentShader, {
          "maxTexturesNumber": this.getMaxTexturesNumber()}),
        attributes: {
            vertColor:                       {type: 'c', value: [] }
        },
        uniforms: {
            uBackCoord:                      { type: "t",  value: this._rtTexture }, 
            uSliceMaps:                      { type: "tv", value: this._slicemaps_textures }, 
          
            uNumberOfSlices:                 { type: "f", value: this.getSlicesRange()[1] },
            uSlicemapWidth:                  { type: "f", value: this._slicemaps_width},
            uSlicesOverX:                    { type: "f", value: this._slicemap_row_col[0] },
            uSlicesOverY:                    { type: "f", value: this._slicemap_row_col[1] },
            uOpacityVal:                     { type: "f", value: this._opacity_factor },
            darkness:                        { type: "f", value: this._color_factor },
          
            l:                               { type: "f", value: this.l },
            s:                               { type: "f", value: this.s },
            hMin:                            { type: "f", value: this.hMin },
            hMax:                            { type: "f", value: this.hMax },
          
            minSos:                          { type: "f", value: this.minSos },
            maxSos:                          { type: "f", value: this.maxSos },
            minAtten:                        { type: "f", value: this.minAtten },
            maxAtten:                        { type: "f", value: this.maxAtten },
            minRefl:                         { type: "f", value: this.minRefl },
            maxRefl:                         { type: "f", value: this.maxRefl }    
        },
        side: THREE.BackSide,
        transparent: true
    });
  
  this._meshSecondPass = new THREE.Mesh( this._geometry, this._materialSecondPass );
  
  this._sceneSecondPass = new THREE.Scene();
  this._sceneSecondPass.add( this._meshSecondPass );
}


Core.prototype._setGeometry = function(geometryDimensions, volumeSizes) {
    var geometryHelper = new VRC.GeometryHelper();
    var geometry      = geometryHelper.createBoxGeometry(geometryDimensions, volumeSizes, this.zFactor);
    var colorArray    = geometry.attributes.vertColor.array;
    var positionArray = geometry.attributes.position.array;

    this._geometry.attributes.vertColor.array = colorArray;
    this._geometry.attributes.vertColor.needsUpdate = true;

    this._geometry.attributes.position.array = positionArray;
    this._geometry.attributes.position.needsUpdate = true;

    this._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( -volumeSizes[0] / 2, -volumeSizes[1] / 2, -volumeSizes[2] / 2 ) );
    this._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( this._geometry_settings["rotation"]["x"] ));
    this._geometry.applyMatrix( new THREE.Matrix4().makeRotationY( this._geometry_settings["rotation"]["y"] ));
    this._geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( this._geometry_settings["rotation"]["z"] ));

    this._geometry.doubleSided = true;
};


Core.prototype.setSlicemapsImages = function(images, imagesPaths) {
    console.log("Core: setSlicemapsImages()");
    this._slicemaps_images = images;
    this._slicemaps_paths = imagesPaths != undefined ? imagesPaths : this._slicemaps_paths;
    this._setSlicemapsTextures(images);
    this._secondPassSetUniformValue("uSliceMaps", this._slicemaps_textures);
    this._slicemaps_width = images[0].width;
    this._secondPassSetUniformValue("uSlicemapWidth", this._slicemaps_width);
};


Core.prototype.setSteps = function(steps) {
    //console.log("Core: setSteps(" + steps + ")");
    this._steps = steps;
    this._secondPassSetUniformValue("uSteps", this._steps);
};


Core.prototype.setSlicesRange = function(from, to) {
    console.log("Core: setSlicesRange()");
    this._slices_gap = [from, to];
    this._secondPassSetUniformValue("uNumberOfSlices", this.getSlicesRange()[1])
};


Core.prototype.setOpacityFactor = function(opacity_factor) {
    console.log("Core: setOpacityFactor()");
    this._opacity_factor = opacity_factor;
    this._secondPassSetUniformValue("uOpacityVal", this._opacity_factor);
};


Core.prototype.setColorFactor = function(color_factor) {
    console.log("Core: setColorFactor()");
    this._color_factor = color_factor;
    this._secondPassSetUniformValue("darkness", this._color_factor);
};


Core.prototype.setAbsorptionMode = function(mode_index) {
    console.log("Core: setAbsorptionMode()");
    this._absorption_mode_index = mode_index;
    this._secondPassSetUniformValue("uAbsorptionModeIndex", this._absorption_mode_index);
};


Core.prototype.setVolumeSize = function(width, height, depth) {
    console.log("Core: setVolumeSize()");
    this._volume_sizes = [width, height, depth];

    var maxSize = Math.max(this.getVolumeSize()[0], this.getVolumeSize()[1], this.getVolumeSize()[2]);
    var normalizedVolumeSizes = [this.getVolumeSize()[0] / maxSize,  this.getVolumeSize()[1] / maxSize, this.getVolumeSize()[2] / maxSize];

    this._setGeometry(this.getGeometryDimensions(), normalizedVolumeSizes);
};


Core.prototype.setGeometryDimensions = function(geometryDimension) {
    console.log("Core: setGeometryDimension()");
    this._geometry_dimensions = geometryDimension;

    this._setGeometry(this._geometry_dimensions, this.getVolumeSizeNormalized());
};


Core.prototype.setRenderCanvasSize = function(width, height) {
    console.log("Core: setRenderCanvasSize()");
    this._canvas_size = [width, height];
    
    if( (this._canvas_size[0] == '*' || this._canvas_size[1] == '*') && !this.onResizeWindow.isStart(this._onWindowResizeFuncIndex_canvasSize) ) {
        this.onResizeWindow.start(this._onWindowResizeFuncIndex_canvasSize);
    }

    if( (this._canvas_size[0] != '*' || this._canvas_size[1] != '*') && this.onResizeWindow.isStart(this._onWindowResizeFuncIndex_canvasSize) ) {
        this.onResizeWindow.stop(this._onWindowResizeFuncIndex_canvasSize);

    }

    var width = this.getCanvasSizeInPixels()[0];
    var height = this.getCanvasSizeInPixels()[1];

    this._render.domElement.style.width = width + "px";
    this._render.domElement.style.height = height + "px";

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
};


Core.prototype.setBackgroundColor = function(color) {
    console.log("Core: setBackgroundColor()");
    this._render_clear_color = color;
    this._render.setClearColor(color);
};


Core.prototype.setRowCol = function(row, col) {
    console.log("Core: setRowCol()");
    this._slicemap_row_col = [row, col];
    this._secondPassSetUniformValue("uSlicesOverX", this._slicemap_row_col[0]);
    this._secondPassSetUniformValue("uSlicesOverY", this._slicemap_row_col[1]);
};


Core.prototype.setGrayMinValue = function(value) {
    console.log("Core: setMinGrayValue()");
    this._gray_value[0] = value;
    this._secondPassSetUniformValue("uMinGrayVal", this._gray_value[0]);
};


Core.prototype.applyThresholding = function(threshold_name) {
    console.log("Core: applyThresholding()");
    switch( threshold_name ) {
        case "otsu": {
            this.setGrayMinValue( this._threshold_otsu_index );
        }; break;

        case "isodata": {
            this.setGrayMinValue( this._threshold_isodata_index );
        }; break;

        case "yen": {
            this.setGrayMinValue( this._threshold_yen_index );
        }; break;

        case "li": {
            this.setGrayMinValue( this._threshold_li_index );
        }; break;

    }
};


Core.prototype.setThresholdIndexes = function(otsu, isodata, yen, li) {
    console.log("Core: setThresholdIndexes()");
    this._threshold_otsu_index       = otsu;
    this._threshold_isodata_index    = isodata;
    this._threshold_yen_index        = yen;
    this._threshold_li_index         = li;

};


Core.prototype.setGrayMaxValue = function(value) {
    console.log("Core: setMaxGrayValue()");
    this._gray_value[1] = value;
    this._secondPassSetUniformValue("uMaxGrayVal", this._gray_value[1]);
};

Core.prototype.addWireframe = function() {
    console.log("Core: addFrame()");
    this._sceneSecondPass.add( this._wireframe );

    this._controls.update();
    this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    this._render.render( this._sceneFirstPass, this._camera );

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );
};

Core.prototype.removeWireframe = function() {
    console.log("Core: removeFrame()");
    this._sceneSecondPass.remove( this._wireframe );

    this._controls.update();
    this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    this._render.render( this._sceneFirstPass, this._camera );

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.setAxis = function(value) {
    console.log("Core: setAxis()");
    console.log("Axis status: " + this.isAxisOn);

    if (this.isAxisOn) {
        this._sceneSecondPass.remove(this._axes);
        this.isAxisOn = false;
    } else {
        this._sceneSecondPass.add(this._axes);
        this.isAxisOn = true;
    }

    this._controls.update();
    this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    this._render.render( this._sceneFirstPass, this._camera );

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.draw = function(fps) {
    this.onPreDraw.call(fps.toFixed(3));

    this._controls.update();
    this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    this._render.render( this._sceneFirstPass, this._camera );

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );

    var vector = this._camera.getWorldDirection();
    theta = Math.atan2(vector.x,vector.z);
    theta = theta + 3.142; // add/minux pi to inverse
    var degree = theta * (180/3.142);
    //66console.log(degree);
    compassDraw(degree);
    
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
        width = this._render.domElement.width;
    } 
    if(this._render_size[1] == '*') {
        height = this._render.domElement.height;
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
        width = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;

    } 
    if(this._canvas_size[1] == '*') {
        height = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
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


Core.prototype.getVolumeSize = function() {
    return this._volume_sizes;
};


Core.prototype.getMaxStepsNumber = function() {
    return Math.min( this.getVolumeSize()[0], this.getVolumeSize()[1] );
};


Core.prototype.getVolumeSizeNormalized = function() {
    var maxSize = Math.max(this.getVolumeSize()[0], this.getVolumeSize()[1], this.getVolumeSize()[2]);
    var normalizedVolumeSizes = [this.getVolumeSize()[0] / maxSize,  this.getVolumeSize()[1] / maxSize, this.getVolumeSize()[2] / maxSize];

    return normalizedVolumeSizes;
};


Core.prototype.getGeometryDimensions = function() {
    return this._geometry_dimensions;

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


Core.prototype.getMaxTexturesNumber = function() {
    var number_used_textures = 6;
    var gl = this._render.getContext()
    return gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) - number_used_textures;
};


Core.prototype.getMaxTextureSize = function() {
    var gl = this._render.getContext()
    return gl.getParameter(gl.MAX_TEXTURE_SIZE);
};


Core.prototype.getMaxFramebuferSize = function() {
    var gl = this._render.getContext()
    return gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
};


Core.prototype._shaders = {
    // Here will be inserted shaders withhelp of grunt
};


function buildAxes( length ) {
    var axes = new THREE.Object3D();

    // This is just intended as a building block for drawing axis
    axes.add( buildAxis( new THREE.Vector3( -length, -length, -length ), new THREE.Vector3( (length*3.0), -length, -length ), 0xFF0000, false ) ); // +X //red
    axes.add( buildAxis( new THREE.Vector3( -length, -length, -length ), new THREE.Vector3( (-length*2.0), -length, -length ), 0xFF0000, true ) ); // -X
    axes.add( buildAxis( new THREE.Vector3( -length, -length, -length ), new THREE.Vector3( -length, (length*3.0), -length ), 0x00FF00, false ) ); // +Y //green
    axes.add( buildAxis( new THREE.Vector3( -length, -length, -length ), new THREE.Vector3( -length, (-length*2.0), -length ), 0x00FF00, true ) ); // -Y
    axes.add( buildAxis( new THREE.Vector3( -length, -length, -length ), new THREE.Vector3( -length, -length, (length*3.0) ), 0x0000FF, false ) ); // +Z //blue
    axes.add( buildAxis( new THREE.Vector3( -length, -length, -length ), new THREE.Vector3( -length, -length, (-length*2.0) ), 0x0000FF, true ) ); // -Z

    return axes;
}

function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new THREE.Geometry(),
	mat; 

    if(dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 1, color: colorHex, dashSize: 3, gapSize: 3 });
    } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 1, color: colorHex });
    }

    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

    var axis = new THREE.Line( geom, mat, THREE.LinePieces );

    return axis;
}


window.VRC.Core = Core;

window.VRC.Core.prototype._shaders.firstPass = {
	uniforms: THREE.UniformsUtils.merge([
		{
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float; ',
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
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSteps" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uMinGrayVal; ',
		'uniform float uMaxGrayVal; ',
		'uniform float uOpacityVal; ',
		'uniform float uColorVal; ',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float uSteps; ',
		'// uniform int uAvailable_textures_number;',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'float getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    // float dx2, dy2; ',
		'    // float value; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices); ',
		'    // s2Original = min(s1Original + 1.0, uNumberOfSlices);',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));',
		'    // int tex2Index = int(floor(s2Original / slicesPerSprite));',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    // s2 = mod(s2Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    // dx2 = fract(s2/uSlicesOverX);',
		'    // dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    // texpos2.x = dx2+(volpos.x/uSlicesOverX);',
		'    // texpos2.y = dy2+(volpos.y/uSlicesOverY);',
		'    float value1 = 0.0, value2 = 0.0; ',
		'    // bool value1Set = false, value2Set = false;',
		'    // int numberOfSlicemaps = int( ceil(uNumberOfSlices / (uSlicesOverX * uSlicesOverY)) );',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value1;',
		'    // for (int x = 0; x < gl_MaxTextureImageUnits-2; x++)',
		'    // {',
		'    //     if(x == numberOfSlicemaps)',
		'    //     {',
		'    //         break;',
		'    //     }',
		'    //     if(x == tex1Index) { ',
		'    //         value1 = texture2D(uSliceMaps[x],texpos1).x; ',
		'    //         value1Set = true; ',
		'    //     } ',
		'    //     if(x == tex2Index) { ',
		'    //         value2 = texture2D(uSliceMaps[x],texpos2).x; ',
		'    //         value2Set = true; ',
		'    //     } ',
		'    //     if(value1Set && value2Set) { ',
		'    //         break; ',
		'    //     } ',
		'    // } ',
		'    // return mix(value1, value2, fract(volpos.z*uNumberOfSlices)); ',
		'} ',
		'void main(void)',
		'{',
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
		'            biggest_gray_value = gray_val;',
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
window.VRC.Core.prototype._shaders.secondPassAR = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax; ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'// x - R, y - G, z - B',
		'// x - H, y - S, z - V',
		'vec3 hsv2rgb(vec3 hsv) ',
		'{',
		'    float     hue, p, q, t, ff;',
		'    int        i;    ',
		'    ',
		'    hsv.z = (darkness-hsv.z)*l;',
		'    hsv.y = ( 1.2 - hsv.y - hMin)/(hMax - hMin) * 360.0;    ',
		'  ',
		'    hue = hsv.y >= 360.0 ? hsv.y-360.0 : hsv.y;',
		'    ',
		'    hue /= 60.0;',
		'    i = int(hue);',
		'    ff = hue - float(i); ',
		'    p = hsv.z * (1.0 - s);',
		'    q = hsv.z * (1.0 - (s * ff));',
		'    t = hsv.z * (1.0 - (s * (1.0 - ff)));',
		'    if(i==0)',
		'        return vec3(hsv.z,t,p);',
		'    ',
		'    else if(i==1)',
		'      return vec3(q,hsv.z,p);',
		'        ',
		'    else if(i==2)     ',
		'        return vec3(p,hsv.z,t);',
		'        ',
		'    else if(i==3)',
		'        return vec3(p,q,hsv.z);',
		'        ',
		'    else if(i==4)',
		'        return vec3(t,p,hsv.z);',
		'        ',
		'    else',
		'        return vec3(hsv.z,p,q);',
		'}',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float opacityFactor = uOpacityVal; ',
		'  ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'     vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);    ',
		'     else { ',
		'            colorValue.x = gray_val.x;',
		'            colorValue.y = 1.0 - sqrt(gray_val.y);',
		'            colorValue.z = gray_val.z;',
		'            colorValue.w = 0.1;',
		'              ',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'            sample.rgb = (1.0 - accum.a) * hsv2rgb(colorValue.rgb) * sample.a; ',
		'             ',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassAtten = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax; ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float opacityFactor = uOpacityVal; ',
		'  ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'     vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);   ',
		'     else { ',
		'            colorValue.x = (darkness * 2.0 - gray_val.y) * l * 0.3;',
		'            colorValue.w = 0.1;',
		'              ',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'            sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a; ',
		'             ',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassAttenMax = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax; ',
		' ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float biggest_gray_value = 0.0; ',
		' float opacityFactor = uOpacityVal; ',
		'  ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'     vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);   ',
		'   ',
		'     else { ',
		'            if(biggest_gray_value < gray_val.y)  ',
		'              biggest_gray_value = gray_val.y;    ',
		'             colorValue.g = (darkness * 2.0 - biggest_gray_value) * l * 0.15;',
		'             sample.a = 0.1 * opacityFactor; ',
		'             sample.b = colorValue.g * s * 2.0; ',
		'             sample.g = colorValue.g; ',
		'             sample.r = colorValue.g; ',
		'             accum = sample; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassCutOffAtten = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax;  ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'// x - R, y - G, z - B',
		'// x - H, y - S, z - V',
		'vec3 tumorHighlighter(vec3 hsv) ',
		'{     ',
		'    float     hue, p, q, t, ff;',
		'    int        i;    ',
		'    ',
		'    float sat = (hsv.y>(hMin + 0.5) && hsv.y<hMax)? s : 0.0; ',
		'    hsv.z = (darkness-hsv.z)*l;',
		'  ',
		'    hue = 0.0;',
		'    i = int((hue));',
		'    ff = hue - float(i); ',
		'    p = hsv.z * (1.0 - sat);',
		'    q = hsv.z * (1.0 - (sat * ff));',
		'    t = hsv.z * (1.0 - (sat * (1.0 - ff)));',
		'    ',
		'     return vec3(hsv.z,t,p);',
		'}',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float opacityFactor = uOpacityVal; ',
		' ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'     vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);     ',
		'     else {             ',
		'           colorValue.x = gray_val.x;',
		'            colorValue.y = gray_val.y;',
		'            colorValue.z = gray_val.z;',
		'            colorValue.w = 0.1;',
		'              ',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'            sample.rgb = (1.0 - accum.a) * tumorHighlighter(colorValue.rgb) * sample.a; ',
		'            ',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'                break; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassCutOffSos = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax;  ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'// x - R, y - G, z - B',
		'// x - H, y - S, z - V',
		'vec3 tumorHighlighter(vec3 hsv) ',
		'{     ',
		'    float     hue, p, q, t, ff;',
		'    int        i;    ',
		'    ',
		'    float sat = (hsv.x>(hMin + 0.5) && hsv.x<hMax)? s : 0.0; ',
		'    hsv.z = (darkness-hsv.z)*l;',
		'  ',
		'    hue = 0.0;',
		'    i = int((hue));',
		'    ff = hue - float(i); ',
		'    p = hsv.z * (1.0 - sat);',
		'    q = hsv.z * (1.0 - (sat * ff));',
		'    t = hsv.z * (1.0 - (sat * (1.0 - ff)));',
		'    ',
		'     return vec3(hsv.z,t,p);',
		'}',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float opacityFactor = uOpacityVal; ',
		' ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'     vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);     ',
		'     else {             ',
		'           colorValue.x = gray_val.x;',
		'            colorValue.y = gray_val.y;',
		'            colorValue.z = gray_val.z;',
		'            colorValue.w = 0.1;',
		'              ',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'            sample.rgb = (1.0 - accum.a) * tumorHighlighter(colorValue.rgb) * sample.a; ',
		'            ',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'                break; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassDefault = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSlicemapWidth" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'#ifdef GL_FRAGMENT_PRECISION_HIGH',
		'// highp is supported',
		'precision highp int;',
		'precision highp float;',
		'#else',
		'// high is not supported',
		'precision mediump int;',
		'precision mediump float;',
		'#endif',
		'varying vec4 frontColor;',
		'varying vec4 pos;',
		'uniform sampler2D uBackCoord;',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices;',
		'uniform float uMinGrayVal;',
		'uniform float uMaxGrayVal;',
		'uniform float uOpacityVal;',
		'uniform float uColorVal;',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX;',
		'uniform float uSlicesOverY;',
		'uniform float uSlicemapWidth;',
		'// uniform int uAvailable_textures_number;',
		'float getVolumeValue(vec3 volpos) {',
		'    float s1Original, s2Original, s1, s2;',
		'    float dx1, dy1;',
		'    // float dx2, dy2;',
		'    // float value;',
		'    vec2 texpos1, texpos2, texpos1_frac;',
		'    float pixellength = (1.0/uSlicemapWidth);',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    // nearest neighbor over z-axis',
		'    //s1Original = floor((volpos.z*(uNumberOfSlices-1.0)));',
		'    s1Original = floor(((volpos.z*(uNumberOfSlices-1.0))+0.5));',
		'    // s2Original = min(s1Original + 1.0, uNumberOfSlices);',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));',
		'    // int tex2Index = int(floor(s2Original / slicesPerSprite));',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    // s2 = mod(s2Original, slicesPerSprite);',
		'    dx1 = fract((s1/uSlicesOverX));',
		'    dy1 = (floor(s1/uSlicesOverY))/uSlicesOverY;',
		'    // dx2 = fract(s2/uSlicesOverX);',
		'    // dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;',
		'    // "fixed" indexing',
		'    texpos1.x = (dx1+(volpos.x/(uSlicesOverX-(1.0/(uSlicemapWidth-1.0)))));',
		'    texpos1.y = (dy1+(volpos.y/(uSlicesOverY-(1.0/(uSlicemapWidth-1.0)))));',
		'    // texpos2.x = dx2+(volpos.x/uSlicesOverX);',
		'    // texpos2.y = dy2+(volpos.y/uSlicesOverY);',
		'    float value1 = 0.0, value2 = 0.0;',
		'    // bool value1Set = false, value2Set = false;',
		'    // int numberOfSlicemaps = int( ceil(uNumberOfSlices / (uSlicesOverX * uSlicesOverY)) );',
		'    // Nearest neighbor over x/y axis (without upscaling)',
		'    // texpos1_frac.x = ((texpos1.x+(0.5/(uSlicemapWidth-1.0))));',
		'    // texpos1_frac.y = ((texpos1.y+(0.5/(uSlicemapWidth-1.0))));',
		'    // upscaling so that flooring is possible',
		'    texpos1_frac.x = (floor(((texpos1.x+(0.5/(uSlicemapWidth-1.0)))*4095.0)))/4095.0;',
		'    texpos1_frac.y = (floor(((texpos1.y+(1.0/(uSlicemapWidth-1.0)))*4095.0)))/4095.0;',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value1 = texture2D(uSliceMaps[<%=i%>],texpos1_frac).x;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value1;',
		'}',
		'void main(void) {',
		'    int uStepsI;',
		'    float uStepsF;',
		'    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;',
		'    vec4 backColor = texture2D(uBackCoord,texC);',
		'    vec3 dir = backColor.rgb - frontColor.rgb;',
		'    //dir /= length(dir);',
		'    vec4 vpos = frontColor;',
		'    float dir_length = length(dir);',
		'    // Schrittanzahl',
		'    uStepsF = ceil((dir_length)*(uNumberOfSlices-1.0));',
		'    vec3 Step = dir/uStepsF;',
		'    // Schrittanzahl',
		'    uStepsI = int(uStepsF);',
		'    vec4 accum = vec4(0, 0, 0, 0);',
		'    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);',
		'    vec4 colorValue = vec4(0, 0, 0, 0);',
		'    float biggest_gray_value = 0.0;',
		'    float opacityFactor = uOpacityVal;',
		'    float lightFactor = uColorVal;',
		'    float new_x;',
		'    for(int i = 0; i < 4096; i+=1) {',
		'        if(i == uStepsI) {',
		'            break;',
		'        }',
		'        float gray_val = getVolumeValue(vpos.xyz);',
		'        if(gray_val < uMinGrayVal || gray_val > uMaxGrayVal) {',
		'            colorValue = vec4(0.0);',
		'        } else {',
		'            if(biggest_gray_value < gray_val) {',
		'                biggest_gray_value = gray_val;',
		'            }',
		'            if(uAbsorptionModeIndex == 0.0) {',
		'                vec2 tf_pos;',
		'                tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'                tf_pos.y = 0.5;',
		'                colorValue = texture2D(uTransferFunction,tf_pos);',
		'                //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'                sample.a = colorValue.a * opacityFactor;',
		'                sample.rgb = colorValue.rgb * uColorVal;',
		'                accum += sample;',
		'                if(accum.a >= 1.0) {',
		'                    break;',
		'                }',
		'            }',
		'            if(uAbsorptionModeIndex == 1.0) {',
		'                vec2 tf_pos;',
		'                tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'                tf_pos.y = 0.5;',
		'                colorValue = texture2D(uTransferFunction,tf_pos);',
		'                //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'                sample.a = 0.1; //colorValue.a * (1.0 / uStepsF);  //* opacityFactor;',
		'                sample.rgb = colorValue.rgb * sample.a; //(1.0 - accum.a) ; //* lightFactor;',
		'                accum += sample;',
		'                if(accum.a >= 1.0) {',
		'                    break;',
		'                }',
		'            }',
		'            if(uAbsorptionModeIndex == 2.0) {',
		'                vec2 tf_pos;',
		'                tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'                tf_pos.y = 0.5;',
		'                colorValue = texture2D(uTransferFunction,tf_pos);',
		'                //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'                sample.a = 1.0;//colorValue.a * opacityFactor;',
		'                sample.rgb = colorValue.rgb;// * uColorVal;',
		'                accum = sample;',
		'            }',
		'        }',
		'        //advance the current position',
		'        vpos.xyz += Step;',
		'        //break if the position is greater than <1, 1, 1>',
		'        if(vpos.x > 1.0 || vpos.x < 0.0 ||',
		'           vpos.y > 1.0 || vpos.y < 0.0 ||',
		'           vpos.z > 1.0 || vpos.z < 0.0) {',
		'            break;',
		'        }',
		'    }',
		'    gl_FragColor = accum;',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassFusion = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax;    ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'// x - R, y - G, z - B',
		'// x - H, y - S, z - V',
		'vec3 hsv2rgb(vec3 hsv) ',
		'{',
		'    float     hue, p, q, t, ff;',
		'    int        i;    ',
		'    ',
		'    hsv.z = (darkness - hsv.z) * l;',
		'    hsv.x = (hsv.x - hMin)/(hMax - hMin) * 360.0;    ',
		'    hsv.y *= s * 1.5;  ',
		'  ',
		'    hue=hsv.x >= 360.0?hsv.x-360.0:hsv.x;',
		'    ',
		'    hue /= 60.0;',
		'    i = int(hue);',
		'    ff = hue - float(i); ',
		'    p = hsv.z * (1.0 - hsv.y);',
		'    q = hsv.z * (1.0 - (hsv.y * ff));',
		'    t = hsv.z * (1.0 - (hsv.y * (1.0 - ff)));',
		'    if(i==0)',
		'        return vec3(hsv.z,t,p);',
		'    ',
		'    else if(i==1)',
		'      return vec3(q,hsv.z,p);',
		'        ',
		'    else if(i==2)     ',
		'        return vec3(p,hsv.z,t);',
		'        ',
		'    else if(i==3)',
		'        return vec3(p,q,hsv.z);',
		'        ',
		'    else if(i==4)',
		'        return vec3(t,p,hsv.z);',
		'        ',
		'    else',
		'        return vec3(hsv.z,p,q);',
		'}',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		' float opacityFactor = uOpacityVal; ',
		'  ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'    vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);   ',
		'     else {         ',
		'            colorValue.x = gray_val.x;',
		'            colorValue.y = 1.0-gray_val.y/0.6;',
		'            colorValue.z = gray_val.z;',
		'            colorValue.w = 0.1;',
		'              ',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'            sample.rgb = (1.0 - accum.a) * hsv2rgb(colorValue.rgb) * sample.a; ',
		'             ',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassNearestNeighbor = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSlicemapWidth" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int;',
		'precision mediump float;',
		'attribute vec4 vertColor;',
		'//see core.js -->',
		'//attributes: {',
		'//    vertColor: {type: \'c\', value: [] }',
		'//},',
		'varying vec4 frontColor;',
		'varying vec4 pos;',
		'void main(void)',
		'{',
		'    frontColor = vertColor;',
		'    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
		'    gl_Position = pos;',
		'}'].join("\n"),
	fragmentShader: [
		'#ifdef GL_FRAGMENT_PRECISION_HIGH',
		' // highp is supported',
		' precision highp int;',
		' precision highp float;',
		'#else',
		' // high is not supported',
		' precision mediump int;',
		' precision mediump float;',
		'#endif',
		'varying vec4 frontColor;',
		'varying vec4 pos;',
		'uniform sampler2D uBackCoord;',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'// returns total number of slices of all slicemaps',
		'uniform float uNumberOfSlices;',
		'uniform float uMinGrayVal;',
		'uniform float uMaxGrayVal;',
		'uniform float uOpacityVal;',
		'uniform float uColorVal;',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX;',
		'uniform float uSlicesOverY;',
		'uniform float uSlicemapWidth;',
		'float getVolumeValue(vec3 volpos)',
		'{',
		'    float sliceIndexInSlicemaps_lower, sliceIndex_lower;',
		'    float dx_lower, dy_lower;',
		'    float value1 = 0.0;',
		'    vec2 texpos1, texpos1_frac;',
		'    vec3 value1_vec;',
		'    // matlab eps == pow(2.0,(-52.0))',
		'    float eps = pow(2.0,(-17.0));',
		'    // How many slices does 1 slicemap have?',
		'    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY;',
		'    /** Determine index of current slice (with respect to total numbers of slices)',
		'      * Accessing real data here only works with -1.0*eps:',
		'      * sliceIndexInSlicemaps_lower = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices)-1.0*eps))+0.5);',
		'      * but we get \'aliasing\' in form of one slice appearing at the front, therefore we use it currently without eps.',
		'      * We also took care of this half pixel adaption (real mapping)',
		'      */',
		'    sliceIndexInSlicemaps_lower = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices-1.0)))+0.5);',
		'    // Which Slicemap do we use? (Calculates current index of Slicemap)',
		'    int texIndexOfSlicemap = int(floor(sliceIndexInSlicemaps_lower / slicesPerSlicemap));',
		'    // What is the index of the slice in the current slicemap?',
		'    sliceIndex_lower = mod(sliceIndexInSlicemaps_lower, slicesPerSlicemap);',
		'    // Calculates x and y offset for the coordinates in the current slice',
		'    dx_lower = fract(sliceIndex_lower/uSlicesOverX);',
		'    dy_lower = floor(sliceIndex_lower/uSlicesOverY)/uSlicesOverY;',
		'    // To prevent long coding lines:',
		'    float sWidth = uSlicemapWidth;',
		'    float sX = uSlicesOverX;',
		'    float sY = uSlicesOverY;',
		'    // Due to edge calculation problems, we adjust the volpos.x and .y',
		'    if(volpos.x < (0.5/((sWidth/sX)-1.0))) {',
		'        volpos.x = (0.5/((sWidth/sX)-1.0));',
		'    } else',
		'        if(volpos.x >= ((((sWidth/sX)-1.0)-0.5)/((sWidth/sX)-1.0))) {',
		'          // subtracting -10.0*eps so that we never land exactly on the last slice',
		'          volpos.x =  (((((sWidth/sX)-1.0)-0.5)/((sWidth/sX)-1.0))-10.0*eps);',
		'          }',
		'    if(volpos.y < (0.5/((sWidth/sY)-1.0))) {',
		'        volpos.y = (0.5/((sWidth/sY)-1.0));',
		'      } else',
		'         if(volpos.y >= ((((sWidth/sY)-1.0)-0.5)/((sWidth/sY)-1.0))) {',
		'           volpos.y =  (((((sWidth/sY)-1.0)-0.5)/((sWidth/sY)-1.0))-10.0*eps);',
		'         }',
		'    /** Calculating the current texture position of the x/y-coordiante with respect to its offset',
		'      * Multipling volpos.x with (number of slices-1),... because of the',
		'      * half pixel shift mapping.',
		'      */',
		'    texpos1.x = (dx_lower+(((volpos.x*((sWidth/sX)-1.0))/(sWidth/sX))/(sX)));',
		'    texpos1.y = (dy_lower+(((volpos.y*((sWidth/sY)-1.0))/(sWidth/sY))/(sY)));',
		'    // Nearest neighbor over x/y axis',
		'    texpos1_frac.x =(0.5+floor(((texpos1.x+(0.5/(sWidth)))*4096.0)))/4096.0; //upscaling so that flooring is possible',
		'    texpos1_frac.y =(0.5+floor(((texpos1.y+(0.5/(sWidth)))*4096.0)))/4096.0;',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( texIndexOfSlicemap == <%=i%> )',
		'        {',
		'          value1_vec = texture2D(uSliceMaps[<%=i%>],texpos1_frac).rgb;',
		'          value1 = ((value1_vec.r + value1_vec.g + value1_vec.b)/3.0);',
		'          value1 = texture2D(uSliceMaps[<%=i%>],texpos1_frac).x;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value1;',
		'}',
		'void main(void)',
		'{',
		' int uStepsI;',
		' float uStepsF;',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;',
		' vec4 backColor = texture2D(uBackCoord,texC);',
		' vec3 dir = backColor.rgb - frontColor.rgb;',
		' vec4 vpos = frontColor;',
		' float dir_length = length(dir);',
		' uStepsF = ceil((dir_length)*(uNumberOfSlices-1.0));',
		' vec3 Step = dir/uStepsF;',
		' uStepsI = int(uStepsF);',
		' vec4 accum = vec4(0, 0, 0, 0);',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);',
		' vec4 colorValue = vec4(0, 0, 0, 0);',
		' float biggest_gray_value = 0.0;',
		' float opacityFactor = uOpacityVal;',
		' float lightFactor = uColorVal;',
		' for(int i = 0; i < 4096; i+=1)',
		' {',
		'     if(i == uStepsI) {',
		'         break;',
		'     }',
		'     float gray_val = getVolumeValue(vpos.xyz);',
		'     if(gray_val < uMinGrayVal || gray_val > uMaxGrayVal) {',
		'         colorValue = vec4(0.0);',
		'         accum=accum+colorValue;',
		'         if(accum.a>=1.0)',
		'            break;',
		'     } else {',
		'         if(biggest_gray_value < gray_val) {',
		'            biggest_gray_value = gray_val;',
		'         }',
		'         if(uAbsorptionModeIndex == 0.0)',
		'         {',
		'           vec2 tf_pos;',
		'           tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'           tf_pos.y = 0.5;',
		'           colorValue = texture2D(uTransferFunction,tf_pos);',
		'           //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'           sample.a = colorValue.a * opacityFactor;',
		'           sample.rgb = colorValue.rgb * uColorVal;',
		'           accum += sample;',
		'           if(accum.a>=1.0)',
		'              break;',
		'         }',
		'         if(uAbsorptionModeIndex == 1.0)',
		'         {',
		'           vec2 tf_pos;',
		'           // position of x is defined by the gray_value instead of a filtering',
		'           tf_pos.x = gray_val;',
		'           tf_pos.y = 0.5;',
		'           // maximum distance in a cube',
		'           float max_d = sqrt(3.0);',
		'           colorValue = texture2D(uTransferFunction,tf_pos);',
		'           //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'           // alternative mode, this way the user can change the length of',
		'           // the penetrating ray, by using the opacityFactor-switch in the  gui',
		'           // -2.0 because of 1. and last slice:',
		'           sample.a = 1.0/(1.0+uOpacityVal*(max_d*(uNumberOfSlices-2.0)));',
		'           sample.rgb = colorValue.rgb * sample.a;',
		'           accum += sample;',
		'           if(accum.a>=1.0)',
		'              break;',
		'         }',
		'         if(uAbsorptionModeIndex == 2.0)',
		'         {',
		'             vec2 tf_pos;',
		'             tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'             tf_pos.y = 0.5;',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'             sample.a = 1.0; //colorValue.a * opacityFactor;',
		'             sample.rgb = colorValue.rgb; // * uColorVal;',
		'             accum = sample;',
		'         }',
		'     }',
		'     //advance the current position',
		'     vpos.xyz += Step;',
		' }',
		' gl_FragColor = accum;',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassRB = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax; ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'// x - R, y - G, z - B',
		'// x - H, y - S, z - V',
		'vec3 realBody(vec3 hsv) ',
		'{    ',
		'    float     hue, p, q, t, ff;',
		'    int        i;    ',
		'    ',
		'    hsv.z = (darkness - hsv.z) * l;',
		'        ',
		'    hsv.x = (hsv.x - hMin)/(hMax - hMin) * 360.0;    ',
		'        ',
		'    hue=hsv.x >= 360.0 ? 360.0 : hsv.x;',
		'    ',
		'    hue /= 230.0;',
		'    i = int((hue));',
		'    ff = hue - float(i); ',
		'    p = hsv.z * (1.0 - s);',
		'    q = hsv.z * (1.0 - (s * ff));',
		'    t = hsv.z * (1.0 - (s * (1.0 - ff)));',
		'    return vec3(hsv.z,t,p);    ',
		'}',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float opacityFactor = uOpacityVal; ',
		'  ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'    vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);   ',
		'     else {              ',
		'            colorValue.x = gray_val.x;',
		'            colorValue.y = gray_val.y;',
		'            colorValue.z = gray_val.z;',
		'            colorValue.w = 0.1;',
		'              ',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'            sample.rgb = (1.0 - accum.a) * realBody(colorValue.rgb) * sample.a ;          ',
		'             ',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'                break; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassRefl = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax;  ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float opacityFactor = uOpacityVal; ',
		'  ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'    vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);   ',
		'     else { ',
		'            colorValue.x = (darkness - gray_val.z) * l;',
		'            colorValue.w = 0.1;',
		'              ',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'            sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a; ',
		'             ',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassSos = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax; ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float opacityFactor = uOpacityVal; ',
		'  ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'     vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);     ',
		'     else { ',
		'            colorValue.x = (darkness * 2.0 - gray_val.x) * l * 0.4;',
		'            colorValue.w = 0.1;',
		'              ',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'            sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a; ',
		'             ',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassSosMax = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax;  ',
		' ',
		'// uniform int uAvailable_textures_number;',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float biggest_gray_value = 0.0; ',
		' float opacityFactor = uOpacityVal; ',
		'  ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'     vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);   ',
		'   ',
		'     else { ',
		'            if(biggest_gray_value < gray_val.x)  ',
		'              biggest_gray_value = gray_val.x;    ',
		'             colorValue.g = (darkness * 2.5 - biggest_gray_value) * l * 0.15;',
		'             sample.a = 0.1 * opacityFactor; ',
		'             sample.b = colorValue.g * s * 2.0; ',
		'             sample.g = colorValue.g; ',
		'             sample.r = colorValue.g; ',
		'             accum = sample; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassSR = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"minRefl" : { type: "f", value: -1 },
		"minAtten" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
		"maxRefl" : { type: "f", value: -1 },
		"maxAtten" : { type: "f", value: -1 },
		"l" : { type: "f", value: -1 },
		"s" : { type: "f", value: -1 },
		"hMin" : { type: "f", value: -1 },
		"hMax" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor; ',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uNumberOfSlices; ',
		'uniform float uOpacityVal; ',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float darkness;',
		'uniform float minSos;',
		'uniform float minRefl;',
		'uniform float minAtten;',
		'uniform float maxSos;',
		'uniform float maxRefl;',
		'uniform float maxAtten;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax; ',
		'//Acts like a texture3D using Z slices and trilinear filtering. ',
		'vec3 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    vec2 texpos1,texpos2; ',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY; ',
		'    s1Original = floor(volpos.z*uNumberOfSlices);     ',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));    ',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    texpos1.x = dx1+(volpos.x/uSlicesOverX);',
		'    texpos1.y = dy1+(volpos.y/uSlicesOverY);',
		'    vec3 value = vec3(0.0,0.0,0.0); ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return value;',
		'} ',
		'// x - R, y - G, z - B',
		'// x - H, y - S, z - V',
		'vec3 hsv2rgb(vec3 hsv) ',
		'{',
		'    float     hue, p, q, t, ff, sat;',
		'    int        i;    ',
		'    ',
		'    hsv.z = (darkness-hsv.z)*l;',
		'    hsv.x = (hsv.x - hMin)/(hMax - hMin) * 360.0; ',
		'  ',
		'    hue = hsv.x >= 360.0 ? hsv.x-360.0 : hsv.x;',
		'    ',
		'    sat = s;',
		'    ',
		'    hue /= 60.0;',
		'    i = int(hue);',
		'    ff = hue - float(i); ',
		'    p = hsv.z * (1.0 - sat);',
		'    q = hsv.z * (1.0 - (sat * ff));',
		'    t = hsv.z * (1.0 - (sat * (1.0 - ff)));',
		'    if(i==0)',
		'        return vec3(hsv.z,t,p);',
		'    ',
		'    else if(i==1)',
		'      return vec3(q,hsv.z,p);',
		'        ',
		'    else if(i==2)     ',
		'        return vec3(p,hsv.z,t);',
		'        ',
		'    else if(i==3)',
		'        return vec3(p,q,hsv.z);',
		'        ',
		'    else if(i==4)',
		'        return vec3(t,p,hsv.z);',
		'        ',
		'    else',
		'        return vec3(hsv.z,p,q);',
		'}',
		'void main(void)',
		'{',
		' const int uStepsI = 144;',
		' const float uStepsF = float(uStepsI);',
		'    ',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		' vec4 backColor = texture2D(uBackCoord,texC); ',
		' vec3 dir = backColor.rgb - frontColor.rgb; ',
		' vec4 vpos = frontColor; ',
		' vec3 Step = dir/uStepsF; ',
		' vec4 accum = vec4(0, 0, 0, 0); ',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		' vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		' float opacityFactor = uOpacityVal; ',
		'  ',
		' for(int i = 0; i < uStepsI; i++) ',
		' {       ',
		'     vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'     if(gray_val.z < 0.05 || ',
		'         gray_val.x < minSos ||',
		'         gray_val.x > maxSos ||       ',
		'         gray_val.y < minAtten ||',
		'         gray_val.y > maxAtten ||',
		'         gray_val.z < minRefl ||',
		'         gray_val.z > maxRefl ',
		'       )  ',
		'         colorValue = vec4(0.0);    ',
		'     else { ',
		'            colorValue.x = gray_val.x;',
		'            colorValue.y = 1.0 - sqrt(gray_val.y);',
		'            colorValue.z = gray_val.z;',
		'            colorValue.w = 0.1;',
		'              ',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'            sample.rgb = (1.0 - accum.a) * hsv2rgb(colorValue.rgb) * sample.a; ',
		'             ',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'     }    ',
		'   ',
		'     //advance the current position ',
		'     vpos.xyz += Step;  ',
		'   ',
		'   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'         break;  ',
		' } ',
		' gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassTrilinear_final = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSlicemapWidth" : { type: "f", value: -1 },
		}
	]),
	vertexShader: [
		'precision mediump int; ',
		'precision mediump float; ',
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
		'#ifdef GL_FRAGMENT_PRECISION_HIGH',
		' // highp is supported',
		' precision highp int;',
		' precision highp float;',
		'#else',
		' // high is not supported',
		' precision mediump int;',
		' precision mediump float;',
		'#endif',
		'varying vec4 frontColor;',
		'varying vec4 pos;',
		'uniform sampler2D uBackCoord;',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'// returns total number of slices of all slicemaps',
		'uniform float uNumberOfSlices;',
		'uniform float uMinGrayVal;',
		'uniform float uMaxGrayVal;',
		'uniform float uOpacityVal;',
		'uniform float uColorVal;',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX;',
		'uniform float uSlicesOverY;',
		'uniform float uSlicemapWidth;',
		'float getVolumeValue(vec3 volpos)',
		'{',
		'    float sliceIndexInSlicemaps_lower, sliceIndex_lower;',
		'    float sliceIndexInSlicemaps_upper, sliceIndex_upper;',
		'    float dx_lower, dy_lower;',
		'    float dx_upper, dy_upper;',
		'    // How many slices does 1 slicemap have?',
		'    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY;',
		'    // matlab eps == pow(2.0,(-52.0))',
		'    float eps = pow(2.0,(-17.0));',
		'    /** Determine index of current slice (with respect to total numbers of slices)',
		'      * Accessing real data here only works with -1.0*eps:',
		'      * sliceIndexInSlicemaps_lower = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices)-1.0*eps))+0.5);',
		'      * but we get \'aliasing\' in form of one slice appearing at the front, therefore we use it currently without eps.',
		'      * We also took care of this half pixel adaption (real mapping)',
		'      */',
		'    sliceIndexInSlicemaps_lower = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices-1.0)))+0.5);',
		'    sliceIndexInSlicemaps_upper = ceil(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices-1.0)))+0.5);',
		'    // Which Slicemap do we use? (Calculates current index of Slicemap)',
		'    int texIndexOfSlicemap = int(floor(sliceIndexInSlicemaps_lower / slicesPerSlicemap));',
		'    // What is the index of the slice in the current slicemap?',
		'    sliceIndex_lower = mod(sliceIndexInSlicemaps_lower, slicesPerSlicemap);',
		'    sliceIndex_upper = mod(sliceIndexInSlicemaps_upper, slicesPerSlicemap);',
		'    // Calculates x and y offset for the coordinates in the current slice',
		'    dx_lower = fract(sliceIndex_lower/uSlicesOverX);',
		'    dy_lower = floor(sliceIndex_lower/uSlicesOverY)/uSlicesOverY;',
		'    dx_upper = fract(sliceIndex_upper/uSlicesOverX);',
		'    dy_upper = floor(sliceIndex_upper/uSlicesOverY)/uSlicesOverY;',
		'    vec2 texpos1,texpos2;',
		'    float sWidth = uSlicemapWidth;',
		'    float sX = uSlicesOverX;',
		'    float sY = uSlicesOverY;',
		'    // Due to edge calculation problems, we adjust the volpos.x and .y',
		'      if(volpos.x < (0.5/((sWidth/sX)-1.0))) {',
		'          volpos.x = (0.5/((sWidth/sX)-1.0));',
		'      } else',
		'          if(volpos.x >= ((((sWidth/sX)-1.0)-0.5)/((sWidth/sX)-1.0))) {',
		'              // subtracting -10.0*eps so that we never land exactly on the last slice',
		'              volpos.x =  (((((sWidth/sX)-1.0)-0.5)/((sWidth/sX)-1.0))-10.0*eps) ;',
		'          }',
		'      if(volpos.y < (0.5/((sWidth/sY)-1.0))) {',
		'          volpos.y = (0.5/((sWidth/sY)-1.0));',
		'      } else',
		'         if(volpos.y >= ((((sWidth/sY)-1.0)-0.5)/((sWidth/sY)-1.0))) {',
		'             volpos.y =  (((((sWidth/sY)-1.0)-0.5)/((sWidth/sY)-1.0))-10.0*eps) ;',
		'         }',
		'    /** Calculating the current texture position of the x/y-coordiante with respect to its offset',
		'      * Multipling volpos.x with (number of slices-1),... because of the',
		'      * half pixel shift mapping.',
		'      */',
		'    texpos1.x = (dx_lower+(((volpos.x*((sWidth/sX)-1.0))/(sWidth/sX))/(sX)));',
		'    texpos1.y = (dy_lower+(((volpos.y*((sWidth/sY)-1.0))/(sWidth/sY))/(sY)));',
		'    texpos2.x = (dx_upper+(((volpos.x*((sWidth/sX)-1.0))/(sWidth/sX))/(sX)));',
		'    texpos2.y = (dy_upper+(((volpos.y*((sWidth/sY)-1.0))/(sWidth/sY))/(sY)));',
		'    // Trilinear interpolation variables',
		'    float xpixel_1, xpixel_2, ypixel_1, ypixel_2;',
		'    float lo_weightX_1, lo_weightX_2, lo_weightY_1, lo_weightY_2;',
		'    float low_1, low_2, low_3, low_4;',
		'    vec2 low_1_vec, low_2_vec, low_3_vec, low_4_vec;',
		'    vec3 low_1_val, low_2_val, low_3_val, low_4_val;',
		'    float low_sum;',
		'    float xpixel_1_upper, xpixel_2_upper, ypixel_1_upper, ypixel_2_upper;',
		'    float upp_1, upp_2, upp_3, upp_4;',
		'    float up_weightX_1, up_weightX_2, up_weightY_1, up_weightY_2;',
		'    vec2 upp_1_vec, upp_2_vec, upp_3_vec, upp_4_vec;',
		'    vec3 upp_1_val, upp_2_val, upp_3_val, upp_4_val;',
		'    float upp_sum;',
		'    float weight_z_low, weight_z_upp;',
		'    // Calculating z-axis weight',
		'    weight_z_low = 1.0 - fract(volpos.z*(uNumberOfSlices-1.0));',
		'    weight_z_upp = abs(1.0 - weight_z_low);',
		'    float interp;',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( texIndexOfSlicemap == <%=i%> )',
		'        {',
		'          // Lower slice calculation of nearest 4 pixels and their weights',
		'          xpixel_1 = (floor(((texpos1.x*sWidth)+0.5))+0.5);',
		'          xpixel_2 = (floor(((texpos1.x*sWidth)+0.5))-0.5);',
		'          ypixel_1 = (floor(((texpos1.y*sWidth)+0.5))+0.5);',
		'          ypixel_2 = (floor(((texpos1.y*sWidth)+0.5))-0.5);',
		'          lo_weightX_1 = 1.0-abs(xpixel_1-(texpos1.x*sWidth));',
		'          lo_weightX_2 = 1.0-abs(xpixel_2-(texpos1.x*sWidth));',
		'          lo_weightY_1 = 1.0-abs(ypixel_1-(texpos1.y*sWidth));',
		'          lo_weightY_2 = 1.0-abs(ypixel_2-(texpos1.y*sWidth));',
		'          // adjusting the coordinates to a mapping of 0...1, because of texture2D',
		'          low_1_vec.x = (xpixel_1/sWidth);',
		'          low_1_vec.y = (ypixel_1/sWidth);',
		'          // calling the texture and saving the value',
		'          low_1_val = texture2D(uSliceMaps[<%=i%>], low_1_vec).rgb;',
		'          low_1 =  ((low_1_val.r + low_1_val.g + low_1_val.b)/3.0)*lo_weightX_1*lo_weightY_1;',
		'          low_2_vec.x = (xpixel_2/sWidth);',
		'          low_2_vec.y = (ypixel_1/sWidth);',
		'          low_2_val = texture2D(uSliceMaps[<%=i%>], low_2_vec).rgb;',
		'          low_2 =  ((low_2_val.r + low_2_val.g + low_2_val.b)/3.0)*lo_weightX_2*lo_weightY_1;',
		'          low_3_vec.x = (xpixel_1/sWidth);',
		'          low_3_vec.y = (ypixel_2/sWidth);',
		'          low_3_val = texture2D(uSliceMaps[<%=i%>], low_3_vec).rgb;',
		'          low_3 =  ((low_3_val.r + low_3_val.g + low_3_val.b)/3.0)*lo_weightX_1*lo_weightY_2;',
		'          low_4_vec.x = (xpixel_2/sWidth);',
		'          low_4_vec.y = (ypixel_2/sWidth);',
		'          low_4_val = texture2D(uSliceMaps[<%=i%>], low_4_vec).rgb;',
		'          low_4 =  ((low_4_val.r + low_4_val.g + low_4_val.b)/3.0)*lo_weightX_2*lo_weightY_2;',
		'          low_sum = (low_1 + low_2 + low_3 + low_4)*weight_z_low;',
		'          //Same procedure for upperslice',
		'          xpixel_1_upper = (floor(((texpos2.x*sWidth)+0.5))+0.5);',
		'          xpixel_2_upper = (floor(((texpos2.x*sWidth)+0.5))-0.5);',
		'          ypixel_1_upper = (floor(((texpos2.y*sWidth)+0.5))+0.5);',
		'          ypixel_2_upper = (floor(((texpos2.y*sWidth)+0.5))-0.5);',
		'          up_weightX_1 = 1.0-abs(xpixel_1_upper-(texpos2.x*sWidth));',
		'          up_weightX_2 = 1.0-abs(xpixel_2_upper-(texpos2.x*sWidth));',
		'          up_weightY_1 = 1.0-abs(ypixel_1_upper-(texpos2.y*sWidth));',
		'          up_weightY_2 = 1.0-abs(ypixel_2_upper-(texpos2.y*sWidth));',
		'          upp_1_vec.x = (xpixel_1_upper/sWidth);',
		'          upp_1_vec.y = (ypixel_1_upper/sWidth);',
		'          upp_1_val = texture2D(uSliceMaps[<%=i%>], upp_1_vec).rgb;',
		'          upp_1 =  ((upp_1_val.r + upp_1_val.g + upp_1_val.b)/3.0)*up_weightX_1*up_weightY_1;',
		'          upp_2_vec.x = (xpixel_2_upper/sWidth);',
		'          upp_2_vec.y = (ypixel_1_upper/sWidth);',
		'          upp_2_val = texture2D(uSliceMaps[<%=i%>], upp_2_vec).rgb;',
		'          upp_2 =  ((upp_2_val.r + upp_2_val.g + upp_2_val.b)/3.0)*up_weightX_2*up_weightY_1;',
		'          upp_3_vec.x = (xpixel_1_upper/sWidth);',
		'          upp_3_vec.y = (ypixel_2_upper/sWidth);',
		'          upp_3_val = texture2D(uSliceMaps[<%=i%>], upp_3_vec).rgb;',
		'          upp_3 =  ((upp_3_val.r + upp_3_val.g + upp_3_val.b)/3.0)*up_weightX_1*up_weightY_2;',
		'          upp_4_vec.x = (xpixel_2_upper/sWidth);',
		'          upp_4_vec.y = (ypixel_2_upper/sWidth);',
		'          upp_4_val = texture2D(uSliceMaps[<%=i%>], upp_4_vec).rgb;',
		'          upp_4 =  ((upp_4_val.r + upp_4_val.g + upp_4_val.b)/3.0)*up_weightX_2*up_weightY_2;',
		'          upp_sum = (upp_1 + upp_2 + upp_3 + upp_4)*weight_z_upp;',
		'          interp = low_sum+upp_sum;',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    return interp;',
		'}',
		'void main(void)',
		'{',
		' int uStepsI;',
		' float uStepsF;',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;',
		' vec4 backColor = texture2D(uBackCoord,texC);',
		' vec3 dir = backColor.rgb - frontColor.rgb;',
		' vec4 vpos = frontColor;',
		' float dir_length = length(dir);',
		' uStepsF = ceil((dir_length)*(uNumberOfSlices-1.0)); // Schrittanzahl',
		' vec3 Step = dir/uStepsF;',
		' uStepsI = int(uStepsF); // Schrittanzahl',
		' vec4 accum = vec4(0, 0, 0, 0);',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);',
		' vec4 colorValue = vec4(0, 0, 0, 0);',
		' float biggest_gray_value = 0.0;',
		' float opacityFactor = uOpacityVal;',
		' float lightFactor = uColorVal;',
		' for(int i = 0; i < 4096; i+=1)',
		' {',
		'     if(i == uStepsI) {',
		'         break;',
		'     }',
		'     float gray_val = getVolumeValue(vpos.xyz);',
		'     if(gray_val < uMinGrayVal || gray_val > uMaxGrayVal) {',
		'         // colorValue = vec4(0.0,0.0,0.0,((gray_val*(1.0/uOpacityVal)/(sqrt(3)*(uNumberOfSlices-1.0)))));',
		'         colorValue = vec4(0.0,0.0,0.0,0.0);',
		'         accum=accum+colorValue;',
		'         if(accum.a>=1.0)',
		'            break;',
		'     } else {',
		'         if(biggest_gray_value < gray_val) {',
		'            biggest_gray_value = gray_val;',
		'         }',
		'         if(uAbsorptionModeIndex == 0.0)',
		'         {',
		'             vec2 tf_pos;',
		'             tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'             tf_pos.y = 0.5;',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             // colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'             sample.a = colorValue.a * opacityFactor;',
		'             sample.rgb = colorValue.rgb * uColorVal;',
		'             accum += sample;',
		'             if(accum.a>=1.0)',
		'                break;',
		'         }',
		'         if(uAbsorptionModeIndex == 1.0)',
		'         {',
		'             vec2 tf_pos;',
		'             tf_pos.x = gray_val;',
		'             // because this is a filtering function, which we dont want:',
		'             // (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'             tf_pos.y = 0.5;',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             // colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'             // maximum distance in a cube',
		'             float max_d = sqrt(3.0);',
		'             // alternative mode:',
		'             // each pixel same opactiy value (1.0)',
		'             // -2.0 because of 1. and last slice',
		'             sample.a = 1.0/(1.0+uOpacityVal*(max_d*(uNumberOfSlices-2.0)));// (step_length/dir_length); //colorValue.a * (1.0 / uStepsF);  //* opacityFactor;',
		'             // each pixel\'s gropactiy is depending on the gray_val',
		'             // sample.a = gray_val * 1.0/(1.0+uOpacityVal*(max_d*(uNumberOfSlices-2.0))));// (step_length/dir_length); //colorValue.a * (1.0 / uStepsF);  //* opacityFactor; //opacity schätzung über grauwwert (bildinhalt)',
		'             //sample.a = gray_val*(1.0/uOpacityVal);',
		'             sample.rgb = colorValue.rgb * sample.a; //(1.0 - accum.a) ; //* lightFactor;',
		'             //sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);',
		'             //sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * lightFactor;',
		'             accum += sample;',
		'             if(accum.a>=1.0)',
		'                break;',
		'         }',
		'         if(uAbsorptionModeIndex == 2.0)',
		'         {',
		'             vec2 tf_pos;',
		'             tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'             tf_pos.y = 0.5;',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'             sample.a = 1.0; //colorValue.a * opacityFactor;',
		'             sample.rgb = colorValue.rgb; // * uColorVal;',
		'             accum = sample;',
		'         }',
		'     }',
		'     //advance the current position',
		'     vpos.xyz += Step;',
		'      //break if the position is greater than <1, 1, 1>',
		'      //if(vpos.x > 1.0-eps || vpos.y > 1.0-eps || vpos.z > 1.0-eps || vpos.x < 0.0+eps || vpos.y < 0.0+eps || vpos.z < 0.0+eps)',
		'      //vpos.x > backColor.r || vpos.y > backColor.g ||vpos.z > backColor.b ||',
		'      //{',
		'      //    break;',
		'      //}',
		' }',
		' gl_FragColor = accum;',
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
        me._isChange = false;

        me._clock = new THREE.Clock();

        me._onLoadSlicemap              = new VRC.EventDispatcher();
        me._onLoadSlicemaps             = new VRC.EventDispatcher();

        me._core = new VRC.Core( config );
        me._adaptationManager = new VRC.AdaptationManager();

        me.init = function() {
            me._core.init();
            me._adaptationManager.init( me._core );

            var frames = 0;

            me.addCallback("onCameraChange", function() {
                me._needRedraw = true;
                me.isChange = true;
            });
            
            me.addCallback("onCameraChangeStart", function() {
                me._needRedraw = true;
                me.isChange = true;
            });

            me.addCallback("onCameraChangeEnd", function() {
                me._needRedraw = false;
                me.isChange = false;
            });
            
            
            var counter = 0;

            function animate() {

                requestAnimationFrame( animate );
                if(me._needRedraw) {
                    frames = 10;
                    if (!me.isChange) {
                      me._needRedraw = false;
                      counter = 0;
                    }
                }

                if(frames > 0 && me._isStart) {
                    var delta = me._clock.getDelta();
                    var fps = 1 / delta;

                    console.log("Drawing " + frames + " Counter: " + counter);
                    me._core.draw(fps);
                    frames--;
                    counter++;

                    // timeout counter
                    if (counter > 500) {
                      me.isChange = false;
                      counter = 0;  
                    }
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

        me.setMode = function(conf){
          me._core.setMode(conf);
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

        me.setRenderCanvasSize = function(width, height) {
            me._core.setRenderCanvasSize(width, height);
            me._needRedraw = true;

        };


        me.setAxis = function() {
            me._core.setAxis();
            me._needRedraw = true;
        };
        
        me.removeWireframe = function() {
            me._core.removeWireframe();
            me._needRedraw = true;
        };
        
        me.addWireframe = function() {
            me._core.addWireframe();
            me._needRedraw = true;
        };


        me.setBackgroundColor = function(color) {
            me._core.setBackgroundColor(color);
            me._needRedraw = true;

        };
        me.setScrewThreshold = function(value) {
            me._core.setScrewThreshold(value);
            me._needRedraw = true;
        };
        
        me.setJointThreshold = function(value) {
            me._core.setJointThreshold(value);
            me._needRedraw = true;
        };

        me.setL = function(value) {
            me._core.setL(value);
            me._needRedraw = true;
        };
      
        me.setS = function(value) {
            me._core.setS(value);
            me._needRedraw = true;
        };
      
        me.setHMin = function(value) {
            me._core.setHMin(value);
            me._needRedraw = true;
        };
      
        me.setHMax = function(value) {
            me._core.setHMax(value);
            me._needRedraw = true;
        };
      
        me.setMinRefl = function(value) {
            me._core.setMinRefl(value);
            me._needRedraw = true;

        };
        me.setMinSos = function(value) {
            me._core.setMinSos(value);
            me._needRedraw = true;
        };
        me.setMinAtten = function(value) {
            me._core.setMinAtten(value);
            me._needRedraw = true;
        };
      
       me.setMaxRefl = function(value) {
            me._core.setMaxRefl(value);
            me._needRedraw = true;

        };
        me.setMaxSos = function(value) {
            me._core.setMaxSos(value);
            me._needRedraw = true;
        };
        me.setMaxAtten = function(value) {
            me._core.setMaxAtten(value);
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

        me.Axis = function() {
            me._core.setAxis();
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
            console.log("Check");
            console.log(me._adaptationManager.isRun());
            return me._adaptationManager.isRun();
        };

        me.setAxis = function() {
            return me._core.setAxis();
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
            
            if(config['test'] != undefined) 
                me._core.setRowCol( config['test'], config['test'] );

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

            if(config['axis'] != undefined) {
                me.setAxis( config['axis'] );
            }

            if(config['absorption_mode'] != undefined) {
                me._core.setAbsorptionMode( config['absorption_mode'] );
            }

            //if(config['render_size'] != undefined) {
            //    me._render.setSize( config['render_size'][0], config['render_size'][1] );
            //}

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
                "auto_steps": me.isAutoStepsOn(),
                "axis": true,
            };

            return config;
        };

        me.init();

        me.setConfig(config);

        return me;

    };

    namespace.VolumeRaycaster = VolumeRaycaster;

})(window.VRC);
