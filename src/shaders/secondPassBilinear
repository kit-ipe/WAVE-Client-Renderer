#ifdef GL_FRAGMENT_PRECISION_HIGH
 // highp is supported
 precision highp int;
 precision highp float;
#else
 // high is not supported
 precision mediump int;
 precision mediump float;
#endif

varying vec4 frontColor;
varying vec4 pos;

uniform sampler2D uBackCoord;
uniform sampler2D uTransferFunction;
uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];

uniform float uNumberOfSlices; //returns total number of slices of all slicemaps
uniform float uMinGrayVal;
uniform float uMaxGrayVal;
uniform float uOpacityVal;
uniform float uColorVal;
uniform float uAbsorptionModeIndex;
uniform float uSlicesOverX;
uniform float uSlicesOverY;
uniform float uSlicemapWidth;

float getVolumeValue(vec3 volpos)
{
    float sliceIndexInSlicemaps_lower, sliceIndex_lower;
    float sliceIndexInSlicemaps_upper, sliceIndex_upper;
    float x_offset_lower, y_offset_lower;
    float x_offset_upper, y_offset_upper;

//Variables for Bilinear Interpolation
    float sliceIndexInSlicemaps_middle, sliceIndex_middle;
    float x_offset_middle, y_offset_middle;
    float pixellength;

//How many slices does 1 slicemap have?
    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY;

//Determine globalindex (with respect to total numbers of slices) of current slice
    sliceIndexInSlicemaps_lower = floor(volpos.z*uNumberOfSlices);

    sliceIndexInSlicemaps_upper = ceil(volpos.z*uNumberOfSlices);

    sliceIndexInSlicemaps_middle = volpos.z*uNumberOfSlices;

//Calculate length of 1 pixel in 1 slice
    pixellength =  (1.00/(uSlicemapWidth/uSlicesOverX)); // == [1.00/resolution_of_one_slice]

//In which slicemap is this "current" slice located? (Or: Which Slicemap do we use?) (Calculates current index of Slicemap)
    int texIndexOfSlicemap_lower = int(floor(sliceIndexInSlicemaps_lower / slicesPerSlicemap));

//What is the index of the slice in the current slicemap?
    sliceIndex_lower = mod(sliceIndexInSlicemaps_lower, slicesPerSlicemap);

    sliceIndex_upper = mod(sliceIndexInSlicemaps_upper, slicesPerSlicemap);

    sliceIndex_middle = mod(sliceIndexInSlicemaps_middle, slicesPerSlicemap);

//Calculates x and y offset for the coordinates in the current slice
    x_offset_lower = fract(sliceIndex_lower/uSlicesOverX);
    y_offset_lower = floor(sliceIndex_lower/uSlicesOverY)/uSlicesOverY;

    x_offset_upper = fract(sliceIndex_upper/uSlicesOverX);
    y_offset_upper = floor(sliceIndex_upper/uSlicesOverY)/uSlicesOverY;

    x_offset_middle = fract(sliceIndex_middle/uSlicesOverX);
    y_offset_middle = floor(sliceIndex_middle/uSlicesOverY)/uSlicesOverY;

//Variables for Bilinear Interpolation

//They contain the value for the specfic position
float A, B, C, D;
//They contain the coords for each position
vec2 Apos, Bpos, Cpos, Dpos;
vec2 Midpos, Midpos_1, Midpos_2;
float weightA, weightD, weightB, weightC;
float E, F;
float weightE, weightF;
float interpValue;

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( texIndexOfSlicemap_lower == <%=i%> )
        {
          //imagine a square (made out of 4 pixels), which lies inbetween two slices,
          //where the center point is the value at volpos.z
          //where (Apos.x/Apos.y) describe the coords for the lower left corner (pixel)
          //note: starting point(0,0) of axis are upper left corner
          Apos.x = x_offset_lower + (volpos.x/uSlicesOverX);
          Apos.y = (y_offset_lower ) + ((volpos.y + pixellength)/uSlicesOverY);
          A = texture2D(uSliceMaps[<%=i%>],Apos).x;

          //(Bpos.x/Bpos.y) describe the coords for the upper left corner
          Bpos.x = Apos.x; //still same x-coords
          Bpos.y = (y_offset_lower ) + ((volpos.y - pixellength)/uSlicesOverY);
          B = texture2D(uSliceMaps[<%=i%>],Bpos).x;

          //(Cpos.x/Cpos.y) describe the coords for the upper right corner
          Cpos.x = x_offset_upper + (volpos.x/uSlicesOverX);
          Cpos.y = (y_offset_upper ) + ((volpos.y - pixellength)/uSlicesOverY);
          C = texture2D(uSliceMaps[<%=i%>],Cpos).x;

          //(Dpos.x/Dpos.y) describe the coords for the lower right corner
          Dpos.x = Cpos.x; //still same x-coords
          Dpos.y = (y_offset_upper ) + ((volpos.y + pixellength)/uSlicesOverY);
          D = texture2D(uSliceMaps[<%=i%>],Dpos).x;

          //Calculating the weights (see linear interpolation formula)

          //weight of A and D (x-direction)
          Midpos.x = x_offset_middle + (volpos.x/uSlicesOverX);

          weightA = A * ((Dpos.x-Midpos.x)/(Dpos.x-Apos.x));
          weightD = D * ((Midpos.x-Apos.x)/(Dpos.x-Apos.x));

          E = weightA + weightD;

          //weight of B and C (x-direction)
          weightB = B * ((Cpos.x-Midpos.x)/(Cpos.x-Bpos.x));
          weightC = C * ((Midpos.x-Bpos.x)/(Cpos.x-Bpos.x));

          F = weightB + weightC;

          //Linear interpolation between E and F (y-direction)

          Midpos.y = (y_offset_middle) + (volpos.y/uSlicesOverY);

          Midpos_1.y = (y_offset_middle ) + ((volpos.y - pixellength)/uSlicesOverY);

          Midpos_2.y = (y_offset_middle ) + ((volpos.y + pixellength)/uSlicesOverY);

          weightE = E * ((Midpos_1.y - Midpos.y) /(Midpos_1.y - Midpos_2.y));
          weightF = F * ((Midpos.y - Midpos_2.y) /(Midpos_1.y - Midpos_2.y));

          interpValue = weightE+weightF;

        }

        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>


    return interpValue;

}

void main(void)
{
  const int uStepsI = 255;
  const float uStepsF = float(uStepsI);

 vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;

 vec4 backColor = texture2D(uBackCoord,texC);

 vec3 dir = backColor.rgb - frontColor.rgb;

 vec4 vpos = frontColor;

 vec3 Step = dir/uStepsF;

 vec4 accum = vec4(0, 0, 0, 0);
 vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);
 vec4 colorValue = vec4(0, 0, 0, 0);
 float biggest_gray_value = 0.0;

 float opacityFactor = uOpacityVal;
 float lightFactor = uColorVal;

 for(int i = 0; i < uStepsI; i+=1)
 {
 // It because expression i > uStepsI impossible
     if(i == uStepsI) {
         break;
     }

     float gray_val = getVolumeValue(vpos.xyz);

     if(gray_val < uMinGrayVal || gray_val > uMaxGrayVal) {
         colorValue = vec4(0.0);
     } else {
         if(biggest_gray_value < gray_val) {
            biggest_gray_value = gray_val;
         }

         if(uAbsorptionModeIndex == 0.0)
         {
             vec2 tf_pos;
             tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);
             tf_pos.y = 0.5;

             colorValue = texture2D(uTransferFunction,tf_pos);
             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);

             sample.a = colorValue.a * opacityFactor;
             sample.rgb = colorValue.rgb * uColorVal;
             accum += sample;

             if(accum.a>=1.0)
                break;

         }

         if(uAbsorptionModeIndex == 1.0)
         {
             vec2 tf_pos;
             tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);
             tf_pos.y = 0.5;

             colorValue = texture2D(uTransferFunction,tf_pos);
             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);

             sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);
             sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * lightFactor;
             accum += sample;

             if(accum.a>=1.0)
                break;

         }

         if(uAbsorptionModeIndex == 2.0)
         {
             vec2 tf_pos;
             tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);
             tf_pos.y = 0.5;

             colorValue = texture2D(uTransferFunction,tf_pos);
             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);
             sample.a = 1.0; //sample.a = colorValue.a * opacityFactor;
             sample.rgb = colorValue.rgb; //sample.rgb = colorValue.rgb * uColorVal;

             accum = sample;

         }

     }

     //advance the current position
     vpos.xyz += Step;

     //break if the position is greater than <1, 1, 1>
     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)
     {
         break;
     }

 }

 gl_FragColor = accum;

}
