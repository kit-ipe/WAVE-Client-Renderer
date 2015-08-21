/**
 * @classdesc
 * Core
 * 
 * @class Core
 * @this {Core}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 * @version 0.1
 *
 */

(function(namespace) {
    var GeometryHelper = function() {

        var me = {};

        me.createBoxGeometry = function(dimension) {
            var vertexPositions = [
                //front face first
                [dimension.xmin, dimension.ymin, dimension.zmax],
                [dimension.xmax, dimension.ymin, dimension.zmax],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                //front face second
                [dimension.xmin, dimension.ymin, dimension.zmax],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                [dimension.xmin, dimension.ymax, dimension.zmax],

                // back face first
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmin, dimension.ymax, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmin],
                // back face second
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmin],
                [dimension.xmax, dimension.ymin, dimension.zmin],

                // top face first
                [dimension.xmin, dimension.ymax, dimension.zmin],
                [dimension.xmin, dimension.ymax, dimension.zmax],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                // top face second
                [dimension.xmin, dimension.ymax, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                [dimension.xmax, dimension.ymax, dimension.zmin],

                // bottom face first
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymin, dimension.zmax],
                // bottom face second
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymin, dimension.zmax],
                [dimension.xmin, dimension.ymin, dimension.zmax],

                // right face first
                [dimension.xmax, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                // right face second
                [dimension.xmax, dimension.ymin, dimension.zmin],
                [dimension.xmax, dimension.ymax, dimension.zmax],
                [dimension.xmax, dimension.ymin, dimension.zmax],

                // left face first
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmin, dimension.ymin, dimension.zmax],
                [dimension.xmin, dimension.ymax, dimension.zmax],
                // left face second
                [dimension.xmin, dimension.ymin, dimension.zmin],
                [dimension.xmin, dimension.ymax, dimension.zmax],
                [dimension.xmin, dimension.ymax, dimension.zmin]
            ];

            var vertexColors = [
                //front face first
                [0.0, 0.0, 1.0],
                [1.0, 0.0, 1.0],
                [1.0, 1.0, 1.0],
                //front face second
                [0.0, 0.0, 1.0],
                [1.0, 1.0, 1.0],
                [0.0, 1.0, 1.0],

                // back face first
                [0.0, 0.0, 0.0],
                [0.0, 1.0, 0.0],
                [1.0, 1.0, 0.0],
                // back face second
                [0.0, 0.0, 0.0],
                [1.0, 1.0, 0.0],
                [1.0, 0.0, 0.0],

                // top face first
                [0.0, 1.0, 0.0],
                [0.0, 1.0, 1.0],
                [1.0, 1.0, 1.0],
                // top face second
                [0.0, 1.0, 0.0],
                [1.0, 1.0, 1.0],
                [1.0, 1.0, 0.0],

                // bottom face first
                [0.0, 0.0, 0.0],
                [1.0, 0.0, 0.0],
                [1.0, 0.0, 1.0],
                // bottom face second
                [0.0, 0.0, 0.0],
                [1.0, 0.0, 1.0],
                [0.0, 0.0, 1.0],

                // right face first
                [1.0, 0.0, 0.0],
                [1.0, 1.0, 0.0],
                [1.0, 1.0, 1.0],
                // right face second
                [1.0, 0.0, 0.0],
                [1.0, 1.0, 1.0],
                [1.0, 0.0, 1.0],

                // left face first
                [0.0, 0.0, 0.0],
                [0.0, 0.0, 1.0],
                [0.0, 1.0, 1.0],
                // left face second
                [0.0, 0.0, 0.0],
                [0.0, 1.0, 1.0],
                [0.0, 1.0, 0.0]
            ];

            var positions = [];
            var colors = [];

            for(var i = 0; i < vertexPositions.length; i++) {
                var backCounter = vertexPositions.length - 1 - i;
                var x = vertexPositions[backCounter][0];
                var y = vertexPositions[backCounter][1];
                var z = vertexPositions[backCounter][2];

                var r = vertexColors[backCounter][0];
                var g = vertexColors[backCounter][1];
                var b = vertexColors[backCounter][2];

                positions.push(x);
                positions.push(y);
                positions.push(z);

                colors.push(r);
                colors.push(g);
                colors.push(b);
                colors.push(1.0);
            }

            var geometry = new THREE.BufferGeometry();
            var bufferPositions = new Float32Array(positions);
            geometry.addAttribute( 'position', new THREE.BufferAttribute( bufferPositions, 3 ) );
            geometry.addAttribute( 'vertColor', new THREE.BufferAttribute(new Float32Array(colors), 4));
            geometry.computeBoundingSphere();

            return geometry;
        }

        return me;
        
    };



    namespace.GeometryHelper = GeometryHelper;

})(window.VRC);