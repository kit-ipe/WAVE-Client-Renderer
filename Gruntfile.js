module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        glsl_threejs: {
            shaders: {
                options: {
                    jsPackage: 'window.VRC.Core.prototype._shaders',
                    lineEndings: '\n',
                },
                files: {
                    'src/shaders/concat_shaders/shaders.gen.js': ['src/shaders/*.vert', 'src/shaders/*.frag'],
                },

            }
        },

        concat: {   
            without_deps: {
                src: [
                './src/raycasterNamespace.js',
                './src/dispatcher.js',
                './src/adaptaionManager.js',
                './src/geometryHelper.js',
                './src/core.js',
                './src/shaders/concat_shaders/shaders.gen.js',
                './src/volumeRaycaster.js'
                ],
                dest: 'build/volumeRaycaster.js',
            },

            with_deps: {
                src: [
                './libs/three.min.js',
                './libs/OrbitControls.js',
                './libs/TrackballControls.js',
                './src/raycasterNamespace.js',
                './src/dispatcher.js',
                './src/adaptaionManager.js',
                './src/geometryHelper.js',
                './src/core.js',
                './src/shaders/concat_shaders/shaders.gen.js',
                './src/volumeRaycaster.js'
                ],
                dest: 'build/volumeRaycaster.with-deps.js',
            }
        },

        uglify: {
            options: {
                mangle: false
            },

            without_deps: {
                src: 'build/volumeRaycaster.js',
                dest: 'build/volumeRaycaster.min.js'
            },

            with_deps: {
                src: 'build/volumeRaycaster.with-deps.js',
                dest: 'build/volumeRaycaster.with-deps.min.js'
            }
        },

        watch: {
            scripts: {
                files: ['src/*.js', 'src/shaders/*.vert', 'src/shaders/*.frag'],
                tasks: ['glsl_threejs', 'concat'],
                options: {
                    spawn: false,
                },
            }
            
        }
    });

    grunt.loadNpmTasks('grunt-glsl-threejs');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['glsl_threejs', 'concat', 'uglify']);
}
