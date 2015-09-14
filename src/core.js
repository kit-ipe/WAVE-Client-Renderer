/**
 * @classdesc
 * Core
 * 
 * @class Core
 * @this {Core}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 *
 */

var Core = function(domContainerId) {
    this._steps                      = 20;
    this._slices_gap                 = [0,    '*'];
    this._slicemap_row_col           = [16,   16];
    this._gray_value                 = [0.0, 1.0];
    this._slicemaps_images           = [];
    this._slicemaps_paths            = [];
    this._slicemaps_textures         = [];
    this._opacity_factor             = 20.0;
    this._color_factor               = 3.0;
    this._absorption_mode_index      = 1.0;
    this._render_size                = ['*', '*'];
    this._canvas_size                = ['*', '*'];
    this._render_clear_color         = "#ffffff";
    this._transfer_function_as_image = new Image();
    this._volume_sizes               = [1024.0, 1024.0, 1024.0];
    this._geometry_dimensions        = {"xmin": 0.0, "xmax": 1.0, "ymin": 0.0, "ymax": 1.0, "zmin": 0.0, "zmax": 1.0};
    this._threshold_otsu_index       = 0;
    this._threshold_isodata_index    = 0;
    this._threshold_yen_index        = 0;
    this._threshold_li_index         = 0;

    this._transfer_function_colors   = [
        {"pos": 0.25, "color": "#892c2c"},
        {"pos": 0.5, "color": "#00ff00"},
        {"pos": 0.75, "color": "#0000ff"}
    ]

    this._dom_container_id           = domContainerId != undefined ? domContainerId : "container";
    this._dom_container              = {};
    this._render                   = {};
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

    this._render = new THREE.WebGLRenderer();
    this._render.setSize( this.getRenderSizeInPixels()[0], this.getRenderSizeInPixels()[1] );
    this._render.setClearColor( this._render_clear_color );

    this._container.appendChild( this._render.domElement );

    this._camera = new THREE.PerspectiveCamera( 45, this.getRenderSizeInPixels()[0] / this.getRenderSizeInPixels()[1], 0.01, 11 );
    this._camera.position.x = this._camera_settings["position"]["x"];
    this._camera.position.y = this._camera_settings["position"]["y"];
    this._camera.position.z = this._camera_settings["position"]["z"];

    this._camera.rotation.x = this._camera_settings["rotation"]["x"];
    this._camera.rotation.y = this._camera_settings["rotation"]["y"];
    this._camera.rotation.z = this._camera_settings["rotation"]["z"];

    this._controls = new THREE.OrbitControls( this._camera, this._render.domElement );
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
        fragmentShader: ejs.render( this._shaders.secondPass.fragmentShader, {"maxTexturesNumber": me.getMaxTexturesNumber()}),
        attributes: {
            vertColor:                       {type: 'c', value: [] }
        },
        uniforms: {
            uBackCoord:                      { type: "t",  value: this._rtTexture }, 
            uSliceMaps:                      { type: "tv", value: this._slicemaps_textures }, 
            uTransferFunction:               { type: "t",  value: this._transfer_function },

            uSteps:                          { type: "f", value: this._steps },
            uNumberOfSlices:                 { type: "f", value: this.getSlicesRange()[1] },
            uSlicesOverX:                    { type: "f", value: this._slicemap_row_col[0] },
            uSlicesOverY:                    { type: "f", value: this._slicemap_row_col[1] },
            uOpacityVal:                     { type: "f", value: this._opacity_factor },
            uColorVal:                       { type: "f", value: this._color_factor },
            uAbsorptionModeIndex:            { type: "f", value: this._absorption_mode_index },
            uMinGrayVal:                     { type: "f", value: this._gray_value[0] },
            uMaxGrayVal:                     { type: "f", value: this._gray_value[1] },
        },
        side: THREE.BackSide,
        // transparent: true,
        transparent: true
    });

    this._sceneFirstPass = new THREE.Scene();
    this._sceneSecondPass = new THREE.Scene();

    this._initGeometry( this.getGeometryDimensions(), this.getVolumeSizeNormalized() );
    
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
        me.setRenderSize('*', '*');

    }, false);

    this._onWindowResizeFuncIndex_canvasSize = this.onResizeWindow.add(function() {
        me.setRenderCanvasSize('*', '*');

    }, false);

    this.setTransferFunctionByColors(this._transfer_function_colors);

    this.setRenderSize(this.getRenderSize()[0], this.getRenderSize()[1]);
    this.setRenderCanvasSize(this.getCanvasSize()[0], this.getCanvasSize()[1]);

};

Core.prototype._secondPassSetUniformValue = function(key, value) {
    this._materialSecondPass.uniforms[key].value = value;

};

Core.prototype._setSlicemapsTextures = function(images) {
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

    this._slicemaps_textures = textures;

};

Core.prototype.setTransferFunctionByImage = function(image) {
    console.log("Core: setTransferFunctionByImage()");
    this._transfer_function_as_image = image;
    var transferTexture =  new THREE.Texture(image);
    transferTexture.wrapS = transferTexture.wrapT =  THREE.ClampToEdgeWrapping;
    transferTexture.magFilter = THREE.LinearFilter;
    transferTexture.minFilter = THREE.LinearFilter;
    transferTexture.flipY = true;
    transferTexture.needsUpdate = true;

    this._secondPassSetUniformValue("uTransferFunction", transferTexture);
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

Core.prototype._initGeometry = function(geometryDimensions, volumeSizes) {
    var geometryHelper = new VRC.GeometryHelper();
    this._geometry = geometryHelper.createBoxGeometry(geometryDimensions, volumeSizes);

    this._geometry.applyMatrix( new THREE.Matrix4().makeTranslation( -volumeSizes[0] / 2, -volumeSizes[1] / 2, -volumeSizes[2] / 2 ) );
    this._geometry.applyMatrix( new THREE.Matrix4().makeRotationX( this._geometry_settings["rotation"]["x"] ));
    this._geometry.applyMatrix( new THREE.Matrix4().makeRotationY( this._geometry_settings["rotation"]["y"] ));
    this._geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( this._geometry_settings["rotation"]["z"] ));
    this._geometry.doubleSided = true;

};

Core.prototype._setGeometry = function(geometryDimensions, volumeSizes) {
    var geometryHelper = new VRC.GeometryHelper();
    var geometry      = geometryHelper.createBoxGeometry(geometryDimensions, volumeSizes);
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
};

Core.prototype.setSteps = function(steps) {
    console.log("Core: setSteps(" + steps + ")");
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
    this._secondPassSetUniformValue("uColorVal", this._color_factor);
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

Core.prototype.setRenderSize = function(width, height) {
    console.log("Core: setRenderSize()");
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

    this._render.setSize(width, height);

    this.setRenderCanvasSize(this.getCanvasSize()[0], this.getCanvasSize()[1]);

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

Core.prototype.draw = function(fps) {
    this.onPreDraw.call(fps.toFixed(3));

    this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    // this._render.render( this._sceneFirstPass, this._camera );

    //Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );

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

window.VRC.Core = Core;