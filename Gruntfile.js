/*global module:false*/
module.exports = function (grunt) {

    grunt.initConfig({
    
        meta: {
            pkg: grunt.file.readJSON('package.json'),
            src: {
                main: 'src',
                test: 'test'
            }
        },

        jsdoc: {
            options: {
                configure: '.jsdocrc',
                destination: 'doc'
            },
            files: ['<%= meta.src.main %>/*.js']
        }

    });


    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.registerTask('doc', ['jsdoc']);

};
