// This is an experimental shader to implement
// blinn phong shading model.
// In this example, I use the USCT breast model
// with a total of 144 slices as the dataset.
// Hence the gradient operator is divided by 144 for
// a single unit. Uncomment line 271 to see the normals
// calculated by the gradient operator function.
precision mediump int;
precision mediump float;
varying vec4 frontColor;
varying vec4 pos;
uniform sampler2D uBackCoord;
uniform sampler2D uTransferFunction;
uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];
uniform float uNumberOfSlices;
uniform float uOpacityVal;
uniform float uSlicesOverX;
uniform float uSlicesOverY;
uniform float darkness;
uniform vec3 uLightPos;
uniform int uSetViewMode;
uniform float uMinGrayVal;
uniform float uMaxGrayVal;
uniform float uSlicemapWidth;
uniform float l;
uniform float s;
uniform float hMin;
uniform float hMax;

//Acts like a texture3D using Z slices and trilinear filtering.
vec3 getVolumeValue(vec3 volpos)
{
    float s1Original, s2Original, s1, s2;
    float dx1, dy1;
    vec2 texpos1,texpos2;
    float slicesPerSprite = uSlicesOverX * uSlicesOverY;
    s1Original = floor(volpos.z*uNumberOfSlices);
    int tex1Index = int(floor(s1Original / slicesPerSprite));
    s1 = mod(s1Original, slicesPerSprite);
    dx1 = fract(s1/uSlicesOverX);
    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;
    texpos1.x = dx1+(volpos.x/uSlicesOverX);
    texpos1.y = dy1+(volpos.y/uSlicesOverY);
    vec3 value = vec3(0.0,0.0,0.0);

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( tex1Index == <%=i%> )
        {
            value = texture2D(uSliceMaps[<%=i%>],texpos1).xyz;
        }
        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>
    return value;
}

// Compute the Normal around the current voxel
vec3 getNormal(vec3 at)
{
    float xw = uSlicemapWidth / uSlicesOverX;
    float yw = uSlicemapWidth / uSlicesOverY;
    float zw = uNumberOfSlices;

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
    float w0 = (at.z - (1.0/zw)) - floor(at.z);
    float w2 = (at.z + (1.0/zw)) - floor(at.z);


    float fx, fy, fz;

    float L0, L1, L2, L3, L4, L5, L6, L7, L8;
    float H0, H1, H2, H3, H4, H5, H6, H7, H8;
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( iTexLowerIndex == <%=i%> )
        {
            texpos1.x = dx1+((at.x - 1.0/xw)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/yw)/uSlicesOverY);
            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 0.0/xw)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/yw)/uSlicesOverY);
            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/xw)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/yw)/uSlicesOverY);
            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x - 1.0/xw)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/yw)/uSlicesOverY);
            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 0.0/xw)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/yw)/uSlicesOverY);
            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/xw)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/yw)/uSlicesOverY);
            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x - 1.0/xw)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/yw)/uSlicesOverY);
            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 0.0/xw)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/yw)/uSlicesOverY);
            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/xw)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/yw)/uSlicesOverY);
            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

        }
        if( iTexUpperIndex == <%=i%> ) {
            texpos1.x = dx2+((at.x - 1.0/xw)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/yw)/uSlicesOverY);
            H0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 0.0/xw)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/yw)/uSlicesOverY);
            H1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 1.0/xw)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/yw)/uSlicesOverY);
            H2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x - 1.0/xw)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/yw)/uSlicesOverY);
            H3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 0.0/xw)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/yw)/uSlicesOverY);
            H4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 1.0/xw)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/yw)/uSlicesOverY);
            H5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x - 1.0/xw)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/yw)/uSlicesOverY);
            H6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 0.0/xw)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/yw)/uSlicesOverY);
            H7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 1.0/xw)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/yw)/uSlicesOverY);
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
const vec3 lightColor = vec3(1.0, 0.88, 0.74);
const vec3 u_intensity = vec3(0.1, 0.1, 0.1);
vec3 ambientLighting()
{
    const vec3 u_matAmbientReflectance = lightColor;
    const vec3 u_lightAmbientIntensity = u_intensity;

    return u_matAmbientReflectance * u_lightAmbientIntensity;
}
// returns intensity of diffuse reflection
vec3 diffuseLighting(in vec3 N, in vec3 L)
{
    const vec3 u_matDiffuseReflectance = lightColor;
    const vec3 u_lightDiffuseIntensity = vec3(0.6, 0.6, 0.6);

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
    // const vec3 u_lightSpecularIntensity = vec3(0, 1, 0);
    const vec3 u_lightSpecularIntensity = u_intensity;
    const vec3 u_matSpecularReflectance = lightColor;
    const float u_matShininess = 5.0;
   // calculate specular reflection only if
   // the surface is oriented to the light source
   if(dot(N, L) > 0.0)
   {
      vec3 e = normalize(-V);
      vec3 r = normalize(-reflect(L, N));
      specularTerm = pow(max(dot(r, e), 0.0), u_matShininess);
   }
   return u_matSpecularReflectance * u_lightSpecularIntensity * specularTerm;
}
void main(void)
{
    float xw = uSlicemapWidth / uSlicesOverX;
    float yw = uSlicemapWidth / uSlicesOverY;
    float zw = uNumberOfSlices;

    const int uStepsI = 256;
    const float uStepsF = float(uStepsI);

    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;
    vec4 backColor = texture2D(uBackCoord,texC);
    vec3 dir = backColor.rgb - frontColor.rgb;
    vec4 vpos = frontColor;
    vec3 Step = dir/uStepsF;
    vec4 accum = vec4(0, 0, 0, 0);
    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 colorValue = vec4(0, 0, 0, 0);

    float opacityFactor = uOpacityVal;

    vec3 lightPos[3];
    lightPos[0] = vec3(1, 1, 1);
    lightPos[1] = vec3(-1, -1, -1);
    lightPos[2] = vec3(1, 1, -1);

    // float xsqu;
    // float ysqu;
    // float distanceFromCenter;

    for(int i = 0; i < uStepsI; i++) {
      // xsqu = (0.5 - vpos.x) * (0.5 - vpos.x);
      // ysqu = (0.5 - vpos.y) * (0.5 - vpos.y);
      // distanceFromCenter = sqrt(xsqu + ysqu);
      //
      // if (distanceFromCenter < 0.4534 && vpos.z > 0.1 && vpos.z < 0.9) {
        vec3 gray_val = getVolumeValue(vpos.xyz);

        /************************************/
        /*         Mean filtering           */
        /************************************/

        /*
        if (gray_val.x > uMinGrayVal && gray_val.x < uMaxGrayVal) {
          float sum_gray_val = 0.0;

          int mask_size = 3;
          vec3 offset;
          vec3 curDotPos;

          for(int m_i = 0; m_i < 3; ++m_i) { // 3 = mask_size
            for(int j = 0; j < 3; ++j) {
              for(int k = 0; k < 3; ++k) {
                offset = vec3((float(m_i) - 1.0) / xw, // 1.0 = (int)mask_size / 2
                              (float(j) - 1.0) / yw,
                              (float(k) - 1.0) / zw);
                curDotPos = vpos.xyz + offset;
                sum_gray_val += getVolumeValue(curDotPos).x;
              }
            }
          }
          gray_val.x = sum_gray_val / 27.0; // 27.0 = pow(mask_size, 3)
        } // end of Mean filtering
        */
        
        if(gray_val.z < 0.00 ||
           gray_val.x < uMinGrayVal ||
           gray_val.x > uMaxGrayVal) {
            colorValue = vec4(0.0);
        } else {

            /* surface rendering
            vec3 V = normalize(cameraPosition - vpos.xyz);
            vec3 N = normalize(getNormal(vpos.xyz));
            for(int light_i = 0; light_i < 3; ++light_i) {
              vec3 L = normalize(lightPos[light_i] - vpos.xyz);
              vec3 Iamb = ambientLighting();
              vec3 Idif = diffuseLighting(N, L);
              vec3 Ispe = specularLighting(N, L, V);
              sample.rgb += (Iamb + Idif + Ispe);
            }
            sample.a = 1.0;
            */
            
            if ( uSetViewMode == 1 ) {
                vec3 V = normalize(cameraPosition - vpos.xyz);
                vec3 N = normalize(getNormal(vpos.xyz));
                for(int light_i = 0; light_i < 3; ++light_i) {
                    vec3 L = normalize(lightPos[light_i] - vpos.xyz);
                    vec3 Iamb = ambientLighting();
                    vec3 Idif = diffuseLighting(N, L);
                    vec3 Ispe = specularLighting(N, L, V);
                    sample.rgb += (Iamb + Idif + Ispe);
                }
                sample.a = 1.0;
            } else {
                //float test = (darkness * 2.0 - gray_val.x) * l * 0.4;
                colorValue = texture2D(uTransferFunction, vec2(gray_val.x, 0.5));
                //colorValue.x = gray_val.x;
                colorValue.w = 0.1;
                sample.rgb = (1.0 - accum.a) * colorValue.xyz * sample.a;
                sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);
            }
            
            accum += sample;
            
            if(accum.a>=1.0)
               break;
        }

        //advance the current position
        vpos.xyz += Step;

        if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > (1.0 - pow(2.0,-16.0))|| vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)
            break;
    }
    gl_FragColor = accum;
}
