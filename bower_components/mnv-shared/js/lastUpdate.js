/*
  Author: Umberto Babini.
  Purpose: Provide a simple update time on 'last-update' field
*/
function MNVLastUpdate(container, selector, fadeOutTiming, timestamp){
  var update, tag, elSelector, fadeOutTiming, me, defaultTimestamp;
  // Set default value
  elSelector = (typeof selector === 'undefined') ? '.last-update' : selector;
  fadeOutTiming = (typeof selector === 'undefined') ? 2000 : fadeOutTiming;
  me = this;
  tag = container.querySelector(elSelector);

  update = function(){
    var timestampString = (typeof timestamp === 'function') ? timestamp() : timestamp;
    if(tag.length===0){
      me.log('Unable to find the element ' + elSelector);
    } else {
      me.addClass(tag, 'highlight');
      (document.all) ? (tag.innerText = timestampString) : (tag.textContent = timestampString);
      // Remove higlight after fadeOutTiming
      setTimeout(function(){
        me.removeClass(container.querySelector(elSelector), 'highlight');
      }, fadeOutTiming);
    }
  };

  // defaultTimestamp = function(){
  //   var d = new Date();
  //   var weekday = new Array(7);
  //   weekday[0]=  "Sunday";
  //   weekday[1] = "Monday";
  //   weekday[2] = "Tuesday";
  //   weekday[3] = "Wednesday";
  //   weekday[4] = "Thursday";
  //   weekday[5] = "Friday";
  //   weekday[6] = "Saturday";

  //   var shortMonthsName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  //   var n = weekday[d.getDay()];
  //   return n + ' ' + d.getDate() + ' ' + shortMonthsName[d.getMonth()] + ' ' + d.getFullYear() + ' at ' + ISO(d.getHours()) + ':' + ISO(d.getMinutes()) ;
  // }

  defaultTimestamp = function(){
    var d = new Date();
    var shortMonthsName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return d.getHours() + ':' + ISO(d.getMinutes()) + ' ' + me.ordinal_suffix_of(d.getDate()) + ' ' + shortMonthsName[d.getMonth()] + ' ' + d.getFullYear() ;
  }

  function ISO(nr){
    var str = nr.toString();
    if(str.length<2){
      str = '0' + str;
    }
    return str
  }
  me.addClass(tag, 'not-highlight');
  timestamp = (typeof timestamp === 'undefined') ? defaultTimestamp : timestamp;
  update();

  return {
    update: update
  }
}

MNVLastUpdate.prototype = new MNVBasic();