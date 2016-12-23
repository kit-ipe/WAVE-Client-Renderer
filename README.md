WAVE Client Renderer
====================
A JavaScript framework for client-side data rendering. The WAVE Client Renderer is a subset of the WAVE framework, mainly to provide visual previews for large data sets.

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
$ grunt
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

