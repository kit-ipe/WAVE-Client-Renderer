JavaScrip framework for client side raycasting.
====================

##Possablites
- Three graphics mods: x-ray, MIPS, Maximum intensity projection
- Thresholding by intensity of grayscale value
- Adoptive steps changing for getting good performance
- Configurability
- Utility for creating sitemaps

##Example:

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
	"resolution": [700, 700],
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

```bash
sudo python3 -m http.server 1001
```

#### Result:
![Screenshot1](https://raw.githubusercontent.com/kit-ipe/tomo_raycaster2/master/docs/screenshot_mode1.png)

## Screenshots

![Screenshot1](https://raw.githubusercontent.com/kit-ipe/tomo_raycaster2/master/docs/screenshot.png)    

## LICENSE

The MIT License (MIT)
Copyright (c) 2015 Aleksandr Lizin Sergeevich

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.