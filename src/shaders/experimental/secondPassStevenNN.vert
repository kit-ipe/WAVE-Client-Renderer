precision mediump int;
precision mediump float;

attribute vec4 vertColor;
//see core.js -->
//attributes: {
//    vertColor: {type: 'c', value: [] }
//},
varying vec4 frontColor;
varying vec4 pos;

void main(void)
{
    frontColor = vertColor;

    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = pos;
}
