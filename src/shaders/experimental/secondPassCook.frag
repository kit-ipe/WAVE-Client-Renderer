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

    float x00, x01, x10, x11, x0, x1;
    float y00, y01, y10, y11, y0, y1;
    float z00, z01, z10, z11, z0, z1;
    float weight_z0, weight_z1;

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( iTexLowerIndex == <%=i%> )
        {
            texpos1.x = dx1+((at.x - 1.0/144.0 )/uSlicesOverX);
            texpos1.y = dy1+(at.y/uSlicesOverY);
            x00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy1+(at.y/uSlicesOverY);
            x01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;


            texpos1.x = dx1+(at.x/uSlicesOverX);
            texpos1.y = dy1+((at.y-1.0/144.0) /uSlicesOverY);
            y00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+(at.x/uSlicesOverX);
            texpos1.y = dy1+((at.y+1.0/144.0)/uSlicesOverY);
            y01 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx1+(at.x/uSlicesOverX);
            texpos1.y = dy1+(at.y/uSlicesOverY);
            z00 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

           
        }
        if( iTexUpperIndex == <%=i%> ) {
            texpos1.x = dx2+((at.x - 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+(at.y/uSlicesOverY);
            x10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+((at.x + 1.0/144.0)/uSlicesOverX);
            texpos1.y = dy2+(at.y/uSlicesOverY);
            x11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(at.x/uSlicesOverX);
            texpos1.y = dy2+((at.y-1.0/144.0) /uSlicesOverY);
            y10 = texture2D(uSliceMaps[<%=i%>],texpos1).x;

            texpos1.x = dx2+(at.x/uSlicesOverX);
            texpos1.y = dy2+((at.y+1.0)/uSlicesOverY);
            y11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(at.x/uSlicesOverX);
            texpos1.y = dy2+(at.y/uSlicesOverY);
            z11 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }

    <% } %>
    // we need to get interpolation of 2 x points

    x0 = ((weight * (x10 - x00)) + x00);
    x1 = ((weight * (x11 - x01)) + x01);
    
    y0 = ((weight * (y10 - y00)) + y00);
    y1 = ((weight * (y11 - y01)) + y01);
    
    weight_z0 = (at.z - (1.0/144.0)) - floor(at.z);
    weight_z1 = (at.z + (1.0/144.0)) - floor(at.z);
    z0 = ((weight_z0 * (z11 - z00)) + z00);
    z1 = ((weight_z1 * (z11 - z00)) + z00);
    
    z0 = z00;
    z1 = z11;

    vec3 n = vec3(x1 - x0 , y1 - y0 , z1 - z0);
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
            
            // set important material values
            float roughnessValue = 0.3; // 0 : smooth, 1: rough
            float F0 = 0.8; // fresnel reflectance at normal incidence
            float k = 0.2; // fraction of diffuse reflection (specular reflection = 1 - k)
            vec3 lightColor = vec3(0.9, 0.1, 0.1);
    
            // interpolating normals will change the length of the normal, so renormalize the normal.
            vec3 normal = normalize(getNormal(vpos.xyz));
    
            // do the lighting calculation for each fragment.
            vec3 lightPos = vec3(2.0,4.0,5.0);
            vec3 lightDirection = normalize(lightPos - vpos.xyz);
            float NdotL = max(dot(normal, lightDirection), 0.0);
            
            float specular = 0.0;
            if(NdotL > 0.0)
            {
                vec3 eyeDir = normalize(cameraPosition - vpos.xyz);

                // calculate intermediary values
                vec3 halfVector = normalize(lightDirection + eyeDir);
                float NdotH = max(dot(normal, halfVector), 0.0); 
                float NdotV = max(dot(normal, eyeDir), 0.0); // note: this could also be NdotL, which is the same value
                float VdotH = max(dot(eyeDir, halfVector), 0.0);
                float mSquared = roughnessValue * roughnessValue;
        
                // geometric attenuation
                float NH2 = 2.0 * NdotH;
                float g1 = (NH2 * NdotV) / VdotH;
                float g2 = (NH2 * NdotL) / VdotH;
                float geoAtt = min(1.0, min(g1, g2));
     
                // roughness (or: microfacet distribution function)
                // beckmann distribution function
                float r1 = 1.0 / ( 4.0 * mSquared * pow(NdotH, 4.0));
                float r2 = (NdotH * NdotH - 1.0) / (mSquared * NdotH * NdotH);
                float roughness = r1 * exp(r2);
        
                // fresnel
                // Schlick approximation
                float fresnel = pow(1.0 - VdotH, 5.0);
                fresnel *= (1.0 - F0);
                fresnel += F0;
        
                specular = (fresnel * geoAtt * roughness) / (NdotV * NdotL * 3.14);
            }
            
            vec3 finalValue = lightColor * colorValue.xxx * NdotL * (k + specular * (1.0 - k));
            
            //sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a;
            sample.rgb = (1.0 - accum.a) * finalValue.xyz * sample.a;
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
