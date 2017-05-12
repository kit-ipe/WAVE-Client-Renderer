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


float getTextureValue(int slicemapNo, vec2 texpos)
{
    float value = 0.0;
    vec3 value_vec;
    
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( slicemapNo == <%=i%> )
        {
          value_vec = texture2D(uSliceMaps[<%=i%>],texpos).rgb;
          //value = ((value_vec.r + value_vec.g + value_vec.b)/3.0);
          value = ((value_vec.r * 0.299)+(value_vec.g * 0.587)+(value_vec.b * 0.114));
          value = vale_rec.r;
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
 
 
 
 // Empty Skipping
 for(int i = 0; i < 4096; i+=1)
 {
     if(i == uStepsI) 
         break;
 
     float gray_val = getValueTri(vpos.xyz);
   
     if(gray_val <= uMinGrayVal || gray_val >= uMaxGrayVal) 
         uStepsF -= 1.0;
     
     vpos.xyz += Step;
     
     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) 
         break; 

 }

 vpos = frontColor;
 
 
 
 for(int i = 0; i < 4096; i+=1)
 {
     if(i == uStepsI)
         break;

     float gray_val = getValueTri(vpos.xyz);

     if(gray_val < uMinGrayVal || gray_val > uMaxGrayVal) 
     {
         colorValue = vec4(0.0);
         accum=accum+colorValue;

         if(accum.a>=1.0)
            break;

     } 
     else 
     {
         if(biggest_gray_value < gray_val) 
            biggest_gray_value = gray_val;

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
           sample.rgb = colorValue.rgb * lightFactor;
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
           sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * lightFactor; 
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
             sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * lightFactor; 
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
             sample.rgb = colorValue.rgb * lightFactor;

             accum = sample;

         }

     }

     //advance the current position
     vpos.xyz += Step;
     
     //break if the position is greater than <1, 1, 1> 
     if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0) 
         break; 
     
 }

 gl_FragColor = accum;

}
