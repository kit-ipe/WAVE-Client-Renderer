var GeometryHelper = function() {
    return {
        createBoxGeometry: function(dimension) {
            var vertexPos = [
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

            var positions = [];
            var colors = [];

            for(var i = 0; i < vertexPos.length; i++) {
                var backCounter = vertexPos.length - 1 - i,
                    x = vertexPos[backCounter][0],
                    y = vertexPos[backCounter][1],
                    z = vertexPos[backCounter][2];

                positions.push(x);
                positions.push(y);
                positions.push(z);// * volumeDimension.getZStretchFactor());

                colors.push(x);
                colors.push(y);
                colors.push(z);
                colors.push(1.0);
            }

            var geometry = new THREE.BufferGeometry();
            var bufferPositions = new Float32Array(positions);
            geometry.addAttribute( 'position', new THREE.BufferAttribute( bufferPositions, 3 ) );
            geometry.addAttribute( 'vertColor', new THREE.BufferAttribute(new Float32Array(colors), 4));
            geometry.computeBoundingSphere();

            return geometry;
        }
    }
}

var GeometryDimension = function() {
    this.xmin = 0.005;
    this.xmax = 0.5;
    this.ymin = 0.005;
    this.ymax = 0.995;
    this.zmin = 0.005;
    this.zmax = 0.995;
}
