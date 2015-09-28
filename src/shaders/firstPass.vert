//#ifdef GL_FRAGMENT_PRECISION_HIGH 
//  highp is supported 
// precision highp int; 
// precision highp float; 
//#else 
//  high is not supported 
 precision mediump int; 
 precision mediump float; 
//#endif

attribute vec4 vertColor; 

varying vec4 backColor; 
varying vec4 pos; 

void main(void) 
{ 
    backColor = vertColor; 

    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
    gl_Position = pos; 
}  
