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

// returns total number of slices of all slicemaps
uniform float uNumberOfSlices;
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
    float dx_lower, dy_lower;
    float dx_upper, dy_upper;

    // How many slices does 1 slicemap have?
    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY;

    // matlab eps == pow(2.0,(-52.0))
    float eps = pow(2.0,(-17.0));

    /** Determine index of current slice (with respect to total numbers of slices)
      * Accessing real data here only works with -1.0*eps:
      * sliceIndexInSlicemaps_lower = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices)-1.0*eps))+0.5);
      * but we get 'aliasing' in form of one slice appearing at the front, therefore we use it currently without eps.
      * We also took care of this half pixel adaption (real mapping)
      */
    sliceIndexInSlicemaps_lower = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices-1.0)))+0.5);
    sliceIndexInSlicemaps_upper = ceil(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices-1.0)))+0.5);

    // Which Slicemap do we use? (Calculates current index of Slicemap)
    int texIndexOfSlicemap = int(floor(sliceIndexInSlicemaps_lower / slicesPerSlicemap));

    // What is the index of the slice in the current slicemap?
    sliceIndex_lower = mod(sliceIndexInSlicemaps_lower, slicesPerSlicemap);
    sliceIndex_upper = mod(sliceIndexInSlicemaps_upper, slicesPerSlicemap);

    // Calculates x and y offset for the coordinates in the current slice
    dx_lower = fract(sliceIndex_lower/uSlicesOverX);
    dy_lower = floor(sliceIndex_lower/uSlicesOverY)/uSlicesOverY;
    dx_upper = fract(sliceIndex_upper/uSlicesOverX);
    dy_upper = floor(sliceIndex_upper/uSlicesOverY)/uSlicesOverY;

    vec2 texpos1,texpos2;

    float sWidth = uSlicemapWidth;
    float sX = uSlicesOverX;
    float sY = uSlicesOverY;

    // Due to edge calculation problems, we adjust the volpos.x and .y
      if(volpos.x < (0.5/((sWidth/sX)-1.0))) {
          volpos.x = (0.5/((sWidth/sX)-1.0));
      } else
          if(volpos.x >= ((((sWidth/sX)-1.0)-0.5)/((sWidth/sX)-1.0))) {
              // subtracting -10.0*eps so that we never land exactly on the last slice
              volpos.x =  (((((sWidth/sX)-1.0)-0.5)/((sWidth/sX)-1.0))-10.0*eps) ;
          }

      if(volpos.y < (0.5/((sWidth/sY)-1.0))) {
          volpos.y = (0.5/((sWidth/sY)-1.0));
      } else
         if(volpos.y >= ((((sWidth/sY)-1.0)-0.5)/((sWidth/sY)-1.0))) {
             volpos.y =  (((((sWidth/sY)-1.0)-0.5)/((sWidth/sY)-1.0))-10.0*eps) ;
         }

    /** Calculating the current texture position of the x/y-coordiante with respect to its offset
      * Multipling volpos.x with (number of slices-1),... because of the
      * half pixel shift mapping.
      */
    texpos1.x = (dx_lower+(((volpos.x*((sWidth/sX)-1.0))/(sWidth/sX))/(sX)));
    texpos1.y = (dy_lower+(((volpos.y*((sWidth/sY)-1.0))/(sWidth/sY))/(sY)));
    texpos2.x = (dx_upper+(((volpos.x*((sWidth/sX)-1.0))/(sWidth/sX))/(sX)));
    texpos2.y = (dy_upper+(((volpos.y*((sWidth/sY)-1.0))/(sWidth/sY))/(sY)));


    // Trilinear interpolation variables
    float xpixel_1, xpixel_2, ypixel_1, ypixel_2;
    float lo_weightX_1, lo_weightX_2, lo_weightY_1, lo_weightY_2;

    float low_1, low_2, low_3, low_4;
    vec2 low_1_vec, low_2_vec, low_3_vec, low_4_vec;
    vec3 low_1_val, low_2_val, low_3_val, low_4_val;
    float low_sum;

    float xpixel_1_upper, xpixel_2_upper, ypixel_1_upper, ypixel_2_upper;

    float upp_1, upp_2, upp_3, upp_4;
    float up_weightX_1, up_weightX_2, up_weightY_1, up_weightY_2;
    vec2 upp_1_vec, upp_2_vec, upp_3_vec, upp_4_vec;
    vec3 upp_1_val, upp_2_val, upp_3_val, upp_4_val;
    float upp_sum;

    float weight_z_low, weight_z_upp;
    // Calculating z-axis weight
    weight_z_low = 1.0 - fract(volpos.z*(uNumberOfSlices-1.0));
    weight_z_upp = abs(1.0 - weight_z_low);

    float interp;

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( texIndexOfSlicemap == <%=i%> )
        {
          // Lower slice calculation of nearest 4 pixels and their weights
          xpixel_1 = (floor(((texpos1.x*sWidth)+0.5))+0.5);
          xpixel_2 = (floor(((texpos1.x*sWidth)+0.5))-0.5);
          ypixel_1 = (floor(((texpos1.y*sWidth)+0.5))+0.5);
          ypixel_2 = (floor(((texpos1.y*sWidth)+0.5))-0.5);

          lo_weightX_1 = 1.0-abs(xpixel_1-(texpos1.x*sWidth));
          lo_weightX_2 = 1.0-abs(xpixel_2-(texpos1.x*sWidth));
          lo_weightY_1 = 1.0-abs(ypixel_1-(texpos1.y*sWidth));
          lo_weightY_2 = 1.0-abs(ypixel_2-(texpos1.y*sWidth));

          // adjusting the coordinates to a mapping of 0...1, because of texture2D
          low_1_vec.x = (xpixel_1/sWidth);
          low_1_vec.y = (ypixel_1/sWidth);
          // calling the texture and saving the value
          low_1_val = texture2D(uSliceMaps[<%=i%>], low_1_vec).rgb;
          low_1 =  ((low_1_val.r + low_1_val.g + low_1_val.b)/3.0)*lo_weightX_1*lo_weightY_1;

          low_2_vec.x = (xpixel_2/sWidth);
          low_2_vec.y = (ypixel_1/sWidth);
          low_2_val = texture2D(uSliceMaps[<%=i%>], low_2_vec).rgb;
          low_2 =  ((low_2_val.r + low_2_val.g + low_2_val.b)/3.0)*lo_weightX_2*lo_weightY_1;

          low_3_vec.x = (xpixel_1/sWidth);
          low_3_vec.y = (ypixel_2/sWidth);
          low_3_val = texture2D(uSliceMaps[<%=i%>], low_3_vec).rgb;
          low_3 =  ((low_3_val.r + low_3_val.g + low_3_val.b)/3.0)*lo_weightX_1*lo_weightY_2;

          low_4_vec.x = (xpixel_2/sWidth);
          low_4_vec.y = (ypixel_2/sWidth);
          low_4_val = texture2D(uSliceMaps[<%=i%>], low_4_vec).rgb;
          low_4 =  ((low_4_val.r + low_4_val.g + low_4_val.b)/3.0)*lo_weightX_2*lo_weightY_2;

          low_sum = (low_1 + low_2 + low_3 + low_4)*weight_z_low;


          //Same procedure for upperslice
          xpixel_1_upper = (floor(((texpos2.x*sWidth)+0.5))+0.5);
          xpixel_2_upper = (floor(((texpos2.x*sWidth)+0.5))-0.5);
          ypixel_1_upper = (floor(((texpos2.y*sWidth)+0.5))+0.5);
          ypixel_2_upper = (floor(((texpos2.y*sWidth)+0.5))-0.5);

          up_weightX_1 = 1.0-abs(xpixel_1_upper-(texpos2.x*sWidth));
          up_weightX_2 = 1.0-abs(xpixel_2_upper-(texpos2.x*sWidth));
          up_weightY_1 = 1.0-abs(ypixel_1_upper-(texpos2.y*sWidth));
          up_weightY_2 = 1.0-abs(ypixel_2_upper-(texpos2.y*sWidth));


          upp_1_vec.x = (xpixel_1_upper/sWidth);
          upp_1_vec.y = (ypixel_1_upper/sWidth);
          upp_1_val = texture2D(uSliceMaps[<%=i%>], upp_1_vec).rgb;
          upp_1 =  ((upp_1_val.r + upp_1_val.g + upp_1_val.b)/3.0)*up_weightX_1*up_weightY_1;

          upp_2_vec.x = (xpixel_2_upper/sWidth);
          upp_2_vec.y = (ypixel_1_upper/sWidth);
          upp_2_val = texture2D(uSliceMaps[<%=i%>], upp_2_vec).rgb;
          upp_2 =  ((upp_2_val.r + upp_2_val.g + upp_2_val.b)/3.0)*up_weightX_2*up_weightY_1;

          upp_3_vec.x = (xpixel_1_upper/sWidth);
          upp_3_vec.y = (ypixel_2_upper/sWidth);
          upp_3_val = texture2D(uSliceMaps[<%=i%>], upp_3_vec).rgb;
          upp_3 =  ((upp_3_val.r + upp_3_val.g + upp_3_val.b)/3.0)*up_weightX_1*up_weightY_2;

          upp_4_vec.x = (xpixel_2_upper/sWidth);
          upp_4_vec.y = (ypixel_2_upper/sWidth);
          upp_4_val = texture2D(uSliceMaps[<%=i%>], upp_4_vec).rgb;
          upp_4 =  ((upp_4_val.r + upp_4_val.g + upp_4_val.b)/3.0)*up_weightX_2*up_weightY_2;

          upp_sum = (upp_1 + upp_2 + upp_3 + upp_4)*weight_z_upp;

          interp = low_sum+upp_sum;
        }

        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>

    return interp;

}

void main(void)
{

 int uStepsI;
 float uStepsF;
 vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;

 vec4 backColor = texture2D(uBackCoord,texC);

 vec3 dir = backColor.rgb - frontColor.rgb;
 vec4 vpos = frontColor;

 float dir_length = length(dir);
 uStepsF = ceil((dir_length)*(uNumberOfSlices-1.0)); // Schrittanzahl

 vec3 Step = dir/uStepsF;

 uStepsI = int(uStepsF); // Schrittanzahl

 vec4 accum = vec4(0, 0, 0, 0);
 vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);
 vec4 colorValue = vec4(0, 0, 0, 0);
 float biggest_gray_value = 0.0;

 float opacityFactor = uOpacityVal;
 float lightFactor = uColorVal;


 for(int i = 0; i < 4096; i+=1)
 {
     if(i == uStepsI) {
         break;
     }

     float gray_val = getVolumeValue(vpos.xyz);

     if(gray_val < uMinGrayVal || gray_val > uMaxGrayVal) {
         // colorValue = vec4(0.0,0.0,0.0,((gray_val*(1.0/uOpacityVal)/(sqrt(3)*(uNumberOfSlices-1.0)))));
         colorValue = vec4(0.0,0.0,0.0,0.0);

         accum=accum+colorValue;

         if(accum.a>=1.0)
            break;

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
             // colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);

             sample.a = colorValue.a * opacityFactor;
             sample.rgb = colorValue.rgb * uColorVal;
             accum += sample;

             if(accum.a>=1.0)
                break;

         }

         if(uAbsorptionModeIndex == 1.0)
         {
             vec2 tf_pos;
             tf_pos.x = gray_val;
             // because this is a filtering function, which we dont want:
             // (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);
             tf_pos.y = 0.5;

             colorValue = texture2D(uTransferFunction,tf_pos);
             // colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);

             // maximum distance in a cube
             float max_d = sqrt(3.0);

             // alternative mode:
             // each pixel same opactiy value (1.0)
             // -2.0 because of 1. and last slice
             sample.a = 1.0/(1.0+uOpacityVal*(max_d*(uNumberOfSlices-2.0)));// (step_length/dir_length); //colorValue.a * (1.0 / uStepsF);  //* opacityFactor;
             // each pixel's gropactiy is depending on the gray_val
             // sample.a = gray_val * 1.0/(1.0+uOpacityVal*(max_d*(uNumberOfSlices-2.0))));// (step_length/dir_length); //colorValue.a * (1.0 / uStepsF);  //* opacityFactor; //opacity schätzung über grauwwert (bildinhalt)

             //sample.a = gray_val*(1.0/uOpacityVal);
             sample.rgb = colorValue.rgb * sample.a; //(1.0 - accum.a) ; //* lightFactor;
             //sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);
             //sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * lightFactor;
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

             sample.a = 1.0; //colorValue.a * opacityFactor;
             sample.rgb = colorValue.rgb; // * uColorVal;

             accum = sample;

         }

     }

     //advance the current position
     vpos.xyz += Step;

      //break if the position is greater than <1, 1, 1>
      //if(vpos.x > 1.0-eps || vpos.y > 1.0-eps || vpos.z > 1.0-eps || vpos.x < 0.0+eps || vpos.y < 0.0+eps || vpos.z < 0.0+eps)
      //vpos.x > backColor.r || vpos.y > backColor.g ||vpos.z > backColor.b ||
      //{
      //    break;
      //}

 }


 gl_FragColor = accum;

}
