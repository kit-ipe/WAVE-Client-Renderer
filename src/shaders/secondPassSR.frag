precision mediump int; 
precision mediump float;

varying vec4 frontColor; 
varying vec4 pos; 

uniform sampler2D uBackCoord; 
uniform sampler2D uTransferFunction;
uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];

uniform float uNumberOfSlices; 
uniform float uMinGrayVal; 
uniform float uMaxGrayVal; 
uniform float uOpacityVal; 
uniform float uColorVal; 
uniform float uAbsorptionModeIndex;
uniform float uSlicesOverX; 
uniform float uSlicesOverY; 
uniform float refl; 
uniform float sat; 
uniform float sos; 

// uniform int uAvailable_textures_number;

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

// x - R, y - G, z - B
// x - H, y - S, z - V
vec3 hsv2rgb(vec3 hsv) 
{
    float     hue, p, q, t, ff;
    int        i;    
    
    hsv.z+=refl;  
    hsv.x*=360.0*sos;     
  
    hue=hsv.x >= 360.0?hsv.x-360.0:hsv.x;
    
    hue /= 60.0;
    i = int(hue);
    ff = hue - float(i); 
    p = hsv.z * (1.0 - sat);
    q = hsv.z * (1.0 - (sat * ff));
    t = hsv.z * (1.0 - (sat * (1.0 - ff)));

    if(i==0)
        return vec3(hsv.z,t,p);
    
    else if(i==1)
      return vec3(q,hsv.z,p);
        
    else if(i==2)     
        return vec3(p,hsv.z,t);
        
    else if(i==3)
        return vec3(p,q,hsv.z);
        
    else if(i==4)
        return vec3(t,p,hsv.z);
        
    else
        return vec3(hsv.z,p,q);
}

void main(void)
{
 const int uStepsI = 144;
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
  
 for(int i = 0; i < uStepsI; i++) 
 {       
     vec3 gray_val = getVolumeValue(vpos.xyz); 

     if(gray_val.z < uMinGrayVal || gray_val.z > uMaxGrayVal)  
         colorValue = vec4(0.0);    
     else { 
            if(biggest_gray_value < gray_val.z)  
              biggest_gray_value = gray_val.z;    
                                              
                           
            float xPosX = (gray_val.x - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal); 
            float xPosY = (gray_val.y) / (0.6); //3 is max atten
            float xPosZ = (gray_val.z - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal); 

            colorValue.xw = texture2D(uTransferFunction,vec2(xPosX,0.5)).xw;
            colorValue.y = texture2D(uTransferFunction,vec2(xPosY,0.5)).y;
            colorValue.z = texture2D(uTransferFunction,vec2(xPosZ,0.5)).z;
              
            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF); 
            sample.rgb = (1.0 - accum.a) * hsv2rgb(colorValue.rgb) * sample.a * lightFactor; 
             
            accum += sample; 

            if(accum.a>=1.0) 
               break; 
     }    
   
     //advance the current position 
     vpos.xyz += Step;  
   
   if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 || vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)      
         break;  
 } 

 gl_FragColor = accum; 
}