"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

// MAP
mnv_ukelmap.map = (function(){
  var my, model, modelFlags, controller;
  // Internal 'globals'
  var mapWrapper, mapWidth, mapHeight, mapSVG, mapOcean, mapGroup, borderGroup, hoverGroup, surfaceRatio, mapRatio,
    projection, path, mapindex, dataindex, mapDetails, mapGroupSize, mapSource, searchField,
    zoomGroup, scaledBy, centerOnContainer, groundMapWrapper, widgetContainer, preloader;
  var centroids = {};
  var nodrag = false;
  // Functions
  var cloneMapPath, cloneBlob, d3clone, arc, pie, oceanMouseOver, mapDone,
    pathClickFcn, getPath, assembleBorder, zoom;
  my = {};
  model = mnv_ukelmap.model;
  modelFlags = model.flags;
  controller = mnv_ukelmap.controller;
  preloader = new Widget();

  // LOCAL FLAGS
  my.localflags = {
    mapindex: -1,
    dataindex: "dataindex",
    currentconstit: undefined,
    zoomconstit: "zoomconstit",
    // hexFlag denotes CURRENT state
    hexflag: true,
    canzoomout: false,
    literalmaploaded: false,
    updatecounter: -1,
    // switching is set to true while we're swapping literal/schematic
    // to prevent getting interrupted by recolour
    switching: false
  };
  // LOCAL FLAGS ends

  my.scaleStrokes = {
    1: {map: 1, hover: 2},
    2: {map: 0.5, hover: 1},
    4: {map: 0.25, hover: 0.5},
    10: {map: .1, hover: .2},
    25: {map: .1, hover: .2},
    50: {map: .1, hover: .2}
  }

  // Some temporary hard-coded flags:
  var myEase = "sin";
  // transition speed
  var mySpeed = 2000;
  var hexOrigin = {x:0,y:0};

  // ZOOM as called on mouse-wheel or drag
  zoom = function() {
    var transBy, mapStroke, borderStroke, hoverStroke, mapW, mapH, mapX, mapY;
    scaledBy = d3.event.scale;
    transBy = d3.event.translate;
    mapStroke = 1 / scaledBy + "px";
    hoverStroke = 2 / scaledBy + "px";
    borderStroke = 2 / scaledBy + "px";

    var se = d3.event.sourceEvent;

    mapGroup
      .attr("transform", "translate(" + transBy + ")scale(" + scaledBy + ")")
      .style("stroke-width",mapStroke)
      ;
    borderGroup
      .attr("transform", "translate(" + transBy + ")scale(" + scaledBy + ")")
      .style("stroke-width",borderStroke)
      ;
    hoverGroup
      .attr("transform", "translate(" + transBy + ")scale(" + scaledBy + ")")
      //.style("stroke-width",hoverStroke)
      ;
    d3.selectAll(".mappath-hover").style("stroke-width",hoverStroke);

  };
  // ZOOM ends


  // CLONE MAP PATH
  // Cannibalised from: http://stackoverflow.com/questions/18517376/d3-append-duplicates-of-a-selection
  cloneMapPath = function(pathID) {
    var id, p, sw;
    // Kill any existing highlight
    d3.selectAll(".mappath-hover").remove();
    // If no path has been selected, pathID is empty, so:
    if (pathID.length > 0) {
      // Map path
      id = "#" + pathID;
      p = d3clone(id, "mappath-hover");
      sw = (2 / scaledBy) + "px"
      d3.selectAll(".mappath-hover").style("stroke-width",sw).style('fill', 'none');
    }
  };
  // CLONE MAP PATH ends

  // D3 CLONE
  d3clone = function(selector, myClass) {
    var oNode, pNode, cNode;
    oNode = d3.select(selector).node();
    //console.log(oNode);
    pNode = hoverGroup.node();
    cNode = pNode.appendChild(oNode.cloneNode(true));
    pNode.childNodes[0].className.baseVal = myClass;
  };
  // D3 CLONE ends

  // PATH CLICK FCN
  // Called from path click
  pathClickFcn = function(id) {
    var data = model.data.results2010Obj;
    // If there's (2010) matching data, clone the DOM element
    if (data[id] !== undefined) {
      cloneMapPath(id);
    }
    // Remember rolled-over id
    model.flags.currentid = id;
    // Pass event to controller:
    controller.pathClickListener(id);
  };
  // PATH CLICK FCN

  // GET PATH
  getPath = function(d) {
    var id, path;
    id = d.id;
    if (my.localflags.hexflag) {
      // Hex refers to the constit lookup file
      path = oneHexPath(d.id, true);
    }
    else {
      // 'Raw' geographic path
      // path =  mapSource[d.id].d;
      path =  model.data.literalPathsObj[d.id].d;
    }
    return path;
  };

  // ASSEMBLE BORDER
  assembleBorder = function(bArray) {
    var x, y, bPath, thisB, allSegStr, allSegArray, points, oneSide;
    // bArray is array of objs with id and segments
    bPath = "";
    for (x = 0; x < bArray.length; x ++) {
      thisB = bArray[x];
      allSegStr = getPath(thisB);
      allSegStr = allSegStr.replace("M", "").replace("Z", "");
      // Split
      allSegArray = allSegStr.split("L");
      // Which segments of the hex path?
      points = thisB.points;
      for (y = 0; y < points.length; y ++) {
        if ((x === 0) && (y === 0)) {
          oneSide = "M";
        } else {
          oneSide = "L";
        }
        oneSide += allSegArray[points[y]];
        bPath += oneSide;
      }
    }
    // bPath += "z";
    return bPath;
  }
  // ASSEMBLE BORDER ends

  // Event dispatcher
  my.dispatch = d3.dispatch("load");

  // LOAD MAP
  // Loads a new map but doesn't colour it...
  my.loadMap = function() {
    var mapWidth, scale, rawData, path,
      constituencyLookupData;
    mapindex = modelFlags.mapindex;
    dataindex = modelFlags.dataindex;
    // Data is raw data
    // rawData = model.data.results2010Array;
    rawData = model.data.constituencyLookupArray;
    constituencyLookupData = model.data.constituencyLookupObj;

    // Get hex flag
    if (my.localflags.hexflag) {
      // For hex coords:
      mapSource = model.data.constituencyLookupObj;
    }
    else {
      // Literal path
      mapSource = model.data.literalPathsObj;
    }

    // OK: haul in the data...
    // Bind data. Note that this isn't the path.
    // It currently defines only an ID; although
    // it may subsequently acquire other properties,
    // including result values and a winner-colour
    // (which'd have to be set in datafilter...)
    path = mapGroup.selectAll("path")
      .data(rawData)
    ;

    // Enter:
    path.enter().append("path")
      .attr("class","mappath")
      .style("fill",function(d) {
        var fill = "#fff";
        return fill;
      })
      .attr("id", function(d) {
        return d.id;
      })
      // And set event handler for click
      .on("click", function(d) {
        //if(!controller.isSmallVersion()){
          var id = d.id;
          pathClickFcn(id);
        //}
      })
      ;

    // Update:
    path
      // Default path:
      .attr("d", function(d) {
        return(getPath(d));
      })
    ;

    // Exit:
    path.exit().remove();

    // Borders:
    var scotData = model.scotData;
    var scotPath = assembleBorder(scotData);
    borderGroup.append("path")
      .attr("class","map-border")
      .attr("d", scotPath)
      .style("stroke-linecap", "square")
      ;
    var walesData = model.walesData;
    var walesPath = assembleBorder(walesData);
    borderGroup.append("path")
      .attr("class","map-border")
      .attr("d", walesPath)
      .style("stroke-linecap", "square")
      ;
    var lonData = model.lonData;
    var lonPath = assembleBorder(lonData);
    lonPath += "Z";
    borderGroup.append("path")
      .attr("class","map-border")
      .attr("d", lonPath)
      .style("stroke-linecap", "butt")
      ;

    // Size of map groups:
    mapGroupSize = mapGroup.node().getBBox();
    // Apply centering of an element into its container
    centerOnContainer.call(groundMapWrapper, mapWrapper);
    my.dispatch.load();
  };
  // LOAD MAP ends

  centerOnContainer = function(container){
    var innerElSizes = this.node().getBoundingClientRect(), x, containerWidth;
    containerWidth = parseInt(container.style("width"),10) - parseInt(container.style("padding-right"),10) - parseInt(container.style("padding-left"),10);
    x = (containerWidth - innerElSizes.width)/2;
    if (my.localflags.hexflag) { x /= 10; }
    this.attr('transform', 'translate(' + x + ', 0)');
  };

   // UPDATE
  // Compares local flags with the model
  // If there are any relevant differences, call loadMap to
  // draw a map.
  // And update local flags to match model
  my.update = function() {
    var modelflags, mapI, dataI, currentconstit, zoomconstit, mapchanged,
      datachanged, updatecounter;
    modelflags = model.flags;
    mapI = modelflags.mapindex;
    dataI = modelflags.dataindex;
    currentconstit = modelflags.currentconstit;
    zoomconstit = modelflags.zoomconstit;
    updatecounter = modelflags.updatecounter;
    // 2 flags:
    mapchanged = false;
    datachanged = false;
    // Has basic live data reloaded? 2017 map only...
    // ...and not if we're in mid-switch literal/schematic
    if (my.localflags.updatecounter !== updatecounter) {
      if ( (dataI === "sev") && !my.localflags.switching ) {
        my.localflags.updatecounter = updatecounter;
        datachanged = true;
      }
    }
    // Map index:
    if (my.localflags.mapindex !== mapI) {
      my.localflags.mapindex = mapI;
      mapchanged = true;
    }
    // Data index:
    if (my.localflags.dataindex !== dataI) {
      my.localflags.dataindex = dataI;
      datachanged = true;
    }
    if (mapchanged) { my.loadMap(); }
    if (datachanged) {
      my.colourMap(dataI);
    }
    // Zoom
    if (my.localflags.zoomconstit !== zoomconstit) {
      my.localflags.zoomconstit = zoomconstit;
      if (zoomconstit !== undefined) {
        my.zoomToConstit(zoomconstit);
      }
      else {
        if (my.localflags.canzoomout) {
          my.zoomToDefault();
        }
      }
    }
  };

  // UPDATE ends


  // INIT
  // Absolute basic foundations for maps. Creates:
  //    map svg object,
  //    ocean rect,
  //    map-group (to contain paths)
  //    hover-group (for highlights)
  // Then tells controller we're ready for whatever comes next...
  my.init = function() {
    var vbSize;
    // Existing wrapper
    mapWrapper = d3.select('.ukelmap-map-div');
    widgetContainer = d3.select('.mnv-map-uk-election-2017-election-night');
    (my.localflags.hexflag) ? widgetContainer.classed("map-hex", true) : widgetContainer.classed("map-uk", true);
    mapWrapper.classed("")
    appendSearchField.call(mapWrapper);
    mapWidth = parseInt(mapWrapper.style("width"),10);
    mapHeight = parseInt(mapWrapper.style("height"),10);
    scaledBy = 1;

    // Tweak hexOrigin for map size...
    if (controller.isSmallVersion) {
      hexOrigin.x = 40;
      hexOrigin.y = 0;
    }
    else {
      hexOrigin.x = 0;
      hexOrigin.y = 0;
    }

    // Remember ratio in a module-global (for resize, see below):
    surfaceRatio = mapWidth/mapHeight; // Actual w/h of map container
    mapRatio = 0.6666;                 // map artwork w/h

    if (mapRatio > surfaceRatio) {
      // If artwork is disproportionately wide
      vbSize = mapWidth;
      // mnv_ukelmap.utilities.log("Went with width of " + vbSize);
      if (vbSize < 310) {
        vbSize = 310;
        // mnv_ukelmap.utilities.log("Tweaked to " + vbSize + " to squeeze!");
      }
    }
    else {
      vbSize = mapHeight * mapRatio;
      //mnv_ukelmap.utilities.log("Went with height of " + vbSize);
    }


    // SVG arenas
    mapSVG = mapWrapper.append("svg")
      //.attr("width", mapWidth)
      //.attr("height", mapHeight)
      .attr("width", "100%")
      .attr("height", "100%")
      //.attr("transform","scale(" + scaledBy + ")")


      //.attr('viewBox', '0 0 ' + Math.min(mapWidth, mapHeight) + ' ' + Math.min(mapWidth, mapHeight))
      //.attr('viewBox', '0 0 ' + mapWidth*1 + ' ' + mapHeight*2)
      .attr('viewBox', '0 0 ' + vbSize + ' ' + vbSize)
      .attr('preserveAspectRatio','xMinYMin')
      ;

    // zoomGroup = mapSVG.append("g")
    //   .call(d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoom))
    //   ;

    // Ocean
    mapOcean = mapSVG.append("rect")
      .attr('id','ocean')
      .attr("class", "ocean")
      .attr("width", mapWidth)
      .attr("height", mapHeight)
      .on("click", function(){
        d3.selectAll(".mappath-hover").remove();
        // Pass event to controller
        controller.oceanClickListener();
        mnv_ukelmap.framework.viewConstituency( false );
      })
      ;
    groundMapWrapper  = mapSVG.append("g")
      .attr('id','mapgroundwrapper')
      ;
    // SVG group
    mapGroup = groundMapWrapper.append("g")
      .attr('id','mapgroup')
      ;
    // Borders
    borderGroup = groundMapWrapper.append("g")
      .attr('id','bordergroup')
      ;
    // Hover group: on mouseover, the cloned, outlined
    // path is created in this group
    hoverGroup = groundMapWrapper.append("g")
      .attr('id','hovergroup')
      ;

    // Call for zoom (last, but doesn't have to be):
    // mapSVG
    //   .call(d3.behavior.zoom()
    //   .scaleExtent([1, 10])
    //   .on("zoom", zoom))
    //   ;
    // mapSVG
    //   //.call(d3.behavior.zoom()
    //   //.scaleExtent([1, 10])
    //   .on("mousedown.zoom",null)
    //   .on("mousedown.drag", null)
    //   .on("touchstart.drag",null)
    //   .on("touchmove.drag",null)
    //   .on("touchend.drag",null)
    // ;


    // Crude append of toggle button:
    //appendToggleButton();

    // Flag that framework is ready...
    controller.startchecks('map');

  };
  // INIT ends
  // Add Livesearch field
  function appendSearchField(){
    var searchField = this.append("div");
    searchField.attr("data-mnv","ecLiveSearch");
    searchField.attr("class","mnv-ec-livesearch");
    // Listener for data loaded event
    my.dispatch.on("load", my.initSearchField );
    // Add listeners to the widget related function
    searchField[0][0].addEventListener('resultSelected', function(e){
      var detail = e.detail;
      //console.log(d3.select(".view-constituency"));
      mnv_ukelmap.framework.viewConstituency(true);
      // Pass constituency id to controller:
      controller.liveSearchSelectionListener(detail.id);
    });
    // Append Key button for smal version
    this.append("button")
      .attr("class","toggle-views-btn toggle-views-key")
      .on("click", function(){
        mnv_ukelmap.framework.inViewKey(true);
      })
      .text("See all parties");
    /*
    searchField[0][0].addEventListener('fieldReset', function(e){
      var detail = e.detail;
      console.log(detail)
      return;
      mnv_ukelmap.framework.viewConstituency(false);
      // Pass constituency id (or undefined) to controller:
      controller.liveSearchSelectionListener(undefined);
    });
    */

  }
  // Init searchField
  my.initSearchField = function initSearchField(){
    var  config, liveSearchCmp;
    config = {
      // list: mnv_ukelmap.model.data.results2010Array,
      // searchProperty: "constituency_name",
      list: mnv_ukelmap.model.data.constituencyLookupArray,
      searchProperty: "name",
      hideOnLeave: true,
      placeholder: "Search by constituency"
    };
    // Create the liveSearch obj
    liveSearchCmp = new ecLiveSearch(config);
  }

  // APPEND TOGGLE BUTTON
  function appendToggleButton() {
    mapWrapper.append("div")
      .attr("class","toggle-div")
      .append("input")
        .attr("class","toggle-input")
        .attr("name","toggleButton")
        .attr("type","button")
        .on("click", toggleListener() )
        .attr("value", function() {
          var s;
          if (my.localflags.hexflag) {
            s = "Literal";
          }
          else {
            s = "Schematic";
          }
          return s;
        });
  }
  // APPEND TOGGLE BUTTON ends

  // LOAD LITERAL PATHS
  // is called from toggleListener, below, if there are no literal paths in model.data
  // Calls function in datafilter (ouch! but these are desperate times!!) to do the dirty work.
  // Callback from datafilter will call toggleListener again, with the flag
  function loadLiteralPaths() {
    // To prevent silliness, disable the toggle button
    d3.select(".toggler").style({
      "opacity":0.3,
      "pointer-events":"none"
      });
    // Show preloader:
    preloader.el = $('.ukelmap-map-div');
    preloader.addPreloader();
    // And call the datafilter for the data:
    mnv_ukelmap.datafilter.loadLiteralData();
  }
  // LOAD LITERAL PATHS

  // TOGGLE LISTENER is called by button click to toggle map style (literal/symbolic)
  my.toggleListener= function(flg) {
    if (flg === 'mobile') {
      drawHexPaths();
      my.localflags.hexflag = true;
      borderGroup.style("opacity", 1);
    }
    else {
      // Set flag to DESIRED STATE (!current)
      var flag = !my.localflags.hexflag;

      // Show/hide border paths
      if (flag) {
        setTimeout(function(){
          borderGroup.style("opacity", 1);
        },2000);
      } else {
        borderGroup.style("opacity", 0);
      }

      // Kill any existing highlight
      d3.selectAll(".mappath-hover").remove();
      if (flag) {
        // So desired state is hex
        drawHexPaths();
      }
      else {
        // Desired state is literal
        // But do we have literal data?
        if (model.data.literalPathsObj === undefined) {
          // If not, we go off and load them. A callback
          // drops us back here, when the object should exist...
          loadLiteralPaths();
          return;
        }
        else {
          // There are literal paths in the model, so use them...
          drawLiteralPaths();
        }
      }
      // Toggle flag
      my.localflags.hexflag = flag;
    }
  }
  // TOGGLE LISTENER ends

  // DRAW BORDERS
  function drawBorders() {

  }
  // DRAW BORDERS ends

  function drawHexPaths() {
    var data, i, id;
    data = model.data.constituencyLookupArray;
    my.localflags.switching = true;
    for (i = 0; i < data.length; i++) {
      id = data[i].id;
      oneHexPath(id, i);
    }
    widgetContainer
      .classed("map-hex", true)
      .classed("map-uk", false)
      ;

  }

  function drawLiteralPaths() {
    var data, i, id;
    data = model.data.constituencyLookupArray;
    my.localflags.switching = true;
    for (i = 0; i < data.length; i++) {
      id = data[i].id;
      oneLiteralPath(id, i);
    }
    widgetContainer
      .classed("map-hex", false)
      .classed("map-uk", true)
      ;
    // If this was first load, put everything right...
    if (!my.localflags.literalmaploaded) {
      // Reset toggler and remove preloader
      // (with timeout to match path transition time...)
      setTimeout(function(){
        d3.select(".toggler").style({
          "opacity":1,
          "pointer-events":"auto"
          });
        preloader.removePreloader();
          }, 2000);
      my.localflags.literalmaploaded = true;
    }
  }


  // MAP COLOURING FUNCTIONS
  // colourMap is called from update. According to dataIndex, forks to:
  //    simpleColour
  //    brexitColour
  // Each returns a fill value for a single path

  // SIMPLE COLOUR
  // Gets winning party's id from the data and looks up
  // its colour on the model
  function simpleColour(data) {
    var winner, party;
    winner = data.w;
    party = model.parties[winner];
    if (party !== undefined) {
      return party.colour;
    }
  }
  // SIMPLE COLOUR ends

  // BREXIT COLOUR
  // Arg is an object with props 'id' and 'val'
  function brexitColour(data) {
    var dIndex, remain, col, rangesArray, i;
    dIndex = model.flags.dataindex;
    remain = data.val;
    // By default:
    col = "#eeeeee";
    rangesArray = model.keys[dIndex].bigranges;
    for (i = 0; i < rangesArray.length; i ++) {
      if (data.val < rangesArray[i].val) {
        col = rangesArray[i].fill;
        break;
      }
    }
    return col;

    // var dIndex, id, val, rangesArray, i, col;
    // dIndex = model.flags.dataindex;
    // // Lookup string for this topic
    // id = my.localflags.dataindex;
    // // Get the value. If there isn't one, set to default:
    // val = data[id];
    // if (isNaN(val)) {
    //   return col;
    // }
    // else {
    //   // Still here? Look up in the ranges array for demographics
    //   rangesArray = model.keys[dIndex].bigranges;
    //   for (i = 0; i < rangesArray.length; i ++) {
    //     if (val < rangesArray[i].val) {
    //       //r = i;
    //       break;
    //     }
    //   }
    //   return rangesArray[i].fill;
    // }

  }
  // BREXIT COLOUR ends


  // COLOUR MAP
  // Handles colouring
  // Dataset index param is passed in, but not used...
  // For now, I'm hard-coded to filtered data
  my.colourMap = function(dIndex) {
    var data;
    if (dIndex === "sev") {
      data = model.data.results2017Obj;
    } else if (dIndex === "fif") {
      data = model.data.results2015Obj;
    } else if (dIndex === "ten") {
      data = model.data.results2010Obj;
    } else {
      data = model.data.resultsBrexitObj;
    }
    // console.log(data);
    // d3 loop through existing state paths setting colours:
    d3.selectAll('.mappath')
      .transition().duration(500)
      .style("fill",function(d){
        var id, luObj, fill;
        // Path id ("id" on actual DOM element; not "id");
        id = this.id;
        luObj = data[id];
        // Default fill:
        //fill = "#aaaaaa";
        fill = model.colours.undeclared;
        if (luObj !== undefined) {
          switch (dIndex) {
            case "sev":
              fill = simpleColour(luObj);
              break;
            case "fif":
              fill = simpleColour(luObj);
              break;
            case "ten":
              fill = simpleColour(luObj);
              break;
            case "brx":
              fill = brexitColour(luObj);
              break;
            default:
              fill = simpleColour(luObj);
          }
        }
        return fill;
      })

    ;

  };
  // COLOUR MAP ends

  // *** HEX PATH FUNCTIONS ***


    // GET HEX POINTS
    // Called from redraw. Passed the row and column for
    // the hexagon, returns its six points as an array of
    // x/y coordinates
    var getHexPoints = function(c) {
      var hexArray, _s32, a, x, y, xFactor, yFactor, factor;
      // Relative to group:
      // uses hard-coded known row and col counts
     // if (mapGroupSize === undefined) {
     //   console.log("undefined")
        xFactor = mapWidth / 54;
        yFactor = mapHeight / 85;
        factor = Math.min(xFactor,yFactor);
      //}
      //else {
      //  console.log("defined")
        //xFactor = mapGroupSize.width / 54;
        //yFactor = mapGroupSize.height / 85;
      //   xFactor = mapGroupSize.width / 60;
      //   yFactor = mapGroupSize.height / 95;
      //   factor = Math.min(xFactor,yFactor);
      //   factor *= 2;
      // }

      // Tweak hex sizes for map size...
      if (controller.isSmallVersion) {
          factor *= 1.3;
      }
      else {
          factor *= 1.5;
      }

      hexArray = [];
      _s32 = (Math.sqrt(3)/2); // to draw hexagon
      a = factor/1.666; // size of each hexagon

      // x-centre-origin, with extra tweak to close up slightly
      //x = (c.x * factor*0.95) + hexOrigin.x;
      x = (c.x * factor*0.9) + hexOrigin.x;
      // y-centre-origin
      y = (c.y * factor*1.02) + hexOrigin.y;
      // y = mapGroupSize.height - y;
      // Even columns drop:
      if (c.x%2 === 0) { y -= factor/2; }
      // 6 points:
      hexArray[0] = (a+x) + "," + (0+y);
      hexArray[1] = (a/2+x) + "," + (a*_s32+y);
      hexArray[2] = (-a/2+x) + "," + (a*_s32+y);
      hexArray[3] = (-a+x) + "," + (0+y);
      hexArray[4] = (-a/2+x) + "," + (-a*_s32+y);
      hexArray[5] = (a/2+x) + "," + (-a*_s32+y);
      return hexArray;
    };
    // GET HEX POINTS ends


    // ONE HEX PATH
    // Called from drawHexPaths with id string as param.
    // Isolates the path and converts to a hexagon
    function oneHexPath(pid, counter) {
      var myPath, pArray, mainPath, longI, thisLen, i, j, bbox, c,
        hexPointArray, hexPathArray, sixthLen, ptNo, hexStr, aLen, pathD, hc,
        bbx, centArray;
      myPath = d3.select("#" + pid);
      // 1) MAIN PATH
      // Grab the path's "d" attribute. This may be a compound path,
      // so initally split into subpaths:
      pathD = myPath.attr("d");
      if (pathD === null) {
        // Get a centre point
        hc = {};
        hc.x = mapSource[pid].col;
        hc.y = mapSource[pid].row;
        // Prepare six points:
        hexPointArray = getHexPoints(hc);
        // Now I've got to re-stringify
        hexStr = "M" + hexPointArray.join("L") + "Z";

        // Botch centroids
        centArray = hexPointArray[0].split(",")
        centroids[pid] = {
          x: parseInt(centArray[0])-5,
          y: parseInt(centArray[1])
        }
      }
      else {
        // Path exists...
        pArray = pathD.split("M");
        // Now loop through subpaths and get index of longest
        longI = 0;
        thisLen = 0;
        for (i = 0; i < pArray.length; i ++) {
          if (pArray[i].length > thisLen) {
            thisLen = pArray[i].length;
            longI = i;
          }
        }
        // Isolate the longest path string
        mainPath = pArray[longI];
        // Redraw each element as main path only:
        myPath.transition().duration(mySpeed/2).attr("d","M" + mainPath);

        // MAYBE I could set a timeout here, just to allow the simplified path to
        // visually establish itself before we proceed to hex conversion...

        // 2) POINTS
        // Next array is by points in the main path:
        // Delete "Z" closure from path and split on "L"
        mainPath = mainPath.replace("Z","");
        pArray = mainPath.split("L");
        // Count points:
        aLen = pArray.length;

        // Centre point of main path:
        bbx = myPath.node().getBBox();
        c = {};
        c.x = bbx.x + (bbx.width/2);
        c.y = bbx.y + (bbx.height/2);
        // Reserve literal centres for later reset:
        centroids[pid] = {
          x: c.x, y: c.y
        }
        // Now reset centre point to desired hex centroid:
        hc = {};
        hc.x = model.data.constituencyLookupObj[pid].col;
        hc.y = model.data.constituencyLookupObj[pid].row;

        // Prepare six points:
        hexPointArray = getHexPoints(hc);
        // And an empty array for the reset path:
        hexPathArray = [];

        // Get a sixth of the length of the path
        sixthLen = Math.floor(aLen / 6);
        for (var j = 0; j < 6; j++) {
          for (i = 0; i < sixthLen; i ++) {
            ptNo = (j * sixthLen) + i;
            hexPathArray[ptNo] = hexPointArray[j];
          }
        }
        // console.log(pid + " has " + hexPathArray.length + " points");

        // Now I've got to re-stringify
        hexStr = "M" + hexPathArray.join("L") + "Z";

      }
      // And redraw
      myPath
        .transition().duration(mySpeed).attr("d",hexStr)
        ;
      if (counter === 649) {
        setTimeout( function() {
          my.localflags.switching = false;
          // And force any hover back
          redisplayHover();
        },mySpeed)
      }
      return hexStr;
    }
    // ONE HEX PATH ends

    function oneLiteralPath(pid, counter) {
      var path, litStr, hexStr, bbx, hexC, litC, transX, transY, pArray, onePt, pA, pStr, transStr, i;
      // Path object
      path = d3.select("#" + pid);
      // Literal string to which we'll transform...
      litStr = model.data.literalPathsObj[pid].d;
      //litStr = mapSource[pid].d;

      // First, move the hexagon
      // Hex centre point:
      bbx = path.node().getBBox();
      hexC = {};
      hexC.x = bbx.x + (bbx.width/2);
      hexC.y = bbx.y + (bbx.height/2);
      // And desired location (reserved in global)
      litC = centroids[pid];
      transX = litC.x - hexC.x;
      transY = litC.y - hexC.y;
      // Reset all points to move the hexagon into place
      // (this minimises the "jagged speech bubble" effect)
      // Break up the path and "transform" each x/y coord:
      pArray = path.attr("d").replace("M","").replace("Z","").split("L");
      for (i = 0; i < pArray.length; i ++) {
        onePt = pArray[i];
        pA = onePt.split(",");
        pA[0] = parseFloat(pA[0]) + transX;
        pA[1] = parseFloat(pA[1]) + transY;
        // Put back:
        pArray[i] = pA.join(",");
      }
      // Complete path for hexagon in changed location
      pStr = "M" + pArray.join(" L") + " Z";

      // Move the hexagon, then reset to literal path:
      path
        // Move
        .transition().duration(mySpeed/2).ease(myEase)
          .attr("d",pStr)
          // Move ends
          //
          // Redraw as literal
          // If I comment out next 4 lines, there's no literal transition
          .transition().duration(mySpeed/2).ease(myEase)
          .attr("d",function() {
            return litStr;
          })
          // Literal redraw ends
        ;
      // Reset flag to allow basic data update to recolour
    if (counter === 649) {
      setTimeout( function() {
        my.localflags.switching = false;
        // force any hover back
        redisplayHover();
      },mySpeed)
    }
  }

  // REDISPLAY HOVER
  // Called from oneSchematic/LiteralPath upon completion of
  // final redraw. Checks the current constit flag on the model
  // and clones the matching path
  function redisplayHover() {
    var constit;
    constit = model.flags.currentconstit;
    if (constit !== undefined) {
      cloneMapPath(constit);
      my.localflags.currentconstit = constit;
    }
  }
  // REDISPLAY HOVER

  // *** ZOOMING ***

  // ZOOM TO DEFAULT
  my.zoomToDefault = function() {
    var transStr, mapStroke, hoverStroke;
    scaledBy = 1;
    transStr = "translate(0,0)scale(" + scaledBy + ")";
    mapStroke = "1px";
    mapGroup
      .transition().duration(2000)
      .attr("transform", transStr)
      ;
    borderGroup
      .transition().duration(2000)
      .attr("transform", transStr)
      ;
    hoverGroup
      .transition().duration(2000)
      .attr("transform", transStr)
      ;
    // Stroke widths:
    d3.selectAll(".mappath").transition().duration(2500).style("stroke-width",mapStroke);
    d3.selectAll(".mappath-hover").remove();

    my.localflags.canzoomout = false;

    pathClickFcn();
    d3.select('#map-toggler')
      .attr('disabled', null);
    mnv_ukelmap.framework.isZoomed( false );
  }
  // ZOOM TO DEFAULT ends

  // ZOOM TO CONSTIT
  my.zoomToConstit = function(id) {
    var mapW, mapH, zoomPath, bbox, x1, x2, y1, y2,
      transX, transY, transStr, mapStroke, hoverStroke;
    if(controller.isSmallVersion()){
      return ;
    }
    // SCALE
    scaledBy = 5;
    // POSITION
    // Map container centre
    mapW = parseInt(mapSVG.style("width"));
    mapH = parseInt(mapSVG.style("height"));
    // Zoom target coords
    zoomPath = d3.select("#" + id);
    // bbox is an object with properties: x, y, width, height.
    // I need a centre point
    bbox = zoomPath.node().getBBox();
    x1 = bbox.x;
    y1 = bbox.y;
    x2 = x1 + bbox.width;
    y2 = y1 + bbox.height;

    scaledBy = .5 / Math.max ( ((x2 - x1) / mapW), ((y2 - y1) / mapH) );
    if (my.localflags.hexflag) {
      if (scaledBy > 10) {scaledBy = 10};
    }
    else {
      if (scaledBy > 25) {scaledBy = 25};
    }
    transX = ( mapW - scaledBy * (x1 + x2) ) / 2;
    transY = ( mapH - scaledBy * (y1 + y2) ) / 2;
    transStr = "translate(" + transX + "," + transY + ")scale(" + scaledBy + ")";

    // Scaling for strokewidth uses values hard-pulled from CSS
    mapStroke = 1 / scaledBy + "px";
    hoverStroke = 3 / (scaledBy) + "px";

    mapGroup
      .transition().duration(2000)
      .attr("transform", transStr)
      ;
    borderGroup
      .transition().duration(2000)
      .attr("transform", transStr)
      ;
    hoverGroup
      .transition().duration(2000)
      .attr("transform", transStr)

      ;
    // Stroke widths:
    d3.selectAll(".mappath").transition().duration(2000).style("stroke-width",mapStroke);
    d3.selectAll(".mappath-hover").transition().duration(2000).style("stroke-width",hoverStroke);
    // Highlight and pass on...
    pathClickFcn(id);
    my.localflags.canzoomout = true;
    d3.select('#map-toggler')
      .attr('disabled','disabled');
    mnv_ukelmap.framework.isZoomed( true );

  };
  // ZOOM TO CONSTIT ends

return my;
}());
// MAP ends
