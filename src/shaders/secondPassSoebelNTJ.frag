// This is an experimental shader to implement
// blinn phong shading model.
// In this example, I use the USCT breast model 
// with a total of 144 slices as the dataset.
// Hence the gradient operator is divided by 144 for 
// a single unit. Uncomment line 271 to see the normals
// calculated by the gradient operator function.

//precision mediump int; 
//precision mediump float;

varying vec4 frontColor; 
varying vec4 pos; 

uniform sampler2D uColormap; 
uniform sampler2D uBackCoord; 
uniform sampler2D uSliceMaps[<%= maxTexturesNumber %>];

uniform float uNumberOfSlices; 
uniform float uOpacityVal; 
uniform float uSlicesOverX; 
uniform float uSlicesOverY; 
uniform float darkness;

uniform vec3 uLightPos;
uniform int uSetViewMode;

uniform float uSteps;
uniform float uMinGrayVal;
uniform float uMaxGrayVal;
uniform float minSos;
uniform float maxSos;

uniform float l; 
uniform float s; 
uniform float hMin; 
uniform float hMax; 

// returns total number of slices of all slicemaps
uniform float uSlicemapWidth;

float getVolumeValue(vec3 volpos)
{
    float value1 = 0.0;
    vec2 texpos1;
    vec3 value1_vec;
    
    float eps =pow(2.0,-16.0);
    if (volpos.x >= 1.0)
        volpos.x = 1.0-eps;
    if (volpos.y >= 1.0)
        volpos.y = 1.0-eps;
    if (volpos.z >= 1.0)
        volpos.z = 1.0-eps;
    
    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY; 

    float sliceNo = floor(volpos.z*(uNumberOfSlices));
    
    int texIndexOfSlicemap = int(floor(sliceNo / slicesPerSlicemap));

    float s1 = mod(sliceNo, slicesPerSlicemap);

    float dx1 = fract(s1/uSlicesOverX);
    float dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;      
       
    float sliceSizeX = uSlicemapWidth/uSlicesOverX;
    float sliceSizeY = uSlicemapWidth/uSlicesOverY;
    
    texpos1.x = dx1+(floor(volpos.x*sliceSizeX)+0.5)/uSlicemapWidth;
    texpos1.y = dy1+(floor(volpos.y*sliceSizeY)+0.5)/uSlicemapWidth;
 
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( texIndexOfSlicemap == <%=i%> )
        {
          value1_vec = texture2D(uSliceMaps[<%=i%>],texpos1).rgb;
          //value1 = ((value1_vec.r + value1_vec.g + value1_vec.b)/3.0);
          //value1 = ((value1_vec.r * 0.299)+(value1_vec.g * 0.587)+(value1_vec.b * 0.114));
          value1 = value1_vec.r;
        }

        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>
    

    return value1;

}

/*
//Acts like a texture3D using Z slices and trilinear filtering. 
vec3 getVolumeValue(vec3 volpos)
{
    float s1Original, s2Original, s1, s2; 
    float dx1, dy1; 

    vec2 texpos1,texpos2; 

    float eps =pow(2.0,-16.0);
    if (volpos.x >= 1.0)
        volpos.x = 1.0-eps;
    if (volpos.y >= 1.0)
        volpos.y = 1.0-eps;
    if (volpos.z >= 1.0)
        volpos.z = 1.0-eps;

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
*/

// Compute the Normal around the current voxel
vec3 getVolumeValue_Soebel(vec3 at)
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
    float w0 = (at.z - (1.0/uNumberOfSlices)) - floor(at.z);
    float w2 = (at.z + (1.0/uNumberOfSlices)) - floor(at.z);
    
    
    float fx, fy, fz;
    
    float L0, L1, L2, L3, L4, L5, L6, L7, L8;
    float H0, H1, H2, H3, H4, H5, H6, H7, H8;

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( iTexLowerIndex == <%=i%> )
        {
            texpos1.x = dx1+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
        }
        if( iTexUpperIndex == <%=i%> ) {
            texpos1.x = dx2+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            H0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            H1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            H2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            H3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            H4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            H5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            H6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            H7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            H8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }

    <% } %>

    float value = (L4*(1.0-weight)) + (H4*(weight));

    vec3 n = vec3(value);
    return n;
}


// Compute the Normal around the current voxel
vec3 getNormalSmooth(vec3 at)
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
    float w0 = (at.z - (1.0/uNumberOfSlices)) - floor(at.z);
    float w2 = (at.z + (1.0/uNumberOfSlices)) - floor(at.z);
    
    
    float fx, fy, fz;
    
    float L0, L1, L2, L3, L4, L5, L6, L7, L8;
    float H0, H1, H2, H3, H4, H5, H6, H7, H8;

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( iTexLowerIndex == <%=i%> )
        {
            texpos1.x = dx1+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
        }
        if( iTexUpperIndex == <%=i%> ) {
            texpos1.x = dx2+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            H0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            H1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            H2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            H3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            H4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            H5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            H6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            H7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            H8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }

    <% } %>
    // we need to get interpolation of 2 x points


    // x direction
    // -1 -3 -1   0  0  0   1  3  1
    // -3 -6 -3   0  0  0   3  6  3
    // -1 -3 -1   0  0  0   1  3  1

    // y direction
    //  1  3  1   3  6  3   1  3  1
    //  0  0  0   0  0  0   0  0  0
    // -1 -3 -1  -3 -6 -3  -1 -3 -1

    // z direction
    // -1  0  1   -3  0  3   -1  0  1
    // -3  0  3   -6  0  6   -3  0  3
    // -1  0  1   -3  0  3   -1  0  1
    /*
    fx =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fx += ((w1 * (H0 - L0)) + L0) * -2.0;
    fx += ((w2 * (H0 - L0)) + L0) * -1.0;
    
    fx += ((w0 * (H3 - L3)) + L3) * -2.0;
    fx += ((w1 * (H3 - L3)) + L3) * -4.0; //-4.0
    fx += ((w2 * (H3 - L3)) + L3) * -2.0;
    
    fx += ((w0 * (H6 - L6)) + L6) * -1.0;
    fx += ((w1 * (H6 - L6)) + L6) * -2.0;
    fx += ((w2 * (H6 - L6)) + L6) * -1.0;
    
    fx += ((w0 * (H1 - L1)) + L1) * 0.0;
    fx += ((w1 * (H1 - L1)) + L1) * 0.0;
    fx += ((w2 * (H1 - L1)) + L1) * 0.0;
    
    fx += ((w0 * (H4 - L4)) + L4) * 0.0;
    fx += ((w1 * (H4 - L4)) + L4) * 0.0;
    fx += ((w2 * (H4 - L4)) + L4) * 0.0;
    
    fx += ((w0 * (H7 - L7)) + L7) * 0.0;
    fx += ((w1 * (H7 - L7)) + L7) * 0.0;
    fx += ((w2 * (H7 - L7)) + L7) * 0.0;
    
    fx += ((w0 * (H2 - L2)) + L2) * 1.0;
    fx += ((w1 * (H2 - L2)) + L2) * 2.0;
    fx += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fx += ((w0 * (H5 - L5)) + L5) * 2.0;
    fx += ((w1 * (H5 - L5)) + L5) * 4.0; //4.0
    fx += ((w2 * (H5 - L5)) + L5) * 2.0;
    
    fx += ((w0 * (H8 - L8)) + L8) * 1.0;
    fx += ((w1 * (H8 - L8)) + L8) * 2.0;
    fx += ((w2 * (H8 - L8)) + L8) * 1.0;

    
    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fy += ((w1 * (H0 - L0)) + L0) * 2.0;
    fy += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fy += ((w0 * (H3 - L3)) + L3) * 0.0;
    fy += ((w1 * (H3 - L3)) + L3) * 0.0;
    fy += ((w2 * (H3 - L3)) + L3) * 0.0;
    
    fy += ((w0 * (H6 - L6)) + L6) * -1.0;
    fy += ((w1 * (H6 - L6)) + L6) * -2.0;
    fy += ((w2 * (H6 - L6)) + L6) * -1.0;
    
    fy += ((w0 * (H1 - L1)) + L1) * 2.0;
    fy += ((w1 * (H1 - L1)) + L1) * 4.0; // 4.0
    fy += ((w2 * (H1 - L1)) + L1) * 2.0;
    
    fy += ((w0 * (H4 - L4)) + L4) * 0.0;
    fy += ((w1 * (H4 - L4)) + L4) * 0.0;
    fy += ((w2 * (H4 - L4)) + L4) * 0.0;
    
    fy += ((w0 * (H7 - L7)) + L7) * -2.0;
    fy += ((w1 * (H7 - L7)) + L7) * -4.0; // -4.0
    fy += ((w2 * (H7 - L7)) + L7) * -2.0;
    
    fy += ((w0 * (H2 - L2)) + L2) * 1.0;
    fy += ((w1 * (H2 - L2)) + L2) * 2.0;
    fy += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fy += ((w0 * (H5 - L5)) + L5) * 0.0;
    fy += ((w1 * (H5 - L5)) + L5) * 0.0;
    fy += ((w2 * (H5 - L5)) + L5) * 0.0;
    
    fy += ((w0 * (H8 - L8)) + L8) * -1.0;
    fy += ((w1 * (H8 - L8)) + L8) * -2.0;
    fy += ((w2 * (H8 - L8)) + L8) * -1.0;

    fz =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fz += ((w1 * (H0 - L0)) + L0) * 0.0;
    fz += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fz += ((w0 * (H3 - L3)) + L3) * -2.0;
    fz += ((w1 * (H3 - L3)) + L3) * 0.0;
    fz += ((w2 * (H3 - L3)) + L3) * 2.0;
    
    fz += ((w0 * (H6 - L6)) + L6) * -1.0;
    fz += ((w1 * (H6 - L6)) + L6) * 0.0;
    fz += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fz += ((w0 * (H1 - L1)) + L1) * -2.0;
    fz += ((w1 * (H1 - L1)) + L1) * 0.0;
    fz += ((w2 * (H1 - L1)) + L1) * 2.0;
    
    fz += ((w0 * (H4 - L4)) + L4) * -4.0; //-4.0
    fz += ((w1 * (H4 - L4)) + L4) * 0.0;
    fz += ((w2 * (H4 - L4)) + L4) * 4.0; // 4.0
    
    fz += ((w0 * (H7 - L7)) + L7) * -2.0;
    fz += ((w1 * (H7 - L7)) + L7) * 0.0;
    fz += ((w2 * (H7 - L7)) + L7) * 2.0;
    
    fz += ((w0 * (H2 - L2)) + L2) * -1.0;
    fz += ((w1 * (H2 - L2)) + L2) * 0.0;
    fz += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fz += ((w0 * (H5 - L5)) + L5) * -2.0;
    fz += ((w1 * (H5 - L5)) + L5) * 0.0;
    fz += ((w2 * (H5 - L5)) + L5) * 2.0;
    
    fz += ((w0 * (H8 - L8)) + L8) * -1.0;
    fz += ((w1 * (H8 - L8)) + L8) * 0.0;
    fz += ((w2 * (H8 - L8)) + L8) * 1.0;
    */


    /*
    fx =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fx += ((w1 * (H0 - L0)) + L0) * -2.0;
    fx += ((w2 * (H0 - L0)) + L0) * -1.0;
    
    fx += ((w0 * (H3 - L3)) + L3) * -2.0;
    fx += ((w1 * (H3 - L3)) + L3) * 0.0; //-4.0
    fx += ((w2 * (H3 - L3)) + L3) * -2.0;
    
    fx += ((w0 * (H6 - L6)) + L6) * -1.0;
    fx += ((w1 * (H6 - L6)) + L6) * -2.0;
    fx += ((w2 * (H6 - L6)) + L6) * -1.0;
    
    fx += ((w0 * (H1 - L1)) + L1) * 0.0;
    fx += ((w1 * (H1 - L1)) + L1) * 0.0;
    fx += ((w2 * (H1 - L1)) + L1) * 0.0;
    
    fx += ((w0 * (H4 - L4)) + L4) * 0.0;
    fx += ((w1 * (H4 - L4)) + L4) * 0.0;
    fx += ((w2 * (H4 - L4)) + L4) * 0.0;
    
    fx += ((w0 * (H7 - L7)) + L7) * 0.0;
    fx += ((w1 * (H7 - L7)) + L7) * 0.0;
    fx += ((w2 * (H7 - L7)) + L7) * 0.0;
    
    fx += ((w0 * (H2 - L2)) + L2) * 1.0;
    fx += ((w1 * (H2 - L2)) + L2) * 2.0;
    fx += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fx += ((w0 * (H5 - L5)) + L5) * 2.0;
    fx += ((w1 * (H5 - L5)) + L5) * 0.0; //4.0
    fx += ((w2 * (H5 - L5)) + L5) * 2.0;
    
    fx += ((w0 * (H8 - L8)) + L8) * 1.0;
    fx += ((w1 * (H8 - L8)) + L8) * 2.0;
    fx += ((w2 * (H8 - L8)) + L8) * 1.0;
  
    
    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fy += ((w1 * (H0 - L0)) + L0) * 2.0;
    fy += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fy += ((w0 * (H3 - L3)) + L3) * 0.0;
    fy += ((w1 * (H3 - L3)) + L3) * 0.0;
    fy += ((w2 * (H3 - L3)) + L3) * 0.0;
    
    fy += ((w0 * (H6 - L6)) + L6) * -1.0;
    fy += ((w1 * (H6 - L6)) + L6) * -2.0;
    fy += ((w2 * (H6 - L6)) + L6) * -1.0;
    
    fy += ((w0 * (H1 - L1)) + L1) * 2.0;
    fy += ((w1 * (H1 - L1)) + L1) * 0.0; // 4.0
    fy += ((w2 * (H1 - L1)) + L1) * 2.0;
    
    fy += ((w0 * (H4 - L4)) + L4) * 0.0;
    fy += ((w1 * (H4 - L4)) + L4) * 0.0;
    fy += ((w2 * (H4 - L4)) + L4) * 0.0;
    
    fy += ((w0 * (H7 - L7)) + L7) * -2.0;
    fy += ((w1 * (H7 - L7)) + L7) * 0.0; // -4.0
    fy += ((w2 * (H7 - L7)) + L7) * -2.0;
    
    fy += ((w0 * (H2 - L2)) + L2) * 1.0;
    fy += ((w1 * (H2 - L2)) + L2) * 2.0;
    fy += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fy += ((w0 * (H5 - L5)) + L5) * 0.0;
    fy += ((w1 * (H5 - L5)) + L5) * 0.0;
    fy += ((w2 * (H5 - L5)) + L5) * 0.0;
    
    fy += ((w0 * (H8 - L8)) + L8) * -1.0;
    fy += ((w1 * (H8 - L8)) + L8) * -2.0;
    fy += ((w2 * (H8 - L8)) + L8) * -1.0;

    fz =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fz += ((w1 * (H0 - L0)) + L0) * 0.0;
    fz += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fz += ((w0 * (H3 - L3)) + L3) * -2.0;
    fz += ((w1 * (H3 - L3)) + L3) * 0.0;
    fz += ((w2 * (H3 - L3)) + L3) * 2.0;
    
    fz += ((w0 * (H6 - L6)) + L6) * -1.0;
    fz += ((w1 * (H6 - L6)) + L6) * 0.0;
    fz += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fz += ((w0 * (H1 - L1)) + L1) * -2.0;
    fz += ((w1 * (H1 - L1)) + L1) * 0.0;
    fz += ((w2 * (H1 - L1)) + L1) * 2.0;
    
    fz += ((w0 * (H4 - L4)) + L4) * 0.0; //-4.0
    fz += ((w1 * (H4 - L4)) + L4) * 0.0;
    fz += ((w2 * (H4 - L4)) + L4) * 0.0; // 4.0
    
    fz += ((w0 * (H7 - L7)) + L7) * -2.0;
    fz += ((w1 * (H7 - L7)) + L7) * 0.0;
    fz += ((w2 * (H7 - L7)) + L7) * 2.0;
    
    fz += ((w0 * (H2 - L2)) + L2) * -1.0;
    fz += ((w1 * (H2 - L2)) + L2) * 0.0;
    fz += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fz += ((w0 * (H5 - L5)) + L5) * -2.0;
    fz += ((w1 * (H5 - L5)) + L5) * 0.0;
    fz += ((w2 * (H5 - L5)) + L5) * 2.0;
    
    fz += ((w0 * (H8 - L8)) + L8) * -1.0;
    fz += ((w1 * (H8 - L8)) + L8) * 0.0;
    fz += ((w2 * (H8 - L8)) + L8) * 1.0;
    */    
   
    fx =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fx += ((w1 * (H0 - L0)) + L0) * 1.0;
    fx += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fx += ((w0 * (H3 - L3)) + L3) * 1.0;
    fx += ((w1 * (H3 - L3)) + L3) * 1.0;
    fx += ((w2 * (H3 - L3)) + L3) * 1.0;
    
    fx += ((w0 * (H6 - L6)) + L6) * 1.0;
    fx += ((w1 * (H6 - L6)) + L6) * 1.0;
    fx += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fx += ((w0 * (H1 - L1)) + L1) * 1.0;
    fx += ((w1 * (H1 - L1)) + L1) * 1.0;
    fx += ((w2 * (H1 - L1)) + L1) * 1.0;
    
    fx += ((w0 * (H4 - L4)) + L4) * 1.0;
    fx += ((w1 * (H4 - L4)) + L4) * 1.0;
    fx += ((w2 * (H4 - L4)) + L4) * 1.0;
    
    fx += ((w0 * (H7 - L7)) + L7) * 1.0;
    fx += ((w1 * (H7 - L7)) + L7) * 1.0;
    fx += ((w2 * (H7 - L7)) + L7) * 1.0;
    
    fx += ((w0 * (H2 - L2)) + L2) * 1.0;
    fx += ((w1 * (H2 - L2)) + L2) * 1.0;
    fx += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fx += ((w0 * (H5 - L5)) + L5) * 1.0;
    fx += ((w1 * (H5 - L5)) + L5) * 1.0;
    fx += ((w2 * (H5 - L5)) + L5) * 1.0;
    
    fx += ((w0 * (H8 - L8)) + L8) * 1.0;
    fx += ((w1 * (H8 - L8)) + L8) * 1.0;
    fx += ((w2 * (H8 - L8)) + L8) * 1.0;

    
    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fy += ((w1 * (H0 - L0)) + L0) * 1.0;
    fy += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fy += ((w0 * (H3 - L3)) + L3) * 1.0;
    fy += ((w1 * (H3 - L3)) + L3) * 1.0;
    fy += ((w2 * (H3 - L3)) + L3) * 1.0;
    
    fy += ((w0 * (H6 - L6)) + L6) * 1.0;
    fy += ((w1 * (H6 - L6)) + L6) * 1.0;
    fy += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fy += ((w0 * (H1 - L1)) + L1) * 1.0;
    fy += ((w1 * (H1 - L1)) + L1) * 1.0;
    fy += ((w2 * (H1 - L1)) + L1) * 1.0;
    
    fy += ((w0 * (H4 - L4)) + L4) * 1.0;
    fy += ((w1 * (H4 - L4)) + L4) * 1.0;
    fy += ((w2 * (H4 - L4)) + L4) * 1.0;
    
    fy += ((w0 * (H7 - L7)) + L7) * 1.0;
    fy += ((w1 * (H7 - L7)) + L7) * 1.0;
    fy += ((w2 * (H7 - L7)) + L7) * 1.0;
    
    fy += ((w0 * (H2 - L2)) + L2) * 1.0;
    fy += ((w1 * (H2 - L2)) + L2) * 1.0;
    fy += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fy += ((w0 * (H5 - L5)) + L5) * 1.0;
    fy += ((w1 * (H5 - L5)) + L5) * 1.0;
    fy += ((w2 * (H5 - L5)) + L5) * 1.0;
    
    fy += ((w0 * (H8 - L8)) + L8) * 1.0;
    fy += ((w1 * (H8 - L8)) + L8) * 1.0;
    fy += ((w2 * (H8 - L8)) + L8) * 1.0;

    fz =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fz += ((w1 * (H0 - L0)) + L0) * 1.0;
    fz += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fz += ((w0 * (H3 - L3)) + L3) * 1.0;
    fz += ((w1 * (H3 - L3)) + L3) * 1.0;
    fz += ((w2 * (H3 - L3)) + L3) * 1.0;
    
    fz += ((w0 * (H6 - L6)) + L6) * 1.0;
    fz += ((w1 * (H6 - L6)) + L6) * 1.0;
    fz += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fz += ((w0 * (H1 - L1)) + L1) * 1.0;
    fz += ((w1 * (H1 - L1)) + L1) * 1.0;
    fz += ((w2 * (H1 - L1)) + L1) * 1.0;
    
    fz += ((w0 * (H4 - L4)) + L4) * 1.0;
    fz += ((w1 * (H4 - L4)) + L4) * 1.0;
    fz += ((w2 * (H4 - L4)) + L4) * 1.0;
    
    fz += ((w0 * (H7 - L7)) + L7) * 1.0;
    fz += ((w1 * (H7 - L7)) + L7) * 1.0;
    fz += ((w2 * (H7 - L7)) + L7) * 1.0;
    
    fz += ((w0 * (H2 - L2)) + L2) * 1.0;
    fz += ((w1 * (H2 - L2)) + L2) * 1.0;
    fz += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fz += ((w0 * (H5 - L5)) + L5) * 1.0;
    fz += ((w1 * (H5 - L5)) + L5) * 1.0;
    fz += ((w2 * (H5 - L5)) + L5) * 1.0;
    
    fz += ((w0 * (H8 - L8)) + L8) * 1.0;
    fz += ((w1 * (H8 - L8)) + L8) * 1.0;
    fz += ((w2 * (H8 - L8)) + L8) * 1.0;

    vec3 n = vec3( fx/27.0 , fy/27.0 , fz/27.0 );
    return n;
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
    float w0 = (at.z - (1.0/uNumberOfSlices)) - floor(at.z);
    float w2 = (at.z + (1.0/uNumberOfSlices)) - floor(at.z);
    
    
    float fx, fy, fz;
    
    float L0, L1, L2, L3, L4, L5, L6, L7, L8;
    float H0, H1, H2, H3, H4, H5, H6, H7, H8;

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( iTexLowerIndex == <%=i%> )
        {
            texpos1.x = dx1+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy1+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
        }
        if( iTexUpperIndex == <%=i%> ) {
            texpos1.x = dx2+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            H0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            H1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 1.0/uNumberOfSlices)/uSlicesOverY);
            H2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            H3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            H4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y + 0.0/uNumberOfSlices)/uSlicesOverY);
            H5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x - 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            H6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x + 0.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            H7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + 1.0/uNumberOfSlices)/uSlicesOverX);
            texpos1.y = dy2+((at.y - 1.0/uNumberOfSlices)/uSlicesOverY);
            H8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }

    <% } %>
    // we need to get interpolation of 2 x points


    // x direction
    // -1 -3 -1   0  0  0   1  3  1
    // -3 -6 -3   0  0  0   3  6  3
    // -1 -3 -1   0  0  0   1  3  1

    // y direction
    //  1  3  1   3  6  3   1  3  1
    //  0  0  0   0  0  0   0  0  0
    // -1 -3 -1  -3 -6 -3  -1 -3 -1

    // z direction
    // -1  0  1   -3  0  3   -1  0  1
    // -3  0  3   -6  0  6   -3  0  3
    // -1  0  1   -3  0  3   -1  0  1
    fx =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fx += ((w1 * (H0 - L0)) + L0) * -2.0;
    fx += ((w2 * (H0 - L0)) + L0) * -1.0;
    
    fx += ((w0 * (H3 - L3)) + L3) * -2.0;
    fx += ((w1 * (H3 - L3)) + L3) * -4.0; //-4.0
    fx += ((w2 * (H3 - L3)) + L3) * -2.0;
    
    fx += ((w0 * (H6 - L6)) + L6) * -1.0;
    fx += ((w1 * (H6 - L6)) + L6) * -2.0;
    fx += ((w2 * (H6 - L6)) + L6) * -1.0;
    
    fx += ((w0 * (H1 - L1)) + L1) * 0.0;
    fx += ((w1 * (H1 - L1)) + L1) * 0.0;
    fx += ((w2 * (H1 - L1)) + L1) * 0.0;
    
    fx += ((w0 * (H4 - L4)) + L4) * 0.0;
    fx += ((w1 * (H4 - L4)) + L4) * 0.0;
    fx += ((w2 * (H4 - L4)) + L4) * 0.0;
    
    fx += ((w0 * (H7 - L7)) + L7) * 0.0;
    fx += ((w1 * (H7 - L7)) + L7) * 0.0;
    fx += ((w2 * (H7 - L7)) + L7) * 0.0;
    
    fx += ((w0 * (H2 - L2)) + L2) * 1.0;
    fx += ((w1 * (H2 - L2)) + L2) * 2.0;
    fx += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fx += ((w0 * (H5 - L5)) + L5) * 2.0;
    fx += ((w1 * (H5 - L5)) + L5) * 4.0; //4.0
    fx += ((w2 * (H5 - L5)) + L5) * 2.0;
    
    fx += ((w0 * (H8 - L8)) + L8) * 1.0;
    fx += ((w1 * (H8 - L8)) + L8) * 2.0;
    fx += ((w2 * (H8 - L8)) + L8) * 1.0;

    
    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fy += ((w1 * (H0 - L0)) + L0) * 2.0;
    fy += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fy += ((w0 * (H3 - L3)) + L3) * 0.0;
    fy += ((w1 * (H3 - L3)) + L3) * 0.0;
    fy += ((w2 * (H3 - L3)) + L3) * 0.0;
    
    fy += ((w0 * (H6 - L6)) + L6) * -1.0;
    fy += ((w1 * (H6 - L6)) + L6) * -2.0;
    fy += ((w2 * (H6 - L6)) + L6) * -1.0;
    
    fy += ((w0 * (H1 - L1)) + L1) * 2.0;
    fy += ((w1 * (H1 - L1)) + L1) * 4.0; // 4.0
    fy += ((w2 * (H1 - L1)) + L1) * 2.0;
    
    fy += ((w0 * (H4 - L4)) + L4) * 0.0;
    fy += ((w1 * (H4 - L4)) + L4) * 0.0;
    fy += ((w2 * (H4 - L4)) + L4) * 0.0;
    
    fy += ((w0 * (H7 - L7)) + L7) * -2.0;
    fy += ((w1 * (H7 - L7)) + L7) * -4.0; // -4.0
    fy += ((w2 * (H7 - L7)) + L7) * -2.0;
    
    fy += ((w0 * (H2 - L2)) + L2) * 1.0;
    fy += ((w1 * (H2 - L2)) + L2) * 2.0;
    fy += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fy += ((w0 * (H5 - L5)) + L5) * 0.0;
    fy += ((w1 * (H5 - L5)) + L5) * 0.0;
    fy += ((w2 * (H5 - L5)) + L5) * 0.0;
    
    fy += ((w0 * (H8 - L8)) + L8) * -1.0;
    fy += ((w1 * (H8 - L8)) + L8) * -2.0;
    fy += ((w2 * (H8 - L8)) + L8) * -1.0;

    fz =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fz += ((w1 * (H0 - L0)) + L0) * 0.0;
    fz += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fz += ((w0 * (H3 - L3)) + L3) * -2.0;
    fz += ((w1 * (H3 - L3)) + L3) * 0.0;
    fz += ((w2 * (H3 - L3)) + L3) * 2.0;
    
    fz += ((w0 * (H6 - L6)) + L6) * -1.0;
    fz += ((w1 * (H6 - L6)) + L6) * 0.0;
    fz += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fz += ((w0 * (H1 - L1)) + L1) * -2.0;
    fz += ((w1 * (H1 - L1)) + L1) * 0.0;
    fz += ((w2 * (H1 - L1)) + L1) * 2.0;
    
    fz += ((w0 * (H4 - L4)) + L4) * -4.0; //-4.0
    fz += ((w1 * (H4 - L4)) + L4) * 0.0;
    fz += ((w2 * (H4 - L4)) + L4) * 4.0; // 4.0
    
    fz += ((w0 * (H7 - L7)) + L7) * -2.0;
    fz += ((w1 * (H7 - L7)) + L7) * 0.0;
    fz += ((w2 * (H7 - L7)) + L7) * 2.0;
    
    fz += ((w0 * (H2 - L2)) + L2) * -1.0;
    fz += ((w1 * (H2 - L2)) + L2) * 0.0;
    fz += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fz += ((w0 * (H5 - L5)) + L5) * -2.0;
    fz += ((w1 * (H5 - L5)) + L5) * 0.0;
    fz += ((w2 * (H5 - L5)) + L5) * 2.0;
    
    fz += ((w0 * (H8 - L8)) + L8) * -1.0;
    fz += ((w1 * (H8 - L8)) + L8) * 0.0;
    fz += ((w2 * (H8 - L8)) + L8) * 1.0;

    /*
    fx =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fx += ((w1 * (H0 - L0)) + L0) * -2.0;
    fx += ((w2 * (H0 - L0)) + L0) * -1.0;
    
    fx += ((w0 * (H3 - L3)) + L3) * -2.0;
    fx += ((w1 * (H3 - L3)) + L3) * 0.0; //-4.0
    fx += ((w2 * (H3 - L3)) + L3) * -2.0;
    
    fx += ((w0 * (H6 - L6)) + L6) * -1.0;
    fx += ((w1 * (H6 - L6)) + L6) * -2.0;
    fx += ((w2 * (H6 - L6)) + L6) * -1.0;
    
    fx += ((w0 * (H1 - L1)) + L1) * 0.0;
    fx += ((w1 * (H1 - L1)) + L1) * 0.0;
    fx += ((w2 * (H1 - L1)) + L1) * 0.0;
    
    fx += ((w0 * (H4 - L4)) + L4) * 0.0;
    fx += ((w1 * (H4 - L4)) + L4) * 0.0;
    fx += ((w2 * (H4 - L4)) + L4) * 0.0;
    
    fx += ((w0 * (H7 - L7)) + L7) * 0.0;
    fx += ((w1 * (H7 - L7)) + L7) * 0.0;
    fx += ((w2 * (H7 - L7)) + L7) * 0.0;
    
    fx += ((w0 * (H2 - L2)) + L2) * 1.0;
    fx += ((w1 * (H2 - L2)) + L2) * 2.0;
    fx += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fx += ((w0 * (H5 - L5)) + L5) * 2.0;
    fx += ((w1 * (H5 - L5)) + L5) * 0.0; //4.0
    fx += ((w2 * (H5 - L5)) + L5) * 2.0;
    
    fx += ((w0 * (H8 - L8)) + L8) * 1.0;
    fx += ((w1 * (H8 - L8)) + L8) * 2.0;
    fx += ((w2 * (H8 - L8)) + L8) * 1.0;
  
    
    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fy += ((w1 * (H0 - L0)) + L0) * 2.0;
    fy += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fy += ((w0 * (H3 - L3)) + L3) * 0.0;
    fy += ((w1 * (H3 - L3)) + L3) * 0.0;
    fy += ((w2 * (H3 - L3)) + L3) * 0.0;
    
    fy += ((w0 * (H6 - L6)) + L6) * -1.0;
    fy += ((w1 * (H6 - L6)) + L6) * -2.0;
    fy += ((w2 * (H6 - L6)) + L6) * -1.0;
    
    fy += ((w0 * (H1 - L1)) + L1) * 2.0;
    fy += ((w1 * (H1 - L1)) + L1) * 0.0; // 4.0
    fy += ((w2 * (H1 - L1)) + L1) * 2.0;
    
    fy += ((w0 * (H4 - L4)) + L4) * 0.0;
    fy += ((w1 * (H4 - L4)) + L4) * 0.0;
    fy += ((w2 * (H4 - L4)) + L4) * 0.0;
    
    fy += ((w0 * (H7 - L7)) + L7) * -2.0;
    fy += ((w1 * (H7 - L7)) + L7) * 0.0; // -4.0
    fy += ((w2 * (H7 - L7)) + L7) * -2.0;
    
    fy += ((w0 * (H2 - L2)) + L2) * 1.0;
    fy += ((w1 * (H2 - L2)) + L2) * 2.0;
    fy += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fy += ((w0 * (H5 - L5)) + L5) * 0.0;
    fy += ((w1 * (H5 - L5)) + L5) * 0.0;
    fy += ((w2 * (H5 - L5)) + L5) * 0.0;
    
    fy += ((w0 * (H8 - L8)) + L8) * -1.0;
    fy += ((w1 * (H8 - L8)) + L8) * -2.0;
    fy += ((w2 * (H8 - L8)) + L8) * -1.0;

    fz =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fz += ((w1 * (H0 - L0)) + L0) * 0.0;
    fz += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fz += ((w0 * (H3 - L3)) + L3) * -2.0;
    fz += ((w1 * (H3 - L3)) + L3) * 0.0;
    fz += ((w2 * (H3 - L3)) + L3) * 2.0;
    
    fz += ((w0 * (H6 - L6)) + L6) * -1.0;
    fz += ((w1 * (H6 - L6)) + L6) * 0.0;
    fz += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fz += ((w0 * (H1 - L1)) + L1) * -2.0;
    fz += ((w1 * (H1 - L1)) + L1) * 0.0;
    fz += ((w2 * (H1 - L1)) + L1) * 2.0;
    
    fz += ((w0 * (H4 - L4)) + L4) * 0.0; //-4.0
    fz += ((w1 * (H4 - L4)) + L4) * 0.0;
    fz += ((w2 * (H4 - L4)) + L4) * 0.0; // 4.0
    
    fz += ((w0 * (H7 - L7)) + L7) * -2.0;
    fz += ((w1 * (H7 - L7)) + L7) * 0.0;
    fz += ((w2 * (H7 - L7)) + L7) * 2.0;
    
    fz += ((w0 * (H2 - L2)) + L2) * -1.0;
    fz += ((w1 * (H2 - L2)) + L2) * 0.0;
    fz += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fz += ((w0 * (H5 - L5)) + L5) * -2.0;
    fz += ((w1 * (H5 - L5)) + L5) * 0.0;
    fz += ((w2 * (H5 - L5)) + L5) * 2.0;
    
    fz += ((w0 * (H8 - L8)) + L8) * -1.0;
    fz += ((w1 * (H8 - L8)) + L8) * 0.0;
    fz += ((w2 * (H8 - L8)) + L8) * 1.0;
    */    

    /*   
    fx =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fx += ((w1 * (H0 - L0)) + L0) * 1.0;
    fx += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fx += ((w0 * (H3 - L3)) + L3) * 1.0;
    fx += ((w1 * (H3 - L3)) + L3) * 1.0;
    fx += ((w2 * (H3 - L3)) + L3) * 1.0;
    
    fx += ((w0 * (H6 - L6)) + L6) * 1.0;
    fx += ((w1 * (H6 - L6)) + L6) * 1.0;
    fx += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fx += ((w0 * (H1 - L1)) + L1) * 1.0;
    fx += ((w1 * (H1 - L1)) + L1) * 1.0;
    fx += ((w2 * (H1 - L1)) + L1) * 1.0;
    
    fx += ((w0 * (H4 - L4)) + L4) * 1.0;
    fx += ((w1 * (H4 - L4)) + L4) * 1.0;
    fx += ((w2 * (H4 - L4)) + L4) * 1.0;
    
    fx += ((w0 * (H7 - L7)) + L7) * 1.0;
    fx += ((w1 * (H7 - L7)) + L7) * 1.0;
    fx += ((w2 * (H7 - L7)) + L7) * 1.0;
    
    fx += ((w0 * (H2 - L2)) + L2) * 1.0;
    fx += ((w1 * (H2 - L2)) + L2) * 1.0;
    fx += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fx += ((w0 * (H5 - L5)) + L5) * 1.0;
    fx += ((w1 * (H5 - L5)) + L5) * 1.0;
    fx += ((w2 * (H5 - L5)) + L5) * 1.0;
    
    fx += ((w0 * (H8 - L8)) + L8) * 1.0;
    fx += ((w1 * (H8 - L8)) + L8) * 1.0;
    fx += ((w2 * (H8 - L8)) + L8) * 1.0;

    
    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fy += ((w1 * (H0 - L0)) + L0) * 1.0;
    fy += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fy += ((w0 * (H3 - L3)) + L3) * 1.0;
    fy += ((w1 * (H3 - L3)) + L3) * 1.0;
    fy += ((w2 * (H3 - L3)) + L3) * 1.0;
    
    fy += ((w0 * (H6 - L6)) + L6) * 1.0;
    fy += ((w1 * (H6 - L6)) + L6) * 1.0;
    fy += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fy += ((w0 * (H1 - L1)) + L1) * 1.0;
    fy += ((w1 * (H1 - L1)) + L1) * 1.0;
    fy += ((w2 * (H1 - L1)) + L1) * 1.0;
    
    fy += ((w0 * (H4 - L4)) + L4) * 1.0;
    fy += ((w1 * (H4 - L4)) + L4) * 1.0;
    fy += ((w2 * (H4 - L4)) + L4) * 1.0;
    
    fy += ((w0 * (H7 - L7)) + L7) * 1.0;
    fy += ((w1 * (H7 - L7)) + L7) * 1.0;
    fy += ((w2 * (H7 - L7)) + L7) * 1.0;
    
    fy += ((w0 * (H2 - L2)) + L2) * 1.0;
    fy += ((w1 * (H2 - L2)) + L2) * 1.0;
    fy += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fy += ((w0 * (H5 - L5)) + L5) * 1.0;
    fy += ((w1 * (H5 - L5)) + L5) * 1.0;
    fy += ((w2 * (H5 - L5)) + L5) * 1.0;
    
    fy += ((w0 * (H8 - L8)) + L8) * 1.0;
    fy += ((w1 * (H8 - L8)) + L8) * 1.0;
    fy += ((w2 * (H8 - L8)) + L8) * 1.0;

    fz =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fz += ((w1 * (H0 - L0)) + L0) * 1.0;
    fz += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fz += ((w0 * (H3 - L3)) + L3) * 1.0;
    fz += ((w1 * (H3 - L3)) + L3) * 1.0;
    fz += ((w2 * (H3 - L3)) + L3) * 1.0;
    
    fz += ((w0 * (H6 - L6)) + L6) * 1.0;
    fz += ((w1 * (H6 - L6)) + L6) * 1.0;
    fz += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fz += ((w0 * (H1 - L1)) + L1) * 1.0;
    fz += ((w1 * (H1 - L1)) + L1) * 1.0;
    fz += ((w2 * (H1 - L1)) + L1) * 1.0;
    
    fz += ((w0 * (H4 - L4)) + L4) * 1.0;
    fz += ((w1 * (H4 - L4)) + L4) * 1.0;
    fz += ((w2 * (H4 - L4)) + L4) * 1.0;
    
    fz += ((w0 * (H7 - L7)) + L7) * 1.0;
    fz += ((w1 * (H7 - L7)) + L7) * 1.0;
    fz += ((w2 * (H7 - L7)) + L7) * 1.0;
    
    fz += ((w0 * (H2 - L2)) + L2) * 1.0;
    fz += ((w1 * (H2 - L2)) + L2) * 1.0;
    fz += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fz += ((w0 * (H5 - L5)) + L5) * 1.0;
    fz += ((w1 * (H5 - L5)) + L5) * 1.0;
    fz += ((w2 * (H5 - L5)) + L5) * 1.0;
    
    fz += ((w0 * (H8 - L8)) + L8) * 1.0;
    fz += ((w1 * (H8 - L8)) + L8) * 1.0;
    fz += ((w2 * (H8 - L8)) + L8) * 1.0;
    */
    vec3 n = vec3( fx/27.0 , fy/27.0 , fz/27.0 );
    return n;
}

// returns intensity of reflected ambient lighting
//const vec3 lightColor = vec3(1.0, 0.88, 0.74);
vec3 u_intensity = vec3(0.1, 0.1, 0.1);
vec3 ambientLighting(in vec3 lightColor)
{
    vec3 u_matAmbientReflectance = lightColor;
    vec3 u_lightAmbientIntensity = u_intensity;

    return u_matAmbientReflectance * u_lightAmbientIntensity;
}
// returns intensity of diffuse reflection
vec3 diffuseLighting(in vec3 N, in vec3 L, in vec3 lightColor)
{
    vec3 u_matDiffuseReflectance = lightColor;
    vec3 u_lightDiffuseIntensity = vec3(0.6, 0.6, 0.6);

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
vec3 specularLighting(in vec3 N, in vec3 L, in vec3 V, in vec3 lightColor)
{
  float specularTerm = 0.0;
    // const vec3 u_lightSpecularIntensity = vec3(0, 1, 0);
    vec3 u_lightSpecularIntensity = u_intensity;
    vec3 u_matSpecularReflectance = lightColor;
    float u_matShininess = 5.0;
   // calculate specular reflection only if
   // the surface is oriented to the light source
   if(dot(N, L) > 0.0)
   {
      vec3 e = normalize(-V);
      vec3 r = normalize(-reflect(L, N));
      specularTerm = pow(max(dot(r, e), 0.0), u_matShininess);
   }
   return u_matSpecularReflectance * u_lightSpecularIntensity * specularTerm;
}



void main(void) {
    int uStepsI = int(uSteps);
    float uStepsF = uSteps;
    
    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; 

    vec4 backColor = texture2D(uBackCoord,texC); 

    vec3 dir = backColor.rgb - frontColor.rgb; 

    vec4 vpos = frontColor; 

    //vec3 Step = dir/uStepsF; 
    vec3 Step = dir/ 256.0; 

    vec4 accum = vec4(0.0, 0.0, 0.0, 0.0); 
    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); 
    vec4 colorValue = vec4(0.0, 0.0, 0.0, 0.0);


    /*
    vec3 lightPos[3] = vec3[3](
        vec3(1.0, 1.0, 1.0),
        vec3(-1.0, -1.0, -1.0),
        vec3(1.0, 1.0, -1.0)
    );
    */
    //vec3 lightPos[3];
    //lightPos[0] = vec3(1.0, 1.0, 1.0);
    //lightPos[1] = vec3(-1.0, -1.0, -1.0);
    //lightPos[2] = vec3(1.0, 1.0, -1.0);

    vec3 ef_position = vec3(0.0);
    vec3 ef_step = vec3(0.0);
    vec3 ef_value = vec3(0.0);
    float opacityFactor = uOpacityVal; 

    // Rasteriser for empty skipping
 
 
    for(int i = 0; i < 8192; i++) {
        if (i > uStepsI)
            break;
        vec3 gray_val = getVolumeValue_Soebel(vpos.xyz); 


        if(gray_val.x <= uMinGrayVal ||
           gray_val.x >= uMaxGrayVal)
            colorValue = vec4(0.0);
        else {
            /*
            ef_position = vpos.xyz;
            ef_step = Step / 2.0;
            ef_position = ef_position - ef_step;
            for(int j = 0; j < 4; j++) {
                ef_value = getVolume_Soebel(ef_position);
                ef_step = ef_step / 2.0;
                if(ef_value.x >= uMinGrayVal ||
                   ef_value.x <= uMaxGrayVal) {
                    // HIT
                    ef_position = ef_position - ef_step;
                } else {
                    // NO HIT
                    ef_position = ef_position + ef_step;
                }
            }
            //float eps =pow(2.0,-16.0);
            ef_position = ef_position + (1.0/900.0);
            vec3 L = normalize(ef_position.xyz - uLightPos);
            vec3 V = normalize( cameraPosition - ef_position.xyz );
            vec3 N = normalize(getNormal(ef_position.xyz));
            */

            /*
            // Interpolate 4 normals nearby
            vec3 p0 = vpos.xyz;
            p0.x -= 1.0;
            p0.y += 1.0;

            vec3 p1 = vpos.xyz;
            p1.x -= 1.0;
            p1.y -= 1.0;

            vec3 p2 = vpos.xyz;
            p1.x += 1.0;
            p1.y += 1.0;
            
            vec3 p3 = vpos.xyz;
            p1.x += 1.0;
            p1.y -= 1.0;
            
            vec3 tmp0 = normalize(getNormal(p0.xyz));
            vec3 tmp1 = normalize(getNormal(p1.xyz));
            vec3 tmp2 = mix(tmp0, tmp1, 0.5);
            
            vec3 tmp3 = normalize(getNormal(p2.xyz));
            vec3 tmp4 = normalize(getNormal(p3.xyz));
            vec3 tmp5 = mix(tmp3, tmp4, 0.5);
            
            vec3 tmp6 = mix(tmp2, tmp5, 0.5);
            vec3 N = tmp6;
            */

            /*
            vec3 V = normalize(cameraPosition - vpos.xyz);
            vec3 N = normalize(getNormal(vpos.xyz));
            for(int light_i = 0; light_i < 1; light_i++) {
              vec3 L = normalize( vpos.xyz - lightPos[light_i] );
              vec3 Iamb = ambientLighting();
              vec3 Idif = diffuseLighting(N, L);
              vec3 Ispe = specularLighting(N, L, V);
              sample.rgb += (Iamb + Idif + Ispe);
            }
            sample.a = 1.0;
            */ 
            
            // normalize vectors after interpolation
            //vec3 L = normalize(vpos.xyz - uLightPos);
            //vec3 L = normalize(vpos.xyz - vec3(1.0));
            //vec3 L;
            //for(int light_i = 0; light_i < 1; light_i++) {
            //    vec3 L = normalize(vpos.xyz - vec3(0.0));
            //}
            //vec3 L = normalize(vpos.xyz - vec3(0.0));

            colorValue = texture2D(uColormap, vec2(gray_val.x, 0.5));
            
            vec3 V = normalize( cameraPosition - vpos.xyz );
            //vec3 N1 = normalize(getNormal(vpos.xyz));
            vec3 N = normalize(getNormalSmooth(vpos.xyz));
            //vec3 N = (N1*0.3) + (N2*0.7);
           
            vec3 L = normalize( vpos.xyz - vec3(1.0));
            vec3 Iamb = ambientLighting(colorValue.xyz);
            vec3 Idif = diffuseLighting(N, L, colorValue.xyz);
            vec3 Ispe = specularLighting(N, L, V, colorValue.xyz);
            sample.rgb += (Iamb + Idif + Ispe);

            L = normalize( vpos.xyz - vec3(-1.0));
            Iamb = ambientLighting(colorValue.xyz);
            Idif = diffuseLighting(N, L, colorValue.xyz);
            Ispe = specularLighting(N, L, V, colorValue.xyz);
            sample.rgb += (Iamb + Idif + Ispe);
           
            /* 
            L = normalize( vpos.xyz - vec3(1.0, 1.0, -1.0));
            Iamb = ambientLighting();
            Idif = diffuseLighting(N, L);
            Ispe = specularLighting(N, L, V);
            sample.rgb += (Iamb + Idif + Ispe);
            */

            /*
            // get Blinn-Phong reflectance components
            vec3 Iamb = ambientLighting();
            vec3 Idif = diffuseLighting(N, L);
            vec3 Ispe = specularLighting(N, L, V);

            // diffuse color of the object from texture
            //vec3 diffuseColor = texture(u_diffuseTexture, o_texcoords).rgb;
        
            vec3 mycolor = (Iamb + Idif + Ispe);
            sample.rgb = mycolor;
            */
            sample.a = 1.0;
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
