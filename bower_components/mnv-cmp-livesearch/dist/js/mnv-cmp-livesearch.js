function ecLiveSearch(config){
  'use strict';
  var widget, inputField, resultsList, widgetClassName = "mnv-ec-livesearch", search, trigger, hideResults, bindEvents, container, hideOnLeave, log, list, searchProperty, prefix, timer, hideTimer, reset, hasClass, resetForm;
  prefix = widgetClassName + "-";
  this.init = function(config) {
    if(config.list instanceof Array === false) {
      log("list should be an array");
      return false;
    }
    if(config.list.length === 0) {
      log("list shouldn't be empty");
      return false;
    }
    if(config.searchProperty === undefined) {
      log("Provide a searchProperty");
      return false;
    }
    if(config.searchProperty === undefined) {
      log("Provide a searchProperty");
      return false;
    }
    container = document.querySelectorAll('.' + widgetClassName);
    if(container.length===0){
      log('Unable to find a widget with class ' + widgetClassName);
      return false;
    }
    if(config.caseInsensitive === undefined){
      config.caseInsensitive = true;
    }
    container = container[0];
    list = config.list;
    searchProperty = config.searchProperty;
    hideOnLeave = config.hideOnLeave || false;
    inputField = document.createElement('input');
    inputField.className = prefix + "input";
    inputField.setAttribute('placeholder', config.placeholder );
    reset = document.createElement('button');
    reset.className = prefix + "reset search";
    reset.innerText = '';
    resultsList = document.createElement('ul');
    resultsList.className = prefix + "list";
    resultsList.style.display = 'block';
    container.appendChild(inputField);
    container.appendChild(reset);
    container.appendChild(resultsList);
    bindEvents();
  };

  search = function(str){
    var results, items;
    log('Starting search');
    resultsList.style.display = 'block';
    resultsList.innerHTML = '';
    var ar = str.split(" ");
    var reg = '';
    ar.map(function(val){
      reg += '(?=.*' + val + ')';
    });
    if(str.trim()===""){
      results = [];
    } else {

      var re = new RegExp(reg, (config.caseInsensitive) ? 'i' : null );
      results = list.filter(function(value){
        return value[searchProperty].match(re);
      });
    }
    if(results.length===0){
      resultsList.innerHTML = '<li>No results</li>';
    } else {
      items = [];
      results.map(function(obj){
        var item = document.createElement('li');
        item.innerHTML = obj[searchProperty];
        item.addEventListener('click', function(){
          inputField.value = obj[searchProperty];
          trigger.call(container, 'resultSelected', obj);
          hideResults(false);
        });
        resultsList.appendChild(item);
      });
    }
  };

  trigger = function(ev, data){
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
    log('triggered: ' + ev + ' with data : ' + data);
    this.dispatchEvent(myEvent);
  };

  log = function(txt){
    if(window.console && window.console.log){
      console.log(txt);
    }
  };

  hideResults = function(resetInput){
    if(resetInput===true){
      resetForm();
    }
    resultsList.innerHTML = "";
    resultsList.style.display = 'none';
  };

  hasClass = function(el, className){
    return (el.classList) ? el.classList.contains(className) : new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
  };

  resetForm = function(){
    inputField.value = '';
    reset.className = prefix + "reset search";
    trigger.call(container, 'fieldReset');
  };

  bindEvents = function(){
    inputField.addEventListener('keyup', function(){
      var str =  this.value.trim();
      if(hasClass(reset, 'search')){
        reset.className = prefix + "reset close";
      }
      clearTimeout(timer);
      timer = window.setTimeout(function() {
        search(str);
      }, 500);
    });
    inputField.addEventListener('focus', function(){
      resetForm();
    });
    if(hideOnLeave){
      resultsList.addEventListener('mouseleave', function(){
        clearTimeout(hideTimer);
        hideTimer = window.setTimeout(function() {
          hideResults();
        }, 1000);
      });
    }
    reset.addEventListener('click', function(){
      if(hasClass(this, "search")){
        // Focuse on magnifier click
        inputField.focus();
      } else {
        hideResults(true);
      }
    });
  };

  if(!config){
    log("You have to provide a config object");
    return false;
  }
  this.init(config);
}
