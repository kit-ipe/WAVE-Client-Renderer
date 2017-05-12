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
    
    float eps =pow(2.0,-16.0);
    if (volpos.x >= 1.0)
        volpos.x = 1.0-eps;
    if (volpos.y >= 1.0)
        volpos.y = 1.0-eps;
    if (volpos.z >= 1.0)
        volpos.z = 1.0-eps;
    
    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY; 

    //float sliceNo = floor(volpos.z*(uNumberOfSlices-1.0));     //Floor
    //float sliceNo = floor(volpos.z*(uNumberOfSlices-1.0)+0.5);     //Nearestneighbor
    float sliceNo = floor(volpos.z*(uNumberOfSlices));
    //float sliceNo = floor(((volpos.z-(0.5/uNumberOfSlices))*((uNumberOfSlices-1.0)))+0.5);    //Guevens code
    
    int texIndexOfSlicemap = int(floor(sliceNo / slicesPerSlicemap));

    float s1 = mod(sliceNo, slicesPerSlicemap);

    float dx1 = fract(s1/uSlicesOverX);
    float dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;      
       
    float sliceSizeX = uSlicemapWidth/uSlicesOverX;
    float sliceSizeY = uSlicemapWidth/uSlicesOverY;
    
    texpos1.x = dx1+(floor(volpos.x*sliceSizeX)+0.5)/uSlicemapWidth;
    texpos1.y = dy1+(floor(volpos.y*sliceSizeY)+0.5)/uSlicemapWidth;
   
    texpos1_frac.x = texpos1.x;
    texpos1_frac.y = texpos1.y;
    
    
    
    // Guevens code
    // To prevent long coding lines:
    float sWidth = uSlicemapWidth;
    float sX = uSlicesOverX;
    float sY = uSlicesOverY;
     
    texpos1.x = (dx1+(((volpos.x*((sWidth/sX)-1.0))/(sWidth/sX))/(sX)));
    texpos1.y = (dy1+(((volpos.y*((sWidth/sY)-1.0))/(sWidth/sY))/(sY)));

    // Nearest neighbor over x/y axis
    texpos1_frac.x =(0.5+floor(((texpos1.x+(0.5/(sWidth)))*sWidth)))/sWidth; //upscaling so that flooring is possible
    texpos1_frac.y =(0.5+floor(((texpos1.y+(0.5/(sWidth)))*sWidth)))/sWidth;
    
    
    
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( texIndexOfSlicemap == <%=i%> )
        {
          value1_vec = texture2D(uSliceMaps[<%=i%>],texpos1_frac).rgb;
          //value1 = ((value1_vec.r + value1_vec.g + value1_vec.b)/3.0);
          value1 = ((value1_vec.r * 0.299)+(value1_vec.g * 0.587)+(value1_vec.b * 0.114));
        }

        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>
    

    return value1;

}

void main(void)
{

 vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;
 vec4 backColor = texture2D(uBackCoord,texC);
 vec3 dir = backColor.rgb - frontColor.rgb;
 vec4 vpos = frontColor;
 
 
 float dir_length = length(dir);
 float uStepsF = ceil((dir_length)*(uNumberOfSlices-1.0));
 vec3 Step = dir/(uStepsF);
 int uStepsI = int(uStepsF);
 

 vec4 accum = vec4(0, 0, 0, 0);
 vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);
 vec4 colorValue = vec4(0, 0, 0, 0);
 float biggest_gray_value = 0.0;

 float opacityFactor = uOpacityVal;
 float lightFactor = uColorVal;
 

 /*
 // Empty Skipping
 for(int i = 0; i < 4096; i+=1)
 {
     if(i == uStepsI) 
         break;
 
     float gray_val = getVolumeValue(vpos.xyz);
   
     if(gray_val <= uMinGrayVal || gray_val >= uMaxGrayVal) 
         uStepsF -= 1.0;
     
     vpos.xyz += Step;
     
     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) 
         break; 

 }

 vpos = frontColor;
 */
 
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
           //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);
           tf_pos.x = gray_val;
           tf_pos.y = 0.5;

           colorValue = texture2D(uTransferFunction,tf_pos);
           //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);

           sample.a = 1.0; 
           //sample.a = colorValue.a * opacityFactor;
           sample.rgb = colorValue.rgb * uColorVal;
           accum += sample;

           if(accum.a>=1.0)
              break;
         }

         /*
         // Guevens mode
         if(uAbsorptionModeIndex == 1.0)
         {
           vec2 tf_pos;
           
           //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);
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
           sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * uColorVal; 
           //sample.rgb =  colorValue.rgb * sample.a;
           accum += sample;

           if(accum.a>=1.0)
              break;

         }*/
         
         
         
         // Stevens mode
         if(uAbsorptionModeIndex == 1.0) 
         { 
             vec2 tf_pos; 
             //tf_pos.x = (gray_val - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal); 
             tf_pos.x = gray_val;
             tf_pos.y = 0.5; 

             colorValue = texture2D(uTransferFunction,tf_pos);
             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0); 

             sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); 
             sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * uColorVal; 
             accum += sample; 

             if(accum.a>=1.0) 
                break; 
                
         }
         
         

         if(uAbsorptionModeIndex == 2.0)
         {
             vec2 tf_pos;
             //tf_pos.x = (biggest_gray_value - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);
             tf_pos.x = biggest_gray_value;
             tf_pos.y = 0.5;

             colorValue = texture2D(uTransferFunction,tf_pos);
             //colorValue = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);
             sample.a = 1.0; //colorValue.a * opacityFactor;
             sample.rgb = colorValue.rgb * uColorVal;

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
