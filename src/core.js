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

        me._steps              = 20;
        me._slices_gap         = [0,    '*'];
        me._slicemap_row_col   = [16,   16];
        me._gray_value         = [0.01, 1.0];
        me._border_XX          = [0,    1];
        me._border_YY          = [0,    1];
        me._border_ZZ          = [0,    1];
        me._images             = [];
        me._textures           = [];
        me._opacity_factor     = 1.0;
        me._color_factor       = 1.0;
        me._render_resolution  = ['*', '*'];
        me._render_clear_color = "#ffffff";

        me._firtsPassMaterial =  {};
        me._secondPassMaterial = {};

        me._container = {};
        me._renderer = {};
        me._camera = {};
        me._rtTexture = {};

        me._materialFirstPass = {};
        me._materialSecondPass = {};

        me._sceneFirstPass = {};
        me._sceneSecondPass = {};

        me._meshFirstPass = {};
        me._meshSecondPass = {};

        me.init = function() {
            me._container = document.getElementById( 'container' );

            me._renderer = new THREE.WebGLRenderer();
            me._renderer.setSize( me.getResolution()[0], me.getResolution()[1] );
            me._renderer.setClearColor( me._render_clear_color );
            me._container.appendChild( me._renderer.domElement );

            me._camera = new THREE.PerspectiveCamera( 45, me.getResolution()[0] / me.getResolution()[1], 0.01, 1000 );
            me._camera.position.z = 2;

            me._controls = new THREE.OrbitControls( me._camera, me._renderer.domElement );
            me._controls.center.set( 0.0, 0.0, 0.0 );

            me._rtTexture = new THREE.WebGLRenderTarget( me.getResolution()[0], me.getResolution()[1], { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat} );

            me._rtTexture.wrapS = me._rtTexture.wrapT = THREE.ClampToEdgeWrapping;
            
            me._materialFirstPass = new THREE.ShaderMaterial( {
                vertexShader: document.getElementById( 'vertexShaderFirstPass' ).textContent,
                fragmentShader: document.getElementById( 'fragmentShaderFirstPass' ).textContent,
                attributes: {
                    vertColor: {type: 'c', value: [] }
                },
                side: THREE.BackSide,
                transparent: true
            } );
            
            me._materialSecondPass = new THREE.ShaderMaterial( {
                vertexShader: document.getElementById( 'vertexShaderSecondPass' ).textContent,
                fragmentShader: document.getElementById( 'fragmentShaderSecondPass' ).textContent,
                attributes: {
                    vertColor: {type: 'c', value: [] }
                },
                uniforms: {
                    uBackCoord:       { type: "t",  value: me._rtTexture }, 
                    uSliceMaps:       { type: "tv", value: me._textures }, 
                    // uTransferFunction:{ type: "t",  value: transferTexture },

                    uSteps:           { type: "f", value: me._steps },
                    uNumberOfSlices:  { type: "f", value: me.getSlicesGap()[1] },
                    uSlicesOverX:     { type: "f", value: me._slicemap_row_col[0] },
                    uSlicesOverY:     { type: "f", value: me._slicemap_row_col[1] },
                    uOpacityVal:      { type: "f", value: me._opacity_factor },
                    uColorVal:        { type: "f", value: me._color_factor },
                    uMinGrayVal:      { type: "f", value: me._gray_value[0] },
                    uMaxGrayVal:      { type: "f", value: me._gray_value[1] }
                },
                side: THREE.FrontSide,
                transparent: true
            });

            me._sceneFirstPass = new THREE.Scene();
            me._sceneSecondPass = new THREE.Scene();

            var originalDimension = new GeometryDimension();

            var geometryHelper = new GeometryHelper();
            geometry = geometryHelper.createBoxGeometry(originalDimension);

            geometry.applyMatrix( new THREE.Matrix4().makeTranslation( -0.5, -0.5, -0.5 ) );
            geometry.applyMatrix( new THREE.Matrix4().makeRotationX(Math.PI));

            geometry.doubleSided = true;
            
            me._meshFirstPass = new THREE.Mesh( geometry.clone(), me._materialFirstPass );
            me._meshSecondPass = new THREE.Mesh( geometry.clone(), me._materialSecondPass );
                    
            me._sceneFirstPass.add( me._meshFirstPass );
            me._sceneSecondPass.add( me._meshSecondPass );

            stats = new Stats();
            // stats.setMode( 1 );
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.top = '0px';
            container.appendChild( stats.domElement );

            window.addEventListener( 'resize', function() {
                me.onResize.Call();

            }, false );

            me._controls.addEventListener("change", function() {
                me.onCameraChange.Call();

            });

            me._controls.addEventListener("start", function() {
                me.onCameraChangeStart.Call();

            });

            me._controls.addEventListener("end", function() {
                me.onCameraChangeEnd.Call();

            });

        };

        // me.setConfig = function(config) {
        //     me._steps              = config['steps']             ? config['steps'] : me._steps;
        //     me._slices_gap         = config['slices_gap']        ? config['slices_gap'] : me._slices_gap;
        //     me._border_XX          = config['border_XX']         ? config['border_XX'] : me._border_XX;
        //     me._border_YY          = config['border_YY']         ? config['border_YY'] : me._border_YY;
        //     me._border_ZZ          = config['border_ZZ']         ? config['border_ZZ'] : me._border_ZZ;
        //     me._images             = config['images']            ? config['images'] : me._images;
        //     me._opacity_factor     = config['opacity_factor']    ? config['opacity_factor'] : me._opacity_factor;
        //     me._color_factor       = config['color_factor']      ? config['color_factor'] : me._color_factor;
        //     me._render_resolution  = config['resolution']        ? config['resolution'] : me._render_resolution;
        //     me._render_clear_color = config['backgound']         ? config['backgound'] : me._render_clear_color;

        //     me._updateUniforms();
        // };

        me._setTextures = function(images) {
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

            me._textures = textures;

        };

        me.setImages = function(images) {
            me._images = images;
            me._setTextures(images);
            me._materialSecondPass.uniforms.uSliceMaps.value = me._textures;
            console.log("Core: setImages()");
        };

        me.setSteps = function(steps) {
            me._steps = steps;
            me._materialSecondPass.uniforms.uSteps.value = me._steps;
            console.log("Core: setSteps()");
        };

        me.setSlicesGap = function(from, to) {
            me._slices_gap = [from, to];
            me._materialSecondPass.uniforms.uNumberOfSlices.value = me.getSlicesGap()[1];
            console.log("Core: setSlicesGap()");
        };

        me.setOpacityFactor = function(opacity_factor) {
            me._opacity_factor = opacity_factor;
            me._materialSecondPass.uniforms.uOpacityVal.value = me._opacity_factor;
            console.log("Core: setOpacityFactor()");
        };

        me.setColorFactor = function(color_factor) {
            me._color_factor = color_factor;
            me._materialSecondPass.uniforms.uColorVal.value = me._color_factor;
            console.log("Core: setColorFactor()");
        };

        me.setAbsorptionMode = function(mode_index) {
            me._absorption_mode_index = mode_index;
            console.log("Core: setAbsorptionMode()");
        };

        me.setBordersXX = function(x0, x1) {
            me._border_XX = [x0, x1];
            console.log("Core: setBordersXX()");
        };

        me.setBordersYY = function(y0, y1) {
            me._border_YY = [y0, y1];
            console.log("Core: setBordersYY()");
        };

        me.setBordersZZ = function(z0, z1) {
            me._border_ZZ = [z0, z1];            
            console.log("Core: setBordersZZ()");
        };

        me.setResolution = function(width, height) {
            me._render_resolution = [width, height];
            me._renderer.setSize(me.getResolution()[0], me.getResolution()[1]);
            me._camera.aspect = me.getResolution()[0] / me.getResolution()[1];
            console.log("Core: setResolution()");
        };

        me.setBackgoundColor = function(color) {
            me._render_clear_color = color;
            me._renderer.setClearColor(color);
            console.log("Core: setBackgoundColor()");
        };

        me.setRowCol = function(row, col) {
            me._slicemap_row_col = [row, col];
            me._materialSecondPass.uniforms.uSlicesOverX.value = me._slicemap_row_col[0];
            me._materialSecondPass.uniforms.uSlicesOverY.value = me._slicemap_row_col[1];
            console.log("Core: setRowCol()");
        };

        me.setMinGrayValue = function(value) {
            me._gray_value[0] = value;
            me._materialSecondPass.uniforms.uMinGrayVal.value = me._gray_value[0];
            console.log("Core: setMinGrayValue()");
        };

        me.setMaxGrayValue = function(value) {
            me._gray_value[1] = value;
            me._materialSecondPass.uniforms.uMaxGrayVal.value = me._gray_value[1];
            console.log("Core: setMaxGrayValue()");
        };

        me.onPreDraw           = new RC.Delegate();
        me.onPostDraw          = new RC.Delegate();
        me.onResize            = new RC.Delegate();
        me.onCameraChange      = new RC.Delegate();
        me.onCameraChangeStart = new RC.Delegate();
        me.onCameraChangeEnd   = new RC.Delegate();

        me.draw = function(fps) {
            me.onPreDraw.Call(fps.toFixed(3));

            me._renderer.render( me._sceneFirstPass, me._camera, me._rtTexture, true );

            //Render the second pass and perform the volume rendering.
            me._renderer.render( me._sceneSecondPass, me._camera );

            stats.update();

            me.onPostDraw.Call(fps.toFixed(3));

        };

        me.getSteps = function() {
            return me._steps;
        };

        me.getImages = function() {
            return me._images;
        };

        me.getRowCol = function() {
            return me._slicemap_row_col;
        };

        me.getSlicesGap  = function() {
            var from = me._slices_gap[0];
            var to = me._slices_gap[1];
            if(me._slices_gap[1] == '*') {
                to = me.getRowCol()[0] * me.getRowCol()[1] * me.getImages().length;
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

        return me;

    };

    namespace.Core = Core;

})(window.RC);