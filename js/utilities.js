"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

mnv_ukelmap.utilities = (function() {
  var my = {};

  // Return true = touch based devices.
  my.isTouchDevice = function() {
    return (window.ontouchstart !== undefined || window.navigator.msMaxTouchPoints);
  };

  // Return true if the object passed is empty. jQuery from version 1.4 has implemented the isEmptyObject(object) method
  // (http://api.jquery.com/jQuery.isEmptyObject/) when/if we update the jQuery library this function can be replaced
  // with the isEmptyObject method.
  my.isEmptyObject = function(o) {
    for(var p in o) {
      if(o.hasOwnProperty(p)) {
        return false;
      }
    }
    return true;
  };

  // Check for *version* of IE
  my.IE = function(version) {
    var ie = (navigator.appName.search("Explorer") >= 0) ? true : false;
    var ver = (typeof version === 'number') ? [version] : version;
    if (ie && ver) {
      for(var key in ver) {
        ie = (navigator.appVersion.search('MSIE ' + ver[key] + '.0') >= 0) ? true : false;
        if (ie === true){break;}
      }
    }
    return ie;
  };

  // NUMBER WITH COMMAS
  // Found this out there somewhere. Converts number to '000 format,
  // without screwing up decimal places, and returns as a string:
  my.numberWithCommas = function(n) {
    "use strict";
    var parts=n.toString().split(".");
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
  };  

  my.log = function(txt){
    if(window.console && window.console.log){
      // console.log(txt);
    }
  };
  // NUMBER WITH COMMAS ends

  // RECURSIVE PARENT SIZE SEARCH
  my.recursiveParentSizeSearch = function(el, recursiveLimit, recursiveDepth){
    var sizes, sizeObj = {};
    // On first call, set to zero
    if (recursiveDepth === undefined) { recursiveDepth = 0; }
    // If we've reached the depth limit, return undefined:
    if(recursiveDepth===recursiveLimit){
      //console.log("Unable to find a plausible parent...");
      return;
    }
    // Still here? Look for viable size at this depth:
    sizes = el.parentElement.getBoundingClientRect();
    if(sizes.width!==0 && sizes.width){
      sizeObj.height = sizes.height;
      sizeObj.width = sizes.width;
      // If we've got dimensions, return them:
      // console.log('Detected sizes from wrapper w:' + sizes.width + ' h:' + sizes.height);
      return sizeObj;
      //return {"width":sizes.width, "height":sizes.height};
    }
    else {
      // No luck yet, bubble up...
      // console.log('Unable to detect sizes on' + el + ' I will try with ' + el.parentElement );
      return my.recursiveParentSizeSearch(el.parentElement, recursiveLimit, recursiveDepth++);
    }
    // 
    // recursiveLimit++;
  };
  // RECURSIVE PARENT SIZE SEARCH ends


  return my;
  
}());
