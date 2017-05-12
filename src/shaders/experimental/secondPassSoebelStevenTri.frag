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
uniform float uSlicemapWidth;

uniform vec3 uLightPos;
uniform int uSetViewMode;

uniform float uSteps;

uniform float minSos;
uniform float maxSos;

uniform float l; 
uniform float s; 
uniform float hMin; 
uniform float hMax; 



vec3 getTextureValue(int slicemapNo, vec2 texpos)
{
    float value = 0.0;
    vec3 value_vec;
    
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( slicemapNo == <%=i%> )
        {
          value_vec = texture2D(uSliceMaps[<%=i%>],texpos).xyz;
          //value = ((value_vec.r + value_vec.g + value_vec.b)/3.0);
          //value = ((value_vec.r * 0.299)+(value_vec.g * 0.587)+(value_vec.b * 0.114));
        }

        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>
    
    return value_vec;
}



vec3 getValueTri(vec3 volpos)
{
    vec2 texpos1a, texpos1b, texpos1c, texpos1d, texpos2a, texpos2b, texpos2c, texpos2d;
    vec3 value1a, value1b, value1c, value1d, value2a, value2b, value2c, value2d, valueS;
    vec3 value1ab, value1cd, value1ac, value1bd, value2ab, value2cd, value2ac, value2bd, value1, value2;
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
    float value1aAll = value1a.x+value1a.y+value1a.z;
    float value1bAll = value1b.x+value1b.y+value1b.z;
    float value1cAll = value1c.x+value1c.y+value1c.z;
    float value1dAll = value1d.x+value1d.y+value1d.z;
    float value2aAll = value2a.x+value2a.y+value2a.z;
    float value2bAll = value2b.x+value2b.y+value2b.z;
    float value2cAll = value2c.x+value2c.y+value2c.z;
    float value2dAll = value2d.x+value2d.y+value2d.z;
    
    if (value1aAll<=0.0 || value1bAll<=0.0 || value1cAll<=0.0 || value1dAll<=0.0 || value2aAll<=0.0 || value2bAll<=0.0 || value2cAll<=0.0 || value2dAll<=0.0)
    {
        if (value1aAll<=0.0 || value1cAll<=0.0 || value2aAll<=0.0 || value2cAll<=0.0)
        {    
            value1ab = value1b;
            value1cd = value1d;
            value2ab = value2b;
            value2cd = value2d;
            
            if (value1bAll<=0.0 || value2bAll<=0.0)
            {
                value1 = value1d;
                value2 = value2d;
                
                if (value1dAll <= 0.0)
                    valueS = value2;
                else if (value2dAll <= 0.0)
                    valueS = value1;
                else
                    valueS = value1+ratioZ*(value2-value1);
            }
            
            else if (value1dAll<=0.0 || value2dAll<=0.0)
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


// Compute the Normal around the current voxel
vec3 getNormal(vec3 at)
{
    vec2 texpos1,texpos2;

    float NOS = uNumberOfSlices;  //  abbreviation 
    float NOS_factor=100.0;
    float shift = (1.0/uNumberOfSlices) * NOS_factor;

    float slicesPerSlicemap = uSlicesOverX * uSlicesOverY; 
    float sliceSizeX = uSlicemapWidth/uSlicesOverX;  // Number of pixels of ONE slice along x axis
    float sliceSizeY = uSlicemapWidth/uSlicesOverY;  // Number of pixels of ONE slice along y axis
    
    //  Slice selection
    float sliceNo1 = floor(abs(at.z*NOS-0.5));  //  sliceNo1 stands for lower slice
    float sliceNo2 = NOS-1.0-floor(abs(NOS-0.5-at.z*NOS));  //  sliceNo2 stands for upper slice

    int slicemapNo1 = int(floor(sliceNo1 / slicesPerSlicemap));
    int slicemapNo2 = int(floor(sliceNo2 / slicesPerSlicemap));

    float s1 = mod(sliceNo1, slicesPerSlicemap);  // s1 stands for the sliceNo of lower slice in this map
    float dx1 = fract(s1/uSlicesOverX);
    float dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;
    float s2 = mod(sliceNo2, slicesPerSlicemap);  // s2 stands for the sliceNo of upper slice in this map
    float dx2 = fract(s2/uSlicesOverX);
    float dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;

    float w1 = at.z - floor(at.z);
    float w0 = (at.z - shift) - floor(at.z);
    float w2 = (at.z + shift) - floor(at.z);
    
    
    float fx, fy, fz;
    
    float L0, L1, L2, L3, L4, L5, L6, L7, L8;
    float H0, H1, H2, H3, H4, H5, H6, H7, H8;

    /*
    // version 1, directly from texel
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( slicemapNo1 == <%=i%> )
        {
            texpos1.x = dx1+((at.x - shift)/uSlicesOverX);
            texpos1.y = dy1+((at.y + shift)/uSlicesOverY);
            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x)/uSlicesOverX);
            texpos1.y = dy1+((at.y + shift)/uSlicesOverY);
            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + shift)/uSlicesOverX);
            texpos1.y = dy1+((at.y + shift)/uSlicesOverY);
            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x - shift)/uSlicesOverX);
            texpos1.y = dy1+((at.y)/uSlicesOverY);
            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x)/uSlicesOverX);
            texpos1.y = dy1+((at.y)/uSlicesOverY);
            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + shift)/uSlicesOverX);
            texpos1.y = dy1+((at.y)/uSlicesOverY);
            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x - shift)/uSlicesOverX);
            texpos1.y = dy1+((at.y - shift)/uSlicesOverY);
            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx1+((at.x)/uSlicesOverX);
            texpos1.y = dy1+((at.y - shift)/uSlicesOverY);
            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+((at.x + shift)/uSlicesOverX);
            texpos1.y = dy1+((at.y - shift)/uSlicesOverY);
            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }
        if( slicemapNo2 == <%=i%> ) {
            texpos1.x = dx2+((at.x - shift)/uSlicesOverX);
            texpos1.y = dy2+((at.y + shift)/uSlicesOverY);
            H0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x)/uSlicesOverX);
            texpos1.y = dy2+((at.y + shift)/uSlicesOverY);
            H1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + shift)/uSlicesOverX);
            texpos1.y = dy2+((at.y + shift)/uSlicesOverY);
            H2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x - shift)/uSlicesOverX);
            texpos1.y = dy2+((at.y)/uSlicesOverY);
            H3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x)/uSlicesOverX);
            texpos1.y = dy2+((at.y)/uSlicesOverY);
            H4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + shift)/uSlicesOverX);
            texpos1.y = dy2+((at.y)/uSlicesOverY);
            H5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x - shift)/uSlicesOverX);
            texpos1.y = dy2+((at.y - shift)/uSlicesOverY);
            H6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        
            texpos1.x = dx2+((at.x)/uSlicesOverX);
            texpos1.y = dy2+((at.y - shift)/uSlicesOverY);
            H7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+((at.x + shift)/uSlicesOverX);
            texpos1.y = dy2+((at.y - shift)/uSlicesOverY);
            H8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }

    <% } %>
    */
    
    // version 2, move the point to pixel central    
    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( slicemapNo1 == <%=i%> )
        {
            texpos1.x = dx1+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy1+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy1+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy1+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy1+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;
            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy1+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;
            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy1+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;
            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy1+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy1+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx1+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy1+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
        }
        if( slicemapNo2 == <%=i%> ) {
            texpos1.x = dx2+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy2+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L0 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy2+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy2+(floor((at.y + shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L2 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy2+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;
            L3 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy2+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;
            L4 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy2+(floor((at.y)*sliceSizeY)+0.5)/uSlicemapWidth;
            L5 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(floor((at.x - shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy2+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L6 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(floor((at.x)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy2+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L7 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            
            texpos1.x = dx2+(floor((at.x + shift)*sliceSizeX)+0.5)/uSlicemapWidth;
            texpos1.y = dy2+(floor((at.y - shift)*sliceSizeY)+0.5)/uSlicemapWidth;
            L8 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
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
    fx += ((w1 * (H0 - L0)) + L0) * -3.0;
    fx += ((w2 * (H0 - L0)) + L0) * -1.0;
    
    fx += ((w0 * (H3 - L3)) + L3) * -3.0;
    fx += ((w1 * (H3 - L3)) + L3) * -6.0;
    fx += ((w2 * (H3 - L3)) + L3) * -3.0;
    
    fx += ((w0 * (H6 - L6)) + L6) * -1.0;
    fx += ((w1 * (H6 - L6)) + L6) * -3.0;
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
    fx += ((w1 * (H2 - L2)) + L2) * 3.0;
    fx += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fx += ((w0 * (H5 - L5)) + L5) * 3.0;
    fx += ((w1 * (H5 - L5)) + L5) * 6.0;
    fx += ((w2 * (H5 - L5)) + L5) * 3.0;
    
    fx += ((w0 * (H8 - L8)) + L8) * 1.0;
    fx += ((w1 * (H8 - L8)) + L8) * 3.0;
    fx += ((w2 * (H8 - L8)) + L8) * 1.0;

    
    
    fy =  ((w0 * (H0 - L0)) + L0) * 1.0;
    fy += ((w1 * (H0 - L0)) + L0) * 3.0;
    fy += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fy += ((w0 * (H3 - L3)) + L3) * 0.0;
    fy += ((w1 * (H3 - L3)) + L3) * 0.0;
    fy += ((w2 * (H3 - L3)) + L3) * 0.0;
    
    fy += ((w0 * (H6 - L6)) + L6) * -1.0;
    fy += ((w1 * (H6 - L6)) + L6) * -3.0;
    fy += ((w2 * (H6 - L6)) + L6) * -1.0;
    
    fy += ((w0 * (H1 - L1)) + L1) * 3.0;
    fy += ((w1 * (H1 - L1)) + L1) * 6.0;
    fy += ((w2 * (H1 - L1)) + L1) * 3.0;
    
    fy += ((w0 * (H4 - L4)) + L4) * 0.0;
    fy += ((w1 * (H4 - L4)) + L4) * 0.0;
    fy += ((w2 * (H4 - L4)) + L4) * 0.0;
    
    fy += ((w0 * (H7 - L7)) + L7) * -3.0;
    fy += ((w1 * (H7 - L7)) + L7) * -6.0;
    fy += ((w2 * (H7 - L7)) + L7) * -3.0;
    
    fy += ((w0 * (H2 - L2)) + L2) * 1.0;
    fy += ((w1 * (H2 - L2)) + L2) * 3.0;
    fy += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fy += ((w0 * (H5 - L5)) + L5) * 0.0;
    fy += ((w1 * (H5 - L5)) + L5) * 0.0;
    fy += ((w2 * (H5 - L5)) + L5) * 0.0;
    
    fy += ((w0 * (H8 - L8)) + L8) * -1.0;
    fy += ((w1 * (H8 - L8)) + L8) * -3.0;
    fy += ((w2 * (H8 - L8)) + L8) * -1.0;

    

    fz =  ((w0 * (H0 - L0)) + L0) * -1.0;
    fz += ((w1 * (H0 - L0)) + L0) * 0.0;
    fz += ((w2 * (H0 - L0)) + L0) * 1.0;
    
    fz += ((w0 * (H3 - L3)) + L3) * -3.0;
    fz += ((w1 * (H3 - L3)) + L3) * 0.0;
    fz += ((w2 * (H3 - L3)) + L3) * 3.0;
    
    fz += ((w0 * (H6 - L6)) + L6) * -1.0;
    fz += ((w1 * (H6 - L6)) + L6) * 0.0;
    fz += ((w2 * (H6 - L6)) + L6) * 1.0;
    
    fz += ((w0 * (H1 - L1)) + L1) * -3.0;
    fz += ((w1 * (H1 - L1)) + L1) * 0.0;
    fz += ((w2 * (H1 - L1)) + L1) * 3.0;
    
    fz += ((w0 * (H4 - L4)) + L4) * -6.0;
    fz += ((w1 * (H4 - L4)) + L4) * 0.0;
    fz += ((w2 * (H4 - L4)) + L4) * 6.0;
    
    fz += ((w0 * (H7 - L7)) + L7) * -3.0;
    fz += ((w1 * (H7 - L7)) + L7) * 0.0;
    fz += ((w2 * (H7 - L7)) + L7) * 3.0;
    
    fz += ((w0 * (H2 - L2)) + L2) * -1.0;
    fz += ((w1 * (H2 - L2)) + L2) * 0.0;
    fz += ((w2 * (H2 - L2)) + L2) * 1.0;
    
    fz += ((w0 * (H5 - L5)) + L5) * -3.0;
    fz += ((w1 * (H5 - L5)) + L5) * 0.0;
    fz += ((w2 * (H5 - L5)) + L5) * 3.0;
    
    fz += ((w0 * (H8 - L8)) + L8) * -1.0;
    fz += ((w1 * (H8 - L8)) + L8) * 0.0;
    fz += ((w2 * (H8 - L8)) + L8) * 1.0;


    vec3 n = vec3( fx/27.0 , fy/27.0 , fz/27.0 );
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
    const vec3 u_lightSpecularIntensity = vec3(0, 1, 0); //0,1,0
    const vec3 u_matSpecularReflectance = vec3(1, 1, 1);
    const float u_matShininess = 5.0;

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
    //const int uStepsI = 144;
    //const float uStepsF = float(uStepsI);
    int uStepsI = int(uSteps);
    float uStepsF = uSteps;
    
    
    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0; 

    vec4 backColor = texture2D(uBackCoord,texC); 

    vec3 dir = backColor.rgb - frontColor.rgb; 

    vec4 vpos = frontColor; 

    vec3 Step = dir/uStepsF; 

    vec4 accum = vec4(0, 0, 0, 0); 
    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); 
    vec4 colorValue = vec4(0, 0, 0, 0); 
    
    float opacityFactor = uOpacityVal; 
    
    vec4 test = vec4(0.0, 0.0, 0.0, 0.0); 
  
    for(int i = 0; i < 8192; i++) {
        if (i > uStepsI)
            break;
        vec3 gray_val = getValueTri(vpos.xyz); 

        if(gray_val.z < 0.05 || 
           gray_val.x < minSos ||
           gray_val.x > maxSos)  
            colorValue = vec4(0.0);     
        else {
            //colorValue.x = (darkness * 2.0 - gray_val.x) * l * 0.4;
            colorValue.x = gray_val.x * darkness;
            colorValue.w = 0.1;

            if ( uSetViewMode == 1 ) {
                
                // ISO surface rendering mode
                // normalize vectors after interpolation
                vec3 L = normalize(vpos.xyz - uLightPos);
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
                
                //sample.rgb = mycolor;
                //sample.a = 1.0;
                
                //test.rgb = abs(N.rgb); 
                //test.a = 1.0;
                
                sample.rgb = abs(N.rgb); 
                sample.a = 1.0;
                
                
                /*
                // surface rendering mode
                sample.rgb =gray_val;
                sample.a = 1.0;
                */
                
            } else {
                sample.rgb = (1.0 - accum.a) * colorValue.xxx * sample.a;
                sample.a = colorValue.a * opacityFactor * (1.0 / uStepsF);
            }

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
