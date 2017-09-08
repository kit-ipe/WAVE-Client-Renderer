#ifdef GL_FRAGMENT_PRECISION_HIGH
 // highp is supported
 precision highp int;
 precision highp float;
#else
 // high is not supported
 precision mediump int;
 precision mediump float;
#endif

// Passed from vertex
varying vec3 worldSpaceCoords;
varying vec4 projectedCoords;

// Passed from core
uniform sampler2D uBackCoord;
uniform sampler2D uTransferFunction;
uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];
uniform float uSlicemapWidth;

// Assuming a bounding box of 512x512x512
// ceil( sqrt(3) * 512 ) = 887
const int MAX_STEPS = 887;

// Application specific parameters
uniform float uNumberOfSlices;
uniform float uMinGrayVal;
uniform float uMaxGrayVal;
uniform float uOpacityVal;
uniform float uColorVal;
uniform float uAbsorptionModeIndex;
uniform float uSlicesOverX;
uniform float uSlicesOverY;
uniform float uSteps;

uniform float uRatio;

uniform float uIndexOfImage;

// uniform int uAvailable_textures_number;


vec4 getVolumeValue(vec3 volpos)
{
    //if (volpos.z < 0.5)
    //    return vec4(0.0);

    float s1Original, s2Original, s1, s2;
    float dx1, dy1;
    // float dx2, dy2;
    // float value;

    vec2 texpos1,texpos2;

    float slicesPerSprite = uSlicesOverX * uSlicesOverY;
    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis
    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis

    float delta = 1.0 / sliceSizeX;

    float adapted_x, adapted_y, adapted_z;
    adapted_x = (volpos.x * (1.0 - (2.0*delta))) + delta;
    adapted_y = (volpos.y * (1.0 - (2.0*delta))) + delta;
    adapted_z = 1.0 - (( (volpos.z* (1.0/uRatio) ) * (1.0 - (2.0*delta))) );


    // s1Original = floor(adapted_z*uNumberOfSlices);
    if(adapted_z>0.0) {
        s1Original = floor(adapted_z*uNumberOfSlices);
    } else {
        s1Original = (1.0 - (0.5 / uNumberOfSlices)) * uNumberOfSlices;
    }

    //s1Original = floor(volpos.z*uNumberOfSlices);
    //s2Original = min(s1Original + 1.0, uNumberOfSlices);

    int tex1Index = int(floor(s1Original / slicesPerSprite));
    //int tex2Index = int(floor(s2Original / slicesPerSprite));

    s1 = mod(s1Original, slicesPerSprite);
    //s2 = mod(s2Original, slicesPerSprite);

    dx1 = fract(s1/uSlicesOverX);
    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;

    texpos1.x = dx1+(floor(adapted_x*sliceSizeX)+0.5)/uSlicemapWidth;
    texpos1.y = dy1+(floor(adapted_y*sliceSizeY)+0.5)/uSlicemapWidth;

    float value2 = 0.0;
    vec4 value1;
    // bool value1Set = false, value2Set = false;

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( tex1Index == <%=i%> )
        {
            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;
        }
    <% } %>

    return value1;
}


// x - R, y - G, z - B
// x - H, y - S, z - V
vec3 hsv2rgb(vec3 hsv)
{
    float     hue, p, q, t, ff;
    int        i;
    //"opacity_factor": 40,
    //"color_factor": 0.4,
    //"x_min": 0,
    //"x_max": 1,
    //"l": 5,
    //"s" : 1,
    //"hMin" : -0.5,
    //"hMax" : 1,
    //"minRefl" : 0,
    //"minSos" : 0,
    //"minAtten" : 0,
    //"maxRefl" : 100,
    //"maxSos" : 100,
    //"maxAtten" : 100,

    float darkness = 0.4;
    float l = 5.0;
    float s = 1.0;
    float hMin = -0.5;
    float hMax = 1.0;

    hsv.z = (darkness - hsv.z) * l;
    hsv.x = (hsv.x - hMin)/(hMax - hMin) * 360.0;
    hsv.y *= s * 1.5;

    hue=hsv.x >= 360.0?hsv.x-360.0:hsv.x;

    hue /= 60.0;
    i = int(hue);
    ff = hue - float(i);
    p = hsv.z * (1.0 - hsv.y);
    q = hsv.z * (1.0 - (hsv.y * ff));
    t = hsv.z * (1.0 - (hsv.y * (1.0 - ff)));

    if(i==0)
        return vec3(hsv.z,t,p);

    else if(i==1)
      return vec3(q,hsv.z,p);

    else if(i==2)
        return vec3(p,hsv.z,t);

    else if(i==3)
        return vec3(p,q,hsv.z);

    else if(i==4)
        return vec3(t,p,hsv.z);

    else
        return vec3(hsv.z,p,q);
}



void main(void) {

    //Transform the coordinates it from [-1;1] to [0;1]
    vec2 texc = vec2(((projectedCoords.x / projectedCoords.w) + 1.0 ) / 2.0,
                     ((projectedCoords.y / projectedCoords.w) + 1.0 ) / 2.0);

    //The back position is the world space position stored in the texture.
    vec3 backPos = texture2D(uBackCoord, texc).xyz;

    //The front position is the world space position of the second render pass.
    vec3 frontPos = worldSpaceCoords;

    //The direction from the front position to back position.
    vec3 dir = backPos - frontPos;
    float rayLength = length(dir);

    //Calculate how long to increment in each step.
    float steps = ceil( sqrt(3.0) * (uSlicemapWidth / uSlicesOverX) ) * uRatio;
    //float steps = 256.0;
    float delta = 1.0 / steps;

    //The increment in each direction for each step.
    vec3 deltaDirection = normalize(dir) * delta;

    vec3 Step = dir / steps;

    float deltaDirectionLength = length(deltaDirection);


    //vec4 vpos = frontColor;  // currentPosition
    //vec3 Step = dir/uStepsF; // steps

    //Start the ray casting from the front position.
    vec3 currentPosition = frontPos;

    //The color accumulator.
    vec4 accumulatedColor = vec4(0.0);

    //The alpha value accumulated so far.
    float accumulatedAlpha = 0.0;

    //How long has the ray travelled so far.
    float accumulatedLength = 0.0;

    //If we have twice as many samples, we only need ~1/2 the alpha per sample.
    //Scaling by 256/10 just happens to give a good value for the alphaCorrection slider.
    float alphaScaleFactor = 28.8 * delta;

    vec4 colorSample = vec4(0.0);
    vec4 sample = vec4(0.0);
    vec4 grayValue;
    float alphaSample;
    float alphaCorrection = 1.0;

    //Perform the ray marching iterations
    for(int i = 0; i < MAX_STEPS; i++) {

        if(currentPosition.x > 1.0 || currentPosition.y > 1.0 || currentPosition.z > 1.0 || currentPosition.x < 0.0 || currentPosition.y < 0.0 || currentPosition.z < 0.0)
            break;
        if(accumulatedColor.a>=1.0)
            break;

        grayValue = getVolumeValue(currentPosition);

        if(grayValue.z < 0.05 ||
           grayValue.x < 0.0 ||
           grayValue.x > 1.0)
            accumulatedColor = vec4(0.0);
        else {



          if (uIndexOfImage==0.0)
          {
            // colorSample.xyz = grayValue.xyz;

            colorSample.x = grayValue.x;
            colorSample.y = 1.0-grayValue.y/0.6;
            colorSample.z = grayValue.z;
            colorSample.w = 0.04;

            // colorSample.w = 0.04;
            // colorSample.x = grayValue.x;
            // colorSample.y = 1.0-grayValue.x/0.6;
            // colorSample.z = grayValue.x/1.8;

            // colorSample.w = 0.04;
            // colorSample.x = grayValue.y;
            // colorSample.y = 1.0-grayValue.y/0.7;
            // colorSample.z = grayValue.y/1.8;

            // colorSample.w = 0.03;
            // colorSample.x = grayValue.z;
            // colorSample.y = grayValue.z;
            // colorSample.z = grayValue.z;
          }
          if (uIndexOfImage==1.0)
          {
            colorSample.w = 0.04;
            colorSample.x = grayValue.x;
            colorSample.y = 1.0-grayValue.x/0.6;
            colorSample.z = grayValue.x/1.8;
          }
          if (uIndexOfImage==2.0)
          {
            colorSample.w = 0.04;
            colorSample.x = grayValue.y;
            colorSample.y = 1.0-grayValue.y/0.7;
            colorSample.z = grayValue.y/1.8;
          }
          if (uIndexOfImage==3.0)
          {
            colorSample.w = 0.03;
            colorSample.x = grayValue.z;
            colorSample.y = grayValue.z;
            colorSample.z = grayValue.z;
          }

            //sample.a = colorSample.a * 40.0 * (1.0 / steps);
            sample.a = colorSample.a;
            sample.rgb = (1.0 - accumulatedColor.a) * hsv2rgb(colorSample.xyz) * sample.a;

          if(uIndexOfImage==0.0) // multimodality
          {
            accumulatedColor += sample;
            // accumulatedColor += vec4(currentPosition.xyz,sample.a);
          }
          else // single modality
          {
            vec3 tmp = vec3(0.3, 0.59, 0.11);
            float grayscale=dot(sample.rgb, tmp);
            accumulatedColor += vec4(grayscale,grayscale,grayscale,sample.a);
          }

        }

        //Advance the ray.
        //currentPosition.xyz += deltaDirection;
        currentPosition.xyz += Step;


    }
    gl_FragColor = accumulatedColor;
}
