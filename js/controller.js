"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

// CONTROLLER
mnv_ukelmap.controller = (function(){
  var my, model, modelFlags, strings, componentsList, kickoff, updateAllComponents;
    // updateLineChart, updateChartHeaders, updateOnePollBarChart,
    // updateContributionsBarChart, updateBios, upda   teInfobox, updateSource, componentsList,
    // updateAllComponents, modelFlags;
  my = {};
  model = mnv_ukelmap.model;
  modelFlags = model.flags;
  strings = model.strings;


  // KICK-OFF is called once all components have completed their init processes
  // If a component is set to 'kickoff:true' in the startchecks,
  // its update method is called automatically at startup...
  kickoff = function() {
    var flags, mapIndex, dataIndex, c, item, component;
    mapIndex = modelFlags.mapindex;
    dataIndex = modelFlags.dataindex;
    // Which components we auto-update depends upon kickoff flags in list of components
    // Now loop through componentsList. If any is false, return...
    for (c in componentsList) {
      if (componentsList.hasOwnProperty(c)) {
        item = componentsList[c];
        if (item.kickoff) {
          //console.log("Kicking off " + item.name);
          component = mnv_ukelmap[item.name];
          component.update();
        }
      }
    }
    // This setTimeout gives us a breather, then sets up things that
    // otherwise get trampled by other juggling during initial load
    setTimeout(function(){
      // Hack for small devices only forces modile schematic view
      // once everyone's settled in their seats...
      // if (window.innerWidth < model.windowThreshold.threshold) {
      //   mnv_ukelmap.map.toggleListener('mobile');
      // }
      // Ditto for the 'kill' button on the livesearch field
      d3.select('.mnv-ec-livesearch').select("button")
      .on('click', function(){
         mnv_ukelmap.framework.viewConstituency(false);
          // Pass constituency id (or undefined) to controller:
          mnv_ukelmap.controller.liveSearchSelectionListener(undefined);
        });
    }, 500);
  };
  // KICK-OFF ends

  // UPDATE ALL COMPONENTS
  // Called by almost all event catchers. Calls update method
  // of all components listed (big/small)
  updateAllComponents = function() {
    // componentsList is a global
    var c, item, component;
    for (c in componentsList) {
      if (componentsList.hasOwnProperty(c)) {
        item = componentsList[c];
        if (item.update) {
          //console.log("Updating item " + item.name);
          component = mnv_ukelmap[item.name];
          component.update();
        }
      }
    }
  };
  // UPDATE ALL COMPONENTS ends



  // EVENT LISTENERS
  // ---------------
  // DROPDOWN LISTENER
  // Receives dataset index
  my.dropdownListener = function(ddIndex) {
    // Look up id for that tab, and pass to flags
    modelFlags.dataindex = model.tabs[ddIndex].id;
    // And to ensure any active constit is available, set request flag...
    model.flags.requestedconstit = model.flags.currentconstit;
    // ...and set current constit off until we get a data response
    model.flags.currentconstit = undefined;
    // Mark state of the widget
    // Create D3 classed config obj
    // { 'className': true/false }
    var classesConf = {}, i = 0;
    for (var prop in model.tabs) {
      classesConf['tabs-' + model.tabs[i].id] = (i===ddIndex);
      i++;
    }
    mnv_ukelmap.framework.markState(classesConf);
    updateAllComponents();
  };
  // KEY LISTENER
  my.keyListener = function(kID) {
    // console.log("Party id: " + kID);
  };
  // MAP: ocean and paths
  my.oceanRolloverListener = function() {
    // console.log("Ocean rollover heard by controller");
  };
  my.oceanClickListener = function() {
    model.flags.requestedconstit = undefined;
    model.flags.currentconstit = undefined;
    updateAllComponents();
  };
  my.pathClickListener = function(pID) {
    model.flags.requestedconstit = pID;
    updateAllComponents();
  };
  // TREE MAP
  my.treeMapRolloverListener = function(pID) {
    // console.log("Rolled over tree map: " + pID);
  };
  // LIVE SEARCH
  my.liveSearchSelectionListener = function(id) {
    //model.flags.currentconstit = id;
    model.flags.requestedconstit = id;
    model.flags.zoomconstit = id;
    updateAllComponents();
  };
  my.resetButtonListener = function() {
    model.flags.requestedconstit = undefined;
    model.flags.zoomconstit = undefined;
    model.flags.currentconstit = undefined;
    updateAllComponents();
  }
  // Passed back after the datafilter has looked for a single constit
  my.findConstitListener = function(id, available) {
    // console.log("Constit " + id + ": availability -- " + available);
    model.flags.currentconstit = id;
    model.flags.constitavailable = available;
    updateAllComponents();
  }
  // Tripped after datafilter has polled new live data
  my.new2017BasicDataListener = function(strObj) {
    var head, sub, bod;
    head = strObj.head;
    sub = strObj.sub;
    bod = strObj.bod;
    // There's a counter...
    model.flags.updatecounter ++;
    updateAllComponents();
    // And the default text strings can be passed in...
    if (head !== undefined) {
      // Update now and store for future reference...
      d3.select(".default-header")
        .text(head);
      strings.defaultHead = head;
    }
    if (sub !== undefined) {
      // Update now and store for future reference...
      d3.select(".default-subheader")
        .text(sub);
      strings.defaultsub = sub;
    }
    if (bod !== undefined) {
      // Update now and store for future reference...
      d3.select(".default-body")
        .text(bod);
      strings.defaultText = bod;
    }
  }

  // GET WIDGET SIZE
  // Called from initFramework (this component, below)
  // Are we bigger or smaller than the threshold?
  function getWidgetSize() {
    model.windowThreshold.small = my.isSmallVersion();
    if (model.windowThreshold.small) {
      // componentsList is a global, since
      // my.initOtherComponents and my.startchecks also refer to it:
      componentsList = model.startchecks.small;
    }
    else {
      componentsList = model.startchecks.big;
    }
  }
  // GET WIDGET SIZE ends

  // IS SMALL VERSION
  my.isSmallVersion = function() {
    var size, threshold;
    threshold = model.windowThreshold.threshold;
    size = parseInt(d3.select(".mnv-map-uk-election-2017-election-night").style("width"),10);
    return  size <= threshold;
  }
  // IS SMALL VERSION ends

  // INIT FRAMEWORK
  // Called from init.js on document.ready
  // Housekeeping: widget size; "today"...
  // Assembles the list of active components (as defined in model.startchecks),
  // then init function in each...
  my.initFramework = function() {
    var now, today;
    // Define "today" as zero hours today (midday?)
    now = new Date(Date.now());
    today = now.getUTCDate() + " " + strings.shortMonths[now.getUTCMonth()] + " " + now.getUTCFullYear();
    today += " 00:00:00";
    today = Date.parse(today);
    // Slap into the model:
    model.data.today = today;

    // How big are we today?
    getWidgetSize();

    // Force the framework: all foundations must be in place before
    // other components can build on top:
    mnv_ukelmap.framework.init();
  };
  // INIT FRAMEWORK ends


  // INIT OTHER COMPONENTS
  // Called from framework when it has built the foundations
  // for other components
  my.initOtherComponents = function() {
    var n, item, component;
    // Loop through startchecks, running init on each component:
    for (n in componentsList) {
      /*
      // To debug initialisation, set string to component name
      if (n === 'keys') {
        console.log(n);
      }
      */
      if (componentsList.hasOwnProperty(n)) {
        item = componentsList[n];
        component = mnv_ukelmap[item.name];
        if (typeof component === "object") {
          component.init();
        }
      }
    }
  };
  // INIT OTHER COMPONENTS ends

  // START CHECKS is called by the INIT method of each component to verify that
  // all foundations are in place...
  my.startchecks = function(component) {
    var c, check;
    // First, set property matching calling component to true:
    // (passed by to model by reference)
    componentsList[component].ready = true;
    // Now loop through componentsList. If any is false, return...
    for (c in componentsList) {
      if (componentsList.hasOwnProperty(c)) {
        check = componentsList[c].ready;
        if (!check) {
          //console.log("Component " + component + " is ready... but we're not ready overall...");
          return;
        }
      }
    }
    // Still here? All components are ready, so...
    //console.log("All components initialised. Kicking off...")
    kickoff();
  };

  return my;
}());
// CONTROLLER ends
