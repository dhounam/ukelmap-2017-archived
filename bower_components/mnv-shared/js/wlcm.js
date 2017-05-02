// WLCM
// Widget Life Cycle Manager
var WLCM = (function () {
  // Instance stores a reference to the Singleton
  var _wlcm;

  function init() {
    // Singleton
    // Constants
    var CONST = {
      data: {
        inbundle: {
          folder: 'data/inbundle.json'
        },
        path: '/sites/default/files/external/minerva_data/',
        defaultDataFile: {
          json: 'data.json',
          jsonp: 'data-jsonp.json'
        }
      },
      assets: {
        path: '/sites/default/files/external/minerva_assets/'
      }
    } 
 
    // Private methods and variables
    function setWidgetInstances(){
      _wlcm.instances = $("[data-mnv]");
      return _wlcm.instances.length;
    }

    function addWidget(type, widgetConfig, instance){
      if(!_wlcm.instancesByTypes.hasOwnProperty(type)){
        _wlcm.instancesTypes.push(type);
        _wlcm.instancesByTypes[type] =   {
          config: widgetConfig.config,
          minerva: widgetConfig.minerva,
          instances: []
        }
      }
      _wlcm.instancesByTypes[type].instances.push(instance);
    }

    function getWidgetTypes(){

    }

    function initWidgetInstances() {
        _wlcm.instancesByTypes = {};
        _wlcm.instancesTypes = [];
        _wlcm.instances.each(function(){
          var id, widgetType, obj;

          id = $(this).attr('id');
          widgetType = $(this).attr('data-mnv');
          try {
            obj = new (eval(widgetType))();
          } catch(e){
            _wlcm.log('No existing class ' + id);
            obj = false;
          }
          if(obj){
            //Create an instance of the widget
            jQuery.extend(obj,
              {
                id: id,
                el: $(this),
                data: null
            });
            jQuery.data( this, 'widget', obj);
            addWidget(widgetType, obj, this);
            $(this).trigger('widgetInstanciated');
          }
        });
        feedWidgetInstances();
      }

      function feedWidgetInstances(){
        for (var i = _wlcm.instancesTypes.length - 1; i >= 0; i--) {
          var widgetType = _wlcm.instancesTypes[i];
          if(_wlcm.instancesByTypes.hasOwnProperty(widgetType)){
            var provider = _wlcm.instancesByTypes[widgetType].config.bundle.data.provider;
            _wlcm.log('Provider ' + provider);
            switch(provider){
              case null:
                _wlcm.log('I will do nothing more ');            
              break;
              case 'inbundle':
                var d = eval(widgetType + 'Data');
                if(typeof d != 'undefined'){
                  //TODO review inbundle data without Global
                  _wlcm.loadMultipleInstances(d,widgetType);
                } else {
                  _wlcm.log('var ' + widgetType + 'Data' + ' is undefined, please check ' + CONST.data.inbundle.folder, new Error().lineNumber);
                }
              break;
              case 'jsonp':
                _wlcm.readData(widgetType);
              break;
              case 'json':
                _wlcm.readData(widgetType);
              break;
            }
          }
        };
      }

    function prepareURLS(widgetType){
        var bundle, minerva;
        bundle = _wlcm.instancesByTypes[widgetType].config.bundle;
        minerva = _wlcm.instancesByTypes[widgetType].minerva;
        
        if (typeof bundle.data.url !== 'undefined') {
          _wlcm.log('Data url by config file: ' + bundle.data.url);
        } else {
          var mandatory = ['host','version'];
          for(var i=0;i<mandatory.length;i++){
            var mandatoryProperty = mandatory[i];
            if(typeof bundle.data[mandatoryProperty] !== 'string' || !bundle.data.hasOwnProperty(mandatoryProperty)){
              return 'The mandatory property ' + mandatoryProperty + ' is missing in data';
            }
          }
          var defaultDataFile = CONST.data.defaultDataFile[bundle.data.provider];
          bundle.data.url = 'http://' + bundle.data.host + CONST.data.path + minerva.ns.folder + '/' + bundle.data.version + '/' + defaultDataFile;
          _wlcm.log('Data file ' + bundle.data.url);
        };

        if (typeof bundle.assets.url !== 'undefined') {
          _wlcm.log( 'Assets url by config file: ' + bundle.assets.url);
        } else {
          var mandatory = ['host','version'];
          for(var i=0;i<mandatory.length;i++){
            var mandatoryProperty = mandatory[i];
            if(typeof bundle.assets[mandatoryProperty] !== 'string' || !bundle.assets.hasOwnProperty(mandatoryProperty)){
              return 'The mandatory property ' + mandatoryProperty + ' is missing in assets';
            }
          }
          bundle.assets.url = 'http://' + bundle.assets.host + CONST.assets.path + minerva.ns.folder + '/' + bundle.assets.version + '/';
          _wlcm.log('Assets folder ' + bundle.assets.url);
        };

        return true;
    }

    return {
      // Public methods and variables
      readData: function(widgetType){
        _wlcm.log('Trying reading data for ' + widgetType);
        var urlCheck = prepareURLS(widgetType);
        if(typeof urlCheck === 'string'){
          _wlcm.log('Error preparing the url: ' + urlCheck + ' in your config file', new Error().lineNumber );
          return false;
        }
        var url = _wlcm.instancesByTypes[widgetType].config.bundle.data.url;
        switch(_wlcm.instancesByTypes[widgetType].config.bundle.data.provider){
          case 'json':
            $.ajax({
                'global': false,
                'url': url,
                'dataType': "json",
                'success': function (data) {
                  _wlcm.log('Reading successfully ' + widgetType);
                  _wlcm.loadMultipleInstances(data, widgetType);
                },
                'error': function (jqXHR, textStatus, error) {
                  _wlcm.log(error);
                }
            });
          break;
          case 'jsonp':
            //TODO improve this part without Global
            window[widgetType + 'Callback'] = function (data){
              WLCMI.loadMultipleInstances(data, widgetType);
            }

            $.ajax({
                url: url,
                // The name of the callback parameter
                jsonp:  widgetType + 'Callback',
                dataType: "jsonp",
                success: function( response ) {
                  _wlcm.log('Reading successfully ' + widgetType);
                },
                error: function (jqXHR, textStatus, error) {
                  _wlcm.log('An error occured reading '+ url +' file: ' + textStatus);
                  _wlcm.log(error, new Error().lineNumber);
                }
            });
          break;
        }
      },
      loadMultipleInstances: function (data, widgetType) {
        for (var i = _wlcm.instancesByTypes[widgetType].instances.length - 1; i >= 0; i--) {
          var widgetInstance = _wlcm.instancesByTypes[widgetType].instances[i];
          var id = $(widgetInstance).attr('id');
          // Check if there is a configuration for this element
          if(data.hasOwnProperty(id)){
            //Add data to instance of the object
            var target = $('#' + id);
            if(target!=[]){
              var obj = target.data( 'widget' );
              obj.data = data[id];
              jQuery.data( target , 'widget', obj);
              _wlcm.log('Sending data to ' + id);
              target.trigger('dataProviding');
            } else {
              _wlcm.log('Unable to locate ' + id);              
            }
          }
          if(data.hasOwnProperty('data')){
            data = data.data;
            //Add data to instance of the object
            var target = $('#' + id);
            var obj = target.data( 'widget' );
            obj.data = data;
            jQuery.data( target , 'widget', obj);
            _wlcm.log('Sending data to ' + id);
            target.trigger('dataProviding');
          }
        };
      },
      getWidgetInstances: function(){
        return this.setWidgetInstances();
      },
      log: function(txt, error){
        // if(error){
        //   console.error( "WLCM --> " + txt + " Check line " + error );
        // } else if(widgetConfig.minerva.debugMode){
        console.log( "WLCM --> " + txt );
        //}
      },
      start: function(){
        if(this.justOneTime!==true){
          //Call private method
          if(this.setWidgetInstances()>0){
            this.initWidgetInstances();
          }
          this.justOneTime = true;
        }
      },
      setWidgetInstances: setWidgetInstances,
      initWidgetInstances: initWidgetInstances
      

    };
 
  };
 
  return {
    // Get the Singleton _wlcm if one exists
    // or create one if it doesn't
    getInstance: function () {
      if ( !_wlcm ) {
        _wlcm = init();
      }
      return _wlcm;
    }
  };
 
})();

var WLCMI = WLCM.getInstance();