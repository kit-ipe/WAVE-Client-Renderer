WAVE Client Renderer
====================
A JavaScript framework for client-side data rendering. The WAVE Client Renderer is a subset of the WAVE framework, mainly to provide visual previews for large data sets.

## Workflow:
### 1. Clone this repo
```bash
$ git clone https://github.com/kit-ipe/WAVE-Client-Renderer.git
```
### 2. Go to the dir where you cloned repo
```bash
$ cd WAVE-Client-Renderer
```
### 3. Install npm
* Opensuse 13.2

```bash
$ sudo zypper addrepo http://download.opensuse.org/repositories/devel:/languages:/nodejs/openSUSE_13.2/ Node.js
$ sudo zypper in npm
```
* Archlinux
```bash
$ sudo pacman -S npm
```
### 4. Prepare Grunt
```bash
$ ./prepare_grunt.sh
```
### 5. Compile all the source files into Javascript
```bash
$ grunt
```

## Usage API:
You can call the API from your web developer console:

### General information.
1. Version.
```bash
$ wave.version();
```

### Control.
1. Start raycast.
```bash
$ wave.start();
```
2. Stop raycast.
```bash
$ wave.stop();
```

### Rendering modes
1. Volume raycasting.
```bash
$ wave.showVolren();
```
2. Surface rendering.
```bash
$ wave.showISO();
```
3. Transfer function.
```bash
$ wave.setTransferFunctionByColors( [ {'color': '#ff0000', 'pos': 0.0},{'color': '#0000ff', 'pos': 0.50},{'color': '#ffffff', 'pos': 1.0}] );
```
### Container
3. Enable/disable cube container wireframe (val: [true | false]).
```bash
$ wave.showWireframe(val);
```
3. Enable/disable showing hint container (val: [true | false]).
```bash
$ wave.showZoomBox(val);
```
3. Set Zoom Box X-min (val: [0,1]).
```bash
$ wave.setZoomXMinValue(val)
```
3. Set Zoom Box X-max (val: [0,1]).
```bash
$ wave.setZoomXMaxValue(val)
```
3. Set Zoom Box Y-min (val: [0,1]).
```bash
$ wave.setZoomYMinValue(val)
```
3. Set Zoom Box Y-max (val: [0,1]).
```bash
$ wave.setZoomYMaxValue(val)
```
3. Set Zoom Box Z-min (val: [0,1]).
```bash
$ wave.setZoomZMinValue(val)
```
3. Set Zoom Box Z-max (val: [0,1]).
```bash
$ wave.setZoomZMaxValue(val)
```
3. Set Zoom Box Colour (val: HEX-codei, e.g., 0xff00ff).
```bash
$ wave.setZoomColor(val)
```

### Data
1. Set minimum gray value threshold (val: [0,1]).
```bash
$ wave.setGrayMinValue( val );
```
2. Set maximum gray value threshold (val: [0,1]).
```bash
$ wave.setGrayMaxValue( val );
```
3. Slice data from X-min (val: [0,1]).
```bash
$ wave.setGeometryMinX( val );
```
3. Slice data from X-max (val: [0,1]).
```bash
$ wave.setGeometryMaxX( val );
```
3. Slice data from Y-min (val: [0,1]).
```bash
$ wave.setGeometryMinY( val );
```
3. Slice data from Y-max (val: [0,1]).
```bash
$ wave.setGeometryMaxY( val );
```
3. Slice data from Z-min (val: [0,1]).
```bash
$ wave.setGeometryMinZ( val );
```
3. Slice data from Z-max (val: [0,1]).
```bash
$ wave.setGeometryMaxZ( val );
```

