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

uniform float uNumberOfSlices; 
uniform float uMinGrayVal; 
uniform float uMaxGrayVal; 
uniform float uOpacityVal; 
uniform float uColorVal; 
uniform float uAbsorptionModeIndex;
uniform float uSlicesOverX; 
uniform float uSlicesOverY; 
uniform float uSteps; 
// uniform int uAvailable_textures_number;

//Acts like a texture3D using Z slices and trilinear filtering. 
vec4 getVolumeValue(vec3 volpos)
{
    float s1Original, s2Original, s1, s2; 
    float dx1, dy1; 
    // float dx2, dy2; 
    // float value; 

    vec2 texpos1,texpos2; 

    float slicesPerSprite = uSlicesOverX * uSlicesOverY; 

    s1Original = floor(volpos.z*uNumberOfSlices); 
    // s2Original = min(s1Original + 1.0, uNumberOfSlices);

    int tex1Index = int(floor(s1Original / slicesPerSprite));
    // int tex2Index = int(floor(s2Original / slicesPerSprite));

    s1 = mod(s1Original, slicesPerSprite);
    // s2 = mod(s2Original, slicesPerSprite);

    dx1 = fract(s1/uSlicesOverX);
    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;

    // dx2 = fract(s2/uSlicesOverX);
    // dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;

    texpos1.x = dx1+(volpos.x/uSlicesOverX);
    texpos1.y = dy1+(volpos.y/uSlicesOverY);

    // texpos2.x = dx2+(volpos.x/uSlicesOverX);
    // texpos2.y = dy2+(volpos.y/uSlicesOverY);

    vec4 value;
    float value1 = 0.0, value2 = 0.0; 
    // bool value1Set = false, value2Set = false;

    // int numberOfSlicemaps = int( ceil(uNumberOfSlices / (uSlicesOverX * uSlicesOverY)) );

    <% for(var i=0; i < maxTexturesNumber; i++) { %>
        if( tex1Index == <%=i%> )
        {
            //value1 = texture2D(uSliceMaps[<%=i%>],texpos1).x;
            value = texture2D(uSliceMaps[<%=i%>],texpos1).rgba;
        }

        <% if( i < maxTexturesNumber-1 ) { %>
            else
        <% } %>
    <% } %>

    return value;
} 


void main(void) {

    vec2 texC = ((pos.xy / pos.w) + 1.0) / 2.0; 
    vec4 backColor = texture2D(uBackCoord, texC); 
    
    vec3 dir = backColor.rgb - frontColor.rgb; 
    vec3 Step = dir / uSteps; 

    vec4 vpos = frontColor;
    vec4 accum = vec4(0, 0, 0, 0); 
    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0); 
    vec4 colorValue = vec4(0, 0, 0, 0); 
    vec4 gray_val = vec4(0.0, 0.0, 0.0, 0.0); 
 
    float biggest_gray_value = 0.0;
    float opacityFactor = uOpacityVal; 
    float lightFactor = uColorVal; 

    for(float i=0.0; i<4095.0; i+=1.0) { 
        if(i == uSteps) { 
            break; 
        }    

        gray_val = getVolumeValue(vpos.xyz); 

        if(gray_val.x < uMinGrayVal || gray_val.x > uMaxGrayVal) { 
            colorValue = vec4(0.0); 
        } else { 
            if(biggest_gray_value < gray_val.x) { 
                biggest_gray_value = gray_val.x;
            } 

            if(uAbsorptionModeIndex == 0.0) { 
                vec2 tf_pos; 
                colorValue = gray_val;

                sample.a = colorValue.a * opacityFactor; 
                sample.rgb = colorValue.rgb * uColorVal; 
                accum += sample; 

                if(accum.a >= 1.0) 
                    break; 
            }

            if(uAbsorptionModeIndex == 1.0) { 
                colorValue = gray_val;
                sample.a = colorValue.a * opacityFactor * (1.0 / uSteps); 
                sample.rgb = (1.0 - accum.a) * colorValue.rgb * sample.a * lightFactor; 
                accum += sample; 

                if(accum.a >= 1.0) 
                    break;
            }
        } 

        //advance the current position 
        vpos.xyz += Step; 

        //break if the position is greater than <1, 1, 1> 
        if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0 ||
           vpos.x < 0.0 || vpos.y < 0.0 || vpos.z < 0.0)  { 
            break; 
        }
    }
    gl_FragColor = accum;
}
