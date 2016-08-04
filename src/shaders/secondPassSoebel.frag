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
uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];

uniform float uNumberOfSlices; 
uniform float uOpacityVal; 
uniform float uSlicesOverX; 
uniform float uSlicesOverY; 
uniform float darkness;

uniform float minSos;
uniform float maxSos;

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
    
    float xl00, xl01, xl02, xl10, xl11, xl12;
    float xh00, xh01, xh02, xh10, xh11, xh12;
    float yl00, yl01, yl02, yl10, yl11, yl12;
    float ylc0, ylc1, ylc2, yhc0, yhc1, yhc2;
    float yh00, yh01, yh02, yh10, yh11, yh12;
    float fx, fy, fz;

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( iTexLowerIndex == <%=i%> )
        {
            texpos1.x = dx1+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/144.0)/uSlicesOverY);
            xl00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+(at.y/uSlicesOverY);
            xl01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/144.0)/uSlicesOverY);
            xl02 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/144.0)/uSlicesOverY);
            xl10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+(at.y/uSlicesOverY);
            xl11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/144.0)/uSlicesOverY);
            xl12 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            // y lower slice reference points
            texpos1.x = dx1+((at.x - 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/144.0) / uSlicesOverY);
            yl00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(at.x/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/144.0) /uSlicesOverY);
            yl01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/144.0) / uSlicesOverY);
            yl02 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy1+(at.y / uSlicesOverY);
            ylc0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(at.x/uSlicesOverX);
            texpos1.y = dy1+(at.y /uSlicesOverY);
            ylc1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x - 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy1+(at.y / uSlicesOverY);
            ylc2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;


            texpos1.x = dx1+((at.x - 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/144.0) / uSlicesOverY);
            yl10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(at.x/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/144.0) /uSlicesOverY);
            yl11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/144.0) / uSlicesOverY);
            yl12 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }
        if( iTexUpperIndex == <%=i%> ) {
            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/144.0)/uSlicesOverY);
            xh00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+(at.y/uSlicesOverY);
            xh01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/144.0)/uSlicesOverY);
            xh02 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/144.0)/uSlicesOverY);
            xh10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+(at.y/uSlicesOverY);
            xh11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/144.0)/uSlicesOverY);
            xh12 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            // y upper slice reference points
            texpos1.x = dx2+((at.x - 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/144.0) / uSlicesOverY);
            yh00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(at.x/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/144.0) /uSlicesOverY);
            yh01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/144.0) / uSlicesOverY);
            yh02 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x - 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy2+(at.y / uSlicesOverY);
            yhc0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(at.x/uSlicesOverX);
            texpos1.y = dy2+(at.y /uSlicesOverY);
            yhc1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy2+(at.y / uSlicesOverY);
            yhc2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x - 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/144.0) / uSlicesOverY);
            yh10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(at.x/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/144.0) /uSlicesOverY);
            yh11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/144.0) / uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/144.0) / uSlicesOverY);
            yh12 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }

    <% } %>
    // we need to get interpolation of 2 x points


    // x direction
    // -1 -3 -1   0  0  0   1  3  1
    // -3 -6 -3   0  0  0   3  6  3
    // -1 -3 -1   0  0  0   1  3  1
    
    fx =  ((w0 * (xh00 - xl00)) + xl00) * -1.0;
    fx += ((w1 * (xh00 - xl00)) + xl00) * -3.0;
    fx += ((w2 * (xh00 - xl00)) + xl00) * -1.0;
    
    fx += ((w0 * (xh01 - xl01)) + xl01) * -3.0;
    fx += ((w1 * (xh01 - xl01)) + xl01) * -6.0;
    fx += ((w2 * (xh01 - xl01)) + xl01) * -3.0;
    
    fx += ((w0 * (xh02 - xl02)) + xl02) * -1.0;
    fx += ((w1 * (xh02 - xl02)) + xl02) * -3.0;
    fx += ((w2 * (xh02 - xl02)) + xl02) * -1.0;
    
    fx += ((w0 * (xh10 - xl10)) + xl10) * 1.0;
    fx += ((w1 * (xh10 - xl10)) + xl10) * 3.0;
    fx += ((w2 * (xh10 - xl10)) + xl10) * 1.0;
    
    fx += ((w0 * (xh11 - xl11)) + xl11) * 3.0;
    fx += ((w1 * (xh11 - xl11)) + xl11) * 6.0;
    fx += ((w2 * (xh11 - xl11)) + xl11) * 3.0;
    
    fx += ((w0 * (xh12 - xl12)) + xl12) * 1.0;
    fx += ((w1 * (xh12 - xl12)) + xl12) * 3.0;
    fx += ((w2 * (xh12 - xl12)) + xl12) * 1.0;
    
    // y direction
    //  1  3  1   3  6  3   1  3  1
    //  0  0  0   0  0  0   0  0  0
    // -1 -3 -1  -3 -6 -3  -1 -3 -1
    
    fy =  ((w0 * (yh00 - yl00)) + yl00) * 1.0;
    fy += ((w1 * (yh00 - yl00)) + yl00) * 3.0;
    fy += ((w2 * (yh00 - yl00)) + yl00) * 1.0;
    
    fy += ((w0 * (yh02 - yl02)) + yl02) * -1.0;
    fy += ((w1 * (yh02 - yl02)) + yl02) * -3.0;
    fy += ((w2 * (yh02 - yl02)) + yl02) * -1.0;
    
    fy += ((w0 * (yhc0 - ylc0)) + ylc0) * 3.0;
    fy += ((w1 * (yhc0 - ylc0)) + ylc0) * 6.0;
    fy += ((w2 * (yhc0 - ylc0)) + ylc0) * 3.0;
    
    fy += ((w0 * (yhc2 - ylc2)) + ylc2) * -3.0;
    fy += ((w1 * (yhc2 - ylc2)) + ylc2) * -6.0;
    fy += ((w2 * (yhc2 - ylc2)) + ylc2) * -3.0;

    fy += ((w0 * (yh10 - yl10)) + yl10) * 1.0;
    fy += ((w1 * (yh10 - yl10)) + yl10) * 3.0;
    fy += ((w2 * (yh10 - yl10)) + yl10) * 1.0;
    
    fy += ((w0 * (yh12 - yl12)) + yl12) * -1.0;
    fy += ((w1 * (yh12 - yl12)) + yl12) * -3.0;
    fy += ((w2 * (yh12 - yl12)) + yl12) * -1.0;

    // z direction
    // -1  0  1   -3  0  3   -1  0  1
    // -3  0  3   -6  0  6   -3  0  3
    // -1  0  1   -3  0  3   -1  0  1
    fz =  ((w0 * (yh00 - yl00)) + yl00) * -1.0;
    fz += ((w0 * (yhc0 - ylc0)) + ylc0) * -3.0;
    fz += ((w0 * (yh10 - yl10)) + yl10) * -1.0;
    
    fz += ((w0 * (yh02 - yl02)) + yl02) * 1.0;
    fz += ((w0 * (yhc2 - ylc2)) + ylc2) * 3.0;
    fz += ((w0 * (yh12 - yl12)) + yl12) * 1.0;
    
    fz += ((w1 * (yh00 - yl00)) + yl00) * -3.0;
    fz += ((w1 * (yhc0 - ylc0)) + ylc0) * -6.0;
    fz += ((w1 * (yh10 - yl10)) + yl10) * -3.0;
    
    fz += ((w1 * (yh02 - yl02)) + yl02) * 3.0;
    fz += ((w1 * (yhc2 - ylc2)) + ylc2) * 6.0;
    fz += ((w1 * (yh12 - yl12)) + yl12) * 3.0;
    
    fz += ((w2 * (yh00 - yl00)) + yl00) * -1.0;
    fz += ((w2 * (yhc0 - ylc0)) + ylc0) * -3.0;
    fz += ((w2 * (yh10 - yl10)) + yl10) * -1.0;
    
    fz += ((w2 * (yh02 - yl02)) + yl02) * 1.0;
    fz += ((w2 * (yhc2 - ylc2)) + ylc2) * 3.0;
    fz += ((w2 * (yh12 - yl12)) + yl12) * 1.0;

    vec3 n = vec3( fx , fy , fz );
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
    const float u_matShininess = 256.0;

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
    
    float opacityFactor = uOpacityVal; 
  
    for(int i = 0; i < uStepsI; i++) {       
        vec3 gray_val = getVolumeValue(vpos.xyz); 

        if(gray_val.z < 0.05 || 
           gray_val.x < minSos ||
           gray_val.x > maxSos)  
            colorValue = vec4(0.0);     
        else {
            colorValue.x = (darkness * 2.0 - gray_val.x) * l * 0.4;
            //colorValue.x = gray_val.x;
            colorValue.w = 0.1;
            
            // normalize vectors after interpolation
            vec3 lightPos = vec3(2.0,4.0,5.0);
            vec3 L = normalize(cameraPosition - vpos.xyz);
            vec3 V = normalize( cameraPosition - vpos.xyz );
            vec3 N = normalize(getNormal(vpos.xyz));

            // get Blinn-Phong reflectance components
            vec3 Iamb = ambientLighting();
            vec3 Idif = diffuseLighting(N, L);
            vec3 Ispe = specularLighting(N, L, V);

            // diffuse color of the object from texture
            //vec3 diffuseColor = texture(u_diffuseTexture, o_texcoords).rgb;
        
            vec3 mycolor = (Iamb + Idif + Ispe);
            //vec3 mycolor = colorValue.xxx * (Iamb + Ispe);
        
            //sample.rgb = N;
            //sample.rgb = mycolor;
            //sample.a = 1.0;
            sample.rgb = (1.0 - accum.a) * mycolor * sample.a;
            //sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a;
            sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);
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
