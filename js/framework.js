/*
  Module is responsible for general wrapper
*/
"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

// FRAMEWORK constructor
// General framework. Draws the basic structure and populates
// title and other high-level divs with text.
mnv_ukelmap.framework = (function(){
  var my, model, controller, strings, frameworkResize, mnvWidget,
    mainWrapper, buildFramework, markVersion;
  my = {};
  controller = mnv_ukelmap.controller;
  model = mnv_ukelmap.model;
  strings = model.strings;

  // LOCAL FLAGS
  my.localflags = {
    visiblehead: false
  };
  // LOCAL FLAGS ends
  // Mark container with class for a specific version
  markVersion = function(version){
    mnvWidget
      .classed("version-small", false)
      .classed("version-big", false)
      .classed("version-" + version, true);
  };
  // Mark the viev constituency state
  my.viewConstituency = function(show){
    mnvWidget.classed("view-constituency", show);
    if (!show) { controller.resetButtonListener(); }
  };

  // Add and remove classes to the widget to mark a specific state
  // Used for example on tabs click
  my.markState = function(classesOption){
    if(typeof classesOption !== 'object'){
      return false;
    }
    mnvWidget.classed(classesOption);
  };

  my.isZoomed = function(zoom){
    mnvWidget.classed("zoom-on", zoom);
  };

  my.inViewKey = function(show){
    mnvWidget.classed("view-key", show);
  };
  // FRAMEWORK-RESIZE
  // Responds to window resize event watcher defined in init
  // Calls resize functions of the various elements...
  frameworkResize = function() {
    var componentlist, n, component, resize, version;

    if (controller.isSmallVersion()) {
      version = "small";
      // SMALL framework:
      componentlist = model.startchecks.small;
    }
    else {
      version = "big";
      // BIG framework
      componentlist = model.startchecks.big;
    }
    markVersion(version);
    // Loop through all components listed.
    // If component has a "resize" function, kick it--
    for (n in componentlist) {
      if (componentlist.hasOwnProperty(n)) {
        component = mnv_ukelmap[componentlist[n].name];
        if (typeof(component.resize) === "function") {
          component.resize();
        }
      }
    }
  };
  // FRAMEWORK-RESIZE ends


  // *** FRAMEWORK CONSTRUCTOR ***
  // One constructor for big or wmall, called from init, below

  buildFramework = function() {
    var subdivs = [], sliderDiv, footer;
    markVersion((controller.isSmallVersion())? 'small' : 'big');
    // Top-level
    // Title; dropdowns; big central div for key, map and (?) any chart; footer
    if(my.localflags.visiblehead){
      subdivs.push("ukelmap-header-div");
    }
    subdivs.push("ukelmap-topic-div","ukelmap-mainmap-div", "ukelmap-footer-div");
    mainWrapper.selectAll("div")
      .data(subdivs)
        .enter().append("div")
        .attr("class", function(d) { return d; })
    ;

    footer = d3.select(".ukelmap-footer-div");

    footer.append('span')
      .attr('class','last-update-label')
      .text('Results at: ')
    ;

    footer.append('span')
      .attr('class','last-update')
    ;

    var bString = "Results for Stoke-on-Trent Central; Copeland; Richmond Park; Witney; Batley and Seen; Tooting; Ogmore; Sheffield Brightside and Hillsborough; and Oldham West and Royton, are by-elections";
    bString = "*By-election result"
    footer.append('span')
      .attr('class','footnote-div')
      .text(bString)
    ;

    if(my.localflags.visiblehead){
      buildHeader();
    }

    // Populate mainmap div
    subdivs = ["ukelmap-tree", "ukelmap-map-div", "ukelmap-keys-div"];
    d3.select(".ukelmap-mainmap-div").selectAll("div")
      .data(subdivs)
        .enter().append("div")
        .attr("class", function(d) { return d; })
    ;

   // Populate tree div. Key is essential. Chart is
   // negotiable / may turn into an infobox or whatever...
    subdivs = ["ukelmap-treetext-top", "ukelmap-treechart", "ukelmap-treetext-bottom"];
    d3.select(".ukelmap-tree").selectAll("div")
      .data(subdivs)
        .enter().append("div")
        .attr("class", function(d) { return d; })
    ;
    // Append zoom bar
    appendMapBar.call(d3.select(".ukelmap-treetext-top"));
    appendConstituencyTemplate.call(d3.select(".ukelmap-treetext-top"));
    // Flag that framework is ready...
    controller.initOtherComponents();

  };
  // Build header
  function buildHeader(){
    // Populate title div: flash and project title
    var subdivs = [
      // {name:"redflash-div",string: ""},
      {name:"ukelmap-titlestring-div",string: strings.projecttitle}
    ];
    d3.select(".ukelmap-header-div").selectAll("div")
      .data(subdivs)
        .enter().append("div")
        .attr("class", function(d) { return d.name; })
        .html(function(d) {return d.string;})
    ;
  }

  // BUILD FRAMEWORK ends
  // Add MapBar
  function appendMapBar(){
    var toggleContainer = this.append("div")
      .attr("class", "toggler-container");

    // Append the container for the default (no constit selected) text
    my.defaultTextContainer = this.append("div")
      .attr("class", "default-text-container")
      //.text(strings.defaultText)
      ;
    my.defaultTextContainer.append("div")
      .attr("class", "default-header")
      .text(strings.defaultHeader);
    my.defaultTextContainer.append("div")
      .attr("class", "default-subheader")
      .text(strings.defaultSubHeader);
    my.defaultTextContainer.append("div")
      .attr("class", "default-body")
      .text(strings.defaultText);

    // Append Back to UK and Key button for small version
    var togglerViews = toggleContainer.append("div")
      .attr("class","toggle-views");

    var togglerButton = togglerViews.append("button")
      .attr("class","toggle-views-btn toggle-views-back-to-uk")
      ;

    togglerButton.on("click", function(){
        model.flags.currentconstit = undefined;
        d3.selectAll(".mappath-hover").remove();
        my.viewConstituency(false);
      });

    togglerButton
      .append("span")
      .attr("class","hide-on-small")
      .text("Reset");

    togglerButton.append("span")
      .attr("class","hide-on-big")
      .text("Back");

    togglerViews.append("button")
      .attr("class","toggle-views-btn toggle-views-key")
      .on("click", function(){
        my.inViewKey(true);
      })
      .text("Key");

    var toggler = toggleContainer.append("div")
      .attr("class","toggler")
      .on("click", mnv_ukelmap.map.toggleListener );

    toggler.append("div")
        .attr("id","map-toggler")
        .attr("class","tgl toggler-btn")
        ;

    var label = toggler.append("div")
        .attr("class","tgl-btn");

    label
      .append("div")
      .attr("class","map-schematic")
      .attr("datatooltip", "Map");

    label
      .append("div")
      .attr("class","map-linear")
      .attr("datatooltip", "Schematic");

  };
  // Add constituency data
  function appendConstituencyTemplate(){

    var constInfo = this.append("div").attr("class","constituency-info");

    // var togglerViews;
    // // Append Back to UK and Key button for small version
    // togglerViews = constInfo.append("div")
    //   .attr("class","toggle-views");

    // togglerViews.append("button")
    //   .attr("class","toggle-views-btn toggle-views-back-to-uk")
    //   .on("click", function(){
    //     my.viewConstituency(false);
    //   })
    //   .text("Back to UK");

    // togglerViews.append("button")
    //   .attr("class","toggle-views-btn toggle-views-key")
    //   .on("click", function(){
    //     my.inViewKey(true);
    //   })
    //   .text("Key");

    constInfo.append("div")
        .attr("class","region");

    constInfo.append("div")
        .attr("class","constituency");


    var party = constInfo.append("div")
        .attr("class","party");
    party.append("span").attr("class","party-name");
    party.append("span").attr("class","party-status");

    var mp = constInfo.append("div")
        .attr("class","mp");
    mp.append("span").attr("class","mp-name");
    mp.append("span").attr("class","mp-values");

    var majority = constInfo.append("div")
        .attr("class","majority");
    majority.append("span").attr("class","majority-label").text("Majority");
    majority.append("span").attr("class","majority-values");

    var swing = constInfo.append("div")
        .attr("class","swing");
    swing.append("span").attr("class","swing-label").text("Swing");
    swing.append("span").attr("class","swing-values");

    var turnout = constInfo.append("div")
        .attr("class","turnout");
    turnout.append("span").attr("class","turnout-label").text("turnout");
    turnout.append("span").attr("class","turnout-values");
  }

  // INIT
  // Appends a couple of divs to get responsive behaviour, then
  // just decides whether we're 'small' or 'big' and builds accordingly...
  my.init = function() {
    var resizeTimer;
    // Set the resize event watcher on the window:
    d3.select(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(frameworkResize, 100);
    });
    mnvWidget = d3.select(".mnv-map-uk-election-2017-election-night");
    // Double-wrapper structure is necessary for responsive height : width
    mainWrapper = mnvWidget.append("div")
      .attr("class","ukelmap-outer-wrapper")
        .append("div")
        .attr("class","ukelmap-main-wrapper")
    ;
    // Function to build further down the hierarchy...
    buildFramework();
  };
  // INIT ends

  // UPDATE
  // This would allow us to update the header with any headline values
  my.update = function() {
    var totals, headerString;
    return;
    totals = "";
    headerString = model.strings.title;
    headerString += totals;
    d3.select(".ukelmap-titlestring-div").html(headerString);
  };
  // UPDATE ends


  return my;
}());
// FRAMEWORK constructor ends
