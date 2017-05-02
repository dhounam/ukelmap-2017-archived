/*
  Module is responsible for KEYS
*/
"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

// KEYS constructor
mnv_ukelmap.keys = (function(){
  var my, model, controller, parties, modelflags, kUL, kWidth, kHeight, kSVG,
    kGroup, mapindex, dataindex, keyTitle;
  my = {};
  model = mnv_ukelmap.model;
  controller = mnv_ukelmap.controller;
  parties = model.parties;
  modelflags = model.flags;

  // LOCAL FLAGS
  my.localflags = {
    mapindex: -1,
    dataindex: "dataindex",
    currentconstit: "currentconstit",
    updatecounter: -1
  };
  // LOCAL FLAGS ends

  function keymouseover() {
    var id = this.id.split("_")[1];
    controller.keyListener(id);
  }

  // INIT
  // Just appends the ul component to the key div
  my.init = function() {
    var keyWrapper = d3.select('.ukelmap-keys-div');

    keyWrapper.append("button")
      .attr("class","closer")
      .on("click", function(){
        mnv_ukelmap.framework.inViewKey(false);
      });

    keyTitle = keyWrapper.append("div")
      .attr("class", "ukelmap-keys-label")
      .style("padding-bottom","5px");

    kUL = keyWrapper.append("ul")
       .attr("class","ukelmap-keys-ul")
       ;
    if(controller.isSmallVersion()){
      kUL.on("click", function(){
        mnv_ukelmap.framework.inViewKey(false);
      });
    }
    // Flag that framework is ready...
    controller.startchecks('keys');
  };
  // INIT ends


  // UPDATE
  // Compares local flags with the model
  // If there are any relevant differences, call drawKeys.
  // And update local flags
  my.update = function() {
    var constitavailable, mapI, dataI, changed, currentconstit,
      updatecounter;
    constitavailable = modelflags.constitavailable;
    currentconstit = modelflags.currentconstit;
    updatecounter = modelflags.updatecounter;

    mapI = modelflags.mapindex;
    dataI = modelflags.dataindex;
    changed = false;

    // When the datafilter responds to the map's request to find data for 1 constit
    // (either loaded from file, or available in model.data)...
    // If there IS a constit id (ie we're not looking for a national seat count),
    // and if the datafilter set the not-available flag, bale out now.
    if ( (currentconstit !== undefined) &&
         (!constitavailable) ) {
      showUndeclared(dataI);
      return;
    }

    // Map index:
    if (my.localflags.mapindex !== mapI) {
      my.localflags.mapindex = mapI;
      changed = true;
    }
    // Data index:
    if (my.localflags.dataindex !== dataI) {
      my.localflags.dataindex = dataI;
      changed = true;
    }
    if (changed) {
      my.drawKeys();
    }
    // Key strings:
    if ( (dataindex === "sev") || (dataindex === "fif") || (dataindex === "ten") ) {
      // If we're swapping tabs, 2010/15/17 and the widget has to
      // go off and load the file for the selected constit, we
      // just need to give that a mooment to complete...
      setTimeout( function() {
        my.appendPercentVals(currentconstit, dataindex);
      },0)
    }
    my.localflags.currentconstit = currentconstit;
  };
  // UPDATE ends

  // SHOW UNDECLARED
  // Relabels to party names only
  function showUndeclared(dataindex) {
    my.appendPercentVals(undefined,dataindex)
  }

  // New version of APPEND PERCENT VALS adds classes for sorting...
  my.appendPercentVals = function(id, dataindex) {
    var data, turnout, p, myP, kPrefix, thisP, kStr, v, kNo, kArray, temp, thisKey;
    kPrefix = "#key_";
    if (id !== undefined) {
      // Constit
      if (dataindex === "sev") {
        data = model.data.singleResults2017[id];
      } else if (dataindex === "fif") {
        data = model.data.singleResults2015[id];
      } else {
        data = model.data.singleResults2010[id];
      }
      if (data === undefined) {
        return;
      }
      turnout = data.turnout;
      d3.select(".ukelmap-keys-label")
        .text("Percent of vote");
    }
    else {
      // Seat count
      if (dataindex === "sev") {
        data = model.results2017;
      } else if (dataindex === "fif") {
        data = model.results2015;
      } else {
        data = model.results2010;
      }
      d3.select(".ukelmap-keys-label")
        .text("Seats");
    }
    // Array for sorting parties
    kArray = [];
    // Loop by parties. Pack an array with objects containing id, display-name, and val
    for (p in parties) {
      if (parties.hasOwnProperty(p)) {
        temp = {};
        thisP = parties[p];
        id = thisP.id;
        temp.id = id;
        kStr = thisP.keyname;
        v = data[id];
        // vote0 as % of turnout
        if (!isNaN(v)) {
          if (turnout === undefined) {
            // Default 'seats'
            if (v === 1) {
              kStr += ": " + v; // + " seat";
            }
            else {
              kStr += ": " + v; // + " seats";
            }
          }
          else {
            // Constit results:
            kStr += " " + (v / turnout * 100).toFixed(1) + "%";
          }
        }
        else {
          // "na" seats have zero val for sorting
          v = 0;
        }
        temp.val = v;
        temp.display = kStr;
        kArray.push(temp);
      }
    }
    // Now sort:
    kArray.sort(function(a,b) { return b.val - a.val; });

    for (kNo = 0; kNo < kArray.length; kNo ++) {
      thisKey = kArray[kNo];
      d3.select("#key_" + thisKey.id)
        .text(thisKey.display)
        .attr("class", function() { return "ukelmap-keys-li key_" + kNo})
        ;
    }
  };

  // DRAW KEYS
  // I'm getting map and data index. One of these may be redundant in the long term...
  my.drawKeys = function() {
    var kLookup, prefix, data, ulWidth, liWidth, keys, dLen;
    // USING MAP INDEX FOR NOW,
    // BUT MAY NEED TO BE DATA INDEX...
    // These 2 vars are globals, btw:
    mapindex = model.flags.mapindex;
    dataindex = model.flags.dataindex;
    // Delete any existing key 'li' components
    // (This provides for tabbed widgets...)
    d3.select('.ukelmap-keys-ul').selectAll("li").remove()
    // Ranges definitions -- using map index for now, but may need to be data index *** *** ***
    kLookup = model.keys[dataindex];
    // kLookup is an object defining ranges
    // Current and marginals just use a lookup property id and get
    //    the colour by looking that id up in parties
    // Demographics loop through by val, then look up display and fill properties

    // Prefix for key id
    prefix = model.strings.keyPrefix;
    // If a keyTitle is specified use this to update the legend title
    if(kLookup.keyTitle!== undefined){
      keyTitle.text(kLookup.keyTitle);
    }
    // Which key range? If we set smallranges = null on the model,
    // use bigranges...
    if (controller.isSmallVersion()) {
      if (kLookup.smallranges === null) {
        data = kLookup.bigranges;
      }
      else {
        data = kLookup.smallranges;
      }
    }
    else {
      data = kLookup.bigranges;
    }
    // I'm drawing a series of divs with 2 sub-elements: a rect and a text string...
    // Calculate width as % (for responsiveness), allowing for margins
    // (.5% padding, left and right of each key)
    // THESE AREN'T ACTUALLY APPLIED: COMM'D OUT ABOUT 15 LINES DOWN
    ulWidth = 100 - kLookup.layout.columns;
    liWidth = (ulWidth / kLookup.layout.columns) + "%";
    // Kludge!!!
    liWidth = "80%";

    dLen = data.length - 1;

    keys = kUL.selectAll('.ukelmap-keys-ul')
      .data(data)
      ;

    keys
      .enter().append("li")
      .attr("class",function(d,i) {
        var s = "ukelmap-keys-li key_"
        s += dLen - i;
        return s;
      })
      .attr("id", function(d,i) {
        var id;
        if ( (dataindex === "sev") || (dataindex === "fif") || (dataindex === "ten") ) {
          id = d.id;
        }
        else {
          id = i;
        }
        return prefix + id;
      })
      // .style("width",liWidth)
      .style("border-left-color", function(d,i) {
        var col;
        if ( (dataindex === "sev") || (dataindex === "fif") || (dataindex === "ten") ) {
          col = parties[d.id].colour;
        }
        else {
          col = data[i].fill;
        }
        return col;
      })
      .text(function(d) {
        if (dataindex === "brx") {
          return d.display;
        }
      })
      // Text is now supplied by appendPercentVals, called from update
      // .html(function(d){
      //   var party = parties[d.id];
      //   return party.keyname;
      // })
      // .on("mouseover",keymouseover)
    ;

  };
  // DRAW KEYS ends

  return my;
}());
// KEYS constructor ends
