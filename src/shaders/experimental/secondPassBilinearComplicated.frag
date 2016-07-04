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
    float x_offset_lower, y_offset_lower;
    float x_offset_upper, y_offset_upper;
    float pixellength;

    // How many slices does 1 slicemap have?
    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY;

    // Determine globalindex (with respect to total numbers of slices) of current slice
    sliceIndexInSlicemaps_lower = floor(volpos.z*(uNumberOfSlices-1.0));
    sliceIndexInSlicemaps_upper = ceil(volpos.z*(uNumberOfSlices-1.0));

    // Calculate length of 1 pixel in 1 slice
    pixellength =  (1.00/uSlicemapWidth); // == [1.00/resolution_of_one_slice]

    // In which slicemap is this "current" slice located? (Or: Which Slicemap do we use?) (Calculates current index of Slicemap)
    int texIndexOfSlicemap_lower = int(floor(sliceIndexInSlicemaps_lower / slicesPerSlicemap));

    // What is the index of the slice in the current slicemap?
    sliceIndex_lower = mod(sliceIndexInSlicemaps_lower, slicesPerSlicemap);
    sliceIndex_upper = mod(sliceIndexInSlicemaps_upper, slicesPerSlicemap);

    // Calculates x and y offset for the coordinates in the current slice
    x_offset_lower = fract(sliceIndex_lower/uSlicesOverX);
    y_offset_lower = floor(sliceIndex_lower/uSlicesOverY)/uSlicesOverY;
    x_offset_upper = fract(sliceIndex_upper/uSlicesOverX);
    y_offset_upper = floor(sliceIndex_upper/uSlicesOverY)/uSlicesOverY;

    // Variables for Bilinear Interpolation
    // They contain the value for the specfic position (lower and upper)
    float A, B, C, D;
    float A_up, B_up, C_up, D_up;
    float A_val, B_val, C_val, D_val;

    // They contain the coords for each position (needed for texture2D)
    vec2 Apos, Bpos, Cpos, Dpos;

    // variables that will be needed to calculate the weight within another pixel
    float A_new_x, A_new_y, A_x, A_y, A_area, A_percent;
    float B_new_x, B_new_y, B_x, B_y, B_area, B_percent;
    float C_new_x, C_new_y, C_x, C_y, C_area, C_percent;
    float D_new_x, D_new_y, D_x, D_y, D_area, D_percent;

    float norm_x, norm_y, norm_z;
    float ceil_x, ceil_y;
    float floor_x, floor_y;
    float weight_z_up, weight_z;
    float pix_area = (pixellength*pixellength);
    float A_final, B_final, C_final, D_final;
    float new_interpolated;

    // calculating the "normalized" of volpos.x/.y/.z
    norm_x = (volpos.x*(uSlicemapWidth-1.0));
    norm_y = (volpos.y*(uSlicemapWidth-1.0));
    norm_z = (volpos.z*(uNumberOfSlices-1.0));

    ceil_x = ceil(norm_x)/uSlicemapWidth;
    floor_x = floor(norm_x)/uSlicemapWidth;
    ceil_y = ceil(norm_y)/uSlicemapWidth;
    floor_y = floor(norm_y)/uSlicemapWidth;

    weight_z = (1.00 - fract(norm_z));
    weight_z_up = fract(norm_z);

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( texIndexOfSlicemap_lower == <%=i%> )
        {
          // calculating lower slice:
          // A
          A_new_x = (fract(norm_x))/uSlicemapWidth;
          A_x = pixellength - A_new_x;
          A_new_y = (fract(norm_y))/uSlicemapWidth;
          A_y = pixellength - A_new_y;
          A_area = (A_x*A_y);
          A_percent = (A_area/pix_area);
          Apos.x = x_offset_lower+(floor_x/uSlicesOverX);
          Apos.y = y_offset_lower+(floor_y/uSlicesOverY);
          A_val = texture2D(uSliceMaps[<%=i%>],Apos).x;
          A = A_val * A_percent;

          // B
          B_x = A_new_x;
          B_y = A_y;
          B_area = (B_x*B_y);
          B_percent = (B_area/pix_area);
          Bpos.x = x_offset_lower+(ceil_x/uSlicesOverX);
          Bpos.y = y_offset_lower+(floor_y/uSlicesOverY);
          B_val = texture2D(uSliceMaps[<%=i%>],Bpos).x;
          B = B_val * B_percent;

          // C
          C_x = A_x;
          C_y = A_new_y;
          C_area = (C_x*C_y);
          C_percent = (C_area/pix_area);
          Cpos.x = x_offset_lower+(floor_x/uSlicesOverX);
          Cpos.y = y_offset_lower+(ceil_y/uSlicesOverY);
          C_val = texture2D(uSliceMaps[<%=i%>],Cpos).x;
          C = C_val * C_percent;

          //D
          D_x = A_new_x;
          D_y = A_new_y;
          D_area = (D_x*D_y);
          D_percent = (D_area/pix_area);
          Dpos.x = x_offset_lower+(ceil_x/uSlicesOverX);
          Dpos.y = y_offset_lower+(ceil_y/uSlicesOverY);
          D_val = texture2D(uSliceMaps[<%=i%>],Dpos).x;
          D = D_val * D_percent;

          // calculating the upper slice:
          // A
          A_new_x = (fract(norm_x))/uSlicemapWidth;
          A_x = pixellength - A_new_x;
          A_new_y = (fract(norm_y))/uSlicemapWidth;
          A_y = pixellength - A_new_y;
          A_area = (A_x*A_y);
          A_percent = (A_area/pix_area);
          Apos.x = x_offset_upper+(floor_x/uSlicesOverX);
          Apos.y = y_offset_upper+(floor_y/uSlicesOverY);
          A_val = texture2D(uSliceMaps[<%=i%>],Apos).x;
          A_up = A_val * A_percent;

          // B
          B_x = A_new_x;
          B_y = A_y;
          B_area = (B_x*B_y);
          B_percent = (B_area/pix_area);
          Bpos.x = x_offset_upper+(ceil_x/uSlicesOverX);
          Bpos.y = y_offset_upper+(floor_y/uSlicesOverY);
          B_val = texture2D(uSliceMaps[<%=i%>],Bpos).x;
          B_up = B_val * B_percent;

          // C
          C_x = A_x;
          C_y = A_new_y;
          C_area = (C_x*C_y);
          C_percent = (C_area/pix_area);
          Cpos.x = x_offset_upper+(floor_x/uSlicesOverX);
          Cpos.y = y_offset_upper+(ceil_y/uSlicesOverY);
          C_val = texture2D(uSliceMaps[<%=i%>],Cpos).x;
          C_up = C_val * C_percent;

          // D
          D_x = A_new_x;
          D_y = A_new_y;
          D_area = (D_x*D_y);
          D_percent = (D_area/pix_area);
          Dpos.x = x_offset_upper+(ceil_x/uSlicesOverX);
          Dpos.y = y_offset_upper+(ceil_y/uSlicesOverY);
          D_val = texture2D(uSliceMaps[<%=i%>],Dpos).x;
          D_up = D_val * D_percent;

          // calculating the values with respect to their resepect due to volpos.z
          A_final = (A*weight_z)+(A_up*weight_z_up);
          B_final = (B*weight_z)+(B_up*weight_z_up);
          C_final = (C*weight_z)+(C_up*weight_z_up);
          D_final = (D*weight_z)+(D_up*weight_z_up);

          new_interpolated = (A_final + B_final + C_final + D_final);
        }

        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>

    return new_interpolated;

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
             tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);
             tf_pos.y = 0.5;

             colorValue = texture2D(uTransferFunction,tf_pos);
             // colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);

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
             // colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);
             sample.a = 1.0; // sample.a = colorValue.a * opacityFactor;
             sample.rgb = colorValue.rgb; // sample.rgb = colorValue.rgb * uColorVal;

             accum = sample;

         }

     }

     // advance the current position
     vpos.xyz += Step;

     // break if the position is greater than <1, 1, 1>
     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)
     {
         break;
     }

 }

 gl_FragColor = accum;

}
