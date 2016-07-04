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
    float sliceIndexInSlicemaps_middle, sliceIndex_middle;
    float x_offset_lower, y_offset_lower;
    float x_offset_upper, y_offset_upper;
    float x_offset_middle, y_offset_middle;
    float pixellength;

    // How many slices does 1 slicemap have?
    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY;

    // Determine globalindex (with respect to total numbers of slices) of current slice
    sliceIndexInSlicemaps_lower = floor(volpos.z*uNumberOfSlices);
    sliceIndexInSlicemaps_upper = ceil(volpos.z*uNumberOfSlices);
    sliceIndexInSlicemaps_middle = volpos.z*uNumberOfSlices;

    // Calculate length of 1 pixel in 1 slice
    pixellength =  (1.00/(uSlicemapWidth/uSlicesOverX)); //  == [1.00/resolution_of_one_slice]

    // In which slicemap is this "current" slice located? (Or: Which Slicemap do we use?) (Calculates current index of Slicemap)
    int texIndexOfSlicemap_lower = int(floor(sliceIndexInSlicemaps_lower / slicesPerSlicemap));

    // What is the index of the slice in the current slicemap?
    sliceIndex_lower = mod(sliceIndexInSlicemaps_lower, slicesPerSlicemap);
    sliceIndex_upper = mod(sliceIndexInSlicemaps_upper, slicesPerSlicemap);
    sliceIndex_middle = mod(sliceIndexInSlicemaps_middle, slicesPerSlicemap);

    // Calculates x and y offset for the coordinates in the current slice
    x_offset_lower = fract(sliceIndex_lower/uSlicesOverX);
    y_offset_lower = floor(sliceIndex_lower/uSlicesOverY)/uSlicesOverY;
    x_offset_upper = fract(sliceIndex_upper/uSlicesOverX);
    y_offset_upper = floor(sliceIndex_upper/uSlicesOverY)/uSlicesOverY;
    x_offset_middle = fract(sliceIndex_middle/uSlicesOverX);
    y_offset_middle = floor(sliceIndex_middle/uSlicesOverY)/uSlicesOverY;

    // Variables for Trilinear Interpolation
    // They contain the value for the specfic position
    // (lower slice)
    float l00, l01, l10, l11;
    // their coordinates are in:
    vec2 l00pos, l01pos, l10pos,l11pos;

    // ... upper slice,
    float u00, u01, u10, u11;
    vec2 u00pos, u01pos, u10pos,u11pos;

    // weights of each of 1. interpolation
    float weight_l00, weight_l01, weight_l10, weight_l11;
    float weight_u00, weight_u01, weight_u10, weight_u11;

    // Middle interpolated values, coords and weights (2nd interpolation)
    float m00, m11, m01, m10;
    vec2 m00pos, m01pos, m10pos, m11pos;
    float weight_m00, weight_m01, weight_m10, weight_m11;

    // Last interpolated values, coords and weights
    float a00, a11;
    vec2 a00pos, a11pos;
    float weight_a00, weight_a11;

    // Final interpolated value, coords (where volpos.z stays original)
    float c00;
    vec2 m_orig;
    vec2 c00pos;

    float interpValue;

    float norm_x, norm_y, norm_z;
    float ceil_x, ceil_y;
    float floor_x, floor_y;
    float weight_z_up, weight_z;
    float pix_area = (pixellength*pixellength);
    float A_final, B_final, C_final, D_final;
    float new_interpolated;

    // calculating the "normalized" of volpos.x/.y/.z
    norm_x = (volpos.x*uSlicemapWidth);
    norm_y = (volpos.y*uSlicemapWidth);
    norm_z = (volpos.z*uNumberOfSlices);

    ceil_x = ceil(norm_x)/uSlicemapWidth;
    floor_x = floor(norm_x)/uSlicemapWidth;
    ceil_y = ceil(norm_y)/uSlicemapWidth;
    floor_y = floor(norm_y)/uSlicemapWidth;

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( texIndexOfSlicemap_lower == <%=i%> )
        {
          /**
           * see Trilinear Interpolation formula
           * imagine a cube (made out of 8 pixels), which lies inbetween two slices,
           * where the center-middle point is the value at volpos.z
            *note: starting point(0,0) of axis are upper left corner
            */

          // Lowerslice coords calculation
          // where (l11pos.x/l11pos.y) describe the coords for the front lower left corner (pixel)
          l11pos.x = x_offset_lower+(ceil_x/uSlicesOverX);
          l11pos.y = y_offset_lower+(ceil_y/uSlicesOverX);
          l11 = texture2D(uSliceMaps[<%=i%>],l11pos).x;

          // back lower left corner
          l01pos.x = x_offset_lower+(floor_x/uSlicesOverX);
          l01pos.y = l11pos.y; // still same y-coords
          l01 = texture2D(uSliceMaps[<%=i%>],l01pos).x;

          // front upper left corner
          l10pos.x = l11pos.x;
          l10pos.y = y_offset_lower+(floor_y/uSlicesOverX);
          l10 = texture2D(uSliceMaps[<%=i%>],l10pos).x;

          // back upper left corner
          l00pos.x = l01pos.x;
          l00pos.y = l10pos.y;
          l00 = texture2D(uSliceMaps[<%=i%>],l00pos).x;

          // UpperSlice coords calculation
          // front lower right corner
          u11pos.x = x_offset_upper+(ceil_x/uSlicesOverX);
          u11pos.y = y_offset_upper+(ceil_y/uSlicesOverX);
          u11 = texture2D(uSliceMaps[<%=i%>],u11pos).x;

          // back lower right corner
          u01pos.x = x_offset_upper+(floor_x/uSlicesOverX);
          u01pos.y = u11pos.y;
          u01 = texture2D(uSliceMaps[<%=i%>],u01pos).x;

          // front upper right corner
          u10pos.x = u11pos.x;
          u10pos.y = y_offset_upper+(floor_y/uSlicesOverX);
          u10 = texture2D(uSliceMaps[<%=i%>],u10pos).x;

          // back upper right corner
          u00pos.x = u01pos.x;
          u00pos.y = u10pos.y;
          u00 = texture2D(uSliceMaps[<%=i%>],u00pos).x;

          /**
          *Middle interpolated coords calculation
           * coords for interpolated value of l11 and u11
           * front middle but at same height (y-coords) as l11 and u11
           * exactly (next pixel) diagonal underneath center-middle point of volpos.z
           * see Trilinear Interpolation for better understanding
           */
          m11pos.x = x_offset_middle+(ceil_x/uSlicesOverX);
          m11pos.y = y_offset_middle+(ceil_y/uSlicesOverX);

          // ... of l01 and u01
          // back middle but at same height (y-coords) as l01 and u01
          m01pos.x = x_offset_middle+(floor_x/uSlicesOverX);
          m01pos.y = m11pos.y;

          // ... of l10 and u10
          // front middle but at same height (y-coords) as l10 and u10
          m10pos.x = m11pos.x;
          m10pos.y = y_offset_middle+(floor_y/uSlicesOverX);

          // ... of l10 and u10
          // front middle but at same height (y-coords) as l10 and u10
          m00pos.x = m01pos.x;
          m00pos.y = m10pos.y;

          // Original center-middle "untouched" coords for volpos.z
          m_orig.x = x_offset_middle+(volpos.x/uSlicesOverX);
          m_orig.y = y_offset_middle+(volpos.y/uSlicesOverX);

          // last Interpolation cords
          a00pos.x = m01pos.x;
          a00pos.y = m_orig.y;
          a11pos.x = m10pos.x;
          a11pos.y = m_orig.y;

          // Final values coords
          c00pos.x = m_orig.x;
          c00pos.y = m_orig.y;

          // Calculating the weights and values of 1. interpolation "dimension"
          // m00
          weight_l00 = l00 * ((u00pos.x-m00pos.x)/(u00pos.x-l00pos.x));
          weight_u00 = u00 * ((m00pos.x-l00pos.x)/(u00pos.x-l00pos.x));
          m00 = weight_l00+weight_u00;

          // m01
          weight_l01 = l01 * ((u01pos.x-m01pos.x)/(u01pos.x-l01pos.x));
          weight_u01 = u01 * ((m01pos.x-l01pos.x)/(u01pos.x-l01pos.x));
          m01 = weight_l01+weight_u01;

          // m10
          weight_l10 = l10 * ((u10pos.x-m10pos.x)/(u10pos.x-l10pos.x));
          weight_u10 = u10 * ((m10pos.x-l10pos.x)/(u10pos.x-l10pos.x));
          m10 = weight_l10+weight_u10;

          // m11
          weight_l11 = l11 * ((u11pos.x-m11pos.x)/(u11pos.x-l11pos.x));
          weight_u11 = u11 * ((m11pos.x-l11pos.x)/(u11pos.x-l11pos.x));
          m11 = weight_l11+weight_u11;

          // Calculating the weights and values of 2. interpolation "dimension"
          // a00
          weight_m00 = m00 * ((a00pos.y-m01pos.y)/(m00pos.y-m01pos.y));
          weight_m01 = m01 * ((m00pos.y-a00pos.y)/(m00pos.y-m01pos.y));
          a00 = weight_m00+weight_m01;

          // a11
          weight_m10 = m10 * ((a11pos.y-m11pos.y)/(m10pos.y-m11pos.y));
          weight_m11 = m11 * ((m10pos.y-a11pos.y)/(m10pos.y-m11pos.y));
          a11 = weight_m10+weight_m11;


          // Calculating the weights and values of 3. interpolation "dimension"
          weight_a00 = a00 * ((a11pos.x-c00pos.x)/(a11pos.x-a00pos.x));
          weight_a11 = a11 * ((c00pos.x-a00pos.x)/(a11pos.x-a00pos.x));
          c00 = weight_a00+weight_a11;

          interpValue = c00;

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
 // dir /= length(dir);

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
