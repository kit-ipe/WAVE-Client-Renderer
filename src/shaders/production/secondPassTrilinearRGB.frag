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

// uniform int uAvailable_textures_number;


vec4 getVolumeValue(vec3 volpos)
{
    //if (volpos.z < 0.5)
    //    return vec4(0.0);

    float s1Original, s2Original, s1, s2; 
    float dx1, dy1; 
    float dx2, dy2; 
    // float value; 

    vec2 texpos1,texpos2;

    float slicesPerSprite = uSlicesOverX * uSlicesOverY;
    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis
    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis

    float delta = 1.0 / (sliceSizeX * uRatio);
    
    float adapted_x, adapted_y, adapted_z;
    //adapted_x = (volpos.x * (1.0 - (2.0*delta))) + delta;
    //adapted_y = (volpos.y * (1.0 - (2.0*delta))) + delta;
    //adapted_z = 1.0 - (( (volpos.z* (1.0/uRatio) ) * (1.0 - (2.0*delta))) + delta);
    
    adapted_x = volpos.x;
    adapted_y = volpos.y;
    //adapted_z = volpos.z;
    adapted_z = 1.0 - (volpos.z * (1.0/uRatio));

    s1Original = floor(adapted_z * uNumberOfSlices);
    s2Original = s1Original + delta;

    int tex1Index = int(floor(s1Original / slicesPerSprite));
    int tex2Index = int(floor(s2Original / slicesPerSprite));

    s1 = mod(s1Original, slicesPerSprite);
    s2 = mod(s2Original, slicesPerSprite);

    dx1 = fract(s1/uSlicesOverX);
    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;
    
    dx2 = fract(s2/uSlicesOverX);
    dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;
    
    texpos1.x = dx1+(adapted_x*sliceSizeX)/uSlicemapWidth;
    texpos1.y = dy1+(adapted_y*sliceSizeY)/uSlicemapWidth;
    
    texpos2.x = dx2+(adapted_x*sliceSizeX)/uSlicemapWidth;
    texpos2.y = dy2+(adapted_y*sliceSizeY)/uSlicemapWidth;
 
 
    vec4 value1, value2;
    
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( tex1Index == <%=i%> )
        {
            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;
        }
        if( tex2Index == <%=i%> )
        {
            value2 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;
        }
    <% } %>
    
    //return vec4( (value1 + value2) * 0.5);
    
    
    return mix(value1, value2, fract(volpos.z* uNumberOfSlices));
}

float getTextureValue(int slicemapNo, vec2 texpos)
{
    float value = 0.0;
    vec3 value_vec;
    
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( slicemapNo == <%=i%> )
        {
          value_vec = texture2D(uSliceMaps[<%=i%>],texpos).rgb;
          //value = ((value_vec.r + value_vec.g + value_vec.b)/3.0);
          //value = ((value_vec.r * 0.299)+(value_vec.g * 0.587)+(value_vec.b * 0.114));
          value = value_vec.r;
        }

        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>
    
    return value;
}


float getValueTri(vec3 volpos)
{
    vec2 texpos1a, texpos1b, texpos1c, texpos1d, texpos2a, texpos2b, texpos2c, texpos2d;
    float value1a, value1b, value1c, value1d, value2a, value2b, value2c, value2d, valueS;
    float value1ab, value1cd, value1ac, value1bd, value2ab, value2cd, value2ac, value2bd, value1, value2;
    float NOS = uNumberOfSlices;  //  abbreviation 

    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY; 
    float sliceSizeX = uSlicemapWidth/uSlicesOverX;  // Number of pixels of ONE slice along x axis
    float sliceSizeY = uSlicemapWidth/uSlicesOverY;  // Number of pixels of ONE slice along y axis
    
    //  Slice selection
    float sliceNo1 = floor(abs(volpos.z*NOS-0.5));  //  sliceNo1 stands for lower slice
    float sliceNo2 = NOS-1.0-floor(abs(NOS-0.5-volpos.z*NOS));  //  sliceNo2 stands for upper slice

    int slicemapNo1 = int(floor(sliceNo1 / slicesPerSlicemap));
    int slicemapNo2 = int(floor(sliceNo2 / slicesPerSlicemap));

    float s1 = mod(sliceNo1, slicesPerSlicemap);  // s1 stands for the sliceNo of lower slice in this map
    float dx1 = fract(s1/uSlicesOverX);
    float dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;
    float s2 = mod(sliceNo2, slicesPerSlicemap);  // s2 stands for the sliceNo of upper slice in this map
    float dx2 = fract(s2/uSlicesOverX);
    float dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;
    
    /*
    texpos1.x = dx1+volpos.x/uSlicesOverX;  // directly from texture2D
    texpos1.y = dy1+volpos.y/uSlicesOverY;
    texpos1.x = dx1+(floor(volpos.x*sliceSizeX)+0.5)/uSlicemapWidth;  //  NearestNeighbor in lower slice
    texpos1.y = dy1+(floor(volpos.y*sliceSizeY)+0.5)/uSlicemapWidth;
    */
    
    // Four nearest pixels in lower slice
    texpos1a.x = texpos1c.x = dx1+(floor(abs(volpos.x*sliceSizeX-0.5))+0.5)/uSlicemapWidth;  //  Trilinear
    texpos1a.y = texpos1b.y = dy1+(floor(abs(volpos.y*sliceSizeY-0.5))+0.5)/uSlicemapWidth;
    texpos1b.x = texpos1d.x = dx1+(sliceSizeX-1.0-floor(abs(sliceSizeX-0.5-volpos.x*sliceSizeX))+0.5)/uSlicemapWidth;
    texpos1c.y = texpos1d.y = dy1+(sliceSizeY-1.0-floor(abs(sliceSizeY-0.5-volpos.y*sliceSizeY))+0.5)/uSlicemapWidth;
    
    // Four nearest pixels in upper slice
    texpos2a.x = texpos2c.x = dx2+(floor(abs(volpos.x*sliceSizeX-0.5))+0.5)/uSlicemapWidth;  //  Trilinear
    texpos2a.y = texpos2b.y = dy2+(floor(abs(volpos.y*sliceSizeY-0.5))+0.5)/uSlicemapWidth;
    texpos2b.x = texpos2d.x = dx2+(sliceSizeX-1.0-floor(abs(sliceSizeX-0.5-volpos.x*sliceSizeX))+0.5)/uSlicemapWidth;
    texpos2c.y = texpos2d.y = dy2+(sliceSizeY-1.0-floor(abs(sliceSizeY-0.5-volpos.y*sliceSizeY))+0.5)/uSlicemapWidth;

    // get texture values of these 8 pixels
    value1a = getTextureValue(slicemapNo1, texpos1a);
    value1b = getTextureValue(slicemapNo1, texpos1b);
    value1c = getTextureValue(slicemapNo1, texpos1c);
    value1d = getTextureValue(slicemapNo1, texpos1d);
    value2a = getTextureValue(slicemapNo2, texpos2a);
    value2b = getTextureValue(slicemapNo2, texpos2b);
    value2c = getTextureValue(slicemapNo2, texpos2c);
    value2d = getTextureValue(slicemapNo2, texpos2d);
    
    // ratio calculation
    float ratioX = volpos.x*sliceSizeX+0.5-floor(volpos.x*sliceSizeX+0.5);
    float ratioY = volpos.y*sliceSizeY+0.5-floor(volpos.y*sliceSizeY+0.5);
    float ratioZ = volpos.z*NOS+0.5-floor(volpos.z*NOS+0.5);
    //float ratioZ = (volpos.z-(sliceNo1+0.5)/NOS) / (1.0/NOS);  // Another way to get ratioZ
    
    
    //  Trilinear interpolation 
    value1ab = value1a+ratioX*(value1b-value1a);
    value1cd = value1c+ratioX*(value1d-value1c);
    value1 = value1ab+ratioY*(value1cd-value1ab);
    value2ab = value2a+ratioX*(value2b-value2a);
    value2cd = value2c+ratioX*(value2d-value2c);
    value2 = value2ab+ratioY*(value2cd-value2ab);
    
    valueS = value1+ratioZ*(value2-value1);
    
    
    // Do NO interpolation with empty voxels
    if (value1a<=0.0 || value1b<=0.0 || value1c<=0.0 || value1d<=0.0 || value2a<=0.0 || value2b<=0.0 || value2c<=0.0 || value2d<=0.0)
    {
        if (value1a<=0.0 || value1c<=0.0 || value2a<=0.0 || value2c<=0.0)
        {    
            value1ab = value1b;
            value1cd = value1d;
            value2ab = value2b;
            value2cd = value2d;
            
            if (value1b<=0.0 || value2b<=0.0)
            {
                value1 = value1d;
                value2 = value2d;
                
                if (value1d <= 0.0)
                    valueS = value2;
                else if (value2d <= 0.0)
                    valueS = value1;
                else
                    valueS = value1+ratioZ*(value2-value1);
            }
            
            else if (value1d<=0.0 || value2d<=0.0)
            {
                value1 = value1b;
                value2 = value2b;
                valueS = value1+ratioZ*(value2-value1);
            }
            
            else
            {
                value1 = value1ab+ratioY*(value1cd-value1ab);
                value2 = value2ab+ratioY*(value2cd-value2ab);
                valueS = value1+ratioZ*(value2-value1);
            }
        }
    
    
        else
        {  // if (value1b<=0.0 || value1d<=0.0 || value2b<=0.0 || value2d<=0.0)
            value1ab = value1a;
            value1cd = value1c;
            value2ab = value2a;
            value2cd = value2c;
            
            value1 = value1ab+ratioY*(value1cd-value1ab);
            value2 = value2ab+ratioY*(value2cd-value2ab);
            valueS = value1+ratioZ*(value2-value1);
        }
    
    }
    
    
    /*
    if (value1a<=0.0 || value1b<=0.0 || value1c<=0.0 || value1d<=0.0 || value2a<=0.0 || value2b<=0.0 || value2c<=0.0 || value2d<=0.0)
        valueS = 0.0;
    */
    
    return valueS;

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
    
    float sliceSizeX = uSlicemapWidth / uSlicesOverX;  // Number of pixels of ONE slice along x axis
    float sliceSizeY = uSlicemapWidth / uSlicesOverY;  // Number of pixels of ONE slice along y axis
    float sm_delta = 1.0 / sliceSizeX;
    
    //Perform the ray marching iterations
    for(int i = 0; i < MAX_STEPS; i++) {       

        if(currentPosition.x > 1.0 ||
           currentPosition.y > 1.0 ||
           currentPosition.z > 1.0 ||
           currentPosition.x < 0.0 ||
           currentPosition.y < 0.0 ||
           currentPosition.z < 0.0)
            break;
        if(accumulatedColor.a>=1.0) 
            break;

        //grayValue = getVolumeValue(currentPosition);
        grayValue = vec4(getValueTri(currentPosition));

        if(grayValue.z < 0.05 || 
           grayValue.x <= uMinGrayVal ||
           grayValue.x >= uMaxGrayVal)  
            accumulatedColor = vec4(0.0);     
        else { 
            //colorSample.x = (1.0 * 2.0 - grayValue.x) * 5.0 * 0.4;
            colorSample.xyz = grayValue.xyz;
            //colorSample.w = alphaScaleFactor;
            colorSample.w = 0.1;
              
            //sample.a = colorSample.a * 40.0 * (1.0 / steps);
            sample.a = colorSample.a;
            sample.rgb = (1.0 - accumulatedColor.a) * colorSample.xyz * sample.a; 
             
            accumulatedColor += sample; 
        }    
   
        //Advance the ray.
        //currentPosition.xyz += deltaDirection;
        currentPosition.xyz += Step;
   
         
    } 
    gl_FragColor = accumulatedColor;
}
