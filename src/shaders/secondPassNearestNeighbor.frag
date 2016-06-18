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
    float dx_lower, dy_lower;
    float value1 = 0.0;
    vec2 texpos1, texpos1_frac;
    vec3 value1_vec;

    // matlab eps == pow(2.0,(-52.0))
    float eps = pow(2.0,(-17.0));

    // How many slices does 1 slicemap have?
    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY;

    /** Determine index of current slice (with respect to total numbers of slices)
      * Accessing real data here only works with -1.0*eps:
      * sliceIndexInSlicemaps_lower = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices)-1.0*eps))+0.5);
      * but we get 'aliasing' in form of one slice appearing at the front, therefore we use it currently without eps.
      * We also took care of this half pixel adaption (real mapping)
      */
    sliceIndexInSlicemaps_lower = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices-1.0)))+0.5);

    // Which Slicemap do we use? (Calculates current index of Slicemap)
    int texIndexOfSlicemap = int(floor(sliceIndexInSlicemaps_lower / slicesPerSlicemap));

    // What is the index of the slice in the current slicemap?
    sliceIndex_lower = mod(sliceIndexInSlicemaps_lower, slicesPerSlicemap);

    // Calculates x and y offset for the coordinates in the current slice
    dx_lower = fract(sliceIndex_lower/uSlicesOverX);
    dy_lower = floor(sliceIndex_lower/uSlicesOverY)/uSlicesOverY;

    // To prevent long coding lines:
    float sWidth = uSlicemapWidth;
    float sX = uSlicesOverX;
    float sY = uSlicesOverY;

    // Due to edge calculation problems, we adjust the volpos.x and .y
    if(volpos.x < (0.5/((sWidth/sX)-1.0))) {
        volpos.x = (0.5/((sWidth/sX)-1.0));
    } else
        if(volpos.x >= ((((sWidth/sX)-1.0)-0.5)/((sWidth/sX)-1.0))) {
          // subtracting -10.0*eps so that we never land exactly on the last slice
          volpos.x =  (((((sWidth/sX)-1.0)-0.5)/((sWidth/sX)-1.0))-10.0*eps);
          }
    if(volpos.y < (0.5/((sWidth/sY)-1.0))) {
        volpos.y = (0.5/((sWidth/sY)-1.0));
      } else
         if(volpos.y >= ((((sWidth/sY)-1.0)-0.5)/((sWidth/sY)-1.0))) {
           volpos.y =  (((((sWidth/sY)-1.0)-0.5)/((sWidth/sY)-1.0))-10.0*eps);
         }

    /** Calculating the current texture position of the x/y-coordiante with respect to its offset
      * Multipling volpos.x with (number of slices-1),... because of the
      * half pixel shift mapping.
      */
    texpos1.x = (dx_lower+(((volpos.x*((sWidth/sX)-1.0))/(sWidth/sX))/(sX)));
    texpos1.y = (dy_lower+(((volpos.y*((sWidth/sY)-1.0))/(sWidth/sY))/(sY)));

    // Nearest neighbor over x/y axis
    texpos1_frac.x =(0.5+floor(((texpos1.x+(0.5/(sWidth)))*4096.0)))/4096.0; //upscaling so that flooring is possible
    texpos1_frac.y =(0.5+floor(((texpos1.y+(0.5/(sWidth)))*4096.0)))/4096.0;


    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( texIndexOfSlicemap == <%=i%> )
        {
          value1_vec = texture2D(uSliceMaps[<%=i%>],texpos1_frac).rgb;
          value1 = ((value1_vec.r + value1_vec.g + value1_vec.b)/3.0);
          value1 = texture2D(uSliceMaps[<%=i%>],texpos1_frac).x;
        }

        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>

    return value1;

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
 uStepsF = ceil((dir_length)*(uNumberOfSlices-1.0));

 vec3 Step = dir/uStepsF;

 uStepsI = int(uStepsF);

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
         colorValue = vec4(0.0);
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
           // position of x is defined by the gray_value instead of a filtering
           tf_pos.x = gray_val;
           tf_pos.y = 0.5;

           // maximum distance in a cube
           float max_d = sqrt(3.0);

           colorValue = texture2D(uTransferFunction,tf_pos);
           //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);

           // alternative mode, this way the user can change the length of
           // the penetrating ray, by using the opacityFactor-switch in the  gui
           // -2.0 because of 1. and last slice:
           sample.a = 1.0/(1.0+uOpacityVal*(max_d*(uNumberOfSlices-2.0)));
           sample.rgb = colorValue.rgb * sample.a;
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
 }

 gl_FragColor = accum;

}
