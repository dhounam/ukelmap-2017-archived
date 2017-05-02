function MNVBasic(){
  // Set log Off
  var me = this;
  this.logEnabled = false;
  this.log = function (txt, error){
    // Disabled log but print errors anyway
    if(this.hasOwnProperty('logEnabled') && !this.logEnabled && typeof error === 'undefined'){
      return;
    }
    var msg = '';
    msg = (this.id !== undefined) ? this.id : 'Unspecified widget';
    msg += ' --> ' + txt;
    if(window.console && window.console.log){
      if(error && window.console.error){
        console.error( msg );
      } else {
        console.log( msg );
      }
    }
  };

  this.ready = function(fn) {
    if (document.readyState != 'loading'){
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  };

  this.trigger = function(ev, data){
    var myEvent;
    function noCustomEvent(ev, data){
      var myEvent = document.createEvent('CustomEvent');
      myEvent.initCustomEvent(ev, true, true, data);
      return myEvent;
    }
    if (window.CustomEvent) {
      try {
        myEvent = new CustomEvent(ev, {
          detail: data
        });
      }
      catch (e){
        myEvent = noCustomEvent(ev, data);
      }
    } else {
      myEvent = noCustomEvent(ev, data);
    }
    log('triggered: ' + ev + ' with data');
    this.dispatchEvent(myEvent);
  };

  this.ajax = function(url, fn){
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var data = JSON.parse(request.responseText);
        fn(data);
      } else {
        // We reached our target server, but it returned an error
        log('Server error');
      }
    };

    request.onerror = function() {
      // There was a connection error of some sort
      log(this.error);
    };

    request.send();
  }

  this.jsonp = function(url, callbackName, callback) {
    var script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);

    window[callbackName] = function(data) {
      delete window[callbackName];
      // Get all the node List
      var scripts = document.getElementsByTagName('script');
      if(me.hasAttributeEqualTo(scripts, 'src', script.src )){
        document.body.removeChild(script);
      }
      callback(data);
    };
  }

  this.addClass = function(el, className){
    if (el.classList){
      el.classList.add(className);
    } else {
      el.className += ' ' + className;
    }
  }

  this.removeClass = function(el, className){
    if (el.classList){
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  }

  this.hasAttributeEqualTo = function(els, attr, val){
    if(els.tagName){
      return els.hasAttribute(attr) === val;
    } else {
      // els is a nodeList
      var i = 0;
      for(i=0; i< els.length; i++){
        if(els[i].hasAttribute(attr) && els[i][attr] === val){
          return els[i];
        }
      };
      return false;
    }
  }

  this.ordinal_suffix_of = function(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
  }
}