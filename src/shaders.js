/**
 * @classdesc
 * Shaders
 * 
 * @class Shaders
 * @this {RC.Delegate}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 * @version 0.1
 *
 * @requires NamespaceRC.js
 */

(function(namespace) {
    var Shaders = function(O) {

        var me = {};
        me.class = this;

        me.firtsPass_vs = [
            "#ifdef GL_FRAGMENT_PRECISION_HIGH",
                "precision highp int;",
                "precision highp float;",
            "#else",
                "precision mediump int;",
                "precision mediump float;",
            "#endif",

            "attribute vec4 vertColor;",

            "varying vec4 backColor;",
            "varying vec4 pos;",

            "void main(void)",
            "{",
            "    backColor = vertColor;",

            "    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "    gl_Position = pos;",
            "}"].join('\n');

        me.firtsPass_fs = [
            "#ifdef GL_FRAGMENT_PRECISION_HIGH",
            "    // highp is supported",
            "    precision highp int;",
            "    precision highp float;",
            "#else",
            "    // high is not supported",
            "    precision mediump int;",
            "    precision mediump float;",
            "#endif",

            "varying vec4 backColor;",

            "void main(void)",
            "{",
            "    gl_FragColor = backColor;",
            "}"
        ].join('\n');

        me.secondPass_vs = [
            "#ifdef GL_FRAGMENT_PRECISION_HIGH",
            "    // highp is supported",
            "    precision highp int;",
            "    precision highp float;",
            "#else",
            "    // high is not supported",
            "    precision mediump int;",
            "    precision mediump float;",
            "#endif",
            
            "attribute vec4 vertColor;",

            "varying vec4 frontColor;",
            "varying vec4 pos;",

            "void main(void)",
            "{",
            "    frontColor = vertColor;",

            "    pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "    gl_Position = pos;",
            "}",
        ].join('\n');

        me.secondPass_fs = [
            "#ifdef GL_FRAGMENT_PRECISION_HIGH",
            "    // highp is supported",
            "    precision highp int;",
            "    precision highp float;",
            "#else",
            "    // high is not supported",
            "    precision mediump int;",
            "    precision mediump float;",
            "#endif",

            "varying vec4 frontColor;",
            "varying vec4 pos;",

            "uniform sampler2D uBackCoord;",
            "uniform sampler2D uSliceMaps[10];",
            "uniform sampler2D uTransferFunction;",

            "uniform float uNumberOfSlices;",
            "uniform float uMinGrayVal;",
            "uniform float uMaxGrayVal;",
            "uniform float uOpacityVal;",
            "uniform float uColorVal;",
            "uniform float uAbsorptionModeIndex;",
            "uniform float uSlicesOverX;",
            "uniform float uSlicesOverY;",
            "uniform float uSteps;",

            "//Acts like a texture3D using Z slices and trilinear filtering.",
            "float getVolumeValue(vec3 volpos)",
            "{",
            "    float s1Original, s2Original, s1, s2;",
            "    float dx1, dy1;",
            "    float dx2, dy2;",
            "    float value;",

            "    vec2 texpos1,texpos2;",

            "    float slicesPerSprite = uSlicesOverX * uSlicesOverY;",

            "    s1Original = floor(volpos.z*uNumberOfSlices);",
            "    s2Original = min(s1Original+1.0, uNumberOfSlices);",

            "    int tex1Index = int(floor(s1Original / slicesPerSprite));",
            "    int tex2Index = int(floor(s2Original / slicesPerSprite));",

            "    s1 = mod(s1Original, slicesPerSprite);",
            "    s2 = mod(s2Original, slicesPerSprite);",

            "    dx1 = fract(s1/uSlicesOverX);",
            "    dy1 = floor(s1/uSlicesOverY)/uSlicesOverY;",

            "    dx2 = fract(s2/uSlicesOverX);",
            "    dy2 = floor(s2/uSlicesOverY)/uSlicesOverY;",

            "    texpos1.x = dx1+(volpos.x/uSlicesOverX);",
            "    texpos1.y = dy1+(volpos.y/uSlicesOverY);",

            "    texpos2.x = dx2+(volpos.x/uSlicesOverX);",
            "    texpos2.y = dy2+(volpos.y/uSlicesOverY);",

            "    float value1, value2;",
            "    bool value1Set = false, value2Set = false;",

            "    for (int x = 0; x < 10; x++) {",
            "        if(x == tex1Index) {",
            "            value1 = texture2D(uSliceMaps[x],texpos1).x;",
            "            value1Set = true;",
            "        }",

            "        if(x == tex2Index) {",
            "            value2 = texture2D(uSliceMaps[x],texpos2).x;",
            "            value2Set = true;",
            "        }",

            "        if(value1Set && value2Set) {",
            "            break;",
            "        }",

            "    }",

            "    return mix(value1, value2, fract(volpos.z*uNumberOfSlices));",
            "    // return value1;",

            "}",

            "void main(void)",
            "{",
            "    vec2 texC = ((pos.xy/pos.w) + 1.0) / 2.0;",

            "    vec4 backColor = texture2D(uBackCoord,texC);",

            "    vec3 dir = backColor.rgb - frontColor.rgb;",
            "    vec4 vpos = frontColor;",

            "    vec3 Step = dir/uSteps;",

            "    vec4 accum = vec4(0, 0, 0, 0);",
            "    vec4 sample = vec4(0.0, 0.0, 0.0, 0.0);",
            "    vec4 value = vec4(0, 0, 0, 0);",

            "    float opacityFactor = 8.0;//uOpacityVal;",
            "    float lightFactor = 1.3;//uColorVal;",
        
            "    // const 4095 - only example of big number",
            "    // It because expression i > uSteps impossible",
            "    for(float i = 0.0; i < 4095.0; i+=1.0)",
            "    {",
            "    // It because expression i > uSteps impossible",
            "        if(i == uSteps) {",
            "            break;",
            "        }",

            "        float pos = getVolumeValue(vpos.xyz);",

            "       // value = vec4(tf_pos.x, tf_pos.x, tf_pos.x, 1.0);",

            "        if(pos < uMinGrayVal || pos > uMaxGrayVal) {",
            "            value = vec4(0.0);",
            "        } else {",
            "            vec2 tf_pos;",
            "            tf_pos.x = (pos - uMinGrayVal) / (uMaxGrayVal - uMinGrayVal);",
            "            tf_pos.y = 0.5;",

            "            value = texture2D(uTransferFunction,tf_pos); " ,  
            "            // value = vec4(pos, pos, pos, 1.0);",
            "        }",

            "        if(uAbsorptionModeIndex == 1.0)",
            "        {",
            "            sample.a = value.a * opacityFactor * (1.0 / uSteps);",
            "            sample.rgb = (1.0 - accum.a) * value.rgb * sample.a * lightFactor;",

            "        }",
            "        else",
            "        {",
            "            sample.a = value.a * opacityFactor;",
            "            sample.rgb = value.rgb * uColorVal;",

            "        }",

            "        // accum.rgb += sample.rgb;",
            "        // accum.a += sample.a;",
            "        accum += sample;",

            "        //advance the current position",
            "        vpos.xyz += Step;",

            "        //break if the position is greater than <1, 1, 1>",
            "        if(vpos.x > 1.0 || vpos.y > 1.0 || vpos.z > 1.0)",
            "        {",
            "            break;",
            "        }",

            "        if(accum.a>=0.95)",
            "           break;",
            "    }",

            "    gl_FragColor = accum;",

            "}"
        ].join('\n');

        /**
        * Constructor
        *
        * @method Delegate.Constructor
        * @this {RC.Delegate}
        * @Delegate {Object} O
        * @Delegate {Object} O.self         Context for calling
        */
        me.Constructor = function(O) {
            
        };

        me.Constructor(O);

        return me;

    };
    
    namespace.Shaders = Shaders;

})(window.RC);