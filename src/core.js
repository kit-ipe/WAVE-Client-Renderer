/**
 * @classdesc
 * Core
 *
 * @class Core
 * @this {Core}
 * @maintainer nicholas.jerome@kit.edu
 */

var Core = function(conf) {

    this.version = "1.0.1";

    // Zoom Box parameters
    this._zoom_parameters = {
        xmin: 0.0,
        xmax: 1.0,
        ymin: 0.0,
        ymax: 1.0,
        zmin: 0.0,
        zmax: 1.0
    }

    // General Parameters
    this.zFactor = conf.zFactor != undefined ? conf.zFactor : 1;
    this._steps = conf.steps == undefined ? 20 : conf.steps;
    this._slices_gap = typeof conf.slices_range == undefined ? [0, '*'] : conf.slices_range;

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

    this._transfer_function_colors = [
        {"color": "#000000", "pos": 0.0},
        {"color": "#ffffff", "pos": 1.0}
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
            "x": 0,
            "y": 0,
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
            this._camera_settings.setZ(2);
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

    // this._container.removeChild( this._container.firstChild );
    this._container.innerHTML=" ";

    this._container.appendChild( this._render.domElement );

    this._camera = new THREE.PerspectiveCamera(
        45,
        this.getRenderSizeInPixels()[0] / this.getRenderSizeInPixels()[1],
        0.01,
        11
    );
    this._camera.position.set(
        this._camera_settings["position"]["x"],
        this._camera_settings["position"]["y"],
        this._camera_settings["position"]["z"]
    );

    this._camera.rotation.set(
        this._camera_settings["rotation"]["x"],
        this._camera_settings["rotation"]["y"],
        this._camera_settings["rotation"]["z"]
    );

    this.isAxisOn = false;

    // Control
    this._controls = new THREE.TrackballControls(
        this._camera,
        this._render.domElement);
    this._controls.rotateSpeed = 2.0;
    this._controls.zoomSpeed = 2.0;
    this._controls.panSpeed = 2.0;

    this._controls.noZoom = false;
    this._controls.noPan = true;

    this._controls.staticMoving = true;
    this._controls.dynamicDampingFactor = 0.1;

    this._controls.autoRotate = true;


    this._rtTexture = new THREE.WebGLRenderTarget(
        this.getRenderSizeInPixels()[0],
        this.getRenderSizeInPixels()[1],
        {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            wrapS:  THREE.ClampToEdgeWrapping,
            wrapT:  THREE.ClampToEdgeWrapping,
            format: THREE.RGBFormat,
            type: THREE.UnsignedByteType,
            generateMipmaps: false
        }
    );

        this._materialFirstPass = new THREE.ShaderMaterial( {
        vertexShader: this._shaders.firstPass.vertexShader,
        fragmentShader: this._shaders.firstPass.fragmentShader,
        side: THREE.FrontSide,
        //side: THREE.BackSide,
        transparent: true
        } );

        // TODO: Load colourmap, but should be from local
        //var cm = THREE.ImageUtils.loadTexture( "http://katrin.kit.edu/vis/colormap/cm_jet.png" );
        //cm.minFilter = THREE.LinearFilter;
        this._materialSecondPass = new THREE.ShaderMaterial( {
        vertexShader: this._shaders[this._shader_name].vertexShader,
        fragmentShader: ejs.render( this._shaders[this._shader_name].fragmentShader, {
            "maxTexturesNumber": me.getMaxTexturesNumber()}),
        uniforms: {
            uRatio : { type: "f", value: this.zFactor},
            uBackCoord: { type: "t",  value: this._rtTexture.texture },
            uSliceMaps: { type: "tv", value: this._slicemaps_textures },
            uSetViewMode: {type:"i", value: 0 },
            uSteps: { type: "i", value: this._steps },
            uSlicemapWidth: { type: "f", value: this._slicemaps_width },
            uNumberOfSlices: { type: "f", value: parseFloat(this.getSlicesRange()[1]) },
            uSlicesOverX: { type: "f", value: this._slicemap_row_col[0] },
            uSlicesOverY: { type: "f", value: this._slicemap_row_col[1] },
            uOpacityVal: { type: "f", value: this._opacity_factor },
            uTransferFunction: { type: "t",  value: this._transfer_function },
            uMinGrayVal: { type: "f", value: this._gray_value[0] },
            uMaxGrayVal: { type: "f", value: this._gray_value[1] },
            uIndexOfImage: { type: "f", value: this._indexOfImage }
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

        var mesh_zoom = new THREE.Mesh(
            new THREE.BoxGeometry( 1.0, 1.0, 1.0 ),
            new THREE.MeshNormalMaterial()
        );
        this._wireframe_zoom = new THREE.BoxHelper( mesh_zoom );
        this._wireframe_zoom.material.color.set( 0x0000ff );
        //this._sceneSecondPass.add( this._wireframe_zoom );
        
        // parent
        this._parent = new THREE.Object3D();
        this._sceneSecondPass.add( this._parent );
        // pivot
        this._pivot = new THREE.Object3D();
        this._parent.add( this._pivot );


    this.setTransferFunctionByColors(this._transfer_function_colors);
    this.setGeometryDimensions(this.getGeometryDimensions());


    window.addEventListener( 'resize', function() {
        //console.log("WAVE: trigger: resize");
        me.onResizeWindow.call();
    }, false );

    this._controls.addEventListener("change", function() {
        //console.log("WAVE: trigger: change");
        me.onCameraChange.call();
    });

    this._controls.addEventListener("scroll", function() {
        //console.log("WAVE: trigger: scroll");
        me.onCameraChange.call();
    });

    this._controls.addEventListener("start", function() {
        //console.log("WAVE: start trigger");
        me.onCameraChangeStart.call();
    });

    this._controls.addEventListener("end", function() {
        //console.log("WAVE: end trigger");
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


/**
 * API 
 *
 **/
Core.prototype.getVersion = function() {
    console.log(this.version);
};


Core.prototype._setUpBox = function(parameters) {
    width = parameters.xmax - parameters.xmin;
    height = parameters.ymax - parameters.ymin;
    depth = parameters.zmax - parameters.zmin;
    this._wireframe_zoom.scale.x = width;
    this._wireframe_zoom.scale.y = height;
    this._wireframe_zoom.scale.z = depth;
    this._wireframe_zoom.position.x = (parameters.xmax - 0.5) - (width / 2.0 );
    this._wireframe_zoom.position.y = (parameters.ymax - 0.5) - (height / 2.0 );
    this._wireframe_zoom.position.z = (parameters.zmax - 0.5) - (depth / 2.0 );
};


Core.prototype.setZoomColor = function(value) {
    this._wireframe_zoom.material.color.set( value );
};


Core.prototype.setZoomXMinValue = function(value) {
    this._zoom_parameters.xmin = value;
    this._setUpBox( this._zoom_parameters );
};


Core.prototype.setZoomXMaxValue = function(value) {
    this._zoom_parameters.xmax = value;
    this._setUpBox( this._zoom_parameters );
};


Core.prototype.setZoomYMinValue = function(value) {
    this._zoom_parameters.ymin = value;
    this._setUpBox( this._zoom_parameters );
};


Core.prototype.setZoomYMaxValue = function(value) {
    this._zoom_parameters.ymax = value;
    this._setUpBox( this._zoom_parameters );
};


Core.prototype.setZoomZMinValue = function(value) {
    this._zoom_parameters.zmin = value;
    this._setUpBox( this._zoom_parameters );
};


Core.prototype.setZoomZMaxValue = function(value) {
    this._zoom_parameters.zmax = value;
    this._setUpBox( this._zoom_parameters );
};


Core.prototype.showZoomBox = function(value) {
    if (value == true) {
        this._sceneSecondPass.add( this._wireframe_zoom );
    } else {
        this._sceneSecondPass.remove( this._wireframe_zoom );
    }
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype._secondPassSetUniformValue = function(key, value) {
    this._materialSecondPass.uniforms[key].value = value;
};


Core.prototype._setSlicemapsTextures = function(imagePaths) {
    var allPromises = [];
    var me = this;
    var textures = [];
    var loader = new THREE.TextureLoader();
    loader.crossOrigin = ''; 
    
    imagePaths.forEach( function( path ) {
        allPromises.push( new Promise( function( resolve, reject ) {

            loader.load(path, function (texture) {
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearFilter;
                texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.generateMipmaps = false;
                texture.flipY = false;
                texture.needsUpdate = true;
                //textures.push(texture);
                resolve( texture );
            }, 
            function( xhr ) {
               // Progress callback of TextureLoader
               // ...
            },    
            function (err) {
                console.log(err);
                console.log("error");
            });
        }));
    });
    Promise.all( allPromises )
        .then( function( promises ) {
            // All textures are now loaded, and this array
            // contains all the materials that you created
            me._secondPassSetUniformValue("uSliceMaps", promises);
            this._slicemaps_textures = promises;
            this._slicemaps_width = promises[0].image.width;
            me._secondPassSetUniformValue("uSlicemapWidth", this._slicemaps_width);
        }, function( error ) {
            console.error( "Could not load all textures:", error );
        });
};


Core.prototype.setTransferFunctionByImage = function(image) {
    this._transfer_function_as_image = image;
    var texture = new THREE.Texture(image);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT =  THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.flipY = true;
    texture.needsUpdate = true;
    this._secondPassSetUniformValue("uTransferFunction", texture);
    //this.onChangeTransferFunction.call(image);
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


        this._materialSecondPass = new THREE.ShaderMaterial( {
            vertexShader: this._shaders[this._shader_name].vertexShader,
            fragmentShader: ejs.render(
                this._shaders[this._shader_name].fragmentShader,
                {"maxTexturesNumber": this.getMaxTexturesNumber()}
            ),
            //attributes: {
            //    vertColor: {type: 'c', value: [] }
            //},
            uniforms: {
                uRatio : { type: "f", value: this.zFactor},
                uBackCoord: { type: "t",  value: this._rtTexture.texture },
                uSliceMaps: { type: "tv", value: this._slicemaps_textures },
                uSetViewMode: {type:"i", value: 0 },
                uNumberOfSlices: { type: "f", value: parseFloat(this.getSlicesRange()[1]) },
                uSlicemapWidth: { type: "f", value: this._slicemaps_width},
                uSlicesOverX: { type: "f", value: this._slicemap_row_col[0] },
                uSlicesOverY: { type: "f", value: this._slicemap_row_col[1] },
                uOpacityVal: { type: "f", value: this._opacity_factor },
            },
            side: THREE.BackSide,
            transparent: true
        });

        this._meshSecondPass = new THREE.Mesh( this._geometry, this._materialSecondPass );

        this._sceneSecondPass = new THREE.Scene();
        this._sceneSecondPass.add( this._meshSecondPass );
}


Core.prototype.setZoom = function(x1, x2, y1, y2) {
    //this._material2D.uniforms["uZoom"].value = new THREE.Vector4(0.1875, 0.28125, 0.20117, 0.29492);
    this._material2D.uniforms["uZoom"].value = new THREE.Vector4(x1, x2, y1, y2);
    //uSetViewMode: {type: "i", value: 0 }
    //this._material2D.uniforms.uZoom.value = {type: "i", value: 1 };
}

Core.prototype.set2DTexture = function(urls) {
    var chosen_cm = THREE.ImageUtils.loadTexture( urls[0] );
    var chosen_cm2 = THREE.ImageUtils.loadTexture( urls[1] );

    chosen_cm.minFilter = THREE.NearestFilter;
    chosen_cm2.minFilter = THREE.NearestFilter;

    this._material2D.uniforms["texture1"].value = chosen_cm ;
    this._material2D.uniforms["texture2"].value = chosen_cm2;
    this._material2D.needsUpdate = true;
}

Core.prototype.setShaderName = function(value) {

    // new THREE.BoxGeometry( 1, 1, 1 ),

    this._shader_name = value;
    // this._shader_name =  conf.shader_name;

        this._materialSecondPass = new THREE.ShaderMaterial( {
            vertexShader: this._shaders[this._shader_name].vertexShader,
            fragmentShader: ejs.render( this._shaders[this._shader_name].fragmentShader, {
                "maxTexturesNumber": this.getMaxTexturesNumber()
            }),
            uniforms: {
                uRatio : { type: "f", value: this.zFactor},
                uBackCoord: { type: "t",  value: this._rtTexture.texture },
                uSliceMaps: { type: "tv", value: this._slicemaps_textures },
                uSetViewMode: {type:"i", value: 0 },
                uSteps: { type: "i", value: this._steps },
                uSlicemapWidth: { type: "f", value: this._slicemaps_width },
                uNumberOfSlices: { type: "f", value: parseFloat(this.getSlicesRange()[1]) },
                uSlicesOverX: { type: "f", value: this._slicemap_row_col[0] },
                uSlicesOverY: { type: "f", value: this._slicemap_row_col[1] },
                uOpacityVal: { type: "f", value: this._opacity_factor },
                uTransferFunction: { type: "t",  value: this._transfer_function },
                uMinGrayVal: { type: "f", value: this._gray_value[0] },
                uMaxGrayVal: { type: "f", value: this._gray_value[1] },
                uIndexOfImage: { type: "f", value: this._indexOfImage },
            },
            //side: THREE.FrontSide,
            side: THREE.BackSide,
            transparent: true
        });


        this._meshSecondPass = new THREE.Mesh( this._geometry, this._materialSecondPass );

        this._sceneSecondPass = new THREE.Scene();
        this._sceneSecondPass.add( this._meshSecondPass );

        this.showWireframe(true);
}
/////////////////////////////////////////////////////////////////////



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
    this._slicemaps_images = images;
    this._slicemaps_paths = imagesPaths != undefined ? imagesPaths : this._slicemaps_paths;
    this._setSlicemapsTextures(images);
    this._secondPassSetUniformValue("uSliceMaps", this._slicemaps_textures);
};


Core.prototype.setSteps = function(steps) {
    this._steps = steps;
    this._secondPassSetUniformValue("uSteps", this._steps);
};


Core.prototype.setSlicesRange = function(from, to) {
    this._slices_gap = [from, to];
    this._secondPassSetUniformValue("uNumberOfSlices", parseFloat(this.getSlicesRange()[1]));
};


Core.prototype.setOpacityFactor = function(opacity_factor) {
    this._opacity_factor = opacity_factor;
    this._secondPassSetUniformValue("uOpacityVal", this._opacity_factor);
};


Core.prototype.setColorFactor = function(color_factor) {
    this._color_factor = color_factor;
    this._secondPassSetUniformValue("darkness", this._color_factor);
};


Core.prototype.setAbsorptionMode = function(mode_index) {
    this._absorption_mode_index = mode_index;
    this._secondPassSetUniformValue("uAbsorptionModeIndex", this._absorption_mode_index);
};

Core.prototype.setIndexOfImage = function(indexOfImage) {
    this._indexOfImage = indexOfImage;
    this._secondPassSetUniformValue("uIndexOfImage", this._indexOfImage);
};


Core.prototype.setVolumeSize = function(width, height, depth) {
    this._volume_sizes = [width, height, depth];

    var maxSize = Math.max(this.getVolumeSize()[0], this.getVolumeSize()[1], this.getVolumeSize()[2]);
    var normalizedVolumeSizes = [this.getVolumeSize()[0] / maxSize,  this.getVolumeSize()[1] / maxSize, this.getVolumeSize()[2] / maxSize];

    this._setGeometry(this.getGeometryDimensions(), normalizedVolumeSizes);
};


Core.prototype.setGeometryDimensions = function(geometryDimension) {
    this._geometry_dimensions = geometryDimension;

    this._setGeometry(this._geometry_dimensions, this.getVolumeSizeNormalized());
};


Core.prototype.setRenderCanvasSize = function(width, height) {
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
    this._render_clear_color = color;
    this._render.setClearColor(color);
};


Core.prototype.setRowCol = function(row, col) {
    this._slicemap_row_col = [row, col];
    this._secondPassSetUniformValue("uSlicesOverX", this._slicemap_row_col[0]);
    this._secondPassSetUniformValue("uSlicesOverY", this._slicemap_row_col[1]);
};


Core.prototype.setGrayMinValue = function(value) {
    this._gray_value[0] = value;
    this._secondPassSetUniformValue("uMinGrayVal", this._gray_value[0]);
};


Core.prototype.setGrayMaxValue = function(value) {
    this._gray_value[1] = value;
    this._secondPassSetUniformValue("uMaxGrayVal", this._gray_value[1]);
};


Core.prototype.startRotate = function() {
    this._isRotate = true;
};


Core.prototype.stopRotate = function() {
    this._isRotate = false;
};


Core.prototype.showWireframe = function(value) {
    if (value == true) {
        this._sceneSecondPass.add( this._wireframe );
    } else {
        this._sceneSecondPass.remove( this._wireframe );
    }
    //this._render.render( this._sceneFirstPass, this._camera, this._rtTexture.texture, true );
    //this._render.render( this._sceneFirstPass, this._camera );
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.setAxis = function(value) {
    if (this.isAxisOn) {
        this._sceneSecondPass.remove(this._axes);
        this.isAxisOn = false;
    } else {
        this._sceneSecondPass.add(this._axes);
        this.isAxisOn = true;
    }

    this._render.render( this._sceneFirstPass, this._camera, this._rtTexture.texture, true );
    this._render.render( this._sceneFirstPass, this._camera );

    // Render the second pass and perform the volume rendering.
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.showISO = function() {
    this._secondPassSetUniformValue("uSetViewMode", 1);
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.showVolren = function() {
    this._secondPassSetUniformValue("uSetViewMode", 0);
    this._render.render( this._sceneSecondPass, this._camera );
};


Core.prototype.draw = function() {
    this._controls.update();
    this._render.render( this._sceneFirstPass, this._camera, this._rtTexture, true );
    this._render.render( this._sceneFirstPass, this._camera );
    this._render.render( this._sceneSecondPass, this._camera );
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
    var maxSize = Math.max(this.getVolumeSize()[0],
                           this.getVolumeSize()[1],
                           this.getVolumeSize()[2]);
    var normalizedVolumeSizes = [
        parseFloat(this.getVolumeSize()[0]) / parseFloat(maxSize),
        parseFloat(this.getVolumeSize()[1]) / parseFloat(maxSize),
        parseFloat(this.getVolumeSize()[2]) / parseFloat(maxSize)];

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

// Core.prototype.getIndexOfImage = function() {
//     return this._indexOfImage;
// };


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
