(Obsolete) JavaScrip framework for client side raycasting.
====================

[![Join the chat at https://gitter.im/kit-ipe/tomo_raycaster2](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/kit-ipe/tomo_raycaster2?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


##Example of usage:

```html
<div id="container"> </div>
```
```javascript
vrc = new VRC.VolumeRaycaster({
	"dom_container_id": "container",
	"slicemaps_paths": ['data/bonsai.raw.png'],
	"gray_min": 0.1,
	"gray_max": 1.0,
	"row_col": [16, 16],
	"steps": 1024,
	"render_size": [700, 700],
	"absorption_mode": 1,
});

vrc.setTransferFunctionByColors(
	[
        {"pos": 1.0, "color": "#7F0000"},
        {"pos": 0.75, "color": "#FF9400"},
        {"pos": 0.5,  "color": "#7CFF79"},
        {"pos": 0.0, "color": "#000000"},
        {"pos": 1.0, "color": "#FFFFFF"}
    ]
);
```

## Workflow:
### 1. Clone this repo
```bash
$ git clone https://github.com/kit-ipe/tomoraycaster.git
```
### 2. Go to the dir where you cloned repo
```bash
$ cd tomoraycaster
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

```
### 6. Go to the test dir
```bash
$ cd test
```
### 7. Start python http server
```bash
$ ./start_http_server.sh

```
### 8. Point your browser to [localhost:10001](http://localhost:10001).

