module.exports = function(grunt) {
  var fs = require('fs');
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    useminPrepare: {
      html: 'partials/widgethead.handlebars'
    },
    githooks: {
      all: {
        'pre-commit': 'jshint'
      }
    },
    shell: {
      listFolders: {
        options: {
          stdout: true
        },
        command: 'git init'
      }
    },
    watch: {
      scripts: {
        files: 'js/*.js'
      },
      sass: {
        files: ['css/sass/**/*.{scss,sass}',  'css/sass/dropdowns.scss'],
        tasks: ['sass:dev']
      },
      handlebars: {
        files: ['js/tpl/handlebars/*.handlebars'],
        tasks: ['handlebars']
      },
      KeepDataAligned: {
        files: ['data/ukliteralpaths.json'],
        tasks: ['KeepDataAligned']
      }
    },
    concat: {
      dist: {
        src: ['js/css.js', 'js/init.min.js'],
        dest: 'js/init.min.js',
      },
    },
    uglify: {
      options: {
        mangle: {
          except: ['mnv']
        }
      }
    },
    sass: {
      dist: {
        options: {
          outputStyle: [
            'compressed'
          ],
          includePaths: [
            './bower_components/sass-list-maps'
          ]
        },
        files: {
          'css/style.css': 'css/sass/style.scss'
        }
      },
      dev: {
        files: {
          'css/style.css': 'css/sass/style.scss'
        }
      }
    },
    browserSync: {
        dev: {
            bsFiles: {
              src : ['css/style.css', 'js/*.*', 'public/*.*', 'partials/*.*', 'js/tpl/template.js' ]
            },
            options: {
              watchTask: true // < VERY important
            }
        }
    },
    jshint: {
      //files: ['js/**/*.js', '!js/init.min.js', '!js/tests/*.js', '!js/tpl/template.js'],
      files: ['js/init.js'],
      options: {
        camelcase: true,
        curly:   true,
        eqeqeq:  true,
        forin: true,
        immed:   true,
        latedef: true,
        newcap:  true,
        noarg:   true,
        sub:     true,
        undef:   true,
        boss:    true,
        eqnull:  true,
        browser: true,
        strict: true,
        trailing: true,

        globals: {
          // AMD
          module:     true,
          require:    true,
          requirejs:  true,
          define:     true,
          Handlebars: true,
          mnv: true,

          // Environments
          console:    true,

          // General Purpose Libraries
          $:          true,
          jQuery:     true,
          sinon:      true,
          describe:   true,
          it:         true,
          expect:     true,
          beforeEach: true,
          afterEach:  true
        }
      }
    },
    handlebars: {
      all: {
        files: {
            'js/tpl/template.js': 'js/tpl/handlebars/*.handlebars'
        }
      }
    },
    jasmine: {
      src: ['js/*.js', '../../js/*.js', '!js/init.min.js'],
      options: {
        specs: ['js/tests/*tests.js', '../../js/tests/*tests.js'],
        vendor: ['https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js']
      }
    },
    csstojs: {
      target: ['css/style.css', 'js/css.js']
    },
    robFix: {
      target: ['js/init.min.js']
    },
    KeepDataAligned: {
      target: ['data/ukliteralpaths.json','data/ukliteralpaths.js']
    }
  });

  // Convert css into js
  grunt.registerMultiTask('csstojs', 'Convert CSS to JS.', function() {
    var cssPath = this.data[0];
    jsPath = this.data[1];

    grunt.log.writeln("Starting conversion...");
    var css = fs.readFileSync(cssPath).toString();

    if(!css) {
      grunt.log.writeln("The css file is empty, nothing to convert.");
      return false;
    }
    var cssStr = css.split("\n").map(function(l){return '"' + l + '\\n"';}).join(" + \n");
    var js = "(function() { var css = " + cssStr + ", head = document.getElementsByTagName('head')[0], style = document.createElement('style'); style.setAttribute('type', 'text/css'); var nodeStyle = document.createTextNode(css); if(style.styleSheet){ style.styleSheet.cssText = css;}else{ style.appendChild(nodeStyle); }; head.appendChild(style);})();";


    grunt.log.writeln("Conversion completed, js file created.");
    fs.writeFileSync(jsPath, js);
    return true;
  });

  // Rob fix
  // This check prevent a problem verified on IE with the minified file
  // Check for this string "c.styleSheet?c.styleSheet.cssText=d.toString():c.appendChild(d)," on the init.min.js
  // and replace with this "c.styleSheet?c.styleSheet.cssText=a:c.appendChild(d),"
  grunt.registerMultiTask('robFix', 'Apply Rob Fix for IE issue on uglified file', function() {
    var target = this.data[0];

    grunt.log.writeln("Starting fix file " + target + "...");
    try {
      var initMin = fs.readFileSync(target).toString();
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + target + ": " + err);
      return false;
    }
    
    grunt.log.writeln("File readed...");
    //grunt.log.writeln(initMin);
    
    var before = initMin;
    initMin.replace('c.styleSheet?c.styleSheet.cssText=d.toString():c.appendChild(d),', 'c.styleSheet?c.styleSheet.cssText=a:c.appendChild(d),');
    if(initMin===before){
      grunt.log.writeln("No string replaced, nothing changed.");
    } else {
      grunt.log.writeln("String replaced");
      try {
        fs.writeFileSync(target, initMin);
      } catch (err) {
          grunt.log.writeln("An error occured on saving file:" + err);
          return false;
      }
      grunt.log.writeln("Rob Fix applied with success.");
    }    
    return true;
  });

 // KeepDataAligned
  // Keep aligned different version of data with the a source *.json file
  // Different data are needed to test different data-provider
  grunt.registerMultiTask('KeepDataAligned', 'Recreating data derivated files', function() {
    var dataFile = this.data[0];
    this.data.shift();
    
    grunt.log.writeln("Starting file reading " + dataFile + "...");
    try {
      var data = fs.readFileSync(dataFile).toString();
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + dataFile + ": " + err);
      return false;
    }
    var file = this.data[0];
    console.log('Working on ' + file);
    var newData;
    grunt.log.writeln("Starting file reading " + file + "...");
    //Reading the name of the callback in the jsonp file
    try {
      var inbundleFile = fs.readFileSync(file).toString();
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + file + ": " + err);
      return false;
    }
    var match = inbundleFile.match(/^var.{0,}=/i)[0];
    newData = match + data + ';';     

    grunt.log.writeln("Try writing " + file);
    try {
      fs.writeFileSync(file, newData);
      grunt.log.writeln("Writed " + file);
    } catch (err) {
        grunt.log.writeln("An error occured on saving file:" + file + " " + err);
        return false;
    } 

    return true;
  });

  grunt.loadNpmTasks('grunt-collection');

  // Compile sass and handlebars on the fly.

  grunt.registerTask('default', ['sass:dev', 'handlebars', 'browserSync', 'watch']);

   // Unit tests.
  grunt.registerTask('test', ['jasmine']);

  // Unit tests.
  //'jasmine',
  grunt.registerTask('getready', ['jshint']);

  // Git tasks.
  grunt.registerTask('git', ['shell', 'githooks']);

  // Run this task when the code is ready for production.
  grunt.registerTask('production', ['sass:dist',  'csstojs', 'useminPrepare', 'concat', 'concat:dist', 'uglify']);
};