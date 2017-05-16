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
    this.zFactor = conf.zFactor != undefined ? conf.zFactor : 1;
    this._mode = conf.mode == undefined ? "3d" : conf.mode;
    this._steps = conf.steps == undefined ? 20 : conf.steps;
    this._slices_gap = typeof conf.slices_range == undefined ? [0, '*'] : conf.slices_range;
    
    console.log("CHECK");
    console.log(conf);
    console.log(conf.mode);
    console.log(typeof conf.mode);
    console.log(this._mode);

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
        {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            wrapS:  THREE.ClampToEdgeWrapping,
            wrapT:  THREE.ClampToEdgeWrapping,
            format: THREE.RGBFormat,
            type: THREE.FloatType,
            generateMipmaps: false
        }
    );

    // 2D
    if(this._mode == "2d") {
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
	   
    } else { 
	    this._materialFirstPass = new THREE.ShaderMaterial( {
		vertexShader: this._shaders.firstPass.vertexShader,
		fragmentShader: this._shaders.firstPass.fragmentShader,
		side: THREE.FrontSide,
        //side: THREE.BackSide,
		transparent: true
	    } );
	    
	    this._materialSecondPass = new THREE.ShaderMaterial( {
		vertexShader: this._shaders[this._shader_name].vertexShader,
		fragmentShader: ejs.render( this._shaders[this._shader_name].fragmentShader, {
		  "maxTexturesNumber": me.getMaxTexturesNumber()}),
		uniforms: {
            uRatio : { type: "f", value: this.zFactor},
		    uBackCoord: { type: "t",  value: this._rtTexture }, 
		    uSliceMaps: { type: "tv", value: this._slicemaps_textures },
		    uLightPos: {type:"v3", value: new THREE.Vector3() },
		    uSetViewMode: {type:"i", value: 0 },

		    uSteps: { type: "i", value: this._steps },
		    uSlicemapWidth: { type: "f", value: this._slicemaps_width },
		    uNumberOfSlices: { type: "f", value:  (parseFloat(this.getSlicesRange()[1]) + 1.0) },
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
		//side: THREE.FrontSide,
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
    }   
 
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
    
    if(this._mode == "3d") { 
        this.setTransferFunctionByColors(this._transfer_function_colors);
    }
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
    
    // fixed the bleeding edge
    this.setGeometryDimensions(this.getGeometryDimensions());
    
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

    if(this._mode == "3d") { 
        this._secondPassSetUniformValue("uTransferFunction", texture);
    }
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
  
    if(this._mode == "3d") { 
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
            uRatio : { type: "f", value: this.zFactor},
		    uBackCoord: { type: "t",  value: this._rtTexture }, 
		    uSliceMaps: { type: "tv", value: this._slicemaps_textures },
		    uLightPos: {type:"v3", value: new THREE.Vector3() },
		    uSetViewMode: {type:"i", value: 0 },          
		    uNumberOfSlices: { type: "f", value: (parseFloat(this.getSlicesRange()[1]) + 1.0) },
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
    }
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
    var geometry      = geometryHelper.createBoxGeometry(geometryDimensions, volumeSizes, 1.0);
    //var geometry      = geometryHelper.createBoxGeometry(geometryDimensions, volumeSizes, this.zFactor);
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
    
    if(this._mode == "3d") { 
        this._secondPassSetUniformValue("uSliceMaps", this._slicemaps_textures);
    }
    this._slicemaps_width = images[0].width;
    if(this._mode == "3d") {
        this._secondPassSetUniformValue("uSlicemapWidth", this._slicemaps_width);
    }
};


Core.prototype.setSteps = function(steps) {
    //console.log("Core: setSteps(" + steps + ")");
    this._steps = steps;
    if(this._mode == "3d") { 
        this._secondPassSetUniformValue("uSteps", this._steps);
    }
};


Core.prototype.setSlicesRange = function(from, to) {
    console.log("Core: setSlicesRange()");
    this._slices_gap = [from, to];
    if(this._mode == "3d") { 
        this._secondPassSetUniformValue("uNumberOfSlices", (parseFloat(this.getSlicesRange()[1]) + 1.0));
    }
};


Core.prototype.setOpacityFactor = function(opacity_factor) {
    console.log("Core: setOpacityFactor()");
    this._opacity_factor = opacity_factor;
    if(this._mode == "3d") { 
        this._secondPassSetUniformValue("uOpacityVal", this._opacity_factor);
    }
};


Core.prototype.setColorFactor = function(color_factor) {
    console.log("Core: setColorFactor()");
    this._color_factor = color_factor;
    if(this._mode == "3d") { 
        this._secondPassSetUniformValue("darkness", this._color_factor);
    }
};


Core.prototype.setAbsorptionMode = function(mode_index) {
    console.log("Core: setAbsorptionMode()");
    this._absorption_mode_index = mode_index;
    if(this._mode == "3d") { 
        this._secondPassSetUniformValue("uAbsorptionModeIndex", this._absorption_mode_index);
    }
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
    if(this._mode == "3d") {
        this._secondPassSetUniformValue("uSlicesOverX", this._slicemap_row_col[0]);
        this._secondPassSetUniformValue("uSlicesOverY", this._slicemap_row_col[1]);
    }
};


Core.prototype.setGrayMinValue = function(value) {
    console.log("Core: setMinGrayValue()");
    this._gray_value[0] = value;
    if(this._mode == "3d") {
        this._secondPassSetUniformValue("uMinGrayVal", this._gray_value[0]);
    }
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
    if(this._mode == "3d") {
        this._secondPassSetUniformValue("uMaxGrayVal", this._gray_value[1]);
    }
};


Core.prototype.addWireframe = function() {
    console.log("Core: addFrame()");
    this._sceneSecondPass.add( this._wireframe );

    // Controls
    //this._controls.update();
    //3D
    if(this._mode == "3d") {
        this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
        this._render.render( this._sceneFirstPass, this._camera );
    }

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.removeWireframe = function() {
    console.log("Core: removeFrame()");
    this._sceneSecondPass.remove( this._wireframe );

    // Controls
    //this._controls.update();
    //3D
    if(this._mode == "3d") {
        this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
        this._render.render( this._sceneFirstPass, this._camera );
    }

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
    if(this._mode == "3d") {
        this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
        this._render.render( this._sceneFirstPass, this._camera );
    }

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.showISO = function() {
    if(this._mode == "3d") {
        this._secondPassSetUniformValue("uSetViewMode", 1);
        this._pivot.add( this._light1 );
        this._render.render( this._sceneSecondPass, this._camera );
    }
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
    if(this._mode == "3d") {
        this._secondPassSetUniformValue("uSetViewMode", 0);
        this._pivot.remove( this._light1 );
        this._render.render( this._sceneSecondPass, this._camera );
    }
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
    if(this._mode == "3d") {
        var cameraPosition = this._light1.getWorldPosition();
        this._secondPassSetUniformValue("uLightPos", cameraPosition);
    }    

    //Controls
    this._controls.update();
    //3D
    this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    this._render.render( this._sceneFirstPass, this._camera );

    // Render the second pass and perform the volume rendering.
    if(this._mode == "3d") {
        this._render.render( this._sceneSecondPass, this._camera );
    }

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
        width = this.getCanvasSizeInPixels()[0];
    } 
    if(this._render_size[1] == '*') {
        height = this.getCanvasSizeInPixels()[1];
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
        to = (this.getRowCol()[0] * this.getRowCol()[1] * this.getSlicemapsImages().length) - 1;
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
    var normalizedVolumeSizes = [
        parseFloat(this.getVolumeSize()[0]) / parseFloat(maxSize), 
        parseFloat(this.getVolumeSize()[1]) / parseFloat(maxSize),
        parseFloat(this.getVolumeSize()[2]) / parseFloat(maxSize)];

    console.log("Check normalized SIZE");
    console.log(normalizedVolumeSizes);
    
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
		'varying vec3 worldSpaceCoords;',
		'void main()',
		'{',
		'    //Set the world space coordinates of the back faces vertices as output.',
		'    worldSpaceCoords = position + vec3(0.5, 0.5, 0.5); //move it from [-0.5;0.5] to [0,1]',
		'    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}  '].join("\n"),
	fragmentShader: [
		'varying vec3 worldSpaceCoords;',
		'void main() {',
		'    //The fragment\'s world space coordinates as fragment output.',
		'    gl_FragColor = vec4( worldSpaceCoords.x , worldSpaceCoords.y, worldSpaceCoords.z, 1 );',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassBilinearRGB = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uSlicemapWidth" : { type: "f", value: -1 },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSteps" : { type: "f", value: -1 },
		"uRatio" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'varying vec3 worldSpaceCoords;',
		'varying vec4 projectedCoords;',
		' ',
		'void main()',
		'{',
		'    worldSpaceCoords = (modelMatrix * vec4(position + vec3(0.5, 0.5,0.5), 1.0 )).xyz;',
		'    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'    projectedCoords = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'].join("\n"),
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
		'// Passed from vertex',
		'varying vec3 worldSpaceCoords; ',
		'varying vec4 projectedCoords; ',
		'// Passed from core',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uSlicemapWidth;',
		'// Assuming a bounding box of 512x512x512',
		'// ceil( sqrt(3) * 512 ) = 887',
		'const int MAX_STEPS = 887;',
		'// Application specific parameters',
		'uniform float uNumberOfSlices; ',
		'uniform float uMinGrayVal; ',
		'uniform float uMaxGrayVal;',
		'uniform float uOpacityVal; ',
		'uniform float uColorVal; ',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float uSteps;',
		'uniform float uRatio;',
		'// uniform int uAvailable_textures_number;',
		'vec4 getVolumeValue(vec3 volpos)',
		'{',
		'    //if (volpos.z < 0.5)',
		'    //    return vec4(0.0);',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    float dx2, dy2; ',
		'    // float value; ',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    float delta = 1.0 / (sliceSizeX * uRatio);',
		'    ',
		'    float adapted_x, adapted_y, adapted_z;',
		'    //adapted_x = (volpos.x * (1.0 - (2.0*delta))) + delta;',
		'    //adapted_y = (volpos.y * (1.0 - (2.0*delta))) + delta;',
		'    //adapted_z = 1.0 - (( (volpos.z* (1.0/uRatio) ) * (1.0 - (2.0*delta))) + delta);',
		'    ',
		'    adapted_x = volpos.x;',
		'    adapted_y = volpos.y;',
		'    //adapted_z = volpos.z;',
		'    adapted_z = 1.0 - (volpos.z * (1.0/uRatio));',
		'    s1Original = floor(adapted_z * uNumberOfSlices);',
		'    s2Original = s1Original + delta;',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));',
		'    int tex2Index = int(floor(s2Original / slicesPerSprite));',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    s2 = mod(s2Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    dx2 = fract(s2/uSlicesOverX);',
		'    dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    texpos1.x = dx1+(adapted_x*sliceSizeX)/uSlicemapWidth;',
		'    texpos1.y = dy1+(adapted_y*sliceSizeY)/uSlicemapWidth;',
		'    ',
		'    texpos2.x = dx2+(adapted_x*sliceSizeX)/uSlicemapWidth;',
		'    texpos2.y = dy2+(adapted_y*sliceSizeY)/uSlicemapWidth;',
		' ',
		' ',
		'    vec4 value1, value2;',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;',
		'        }',
		'        if( tex2Index == <%=i%> )',
		'        {',
		'            value2 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;',
		'        }',
		'    <% } %>',
		'    ',
		'    //return vec4( (value1 + value2) * 0.5);',
		'    ',
		'    ',
		'    return mix(value1, value2, fract(volpos.z* uNumberOfSlices));',
		'}',
		'void main(void) {',
		' ',
		'    //Transform the coordinates it from [-1;1] to [0;1]',
		'    vec2 texc = vec2(((projectedCoords.x / projectedCoords.w) + 1.0 ) / 2.0,',
		'                     ((projectedCoords.y / projectedCoords.w) + 1.0 ) / 2.0);',
		'    //The back position is the world space position stored in the texture.',
		'    vec3 backPos = texture2D(uBackCoord, texc).xyz;',
		'                ',
		'    //The front position is the world space position of the second render pass.',
		'    vec3 frontPos = worldSpaceCoords;',
		' ',
		'    //The direction from the front position to back position.',
		'    vec3 dir = backPos - frontPos;',
		'    float rayLength = length(dir);',
		'    //Calculate how long to increment in each step.',
		'    float steps = ceil( sqrt(3.0) * (uSlicemapWidth / uSlicesOverX) ) * uRatio;',
		'    //float steps = 256.0;',
		'    float delta = 1.0 / steps;',
		'    ',
		'    //The increment in each direction for each step.',
		'    vec3 deltaDirection = normalize(dir) * delta;',
		'    ',
		'    vec3 Step = dir / steps;',
		'    ',
		'    float deltaDirectionLength = length(deltaDirection);',
		'    //vec4 vpos = frontColor;  // currentPosition',
		'    //vec3 Step = dir/uStepsF; // steps',
		'    //Start the ray casting from the front position.',
		'    vec3 currentPosition = frontPos;',
		'    //The color accumulator.',
		'    vec4 accumulatedColor = vec4(0.0);',
		'    //The alpha value accumulated so far.',
		'    float accumulatedAlpha = 0.0;',
		'    ',
		'    //How long has the ray travelled so far.',
		'    float accumulatedLength = 0.0;',
		'    ',
		'    //If we have twice as many samples, we only need ~1/2 the alpha per sample.',
		'    //Scaling by 256/10 just happens to give a good value for the alphaCorrection slider.',
		'    float alphaScaleFactor = 28.8 * delta;',
		'    ',
		'    vec4 colorSample = vec4(0.0);',
		'    vec4 sample = vec4(0.0); ',
		'    vec4 grayValue;',
		'    float alphaSample;',
		'    float alphaCorrection = 1.0;',
		'    ',
		'    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    float sm_delta = 1.0 / sliceSizeX;',
		'    ',
		'    //Perform the ray marching iterations',
		'    for(int i = 0; i < MAX_STEPS; i++) {       ',
		'        if(currentPosition.x > 1.0 ||',
		'           currentPosition.y > 1.0 ||',
		'           currentPosition.z > 1.0 ||',
		'           currentPosition.x < 0.0 ||',
		'           currentPosition.y < 0.0 ||',
		'           currentPosition.z < 0.0)',
		'            break;',
		'        if(accumulatedColor.a>=1.0) ',
		'            break;',
		'        grayValue = getVolumeValue(currentPosition); ',
		'        if(grayValue.z < 0.05 || ',
		'           grayValue.x <= 0.0 ||',
		'           grayValue.x >= 1.0)  ',
		'            accumulatedColor = vec4(0.0);     ',
		'        else { ',
		'            //colorSample.x = (1.0 * 2.0 - grayValue.x) * 5.0 * 0.4;',
		'            colorSample.xyz = grayValue.xyz;',
		'            //colorSample.w = alphaScaleFactor;',
		'            colorSample.w = 0.1;',
		'              ',
		'            //sample.a = colorSample.a * 40.0 * (1.0 / steps);',
		'            sample.a = colorSample.a;',
		'            sample.rgb = (1.0 - accumulatedColor.a) * colorSample.xyz * sample.a; ',
		'             ',
		'            accumulatedColor += sample; ',
		'        }    ',
		'   ',
		'        //Advance the ray.',
		'        //currentPosition.xyz += deltaDirection;',
		'        currentPosition.xyz += Step;',
		'   ',
		'         ',
		'    } ',
		'    gl_FragColor = accumulatedColor;',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassNearestNeighbour = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uSlicemapWidth" : { type: "f", value: -1 },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSteps" : { type: "f", value: -1 },
		"uZFactor" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'varying vec3 worldSpaceCoords;',
		'varying vec4 projectedCoords;',
		' ',
		'void main()',
		'{',
		'    worldSpaceCoords = (modelMatrix * vec4(position + vec3(0.5, 0.5,0.5), 1.0 )).xyz;',
		'    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'    projectedCoords = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'].join("\n"),
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
		'// Passed from vertex',
		'varying vec3 worldSpaceCoords; ',
		'varying vec4 projectedCoords; ',
		'// Passed from core',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uSlicemapWidth;',
		'// Assuming a bounding box of 512x512x512',
		'// ceil( sqrt(3) * 512 ) = 887',
		'const int MAX_STEPS = 887;',
		'// Application specific parameters',
		'uniform float uNumberOfSlices; ',
		'uniform float uMinGrayVal; ',
		'uniform float uMaxGrayVal; ',
		'uniform float uOpacityVal; ',
		'uniform float uColorVal; ',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float uSteps;',
		'uniform float uZFactor;',
		'// uniform int uAvailable_textures_number;',
		'vec4 getVolumeValue(vec3 volpos)',
		'{',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    // float dx2, dy2; ',
		'    // float value; ',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    float delta = 1.0 / sliceSizeX;',
		'    ',
		'    float adapted_x, adapted_y, adapted_z;',
		'    adapted_x = (volpos.x * (1.0 - (2.0*delta))) + delta;',
		'    adapted_y = (volpos.y * (1.0 - (2.0*delta))) + delta;',
		'    adapted_z = 1.0 - ((volpos.z * (1.0 - (2.0*delta))) + delta);',
		'    s1Original = floor(adapted_z*uNumberOfSlices);',
		'    //s1Original = floor(volpos.z*uNumberOfSlices); ',
		'    // s2Original = min(s1Original + 1.0, uNumberOfSlices);',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));',
		'    // int tex2Index = int(floor(s2Original / slicesPerSprite));',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    // s2 = mod(s2Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    texpos1.x = dx1+(floor(adapted_x*sliceSizeX)+0.5)/uSlicemapWidth;',
		'    texpos1.y = dy1+(floor(adapted_y*sliceSizeY)+0.5)/uSlicemapWidth;',
		' ',
		'    float value2 = 0.0;',
		'    vec4 value1;',
		'    // bool value1Set = false, value2Set = false;',
		'    // int numberOfSlicemaps = int( ceil(uNumberOfSlices / (uSlicesOverX * uSlicesOverY)) );',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;',
		'        }',
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
		'void main(void) {',
		' ',
		'    //Transform the coordinates it from [-1;1] to [0;1]',
		'    vec2 texc = vec2(((projectedCoords.x / projectedCoords.w) + 1.0 ) / 2.0,',
		'                     ((projectedCoords.y / projectedCoords.w) + 1.0 ) / 2.0);',
		'    //The back position is the world space position stored in the texture.',
		'    vec3 backPos = texture2D(uBackCoord, texc).xyz;',
		'                ',
		'    //The front position is the world space position of the second render pass.',
		'    vec3 frontPos = worldSpaceCoords;',
		' ',
		'    //The direction from the front position to back position.',
		'    vec3 dir = backPos - frontPos;',
		'    //vec3 dir = frontPos - backPos;',
		' ',
		'    float rayLength = length(dir);',
		'    //Calculate how long to increment in each step.',
		'    float steps = ceil( sqrt(3.0) * (uSlicemapWidth / uSlicesOverX) ) * uZFactor;',
		'    float delta = 1.0 / steps;',
		'    ',
		'    //The increment in each direction for each step.',
		'    vec3 deltaDirection = normalize(dir) * delta;',
		'    float deltaDirectionLength = length(deltaDirection);',
		'    //Start the ray casting from the front position.',
		'    vec3 currentPosition = frontPos;',
		'    //The color accumulator.',
		'    vec4 accumulatedColor = vec4(0.0);',
		'    //The alpha value accumulated so far.',
		'    float accumulatedAlpha = 0.0;',
		'    ',
		'    //How long has the ray travelled so far.',
		'    float accumulatedLength = 0.0;',
		'    ',
		'    //If we have twice as many samples, we only need ~1/2 the alpha per sample.',
		'    //Scaling by 256/10 just happens to give a good value for the alphaCorrection slider.',
		'    float alphaScaleFactor = 25.6 * delta;',
		'    ',
		'    vec4 colorSample;',
		'    float alphaSample;',
		'    float alphaCorrection = 1.0;',
		'    ',
		'    //Perform the ray marching iterations',
		'    for(int i = 0; i < MAX_STEPS; i++) {',
		'        //Get the voxel intensity value from the 3D texture.',
		'        //colorSample = sampleAs3DTexture( currentPosition );',
		'        ',
		'        colorSample = getVolumeValue( currentPosition );',
		'        ',
		'        //Allow the alpha correction customization.',
		'        alphaSample = colorSample.a * alphaCorrection;',
		'        ',
		'        //Applying this effect to both the color and alpha accumulation results in more realistic transparency.',
		'        alphaSample *= (1.0 - accumulatedAlpha);',
		'        ',
		'        //Scaling alpha by the number of steps makes the final color invariant to the step size.',
		'        alphaSample *= alphaScaleFactor;',
		'        ',
		'        //Perform the composition.',
		'        accumulatedColor += colorSample * alphaSample;',
		'        ',
		'        //Store the alpha accumulated so far.',
		'        accumulatedAlpha += alphaSample;',
		'        ',
		'        //Advance the ray.',
		'        currentPosition += deltaDirection;',
		'					',
		'        accumulatedLength += deltaDirectionLength;',
		'        ',
		'        //If the length traversed is more than the ray length, or if the alpha accumulated reaches 1.0 then exit.',
		'        if(accumulatedLength >= rayLength || accumulatedAlpha >= 1.0 )',
		'            break;',
		'    }',
		'    gl_FragColor = accumulatedColor; ',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassNearestNeighbourB = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uSlicemapWidth" : { type: "f", value: -1 },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSteps" : { type: "f", value: -1 },
		"uRatio" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'varying vec3 worldSpaceCoords;',
		'varying vec4 projectedCoords;',
		' ',
		'void main()',
		'{',
		'    worldSpaceCoords = (modelMatrix * vec4(position + vec3(0.5, 0.5,0.5), 1.0 )).xyz;',
		'    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'    projectedCoords = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'].join("\n"),
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
		'// Passed from vertex',
		'varying vec3 worldSpaceCoords; ',
		'varying vec4 projectedCoords; ',
		'// Passed from core',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uSlicemapWidth;',
		'// Assuming a bounding box of 512x512x512',
		'// ceil( sqrt(3) * 512 ) = 887',
		'const int MAX_STEPS = 887;',
		'// Application specific parameters',
		'uniform float uNumberOfSlices; ',
		'uniform float uMinGrayVal; ',
		'uniform float uMaxGrayVal;',
		'uniform float uOpacityVal; ',
		'uniform float uColorVal; ',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float uSteps;',
		'uniform float uRatio;',
		'// uniform int uAvailable_textures_number;',
		'vec4 getVolumeValue(vec3 volpos)',
		'{',
		'    //if (volpos.z < 0.5)',
		'    //    return vec4(0.0);',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    // float dx2, dy2; ',
		'    // float value; ',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    float delta = 1.0 / sliceSizeX;',
		'    ',
		'    float adapted_x, adapted_y, adapted_z;',
		'    adapted_x = (volpos.x * (1.0 - (2.0*delta))) + delta;',
		'    adapted_y = (volpos.y * (1.0 - (2.0*delta))) + delta;',
		'    adapted_z = 1.0 - (( (volpos.z* (1.0/uRatio) ) * (1.0 - (2.0*delta))) + delta);',
		'    s1Original = floor(adapted_z*uNumberOfSlices);',
		'    //s1Original = floor(volpos.z*uNumberOfSlices); ',
		'    //s2Original = min(s1Original + 1.0, uNumberOfSlices);',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));',
		'    //int tex2Index = int(floor(s2Original / slicesPerSprite));',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    //s2 = mod(s2Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    texpos1.x = dx1+(floor(adapted_x*sliceSizeX)+0.5)/uSlicemapWidth;',
		'    texpos1.y = dy1+(floor(adapted_y*sliceSizeY)+0.5)/uSlicemapWidth;',
		' ',
		'    float value2 = 0.0;',
		'    vec4 value1;',
		'    // bool value1Set = false, value2Set = false;',
		'    // int numberOfSlicemaps = int( ceil(uNumberOfSlices / (uSlicesOverX * uSlicesOverY)) );',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;',
		'        }',
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
		'    // return mix(value1, value2, fract(volpos.z*uNumberOfSlices));',
		'}',
		'void main(void) {',
		' ',
		'    //Transform the coordinates it from [-1;1] to [0;1]',
		'    vec2 texc = vec2(((projectedCoords.x / projectedCoords.w) + 1.0 ) / 2.0,',
		'                     ((projectedCoords.y / projectedCoords.w) + 1.0 ) / 2.0);',
		'    //The back position is the world space position stored in the texture.',
		'    vec3 backPos = texture2D(uBackCoord, texc).xyz;',
		'                ',
		'    //The front position is the world space position of the second render pass.',
		'    vec3 frontPos = worldSpaceCoords;',
		' ',
		'    //The direction from the front position to back position.',
		'    vec3 dir = backPos - frontPos;',
		'    float rayLength = length(dir);',
		'    //Calculate how long to increment in each step.',
		'    float steps = ceil( sqrt(3.0) * (uSlicemapWidth / uSlicesOverX) ) * uRatio;',
		'    //float steps = 256.0;',
		'    float delta = 1.0 / steps;',
		'    ',
		'    //The increment in each direction for each step.',
		'    vec3 deltaDirection = normalize(dir) * delta;',
		'    ',
		'    vec3 Step = dir / steps;',
		'    ',
		'    float deltaDirectionLength = length(deltaDirection);',
		'    //vec4 vpos = frontColor;  // currentPosition',
		'    //vec3 Step = dir/uStepsF; // steps',
		'    //Start the ray casting from the front position.',
		'    vec3 currentPosition = frontPos;',
		'    //The color accumulator.',
		'    vec4 accumulatedColor = vec4(0.0);',
		'    //The alpha value accumulated so far.',
		'    float accumulatedAlpha = 0.0;',
		'    ',
		'    //How long has the ray travelled so far.',
		'    float accumulatedLength = 0.0;',
		'    ',
		'    //If we have twice as many samples, we only need ~1/2 the alpha per sample.',
		'    //Scaling by 256/10 just happens to give a good value for the alphaCorrection slider.',
		'    float alphaScaleFactor = 28.8 * delta;',
		'    ',
		'    vec4 colorSample = vec4(0.0);',
		'    vec4 sample = vec4(0.0); ',
		'    vec4 grayValue;',
		'    float alphaSample;',
		'    float alphaCorrection = 1.0;',
		'    ',
		'    //Perform the ray marching iterations',
		'    for(int i = 0; i < MAX_STEPS; i++) {       ',
		'        if(currentPosition.x > 1.0 || currentPosition.y > 1.0 || currentPosition.z > 1.0 || currentPosition.x < 0.0 || currentPosition.y < 0.0 || currentPosition.z < 0.0)      ',
		'            break;',
		'        if(accumulatedColor.a>=1.0) ',
		'            break;',
		'        grayValue = getVolumeValue(currentPosition); ',
		'        if(grayValue.z < 0.05 || ',
		'           grayValue.z < 0.0 ||',
		'           grayValue.z > 1.0)  ',
		'            accumulatedColor = vec4(0.0);     ',
		'        else { ',
		'            //colorSample.x = (1.0 * 2.0 - grayValue.x) * 5.0 * 0.4;',
		'            colorSample.x = grayValue.z;',
		'            //colorSample.w = alphaScaleFactor;',
		'            colorSample.w = 0.1;',
		'              ',
		'            //sample.a = colorSample.a * 40.0 * (1.0 / steps);',
		'            sample.a = colorSample.a;',
		'            sample.rgb = (1.0 - accumulatedColor.a) * colorSample.xxx * sample.a; ',
		'             ',
		'            accumulatedColor += sample; ',
		'        }    ',
		'   ',
		'        //Advance the ray.',
		'        //currentPosition.xyz += deltaDirection;',
		'        currentPosition.xyz += Step;',
		'   ',
		'         ',
		'    } ',
		'    gl_FragColor = accumulatedColor; ',
		'    /*',
		'    for(int i = 0; i < MAX_STEPS; i++) {',
		'        ',
		'        grayValue = getVolumeValue( currentPosition );',
		'        ',
		'        if(grayValue.r < uMinGrayVal || grayValue.r > uMaxGrayVal || grayValue.b < 0.05) { ',
		'            accumulatedColor = vec4(0.0); ',
		'        } else {',
		'            colorSample.rgb = vec3(1.0,0.0,0.0);',
		'            colorSample.a = 1.0;',
		'            ',
		'            alphaSample = colorSample.a * alphaCorrection;',
		'        ',
		'            //Applying this effect to both the color and alpha accumulation results in more realistic transparency.',
		'            alphaSample *= (1.0 - accumulatedAlpha);',
		'        ',
		'            //Scaling alpha by the number of steps makes the final color invariant to the step size.',
		'            alphaSample *= alphaScaleFactor;',
		'        ',
		'            //Perform the composition.',
		'            accumulatedColor += colorSample * alphaSample * 100.0;',
		'        ',
		'            //Store the alpha accumulated so far.',
		'            accumulatedAlpha += alphaSample;',
		'            ',
		'            accumulatedColor = colorSample;',
		'        }',
		'        //Advance the ray.',
		'        currentPosition += deltaDirection;',
		'					',
		'        accumulatedLength += deltaDirectionLength;',
		'        ',
		'        //If the length traversed is more than the ray length, or if the alpha accumulated reaches 1.0 then exit.',
		'        if(accumulatedLength >= rayLength || accumulatedAlpha >= 1.0 )',
		'            break;',
		'    }',
		'    gl_FragColor = accumulatedColor;',
		'    */',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassNearestNeighbourG = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uSlicemapWidth" : { type: "f", value: -1 },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSteps" : { type: "f", value: -1 },
		"uRatio" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'varying vec3 worldSpaceCoords;',
		'varying vec4 projectedCoords;',
		' ',
		'void main()',
		'{',
		'    worldSpaceCoords = (modelMatrix * vec4(position + vec3(0.5, 0.5,0.5), 1.0 )).xyz;',
		'    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'    projectedCoords = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'].join("\n"),
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
		'// Passed from vertex',
		'varying vec3 worldSpaceCoords; ',
		'varying vec4 projectedCoords; ',
		'// Passed from core',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uSlicemapWidth;',
		'// Assuming a bounding box of 512x512x512',
		'// ceil( sqrt(3) * 512 ) = 887',
		'const int MAX_STEPS = 887;',
		'// Application specific parameters',
		'uniform float uNumberOfSlices; ',
		'uniform float uMinGrayVal; ',
		'uniform float uMaxGrayVal;',
		'uniform float uOpacityVal; ',
		'uniform float uColorVal; ',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float uSteps;',
		'uniform float uRatio;',
		'// uniform int uAvailable_textures_number;',
		'vec4 getVolumeValue(vec3 volpos)',
		'{',
		'    //if (volpos.z < 0.5)',
		'    //    return vec4(0.0);',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    // float dx2, dy2; ',
		'    // float value; ',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    float delta = 1.0 / sliceSizeX;',
		'    ',
		'    float adapted_x, adapted_y, adapted_z;',
		'    adapted_x = (volpos.x * (1.0 - (2.0*delta))) + delta;',
		'    adapted_y = (volpos.y * (1.0 - (2.0*delta))) + delta;',
		'    adapted_z = 1.0 - (( (volpos.z* (1.0/uRatio) ) * (1.0 - (2.0*delta))) + delta);',
		'    s1Original = floor(adapted_z*uNumberOfSlices);',
		'    //s1Original = floor(volpos.z*uNumberOfSlices); ',
		'    //s2Original = min(s1Original + 1.0, uNumberOfSlices);',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));',
		'    //int tex2Index = int(floor(s2Original / slicesPerSprite));',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    //s2 = mod(s2Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    texpos1.x = dx1+(floor(adapted_x*sliceSizeX)+0.5)/uSlicemapWidth;',
		'    texpos1.y = dy1+(floor(adapted_y*sliceSizeY)+0.5)/uSlicemapWidth;',
		' ',
		'    float value2 = 0.0;',
		'    vec4 value1;',
		'    // bool value1Set = false, value2Set = false;',
		'    // int numberOfSlicemaps = int( ceil(uNumberOfSlices / (uSlicesOverX * uSlicesOverY)) );',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;',
		'        }',
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
		'    // return mix(value1, value2, fract(volpos.z*uNumberOfSlices));',
		'}',
		'void main(void) {',
		' ',
		'    //Transform the coordinates it from [-1;1] to [0;1]',
		'    vec2 texc = vec2(((projectedCoords.x / projectedCoords.w) + 1.0 ) / 2.0,',
		'                     ((projectedCoords.y / projectedCoords.w) + 1.0 ) / 2.0);',
		'    //The back position is the world space position stored in the texture.',
		'    vec3 backPos = texture2D(uBackCoord, texc).xyz;',
		'                ',
		'    //The front position is the world space position of the second render pass.',
		'    vec3 frontPos = worldSpaceCoords;',
		' ',
		'    //The direction from the front position to back position.',
		'    vec3 dir = backPos - frontPos;',
		'    float rayLength = length(dir);',
		'    //Calculate how long to increment in each step.',
		'    float steps = ceil( sqrt(3.0) * (uSlicemapWidth / uSlicesOverX) ) * uRatio;',
		'    //float steps = 256.0;',
		'    float delta = 1.0 / steps;',
		'    ',
		'    //The increment in each direction for each step.',
		'    vec3 deltaDirection = normalize(dir) * delta;',
		'    ',
		'    vec3 Step = dir / steps;',
		'    ',
		'    float deltaDirectionLength = length(deltaDirection);',
		'    //vec4 vpos = frontColor;  // currentPosition',
		'    //vec3 Step = dir/uStepsF; // steps',
		'    //Start the ray casting from the front position.',
		'    vec3 currentPosition = frontPos;',
		'    //The color accumulator.',
		'    vec4 accumulatedColor = vec4(0.0);',
		'    //The alpha value accumulated so far.',
		'    float accumulatedAlpha = 0.0;',
		'    ',
		'    //How long has the ray travelled so far.',
		'    float accumulatedLength = 0.0;',
		'    ',
		'    //If we have twice as many samples, we only need ~1/2 the alpha per sample.',
		'    //Scaling by 256/10 just happens to give a good value for the alphaCorrection slider.',
		'    float alphaScaleFactor = 28.8 * delta;',
		'    ',
		'    vec4 colorSample = vec4(0.0);',
		'    vec4 sample = vec4(0.0); ',
		'    vec4 grayValue;',
		'    float alphaSample;',
		'    float alphaCorrection = 1.0;',
		'    ',
		'    //Perform the ray marching iterations',
		'    for(int i = 0; i < MAX_STEPS; i++) {       ',
		'        if(currentPosition.x > 1.0 || currentPosition.y > 1.0 || currentPosition.z > 1.0 || currentPosition.x < 0.0 || currentPosition.y < 0.0 || currentPosition.z < 0.0)      ',
		'            break;',
		'        if(accumulatedColor.a>=1.0) ',
		'            break;',
		'        grayValue = getVolumeValue(currentPosition); ',
		'        if(grayValue.z < 0.05 || ',
		'           grayValue.y < 0.0 ||',
		'           grayValue.y > 1.0)  ',
		'            accumulatedColor = vec4(0.0);     ',
		'        else { ',
		'            //colorSample.x = (1.0 * 2.0 - grayValue.x) * 5.0 * 0.4;',
		'            colorSample.x = grayValue.y;',
		'            //colorSample.w = alphaScaleFactor;',
		'            colorSample.w = 0.1;',
		'              ',
		'            //sample.a = colorSample.a * 40.0 * (1.0 / steps);',
		'            sample.a = colorSample.a;',
		'            sample.rgb = (1.0 - accumulatedColor.a) * colorSample.xxx * sample.a; ',
		'             ',
		'            accumulatedColor += sample; ',
		'        }    ',
		'   ',
		'        //Advance the ray.',
		'        //currentPosition.xyz += deltaDirection;',
		'        currentPosition.xyz += Step;',
		'   ',
		'         ',
		'    } ',
		'    gl_FragColor = accumulatedColor; ',
		'    /*',
		'    for(int i = 0; i < MAX_STEPS; i++) {',
		'        ',
		'        grayValue = getVolumeValue( currentPosition );',
		'        ',
		'        if(grayValue.r < uMinGrayVal || grayValue.r > uMaxGrayVal || grayValue.b < 0.05) { ',
		'            accumulatedColor = vec4(0.0); ',
		'        } else {',
		'            colorSample.rgb = vec3(1.0,0.0,0.0);',
		'            colorSample.a = 1.0;',
		'            ',
		'            alphaSample = colorSample.a * alphaCorrection;',
		'        ',
		'            //Applying this effect to both the color and alpha accumulation results in more realistic transparency.',
		'            alphaSample *= (1.0 - accumulatedAlpha);',
		'        ',
		'            //Scaling alpha by the number of steps makes the final color invariant to the step size.',
		'            alphaSample *= alphaScaleFactor;',
		'        ',
		'            //Perform the composition.',
		'            accumulatedColor += colorSample * alphaSample * 100.0;',
		'        ',
		'            //Store the alpha accumulated so far.',
		'            accumulatedAlpha += alphaSample;',
		'            ',
		'            accumulatedColor = colorSample;',
		'        }',
		'        //Advance the ray.',
		'        currentPosition += deltaDirection;',
		'					',
		'        accumulatedLength += deltaDirectionLength;',
		'        ',
		'        //If the length traversed is more than the ray length, or if the alpha accumulated reaches 1.0 then exit.',
		'        if(accumulatedLength >= rayLength || accumulatedAlpha >= 1.0 )',
		'            break;',
		'    }',
		'    gl_FragColor = accumulatedColor;',
		'    */',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassNearestNeighbourR = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uSlicemapWidth" : { type: "f", value: -1 },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSteps" : { type: "f", value: -1 },
		"uRatio" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'varying vec3 worldSpaceCoords;',
		'varying vec4 projectedCoords;',
		' ',
		'void main()',
		'{',
		'    worldSpaceCoords = (modelMatrix * vec4(position + vec3(0.5, 0.5,0.5), 1.0 )).xyz;',
		'    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'    projectedCoords = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'].join("\n"),
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
		'// Passed from vertex',
		'varying vec3 worldSpaceCoords; ',
		'varying vec4 projectedCoords; ',
		'// Passed from core',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uSlicemapWidth;',
		'// Assuming a bounding box of 512x512x512',
		'// ceil( sqrt(3) * 512 ) = 887',
		'const int MAX_STEPS = 887;',
		'// Application specific parameters',
		'uniform float uNumberOfSlices; ',
		'uniform float uMinGrayVal; ',
		'uniform float uMaxGrayVal;',
		'uniform float uOpacityVal; ',
		'uniform float uColorVal; ',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float uSteps;',
		'uniform float uRatio;',
		'// uniform int uAvailable_textures_number;',
		'vec4 getVolumeValue(vec3 volpos)',
		'{',
		'    //if (volpos.z < 0.5)',
		'    //    return vec4(0.0);',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    // float dx2, dy2; ',
		'    // float value; ',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    float delta = 1.0 / sliceSizeX;',
		'    ',
		'    float adapted_x, adapted_y, adapted_z;',
		'    adapted_x = (volpos.x * (1.0 - (2.0*delta))) + delta;',
		'    adapted_y = (volpos.y * (1.0 - (2.0*delta))) + delta;',
		'    adapted_z = 1.0 - (( (volpos.z* (1.0/uRatio) ) * (1.0 - (2.0*delta))) + delta);',
		'    s1Original = floor(adapted_z*uNumberOfSlices);',
		'    //s1Original = floor(volpos.z*uNumberOfSlices); ',
		'    //s2Original = min(s1Original + 1.0, uNumberOfSlices);',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));',
		'    //int tex2Index = int(floor(s2Original / slicesPerSprite));',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    //s2 = mod(s2Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    texpos1.x = dx1+(floor(adapted_x*sliceSizeX)+0.5)/uSlicemapWidth;',
		'    texpos1.y = dy1+(floor(adapted_y*sliceSizeY)+0.5)/uSlicemapWidth;',
		' ',
		'    float value2 = 0.0;',
		'    vec4 value1;',
		'    // bool value1Set = false, value2Set = false;',
		'    // int numberOfSlicemaps = int( ceil(uNumberOfSlices / (uSlicesOverX * uSlicesOverY)) );',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;',
		'        }',
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
		'    // return mix(value1, value2, fract(volpos.z*uNumberOfSlices));',
		'}',
		'void main(void) {',
		' ',
		'    //Transform the coordinates it from [-1;1] to [0;1]',
		'    vec2 texc = vec2(((projectedCoords.x / projectedCoords.w) + 1.0 ) / 2.0,',
		'                     ((projectedCoords.y / projectedCoords.w) + 1.0 ) / 2.0);',
		'    //The back position is the world space position stored in the texture.',
		'    vec3 backPos = texture2D(uBackCoord, texc).xyz;',
		'                ',
		'    //The front position is the world space position of the second render pass.',
		'    vec3 frontPos = worldSpaceCoords;',
		' ',
		'    //The direction from the front position to back position.',
		'    vec3 dir = backPos - frontPos;',
		'    float rayLength = length(dir);',
		'    //Calculate how long to increment in each step.',
		'    float steps = ceil( sqrt(3.0) * (uSlicemapWidth / uSlicesOverX) ) * uRatio;',
		'    //float steps = 256.0;',
		'    float delta = 1.0 / steps;',
		'    ',
		'    //The increment in each direction for each step.',
		'    vec3 deltaDirection = normalize(dir) * delta;',
		'    ',
		'    vec3 Step = dir / steps;',
		'    ',
		'    float deltaDirectionLength = length(deltaDirection);',
		'    //vec4 vpos = frontColor;  // currentPosition',
		'    //vec3 Step = dir/uStepsF; // steps',
		'    //Start the ray casting from the front position.',
		'    vec3 currentPosition = frontPos;',
		'    //The color accumulator.',
		'    vec4 accumulatedColor = vec4(0.0);',
		'    //The alpha value accumulated so far.',
		'    float accumulatedAlpha = 0.0;',
		'    ',
		'    //How long has the ray travelled so far.',
		'    float accumulatedLength = 0.0;',
		'    ',
		'    //If we have twice as many samples, we only need ~1/2 the alpha per sample.',
		'    //Scaling by 256/10 just happens to give a good value for the alphaCorrection slider.',
		'    float alphaScaleFactor = 28.8 * delta;',
		'    ',
		'    vec4 colorSample = vec4(0.0);',
		'    vec4 sample = vec4(0.0); ',
		'    vec4 grayValue;',
		'    float alphaSample;',
		'    float alphaCorrection = 1.0;',
		'    ',
		'    //Perform the ray marching iterations',
		'    for(int i = 0; i < MAX_STEPS; i++) {       ',
		'        if(currentPosition.x > 1.0 || currentPosition.y > 1.0 || currentPosition.z > 1.0 || currentPosition.x < 0.0 || currentPosition.y < 0.0 || currentPosition.z < 0.0)      ',
		'            break;',
		'        if(accumulatedColor.a>=1.0) ',
		'            break;',
		'        grayValue = getVolumeValue(currentPosition); ',
		'        if(grayValue.z < 0.05 || ',
		'           grayValue.x < 0.0 ||',
		'           grayValue.x > 1.0)  ',
		'            accumulatedColor = vec4(0.0);     ',
		'        else { ',
		'            //colorSample.x = (1.0 * 2.0 - grayValue.x) * 5.0 * 0.4;',
		'            colorSample.x = grayValue.x;',
		'            //colorSample.w = alphaScaleFactor;',
		'            colorSample.w = 0.1;',
		'              ',
		'            //sample.a = colorSample.a * 40.0 * (1.0 / steps);',
		'            sample.a = colorSample.a;',
		'            sample.rgb = (1.0 - accumulatedColor.a) * colorSample.xxx * sample.a; ',
		'             ',
		'            accumulatedColor += sample; ',
		'        }    ',
		'   ',
		'        //Advance the ray.',
		'        //currentPosition.xyz += deltaDirection;',
		'        currentPosition.xyz += Step;',
		'   ',
		'         ',
		'    } ',
		'    gl_FragColor = accumulatedColor; ',
		'    /*',
		'    for(int i = 0; i < MAX_STEPS; i++) {',
		'        ',
		'        grayValue = getVolumeValue( currentPosition );',
		'        ',
		'        if(grayValue.r < uMinGrayVal || grayValue.r > uMaxGrayVal || grayValue.b < 0.05) { ',
		'            accumulatedColor = vec4(0.0); ',
		'        } else {',
		'            colorSample.rgb = vec3(1.0,0.0,0.0);',
		'            colorSample.a = 1.0;',
		'            ',
		'            alphaSample = colorSample.a * alphaCorrection;',
		'        ',
		'            //Applying this effect to both the color and alpha accumulation results in more realistic transparency.',
		'            alphaSample *= (1.0 - accumulatedAlpha);',
		'        ',
		'            //Scaling alpha by the number of steps makes the final color invariant to the step size.',
		'            alphaSample *= alphaScaleFactor;',
		'        ',
		'            //Perform the composition.',
		'            accumulatedColor += colorSample * alphaSample * 100.0;',
		'        ',
		'            //Store the alpha accumulated so far.',
		'            accumulatedAlpha += alphaSample;',
		'            ',
		'            accumulatedColor = colorSample;',
		'        }',
		'        //Advance the ray.',
		'        currentPosition += deltaDirection;',
		'					',
		'        accumulatedLength += deltaDirectionLength;',
		'        ',
		'        //If the length traversed is more than the ray length, or if the alpha accumulated reaches 1.0 then exit.',
		'        if(accumulatedLength >= rayLength || accumulatedAlpha >= 1.0 )',
		'            break;',
		'    }',
		'    gl_FragColor = accumulatedColor;',
		'    */',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassNearestNeighbourRGB = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uSlicemapWidth" : { type: "f", value: -1 },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSteps" : { type: "f", value: -1 },
		"uRatio" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'varying vec3 worldSpaceCoords;',
		'varying vec4 projectedCoords;',
		' ',
		'void main()',
		'{',
		'    worldSpaceCoords = (modelMatrix * vec4(position + vec3(0.5, 0.5,0.5), 1.0 )).xyz;',
		'    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'    projectedCoords = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'].join("\n"),
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
		'// Passed from vertex',
		'varying vec3 worldSpaceCoords; ',
		'varying vec4 projectedCoords; ',
		'// Passed from core',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uSlicemapWidth;',
		'// Assuming a bounding box of 512x512x512',
		'// ceil( sqrt(3) * 512 ) = 887',
		'const int MAX_STEPS = 887;',
		'// Application specific parameters',
		'uniform float uNumberOfSlices; ',
		'uniform float uMinGrayVal; ',
		'uniform float uMaxGrayVal;',
		'uniform float uOpacityVal; ',
		'uniform float uColorVal; ',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float uSteps;',
		'uniform float uRatio;',
		'// uniform int uAvailable_textures_number;',
		'vec4 getVolumeValue(vec3 volpos)',
		'{',
		'    //if (volpos.z < 0.5)',
		'    //    return vec4(0.0);',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    // float dx2, dy2; ',
		'    // float value; ',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    float delta = 1.0 / sliceSizeX;',
		'    ',
		'    float adapted_x, adapted_y, adapted_z;',
		'    adapted_x = (volpos.x * (1.0 - (2.0*delta))) + delta;',
		'    adapted_y = (volpos.y * (1.0 - (2.0*delta))) + delta;',
		'    adapted_z = 1.0 - (( (volpos.z* (1.0/uRatio) ) * (1.0 - (2.0*delta))) + delta);',
		'    s1Original = floor(adapted_z*uNumberOfSlices);',
		'    //s1Original = floor(volpos.z*uNumberOfSlices); ',
		'    //s2Original = min(s1Original + 1.0, uNumberOfSlices);',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));',
		'    //int tex2Index = int(floor(s2Original / slicesPerSprite));',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    //s2 = mod(s2Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    texpos1.x = dx1+(floor(adapted_x*sliceSizeX)+0.5)/uSlicemapWidth;',
		'    texpos1.y = dy1+(floor(adapted_y*sliceSizeY)+0.5)/uSlicemapWidth;',
		' ',
		'    float value2 = 0.0;',
		'    vec4 value1;',
		'    // bool value1Set = false, value2Set = false;',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;',
		'        }',
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
		'    // return mix(value1, value2, fract(volpos.z*uNumberOfSlices));',
		'}',
		'void main(void) {',
		' ',
		'    //Transform the coordinates it from [-1;1] to [0;1]',
		'    vec2 texc = vec2(((projectedCoords.x / projectedCoords.w) + 1.0 ) / 2.0,',
		'                     ((projectedCoords.y / projectedCoords.w) + 1.0 ) / 2.0);',
		'    //The back position is the world space position stored in the texture.',
		'    vec3 backPos = texture2D(uBackCoord, texc).xyz;',
		'                ',
		'    //The front position is the world space position of the second render pass.',
		'    vec3 frontPos = worldSpaceCoords;',
		' ',
		'    //The direction from the front position to back position.',
		'    vec3 dir = backPos - frontPos;',
		'    float rayLength = length(dir);',
		'    //Calculate how long to increment in each step.',
		'    float steps = ceil( sqrt(3.0) * (uSlicemapWidth / uSlicesOverX) ) * uRatio;',
		'    //float steps = 256.0;',
		'    float delta = 1.0 / steps;',
		'    ',
		'    //The increment in each direction for each step.',
		'    vec3 deltaDirection = normalize(dir) * delta;',
		'    ',
		'    vec3 Step = dir / steps;',
		'    ',
		'    float deltaDirectionLength = length(deltaDirection);',
		'    //vec4 vpos = frontColor;  // currentPosition',
		'    //vec3 Step = dir/uStepsF; // steps',
		'    //Start the ray casting from the front position.',
		'    vec3 currentPosition = frontPos;',
		'    //The color accumulator.',
		'    vec4 accumulatedColor = vec4(0.0);',
		'    //The alpha value accumulated so far.',
		'    float accumulatedAlpha = 0.0;',
		'    ',
		'    //How long has the ray travelled so far.',
		'    float accumulatedLength = 0.0;',
		'    ',
		'    //If we have twice as many samples, we only need ~1/2 the alpha per sample.',
		'    //Scaling by 256/10 just happens to give a good value for the alphaCorrection slider.',
		'    float alphaScaleFactor = 28.8 * delta;',
		'    ',
		'    vec4 colorSample = vec4(0.0);',
		'    vec4 sample = vec4(0.0); ',
		'    vec4 grayValue;',
		'    float alphaSample;',
		'    float alphaCorrection = 1.0;',
		'    ',
		'    //Perform the ray marching iterations',
		'    for(int i = 0; i < MAX_STEPS; i++) {       ',
		'        if(currentPosition.x > 1.0 || currentPosition.y > 1.0 || currentPosition.z > 1.0 || currentPosition.x < 0.0 || currentPosition.y < 0.0 || currentPosition.z < 0.0)      ',
		'            break;',
		'        if(accumulatedColor.a>=1.0) ',
		'            break;',
		'        grayValue = getVolumeValue(currentPosition); ',
		'        if(grayValue.z < 0.05 || ',
		'           grayValue.x < 0.0 ||',
		'           grayValue.x > 1.0)  ',
		'            accumulatedColor = vec4(0.0);     ',
		'        else { ',
		'            //colorSample.x = (1.0 * 2.0 - grayValue.x) * 5.0 * 0.4;',
		'            colorSample.xyz = grayValue.xyz;',
		'            //colorSample.w = alphaScaleFactor;',
		'            colorSample.w = 0.1;',
		'              ',
		'            //sample.a = colorSample.a * 40.0 * (1.0 / steps);',
		'            sample.a = colorSample.a;',
		'            sample.rgb = (1.0 - accumulatedColor.a) * colorSample.xyz * sample.a; ',
		'             ',
		'            accumulatedColor += sample; ',
		'        }    ',
		'   ',
		'        //Advance the ray.',
		'        //currentPosition.xyz += deltaDirection;',
		'        currentPosition.xyz += Step;',
		'   ',
		'         ',
		'    } ',
		'    gl_FragColor = accumulatedColor;',
		'}'].join("\n")
};
window.VRC.Core.prototype._shaders.secondPassTrilinearRGB = {
	uniforms: THREE.UniformsUtils.merge([
		{
		"uBackCoord" : { type: "t", value: null },
		"uTransferFunction" : { type: "t", value: null },
		"uSliceMaps" : { type: "tv", value: [] },
		"uSlicemapWidth" : { type: "f", value: -1 },
		"uNumberOfSlices" : { type: "f", value: -1 },
		"uMinGrayVal" : { type: "f", value: -1 },
		"uMaxGrayVal" : { type: "f", value: -1 },
		"uOpacityVal" : { type: "f", value: -1 },
		"uColorVal" : { type: "f", value: -1 },
		"uAbsorptionModeIndex" : { type: "f", value: -1 },
		"uSlicesOverX" : { type: "f", value: -1 },
		"uSlicesOverY" : { type: "f", value: -1 },
		"uSteps" : { type: "f", value: -1 },
		"uRatio" : { type: "f", value: -1 },
		"uAvailable_textures_number" : { type: "i", value: 0 },
		}
	]),
	vertexShader: [
		'varying vec3 worldSpaceCoords;',
		'varying vec4 projectedCoords;',
		' ',
		'void main()',
		'{',
		'    worldSpaceCoords = (modelMatrix * vec4(position + vec3(0.5, 0.5,0.5), 1.0 )).xyz;',
		'    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'    projectedCoords = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'].join("\n"),
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
		'// Passed from vertex',
		'varying vec3 worldSpaceCoords; ',
		'varying vec4 projectedCoords; ',
		'// Passed from core',
		'uniform sampler2D uBackCoord; ',
		'uniform sampler2D uTransferFunction;',
		'uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];',
		'uniform float uSlicemapWidth;',
		'// Assuming a bounding box of 512x512x512',
		'// ceil( sqrt(3) * 512 ) = 887',
		'const int MAX_STEPS = 887;',
		'// Application specific parameters',
		'uniform float uNumberOfSlices; ',
		'uniform float uMinGrayVal; ',
		'uniform float uMaxGrayVal;',
		'uniform float uOpacityVal; ',
		'uniform float uColorVal; ',
		'uniform float uAbsorptionModeIndex;',
		'uniform float uSlicesOverX; ',
		'uniform float uSlicesOverY; ',
		'uniform float uSteps;',
		'uniform float uRatio;',
		'// uniform int uAvailable_textures_number;',
		'vec4 getVolumeValue(vec3 volpos)',
		'{',
		'    //if (volpos.z < 0.5)',
		'    //    return vec4(0.0);',
		'    float s1Original, s2Original, s1, s2; ',
		'    float dx1, dy1; ',
		'    float dx2, dy2; ',
		'    // float value; ',
		'    vec2 texpos1,texpos2;',
		'    float slicesPerSprite = uSlicesOverX * uSlicesOverY;',
		'    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    float delta = 1.0 / (sliceSizeX * uRatio);',
		'    ',
		'    float adapted_x, adapted_y, adapted_z;',
		'    //adapted_x = (volpos.x * (1.0 - (2.0*delta))) + delta;',
		'    //adapted_y = (volpos.y * (1.0 - (2.0*delta))) + delta;',
		'    //adapted_z = 1.0 - (( (volpos.z* (1.0/uRatio) ) * (1.0 - (2.0*delta))) + delta);',
		'    ',
		'    adapted_x = volpos.x;',
		'    adapted_y = volpos.y;',
		'    //adapted_z = volpos.z;',
		'    adapted_z = 1.0 - (volpos.z * (1.0/uRatio));',
		'    s1Original = floor(adapted_z * uNumberOfSlices);',
		'    s2Original = s1Original + delta;',
		'    int tex1Index = int(floor(s1Original / slicesPerSprite));',
		'    int tex2Index = int(floor(s2Original / slicesPerSprite));',
		'    s1 = mod(s1Original, slicesPerSprite);',
		'    s2 = mod(s2Original, slicesPerSprite);',
		'    dx1 = fract(s1/uSlicesOverX);',
		'    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    dx2 = fract(s2/uSlicesOverX);',
		'    dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;',
		'    ',
		'    texpos1.x = dx1+(adapted_x*sliceSizeX)/uSlicemapWidth;',
		'    texpos1.y = dy1+(adapted_y*sliceSizeY)/uSlicemapWidth;',
		'    ',
		'    texpos2.x = dx2+(adapted_x*sliceSizeX)/uSlicemapWidth;',
		'    texpos2.y = dy2+(adapted_y*sliceSizeY)/uSlicemapWidth;',
		' ',
		' ',
		'    vec4 value1, value2;',
		'    ',
		'    <% for(var i=0; i < maxTexturesNumber; i++) { %>',
		'        if( tex1Index == <%=i%> )',
		'        {',
		'            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;',
		'        }',
		'        if( tex2Index == <%=i%> )',
		'        {',
		'            value2 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;',
		'        }',
		'    <% } %>',
		'    ',
		'    //return vec4( (value1 + value2) * 0.5);',
		'    ',
		'    ',
		'    return mix(value1, value2, fract(volpos.z* uNumberOfSlices));',
		'}',
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
		'          //value = ((value_vec.r * 0.299)+(value_vec.g * 0.587)+(value_vec.b * 0.114));',
		'          value = value_vec.r;',
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
		'void main(void) {',
		' ',
		'    //Transform the coordinates it from [-1;1] to [0;1]',
		'    vec2 texc = vec2(((projectedCoords.x / projectedCoords.w) + 1.0 ) / 2.0,',
		'                     ((projectedCoords.y / projectedCoords.w) + 1.0 ) / 2.0);',
		'    //The back position is the world space position stored in the texture.',
		'    vec3 backPos = texture2D(uBackCoord, texc).xyz;',
		'                ',
		'    //The front position is the world space position of the second render pass.',
		'    vec3 frontPos = worldSpaceCoords;',
		' ',
		'    //The direction from the front position to back position.',
		'    vec3 dir = backPos - frontPos;',
		'    float rayLength = length(dir);',
		'    //Calculate how long to increment in each step.',
		'    float steps = ceil( sqrt(3.0) * (uSlicemapWidth / uSlicesOverX) ) * uRatio;',
		'    //float steps = 256.0;',
		'    float delta = 1.0 / steps;',
		'    ',
		'    //The increment in each direction for each step.',
		'    vec3 deltaDirection = normalize(dir) * delta;',
		'    ',
		'    vec3 Step = dir / steps;',
		'    ',
		'    float deltaDirectionLength = length(deltaDirection);',
		'    //vec4 vpos = frontColor;  // currentPosition',
		'    //vec3 Step = dir/uStepsF; // steps',
		'    //Start the ray casting from the front position.',
		'    vec3 currentPosition = frontPos;',
		'    //The color accumulator.',
		'    vec4 accumulatedColor = vec4(0.0);',
		'    //The alpha value accumulated so far.',
		'    float accumulatedAlpha = 0.0;',
		'    ',
		'    //How long has the ray travelled so far.',
		'    float accumulatedLength = 0.0;',
		'    ',
		'    //If we have twice as many samples, we only need ~1/2 the alpha per sample.',
		'    //Scaling by 256/10 just happens to give a good value for the alphaCorrection slider.',
		'    float alphaScaleFactor = 28.8 * delta;',
		'    ',
		'    vec4 colorSample = vec4(0.0);',
		'    vec4 sample = vec4(0.0); ',
		'    vec4 grayValue;',
		'    float alphaSample;',
		'    float alphaCorrection = 1.0;',
		'    ',
		'    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis',
		'    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis',
		'    float sm_delta = 1.0 / sliceSizeX;',
		'    ',
		'    //Perform the ray marching iterations',
		'    for(int i = 0; i < MAX_STEPS; i++) {       ',
		'        if(currentPosition.x > 1.0 ||',
		'           currentPosition.y > 1.0 ||',
		'           currentPosition.z > 1.0 ||',
		'           currentPosition.x < 0.0 ||',
		'           currentPosition.y < 0.0 ||',
		'           currentPosition.z < 0.0)',
		'            break;',
		'        if(accumulatedColor.a>=1.0) ',
		'            break;',
		'        //grayValue = getVolumeValue(currentPosition);',
		'        grayValue = vec4(getValueTri(currentPosition));',
		'        if(grayValue.z < 0.05 || ',
		'           grayValue.x <= uMinGrayVal ||',
		'           grayValue.x >= uMaxGrayVal)  ',
		'            accumulatedColor = vec4(0.0);     ',
		'        else { ',
		'            //colorSample.x = (1.0 * 2.0 - grayValue.x) * 5.0 * 0.4;',
		'            colorSample.xyz = grayValue.xyz;',
		'            //colorSample.w = alphaScaleFactor;',
		'            colorSample.w = 0.1;',
		'              ',
		'            //sample.a = colorSample.a * 40.0 * (1.0 / steps);',
		'            sample.a = colorSample.a;',
		'            sample.rgb = (1.0 - accumulatedColor.a) * colorSample.xyz * sample.a; ',
		'             ',
		'            accumulatedColor += sample; ',
		'        }    ',
		'   ',
		'        //Advance the ray.',
		'        //currentPosition.xyz += deltaDirection;',
		'        currentPosition.xyz += Step;',
		'   ',
		'         ',
		'    } ',
		'    gl_FragColor = accumulatedColor;',
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
