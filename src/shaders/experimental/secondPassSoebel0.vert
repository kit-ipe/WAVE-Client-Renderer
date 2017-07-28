varying vec3 worldSpaceCoords;
varying vec4 projectedCoords;

void main()
{
    worldSpaceCoords = (modelMatrix * vec4(position + vec3(0.5, 0.5,0.5), 1.0 )).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    projectedCoords = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}

// precision mediump int;
// precision mediump float;
// attribute vec4 vertColor;
// varying vec3 worldSpaceCoords;
// varying vec4 projectedCoords;
// void main()
// {
//     worldSpaceCoords = vertColor.rgb;
//     projectedCoords = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     gl_Position = projectedCoords;
// }
