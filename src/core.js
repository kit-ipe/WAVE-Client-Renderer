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

    this._render = new THREE.WebGLRenderer({ antialias: true, alpha : true });  
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
    
    /*
    var tex2 = THREE.ImageUtils.loadTexture( "http://katrin.kit.edu/vis/tmp/zoom_0.png" );
    var cm2 = THREE.ImageUtils.loadTexture( "http://katrin.kit.edu/static/colormaps/cm_viridis.png" );
    var gm2 = THREE.ImageUtils.loadTexture( "http://katrin.kit.edu/static/colormaps/cm_Greys.png" );
    tex2.minFilter = THREE.LinearFilter;
    cm2.minFilter = THREE.LinearFilter;
    gm2.minFilter = THREE.LinearFilter;
    var shaderCode2 = document.getElementById("fragShaderHourly").innerHTML;
    var uniforms2 = {};
    uniforms2.resolution = {type:'v2',value:new THREE.Vector2(overview.offsetWidth,overview.offsetHeight)};
    uniforms2.texture2 = {type:'t',value:tex2};
    */
    // 2D
    //var tex2 = THREE.ImageUtils.loadTexture( "dataset/slicemap_0_blue_line.png" );
    this._tex1 = THREE.ImageUtils.loadTexture( "dataset/image01_2014_03_17_01.png" );
    this._tex1.minFilter = THREE.LinearFilter;
    this._tex2 = THREE.ImageUtils.loadTexture( "dataset/image01_2014_03_17_02.png" );
    this._tex2.minFilter = THREE.LinearFilter;
    
    //console.log("CHECK!!");
    //console.log(this._shaders["secondPass2DCustom"].fragmentShader);
    
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
            resolution: {type: 'v2',value: new THREE.Vector2(512,512)}
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


Core.prototype.setShader = function(codeblock) {
    console.log("apply new Shader.");
    console.log(codeblock);
    
    var header = "uniform vec2 resolution; \
    precision mediump int; \
    precision mediump float; \
    varying vec4 pos; \
    uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>]; \
    uniform sampler2D texture1; \
    uniform sampler2D texture2; \
    void main(void) { \
    vec2 pos = gl_FragCoord.xy / resolution.xy; \
    float b1, b2, b3, b4, b5, b6; \
    vec3 t1, t2; \
    t1 = texture2D(texture1, pos).xyz; \
    t2 = texture2D(texture2, pos).xyz; \
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
            resolution: {type: 'v2', value: new THREE.Vector2(512,512)}
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
