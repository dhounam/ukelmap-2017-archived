"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

// JSONP CALLBACKS FOR:
// Brexit results
  function resultsBrexitCB() {
    var key, makeObj, makeArray;
    key = "resultsBrexit";
    makeObj = true;
    makeArray = false;
    mnv_ukelmap.datafilter.filterResults(null, arguments[0], key, makeObj, makeArray);
  }
// 2010 results
  function results2010BasicCB() {
    var key, makeObj, makeArray;
    key = "results2010";
    makeObj = true;
    makeArray = false;
    mnv_ukelmap.datafilter.filterResults(null, arguments[0], key, makeObj, makeArray);
  }
// 2015 results
  function results2015BasicCB() {
    var key, makeObj, makeArray;
    key = "results2015";
    makeObj = true;
    makeArray = false;
    mnv_ukelmap.datafilter.filterResults(null, arguments[0], key, makeObj, makeArray);
  }
// 2017 results
  function seatsAndWinners2017CB() {
    var key, makeObj, makeArray;
    key = "results2017";
    makeObj = true;
    makeArray = false;
    mnv_ukelmap.datafilter.filterResults(null, arguments[0], key, makeObj, makeArray);
  }
// Constituency lookup
  function constituencyLookupCB() {
    var key, makeObj, makeArray;
    var key = "constituencyLookup";
    makeObj = true;
    makeArray = true;
    mnv_ukelmap.datafilter.filterResults(null, arguments[0], key, makeObj, makeArray);
  }
// Literal paths
  function ukLiteralPathsCB() {
    var key, makeObj, makeArray;
    var key = "literalPaths";
    makeObj = true;
    makeArray = false;
    mnv_ukelmap.datafilter.filterResults(null, arguments[0], key, makeObj, makeArray);
  }
// Single constituency data
  function resultCB() {
    var key, makeObj, makeArray;
    mnv_ukelmap.datafilter.filterOneConstit(null, arguments[0], key);
  }


// FILTER DATA
mnv_ukelmap.datafilter = (function(){
  var my, model, modelflags, controller, callbackFlags, filterDone, makeCurrentData,
    allDataReady, allReadyFlags, jsonp2010, filterJSON, storeInModel, filterConstitLookupData,
    goJson, preloader, loadLiteralData;
  my = {};
  model = mnv_ukelmap.model;
  modelflags = model.flags;
  controller = mnv_ukelmap.controller;
  preloader = new Widget();

  // LOCAL FLAGS
  my.localflags = {
    dataindex: "dataindex",
    requestedconstit: "requestedconstit"
  }

  // FILTER DONE
  // Callback tells controller that all data has been processed
  filterDone = function() {
    var controller = mnv_ukelmap.controller;
    controller.startchecks('datafilter');
    preloader.removePreloader();
  };
  // FILTER DONE ends

  // SINGLE CONSTITUENCY FILES: LOAD ONE CONSTIT DATA
  my.fetchOneConstitData = function(filename, correction) {
    // Key for callback lookup
    var cb = "resultCB";
    // clearCache is false, since goJson will check 'correction'
    // and apply it if not undefined
    var clearCache = false;
    goJson(filename, cb, clearCache, correction);
  }


  // LITERAL MAP PATHS
  my.loadLiteralData = function() {
    var filename = model.sourcefiles.literalpaths;
    // Key for callback lookup
    var cb = "ukLiteralPathsCB";
    var clearCache = false;
    goJson(filename, cb, clearCache);
  }

  // ALL READY FLAGS contains a series of flags, all of which
  // must be inferentially set TRUE before we can tell the
  // controller we're ready to proceed...
  allReadyFlags = {
    results2010: false,
    results2015: false,
    results2017: false,
    constituencyLookup: false
  };
  // ALL READY FLAGS ends

  // ALL DATA READY
  // Loops through allReadyFlags object;
  // returns false if ANY flag is (still) false
  allDataReady = function() {
    for (var cb in allReadyFlags) {
      if (!allReadyFlags[cb]) {
        return false;
      }
    }
    return true;
  };
  // ALL DATA READY ends

  // FILTER ONE CONSTIT
  my.filterOneConstit = function(error,json) {
    var dataObj, id, dataindex, objName;
    // I don't think we ever actually get an error...
    if (error) {
      dataObj = undefined;
    }
    else {
      dataObj = json;
      id = dataObj.id;
    }

    if (typeof dataObj === "object") {
      if (id !== undefined) {
        dataindex = model.flags.dataindex;
        if (dataindex === "sev") {
          objName = "singleResults2017";
          // Fish any correction value out of the global data node
          dataObj.corr = model.data.results2017Obj[id].corr;
        } else if (dataindex === "fif") {
          objName = "singleResults2015";
        }  else if (dataindex === "ten") {
          objName = "singleResults2010";
        } else {
          // Brexit
          objName = "singleResults2015";
        }
        // Update relevant single constituency repository in model.data
        model.data[objName][id] = dataObj;
        // And notify controller that we've loaded the constit data file:
        mnv_ukelmap.controller.findConstitListener(id, true);
      }
    }
  };
  // FILTER ONE CONSTIT ends

  // FILTER RESULTS
  // Filters a json file
  // 'key' determines name of property of model.data that is created
  my.filterResults = function(error,json,key,makeObj,makeArray) {
    var dataObj, dataArray, i, o, id, dataArrayName, dataObjName, isSmall;
    // Error aborts. In theory, this should mean that if no data file
    // is found, nothing at all happens...
    if (error) {
      return;
    }
    // Big or small?
    isSmall = mnv_ukelmap.controller.isSmallVersion();

    // Global results file use the winnersbyconstit node:
    if ( (key === "results2017") || (key === "results2015") || (key === "results2010") ) {
      json = json.winnersbyconstit;
    }

    // I may want to filter data into:
    //    1) an object with named nodes,
    //    2) an array...
    // The incoming json is an array of objects, which is, I think,
    // pretty much what I want!

    dataObj = {};
    dataArray = [];
    for (i = 0; i < json.length; i ++) {
      o = json[i];
      id = o.id;
      // Exclude blanks
      if (id.length > 0) {
        dataObj[o.id] = o;
        dataArray.push(o);
      }
    }
    // Store 2 versions of the data: as array and named objects
    // *** No sorting done... ***
    if (makeArray) {
      dataArrayName = key + "Array";
      model.data[dataArrayName] = dataArray;
    }
    if (makeObj) {
      dataObjName = key + "Obj";
      model.data[dataObjName] = dataObj;
    }

    // *** Literal paths ***
    // Inferentially return before the callback, to prevent
    // the literal paths being read in over and over again!
    if (key === "literalPaths") {
      // Literal paths are in, so we can drill another nasty hole thro
      // the structure, back to the map's toggleListener...
      mnv_ukelmap.map.toggleListener();
      return;
    }
    // Still here? This is one of the 'default' files...
    // Trip datafile-specific flag:
    allReadyFlags[key] = true;
    // Now check all flags to see if we're ready to finish...
    if (allDataReady()) {
      // This comm'd out function overlaid by-elections on 2010 data
      //makeCurrentData();
      // Tell controller that all data has been filtered
      filterDone();
    }
  };
  // FILTER RESULTS ends

  makeCurrentData = function() {
    var d2010Obj, currentObj, thisCurrentResult, id, this2010Result, currentArray;
    d2010Obj = model.data.results2010Obj;
    currentObj = model.data.byelectionsObj;
    currentArray = [];
    for (id in d2010Obj) {
      if (d2010Obj.hasOwnProperty(id)) {
        this2010Result = d2010Obj[id];
        thisCurrentResult = currentObj[id];
        if (thisCurrentResult === undefined) {
          // No 'current result' (ie, no byelection); so append seat record
          currentObj[id] = this2010Result;
        }
        else {
          // There was a by-election. Use that result, but append demographics
          currentObj[id].pop = this2010Result.pop;
          currentObj[id].hpr = this2010Result.hpr;
          currentObj[id].sal = this2010Result.sal;
        }

        // Either way: append each current result to the 'current data' array
        currentArray.push(currentObj[id]);
      }
    }
    // So, in theory, we have our existing results2010Obj and results2010Array,
    //    neither of which has changed
    // We also have currentObj and current, which I have to save to model.data
    // FOR THIS FIRST VERSION, I'M JUST SETTING THE CURRENT DATA TO 2010-RESULTS !!!
    model.data.results2010Obj = currentObj;
    model.data.results2010Array = currentArray;
  };


  // FILTER JSON
  // Filters a JSON file (in practice the literal map paths)
  filterJSON = function(datafile, key) {
    d3.json(datafile, storeInModel(key, json));
  };
  // FILTER JSON ends

  // Save JSON file in model
  storeInModel = function(key, json) {
    var dataObjName;
    // Save to model.data, unfiltered:
    dataObjName = key + "Obj";
    model.data[dataObjName] = json;
    return;
    // Trip datafile-specific flag:
    allReadyFlags[key] = true;
    // Now check all flags to see if we're ready to finish...
    if (allDataReady()) {
      // Callback 'filterDone' tells controller that all data has been filtered
      filterDone();
    }
  }

  my.getCacheString = function() {
    var istest, checkPts, now, str, hour, i, pt, result;
    // Test or live:
    // FOR NOW, AT LEAST, FORCE 'TEST' WITH RANDOM NUMBER...
    //istest = (model.sourcefiles.mid === "test");
    istest = true;
    if (istest) {
      return "&d=" + parseInt(Math.random()*100000);
    }
    // Still here? Use time:
    // Current time
    now = new Date(Date.now());
    // Init returned string:
    str = "&d=" + strings.shortMonths[now.getUTCMonth()] + "-";
    str += now.getUTCDate() + "-";
    // Array of times to check
    checkPts = model.checkpoints;
    // Now as "hh"
    hour = now.getUTCHours();
    result = 0; // by default
    // Loop through checkpoints and get latest
    for (i = 0; i < checkPts.length; i ++) {
      pt = checkPts[i];
      if (hour < pt) {
        break;
      }
      else {
        result = pt;
      }
    }
    return str + result;
  }


  // GO JSON
  goJson = function(filename, padding, addCacheString, correction) {
    var  jsonpStr, cacheStr, corr;
    cacheStr = "";
    if (correction !== undefined) {
      // Individual 2017 results may be 'corrections' (flagged in the global/basic result)
      // So for one-constit-result files, addCacheString is false and we look for a
      // correction value for the cache query...
      cacheStr = "&c=" + correction;
    }
    else if (addCacheString) {
      cacheStr = my.getCacheString();
    }
    jsonpStr = filename + '?callback=d3.jsonp.' + padding + cacheStr;
    // console.log(jsonpStr);
    d3.jsonp(jsonpStr, function() {});
  };
  // GO JSON ends


  // INIT
  // Calls functions to read in the various data files
  my.init = function() {
    var filename, clearCache, cb, key, widget;
    preloader.el = $('.ukelmap-map-div');
    preloader.addPreloader();

    // BREXIT RESULTS
    filename = model.sourcefiles.resultsBrexit;
    // Key for callback lookup is set by the file-specific callback (see top)
    cb = "resultsBrexitCB";
    // During devel, at least, I have to force a cache-clear
    clearCache = true;
    // Dive in after the data:
    goJson(filename, cb, clearCache);

    // 2010 RESULTS
    filename = model.sourcefiles.results2010;
    // Key for callback lookup is set by the file-specific callback (see top)
    cb = "results2010BasicCB";
    // During devel, at least, I have to force a cache-clear
    clearCache = true;
    // Dive in after the data:
    goJson(filename, cb, clearCache);

    // 2015 RESULTS
    filename = model.sourcefiles.results2015;
    // Key for callback lookup is set by the file-specific callback (see top)
    cb = "results2015BasicCB";
    // During devel, at least, I have to force a cache-clear
    clearCache = true;
    // Dive in after the data:
    goJson(filename, cb, clearCache);

    // Binding for callback
    widget = $('.mnv-map-uk-election-2017-election-night');
    widget.bind('dataProvide', function(data){
      // Update last update field
      var lastUpdate = (typeof lastUpdate === 'undefined') ? new MNVLastUpdate(this) : lastUpdate.update(this);
      swallow2017BasicData(data.detail);
      });

    // CONSTITUENCY LOOKUP
    // For constit names and schematic coordinates
    filename = model.sourcefiles.constituencylookupdata;
    cb = "constituencyLookupCB";
    clearCache = false;
    goJson(filename, cb, clearCache);

  };
  // INIT ends

  // SWALLOW 2017 BASIC DATA
  // Called from init, every time the service delivers a new set of 'global'
  // 2017 data
  function swallow2017BasicData(data) {
    var time, seats, winners, defaultTextObj = {};
    time = data.time;
    seats = data.seats;
    winners = data.winnersbyconstit;

    defaultTextObj.head = data.default_head;
    defaultTextObj.sub = data.default_sub;
    defaultTextObj.bod = data.default_text;
    // Put party seat counts and time of update on model
    model.results2017 = seats;
    model.flags.latestupdate = time;
    // And basic constit results (winner, correction)
    model.data.results2017Array = winners;
    var temp = {};
    for (var i in winners) {
      var id  = winners[i].id;
      temp[id] = winners[i];
    }
    model.data.results2017Obj = temp;

    // If this is the first load of the 2017 global results,
    // we want to kick the controller. But we can only do this once.
    // So check that it still needs to be done:
    if (!allDataReady()) {
      // And trip the flag (tells us we're ready to go on first load; redundant thereafter)
      allReadyFlags.results2017 = true;
      // NOW, if we're ready to go... GO!
      if (allDataReady()) { filterDone(); }
    }
    // Previous, if it ran,  has allowed other components to get ready
    // Now worry about the 2017 data.
    // After a short breath, advise the controller...
    setTimeout( function() {
      // Pass defaultTextObj. If !== undefined, controller will update the field...
      mnv_ukelmap.controller.new2017BasicDataListener(defaultTextObj);
    },500);
  }
  // SWALLOW 2017 BASIC DATA ends

  // UPDATE
  // If model has flagged a new requested constituency,
  // let's go looking for it...
  my.update = function() {
    var requestedconstit, dataindex, change;
    requestedconstit = modelflags.requestedconstit;
    dataindex = modelflags.dataindex;
    change = false;
    if (requestedconstit !== my.localflags.requestedconstit) {
      my.localflags.requestedconstit = requestedconstit;
      change = true;
    }
    if (dataindex !== my.localflags.dataindex) {
      my.localflags.dataindex = dataindex;
      change = true;
    }
    if (change) {
      // So requestedconstit is the id of the constit we want...
      findConstitData(requestedconstit);
    }
  };
  // UPDATE ends

  // FIND CONSTITUENCY DATA
  // The job of this function is to ensure that the data is available
  // then update the model's currentconstit flag so that other components
  // can respond
  function findConstitData(id) {
    var dataindex, check, filename, correction, modeldatacorrection;
    // If no constit to find...
    if (id === undefined) { return; }
    dataindex = modelflags.dataindex;
    if (dataindex === "sev") {
      // 2017: check if constit has declared yet,
      // by looking in global file
      if (!hasDeclared(id)) {
        mnv_ukelmap.controller.findConstitListener(id, false);
        return;
      }
    }
    // Still here? Whether it's 2010, 2015 or 2017, or whatever,
    // there "must" be a single-constit result.
    // Do we already have it in model.data?
    if (dataindex === "sev") {
      check = model.data.singleResults2017[id];
      // BUT...
      // ...we also have to check whether any existing 'stored' correction value
      // matches the latest received in the polled global file.
      // Get the constit's corr value from the global data file node:
      correction = model.data.results2017Obj[id].corr;
      // Check against any stored copy
      if (check !== undefined) {
        modeldatacorrection = check.corr;
        if (modeldatacorrection !== correction) {
          // Stored and 'new' correction values don't match
          // So we want to force the load of a new file by
          // pretending there's no stored data:
          check = undefined;
        }
      }
    }
    else if (dataindex === "fif") {
      check = model.data.singleResults2015[id];
    } else if (dataindex === 'ten') {
      check = model.data.singleResults2010[id];
    }
    else if (dataindex === 'brx') {
      // Brexit wants a 2015 constit result
      check = model.data.singleResults2015[id];
    }
    if (check !== undefined) {
        mnv_ukelmap.controller.findConstitListener(id, true);
        return;
    }
    // Still here? We don't have the data.
    // So load it and put it into model.data...
    // Construct a file name. For now, using "r" + year + "_" + id;
    // Temporary path
    filename = model.sourcefiles.singleconstitfolder;
    if (dataindex === "sev") {
      filename += "r2017";
      // NOTE: during local tests, override with local folder:
      // console.log('Inferentially pointing to local single-constituencies folder for 2017 results...')
      filename = model.sourcefiles.constitfolder2017 + 'r2017';
    } else if (dataindex === "fif") {
      filename += "r2015";
    } else if (dataindex === "ten") {
      filename += "r2010";
    } else {
      // Brexit uses 2015
      filename += "r2015";
    }
    filename += id + ".json";
    // Now jump out of the aeroplane to read it...
    // with correction value...
    my.fetchOneConstitData(filename, correction);
  }
  // FIND CONSTITUENCY DATA ends

 // HAS DECLARED
  // For 2017, checks the global object for the constit.
  // Returns true if it has apparently declared...
  function hasDeclared(id) {
    var results,
      hasDec = false;
    results = model.data.results2017Obj;
    if (results !== undefined) {
      if (results[id] !== undefined) {
        hasDec = true;
      }
    }
    return hasDec;
  }
  // HAS DECLARED ends



return my;
}());
// FILTER DATA ends
