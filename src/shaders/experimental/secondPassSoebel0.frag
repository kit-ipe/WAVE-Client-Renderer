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
const int MAX_STEPS = 144;

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
uniform vec3 uLightPos;
uniform int uSetViewMode;

uniform float uRatio;

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
    adapted_z = 1.0 - (( (volpos.z* (1.0/uRatio) ) * (1.0 - (2.0*delta))) + delta);

    s1Original = floor(adapted_z*uNumberOfSlices);
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

    // int numberOfSlicemaps = int( ceil(uNumberOfSlices / (uSlicesOverX * uSlicesOverY)) );

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( tex1Index == <%=i%> )
        {
            value1 = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;
        }
    <% } %>

    return value1;

    // for (int x = 0; x < gl_MaxTextureImageUnits-2; x++)
    // {
    //     if(x == numberOfSlicemaps)
    //     {
    //         break;
    //     }

    //     if(x == tex1Index) {
    //         value1 = texture2D(uSliceMaps[x],texpos1).x;
    //         value1Set = true;
    //     }

    //     if(x == tex2Index) {
    //         value2 = texture2D(uSliceMaps[x],texpos2).x;
    //         value2Set = true;
    //     }

    //     if(value1Set && value2Set) {
    //         break;
    //     }

    // }

    // return mix(value1, value2, fract(volpos.z*uNumberOfSlices));
}

// Compute the Normal around the current voxel
vec3 getNormal(vec3 at)
{
    float fSliceLower, fSliceUpper, s1, s2;
    float dx1, dy1, dx2, dy2;
    int iTexLowerIndex, iTexUpperIndex;
    vec2 texpos1,texpos2;
    float slicesPerSprite = uSlicesOverX * uSlicesOverY;
    fSliceLower = floor(at.z*uNumberOfSlices); // z value is between 0 and 1. Multiplying the total number of slices
                                               // gives the position in between. By flooring the value, you get the lower
                                               // slice position.
    fSliceUpper = min(fSliceLower + 1.0, uNumberOfSlices); // return the mininimum between the two values
                                                           // act as a upper clamp.
    // At this point, we get our lower slice and upper slice
    // Now we need to get which texture image contains our slice.
    iTexLowerIndex = int(floor(fSliceLower / slicesPerSprite));
    iTexUpperIndex = int(floor(fSliceUpper / slicesPerSprite));
    // mod returns the value of x modulo y. This is computed as x - y * floor(x/y).
    s1 = mod(fSliceLower, slicesPerSprite); // returns the index of slice in slicemap
    s2 = mod(fSliceUpper, slicesPerSprite);
    dx1 = fract(s1/uSlicesOverX);
    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY; // first term is the row within the slicemap
                                               // second division is normalize along y-axis
    dx2 = fract(s2/uSlicesOverX);
    dy2 = floor(s2/uSlicesOverY)/uSlicesOverY; // first term is the row within the slicemap
                                               // second division is normalize along y-axis
    float weight = at.z - floor(at.z);
    float w1 = at.z - floor(at.z);
    float w0 = (at.z - (1.0/144.0)) - floor(at.z);
    float w2 = (at.z + (1.0/144.0)) - floor(at.z);


    float fx, fy, fz;

    float L0, L1, L2, L3, L4, L5, L6, L7, L8;
    float H0, H1, H2, H3, H4, H5, H6, H7, H8;
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( iTexLowerIndex == <%=i%> )
        {
            texpos1.x = dx1+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/144.0)/uSlicesOverY);
            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 0.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/144.0)/uSlicesOverY);
            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/144.0)/uSlicesOverY);
            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/144.0)/uSlicesOverY);
            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 0.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/144.0)/uSlicesOverY);
            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/144.0)/uSlicesOverY);
            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/144.0)/uSlicesOverY);
            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 0.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/144.0)/uSlicesOverY);
            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/144.0)/uSlicesOverY);
            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

        }
        if( iTexUpperIndex == <%=i%> ) {
            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/144.0)/uSlicesOverY);
            H0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 0.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/144.0)/uSlicesOverY);
            H1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/144.0)/uSlicesOverY);
            H2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/144.0)/uSlicesOverY);
            H3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 0.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/144.0)/uSlicesOverY);
            H4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/144.0)/uSlicesOverY);
            H5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/144.0)/uSlicesOverY);
            H6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 0.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/144.0)/uSlicesOverY);
            H7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/144.0)/uSlicesOverY);
            H8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }
    <% } %>
    // we need to get interpolation of 2 x points
    // x direction
    // -1 -3 -1   0  0  0   1  3  1
    // -3 -6 -3   0  0  0   3  6  3
    // -1 -3 -1   0  0  0   1  3  1
    // y direction
    //  1  3  1   3  6  3   1  3  1
    //  0  0  0   0  0  0   0  0  0
    // -1 -3 -1  -3 -6 -3  -1 -3 -1
    // z direction
    // -1  0  1   -3  0  3   -1  0  1
    // -3  0  3   -6  0  6   -3  0  3
    // -1  0  1   -3  0  3   -1  0  1

    fx =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fx += ((w1 * (H0 - L0)) + L0) * -3.0;
    fx += ((w2 * (H0 - L0)) + L0) * -1.0;

    fx += ((w0 * (H3 - L3)) + L3) * -3.0;
    fx += ((w1 * (H3 - L3)) + L3) * -6.0;
    fx += ((w2 * (H3 - L3)) + L3) * -3.0;

    fx += ((w0 * (H6 - L6)) + L6) * -1.0;
    fx += ((w1 * (H6 - L6)) + L6) * -3.0;
    fx += ((w2 * (H6 - L6)) + L6) * -1.0;

    fx += ((w0 * (H1 - L1)) + L1) * 0.0;
    fx += ((w1 * (H1 - L1)) + L1) * 0.0;
    fx += ((w2 * (H1 - L1)) + L1) * 0.0;

    fx += ((w0 * (H4 - L4)) + L4) * 0.0;
    fx += ((w1 * (H4 - L4)) + L4) * 0.0;
    fx += ((w2 * (H4 - L4)) + L4) * 0.0;

    fx += ((w0 * (H7 - L7)) + L7) * 0.0;
    fx += ((w1 * (H7 - L7)) + L7) * 0.0;
    fx += ((w2 * (H7 - L7)) + L7) * 0.0;

    fx += ((w0 * (H2 - L2)) + L2) * 1.0;
    fx += ((w1 * (H2 - L2)) + L2) * 3.0;
    fx += ((w2 * (H2 - L2)) + L2) * 1.0;

    fx += ((w0 * (H5 - L5)) + L5) * 3.0;
    fx += ((w1 * (H5 - L5)) + L5) * 6.0;
    fx += ((w2 * (H5 - L5)) + L5) * 3.0;

    fx += ((w0 * (H8 - L8)) + L8) * 1.0;
    fx += ((w1 * (H8 - L8)) + L8) * 3.0;
    fx += ((w2 * (H8 - L8)) + L8) * 1.0;

    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fy += ((w1 * (H0 - L0)) + L0) * 3.0;
    fy += ((w2 * (H0 - L0)) + L0) * 1.0;

    fy += ((w0 * (H3 - L3)) + L3) * 0.0;
    fy += ((w1 * (H3 - L3)) + L3) * 0.0;
    fy += ((w2 * (H3 - L3)) + L3) * 0.0;

    fy += ((w0 * (H6 - L6)) + L6) * -1.0;
    fy += ((w1 * (H6 - L6)) + L6) * -3.0;
    fy += ((w2 * (H6 - L6)) + L6) * -1.0;

    fy += ((w0 * (H1 - L1)) + L1) * 3.0;
    fy += ((w1 * (H1 - L1)) + L1) * 6.0;
    fy += ((w2 * (H1 - L1)) + L1) * 3.0;

    fy += ((w0 * (H4 - L4)) + L4) * 0.0;
    fy += ((w1 * (H4 - L4)) + L4) * 0.0;
    fy += ((w2 * (H4 - L4)) + L4) * 0.0;

    fy += ((w0 * (H7 - L7)) + L7) * -3.0;
    fy += ((w1 * (H7 - L7)) + L7) * -6.0;
    fy += ((w2 * (H7 - L7)) + L7) * -3.0;

    fy += ((w0 * (H2 - L2)) + L2) * 1.0;
    fy += ((w1 * (H2 - L2)) + L2) * 3.0;
    fy += ((w2 * (H2 - L2)) + L2) * 1.0;

    fy += ((w0 * (H5 - L5)) + L5) * 0.0;
    fy += ((w1 * (H5 - L5)) + L5) * 0.0;
    fy += ((w2 * (H5 - L5)) + L5) * 0.0;

    fy += ((w0 * (H8 - L8)) + L8) * -1.0;
    fy += ((w1 * (H8 - L8)) + L8) * -3.0;
    fy += ((w2 * (H8 - L8)) + L8) * -1.0;




    fz =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fz += ((w1 * (H0 - L0)) + L0) * 0.0;
    fz += ((w2 * (H0 - L0)) + L0) * 1.0;

    fz += ((w0 * (H3 - L3)) + L3) * -3.0;
    fz += ((w1 * (H3 - L3)) + L3) * 0.0;
    fz += ((w2 * (H3 - L3)) + L3) * 3.0;

    fz += ((w0 * (H6 - L6)) + L6) * -1.0;
    fz += ((w1 * (H6 - L6)) + L6) * 0.0;
    fz += ((w2 * (H6 - L6)) + L6) * 1.0;

    fz += ((w0 * (H1 - L1)) + L1) * -3.0;
    fz += ((w1 * (H1 - L1)) + L1) * 0.0;
    fz += ((w2 * (H1 - L1)) + L1) * 3.0;

    fz += ((w0 * (H4 - L4)) + L4) * -6.0;
    fz += ((w1 * (H4 - L4)) + L4) * 0.0;
    fz += ((w2 * (H4 - L4)) + L4) * 6.0;

    fz += ((w0 * (H7 - L7)) + L7) * -3.0;
    fz += ((w1 * (H7 - L7)) + L7) * 0.0;
    fz += ((w2 * (H7 - L7)) + L7) * 3.0;

    fz += ((w0 * (H2 - L2)) + L2) * -1.0;
    fz += ((w1 * (H2 - L2)) + L2) * 0.0;
    fz += ((w2 * (H2 - L2)) + L2) * 1.0;

    fz += ((w0 * (H5 - L5)) + L5) * -3.0;
    fz += ((w1 * (H5 - L5)) + L5) * 0.0;
    fz += ((w2 * (H5 - L5)) + L5) * 3.0;

    fz += ((w0 * (H8 - L8)) + L8) * -1.0;
    fz += ((w1 * (H8 - L8)) + L8) * 0.0;
    fz += ((w2 * (H8 - L8)) + L8) * 1.0;
    vec3 n = vec3( fx/27.0 , fy/27.0 , fz/27.0 );
    return n;
}
// returns intensity of reflected ambient lighting
vec3 ambientLighting()
{
    const vec3 u_matAmbientReflectance = vec3(1.0, 1.0, 1.0);
    const vec3 u_lightAmbientIntensity = vec3(0.6, 0.3, 0.0);

    return u_matAmbientReflectance * u_lightAmbientIntensity;
}
// returns intensity of diffuse reflection
vec3 diffuseLighting(in vec3 N, in vec3 L)
{
    const vec3 u_matDiffuseReflectance = vec3(1, 1, 1);
    const vec3 u_lightDiffuseIntensity = vec3(1.0, 0.5, 0);

    // calculation as for Lambertian reflection
    float diffuseTerm = dot(N, L);
    if (diffuseTerm > 1.0) {
        diffuseTerm = 1.0;
    } else if (diffuseTerm < 0.0) {
        diffuseTerm = 0.0;
    }
    return u_matDiffuseReflectance * u_lightDiffuseIntensity * diffuseTerm;
}
// returns intensity of specular reflection
vec3 specularLighting(in vec3 N, in vec3 L, in vec3 V)
{
    float specularTerm = 0.0;
    const vec3 u_lightSpecularIntensity = vec3(0, 1, 0);
    const vec3 u_matSpecularReflectance = vec3(1, 1, 1);
    const float u_matShininess = 5.0;
   // calculate specular reflection only if
   // the surface is oriented to the light source
   if(dot(N, L) > 0.0)
   {
      // half vector
      vec3 H = normalize(L + V);
      specularTerm = pow(dot(N, H), u_matShininess);
   }
   return u_matSpecularReflectance * u_lightSpecularIntensity * specularTerm;
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
           grayValue.x < uMinGrayVal ||
           grayValue.x > uMaxGrayVal)
            accumulatedColor = vec4(0.0);
        else {
            //colorSample.x = (1.0 * 2.0 - grayValue.x) * 5.0 * 0.4;
            colorSample.x = grayValue.x;
            //colorSample.w = alphaScaleFactor;
            colorSample.w = 0.1;

            if ( uSetViewMode == 1 ) {
                // normalize vectors after interpolation
                vec3 L = normalize(currentPosition - uLightPos);
                vec3 V = normalize( cameraPosition - currentPosition );
                vec3 N = normalize(getNormal(currentPosition));
                // get Blinn-Phong reflectance components
                vec3 Iamb = ambientLighting();
                vec3 Idif = diffuseLighting(N, L);
                vec3 Ispe = specularLighting(N, L, V);
                // diffuse color of the object from texture
                //vec3 diffuseColor = texture(u_diffuseTexture, o_texcoords).rgb;

                vec3 mycolor = (Iamb + Idif + Ispe);
                //vec3 mycolor = colorValue.xxx * (Iamb + Ispe);
                sample.rgb = mycolor;
                sample.a = 1.0;
            } else {
              //sample.a = colorSample.a * 40.0 * (1.0 / steps);
              sample.a = colorSample.a;
              sample.rgb = (1.0 - accumulatedColor.a) * colorSample.xxx * sample.a;
            }

            accumulatedColor += sample;
        }

        //Advance the ray.
        //currentPosition.xyz += deltaDirection;
        currentPosition.xyz += Step;


    }
    gl_FragColor = accumulatedColor;


    /*
    for(int i = 0; i < MAX_STEPS; i++) {

        grayValue = getVolumeValue( currentPosition );

        if(grayValue.r < uMinGrayVal || grayValue.r > uMaxGrayVal || grayValue.b < 0.05) {
            accumulatedColor = vec4(0.0);
        } else {
            colorSample.rgb = vec3(1.0,0.0,0.0);
            colorSample.a = 1.0;

            alphaSample = colorSample.a * alphaCorrection;

            //Applying this effect to both the color and alpha accumulation results in more realistic transparency.
            alphaSample *= (1.0 - accumulatedAlpha);

            //Scaling alpha by the number of steps makes the final color invariant to the step size.
            alphaSample *= alphaScaleFactor;

            //Perform the composition.
            accumulatedColor += colorSample * alphaSample * 100.0;

            //Store the alpha accumulated so far.
            accumulatedAlpha += alphaSample;

            accumulatedColor = colorSample;
        }
        //Advance the ray.
        currentPosition += deltaDirection;

        accumulatedLength += deltaDirectionLength;

        //If the length traversed is more than the ray length, or if the alpha accumulated reaches 1.0 then exit.
        if(accumulatedLength >= rayLength || accumulatedAlpha >= 1.0 )
            break;
    }
    gl_FragColor = accumulatedColor;
    */
}
