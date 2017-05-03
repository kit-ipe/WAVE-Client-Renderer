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
    // Stats
    this.stats;
    this.isStatsOn = false;

    // USCT Parameters  
    // Slowly need to deprecate this section; can be generalized into rgb.
    this.zFactor = conf.zFactor != undefined ? conf.zFactor : 1;
    this.l = conf.l;
    this.s = conf.s;
  
    this.hMin = conf.hMin;
    this.hMax = conf.hMax;
  
    this.minRefl = conf.minRefl;
    this.minSos = conf.minSos;
    this.minAtten = conf.minAtten;
  
    this.maxRefl = conf.maxRefl;
    this.maxSos = conf.maxSos;
    this.maxAtten = conf.maxAtten;

    this.lightRotation = 0;
    
    // General Parameters
    this._steps = conf.steps == undefined ? 20 : conf.steps;
    this._slices_gap = [0, '*'];
    this._slicemap_row_col = [16, 16];
    this._gray_value = [0.0, 1.0];
    this._slicemaps_images = [];
    this._slicemaps_paths = conf.slicemaps_paths;
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
        {'color': '#00004c', 'pos': 0.0}, {'color': '#000054', 'pos': 0.013888888888888888}, {'color': '#000060', 'pos': 0.027777777777777776}, {'color': '#000068', 'pos': 0.041666666666666664}, {'color': '#000073', 'pos': 0.05555555555555555}, {'color': '#00007c', 'pos': 0.06944444444444445}, {'color': '#000087', 'pos': 0.08333333333333333}, {'color': '#00008f', 'pos': 0.09722222222222221}, {'color': '#00009a', 'pos': 0.1111111111111111}, {'color': '#0000a6', 'pos': 0.125}, {'color': '#0000ae', 'pos': 0.1388888888888889}, {'color': '#0000b9', 'pos': 0.15277777777777776}, {'color': '#0000c2', 'pos': 0.16666666666666666}, {'color': '#0000cd', 'pos': 0.18055555555555555}, {'color': '#0000d5', 'pos': 0.19444444444444442}, {'color': '#0000e0', 'pos': 0.20833333333333331}, {'color': '#0000e9', 'pos': 0.2222222222222222}, {'color': '#0000f4', 'pos': 0.2361111111111111}, {'color': '#0101ff', 'pos': 0.25}, {'color': '#0d0dff', 'pos': 0.2638888888888889}, {'color': '#1d1dff', 'pos': 0.2777777777777778}, {'color': '#2828ff', 'pos': 0.29166666666666663}, {'color': '#3939ff', 'pos': 0.3055555555555555}, {'color': '#4545ff', 'pos': 0.3194444444444444}, {'color': '#5555ff', 'pos': 0.3333333333333333}, {'color': '#6161ff', 'pos': 0.3472222222222222}, {'color': '#7171ff', 'pos': 0.3611111111111111}, {'color': '#8181ff', 'pos': 0.375}, {'color': '#8d8dff', 'pos': 0.38888888888888884}, {'color': '#9d9dff', 'pos': 0.40277777777777773}, {'color': '#a8a8ff', 'pos': 0.41666666666666663}, {'color': '#b9b9ff', 'pos': 0.4305555555555555}, {'color': '#c5c5ff', 'pos': 0.4444444444444444}, {'color': '#d5d5ff', 'pos': 0.4583333333333333}, {'color': '#e1e1ff', 'pos': 0.4722222222222222}, {'color': '#f1f1ff', 'pos': 0.4861111111111111}, {'color': '#fffdfd', 'pos': 0.5}, {'color': '#fff1f1', 'pos': 0.5138888888888888}, {'color': '#ffe1e1', 'pos': 0.5277777777777778}, {'color': '#ffd5d5', 'pos': 0.5416666666666666}, {'color': '#ffc5c5', 'pos': 0.5555555555555556}, {'color': '#ffb9b9', 'pos': 0.5694444444444444}, {'color': '#ffa9a9', 'pos': 0.5833333333333333}, {'color': '#ff9d9d', 'pos': 0.5972222222222222}, {'color': '#ff8d8d', 'pos': 0.611111111111111}, {'color': '#ff7d7d', 'pos': 0.625}, {'color': '#ff7171', 'pos': 0.6388888888888888}, {'color': '#ff6161', 'pos': 0.6527777777777778}, {'color': '#ff5555', 'pos': 0.6666666666666666}, {'color': '#ff4545', 'pos': 0.6805555555555555}, {'color': '#ff3838', 'pos': 0.6944444444444444}, {'color': '#ff2828', 'pos': 0.7083333333333333}, {'color': '#ff1d1d', 'pos': 0.7222222222222222}, {'color': '#ff0d0d', 'pos': 0.736111111111111}, {'color': '#fd0000', 'pos': 0.75}, {'color': '#f70000', 'pos': 0.7638888888888888}, {'color': '#ef0000', 'pos': 0.7777777777777777}, {'color': '#e90000', 'pos': 0.7916666666666666}, {'color': '#e10000', 'pos': 0.8055555555555555}, {'color': '#db0000', 'pos': 0.8194444444444444}, {'color': '#d30000', 'pos': 0.8333333333333333}, {'color': '#cd0000', 'pos': 0.8472222222222222}, {'color': '#c50000', 'pos': 0.861111111111111}, {'color': '#bd0000', 'pos': 0.875}, {'color': '#b70000', 'pos': 0.8888888888888888}, {'color': '#af0000', 'pos': 0.9027777777777777}, {'color': '#a90000', 'pos': 0.9166666666666666}, {'color': '#a10000', 'pos': 0.9305555555555555}, {'color': '#9b0000', 'pos': 0.9444444444444444}, {'color': '#930000', 'pos': 0.9583333333333333}, {'color': '#8d0000', 'pos': 0.9722222222222222}, {'color': '#850000', 'pos': 0.986111111111111}
    ];

    this._dom_container_id = conf.dom_container != undefined ? conf.dom_container : "wave-container";
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

    this._render = new THREE.WebGLRenderer({
        preserveDrawingBuffer: true,
        antialias: true,
        alpha : true
    }); 
    this._render.domElement.id = 'wave-'+this._dom_container_id;
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
    //this.isStatsOn = false;

    // Control
    this._controls = new THREE.TrackballControls(
        this._camera, 
        this._render.domElement);
    this._controls.rotateSpeed = 2.0;
    this._controls.zoomSpeed = 2.0;
    this._controls.panSpeed = 2.0;

    this._controls.noZoom = false;
    this._controls.noPan = false;

    this._controls.staticMoving = true;
    this._controls.dynamicDampingFactor = 0.3;

    this._rtTexture = new THREE.WebGLRenderTarget(
        this.getRenderSizeInPixels()[0],
        this.getRenderSizeInPixels()[1],
        {minFilter: THREE.LinearFilter,
         magFilter: THREE.LinearFilter,
         format: THREE.RGBAFormat}
    );
    this._rtTexture.texture.wrapS = THREE.ClampToEdgeWrapping;
    this._rtTexture.texture.wrapT = THREE.ClampToEdgeWrapping;

    // 2D
    this._tex1 = THREE.ImageUtils.loadTexture( this._slicemaps_paths[0] );
    this._tex1.minFilter = THREE.LinearFilter;
    this._tex2 = THREE.ImageUtils.loadTexture( this._slicemaps_paths[1] );
    this._tex2.minFilter = THREE.LinearFilter;
    this._cm = THREE.ImageUtils.loadTexture( "http://katrin.kit.edu/static/colormaps/cm_BrBG.png" );
    this._cm.minFilter = THREE.LinearFilter;
    
    this._material2D = new THREE.ShaderMaterial({
        vertexShader: this._shaders["secondPass2DCustom"].vertexShader,
        fragmentShader: ejs.render(
            this._shaders["secondPass2DCustom"].fragmentShader,
            {"maxTexturesNumber": this.getMaxTexturesNumber()}
        ),
        uniforms: {
            uSetViewMode: {type: "i", value: 0},
            texture1: {type: 't', value: this._tex1},
            texture2: {type: 't', value: this._tex2},
            colourmap: {type: 't', value: this._cm},
            uZoom: {type:'v4', value: new THREE.Vector4(0.0, 1.0, 0.0, 1.0)},
            //uZoom: {type:'v4', value: new THREE.Vector4(0.1875, 0.28125, 0.20117, 0.29492)},
            resolution: {type: 'v2',value: new THREE.Vector2(this._render_size[0], this._render_size[1])}
        }
    });
    var geometry = new THREE.PlaneBufferGeometry( 10, 10 );
    this._meshFirstPass = new THREE.Mesh( geometry, this._material2D );
    this._sceneFirstPass = new THREE.Scene();
    this._sceneFirstPass.add(this._meshFirstPass);
    
    //var sprite = new THREE.Mesh( geometry,material );
    //scene.add( sprite );
    //sprite.position.z = -1;//Move it back so we can see it
    
    /*
    this._materialFirstPass = new THREE.ShaderMaterial( {
        vertexShader: this._shaders.firstPass.vertexShader,
        fragmentShader: this._shaders.firstPass.fragmentShader,
        side: THREE.FrontSide,
        transparent: true
    } );
    
    this._materialSecondPass = new THREE.ShaderMaterial( {
        vertexShader: this._shaders[this._shader_name].vertexShader,
        fragmentShader: ejs.render( this._shaders[this._shader_name].fragmentShader, {
          "maxTexturesNumber": me.getMaxTexturesNumber()}),
        uniforms: {
            uBackCoord: { type: "t",  value: this._rtTexture }, 
            uSliceMaps: { type: "tv", value: this._slicemaps_textures },
            uLightPos: {type:"v3", value: new THREE.Vector3() },
            uSetViewMode: {type:"i", value: 0 },

            uSteps: { type: "i", value: this._steps },
            uSlicemapWidth: { type: "f", value: this._slicemaps_width },
            uNumberOfSlices: { type: "f", value: this.getSlicesRange()[1] },
            uSlicesOverX: { type: "f", value: this._slicemap_row_col[0] },
            uSlicesOverY: { type: "f", value: this._slicemap_row_col[1] },
            uOpacityVal: { type: "f", value: this._opacity_factor },
            darkness: { type: "f", value: this._color_factor },            

            l: { type: "f", value: this.l },
            s: { type: "f", value: this.s },
            hMin: { type: "f", value: this.hMin },
            hMax: { type: "f", value: this.hMax },
          
            minSos: { type: "f", value: this.minSos },
            maxSos: { type: "f", value: this.maxSos },
            minAtten: { type: "f", value: this.minAtten },
            maxAtten: { type: "f", value: this.maxAtten },
            minRefl: { type: "f", value: this.minRefl },
            maxRefl: { type: "f", value: this.maxRefl },  
          
           uTransferFunction: { type: "t",  value: this._transfer_function },
           uColorVal: { type: "f", value: this._color_factor },
           uAbsorptionModeIndex: { type: "f", value: this._absorption_mode_index },
           uMinGrayVal: { type: "f", value: this._gray_value[0] },
           uMaxGrayVal: { type: "f", value: this._gray_value[1] }
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
    // END OF 3D
    
    var sphere = new THREE.SphereGeometry( 0.1 );
    this._light1 = new THREE.PointLight( 0xff0040, 2, 50 );
    this._light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) );
    this._light1.position.set(1, 0, 0);
    //this._sceneSecondPass.add( this._light1 );
    //this._sceneSecondPass.add( new THREE.DirectionalLightHelper(this._light1, 0.2) );
    
    // parent
	this._parent = new THREE.Object3D();
	this._sceneSecondPass.add( this._parent );
    // pivot
	this._pivot = new THREE.Object3D();
	this._parent.add( this._pivot );
    */
    
	// mesh
	//mesh1 = new THREE.Mesh( geometry, material1 );
	//mesh2 = new THREE.Mesh( geometry, material2 );
	//this._light1.position.x = 2;
    //mesh2.scale.multiplyScalar( 0.5 );
	//this._parent.add( mesh1 );
    
	//this._pivot.add( this._light1 );
    
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
    
    // 3D
    //this.setTransferFunctionByColors(this._transfer_function_colors);
    
    // Arrow Helper
    /*
    var xdir = new THREE.Vector3( 1, 0, 0 );
    var xorigin = new THREE.Vector3( -0.8, -0.5, 0.5 );
    var xlength = 0.2;
    var xhex = 0xff0000;
    var xarrowHelper = new THREE.ArrowHelper( xdir, xorigin, xlength, xhex );
    
    
    var ydir = new THREE.Vector3( 0, 1, 0 );
    var yorigin = new THREE.Vector3( -0.8, -0.5, 0.5 );
    var ylength = 0.2;
    var yhex = 0x00ff00;
    var yarrowHelper = new THREE.ArrowHelper( ydir, yorigin, ylength, yhex );
    
    
    var zdir = new THREE.Vector3( 0, 0, 1 );
    var zorigin = new THREE.Vector3( -0.8, -0.5, 0.5 );
    var zlength = 0.2;
    var zhex = 0x0000ff;
    var zarrowHelper = new THREE.ArrowHelper( zdir, zorigin, zlength, zhex );
    */
    
    //this._sceneSecondPass.add( xarrowHelper );
    //this._sceneSecondPass.add( yarrowHelper );
    //this._sceneSecondPass.add( zarrowHelper );
    //scene.add( arrowHelper );
    
    //var light = new THREE.DirectionalLight( 0xffffff );
    //light.position.set( 2, 3, 5 ).normalize();
    //light.shadowCameraVisible = true;
    
    /*
    // alternate method
    var helper = new THREE.EdgesHelper( mesh, 0xff0000 );
    scene.add( helper );
    */
    
    var update = function () {
        if (me.isStatsOn == true) {
            me.stats.begin();
            me.stats.end();
        }
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
    
    this._controls.addEventListener("scroll", function() {
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

    //3D
    //this._secondPassSetUniformValue("uTransferFunction", texture);
    this.onChangeTransferFunction.call(image);
};


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


Core.prototype.getBase64 = function() {
    return this._render.domElement.toDataURL("image/jpeg");
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
  
    //3D
    /*
    this._materialSecondPass = new THREE.ShaderMaterial( {
        vertexShader: this._shaders[this._shader_name].vertexShader,
        fragmentShader: ejs.render(
            this._shaders[this._shader_name].fragmentShader,
            {"maxTexturesNumber": this.getMaxTexturesNumber()}
        ),
        attributes: {
            vertColor: {type: 'c', value: [] }
        },
        uniforms: {
            uBackCoord: { type: "t",  value: this._rtTexture }, 
            uSliceMaps: { type: "tv", value: this._slicemaps_textures },
            uLightPos: {type:"v3", value: new THREE.Vector3() },
            uSetViewMode: {type:"i", value: 0 },          
            uNumberOfSlices: { type: "f", value: this.getSlicesRange()[1] },
            uSlicemapWidth: { type: "f", value: this._slicemaps_width},
            uSlicesOverX: { type: "f", value: this._slicemap_row_col[0] },
            uSlicesOverY: { type: "f", value: this._slicemap_row_col[1] },
            uOpacityVal: { type: "f", value: this._opacity_factor },
            darkness: { type: "f", value: this._color_factor },
            l: { type: "f", value: this.l },
            s: { type: "f", value: this.s },
            hMin: { type: "f", value: this.hMin },
            hMax: { type: "f", value: this.hMax },
            minSos: { type: "f", value: this.minSos },
            maxSos: { type: "f", value: this.maxSos },
            minAtten: { type: "f", value: this.minAtten },
            maxAtten: { type: "f", value: this.maxAtten },
            minRefl: { type: "f", value: this.minRefl },
            maxRefl: { type: "f", value: this.maxRefl }    
        },
        side: THREE.BackSide,
        transparent: true
    });
  
    this._meshSecondPass = new THREE.Mesh( this._geometry, this._materialSecondPass );

    this._sceneSecondPass = new THREE.Scene();
    this._sceneSecondPass.add( this._meshSecondPass );
    */
}


Core.prototype.setZoom = function(x1, x2, y1, y2) {
    console.log("apply Zooming.");
    //this._material2D.uniforms["uZoom"].value = new THREE.Vector4(0.1875, 0.28125, 0.20117, 0.29492);
    this._material2D.uniforms["uZoom"].value = new THREE.Vector4(x1, x2, y1, y2);
    //uSetViewMode: {type: "i", value: 0 }
    //this._material2D.uniforms.uZoom.value = {type: "i", value: 1 };
}

Core.prototype.set2DTexture = function(urls) {
    console.log("apply new Textures");
    var chosen_cm = THREE.ImageUtils.loadTexture( urls[0] );
    var chosen_cm2 = THREE.ImageUtils.loadTexture( urls[1] );
    
    chosen_cm.minFilter = THREE.NearestFilter;
    chosen_cm2.minFilter = THREE.NearestFilter;

    this._material2D.uniforms["texture1"].value = chosen_cm ;
    this._material2D.uniforms["texture2"].value = chosen_cm2;
    this._material2D.needsUpdate = true;
}


Core.prototype.setShader = function(codeblock) {    
    var header = "uniform vec2 resolution; \
    precision mediump int; \
    precision mediump float; \
    varying vec4 pos; \
    uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>]; \
    uniform sampler2D texture1; \
    uniform sampler2D texture2; \
    uniform sampler2D colourmap; \
    uniform vec4 uZoom; \
    void main(void) { \
    vec2 pos = gl_FragCoord.xy / resolution.xy; \
    float b1, b2, b3, b4, b5, b6; \
    vec3 t1, t2; \
    float newX = ((uZoom.y - uZoom.x)  * pos.x) + uZoom.x; \
    float newY = ((uZoom.w - uZoom.z)  * pos.y) + uZoom.z; \
    t1 = texture2D(texture1, vec2(newX, newY)).xyz; \
    t2 = texture2D(texture2, vec2(newX, newY)).xyz; \
    b1 = t1.x; \
    b2 = t1.y; \
    b3 = t1.z; \
    b4 = t2.x; \
    b5 = t2.y; \
    b6 = t2.z;";
    var footer = "}";
    
    var final_code = header + codeblock + footer;

    this._sceneFirstPass.remove(this._meshFirstPass);
    this._material2D = new THREE.ShaderMaterial({
        vertexShader: this._shaders["secondPass2DCustom"].vertexShader,
        fragmentShader: ejs.render(
            final_code,
            {"maxTexturesNumber": this.getMaxTexturesNumber()}
        ),
        uniforms: {
            uSetViewMode: {type: "i", value: 0 },
            texture1: {type: 't', value: this._tex1},
            texture2: {type: 't', value: this._tex2},
            colourmap: {type: 't', value: this._cm},
            uZoom: {type:'v4', value: new THREE.Vector4(0.0, 1.0, 0.0, 1.0)},
            resolution: {type: 'v2',value: new THREE.Vector2(this._render_size[0], this._render_size[1])}
        }
    });
    var geometry = new THREE.PlaneBufferGeometry( 10, 10 );
    this._meshFirstPass = new THREE.Mesh( geometry, this._material2D );
    this._sceneFirstPass = new THREE.Scene();
    this._sceneFirstPass.add(this._meshFirstPass);
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
    //3D
    //this._secondPassSetUniformValue("uSliceMaps", this._slicemaps_textures);
    this._slicemaps_width = images[0].width;
    //3D
    //this._secondPassSetUniformValue("uSlicemapWidth", this._slicemaps_width);
};


Core.prototype.setSteps = function(steps) {
    //console.log("Core: setSteps(" + steps + ")");
    this._steps = steps;
    //3D
    //this._secondPassSetUniformValue("uSteps", this._steps);
};


Core.prototype.setSlicesRange = function(from, to) {
    console.log("Core: setSlicesRange()");
    this._slices_gap = [from, to];
    //3D
    //this._secondPassSetUniformValue("uNumberOfSlices", this.getSlicesRange()[1])
};


Core.prototype.setOpacityFactor = function(opacity_factor) {
    console.log("Core: setOpacityFactor()");
    this._opacity_factor = opacity_factor;
    //3D
    //this._secondPassSetUniformValue("uOpacityVal", this._opacity_factor);
};


Core.prototype.setColorFactor = function(color_factor) {
    console.log("Core: setColorFactor()");
    this._color_factor = color_factor;
    //3D
    //this._secondPassSetUniformValue("darkness", this._color_factor);
};


Core.prototype.setAbsorptionMode = function(mode_index) {
    console.log("Core: setAbsorptionMode()");
    this._absorption_mode_index = mode_index;
    //3D
    //this._secondPassSetUniformValue("uAbsorptionModeIndex", this._absorption_mode_index);
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
    //3D
    //this._secondPassSetUniformValue("uSlicesOverX", this._slicemap_row_col[0]);
    //this._secondPassSetUniformValue("uSlicesOverY", this._slicemap_row_col[1]);
};


Core.prototype.setGrayMinValue = function(value) {
    console.log("Core: setMinGrayValue()");
    this._gray_value[0] = value;
    //3D
    //this._secondPassSetUniformValue("uMinGrayVal", this._gray_value[0]);
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
    //3D
    //this._secondPassSetUniformValue("uMaxGrayVal", this._gray_value[1]);
};


Core.prototype.addWireframe = function() {
    console.log("Core: addFrame()");
    this._sceneSecondPass.add( this._wireframe );

    // Controls
    //this._controls.update();
    //3D
    //this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    //this._render.render( this._sceneFirstPass, this._camera );

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.removeWireframe = function() {
    console.log("Core: removeFrame()");
    this._sceneSecondPass.remove( this._wireframe );

    // Controls
    //this._controls.update();
    //3D
    //this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    //this._render.render( this._sceneFirstPass, this._camera );

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.setStats = function(value) {
    console.log("Core: setStats()");
    console.log("Enable Stats: " + this.isStatsOn);

    if (value == true) {
        this.isStatsOn = true;    
        // FramesPerSecond
    
        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms, 2: mb
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.right = '10px';
        this.stats.domElement.style.top = '10px';
        document.body.appendChild( this.stats.domElement );
    } else {
       document.getElementById("stats").remove();
    }
}


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

    // Controls
    //this._controls.update();
    //3D
    //this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    //this._render.render( this._sceneFirstPass, this._camera );

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.showISO = function() {
    //3D
    //this._secondPassSetUniformValue("uSetViewMode", 1);
    this._pivot.add( this._light1 );
    //3D
    //this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.showLight = function() {
    this._pivot.add( this._light1 );
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.hideLight = function() {
    this._pivot.remove( this._light1 );
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.showVolren = function() {
    //3D
    //this._secondPassSetUniformValue("uSetViewMode", 0);
    this._pivot.remove( this._light1 );
    //this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.startLightRotation = function() {
    this.lightRotation = 1;
    this.draw(0.0);
};


Core.prototype.stopLightRotation = function() {
    this.lightRotation = 0;
    this.draw(0.0);
};


Core.prototype.draw = function(fps) {
    this.onPreDraw.call(fps.toFixed(3));

    if (this.lightRotation > 0) {
        this._pivot.rotation.y += 0.01;
    }
    
    //var cameraPosition = new THREE.Vector3();
    //cameraPosition.setFromMatrixPosition(this._light1.worldMatrix);
    //console.log(cameraPosition);
    
    //3D
    //var cameraPosition = this._light1.getWorldPosition();
    //this._secondPassSetUniformValue("uLightPos", cameraPosition);
    
    //Controls
    //this._controls.update();
    //3D
    this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    this._render.render( this._sceneFirstPass, this._camera );

    //3D
    // Render the second pass and perform the volume rendering.
    //this._render.render( this._sceneSecondPass, this._camera );

    /*
    // Enable this for compass or birdview
    var vector = this._camera.getWorldDirection();
    theta = Math.atan2(vector.x,vector.z);
    theta = theta + 3.142; // add/minux pi to inverse
    var degree = theta * (180/3.142);
    //console.log(degree);
    compassDraw(degree);
    */
    
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
    var canvas_id = "#" + this._dom_container_id + " > canvas";
    var container = document.getElementById(this._dom_container_id);
    
    if(this._canvas_size[0] == '*') {
        width = document.querySelector(canvas_id).width;
        container.style.width = width+"px";
    } else if (this._canvas_size[0] == 'fullscreen') {
        width = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;
        container.style.width = width+"px";
    }
    
    if(this._canvas_size[1] == '*') {
        height = document.querySelector(canvas_id).height;
        container.style.height = height+"px";
    } else if (this._canvas_size[1] == 'fullscreen') {
        height = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
        container.style.height = height+"px";
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
window.VRC.Core.prototype._shaders.secondPass2DCustom = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"resolution" : { type: "v2", value: new THREE.Vector2( 0, 0 ) },
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"texture1" : { type: "t", value: null },
		"texture2" : { type: "t", value: null },
		"uZoom" : { type: "v4", value: new THREE.Vector4( 0, 0, 0, 0 ) },
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
		'/**',
		' * 2D Custom Shader',
		' */',
		'uniform vec2 resolution;',
		'precision mediump int; ',
		'precision mediump float;',
		'varying vec4 frontColor;',
		'varying vec4 pos; ',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform sampler2D texture1;',
		'uniform sampler2D texture2;',
		'uniform vec4 uZoom;',
		'void main(void) {',
		'    vec2 pos = gl_FragCoord.xy / resolution.xy;',
		'    float b1, b2, b3, b4, b5, b6;',
		'    vec3 t1, t2;',
		'    float newX = ((uZoom.y - uZoom.x)  * pos.x) + uZoom.x;',
		'    float newY = ((uZoom.w - uZoom.z)  * pos.y) + uZoom.z;',
		'    t1 = texture2D(texture1, vec2(newX, newY)).xyz;',
		'    t2 = texture2D(texture2, vec2(newX, newY)).xyz;',
		'    b1 = t1.x;',
		'    b2 = t1.y;',
		'    b3 = t1.z;',
		'    b4 = t2.x;',
		'    b5 = t2.y;',
		'    b6 = t2.z;',
		'    gl_FragColor = vec4(b1, b2, b3, 1.0);',
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
window.VRC.Core.prototype._shaders.secondPassCook = {
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
		"maxSos" : { type: "f", value: -1 },
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
		'uniform float maxSos;',
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
		'}',
		'// Compute the Normal around the current voxel',
		'vec3 getNormal(vec3 at)',
		'{',
		'    float fSliceLower, fSliceUpper, s1, s2;',
		'    float dx1, dy1, dx2, dy2;',
		'    int iTexLowerIndex, iTexUpperIndex;',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    fSliceLower = floor(at.z*uNumberOfSlices); // z value is between 0 and 1. Multiplying the total number of slices',
		'                                               // gives the position in between. By flooring the value, you get the lower',
		'                                               // slice position.',
		'    fSliceUpper = min(fSliceLower + 1.0, uNumberOfSlices); // return the mininimum between the two values',
		'                                                           // act as a upper clamp.',
		'    // At this point, we get our lower slice and upper slice',
		'    // Now we need to get which texture image contains our slice.',
		'    iTexLowerIndex = int(floor(fSliceLower / slicesPerSprite));',
		'    iTexUpperIndex = int(floor(fSliceUpper / slicesPerSprite));',
		'    // mod returns the value of x modulo y. This is computed as x - y * floor(x/y).',
		'    s1 = mod(fSliceLower, slicesPerSprite); // returns the index of slice in slicemap',
		'    s2 = mod(fSliceUpper, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY; // first term is the row within the slicemap',
		'                                               // second division is normalize along y-axis',
		'    dx2 = fract(s2/uSlicesOverX);',
		'    dy2 = floor(s2/uSlicesOverY)/uSlicesOverY; // first term is the row within the slicemap',
		'                                               // second division is normalize along y-axis',
		'    float weight = at.z - floor(at.z);',
		'    float x00, x01, x10, x11, x0, x1;',
		'    float y00, y01, y10, y11, y0, y1;',
		'    float z00, z01, z10, z11, z0, z1;',
		'    float weight_z0, weight_z1;',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( iTexLowerIndex == <%=i%> )',
		'        {',
		'            texpos1.x = dx1+((at.x - 1.0/144.0 )/uSlicesOverX);',
		'            texpos1.y = dy1+(at.y/uSlicesOverY);',
		'            x00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+(at.y/uSlicesOverY);',
		'            x01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx1+(at.x/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y-1.0/144.0) /uSlicesOverY);',
		'            y00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx1+(at.x/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y+1.0/144.0)/uSlicesOverY);',
		'            y01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx1+(at.x/uSlicesOverX);',
		'            texpos1.y = dy1+(at.y/uSlicesOverY);',
		'            z00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'           ',
		'        }',
		'        if( iTexUpperIndex == <%=i%> ) {',
		'            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+(at.y/uSlicesOverY);',
		'            x10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+(at.y/uSlicesOverY);',
		'            x11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(at.x/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y-1.0/144.0) /uSlicesOverY);',
		'            y10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx2+(at.x/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y+1.0)/uSlicesOverY);',
		'            y11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(at.x/uSlicesOverX);',
		'            texpos1.y = dy2+(at.y/uSlicesOverY);',
		'            z11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        }',
		'    <% } %>',
		'    // we need to get interpolation of 2 x points',
		'    x0 = ((weight * (x10 - x00)) + x00);',
		'    x1 = ((weight * (x11 - x01)) + x01);',
		'    ',
		'    y0 = ((weight * (y10 - y00)) + y00);',
		'    y1 = ((weight * (y11 - y01)) + y01);',
		'    ',
		'    weight_z0 = (at.z - (1.0/144.0)) - floor(at.z);',
		'    weight_z1 = (at.z + (1.0/144.0)) - floor(at.z);',
		'    z0 = ((weight_z0 * (z11 - z00)) + z00);',
		'    z1 = ((weight_z1 * (z11 - z00)) + z00);',
		'    ',
		'    z0 = z00;',
		'    z1 = z11;',
		'    vec3 n = vec3(x1 - x0 , y1 - y0 , z1 - z0);',
		'    return n;',
		'}',
		'// returns intensity of reflected ambient lighting',
		'vec3 ambientLighting()',
		'{',
		'    const vec3 u_matAmbientReflectance = vec3(1.0, 1.0, 1.0);',
		'    const vec3 u_lightAmbientIntensity = vec3(0.6, 0.3, 0.0);',
		'    ',
		'    return u_matAmbientReflectance * u_lightAmbientIntensity;',
		'}',
		'// returns intensity of diffuse reflection',
		'vec3 diffuseLighting(in vec3 N, in vec3 L)',
		'{',
		'    const vec3 u_matDiffuseReflectance = vec3(1, 1, 1);',
		'    const vec3 u_lightDiffuseIntensity = vec3(1.0, 0.5, 0);',
		'    ',
		'    // calculation as for Lambertian reflection',
		'    float diffuseTerm = dot(N, L);',
		'    if (diffuseTerm > 1.0) {',
		'        diffuseTerm = 1.0;',
		'    } else if (diffuseTerm < 0.0) {',
		'        diffuseTerm = 0.0;',
		'    }',
		'    return u_matDiffuseReflectance * u_lightDiffuseIntensity * diffuseTerm;',
		'}',
		'// returns intensity of specular reflection',
		'vec3 specularLighting(in vec3 N, in vec3 L, in vec3 V)',
		'{',
		'    float specularTerm = 0.0;',
		'    const vec3 u_lightSpecularIntensity = vec3(0, 1, 0);',
		'    const vec3 u_matSpecularReflectance = vec3(1, 1, 1);',
		'    const float u_matShininess = 256.0;',
		'   // calculate specular reflection only if',
		'   // the surface is oriented to the light source',
		'   if(dot(N, L) > 0.0)',
		'   {',
		'      // half vector',
		'      vec3 H = normalize(L + V);',
		'      specularTerm = pow(dot(N, H), u_matShininess);',
		'   }',
		'   return u_matSpecularReflectance * u_lightSpecularIntensity * specularTerm;',
		'}',
		'void main(void)',
		'{',
		'    const int uStepsI = 144;',
		'    const float uStepsF = float(uStepsI);',
		'    ',
		'    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		'    vec4 backColor = texture2D(uBackCoord,texC); ',
		'    vec3 dir = backColor.rgb - frontColor.rgb; ',
		'    vec4 vpos = frontColor; ',
		'    vec3 Step = dir/uStepsF; ',
		'    vec4 accum = vec4(0, 0, 0, 0);',
		'    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		'    vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		'    float opacityFactor = uOpacityVal; ',
		'  ',
		'    for(int i = 0; i < uStepsI; i++) {       ',
		'        vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'        if(gray_val.z < 0.05 || ',
		'           gray_val.x < minSos ||',
		'           gray_val.x > maxSos)  ',
		'            colorValue = vec4(0.0);     ',
		'        else {',
		'            colorValue.x = (darkness * 2.0 - gray_val.x) * l * 0.4;',
		'            //colorValue.x = gray_val.x;',
		'            colorValue.w = 0.1;',
		'            ',
		'            // set important material values',
		'            float roughnessValue = 0.3; // 0 : smooth, 1: rough',
		'            float F0 = 0.8; // fresnel reflectance at normal incidence',
		'            float k = 0.2; // fraction of diffuse reflection (specular reflection = 1 - k)',
		'            vec3 lightColor = vec3(0.9, 0.1, 0.1);',
		'    ',
		'            // interpolating normals will change the length of the normal, so renormalize the normal.',
		'            vec3 normal = normalize(getNormal(vpos.xyz));',
		'    ',
		'            // do the lighting calculation for each fragment.',
		'            vec3 lightPos = vec3(2.0,4.0,5.0);',
		'            vec3 lightDirection = normalize(lightPos - vpos.xyz);',
		'            float NdotL = max(dot(normal, lightDirection), 0.0);',
		'            ',
		'            float specular = 0.0;',
		'            if(NdotL > 0.0)',
		'            {',
		'                vec3 eyeDir = normalize(cameraPosition - vpos.xyz);',
		'                // calculate intermediary values',
		'                vec3 halfVector = normalize(lightDirection + eyeDir);',
		'                float NdotH = max(dot(normal, halfVector), 0.0); ',
		'                float NdotV = max(dot(normal, eyeDir), 0.0); // note: this could also be NdotL, which is the same value',
		'                float VdotH = max(dot(eyeDir, halfVector), 0.0);',
		'                float mSquared = roughnessValue * roughnessValue;',
		'        ',
		'                // geometric attenuation',
		'                float NH2 = 2.0 * NdotH;',
		'                float g1 = (NH2 * NdotV) / VdotH;',
		'                float g2 = (NH2 * NdotL) / VdotH;',
		'                float geoAtt = min(1.0, min(g1, g2));',
		'     ',
		'                // roughness (or: microfacet distribution function)',
		'                // beckmann distribution function',
		'                float r1 = 1.0 / ( 4.0 * mSquared * pow(NdotH, 4.0));',
		'                float r2 = (NdotH * NdotH - 1.0) / (mSquared * NdotH * NdotH);',
		'                float roughness = r1 * exp(r2);',
		'        ',
		'                // fresnel',
		'                // Schlick approximation',
		'                float fresnel = pow(1.0 - VdotH, 5.0);',
		'                fresnel *= (1.0 - F0);',
		'                fresnel += F0;',
		'        ',
		'                specular = (fresnel * geoAtt * roughness) / (NdotV * NdotL * 3.14);',
		'            }',
		'            ',
		'            vec3 finalValue = lightColor * colorValue.xxx * NdotL * (k + specular * (1.0 - k));',
		'            ',
		'            //sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a;',
		'            sample.rgb = (1.0 - accum.a) * finalValue.xyz * sample.a;',
		'            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'        }    ',
		'   ',
		'        //advance the current position ',
		'        vpos.xyz += Step;  ',
		'   ',
		'        if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'            break;  ',
		'    } ',
		'    gl_FragColor = accum; ',
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
window.VRC.Core.prototype._shaders.secondPassGuvenSteven = {
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
		'    ',
		'    float eps =pow(2.0,-16.0);',
		'    if (volpos.x >= 1.0)',
		'        volpos.x = 1.0-eps;',
		'    if (volpos.y >= 1.0)',
		'        volpos.y = 1.0-eps;',
		'    if (volpos.z >= 1.0)',
		'        volpos.z = 1.0-eps;',
		'    ',
		'    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY; ',
		'    //float sliceNo = floor(volpos.z*(uNumberOfSlices-1.0));     //Floor',
		'    //float sliceNo = floor(volpos.z*(uNumberOfSlices-1.0)+0.5);     //Nearestneighbor',
		'    float sliceNo = floor(volpos.z*(uNumberOfSlices));',
		'    //float sliceNo = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices-1.0)))+0.5);    //Guevens code',
		'    ',
		'    int texIndexOfSlicemap = int(floor(sliceNo / slicesPerSlicemap));',
		'    float s1 = mod(sliceNo, slicesPerSlicemap);',
		'    float dx1 = fract(s1/uSlicesOverX);',
		'    float dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;      ',
		'       ',
		'    float sliceSizeX = uSlicemapWidth/uSlicesOverX;',
		'    float sliceSizeY = uSlicemapWidth/uSlicesOverY;',
		'    ',
		'    texpos1.x = dx1+(floor(volpos.x*sliceSizeX)+0.5)/uSlicemapWidth;',
		'    texpos1.y = dy1+(floor(volpos.y*sliceSizeY)+0.5)/uSlicemapWidth;',
		'   ',
		'    texpos1_frac.x = texpos1.x;',
		'    texpos1_frac.y = texpos1.y;',
		'    ',
		'    ',
		'    ',
		'    // Guevens code',
		'    // To prevent long coding lines:',
		'    float sWidth = uSlicemapWidth;',
		'    float sX = uSlicesOverX;',
		'    float sY = uSlicesOverY;',
		'     ',
		'    texpos1.x = (dx1+(((volpos.x*((sWidth/sX)-1.0))/(sWidth/sX))/(sX)));',
		'    texpos1.y = (dy1+(((volpos.y*((sWidth/sY)-1.0))/(sWidth/sY))/(sY)));',
		'    // Nearest neighbor over x/y axis',
		'    texpos1_frac.x =(0.5+floor(((texpos1.x+(0.5/(sWidth)))*sWidth)))/sWidth; //upscaling so that flooring is possible',
		'    texpos1_frac.y =(0.5+floor(((texpos1.y+(0.5/(sWidth)))*sWidth)))/sWidth;',
		'    ',
		'    ',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( texIndexOfSlicemap == <%=i%> )',
		'        {',
		'          value1_vec = texture2D(uSliceMaps[<%=i%>],texpos1_frac).rgb;',
		'          //value1 = ((value1_vec.r + value1_vec.g + value1_vec.b)/3.0);',
		'          value1 = ((value1_vec.r * 0.299)+(value1_vec.g * 0.587)+(value1_vec.b * 0.114));',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    ',
		'    return value1;',
		'}',
		'void main(void)',
		'{',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;',
		' vec4 backColor = texture2D(uBackCoord,texC);',
		' vec3 dir = backColor.rgb - frontColor.rgb;',
		' vec4 vpos = frontColor;',
		' ',
		' ',
		' float dir_length = length(dir);',
		' float uStepsF = ceil((dir_length)*(uNumberOfSlices-1.0));',
		' vec3 Step = dir/(uStepsF);',
		' int uStepsI = int(uStepsF);',
		' ',
		' vec4 accum = vec4(0, 0, 0, 0);',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);',
		' vec4 colorValue = vec4(0, 0, 0, 0);',
		' float biggest_gray_value = 0.0;',
		' float opacityFactor = uOpacityVal;',
		' float lightFactor = uColorVal;',
		' ',
		' /*',
		' // Empty Skipping',
		' for(int i = 0; i < 4096; i+=1)',
		' {',
		'     if(i == uStepsI) ',
		'         break;',
		' ',
		'     float gray_val = getVolumeValue(vpos.xyz);',
		'   ',
		'     if(gray_val <= uMinGrayVal || gray_val >= uMaxGrayVal) ',
		'         uStepsF -= 1.0;',
		'     ',
		'     vpos.xyz += Step;',
		'     ',
		'     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) ',
		'         break; ',
		' }',
		' vpos = frontColor;',
		' */',
		' ',
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
		'           //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'           tf_pos.x = gray_val;',
		'           tf_pos.y = 0.5;',
		'           colorValue = texture2D(uTransferFunction,tf_pos);',
		'           //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'           sample.a = 1.0; ',
		'           //sample.a = colorValue.a * opacityFactor;',
		'           sample.rgb = colorValue.rgb * uColorVal;',
		'           accum += sample;',
		'           if(accum.a>=1.0)',
		'              break;',
		'         }',
		'         /*',
		'         // Guevens mode',
		'         if(uAbsorptionModeIndex == 1.0)',
		'         {',
		'           vec2 tf_pos;',
		'           ',
		'           //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
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
		'           sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * uColorVal; ',
		'           //sample.rgb =  colorValue.rgb * sample.a;',
		'           accum += sample;',
		'           if(accum.a>=1.0)',
		'              break;',
		'         }*/',
		'         ',
		'         ',
		'         ',
		'         // Stevens mode',
		'         if(uAbsorptionModeIndex == 1.0) ',
		'         { ',
		'             vec2 tf_pos; ',
		'             //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal); ',
		'             tf_pos.x = gray_val;',
		'             tf_pos.y = 0.5; ',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0); ',
		'             sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'             sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * uColorVal; ',
		'             accum += sample; ',
		'             if(accum.a>=1.0) ',
		'                break; ',
		'                ',
		'         }',
		'         ',
		'         ',
		'         if(uAbsorptionModeIndex == 2.0)',
		'         {',
		'             vec2 tf_pos;',
		'             //tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'             tf_pos.x = biggest_gray_value;',
		'             tf_pos.y = 0.5;',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'             sample.a = 1.0; //colorValue.a * opacityFactor;',
		'             sample.rgb = colorValue.rgb * uColorVal;',
		'             accum = sample;',
		'         }',
		'     }',
		'     //advance the current position',
		'     vpos.xyz += Step;',
		'     ',
		'     //break if the position is greater than <1, 1, 1> ',
		'     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) ',
		'     { ',
		'         break; ',
		'     } ',
		'     ',
		' }',
		' gl_FragColor = accum;',
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
window.VRC.Core.prototype._shaders.secondPassPhong = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"uLightPos" : { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
		"minSos" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
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
		'// This is an experimental shader to implement',
		'// blinn phong shading model.',
		'// In this example, I use the USCT breast model ',
		'// with a total of 144 slices as the dataset.',
		'// Hence the gradient operator is divided by 144 for ',
		'// a single unit. Uncomment line 271 to see the normals',
		'// calculated by the gradient operator function.',
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
		'uniform vec3 uLightPos;',
		'uniform float minSos;',
		'uniform float maxSos;',
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
		'}',
		'// Compute the Normal around the current voxel',
		'vec3 getNormal(vec3 at)',
		'{',
		'    float fSliceLower, fSliceUpper, s1, s2;',
		'    float dx1, dy1, dx2, dy2;',
		'    int iTexLowerIndex, iTexUpperIndex;',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    fSliceLower = floor(at.z*uNumberOfSlices); // z value is between 0 and 1. Multiplying the total number of slices',
		'                                               // gives the position in between. By flooring the value, you get the lower',
		'                                               // slice position.',
		'    fSliceUpper = min(fSliceLower + 1.0, uNumberOfSlices); // return the mininimum between the two values',
		'                                                           // act as a upper clamp.',
		'    // At this point, we get our lower slice and upper slice',
		'    // Now we need to get which texture image contains our slice.',
		'    iTexLowerIndex = int(floor(fSliceLower / slicesPerSprite));',
		'    iTexUpperIndex = int(floor(fSliceUpper / slicesPerSprite));',
		'    // mod returns the value of x modulo y. This is computed as x - y * floor(x/y).',
		'    s1 = mod(fSliceLower, slicesPerSprite); // returns the index of slice in slicemap',
		'    s2 = mod(fSliceUpper, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY; // first term is the row within the slicemap',
		'                                               // second division is normalize along y-axis',
		'    dx2 = fract(s2/uSlicesOverX);',
		'    dy2 = floor(s2/uSlicesOverY)/uSlicesOverY; // first term is the row within the slicemap',
		'                                               // second division is normalize along y-axis',
		'    float weight = at.z - floor(at.z);',
		'    float x00, x01, x10, x11, x0, x1;',
		'    float y00, y01, y10, y11, y0, y1;',
		'    float z00, z01, z10, z11, z0, z1;',
		'    float weight_z0, weight_z1;',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( iTexLowerIndex == <%=i%> )',
		'        {',
		'            texpos1.x = dx1+((at.x - 1.0/144.0 )/uSlicesOverX);',
		'            texpos1.y = dy1+(at.y/uSlicesOverY);',
		'            x00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+(at.y/uSlicesOverY);',
		'            x01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx1+(at.x/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y-1.0/144.0) /uSlicesOverY);',
		'            y00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx1+(at.x/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y+1.0/144.0)/uSlicesOverY);',
		'            y01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx1+(at.x/uSlicesOverX);',
		'            texpos1.y = dy1+(at.y/uSlicesOverY);',
		'            z00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'           ',
		'        }',
		'        if( iTexUpperIndex == <%=i%> ) {',
		'            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+(at.y/uSlicesOverY);',
		'            x10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+(at.y/uSlicesOverY);',
		'            x11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(at.x/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y-1.0/144.0) /uSlicesOverY);',
		'            y10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            texpos1.x = dx2+(at.x/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y+1.0)/uSlicesOverY);',
		'            y11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(at.x/uSlicesOverX);',
		'            texpos1.y = dy2+(at.y/uSlicesOverY);',
		'            z11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        }',
		'    <% } %>',
		'    // we need to get interpolation of 2 x points',
		'    x0 = ((weight * (x10 - x00)) + x00) * 256.0;',
		'    x1 = ((weight * (x11 - x01)) + x01) * 256.0;',
		'    ',
		'    y0 = ((weight * (y10 - y00)) + y00) * 256.0;',
		'    y1 = ((weight * (y11 - y01)) + y01) * 256.0;',
		'    ',
		'    weight_z0 = (at.z - (1.0/144.0)) - floor(at.z);',
		'    weight_z1 = (at.z + (1.0/144.0)) - floor(at.z);',
		'    z0 = ((weight_z0 * (z11 - z00)) + z00);',
		'    z1 = ((weight_z1 * (z11 - z00)) + z00);',
		'    vec3 n = vec3( (0.5 * (x1 - x0)) , (0.5 * (y1 - y0)) , (0.5 * (z1 - z0)) );',
		'    return n;',
		'}',
		'// returns intensity of reflected ambient lighting',
		'vec3 ambientLighting()',
		'{',
		'    const vec3 u_matAmbientReflectance = vec3(1.0, 1.0, 1.0);',
		'    const vec3 u_lightAmbientIntensity = vec3(0.6, 0.3, 0.0);',
		'    ',
		'    return u_matAmbientReflectance * u_lightAmbientIntensity;',
		'}',
		'// returns intensity of diffuse reflection',
		'vec3 diffuseLighting(in vec3 N, in vec3 L)',
		'{',
		'    const vec3 u_matDiffuseReflectance = vec3(1, 1, 1);',
		'    const vec3 u_lightDiffuseIntensity = vec3(1.0, 0.5, 0);',
		'    ',
		'    // calculation as for Lambertian reflection',
		'    float diffuseTerm = dot(N, L);',
		'    if (diffuseTerm > 1.0) {',
		'        diffuseTerm = 1.0;',
		'    } else if (diffuseTerm < 0.0) {',
		'        diffuseTerm = 0.0;',
		'    }',
		'    return u_matDiffuseReflectance * u_lightDiffuseIntensity * diffuseTerm;',
		'}',
		'// returns intensity of specular reflection',
		'vec3 specularLighting(in vec3 N, in vec3 L, in vec3 V)',
		'{',
		'    float specularTerm = 0.0;',
		'    const vec3 u_lightSpecularIntensity = vec3(0, 1, 0);',
		'    const vec3 u_matSpecularReflectance = vec3(1, 1, 1);',
		'    const float u_matShininess = 256.0;',
		'   // calculate specular reflection only if',
		'   // the surface is oriented to the light source',
		'   if(dot(N, L) > 0.0)',
		'   {',
		'      // half vector',
		'      vec3 H = normalize(L + V);',
		'      specularTerm = pow(dot(N, H), u_matShininess);',
		'   }',
		'   return u_matSpecularReflectance * u_lightSpecularIntensity * specularTerm;',
		'}',
		'void main(void)',
		'{',
		'    const int uStepsI = 144;',
		'    const float uStepsF = float(uStepsI);',
		'    ',
		'    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		'    vec4 backColor = texture2D(uBackCoord,texC); ',
		'    vec3 dir = backColor.rgb - frontColor.rgb; ',
		'    vec4 vpos = frontColor; ',
		'    vec3 Step = dir/uStepsF; ',
		'    vec4 accum = vec4(0, 0, 0, 0); ',
		'    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		'    vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		'    float opacityFactor = uOpacityVal; ',
		'  ',
		'    for(int i = 0; i < uStepsI; i++) {       ',
		'        vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'        if(gray_val.z < 0.05 || ',
		'           gray_val.x < minSos ||',
		'           gray_val.x > maxSos)  ',
		'            colorValue = vec4(0.0);     ',
		'        else {',
		'            colorValue.x = (darkness * 2.0 - gray_val.x) * l * 0.4;',
		'            //colorValue.x = gray_val.x;',
		'            colorValue.w = 0.1;',
		'            ',
		'            // normalize vectors after interpolation',
		'            //vec3 lightPos = vec3(1.0, 1.0, 1.0);',
		'            //vec3 L = normalize(vpos.xyz - lightPos);',
		'            vec3 L = normalize(vpos.xyz - uLightPos);',
		'            vec3 V = normalize( cameraPosition - vpos.xyz );',
		'            vec3 N = normalize(getNormal(vpos.xyz));',
		'            // get Blinn-Phong reflectance components',
		'            vec3 Iamb = ambientLighting();',
		'            vec3 Idif = diffuseLighting(N, L);',
		'            vec3 Ispe = specularLighting(N, L, V);',
		'            // diffuse color of the object from texture',
		'            //vec3 diffuseColor = texture(u_diffuseTexture, o_texcoords).rgb;',
		'        ',
		'            vec3 mycolor = (Iamb + Idif + Ispe);',
		'            //vec3 mycolor = colorValue.xxx * (Iamb + Ispe);',
		'        ',
		'            //sample.rgb = N;',
		'            sample.rgb = mycolor;',
		'            sample.a = 1.0;',
		'            //sample.rgb = (1.0 - accum.a) * mycolor * sample.a;',
		'            //sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a;',
		'            //sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'        }    ',
		'   ',
		'        //advance the current position ',
		'        vpos.xyz += Step;  ',
		'   ',
		'        if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'            break;  ',
		'    } ',
		'    gl_FragColor = accum; ',
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
window.VRC.Core.prototype._shaders.secondPassSabella = {
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
window.VRC.Core.prototype._shaders.secondPassSoebel = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"uLightPos" : { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
		"uSetViewMode" : { type: "i", value: 0 },
		"uSteps" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
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
		'// This is an experimental shader to implement',
		'// blinn phong shading model.',
		'// In this example, I use the USCT breast model ',
		'// with a total of 144 slices as the dataset.',
		'// Hence the gradient operator is divided by 144 for ',
		'// a single unit. Uncomment line 271 to see the normals',
		'// calculated by the gradient operator function.',
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
		'uniform vec3 uLightPos;',
		'uniform int uSetViewMode;',
		'uniform float uSteps;',
		'uniform float minSos;',
		'uniform float maxSos;',
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
		'}',
		'// Compute the Normal around the current voxel',
		'vec3 getNormal(vec3 at)',
		'{',
		'    float fSliceLower, fSliceUpper, s1, s2;',
		'    float dx1, dy1, dx2, dy2;',
		'    int iTexLowerIndex, iTexUpperIndex;',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    fSliceLower = floor(at.z*uNumberOfSlices); // z value is between 0 and 1. Multiplying the total number of slices',
		'                                               // gives the position in between. By flooring the value, you get the lower',
		'                                               // slice position.',
		'    fSliceUpper = min(fSliceLower + 1.0, uNumberOfSlices); // return the mininimum between the two values',
		'                                                           // act as a upper clamp.',
		'    // At this point, we get our lower slice and upper slice',
		'    // Now we need to get which texture image contains our slice.',
		'    iTexLowerIndex = int(floor(fSliceLower / slicesPerSprite));',
		'    iTexUpperIndex = int(floor(fSliceUpper / slicesPerSprite));',
		'    // mod returns the value of x modulo y. This is computed as x - y * floor(x/y).',
		'    s1 = mod(fSliceLower, slicesPerSprite); // returns the index of slice in slicemap',
		'    s2 = mod(fSliceUpper, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY; // first term is the row within the slicemap',
		'                                               // second division is normalize along y-axis',
		'    dx2 = fract(s2/uSlicesOverX);',
		'    dy2 = floor(s2/uSlicesOverY)/uSlicesOverY; // first term is the row within the slicemap',
		'                                               // second division is normalize along y-axis',
		'    float weight = at.z - floor(at.z);',
		'    float w1 = at.z - floor(at.z);',
		'    float w0 = (at.z - (1.0/144.0)) - floor(at.z);',
		'    float w2 = (at.z + (1.0/144.0)) - floor(at.z);',
		'    ',
		'    ',
		'    float fx, fy, fz;',
		'    ',
		'    float L0, L1, L2, L3, L4, L5, L6, L7, L8;',
		'    float H0, H1, H2, H3, H4, H5, H6, H7, H8;',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( iTexLowerIndex == <%=i%> )',
		'        {',
		'            texpos1.x = dx1+((at.x - 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y + 1.0/144.0)/uSlicesOverY);',
		'            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx1+((at.x + 0.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y + 1.0/144.0)/uSlicesOverY);',
		'            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y + 1.0/144.0)/uSlicesOverY);',
		'            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x - 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y + 0.0/144.0)/uSlicesOverY);',
		'            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx1+((at.x + 0.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y + 0.0/144.0)/uSlicesOverY);',
		'            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y + 0.0/144.0)/uSlicesOverY);',
		'            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x - 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y - 1.0/144.0)/uSlicesOverY);',
		'            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx1+((at.x + 0.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y - 1.0/144.0)/uSlicesOverY);',
		'            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y - 1.0/144.0)/uSlicesOverY);',
		'            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'        }',
		'        if( iTexUpperIndex == <%=i%> ) {',
		'            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y + 1.0/144.0)/uSlicesOverY);',
		'            H0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx2+((at.x + 0.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y + 1.0/144.0)/uSlicesOverY);',
		'            H1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y + 1.0/144.0)/uSlicesOverY);',
		'            H2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y + 0.0/144.0)/uSlicesOverY);',
		'            H3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx2+((at.x + 0.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y + 0.0/144.0)/uSlicesOverY);',
		'            H4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y + 0.0/144.0)/uSlicesOverY);',
		'            H5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y - 1.0/144.0)/uSlicesOverY);',
		'            H6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx2+((at.x + 0.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y - 1.0/144.0)/uSlicesOverY);',
		'            H7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y - 1.0/144.0)/uSlicesOverY);',
		'            H8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        }',
		'    <% } %>',
		'    // we need to get interpolation of 2 x points',
		'    // x direction',
		'    // -1 -3 -1   0  0  0   1  3  1',
		'    // -3 -6 -3   0  0  0   3  6  3',
		'    // -1 -3 -1   0  0  0   1  3  1',
		'    // y direction',
		'    //  1  3  1   3  6  3   1  3  1',
		'    //  0  0  0   0  0  0   0  0  0',
		'    // -1 -3 -1  -3 -6 -3  -1 -3 -1',
		'    // z direction',
		'    // -1  0  1   -3  0  3   -1  0  1',
		'    // -3  0  3   -6  0  6   -3  0  3',
		'    // -1  0  1   -3  0  3   -1  0  1',
		'    ',
		'    fx =  ((w0 * (H0 - L0)) + L0) * -1.0;',
		'    fx += ((w1 * (H0 - L0)) + L0) * -3.0;',
		'    fx += ((w2 * (H0 - L0)) + L0) * -1.0;',
		'    ',
		'    fx += ((w0 * (H3 - L3)) + L3) * -3.0;',
		'    fx += ((w1 * (H3 - L3)) + L3) * -6.0;',
		'    fx += ((w2 * (H3 - L3)) + L3) * -3.0;',
		'    ',
		'    fx += ((w0 * (H6 - L6)) + L6) * -1.0;',
		'    fx += ((w1 * (H6 - L6)) + L6) * -3.0;',
		'    fx += ((w2 * (H6 - L6)) + L6) * -1.0;',
		'    ',
		'    fx += ((w0 * (H1 - L1)) + L1) * 0.0;',
		'    fx += ((w1 * (H1 - L1)) + L1) * 0.0;',
		'    fx += ((w2 * (H1 - L1)) + L1) * 0.0;',
		'    ',
		'    fx += ((w0 * (H4 - L4)) + L4) * 0.0;',
		'    fx += ((w1 * (H4 - L4)) + L4) * 0.0;',
		'    fx += ((w2 * (H4 - L4)) + L4) * 0.0;',
		'    ',
		'    fx += ((w0 * (H7 - L7)) + L7) * 0.0;',
		'    fx += ((w1 * (H7 - L7)) + L7) * 0.0;',
		'    fx += ((w2 * (H7 - L7)) + L7) * 0.0;',
		'    ',
		'    fx += ((w0 * (H2 - L2)) + L2) * 1.0;',
		'    fx += ((w1 * (H2 - L2)) + L2) * 3.0;',
		'    fx += ((w2 * (H2 - L2)) + L2) * 1.0;',
		'    ',
		'    fx += ((w0 * (H5 - L5)) + L5) * 3.0;',
		'    fx += ((w1 * (H5 - L5)) + L5) * 6.0;',
		'    fx += ((w2 * (H5 - L5)) + L5) * 3.0;',
		'    ',
		'    fx += ((w0 * (H8 - L8)) + L8) * 1.0;',
		'    fx += ((w1 * (H8 - L8)) + L8) * 3.0;',
		'    fx += ((w2 * (H8 - L8)) + L8) * 1.0;',
		'    ',
		'    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;',
		'    fy += ((w1 * (H0 - L0)) + L0) * 3.0;',
		'    fy += ((w2 * (H0 - L0)) + L0) * 1.0;',
		'    ',
		'    fy += ((w0 * (H3 - L3)) + L3) * 0.0;',
		'    fy += ((w1 * (H3 - L3)) + L3) * 0.0;',
		'    fy += ((w2 * (H3 - L3)) + L3) * 0.0;',
		'    ',
		'    fy += ((w0 * (H6 - L6)) + L6) * -1.0;',
		'    fy += ((w1 * (H6 - L6)) + L6) * -3.0;',
		'    fy += ((w2 * (H6 - L6)) + L6) * -1.0;',
		'    ',
		'    fy += ((w0 * (H1 - L1)) + L1) * 3.0;',
		'    fy += ((w1 * (H1 - L1)) + L1) * 6.0;',
		'    fy += ((w2 * (H1 - L1)) + L1) * 3.0;',
		'    ',
		'    fy += ((w0 * (H4 - L4)) + L4) * 0.0;',
		'    fy += ((w1 * (H4 - L4)) + L4) * 0.0;',
		'    fy += ((w2 * (H4 - L4)) + L4) * 0.0;',
		'    ',
		'    fy += ((w0 * (H7 - L7)) + L7) * -3.0;',
		'    fy += ((w1 * (H7 - L7)) + L7) * -6.0;',
		'    fy += ((w2 * (H7 - L7)) + L7) * -3.0;',
		'    ',
		'    fy += ((w0 * (H2 - L2)) + L2) * 1.0;',
		'    fy += ((w1 * (H2 - L2)) + L2) * 3.0;',
		'    fy += ((w2 * (H2 - L2)) + L2) * 1.0;',
		'    ',
		'    fy += ((w0 * (H5 - L5)) + L5) * 0.0;',
		'    fy += ((w1 * (H5 - L5)) + L5) * 0.0;',
		'    fy += ((w2 * (H5 - L5)) + L5) * 0.0;',
		'    ',
		'    fy += ((w0 * (H8 - L8)) + L8) * -1.0;',
		'    fy += ((w1 * (H8 - L8)) + L8) * -3.0;',
		'    fy += ((w2 * (H8 - L8)) + L8) * -1.0;',
		'    ',
		'    ',
		'    ',
		'    ',
		'    fz =  ((w0 * (H0 - L0)) + L0) * -1.0;',
		'    fz += ((w1 * (H0 - L0)) + L0) * 0.0;',
		'    fz += ((w2 * (H0 - L0)) + L0) * 1.0;',
		'    ',
		'    fz += ((w0 * (H3 - L3)) + L3) * -3.0;',
		'    fz += ((w1 * (H3 - L3)) + L3) * 0.0;',
		'    fz += ((w2 * (H3 - L3)) + L3) * 3.0;',
		'    ',
		'    fz += ((w0 * (H6 - L6)) + L6) * -1.0;',
		'    fz += ((w1 * (H6 - L6)) + L6) * 0.0;',
		'    fz += ((w2 * (H6 - L6)) + L6) * 1.0;',
		'    ',
		'    fz += ((w0 * (H1 - L1)) + L1) * -3.0;',
		'    fz += ((w1 * (H1 - L1)) + L1) * 0.0;',
		'    fz += ((w2 * (H1 - L1)) + L1) * 3.0;',
		'    ',
		'    fz += ((w0 * (H4 - L4)) + L4) * -6.0;',
		'    fz += ((w1 * (H4 - L4)) + L4) * 0.0;',
		'    fz += ((w2 * (H4 - L4)) + L4) * 6.0;',
		'    ',
		'    fz += ((w0 * (H7 - L7)) + L7) * -3.0;',
		'    fz += ((w1 * (H7 - L7)) + L7) * 0.0;',
		'    fz += ((w2 * (H7 - L7)) + L7) * 3.0;',
		'    ',
		'    fz += ((w0 * (H2 - L2)) + L2) * -1.0;',
		'    fz += ((w1 * (H2 - L2)) + L2) * 0.0;',
		'    fz += ((w2 * (H2 - L2)) + L2) * 1.0;',
		'    ',
		'    fz += ((w0 * (H5 - L5)) + L5) * -3.0;',
		'    fz += ((w1 * (H5 - L5)) + L5) * 0.0;',
		'    fz += ((w2 * (H5 - L5)) + L5) * 3.0;',
		'    ',
		'    fz += ((w0 * (H8 - L8)) + L8) * -1.0;',
		'    fz += ((w1 * (H8 - L8)) + L8) * 0.0;',
		'    fz += ((w2 * (H8 - L8)) + L8) * 1.0;',
		'    vec3 n = vec3( fx/27.0 , fy/27.0 , fz/27.0 );',
		'    return n;',
		'}',
		'// returns intensity of reflected ambient lighting',
		'vec3 ambientLighting()',
		'{',
		'    const vec3 u_matAmbientReflectance = vec3(1.0, 1.0, 1.0);',
		'    const vec3 u_lightAmbientIntensity = vec3(0.6, 0.3, 0.0);',
		'    ',
		'    return u_matAmbientReflectance * u_lightAmbientIntensity;',
		'}',
		'// returns intensity of diffuse reflection',
		'vec3 diffuseLighting(in vec3 N, in vec3 L)',
		'{',
		'    const vec3 u_matDiffuseReflectance = vec3(1, 1, 1);',
		'    const vec3 u_lightDiffuseIntensity = vec3(1.0, 0.5, 0);',
		'    ',
		'    // calculation as for Lambertian reflection',
		'    float diffuseTerm = dot(N, L);',
		'    if (diffuseTerm > 1.0) {',
		'        diffuseTerm = 1.0;',
		'    } else if (diffuseTerm < 0.0) {',
		'        diffuseTerm = 0.0;',
		'    }',
		'    return u_matDiffuseReflectance * u_lightDiffuseIntensity * diffuseTerm;',
		'}',
		'// returns intensity of specular reflection',
		'vec3 specularLighting(in vec3 N, in vec3 L, in vec3 V)',
		'{',
		'    float specularTerm = 0.0;',
		'    const vec3 u_lightSpecularIntensity = vec3(0, 1, 0);',
		'    const vec3 u_matSpecularReflectance = vec3(1, 1, 1);',
		'    const float u_matShininess = 5.0;',
		'   // calculate specular reflection only if',
		'   // the surface is oriented to the light source',
		'   if(dot(N, L) > 0.0)',
		'   {',
		'      // half vector',
		'      vec3 H = normalize(L + V);',
		'      specularTerm = pow(dot(N, H), u_matShininess);',
		'   }',
		'   return u_matSpecularReflectance * u_lightSpecularIntensity * specularTerm;',
		'}',
		'void main(void)',
		'{',
		'    //const int uStepsI = 144;',
		'    //const float uStepsF = float(uStepsI);',
		'    int uStepsI = int(uSteps);',
		'    float uStepsF = uSteps;',
		'    ',
		'    ',
		'    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		'    vec4 backColor = texture2D(uBackCoord,texC); ',
		'    vec3 dir = backColor.rgb - frontColor.rgb; ',
		'    vec4 vpos = frontColor; ',
		'    vec3 Step = dir/uStepsF; ',
		'    vec4 accum = vec4(0, 0, 0, 0); ',
		'    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		'    vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		'    float opacityFactor = uOpacityVal; ',
		'  ',
		'    for(int i = 0; i < 8192; i++) {',
		'        if (i > uStepsI)',
		'            break;',
		'        vec3 gray_val = getVolumeValue(vpos.xyz); ',
		'        if(gray_val.z < 0.05 || ',
		'           gray_val.x < minSos ||',
		'           gray_val.x > maxSos)  ',
		'            colorValue = vec4(0.0);     ',
		'        else {',
		'            colorValue.x = (darkness * 2.0 - gray_val.x) * l * 0.4;',
		'            //colorValue.x = gray_val.x;',
		'            colorValue.w = 0.1;',
		'            if ( uSetViewMode == 1 ) {',
		'                // normalize vectors after interpolation',
		'                vec3 L = normalize(vpos.xyz - uLightPos);',
		'                vec3 V = normalize( cameraPosition - vpos.xyz );',
		'                vec3 N = normalize(getNormal(vpos.xyz));',
		'                // get Blinn-Phong reflectance components',
		'                vec3 Iamb = ambientLighting();',
		'                vec3 Idif = diffuseLighting(N, L);',
		'                vec3 Ispe = specularLighting(N, L, V);',
		'                // diffuse color of the object from texture',
		'                //vec3 diffuseColor = texture(u_diffuseTexture, o_texcoords).rgb;',
		'        ',
		'                vec3 mycolor = (Iamb + Idif + Ispe);',
		'                //vec3 mycolor = colorValue.xxx * (Iamb + Ispe);',
		'                sample.rgb = mycolor;',
		'                sample.a = 1.0;',
		'            } else {',
		'                sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a;',
		'                sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);',
		'            }',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'        }    ',
		'   ',
		'        //advance the current position ',
		'        vpos.xyz += Step;  ',
		'   ',
		'        if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'            break;  ',
		'    } ',
		'    gl_FragColor = accum; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassSoebelStevenTri = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"darkness" : { type: "f", value: -1 },
		"uSlicemapWidth" : { type: "f", value: -1 },
		"uLightPos" : { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
		"uSetViewMode" : { type: "i", value: 0 },
		"uSteps" : { type: "f", value: -1 },
		"minSos" : { type: "f", value: -1 },
		"maxSos" : { type: "f", value: -1 },
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
		'// This is an experimental shader to implement',
		'// blinn phong shading model.',
		'// In this example, I use the USCT breast model ',
		'// with a total of 144 slices as the dataset.',
		'// Hence the gradient operator is divided by 144 for ',
		'// a single unit. Uncomment line 271 to see the normals',
		'// calculated by the gradient operator function.',
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
		'uniform float uSlicemapWidth;',
		'uniform vec3 uLightPos;',
		'uniform int uSetViewMode;',
		'uniform float uSteps;',
		'uniform float minSos;',
		'uniform float maxSos;',
		'uniform float l; ',
		'uniform float s; ',
		'uniform float hMin; ',
		'uniform float hMax; ',
		'vec3 getTextureValue(int slicemapNo, vec2 texpos)',
		'{',
		'    float value = 0.0;',
		'    vec3 value_vec;',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( slicemapNo == <%=i%> )',
		'        {',
		'          value_vec = texture2D(uSliceMaps[<%=i%>],texpos).xyz;',
		'          //value = ((value_vec.r + value_vec.g + value_vec.b)/3.0);',
		'          //value = ((value_vec.r * 0.299)+(value_vec.g * 0.587)+(value_vec.b * 0.114));',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    ',
		'    return value_vec;',
		'}',
		'vec3 getValueTri(vec3 volpos)',
		'{',
		'    vec2 texpos1a, texpos1b, texpos1c, texpos1d, texpos2a, texpos2b, texpos2c, texpos2d;',
		'    vec3 value1a, value1b, value1c, value1d, value2a, value2b, value2c, value2d, valueS;',
		'    vec3 value1ab, value1cd, value1ac, value1bd, value2ab, value2cd, value2ac, value2bd, value1, value2;',
		'    float NOS = uNumberOfSlices;  //  abbreviation ',
		'    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY; ',
		'    float sliceSizeX = uSlicemapWidth/uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth/uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    ',
		'    //  Slice selection',
		'    float sliceNo1 = floor(abs(volpos.z*NOS-0.5));  //  sliceNo1 stands for lower slice',
		'    float sliceNo2 = NOS-1.0-floor(abs(NOS-0.5-volpos.z*NOS));  //  sliceNo2 stands for upper slice',
		'    int slicemapNo1 = int(floor(sliceNo1 / slicesPerSlicemap));',
		'    int slicemapNo2 = int(floor(sliceNo2 / slicesPerSlicemap));',
		'    float s1 = mod(sliceNo1, slicesPerSlicemap);  // s1 stands for the sliceNo of lower slice in this map',
		'    float dx1 = fract(s1/uSlicesOverX);',
		'    float dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    float s2 = mod(sliceNo2, slicesPerSlicemap);  // s2 stands for the sliceNo of upper slice in this map',
		'    float dx2 = fract(s2/uSlicesOverX);',
		'    float dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    /*',
		'    texpos1.x = dx1+volpos.x/uSlicesOverX;  // directly from texture2D',
		'    texpos1.y = dy1+volpos.y/uSlicesOverY;',
		'    texpos1.x = dx1+(floor(volpos.x*sliceSizeX)+0.5)/uSlicemapWidth;  //  NearestNeighbor in lower slice',
		'    texpos1.y = dy1+(floor(volpos.y*sliceSizeY)+0.5)/uSlicemapWidth;',
		'    */',
		'    ',
		'    // Four nearest pixels in lower slice',
		'    texpos1a.x = texpos1c.x = dx1+(floor(abs(volpos.x*sliceSizeX-0.5))+0.5)/uSlicemapWidth;  //  Trilinear',
		'    texpos1a.y = texpos1b.y = dy1+(floor(abs(volpos.y*sliceSizeY-0.5))+0.5)/uSlicemapWidth;',
		'    texpos1b.x = texpos1d.x = dx1+(sliceSizeX-1.0-floor(abs(sliceSizeX-0.5-volpos.x*sliceSizeX))+0.5)/uSlicemapWidth;',
		'    texpos1c.y = texpos1d.y = dy1+(sliceSizeY-1.0-floor(abs(sliceSizeY-0.5-volpos.y*sliceSizeY))+0.5)/uSlicemapWidth;',
		'    ',
		'    // Four nearest pixels in upper slice',
		'    texpos2a.x = texpos2c.x = dx2+(floor(abs(volpos.x*sliceSizeX-0.5))+0.5)/uSlicemapWidth;  //  Trilinear',
		'    texpos2a.y = texpos2b.y = dy2+(floor(abs(volpos.y*sliceSizeY-0.5))+0.5)/uSlicemapWidth;',
		'    texpos2b.x = texpos2d.x = dx2+(sliceSizeX-1.0-floor(abs(sliceSizeX-0.5-volpos.x*sliceSizeX))+0.5)/uSlicemapWidth;',
		'    texpos2c.y = texpos2d.y = dy2+(sliceSizeY-1.0-floor(abs(sliceSizeY-0.5-volpos.y*sliceSizeY))+0.5)/uSlicemapWidth;',
		'    // get texture values of these 8 pixels',
		'    value1a = getTextureValue(slicemapNo1, texpos1a);',
		'    value1b = getTextureValue(slicemapNo1, texpos1b);',
		'    value1c = getTextureValue(slicemapNo1, texpos1c);',
		'    value1d = getTextureValue(slicemapNo1, texpos1d);',
		'    value2a = getTextureValue(slicemapNo2, texpos2a);',
		'    value2b = getTextureValue(slicemapNo2, texpos2b);',
		'    value2c = getTextureValue(slicemapNo2, texpos2c);',
		'    value2d = getTextureValue(slicemapNo2, texpos2d);',
		'    ',
		'    // ratio calculation',
		'    float ratioX = volpos.x*sliceSizeX+0.5-floor(volpos.x*sliceSizeX+0.5);',
		'    float ratioY = volpos.y*sliceSizeY+0.5-floor(volpos.y*sliceSizeY+0.5);',
		'    float ratioZ = volpos.z*NOS+0.5-floor(volpos.z*NOS+0.5);',
		'    //float ratioZ = (volpos.z-(sliceNo1+0.5)/NOS) / (1.0/NOS);  // Another way to get ratioZ',
		'    ',
		'    //  Trilinear interpolation ',
		'    value1ab = value1a+ratioX*(value1b-value1a);',
		'    value1cd = value1c+ratioX*(value1d-value1c);',
		'    value1 = value1ab+ratioY*(value1cd-value1ab);',
		'    value2ab = value2a+ratioX*(value2b-value2a);',
		'    value2cd = value2c+ratioX*(value2d-value2c);',
		'    value2 = value2ab+ratioY*(value2cd-value2ab);',
		'    ',
		'    valueS = value1+ratioZ*(value2-value1);',
		'    ',
		'    ',
		'    // Do NO interpolation with empty voxels',
		'    float value1aAll = value1a.x+value1a.y+value1a.z;',
		'    float value1bAll = value1b.x+value1b.y+value1b.z;',
		'    float value1cAll = value1c.x+value1c.y+value1c.z;',
		'    float value1dAll = value1d.x+value1d.y+value1d.z;',
		'    float value2aAll = value2a.x+value2a.y+value2a.z;',
		'    float value2bAll = value2b.x+value2b.y+value2b.z;',
		'    float value2cAll = value2c.x+value2c.y+value2c.z;',
		'    float value2dAll = value2d.x+value2d.y+value2d.z;',
		'    ',
		'    if (value1aAll<=0.0 || value1bAll<=0.0 || value1cAll<=0.0 || value1dAll<=0.0 || value2aAll<=0.0 || value2bAll<=0.0 || value2cAll<=0.0 || value2dAll<=0.0)',
		'    {',
		'        if (value1aAll<=0.0 || value1cAll<=0.0 || value2aAll<=0.0 || value2cAll<=0.0)',
		'        {    ',
		'            value1ab = value1b;',
		'            value1cd = value1d;',
		'            value2ab = value2b;',
		'            value2cd = value2d;',
		'            ',
		'            if (value1bAll<=0.0 || value2bAll<=0.0)',
		'            {',
		'                value1 = value1d;',
		'                value2 = value2d;',
		'                ',
		'                if (value1dAll <= 0.0)',
		'                    valueS = value2;',
		'                else if (value2dAll <= 0.0)',
		'                    valueS = value1;',
		'                else',
		'                    valueS = value1+ratioZ*(value2-value1);',
		'            }',
		'            ',
		'            else if (value1dAll<=0.0 || value2dAll<=0.0)',
		'            {',
		'                value1 = value1b;',
		'                value2 = value2b;',
		'                valueS = value1+ratioZ*(value2-value1);',
		'            }',
		'            ',
		'            else',
		'            {',
		'                value1 = value1ab+ratioY*(value1cd-value1ab);',
		'                value2 = value2ab+ratioY*(value2cd-value2ab);',
		'                valueS = value1+ratioZ*(value2-value1);',
		'            }',
		'        }',
		'    ',
		'    ',
		'        else',
		'        {  // if (value1b<=0.0 || value1d<=0.0 || value2b<=0.0 || value2d<=0.0)',
		'            value1ab = value1a;',
		'            value1cd = value1c;',
		'            value2ab = value2a;',
		'            value2cd = value2c;',
		'            ',
		'            value1 = value1ab+ratioY*(value1cd-value1ab);',
		'            value2 = value2ab+ratioY*(value2cd-value2ab);',
		'            valueS = value1+ratioZ*(value2-value1);',
		'        }',
		'    ',
		'    }',
		'    ',
		'    ',
		'    /*',
		'    if (value1a<=0.0 || value1b<=0.0 || value1c<=0.0 || value1d<=0.0 || value2a<=0.0 || value2b<=0.0 || value2c<=0.0 || value2d<=0.0)',
		'        valueS = 0.0;',
		'    */',
		'    ',
		'    return valueS;',
		'}',
		'// Compute the Normal around the current voxel',
		'vec3 getNormal(vec3 at)',
		'{',
		'    vec2 texpos1,texpos2;',
		'    float NOS = uNumberOfSlices;  //  abbreviation ',
		'    float NOS_factor=100.0;',
		'    float shift = (1.0/uNumberOfSlices) * NOS_factor;',
		'    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY; ',
		'    float sliceSizeX = uSlicemapWidth/uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth/uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    ',
		'    //  Slice selection',
		'    float sliceNo1 = floor(abs(at.z*NOS-0.5));  //  sliceNo1 stands for lower slice',
		'    float sliceNo2 = NOS-1.0-floor(abs(NOS-0.5-at.z*NOS));  //  sliceNo2 stands for upper slice',
		'    int slicemapNo1 = int(floor(sliceNo1 / slicesPerSlicemap));',
		'    int slicemapNo2 = int(floor(sliceNo2 / slicesPerSlicemap));',
		'    float s1 = mod(sliceNo1, slicesPerSlicemap);  // s1 stands for the sliceNo of lower slice in this map',
		'    float dx1 = fract(s1/uSlicesOverX);',
		'    float dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    float s2 = mod(sliceNo2, slicesPerSlicemap);  // s2 stands for the sliceNo of upper slice in this map',
		'    float dx2 = fract(s2/uSlicesOverX);',
		'    float dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;',
		'    float w1 = at.z - floor(at.z);',
		'    float w0 = (at.z - shift) - floor(at.z);',
		'    float w2 = (at.z + shift) - floor(at.z);',
		'    ',
		'    ',
		'    float fx, fy, fz;',
		'    ',
		'    float L0, L1, L2, L3, L4, L5, L6, L7, L8;',
		'    float H0, H1, H2, H3, H4, H5, H6, H7, H8;',
		'    /*',
		'    // version 1, directly from texel',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( slicemapNo1 == <%=i%> )',
		'        {',
		'            texpos1.x = dx1+((at.x - shift)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y + shift)/uSlicesOverY);',
		'            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx1+((at.x)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y + shift)/uSlicesOverY);',
		'            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x + shift)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y + shift)/uSlicesOverY);',
		'            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x - shift)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y)/uSlicesOverY);',
		'            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx1+((at.x)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y)/uSlicesOverY);',
		'            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x + shift)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y)/uSlicesOverY);',
		'            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x - shift)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y - shift)/uSlicesOverY);',
		'            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx1+((at.x)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y - shift)/uSlicesOverY);',
		'            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+((at.x + shift)/uSlicesOverX);',
		'            texpos1.y = dy1+((at.y - shift)/uSlicesOverY);',
		'            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        }',
		'        if( slicemapNo2 == <%=i%> ) {',
		'            texpos1.x = dx2+((at.x - shift)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y + shift)/uSlicesOverY);',
		'            H0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx2+((at.x)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y + shift)/uSlicesOverY);',
		'            H1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x + shift)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y + shift)/uSlicesOverY);',
		'            H2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x - shift)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y)/uSlicesOverY);',
		'            H3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx2+((at.x)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y)/uSlicesOverY);',
		'            H4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x + shift)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y)/uSlicesOverY);',
		'            H5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x - shift)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y - shift)/uSlicesOverY);',
		'            H6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        ',
		'            texpos1.x = dx2+((at.x)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y - shift)/uSlicesOverY);',
		'            H7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+((at.x + shift)/uSlicesOverX);',
		'            texpos1.y = dy2+((at.y - shift)/uSlicesOverY);',
		'            H8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        }',
		'    <% } %>',
		'    */',
		'    ',
		'    // version 2, move the point to pixel central    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( slicemapNo1 == <%=i%> )',
		'        {',
		'            texpos1.x = dx1+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy1+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy1+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy1+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy1+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy1+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy1+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy1+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy1+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx1+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy1+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        }',
		'        if( slicemapNo2 == <%=i%> ) {',
		'            texpos1.x = dx2+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy2+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy2+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy2+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy2+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy2+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy2+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy2+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy2+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'            ',
		'            texpos1.x = dx2+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;',
		'            texpos1.y = dy2+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;',
		'            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;',
		'        }',
		'    <% } %>',
		'    ',
		'    // we need to get interpolation of 2 x points',
		'    // x direction',
		'    // -1 -3 -1   0  0  0   1  3  1',
		'    // -3 -6 -3   0  0  0   3  6  3',
		'    // -1 -3 -1   0  0  0   1  3  1',
		'    // y direction',
		'    //  1  3  1   3  6  3   1  3  1',
		'    //  0  0  0   0  0  0   0  0  0',
		'    // -1 -3 -1  -3 -6 -3  -1 -3 -1',
		'    // z direction',
		'    // -1  0  1   -3  0  3   -1  0  1',
		'    // -3  0  3   -6  0  6   -3  0  3',
		'    // -1  0  1   -3  0  3   -1  0  1',
		'    ',
		'    fx =  ((w0 * (H0 - L0)) + L0) * -1.0;',
		'    fx += ((w1 * (H0 - L0)) + L0) * -3.0;',
		'    fx += ((w2 * (H0 - L0)) + L0) * -1.0;',
		'    ',
		'    fx += ((w0 * (H3 - L3)) + L3) * -3.0;',
		'    fx += ((w1 * (H3 - L3)) + L3) * -6.0;',
		'    fx += ((w2 * (H3 - L3)) + L3) * -3.0;',
		'    ',
		'    fx += ((w0 * (H6 - L6)) + L6) * -1.0;',
		'    fx += ((w1 * (H6 - L6)) + L6) * -3.0;',
		'    fx += ((w2 * (H6 - L6)) + L6) * -1.0;',
		'    ',
		'    fx += ((w0 * (H1 - L1)) + L1) * 0.0;',
		'    fx += ((w1 * (H1 - L1)) + L1) * 0.0;',
		'    fx += ((w2 * (H1 - L1)) + L1) * 0.0;',
		'    ',
		'    fx += ((w0 * (H4 - L4)) + L4) * 0.0;',
		'    fx += ((w1 * (H4 - L4)) + L4) * 0.0;',
		'    fx += ((w2 * (H4 - L4)) + L4) * 0.0;',
		'    ',
		'    fx += ((w0 * (H7 - L7)) + L7) * 0.0;',
		'    fx += ((w1 * (H7 - L7)) + L7) * 0.0;',
		'    fx += ((w2 * (H7 - L7)) + L7) * 0.0;',
		'    ',
		'    fx += ((w0 * (H2 - L2)) + L2) * 1.0;',
		'    fx += ((w1 * (H2 - L2)) + L2) * 3.0;',
		'    fx += ((w2 * (H2 - L2)) + L2) * 1.0;',
		'    ',
		'    fx += ((w0 * (H5 - L5)) + L5) * 3.0;',
		'    fx += ((w1 * (H5 - L5)) + L5) * 6.0;',
		'    fx += ((w2 * (H5 - L5)) + L5) * 3.0;',
		'    ',
		'    fx += ((w0 * (H8 - L8)) + L8) * 1.0;',
		'    fx += ((w1 * (H8 - L8)) + L8) * 3.0;',
		'    fx += ((w2 * (H8 - L8)) + L8) * 1.0;',
		'    ',
		'    ',
		'    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;',
		'    fy += ((w1 * (H0 - L0)) + L0) * 3.0;',
		'    fy += ((w2 * (H0 - L0)) + L0) * 1.0;',
		'    ',
		'    fy += ((w0 * (H3 - L3)) + L3) * 0.0;',
		'    fy += ((w1 * (H3 - L3)) + L3) * 0.0;',
		'    fy += ((w2 * (H3 - L3)) + L3) * 0.0;',
		'    ',
		'    fy += ((w0 * (H6 - L6)) + L6) * -1.0;',
		'    fy += ((w1 * (H6 - L6)) + L6) * -3.0;',
		'    fy += ((w2 * (H6 - L6)) + L6) * -1.0;',
		'    ',
		'    fy += ((w0 * (H1 - L1)) + L1) * 3.0;',
		'    fy += ((w1 * (H1 - L1)) + L1) * 6.0;',
		'    fy += ((w2 * (H1 - L1)) + L1) * 3.0;',
		'    ',
		'    fy += ((w0 * (H4 - L4)) + L4) * 0.0;',
		'    fy += ((w1 * (H4 - L4)) + L4) * 0.0;',
		'    fy += ((w2 * (H4 - L4)) + L4) * 0.0;',
		'    ',
		'    fy += ((w0 * (H7 - L7)) + L7) * -3.0;',
		'    fy += ((w1 * (H7 - L7)) + L7) * -6.0;',
		'    fy += ((w2 * (H7 - L7)) + L7) * -3.0;',
		'    ',
		'    fy += ((w0 * (H2 - L2)) + L2) * 1.0;',
		'    fy += ((w1 * (H2 - L2)) + L2) * 3.0;',
		'    fy += ((w2 * (H2 - L2)) + L2) * 1.0;',
		'    ',
		'    fy += ((w0 * (H5 - L5)) + L5) * 0.0;',
		'    fy += ((w1 * (H5 - L5)) + L5) * 0.0;',
		'    fy += ((w2 * (H5 - L5)) + L5) * 0.0;',
		'    ',
		'    fy += ((w0 * (H8 - L8)) + L8) * -1.0;',
		'    fy += ((w1 * (H8 - L8)) + L8) * -3.0;',
		'    fy += ((w2 * (H8 - L8)) + L8) * -1.0;',
		'    ',
		'    fz =  ((w0 * (H0 - L0)) + L0) * -1.0;',
		'    fz += ((w1 * (H0 - L0)) + L0) * 0.0;',
		'    fz += ((w2 * (H0 - L0)) + L0) * 1.0;',
		'    ',
		'    fz += ((w0 * (H3 - L3)) + L3) * -3.0;',
		'    fz += ((w1 * (H3 - L3)) + L3) * 0.0;',
		'    fz += ((w2 * (H3 - L3)) + L3) * 3.0;',
		'    ',
		'    fz += ((w0 * (H6 - L6)) + L6) * -1.0;',
		'    fz += ((w1 * (H6 - L6)) + L6) * 0.0;',
		'    fz += ((w2 * (H6 - L6)) + L6) * 1.0;',
		'    ',
		'    fz += ((w0 * (H1 - L1)) + L1) * -3.0;',
		'    fz += ((w1 * (H1 - L1)) + L1) * 0.0;',
		'    fz += ((w2 * (H1 - L1)) + L1) * 3.0;',
		'    ',
		'    fz += ((w0 * (H4 - L4)) + L4) * -6.0;',
		'    fz += ((w1 * (H4 - L4)) + L4) * 0.0;',
		'    fz += ((w2 * (H4 - L4)) + L4) * 6.0;',
		'    ',
		'    fz += ((w0 * (H7 - L7)) + L7) * -3.0;',
		'    fz += ((w1 * (H7 - L7)) + L7) * 0.0;',
		'    fz += ((w2 * (H7 - L7)) + L7) * 3.0;',
		'    ',
		'    fz += ((w0 * (H2 - L2)) + L2) * -1.0;',
		'    fz += ((w1 * (H2 - L2)) + L2) * 0.0;',
		'    fz += ((w2 * (H2 - L2)) + L2) * 1.0;',
		'    ',
		'    fz += ((w0 * (H5 - L5)) + L5) * -3.0;',
		'    fz += ((w1 * (H5 - L5)) + L5) * 0.0;',
		'    fz += ((w2 * (H5 - L5)) + L5) * 3.0;',
		'    ',
		'    fz += ((w0 * (H8 - L8)) + L8) * -1.0;',
		'    fz += ((w1 * (H8 - L8)) + L8) * 0.0;',
		'    fz += ((w2 * (H8 - L8)) + L8) * 1.0;',
		'    vec3 n = vec3( fx/27.0 , fy/27.0 , fz/27.0 );',
		'    return n;',
		'}',
		'// returns intensity of reflected ambient lighting',
		'vec3 ambientLighting()',
		'{',
		'    const vec3 u_matAmbientReflectance = vec3(1.0, 1.0, 1.0);',
		'    const vec3 u_lightAmbientIntensity = vec3(0.6, 0.3, 0.0);',
		'    ',
		'    return u_matAmbientReflectance * u_lightAmbientIntensity;',
		'}',
		'// returns intensity of diffuse reflection',
		'vec3 diffuseLighting(in vec3 N, in vec3 L)',
		'{',
		'    const vec3 u_matDiffuseReflectance = vec3(1, 1, 1);',
		'    const vec3 u_lightDiffuseIntensity = vec3(1.0, 0.5, 0);',
		'    ',
		'    // calculation as for Lambertian reflection',
		'    float diffuseTerm = dot(N, L);',
		'    if (diffuseTerm > 1.0) {',
		'        diffuseTerm = 1.0;',
		'    } else if (diffuseTerm < 0.0) {',
		'        diffuseTerm = 0.0;',
		'    }',
		'    return u_matDiffuseReflectance * u_lightDiffuseIntensity * diffuseTerm;',
		'}',
		'// returns intensity of specular reflection',
		'vec3 specularLighting(in vec3 N, in vec3 L, in vec3 V)',
		'{',
		'    float specularTerm = 0.0;',
		'    const vec3 u_lightSpecularIntensity = vec3(0, 1, 0); //0,1,0',
		'    const vec3 u_matSpecularReflectance = vec3(1, 1, 1);',
		'    const float u_matShininess = 5.0;',
		'   // calculate specular reflection only if',
		'   // the surface is oriented to the light source',
		'   if(dot(N, L) > 0.0)',
		'   {',
		'      // half vector',
		'      vec3 H = normalize(L + V);',
		'      specularTerm = pow(dot(N, H), u_matShininess);',
		'   }',
		'   return u_matSpecularReflectance * u_lightSpecularIntensity * specularTerm;',
		'}',
		'void main(void)',
		'{',
		'    //const int uStepsI = 144;',
		'    //const float uStepsF = float(uStepsI);',
		'    int uStepsI = int(uSteps);',
		'    float uStepsF = uSteps;',
		'    ',
		'    ',
		'    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; ',
		'    vec4 backColor = texture2D(uBackCoord,texC); ',
		'    vec3 dir = backColor.rgb - frontColor.rgb; ',
		'    vec4 vpos = frontColor; ',
		'    vec3 Step = dir/uStepsF; ',
		'    vec4 accum = vec4(0, 0, 0, 0); ',
		'    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); ',
		'    vec4 colorValue = vec4(0, 0, 0, 0); ',
		'    ',
		'    float opacityFactor = uOpacityVal; ',
		'    ',
		'    vec4 test = vec4(0.0, 0.0, 0.0, 0.0); ',
		'  ',
		'    for(int i = 0; i < 8192; i++) {',
		'        if (i > uStepsI)',
		'            break;',
		'        vec3 gray_val = getValueTri(vpos.xyz); ',
		'        if(gray_val.z < 0.05 || ',
		'           gray_val.x < minSos ||',
		'           gray_val.x > maxSos)  ',
		'            colorValue = vec4(0.0);     ',
		'        else {',
		'            //colorValue.x = (darkness * 2.0 - gray_val.x) * l * 0.4;',
		'            colorValue.x = gray_val.x * darkness;',
		'            colorValue.w = 0.1;',
		'            if ( uSetViewMode == 1 ) {',
		'                ',
		'                // ISO surface rendering mode',
		'                // normalize vectors after interpolation',
		'                vec3 L = normalize(vpos.xyz - uLightPos);',
		'                vec3 V = normalize( cameraPosition - vpos.xyz );',
		'                vec3 N = normalize(getNormal(vpos.xyz));',
		'                // get Blinn-Phong reflectance components',
		'                vec3 Iamb = ambientLighting();',
		'                vec3 Idif = diffuseLighting(N, L);',
		'                vec3 Ispe = specularLighting(N, L, V);',
		'                // diffuse color of the object from texture',
		'                //vec3 diffuseColor = texture(u_diffuseTexture, o_texcoords).rgb;',
		'        ',
		'                vec3 mycolor = (Iamb + Idif + Ispe);',
		'                //vec3 mycolor = colorValue.xxx * (Iamb + Ispe);',
		'                ',
		'                //sample.rgb = mycolor;',
		'                //sample.a = 1.0;',
		'                ',
		'                //test.rgb = abs(N.rgb); ',
		'                //test.a = 1.0;',
		'                ',
		'                sample.rgb = abs(N.rgb); ',
		'                sample.a = 1.0;',
		'                ',
		'                ',
		'                /*',
		'                // surface rendering mode',
		'                sample.rgb =gray_val;',
		'                sample.a = 1.0;',
		'                */',
		'                ',
		'            } else {',
		'                sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a;',
		'                sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);',
		'            }',
		'            accum += sample; ',
		'            if(accum.a>=1.0) ',
		'               break; ',
		'        }    ',
		'   ',
		'        //advance the current position ',
		'        vpos.xyz += Step;  ',
		'   ',
		'        if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      ',
		'            break;  ',
		'    } ',
		'    ',
		'    gl_FragColor = accum;',
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
window.VRC.Core.prototype._shaders.secondPassStevenNN = {
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
		'    float value1 = 0.0;',
		'    vec2 texpos1;',
		'    vec3 value1_vec;',
		'    ',
		'    float eps =pow(2.0,-16.0);',
		'    if (volpos.x >= 1.0)',
		'        volpos.x = 1.0-eps;',
		'    if (volpos.y >= 1.0)',
		'        volpos.y = 1.0-eps;',
		'    if (volpos.z >= 1.0)',
		'        volpos.z = 1.0-eps;',
		'    ',
		'    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY; ',
		'    float sliceNo = floor(volpos.z*(uNumberOfSlices));',
		'    ',
		'    int texIndexOfSlicemap = int(floor(sliceNo / slicesPerSlicemap));',
		'    float s1 = mod(sliceNo, slicesPerSlicemap);',
		'    float dx1 = fract(s1/uSlicesOverX);',
		'    float dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;      ',
		'       ',
		'    float sliceSizeX = uSlicemapWidth/uSlicesOverX;',
		'    float sliceSizeY = uSlicemapWidth/uSlicesOverY;',
		'    ',
		'    texpos1.x = dx1+(floor(volpos.x*sliceSizeX)+0.5)/uSlicemapWidth;',
		'    texpos1.y = dy1+(floor(volpos.y*sliceSizeY)+0.5)/uSlicemapWidth;',
		' ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( texIndexOfSlicemap == <%=i%> )',
		'        {',
		'          value1_vec = texture2D(uSliceMaps[<%=i%>],texpos1).rgb;',
		'          //value1 = ((value1_vec.r + value1_vec.g + value1_vec.b)/3.0);',
		'          value1 = ((value1_vec.r * 0.299)+(value1_vec.g * 0.587)+(value1_vec.b * 0.114));',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    ',
		'    return value1;',
		'}',
		'void main(void)',
		'{',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;',
		' vec4 backColor = texture2D(uBackCoord,texC);',
		' vec3 dir = backColor.rgb - frontColor.rgb;',
		' vec4 vpos = frontColor;',
		' ',
		' ',
		' float dir_length = length(dir);',
		' float uStepsF = ceil((dir_length)*(uNumberOfSlices-1.0));',
		' vec3 Step = dir/(uStepsF);',
		' int uStepsI = int(uStepsF);',
		' ',
		' vec4 accum = vec4(0, 0, 0, 0);',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);',
		' vec4 colorValue = vec4(0, 0, 0, 0);',
		' float biggest_gray_value = 0.0;',
		' float opacityFactor = uOpacityVal;',
		' float lightFactor = uColorVal;',
		' ',
		' ',
		' ',
		' // Empty Skipping',
		' for(int i = 0; i < 4096; i+=1)',
		' {',
		'     if(i == uStepsI) ',
		'         break;',
		' ',
		'     float gray_val = getVolumeValue(vpos.xyz);',
		'   ',
		'     if(gray_val <= uMinGrayVal || gray_val >= uMaxGrayVal) ',
		'         uStepsF -= 1.0;',
		'     ',
		'     vpos.xyz += Step;',
		'     ',
		'     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) ',
		'         break; ',
		' }',
		' vpos = frontColor;',
		' ',
		' ',
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
		'           //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'           tf_pos.x = gray_val;',
		'           tf_pos.y = 0.5;',
		'           colorValue = texture2D(uTransferFunction,tf_pos);',
		'           //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'           sample.a = 1.0; ',
		'           //sample.a = colorValue.a * opacityFactor;',
		'           sample.rgb = colorValue.rgb * uColorVal;',
		'           accum += sample;',
		'           if(accum.a>=1.0)',
		'              break;',
		'         }',
		'         /*',
		'         // Guevens mode',
		'         if(uAbsorptionModeIndex == 1.0)',
		'         {',
		'           vec2 tf_pos;',
		'           ',
		'           //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
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
		'           sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * uColorVal; ',
		'           //sample.rgb =  colorValue.rgb * sample.a;',
		'           accum += sample;',
		'           if(accum.a>=1.0)',
		'              break;',
		'         }*/',
		'         ',
		'         ',
		'         ',
		'         // Stevens mode',
		'         if(uAbsorptionModeIndex == 1.0) ',
		'         { ',
		'             vec2 tf_pos; ',
		'             //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal); ',
		'             tf_pos.x = gray_val;',
		'             tf_pos.y = 0.5; ',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0); ',
		'             sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'             sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * uColorVal; ',
		'             accum += sample; ',
		'             if(accum.a>=1.0) ',
		'                break; ',
		'                ',
		'         }',
		'         ',
		'         ',
		'         if(uAbsorptionModeIndex == 2.0)',
		'         {',
		'             vec2 tf_pos;',
		'             //tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'             tf_pos.x = biggest_gray_value;',
		'             tf_pos.y = 0.5;',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'             sample.a = 1.0; //colorValue.a * opacityFactor;',
		'             sample.rgb = colorValue.rgb * uColorVal;',
		'             accum = sample;',
		'         }',
		'     }',
		'     //advance the current position',
		'     vpos.xyz += Step;',
		'     ',
		'     //break if the position is greater than <1, 1, 1> ',
		'     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) ',
		'     { ',
		'         break; ',
		'     } ',
		'     ',
		' }',
		' gl_FragColor = accum;',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassStevenTri = {
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
		'float getTextureValue(int slicemapNo, vec2 texpos)',
		'{',
		'    float value = 0.0;',
		'    vec3 value_vec;',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( slicemapNo == <%=i%> )',
		'        {',
		'          value_vec = texture2D(uSliceMaps[<%=i%>],texpos).rgb;',
		'          //value = ((value_vec.r + value_vec.g + value_vec.b)/3.0);',
		'          value = ((value_vec.r * 0.299)+(value_vec.g * 0.587)+(value_vec.b * 0.114));',
		'        }',
		'        <% if( i < maxTexturesNumber-1 ) { %>',
		'            else',
		'        <% } %>',
		'    <% } %>',
		'    ',
		'    return value;',
		'}',
		'float getValueTri(vec3 volpos)',
		'{',
		'    vec2 texpos1a, texpos1b, texpos1c, texpos1d, texpos2a, texpos2b, texpos2c, texpos2d;',
		'    float value1a, value1b, value1c, value1d, value2a, value2b, value2c, value2d, valueS;',
		'    float value1ab, value1cd, value1ac, value1bd, value2ab, value2cd, value2ac, value2bd, value1, value2;',
		'    float NOS = uNumberOfSlices;  //  abbreviation ',
		'    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY; ',
		'    float sliceSizeX = uSlicemapWidth/uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth/uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    ',
		'    //  Slice selection',
		'    float sliceNo1 = floor(abs(volpos.z*NOS-0.5));  //  sliceNo1 stands for lower slice',
		'    float sliceNo2 = NOS-1.0-floor(abs(NOS-0.5-volpos.z*NOS));  //  sliceNo2 stands for upper slice',
		'    int slicemapNo1 = int(floor(sliceNo1 / slicesPerSlicemap));',
		'    int slicemapNo2 = int(floor(sliceNo2 / slicesPerSlicemap));',
		'    float s1 = mod(sliceNo1, slicesPerSlicemap);  // s1 stands for the sliceNo of lower slice in this map',
		'    float dx1 = fract(s1/uSlicesOverX);',
		'    float dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    float s2 = mod(sliceNo2, slicesPerSlicemap);  // s2 stands for the sliceNo of upper slice in this map',
		'    float dx2 = fract(s2/uSlicesOverX);',
		'    float dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    /*',
		'    texpos1.x = dx1+volpos.x/uSlicesOverX;  // directly from texture2D',
		'    texpos1.y = dy1+volpos.y/uSlicesOverY;',
		'    texpos1.x = dx1+(floor(volpos.x*sliceSizeX)+0.5)/uSlicemapWidth;  //  NearestNeighbor in lower slice',
		'    texpos1.y = dy1+(floor(volpos.y*sliceSizeY)+0.5)/uSlicemapWidth;',
		'    */',
		'    ',
		'    // Four nearest pixels in lower slice',
		'    texpos1a.x = texpos1c.x = dx1+(floor(abs(volpos.x*sliceSizeX-0.5))+0.5)/uSlicemapWidth;  //  Trilinear',
		'    texpos1a.y = texpos1b.y = dy1+(floor(abs(volpos.y*sliceSizeY-0.5))+0.5)/uSlicemapWidth;',
		'    texpos1b.x = texpos1d.x = dx1+(sliceSizeX-1.0-floor(abs(sliceSizeX-0.5-volpos.x*sliceSizeX))+0.5)/uSlicemapWidth;',
		'    texpos1c.y = texpos1d.y = dy1+(sliceSizeY-1.0-floor(abs(sliceSizeY-0.5-volpos.y*sliceSizeY))+0.5)/uSlicemapWidth;',
		'    ',
		'    // Four nearest pixels in upper slice',
		'    texpos2a.x = texpos2c.x = dx2+(floor(abs(volpos.x*sliceSizeX-0.5))+0.5)/uSlicemapWidth;  //  Trilinear',
		'    texpos2a.y = texpos2b.y = dy2+(floor(abs(volpos.y*sliceSizeY-0.5))+0.5)/uSlicemapWidth;',
		'    texpos2b.x = texpos2d.x = dx2+(sliceSizeX-1.0-floor(abs(sliceSizeX-0.5-volpos.x*sliceSizeX))+0.5)/uSlicemapWidth;',
		'    texpos2c.y = texpos2d.y = dy2+(sliceSizeY-1.0-floor(abs(sliceSizeY-0.5-volpos.y*sliceSizeY))+0.5)/uSlicemapWidth;',
		'    // get texture values of these 8 pixels',
		'    value1a = getTextureValue(slicemapNo1, texpos1a);',
		'    value1b = getTextureValue(slicemapNo1, texpos1b);',
		'    value1c = getTextureValue(slicemapNo1, texpos1c);',
		'    value1d = getTextureValue(slicemapNo1, texpos1d);',
		'    value2a = getTextureValue(slicemapNo2, texpos2a);',
		'    value2b = getTextureValue(slicemapNo2, texpos2b);',
		'    value2c = getTextureValue(slicemapNo2, texpos2c);',
		'    value2d = getTextureValue(slicemapNo2, texpos2d);',
		'    ',
		'    // ratio calculation',
		'    float ratioX = volpos.x*sliceSizeX+0.5-floor(volpos.x*sliceSizeX+0.5);',
		'    float ratioY = volpos.y*sliceSizeY+0.5-floor(volpos.y*sliceSizeY+0.5);',
		'    float ratioZ = volpos.z*NOS+0.5-floor(volpos.z*NOS+0.5);',
		'    //float ratioZ = (volpos.z-(sliceNo1+0.5)/NOS) / (1.0/NOS);  // Another way to get ratioZ',
		'    ',
		'    ',
		'    //  Trilinear interpolation ',
		'    value1ab = value1a+ratioX*(value1b-value1a);',
		'    value1cd = value1c+ratioX*(value1d-value1c);',
		'    value1 = value1ab+ratioY*(value1cd-value1ab);',
		'    value2ab = value2a+ratioX*(value2b-value2a);',
		'    value2cd = value2c+ratioX*(value2d-value2c);',
		'    value2 = value2ab+ratioY*(value2cd-value2ab);',
		'    ',
		'    valueS = value1+ratioZ*(value2-value1);',
		'    ',
		'    ',
		'    // Do NO interpolation with empty voxels',
		'    if (value1a<=0.0 || value1b<=0.0 || value1c<=0.0 || value1d<=0.0 || value2a<=0.0 || value2b<=0.0 || value2c<=0.0 || value2d<=0.0)',
		'    {',
		'        if (value1a<=0.0 || value1c<=0.0 || value2a<=0.0 || value2c<=0.0)',
		'        {    ',
		'            value1ab = value1b;',
		'            value1cd = value1d;',
		'            value2ab = value2b;',
		'            value2cd = value2d;',
		'            ',
		'            if (value1b<=0.0 || value2b<=0.0)',
		'            {',
		'                value1 = value1d;',
		'                value2 = value2d;',
		'                ',
		'                if (value1d <= 0.0)',
		'                    valueS = value2;',
		'                else if (value2d <= 0.0)',
		'                    valueS = value1;',
		'                else',
		'                    valueS = value1+ratioZ*(value2-value1);',
		'            }',
		'            ',
		'            else if (value1d<=0.0 || value2d<=0.0)',
		'            {',
		'                value1 = value1b;',
		'                value2 = value2b;',
		'                valueS = value1+ratioZ*(value2-value1);',
		'            }',
		'            ',
		'            else',
		'            {',
		'                value1 = value1ab+ratioY*(value1cd-value1ab);',
		'                value2 = value2ab+ratioY*(value2cd-value2ab);',
		'                valueS = value1+ratioZ*(value2-value1);',
		'            }',
		'        }',
		'    ',
		'    ',
		'        else',
		'        {  // if (value1b<=0.0 || value1d<=0.0 || value2b<=0.0 || value2d<=0.0)',
		'            value1ab = value1a;',
		'            value1cd = value1c;',
		'            value2ab = value2a;',
		'            value2cd = value2c;',
		'            ',
		'            value1 = value1ab+ratioY*(value1cd-value1ab);',
		'            value2 = value2ab+ratioY*(value2cd-value2ab);',
		'            valueS = value1+ratioZ*(value2-value1);',
		'        }',
		'    ',
		'    }',
		'    ',
		'    ',
		'    /*',
		'    if (value1a<=0.0 || value1b<=0.0 || value1c<=0.0 || value1d<=0.0 || value2a<=0.0 || value2b<=0.0 || value2c<=0.0 || value2d<=0.0)',
		'        valueS = 0.0;',
		'    */',
		'    ',
		'    return valueS;',
		'}',
		'void main(void)',
		'{',
		' vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;',
		' vec4 backColor = texture2D(uBackCoord,texC);',
		' vec3 dir = backColor.rgb - frontColor.rgb;',
		' vec4 vpos = frontColor;',
		' ',
		' ',
		' float dir_length = length(dir);',
		' float uStepsF = ceil((dir_length)*(uNumberOfSlices-1.0));',
		' vec3 Step = dir/(uStepsF);',
		' int uStepsI = int(uStepsF);',
		' ',
		' vec4 accum = vec4(0, 0, 0, 0);',
		' vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);',
		' vec4 colorValue = vec4(0, 0, 0, 0);',
		' float biggest_gray_value = 0.0;',
		' float opacityFactor = uOpacityVal;',
		' float lightFactor = uColorVal;',
		' ',
		' ',
		' ',
		' // Empty Skipping',
		' for(int i = 0; i < 4096; i+=1)',
		' {',
		'     if(i == uStepsI) ',
		'         break;',
		' ',
		'     float gray_val = getValueTri(vpos.xyz);',
		'   ',
		'     if(gray_val <= uMinGrayVal || gray_val >= uMaxGrayVal) ',
		'         uStepsF -= 1.0;',
		'     ',
		'     vpos.xyz += Step;',
		'     ',
		'     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) ',
		'         break; ',
		' }',
		' vpos = frontColor;',
		' ',
		' ',
		' ',
		' for(int i = 0; i < 4096; i+=1)',
		' {',
		'     if(i == uStepsI)',
		'         break;',
		'     float gray_val = getValueTri(vpos.xyz);',
		'     if(gray_val < uMinGrayVal || gray_val > uMaxGrayVal) ',
		'     {',
		'         colorValue = vec4(0.0);',
		'         accum=accum+colorValue;',
		'         if(accum.a>=1.0)',
		'            break;',
		'     } ',
		'     else ',
		'     {',
		'         if(biggest_gray_value < gray_val) ',
		'            biggest_gray_value = gray_val;',
		'         if(uAbsorptionModeIndex == 0.0)',
		'         {',
		'           vec2 tf_pos;',
		'           //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'           tf_pos.x = gray_val;',
		'           tf_pos.y = 0.5;',
		'           colorValue = texture2D(uTransferFunction,tf_pos);',
		'           //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'           sample.a = 1.0; ',
		'           //sample.a = colorValue.a * opacityFactor;',
		'           sample.rgb = colorValue.rgb * lightFactor;',
		'           accum += sample;',
		'           if(accum.a>=1.0)',
		'              break;',
		'         }',
		'         ',
		'         /*',
		'         // Guevens mode',
		'         if(uAbsorptionModeIndex == 1.0)',
		'         {',
		'           vec2 tf_pos;',
		'           ',
		'           //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
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
		'           sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * lightFactor; ',
		'           //sample.rgb =  colorValue.rgb * sample.a;',
		'           accum += sample;',
		'           if(accum.a>=1.0)',
		'              break;',
		'         }*/',
		'         ',
		'         ',
		'         // Stevens mode',
		'         if(uAbsorptionModeIndex == 1.0) ',
		'         { ',
		'             vec2 tf_pos; ',
		'             //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal); ',
		'             tf_pos.x = gray_val;',
		'             tf_pos.y = 0.5; ',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0); ',
		'             sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); ',
		'             sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * lightFactor; ',
		'             accum += sample; ',
		'             if(accum.a>=1.0) ',
		'                break; ',
		'                ',
		'         }',
		'         ',
		'         ',
		'         if(uAbsorptionModeIndex == 2.0)',
		'         {',
		'             vec2 tf_pos;',
		'             //tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);',
		'             tf_pos.x = biggest_gray_value;',
		'             tf_pos.y = 0.5;',
		'             colorValue = texture2D(uTransferFunction,tf_pos);',
		'             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);',
		'             sample.a = 1.0; //colorValue.a * opacityFactor;',
		'             sample.rgb = colorValue.rgb * lightFactor;',
		'             accum = sample;',
		'         }',
		'     }',
		'     //advance the current position',
		'     vpos.xyz += Step;',
		'     ',
		'     //break if the position is greater than <1, 1, 1> ',
		'     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) ',
		'         break; ',
		'     ',
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
        
        me._token;
        
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
                clearInterval(me._token);
            });

            me.addCallback("onCameraChangeEnd", function() {
                me._token = setInterval(function(){
                    me._needRedraw = false;
                    me.isChange = false;
                    console.log("DEACTIVATE");
                    clearInterval(me._token);
                }, 5000);
                
            });
            
            
            var counter = 0;

            function animate() {

                requestAnimationFrame( animate );
                // Note: isStart is a flag to indicate texture maps finished loaded.
                if(me._needRedraw && me._isStart) {
                    me._core.draw(0);
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
        
        me.setShader = function(codeblock){
          me._core.setShader(codeblock);
          me._needRedraw = true;
        };
        
        me.setZoom = function(x1, x2, y1, y2){
          me._core.setZoom(x1, x2, y1, y2);
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

        me.showISO = function() {
            return me._core.showISO();
        };
        
        me.showVolren = function() {
            return me._core.showVolren();
        };
        
        me.showLight = function() {
            return me._core.showLight();
        };
        
        me.hideLight = function() {
            return me._core.hideLight();
        };
        
        me.startLightRotation = function() {
            return me._core.startLightRotation();
        };
        
        me.stopLightRotation = function() {
            return me._core.stopLightRotation();
        };

        me.setAxis = function() {
            me._core.setAxis();
            me._needRedraw = true;
        };
        
        me.setStats = function(value) {
            me._core.setStats(value);
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
        
        me.getBase64 = function() {
            return me._core.getBase64();    
        };
        
        me.set2DTexture = function(urls) {
            me._core.set2DTexture(urls); 
            me._needRedraw = true;
            return true;
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
