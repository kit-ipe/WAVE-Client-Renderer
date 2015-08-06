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

// vs_first_pass = ["#ifdef GL_FRAGMENT_PRECISION_HIGH",
//                 "precision highp int;",
//                 "precision highp float;",
//             "#else",
//                 "precision mediump int;",
//                 "precision mediump float;",
//             "#endif",

//             "attribute vec4 vertColor;",

//             "varying vec4 backColor;",
//             "varying vec4 pos;",

//             "void main(void)",
//             "{",
//             "    backColor = vertColor;",

//             "    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
//             "    gl_Position = pos;",
//             "}"].join('\n');

(function(namespace) {
    var Core = function() {

        var me = {};

        me._steps                 = 20;
        me._slices_gap            = [0,    '*'];
        me._slicemap_row_col      = [16,   16];
        me._gray_value            = [0.0, 1.0];
        me._images                = [];
        me._textures              = [];
        me._opacity_factor        = 1.0;
        me._color_factor          = 1.0;
        me._absorption_mode_index = 0.0;
        me._render_resolution     = ['*', '*'];
        me._render_clear_color    = "#ffffff";
        me._transfer_function     = [];
        me._geometry_dimension    = {"xmin": 0.0, "xmax": 1.0, "ymin": 0.0, "ymax": 1.0, "zmin": 0.0, "zmax": 1.0};

        me._firtsPassMaterial     = {};
        me._secondPassMaterial    = {};

        me._container = {};
        me._renderer = {};
        me._camera = {};
        me._rtTexture = {};

        me._geometry = {};
        me._materialFirstPass     = {};
        me._materialSecondPass    = {};

        me._sceneFirstPass        = {};
        me._sceneSecondPass       = {};

        me._meshFirstPass         = {};
        me._meshSecondPass        = {};

        me._shaders = new RC.Shaders();

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
                    uSliceMaps:           { type: "tv", value: me._textures }, 
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

            me._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( -0.5, -0.5, -0.5 ) );
            me._geometry.applyMatrix( new THREE.Matrix4().makeRotationX(Math.PI));
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

            me._transfer_function = me._genTransferTexture(
                        [
                        {"pos": 0.25, "color": "#ff0000"},
                        {"pos": 0.5,  "color": "#00ff00"},
                        {"pos": 0.75, "color": "#0000ff"},

                        ],

                        [10, 255]
                    );

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

        me._genTransferTexture = function(colors, size) {
            var canvas = document.createElement('canvas');
            canvas.width  = size[1];
            canvas.height = size[0];

            var ctx = canvas.getContext('2d');
            
            var grd = ctx.createLinearGradient(0, 0, canvas.width -1 , canvas.height - 1);

            for(var i=0; i<colors.length; i++) {
                grd.addColorStop(colors[i].pos, colors[i].color);

            }

            ctx.fillStyle = grd;
            ctx.fillRect(0,0,canvas.width ,canvas.height);

            var img = document.getElementById("transferFunctionImg");
            img.src = canvas.toDataURL();
            img.style.width = size[0] + " px";
            img.style.height = size[1] + " px";

            var transferTexture =  new THREE.Texture(canvas);
            transferTexture.wrapS = transferTexture.wrapT =  THREE.ClampToEdgeWrapping;
            transferTexture.flipY = true;
            transferTexture.needsUpdate = true;

            me._materialSecondPass.uniforms.uTransferFunction.value = transferTexture;

            return transferTexture;  
        };

        me._updateGeometry = function(geometryDimension) {
            var geometry      = (new GeometryHelper()).createBoxGeometry(geometryDimension);
            var colorArray    = geometry.attributes.vertColor.array;
            var positionArray = geometry.attributes.position.array;

            me._geometry.attributes.vertColor.array = colorArray;
            me._geometry.attributes.vertColor.needsUpdate = true;

            me._geometry.attributes.position.array = positionArray;
            me._geometry.attributes.position.needsUpdate = true;

            me._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( -0.5, -0.5, -0.5 ) );
            me._geometry.applyMatrix( new THREE.Matrix4().makeRotationX(Math.PI));
            me._geometry.doubleSided = true;
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
            me._materialSecondPass.uniforms.uAbsorptionModeIndex.value = me._absorption_mode_index;
            console.log("Core: setAbsorptionMode()");
        };

        me.setGeometryMinX = function(value) {
            me._geometry_dimension["xmin"] = value;
            me._updateGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMinX()");
        };

        me.setGeometryMaxX = function(value) {
            me._geometry_dimension["xmax"] = value;
            me._updateGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMaxX()");
        };

        me.setGeometryMinY = function(value) {
            me._geometry_dimension["ymin"] = value;
            me._updateGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMinY()");
        };

        me.setGeometryMaxY = function(value) {
            me._geometry_dimension["ymax"] = value;
            me._updateGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMaxY()");
        };

        me.setGeometryMinZ = function(value) {
            me._geometry_dimension["zmin"] = value;
            me._updateGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMinZ()");
        };

        me.setGeometryMaxZ = function(value) {
            me._geometry_dimension["zmax"] = value;
            me._updateGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMaxZ()");
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

        me.setTransferFunction = function(colors, size) {
            me._genTransferTexture(colors, size);

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

        return me;

    };

    namespace.Core = Core;

})(window.RC);