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