 module.exports = function(grunt) {

     grunt.initConfig({
        sass: {
            dist: {
                files: {
                    'css/main.css': 'css/main.scss',
                },
            },
            styleguide: {
                files: {
                    'css/styleguide.css': 'css/styleguide.scss',
                },
            },
        },
        watch: {
            styleguide: {
                files: ['css/*.scss', 'css/*.hbs', 'css/*.md', 'directives/**/*.js', 'app.js'],
                tasks: ['sass:styleguide', 'sass:dist', 'shell', 'cssmin'],
            },
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1,
            },
            target: {
                files: {
                    'css/main.min.css': 'css/main.css',
                },
            },
        },
        shell: {
            options: {
                stderr: false,
            },
            target: {
                command: 'kss-node css styleguide css\styleguide.md --template kss-template',
            },
        },
        karma: {
            styleguide: {
                configFile: 'karma.conf.js'
            },
            continuous: {
                configFile: 'karma.conf.js',
                singleRun: false
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc' //http://jshint.com/docs/options/
            },
            all: ['Gruntfile.js', 'directives/**/*.js', 'app.js'],
        },
        jscs: {
            src: ['Gruntfile.js', 'directives/**/*.js', 'app.js'],
            options: {
                config: '.jscsrc',
            },
        },
        ngtemplates: {
            'styleguide.templates': {
                src: ['directives/**/*.tpl.html'],
                dest: 'dist/templates.js',
                options: {
                    standalone: true
                }
            }
        },
        sasslint: {
                  options: {
                      configFile: '.sass-lint.yml',
                  },
                  target: ['css/_accordion.scss']
              },
        uglify: {
                  'dist/wfmdirectives.min.js': ['directives/**/*.js', '!directives/**/*.spec.js']
              }
    });

     grunt.loadNpmTasks('grunt-sass');
     grunt.loadNpmTasks('grunt-sass-lint');
     grunt.loadNpmTasks('grunt-contrib-watch');
     grunt.loadNpmTasks('grunt-shell');
     grunt.loadNpmTasks('grunt-contrib-cssmin');
     grunt.loadNpmTasks('grunt-karma');
     grunt.loadNpmTasks('grunt-contrib-jshint');
     grunt.loadNpmTasks('grunt-jscs');
     grunt.loadNpmTasks('grunt-contrib-uglify');
     grunt.loadNpmTasks('grunt-angular-templates');

     // Default task(s).
     grunt.registerTask('default', ['dist', 'watch:styleguide']);
     grunt.registerTask('test', ['karma:styleguide']);
     grunt.registerTask('dist', ['jscs', 'jshint', 'ngtemplates', 'sass:styleguide', 'sass:dist', 'shell', 'cssmin', 'uglify']); // this task is kind of package
 };
