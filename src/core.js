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
        me._slicemaps_paths       = [];
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

            var geometryHelper = new VRC.GeometryHelper();
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

            }, true);

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
            var geometry      = (new VRC.GeometryHelper()).createBoxGeometry(geometryDimension);
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

        me.setSlicemapsImages = function(images, imagesPaths) {
            me._slicemaps_images = images;
            me._slicemaps_paths = imagesPaths != undefined ? imagesPaths : me._slicemaps_paths;
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

        me.setGeometryDimension = function(key, value) {
            me._geometry_dimension[key] = value;
            me._setGeometry(me._geometry_dimension);
            console.log("Core: setGeometryMaxZ()");
        };

        me.setResolution = function(width, height) {
            me._render_resolution = [width, height];
            
            if(me._render_resolution[0] == '*' || me._render_resolution[1] == '*') {
                me.onResize.start(me._onWindowResizeFuncIndex);
            } else {
                me.onResize.stop(me._onWindowResizeFuncIndex);

            }

            var width = me.getResolution()[0];
            var height = me.getResolution()[1];

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

        me.getSlicemapsPaths = function() {
            return me._slicemaps_paths;
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
                width = window.outerWidth;
            } 
            if(me._render_resolution[1] == '*') {
                height = window.outerHeight;
            }

            return [width, height];
        };

        me.getGeometryDimension = function() {
            return me._geometry_dimension;
        };

        me.getGrayMinValue = function() {
            return me._gray_value[0];
        };

        me.getGrayMaxValue = function() {
            return me._gray_value[1]; 
        }; 

        me.getClearColor = function() {
            return me._render_clear_color;
        };

        me.getTransferFunctionColors = function() {
            return me._transfer_function_colors;
        };

        me.getOpacityFactor = function() {
            return me._opacity_factor;
        };

        me.getColorFactor = function() {  
            return me._color_factor;
        };

        me.getAbsorptionMode = function() {
            return me._absorption_mode_index;
        };

        me.getClearColor = function() {
            return me._render_clear_color;
        };

        me.getDomContainerId = function() {
            return me._dom_container_id;
        };

        return me;

    };

    namespace.Core = Core;

})(window.VRC);