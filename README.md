WAVE Client Renderer
====================
A JavaScript framework for client-side data rendering. The WAVE Client Renderer is a subset of the WAVE framework, mainly to provide visual previews for large data sets.

If you use this library, please cite the following paper:

Tan Jerome, N., Chilingaryan, S., Shkarin, A., Kopmann, A., Zapf, M., Lizin, A., & Bergmann, T. (2017, February). WAVE: A 3D Online Previewing Framework for Big Data Archives. In VISIGRAPP (3: IVAPP) (pp. 152-163).

@inproceedings{tanjerome2017wave,
  title={WAVE: A 3D Online Previewing Framework for Big Data Archives.},
  author={Tan Jerome, Nicholas and Chilingaryan, Suren and Shkarin, Andrei and Kopmann, Andreas and Zapf, Michael and Lizin, Alexander and Bergmann, Till},
  booktitle={VISIGRAPP (3: IVAPP)},
  pages={152--163},
  year={2017}
}


This library help creates the visualizations in the following publications:
1. Sebastian Schmelzle, Michael Heethoff, Vincent Heuveline, Philipp Lösel, Jürgen Becker, Felix Beckmann, Frank Schluenzen, Jörg U. Hammel, Andreas Kopmann, Wolfgang Mexner, Matthias Vogelgesang, Nicholas Tan Jerome, Oliver Betz, Rolf Beutel, Benjamin Wipfler, Alexander Blanke, Steffen Harzsch, Marie Hörnig, Tilo Baumbach, Thomas van de Kamp, "The NOVA project: maximizing beam time efficiency through synergistic analyses of SRμCT data," Proc. SPIE 10391, Developments in X-Ray Tomography XI, 103910P (26 September 2017); https://doi.org/10.1117/12.2275959 
2. Tan Jerome, N., Ateyev, Z., Lebedev, V., Hopp, T., Zapf, M., Chilingaryan, S., & Kopmann, A. (2018). Visualisation of Ultrasound Computer Tomography Breast Dataset. KIT Scientific Publishing.
3. Tan Jerome, N., & Kopmann, A. (2018). Digital Visual Exploration Library. In VISIGRAPP (3: IVAPP) (pp. 341-348).
4. Tan Jerome, N. (2019). Low-latency big data visualisation. KIT Scientific Publishing.
5. Tan Jerome, N., Ateyev, Z., Schmelzle, S., Chilingaryan, S., & Kopmann, A. (2019). Real-Time Local Noise Filter in 3-D Visualization of CT Data. IEEE Transactions on Nuclear Science, 66(7), 1296-1303.
6. Tan Jerome, N., Chilingaryan, S., van de Kamp, T., & Kopmann, A. (2023). Low-latency Visual Previews of Large Synchrotron Micro-CT Datasets. arXiv preprint arXiv:2311.15038.


Due to the rapid change of the web development landscape, the information might be outdated. Please contact nicholas.tanjerome@kit.edu to help setup or update the repository.

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
* Mac OS
```bash
$ brew install node
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

