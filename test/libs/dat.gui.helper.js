guiControls = new function() {
	this.number_slices = -1;
	this.gray_min = -1;
	this.gray_max = -1;
	this.row_col = -1 + "x" + -1;
	this.steps = -1;
	this.renderer_size = -1;
	this.renderer_canvas_size = -1 + "x" + -1;
	this.absorption_mode = -1;
	this.opacity_factor = -1;
	this.color_factor = -1;
	this.x_min = -1;
	this.x_max = -1;
	this.y_min = -1;
	this.y_max = -1;
	this.z_min = -1;
	this.z_max = -1;
	
	this.auto_steps = -1;

	this.color1 = "";
	this.stepPos1 = -1;
	this.color2 = "";
	this.stepPos2 = -1;
	this.color3 = "";
	this.stepPos3 = -1;
};

var UpdateGUI = function(config) {
	guiControls.number_slices = config["slices_range"][1];
	guiControls.gray_min = config["gray_min"];
	guiControls.gray_max = config["gray_max"];
	guiControls.row_col = config["row_col"][0] + "x" + config["row_col"][1];
	guiControls.steps = config["steps"];
	guiControls.renderer_size = config["renderer_size"][0];
	guiControls.renderer_canvas_size = config["renderer_canvas_size"][0] + "x" + config["renderer_canvas_size"][1];
	guiControls.absorption_mode = config["absorption_mode"];
	guiControls.opacity_factor = config["opacity_factor"];
	guiControls.color_factor = config["color_factor"];
	guiControls.x_min = config["x_min"];
	guiControls.x_max = config["x_max"];
	guiControls.y_min = config["y_min"];
	guiControls.y_max = config["y_max"];
	guiControls.z_min = config["z_min"];
	guiControls.z_max = config["z_max"];
	
	guiControls.auto_steps = config["auto_steps"];

	guiControls.color1 = config["tf_colors"][0]["color"];
	guiControls.stepPos1 = config["tf_colors"][0]["pos"];
	guiControls.color2 = config["tf_colors"][1]["color"];
	guiControls.stepPos2 = config["tf_colors"][1]["pos"];
	guiControls.color3 = config["tf_colors"][2]["color"];
	guiControls.stepPos3 = config["tf_colors"][2]["pos"];

};

var InitGUI = function(rcl2, config) {
	UpdateGUI( config );

	var gui = new dat.GUI();

	var x_min_controller = gui.add(guiControls, 'x_min', 0, 1, 0.1).listen();
	x_min_controller.onChange(function(value) {
		rcl2.setGeometryMinX(value);
	});

	var x_max_controller = gui.add(guiControls, 'x_max', 0, 1, 0.1).listen();
	x_max_controller.onChange(function(value) {
		rcl2.setGeometryMaxX(value);
	});

	var y_min_controller = gui.add(guiControls, 'y_min', 0, 1, 0.1).listen();
	y_min_controller.onChange(function(value) {
		rcl2.setGeometryMinY(value);
	});

	var y_max_controller = gui.add(guiControls, 'y_max', 0, 1, 0.1).listen();
	y_max_controller.onChange(function(value) {
		rcl2.setGeometryMaxY(value);
	});

	var z_min_controller = gui.add(guiControls, 'z_min', 0, 1, 0.1).listen();
	z_min_controller.onChange(function(value) {
		rcl2.setGeometryMinZ(value);
	});

	var z_max_controller = gui.add(guiControls, 'z_max', 0, 1, 0.1).listen();
	z_max_controller.onChange(function(value) {
		rcl2.setGeometryMaxZ(value);
	});

	var steps_controller = gui.add(guiControls, 'steps', 15, 2048, 10).listen();
	steps_controller.onFinishChange(function(value) {
		rcl2.setSteps(value);
	});

	var number_slices_controller = gui.add(guiControls, 'number_slices', 1, 2048, 1).listen();
	number_slices_controller.onFinishChange(function(value) {
		rcl2.setSlicesRange(0, value);
	});

	var auto_steps_controller = gui.add(guiControls, 'auto_steps').listen();
	auto_steps_controller.onChange(function(value) {
		rcl2.setAutoStepsOn(value);
	});

	var absorbtion_mode_controller = gui.add(guiControls, 'absorption_mode', {"MIPS": 0, "X-ray": 1, "Maximum projection intensivity": 2}).listen();
	absorbtion_mode_controller.onChange(function(value) {
		rcl2.setAbsorptionMode(value);
	});

	var color_factor_controller = gui.add(guiControls, 'color_factor', 0, 20, 0.1).listen();
	color_factor_controller.onChange(function(value) {
		rcl2.setColorFactor(value);
	});

	var opacity_factor_controller = gui.add(guiControls, 'opacity_factor', 0, 50, 0.1).listen();
	opacity_factor_controller.onChange(function(value) {
		rcl2.setOpacityFactor(value);
	});

	var gray_min_controller = gui.add(guiControls, 'gray_min', 0, 1, 0.1).listen();
	gray_min_controller.onChange(function(value) {
		rcl2.setGrayMinValue(value);
	});

	var gray_max_controller = gui.add(guiControls, 'gray_max', 0, 1, 0.1).listen();
	gray_max_controller.onChange(function(value) {
		rcl2.setGrayMaxValue(value);
	});

	var renderer_size_controller = gui.add(guiControls, 'renderer_size', 1, 2048, 1).listen();
	renderer_size_controller.onFinishChange(function(value) {
		rcl2.setRendererSize(value, value);
	});

	var renderer_canvas_size_controller = gui.add(guiControls, 'renderer_canvas_size').listen();
	renderer_canvas_size_controller.onFinishChange(function(value) {
		rcl2.setRendererCanvasSize(value.split('x')[0], value.split('x')[1]);
	});

	var row_col_controller = gui.add(guiControls, 'row_col').listen();
	row_col_controller.onFinishChange(function(value) {
		rcl2.setRowCol(value.split('x')[0], value.split('x')[1]);
	});

	var step1Folder = gui.addFolder('Step 1');
	var controllerColor1 = step1Folder.addColor(guiControls, 'color1');
	var controllerStepPos1 = step1Folder.add(guiControls, 'stepPos1', 0.0, 1.0, 0.1);
	controllerColor1.onChange(function(value) {
		rcl2.setTransferFunctionByColors([
	        {"pos": guiControls["stepPos1"], "color": guiControls["color1"]},
	        {"pos": guiControls["stepPos2"], "color": guiControls["color2"]},
	        {"pos": guiControls["stepPos3"],  "color": guiControls["color3"]}
	    ]);
	});
	controllerStepPos1.onChange(function(value) {
		rcl2.setTransferFunctionByColors([
	        {"pos": guiControls["stepPos1"], "color": guiControls["color1"]},
	        {"pos": guiControls["stepPos2"], "color": guiControls["color2"]},
	        {"pos": guiControls["stepPos3"],  "color": guiControls["color3"]}
	    ]);

	});
	
	var step2Folder = gui.addFolder('Step 2');
	var controllerColor2 = step2Folder.addColor(guiControls, 'color2');
	var controllerStepPos2 = step2Folder.add(guiControls, 'stepPos2', 0.0, 1.0, 0.1);
	controllerColor2.onChange(function(value) {
		rcl2.setTransferFunctionByColors([
	        {"pos": guiControls["stepPos1"], "color": guiControls["color1"]},
	        {"pos": guiControls["stepPos2"], "color": guiControls["color2"]},
	        {"pos": guiControls["stepPos3"],  "color": guiControls["color3"]}
	    ]);


	});
	controllerStepPos2.onChange(function(value) {
		rcl2.setTransferFunctionByColors([
	        {"pos": guiControls["stepPos1"], "color": guiControls["color1"]},
	        {"pos": guiControls["stepPos2"], "color": guiControls["color2"]},
	        {"pos": guiControls["stepPos3"],  "color": guiControls["color3"]}
	    ]);
	});

	var step3Folder = gui.addFolder('Step 3');
	var controllerColor3 = step3Folder.addColor(guiControls, 'color3');
	var controllerStepPos3 = step3Folder.add(guiControls, 'stepPos3', 0.0, 1.0, 0.1);
	controllerColor3.onChange(function(value) {
		rcl2.setTransferFunctionByColors([
	        {"pos": guiControls["stepPos1"], "color": guiControls["color1"]},
	        {"pos": guiControls["stepPos2"], "color": guiControls["color2"]},
	        {"pos": guiControls["stepPos3"],  "color": guiControls["color3"]}
	    ]);
	});
	controllerStepPos3.onChange(function(value) {
		rcl2.setTransferFunctionByColors([
	        {"pos": guiControls["stepPos1"], "color": guiControls["color1"]},
	        {"pos": guiControls["stepPos2"], "color": guiControls["color2"]},
	        {"pos": guiControls["stepPos3"],  "color": guiControls["color3"]}
	    ]);
	});

	step1Folder.open();
	step2Folder.open();
	step3Folder.open();
};