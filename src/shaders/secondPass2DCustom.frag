/**
 * 2D Custom Shader
 */
uniform vec2 resolution;
precision mediump int; 
precision mediump float;

varying vec4 frontColor;
varying vec4 pos; 

uniform sampler2D uBackCoord; 
uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];

uniform sampler2D texture1;
uniform sampler2D texture2;

void main(void) {
    vec2 pos = gl_FragCoord.xy / resolution.xy;
    float b1, b2, b3, b4, b5, b6;
    vec3 t1, t2;

    t1 = texture2D(texture1, pos).xyz;
    t2 = texture2D(texture2, pos).xyz;

    b1 = t1.x;
    b2 = t1.y;
    b3 = t1.z;
    b4 = t2.x;
    b5 = t2.y;
    b6 = t2.z;

    gl_FragColor = vec4(b1, b2, b3, 1.0);
}