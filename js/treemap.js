"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

/*
Bostock's tremap is at:
https://strongriley.github.io/d3/ex/treemap.html
*/

// TREE MAP
mnv_ukelmap.treemap = (function(){
  var my, model, modelFlags, controller, parties, numberformat;
  // Internal 'globals'
  var tree, treeWrapper, treeWidth, treeHeight,
    treeMap, treeMapDiv, colChartDiv, colChartSVG, colChartGroup,
    colChartxScale, colChartyScale, position, node, cluster,
    svgH, svgW, xAxis, yAxis, xAxisEl, zeroline;
  // Constituency info globals
  var constInfo, region, constituency, party, partyname, partystatus,
    mpname, mpvalues, majoritylabel, majorityvalues, swinglabel,
    swingvalues, turnoutlabel, turnoutvalues;
  my = {};
  model = mnv_ukelmap.model;
  modelFlags = model.flags;
  controller = mnv_ukelmap.controller;
  parties = model.parties;
  numberformat = mnv_ukelmap.utilities.numberWithCommas;


  /*
  Code-cribbing...
    See: https://gist.github.com/alexandersimoes/7516456#file-tree_map_ex1-html
    And: http://d3plus.org/workshops/11_19_2013/tree_map/
  */

  // LOCAL FLAGS
  my.localflags = {
    currentconstit: "currentconstit",
    dataindex: "dataindex",
    updatecounter: -1
  };
  // LOCAL FLAGS ends

  // Dynamic code will have to mimic this structure
  /*tree = {
    id: "tree",
    children:[
      {"value":70, "id":"oth"},
      {"value":50, "id":"grn"},
      {"value":120, "id":"ukp"},
      {"value":40, "id":"lib"},
      {"value":220, "id":"lab"},
      {"value":250, "id":"con"}
      ]
  };*/

  // POSITION
  // Code to size and position nodes:
  position = function() {
    this
      .style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return d.dx - 1 + "px"; })
      .style("height", function(d) { return d.dy - 1 + "px"; })
    ;
  };

  // ASSIGN CONSTITUENCY DOM ELEMENTS
  // Called from init: just ties elements to display constituency
  // info to internal globals, for easy reference...
  // All these elements were appended to the DOM in framework > appendConstituencyTemplate
  function assignConstituencyDOMelements() {
    constInfo = d3.select(".constituency-info");
    region = d3.select(".region");
    constituency = d3.select(".constituency");
    party = d3.select(".party");
    partyname = d3.select(".party-name");
    partystatus = d3.select(".party-status");
    mpname = d3.select(".mp-name");
    mpvalues = d3.select(".mp-values");
    majoritylabel = d3.select(".majority-label");
    majorityvalues = d3.select(".majority-values");
    swinglabel = d3.select(".swing-label");
    swingvalues = d3.select(".swing-values");
    turnoutlabel = d3.select(".turnout-label");
    turnoutvalues = d3.select(".turnout-values");
  }
  // ASSIGN CONSTITUENCY DOM ELEMENTS ends

  // INIT
  my.init = function() {
    var sizes, p, temp;

    // Assign internal globals to constit info elements
    assignConstituencyDOMelements();

    // Existing wrapper
    treeWrapper = d3.select('.ukelmap-treechart');
    // treeWidth = parseInt(treeWrapper.style("width"),10);
    // treeHeight = parseInt(treeWrapper.style("height"),10);
    sizes = mnv_ukelmap.utilities.recursiveParentSizeSearch(treeWrapper.node(),4);
    if (sizes !== undefined) {
      treeWidth = sizes.width;
      treeHeight = sizes.height;
    }
    else {
      treeWidth = 250;
      treeHeight = 300;
    }

    tree = {
      children: []
    }
    for (p in parties) {
      if (parties.hasOwnProperty(p)) {
        temp = {};
        temp.id = p;
        temp.value = 0;
        tree.children.push(temp);
      }
    }

    // var treemap = d3.treemap()
    //     .tile(d3.treemapSquarify.ratio(1))
    //     .size([width / ratio, height]);


    // Layout
    treeMap = d3.layout.treemap()
      .size([treeWidth,treeHeight])
      // Must be false to get update to work":"
      .sticky(false)
      // Sorts to drop from top-left to bottom-right
      // Comment out to sort the other way:
      .sort(function(a,b) {
          return a.id - b.id;
      })
      .value(function(d) {
        return d.value; })
      ;

    treeMapDiv = treeWrapper.append("div")
      .attr("class", "ukelmap-treemap-div")
    ;
    // And the column chart container
    colChartDiv = treeWrapper.append("div")
      .attr("class", "ukelmap-colchart-div")
    ;

    initColChart(colChartDiv);

    // Flag that framework is ready...
    controller.startchecks('treemap');
  };
  // INIT ends

  // RESIZE
  // Just reruns update with current id...
  my.resize = function() {
    var id, dataindex, dataObj, thisdata, results;
    id = my.localflags.currentconstit;
    dataindex = my.localflags.dataindex;
    if (dataindex === "sev") {
      // dataObj is from the external data file
      dataObj = model.data.singleResults2017;
      // results is a 'basic' results object in the model
      results = model.results2017;
    } else if (dataindex === "fif") {
      dataObj = model.data.singleResults2015;
      results = model.results2015;
    } else if (dataindex === "ten") {
      dataObj = model.data.singleResults2010;
      results = model.results2010;
    } else {
      dataObj = model.data.resultsBrexitObj;
      results = model.resultsBrexit;
    }
    // If we launched on a small device, this will error.
    // Obvz there's a proper fix, but for now... kludge.
    if (typeof dataObj === 'undefined') {
      return;
    }
    if (typeof id === 'undefined') {
      // Seats count
        thisdata = results;
    }
    else {
      // One result
      thisdata = dataObj[id];
    }
    // Update with the data object, the 'key', and a constit id (if any)
    updateTreeMap(thisdata, dataindex, id);
    // updateConstitInfo(data);
  };
  // RESIZE ends

  // UPDATE
  my.update = function() {
    var currentconstit, constitavailable, changed, data, dataindex, defaultText,
      updatecounter;
    constitavailable = modelFlags.constitavailable;
    currentconstit = modelFlags.currentconstit;
    dataindex = modelFlags.dataindex; // i.e. index of current tab
    updatecounter = modelFlags.updatecounter;
    // When the datafilter responds to the map's request to find data for 1 constit
    // (either loaded from file, or available in model.data)...
    // If there IS a constit id (ie we're not looking for a national seat count),
    // and if the datafilter set the not-available flag, bale out now.
    if ( (currentconstit !== undefined) &&
         (!constitavailable) ) {
      showUndeclared(currentconstit);
      return;
    }

    // Still here? OK...
    d3.select(".ukelmap-treechart")
      .transition().duration(500)
      .style("opacity", 1);

    // So if we're still here, there's an available constit to process
    changed = false;
    if (  (my.localflags.currentconstit !== currentconstit) ||
          (my.localflags.dataindex !== dataindex) ||
          (my.localflags.updatecounter !== updatecounter) ) {
      changed = true;
    }
    //
    if (changed) {
      if (currentconstit !== undefined) {
        if (dataindex === "sev") {
          data = model.data.singleResults2017[currentconstit];
          // Update treemap for new constit
          updateTreeMap(data, dataindex, currentconstit);
          // Update constit details
          updateConstitInfo(data, dataindex, currentconstit);
        } else if (dataindex === "fif") {
          data = model.data.singleResults2015[currentconstit];
          // Update treemap for new constit
          updateTreeMap(data, dataindex, currentconstit);
          // Update constit details
          updateConstitInfo(data, dataindex, currentconstit);
        } else if (dataindex === "ten") {
          data = model.data.singleResults2010[currentconstit];
          // Update treemap for new constit
          updateTreeMap(data, dataindex, currentconstit);
          // Update constit details
          updateConstitInfo(data, dataindex, currentconstit);
        }
        else {
          // Brexit
          data = model.data.resultsBrexitObj[currentconstit];
          // Update treemap for new constit
          updateTreeMap(data, dataindex, currentconstit);
          // Update constit details, using 2015 result...
          updateConstitInfo(model.data.singleResults2015[currentconstit], dataindex, currentconstit);
        }
        mnv_ukelmap.framework.viewConstituency( true );
        d3.select(".ukelmap-treetext-bottom").text("")
      }
      else {
        // currentconstit === undefined, so we're
        if (dataindex === "sev") {
          data = model.results2017;
        } else if (dataindex === "fif") {
          data = model.results2015;
        } else if (dataindex === "ten") {
          data = model.results2010;
        } else {
          data = model.resultsBrexit;
        }
        // "Seats": update tree map only
        // (CSS shows default text)
        updateTreeMap(data, dataindex);
        if (dataindex === "brx") {
          d3.select(".ukelmap-treetext-bottom").text("National result");
          defaultText = model.strings.brexitText;
        }
        else {
          d3.select(".ukelmap-treetext-bottom").text("UK total");
          defaultText = model.strings.defaultText;
        }
      }
      // Set the explanatory text
      d3.select(".default-body").html(defaultText);

      my.localflags.currentconstit = currentconstit;
      my.localflags.dataindex = dataindex;
      my.localflags.updatecounter = updatecounter;
    }
    // if changed ends
  };
  // UPDATE ends

  function makeTreeDataObj(data, key) {
    var conID, children, p, val, temp, lookup, total;
    lookup = model.data.constituencyLookupObj[data.id];
    tree = {
      id: data.id,
      //name: data.constituency_name,
      // name: lookup.name,
      name: function() {
        if (!lookup === undefined) { return lookup.name; }
      },
      children:[]
    };
    // Loop thro parties defined in model
    total = 0;
    for (p in parties) {
      if (parties.hasOwnProperty(p)) {
        val = parseInt(data[p]);
        if (!isNaN(val)) {
          temp = {};
          temp.id = p;
          temp.value = val;
          total += val;
          tree.children.push(temp);
        }
      }
    }
    // 2017 general: append 'undeclared'
    if ( (modelFlags.dataindex === "sev") &&
       (modelFlags.currentconstit === undefined) ) {
      temp = {};
      temp.id = "undeclared";
      temp.value = 650 - total;
      tree.children.push(temp);
    }
    return tree;
  }

  // UPDATE BREXIT TREEMAP
  // Called from my.update
  function updateB_exitTreeMap(data) {
    var sizes, tree, kids, kLen, maj, turnout, hpercent, wpercent;
    alert('Called updateB_exitTreeMap');
    if (data === undefined) { return; }

    wpercent = parseInt(treeWrapper.style("width"),10);
    hpercent = parseInt(treeWrapper.style("height"),10);
    sizes = mnv_ukelmap.utilities.recursiveParentSizeSearch(treeWrapper.node(),2);
    if (sizes !== undefined) {
      treeWidth = sizes.width - 20;
      treeHeight = sizes.height / 3;
    }
    else {
      treeWidth = 350;
      treeHeight = 185;
    }

    treeMap.size([treeWidth,treeHeight]);

    // Convert to treemap-compatible data object
    // Incoming 'data' is an object with a single property:
    // remain vote, as 'val'
    // I want an object with a 'children' property > remain/leave
    tree = {
      children: {
        remain: data.val,
        leave: 100 - data.val
      }
    }

  }
  // UPDATE BREXIT TREEMAP ENDS

  // UPDATE TREEMAP
  function updateTreeMap(data, key, constitID) {
    var sizes, tree, kids, kLen, maj, turnout, hpercent, wpercent, mapTree, majorityTree, itemisedData;

    if (data === undefined) { return; }

    wpercent = parseInt(treeWrapper.style("width"),10);
    hpercent = parseInt(treeWrapper.style("height"),10);
    sizes = mnv_ukelmap.utilities.recursiveParentSizeSearch(treeWrapper.node(),2);
    if (sizes !== undefined) {
      treeWidth = sizes.width - 20;
      treeHeight = sizes.height / 3;
    }
    else {
      treeWidth = 350;
      treeHeight = 185;
    }

    treeMap.size([treeWidth,treeHeight]);

    // Force vertical stack on treemap for Brexit
    var tMode = "squarify";
    if (key === 'brx') {
      tMode = "dice";
    }
    treeMap.mode(tMode)

    // Convert to treemap-compatible data object
    if (key === "brx") {
      var remainVal = data.val.toFixed(1);
      var leaveVal = (100 - remainVal).toFixed(1);
      mapTree = {
        children: [
          {id: 'remain', value: remainVal},
          {id: 'leave', value: leaveVal}
        ]
      };
      // And fetch in 2015 data
      if (typeof constitID === 'undefined') {
        itemisedData = model.results2015;
      } else {
        itemisedData = model.data.singleResults2015[constitID];
      }
    } else {
      itemisedData = data;
    }
    majorityTree = makeTreeDataObj(itemisedData, key)

    // This is a bit cheeky, but...
    // tree.children is an array of party votes only
    // So sort and use it to fill the majority span:
    kids = majorityTree.children.sort(function(a,b) {
      return a.value - b.value;
      });
    kLen = kids.length - 1;
    if (kLen > 0) {
      maj = kids[kLen].value - kids[kLen-1].value;
    }
    else {
      // Only one result!!!
      maj = kids[0].value;
    }
    maj = numberformat(maj);
    majorityvalues.text(maj);

    // Overall turnout, from original data obj:
    turnout = itemisedData.turnout;

    // Kill current content:
    d3.selectAll(".ukelmap-treemap-node").remove();

    // Now switch around to get the right data for the actual treeMap
    if (key !== 'brx') {
      mapTree = majorityTree;
    }

    // employees.sort(function(a, b){
    //     var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
    //     if (nameA < nameB) //sort string ascending
    //         return -1
    //     if (nameA > nameB)
    //         return 1
    //     return 0 //default return value (no sorting)
    // })

    // Sorting...
    // Brexit forced "Leave", "Remain". Comm'd out May '17,
    // to preserve orientation
    // Others sort by value.
    treeMap.sort(function(a,b) {
      if (key === 'brx') {
        if (a.id < b.id) { return -1 }
        if (a.id > b.id) { return 1 }
        return 0;
      } else {
        return a.value - b.value;
      }
    });

    // Bind data
    node = treeMapDiv.datum(mapTree).selectAll(".node")
      .data(treeMap.nodes)
    ;

    // Enter
    node.enter().append("div")
      .attr("class", "ukelmap-treemap-node")
    ;
    // Update
    node
      //.data(treeMap.nodes)
      // .transition().duration(500)
      .call(position)
      .style("background-color", function(d, i) {
        var col;
        // Node 0 is the background, so white:
        if (i === 0) {
          col = "#ffffff";
        }
        else {
          // Defined colour?
          col = model.colours[d.id];
          // if (d.id === "undeclared") {
          //   col = model.colours.undeclared;
          // } else if (d.id === "remain") {
          //   col = model.colours.undeclared;
          // }
          if (typeof col === 'undefined') {
            col = parties[d.id].colour;
          }
        }
        return col;
      })
      .attr("datatooltip", function(d, i){
        var result;
        if (d.id === "undeclared") {
            result = "Undeclared: " + d.value + " seats";
        }
        else if (d.id === 'remain') {
          result = "Remain: " + d.value + "%";
        } else if (d.id === 'leave') {
          result = "Leave: " + d.value + "%";
        }
        else if (i > 0) {
          if (turnout !== undefined) {
            result = model.parties[d.id].midname + ": " + (d.value / turnout * 100).toFixed(1) + "%";
          }
          else {
            result = model.parties[d.id].midname + ": " + d.value + " seats";
          }
        } else {
          result = '';
        }
        return result;
      })
      .text(function(d, i) {
        var result;
        if (i > 0) {
          if ( (d.dx > 40) && (d.dy > 20) ) {
            if (d.id === 'remain') {
              result = "Remain: " + d.value + "%";
            } else if (d.id === 'leave') {
              result = "Leave: " + d.value + "%";
            } else if (turnout !== undefined) {
              result = (d.value / turnout * 100).toFixed(1) + "%";
            }
            else {
              result = d.value + " seats";
            }
          }
        }
        return result;
      })
      ;
    // Update on text sub-div
    // (separated to isolate from the transition on the node div)
    /*
    node
      .append('div')
      .attr("class")
      .style("font-size", function(d) {
          // compute font size based on sqrt(area)
          //return Math.max(20, 0.18*Math.sqrt(d.area))+'px'; })
          return Math.max(15, 0.1*Math.sqrt(d.area))+'px'; })
      .text(function(d) {
        var id, pName, partyTurnout;
        partyTurnout = d.value / turnout * 100;
        //id = d.id;
        pName = null; // by default
        // If node has no children (ie is a party value)
        if (!d.children) {
          // pName = parties[id].shortname;
          return partyTurnout.toFixed(1) + "%";
        }
        //return pName;
      })
      */
    ;

    // Exit
    node
      .exit()
      .attr("test", function() {
      })
      .remove();
  }
  // UPDATE TREEMAP ENDS

  // UPDATE CONSTIT INFO
  // Displays constituency details
  function updateConstitInfo(data, key) {
    var id, winner, winStr, winCol, statusStr, mpVotes, vPercent, tuStr,
      swingLab, swingVal;

    if (data === undefined) { return; }

    // Are we on Brexit tab?
    var isBrexit =  (modelFlags.dataindex === "brx");

    // Do any workings...
    winStr = parties[data.win].midname;
    winCol = parties[data.win].colour;
    // Status (gain/hold); if undefined, blank
    statusStr = data.status;
    if (statusStr === undefined) {
      statusStr = ""
    }
    // Winner's votes and % of votes
    mpVotes = data[data.win];
    vPercent = mpVotes / data.turnout * 100;
    mpVotes = numberformat(mpVotes);
    mpVotes += " (" + vPercent.toFixed(1) + "%)";
    // Swing
    swingLab = "Swing";
    swingVal = data.swing;
    if (swingVal === undefined) {
      swingLab = "";
      swingVal = "";
    }
    else {
      swingVal += "%";
    }

    // Brexit overrides:
    var displayStr = 'block';
    if (isBrexit) {
      displayStr = 'none';
      // 2 strings just go empty:
      statusStr = "";
      mpVotes = "";
    }
    // Show/hide other divs
    var divList = ['.majority', '.swing', '.turnout'];
    d3.selectAll(divList)
      .each(function(d) {
        d3.select(this)
          .style('display', displayStr);
      });

    // Turnout as number and % of population
    tuStr = numberformat(data.turnout);
    tuStr += " (" + (data.turnout / data.electorate * 100).toFixed(1) + "%)";
    // Now slam everything into the elements:
    region.text(data.region);
    //constituency.text(data.constituency_name);
    var cName = model.data.constituencyLookupObj[data.id].name;
    if (typeof data.byelection !== "undefined") {
        cName += "*";
    }
    constituency.text(cName);
    partyname
      .text(winStr)
      .style("color",winCol)
      ;
    // partystatus.text(statusStr);
    // NOTE: until we know what we're doing with 2017 data, this string
    // (which is welded into 2015 data) foreced to empty
    partystatus.text('');
    mpname
      .text(data.mpn)
      .style("color",winCol);
    mpvalues.text(mpVotes);
    majoritylabel.text("Majority");
    swinglabel.text(swingLab);
    swingvalues.text(swingVal);
    turnoutlabel.text("Turnout");
    turnoutvalues.text(tuStr);
    // NOTE: majority is done by updateTreemap, where we have a sort...

  }
  // UPDATE CONSTIT INFO ends


  // SHOW UNDECLARED
  // Hide treemap and show undeclared details
  function showUndeclared(id) {
    d3.select(".ukelmap-treechart")
      .transition().duration(500)
      .style("opacity", 0);
    mnv_ukelmap.framework.viewConstituency(true);
    d3.select(".ukelmap-treetext-bottom").text("");
    region.text("Not declared");
    constituency.text(model.data.constituencyLookupObj[id].name);
    partyname.text("");
    partystatus.text("");
    mpname.text("");
    mpvalues.text("");
    majoritylabel.text("");
    majorityvalues.text("");
    swinglabel.text("");
    swingvalues.text("");
    turnoutlabel.text("");
    turnoutvalues.text("");
    // Kludge forces local flag off, so that on a tab change my.update
    // registers the incoming constit id as a change...
    my.localflags.currentconstit = undefined;
  }

  // ************ Below is specific to the demographics column chart ***************

  // DRAW COL CHART
  // Param is data array for this constit. 2 elements with
  // display and value properties
  function drawColChart(data) {
    var topicID, demographics, enter, min, max, needUpdateYAxis, valOffset = 5,
      getY, noVal = false;

    // On the mobile version, the colChart doesn't get initted (because
    // containing wrappers have no size). In that case, we've returned from
    // initColChart before the svg element colChartSVG was created.
    // So abort if it doesn't exist:
    if (colChartSVG === undefined) { return; }

    // Update axis if topic is changed
    needUpdateYAxis = (topicID!==model.flags.dataindex);

    topicID = model.flags.dataindex;
    demographics = model.demographics[topicID];

    // DOMAINS
    colChartxScale
      .domain(data.map(function(d) {
        return d.display;
      }))
      ;
    min = demographics.min;
    max = demographics.max;
    colChartyScale
      .domain([min,max])
      ;

    cluster = colChartGroup.selectAll(".cluster")
      .data(data);

    getY = function(d) { return d.value < 0 ? colChartyScale(0) : colChartyScale(d.value); };

    cluster.each(function(d, i) {
      var it, val, label, col;
      var _d = d;
      var _i = i;
      it = d3.select(this);
      // Rect
      col = it.selectAll("rect")
        .transition().duration(750)
        .attr({
          //"x": my.col_x(_d,_i),
          "x": function(_d) {
            return my.col_x(_d); },
          "width": function() { return colChartxScale.rangeBand(); },
          "y": function(d, i) { return getY(_d); },
          "height": function(d, i) { return Math.abs( colChartyScale(_d.value) - colChartyScale(0) ); }
        })
        .style("fill", function(){
          return my.col_fill(_d, _i);
          })
        ;

      // Value
      val = it.selectAll(".ukel-val-text")
        .transition().duration(750)
        .attr({
          // "x": my.col_x(_d,_i),
          "x": function(d) { return my.col_x(d)},
          "y": function() { return getY(_d) - valOffset}
        })
        .text(d.valStr)
        ;
      // Category
      label = it.selectAll(".ukel-cat-text-p")
        .text(function() { return d.display; });

    });

    // Enter
    enter = cluster.enter().append("g")
      .attr("class","cluster")
      ;

    // THERE'S SOME REDUNDANCY HERE: I CAN DO A LOT OF WHAT THE ENTER DOES IN THE UPDATE, ABOVE...
    var colWidth = function() { return colChartxScale.rangeBand(); };

    // Rect
    enter.append("rect")
      .attr({
        "class": "col-rect",
        // X pos and width:
        "x": function(d) {
          return my.col_x(d)},
        "width": colWidth(),
        "y": function(d, i) {
          return getY(d); },
        "height": function(d, i) { return Math.abs( colChartyScale(d.value) - colChartyScale(0) ); }
      })
      .style("fill", function(d, i){
        return my.col_fill(d, i);
      })
    ;

    // Category string
    var colsI = 0;
    enter.append("foreignObject")
      .attr({
        //"y": function(d, i) { return getY(d) - labelOffset; },
        "y": svgH + 5,
        "x": function(d){
          //var x = colsI *  (my.col_x()*2 + colWidth());
          // var x = colsI *  (colChartxScale(d.display)*2 + colWidth());
          // colsI++;
          // return x;
          return my.col_x(d);
        },
        "dy": ".15em",
        "height": 100,
        // Width is a bit of a hack to force alignment:
        "width": colWidth() * 0.9,
        "class": function(d, i){
          return "ukel-cat-text ukel-cat-" + ((i===0) ? "cons" : "nat");
        }})
        .append("xhtml:body")
        .attr("xmlns","http://www.w3.org/1999/xhtml")
        .append("div")
        .append("p")
        .attr("class","ukel-cat-text-p")
        .text(function(d){
          return d.display;
        });
        // .attr("class", "ukel-cat-text-div")
        // .text(function(d) { return d.display; })

    // Value text:
    enter.append("text")
      .attr({
        "y": function(d, i) { return getY(d) - valOffset; },
        "x": my.text_x,
        "dy": ".15em",
        "class": function(d, i){
          return "ukel-val-text ukel-val-" + ((i===0) ? "cons" : "nat");
          }
        })
        .text(function(d) { return d.valStr; })
        /*
        .text(function(d) {
          var s;
          if (d.display.length > 0) {
            s = d3.round(d.value, nrOfDecimal);
          }
          else {
            s = "";
          }
          return s;
        })
        */
        ;

    if(needUpdateYAxis){
      // Update Y axis
      colChartSVG
        .transition()
        .select(".y-axis") // change the y axis
              .duration(750)
              .call(yAxis);
      // ...snd zero line
      zeroline
        .transition().duration(750)
        .attr('x1', 0)
        .attr('y1', colChartyScale(0))
        .attr('x2', svgW)
        .attr('y2', colChartyScale(0));
    }
    // // Not that it should be needed...
    // cluster.exit()
    //   .style("opacity", 1)
    //   .transition()
    //     .duration(300)
    //     .style("opacity", 0)
    //     .remove()
    //   ;
  }

  // INIT COL CHART
  // Param is wrapper
  function initColChart(wrapper) {
    var margin, sizes;
    // Set our margins
    margin = {
      top: 10,
      right: 0,
      bottom: 80,
      left: 30
    }

    // Try to detect w and h from the wrapper
    sizes = wrapper.node().getBoundingClientRect();
    if(sizes.width!==0 && sizes.width){
     svgH = sizes.height;
     svgW = sizes.width;
    }
    else {
      // Try to detect sizes from parent element
      sizes = mnv_ukelmap.utilities.recursiveParentSizeSearch(wrapper.node());
      // Set default width
      //if(!sizes){
      if(sizes !== undefined){
        svgH = 300;
        svgW = 250;
      }
    }
    svgW = svgW - margin.left - margin.right,
    svgH = svgH - margin.top - margin.bottom;
    colChartSVG = wrapper.append("svg")
      .attr("width", svgW + margin.left + margin.right)
      .attr("height", svgH + margin.top + margin.bottom)
      ;

    colChartGroup = colChartSVG
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    colChartxScale = d3.scale.ordinal()
      .rangeBands([0,svgW], 0.2, 0)
      ;

    colChartyScale = d3.scale.linear()
      .range([svgH,0])
      ;

    yAxis = d3.svg.axis()
      .scale(colChartyScale)
      .orient("left")
      .ticks(5)
      .tickSize(-svgW,0)
      ;

    colChartGroup.append("g")
      .attr("class","y-axis")
      .call(yAxis);

    // Zero line
    zeroline = colChartGroup
      .append('line')
      .attr('x1', 0)
      .attr('y1', colChartyScale(0))
      .attr('x2', svgW)
      .attr('y2', colChartyScale(0))
      .attr("class","zero-line")
      .style("stroke-width",1)
      ;
  }
  // INIT COL CHART ends

  // Column chart functions:
  // x-pos of columns
  my.col_x = function(d, i) {
    var it = colChartxScale(d.display);
    return colChartxScale(d.display);
  };
  // TEXT_X returns text x-pos
  my.text_x = function(d, i) { return colChartxScale(d.display); };
  my.cluster_w = function(d, i) {
    //colChartxScale(i)
    return  colChartxScale.rangeBand();
  }
  // Height and fill functions
  my.col_height = function(d) {
    //return colChartyScale(+d.value) - colChartyScale(0);
    return svgH - colChartyScale(+d.value);
  };
  my.col_fill = function(d, i){
    var sel = (i === 0) ? "cons" : "nat";
    return model.demographics[model.flags.dataindex].fill[sel];
  }

  return my;
}());
// TREE MAP ends
