#ifdef GL_FRAGMENT_PRECISION_HIGH 
 // highp is supported 
 precision highp int; 
 precision highp float; 
#else 
 // high is not supported 
 precision mediump int; 
 precision mediump float; 
#endif 

varying vec4 backColor; 

void main(void) 
{ 
    gl_FragColor = backColor; 
} 
