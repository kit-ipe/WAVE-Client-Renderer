module.exports = function(grunt) {

    // 1. Всё конфигурирование тут
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {   
            without_deps: {
                src: [
                './src/raycasterNamespace.js',
                './src/dispatcher.js',
                './src/adaptaionManager.js',
                './src/geometryHelper.js',
                './src/shaders.js',
                './src/core.js',
                './src/volumeRaycaster.js'
                ],
                dest: 'build/volumeRaycaster.js',
            },

            with_deps: {
                src: [
                './libs/three.min.js',
                './libs/OrbitControls.js',
                
                './src/raycasterNamespace.js',
                './src/dispatcher.js',
                './src/adaptaionManager.js',
                './src/geometryHelper.js',
                './src/shaders.js',
                './src/core.js',
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
                files: ['src/*.js'],
                tasks: ['concat', 'uglify'],
                options: {
                    spawn: false,
                },
            } 
        }
    });

    // 3. Здесь мы сообщаем Grunt, что мы планируем использовать этот плагин:
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // 4. Мы сообщаем Grunt, что нужно делать, когда мы введём "grunt" в терминале.
    grunt.registerTask('default', ['concat', 'uglify']);
}
