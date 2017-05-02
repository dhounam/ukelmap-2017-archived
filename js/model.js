"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

// CONTROLLER
mnv_ukelmap.model = (function(){
  var my, windoeThreshold, flags;

  my = {};

  // WINDOW THRESHOLD
  //    threshold is value in px below which we draw 'small'
  //    small is reset to true if width < threshold
  //    Initially, I'm setting threshold implausibly small, so that the flag is never tripped...
  my.windowThreshold = {
    threshold: 595,
    small: false
  };

  // FLAGS
  // flags is an object defining all properties that
  // the various components need to know...
  // (For components to 'update' at startup, local flags must be set to different default values)
  my.flags = {
    requestedconstit: undefined,
    currentconstit: undefined,
    constitavailable: false,
    dataindex: "sev",
    datapointindex: 0,
    freezechart: false,
    mapindex: 0,
    showinstructions: true,
    hexflag: true,
    zoomconstit: undefined,
    latestupdate: undefined,
    updatecounter: 0
  };

  // COLOURS
  my.colours = {
    map: {
      default: '#DDDDDD'
    },
    undeclared: '#aaa'
  };

  // DATA repository (filled by datafilter)
  my.data = {
    singleResults2010:{},
    singleResults2015:{},
    singleResults2017:{}
  };

  // KEYS
  // For election, only one element in the array (map never shifts from 0?)
  my.keys = {
    // 2017:
    "sev": {
      compare: "EQUAL",
      // LAYOUT sets key layout: number of rows and columns
      layout: {rows:5, columns:3},
      bigranges: [
        {id:'con'},
        {id:'lab'},
        {id:'lib'},
        {id:'dup'},
        {id:'snp'},
        {id:'snf'},
        {id:'ind'},
        {id:'plc'},
        {id:'sdl'},
        {id:'ukp'},
        {id:'grn'},
        {id:'res'},
        {id:'uup'},
        {id:'bnp'},
        {id:'oth'}
      ],
      smallranges: null,
      keyTitle: "Seats"
    },
    // 2015:
    "fif": {
      compare: "EQUAL",
      // LAYOUT sets key layout: number of rows and columns
      layout: {rows:5, columns:3},
      bigranges: [
        {id:'con'},
        {id:'lab'},
        {id:'lib'},
        {id:'dup'},
        {id:'snp'},
        {id:'snf'},
        {id:'ind'},
        {id:'plc'},
        {id:'sdl'},
        {id:'ukp'},
        {id:'grn'},
        {id:'res'},
        {id:'uup'},
        {id:'bnp'},
        {id:'oth'}
      ],
      smallranges: null,
      keyTitle: "Seats"
    },
    // 2010:
    "ten":{
      compare: "EQUAL",
      // LAYOUT sets key layout: number of rows and columns
      layout: {rows:5, columns:3},
      bigranges: [
        {id:'con'},
        {id:'lab'},
        {id:'lib'},
        {id:'dup'},
        {id:'snp'},
        {id:'snf'},
        {id:'ind'},
        {id:'plc'},
        {id:'sdl'},
        {id:'ukp'},
        {id:'grn'},
        {id:'res'},
        {id:'uup'},
        {id:'bnp'},
        {id:'oth'}
      ],
      smallranges: null,
      keyTitle: "Seats"
    }
    // NOTE: demographics removed
    // Population
    // Population % change in 2s from less than -2 to more than +10 (eight plots)
    // (the full range for pop. goes from -3.9 to +12.2)
    // "pop":{
    //   compare: "LESS-EQUAL",
    //   // LAYOUT sets key layout: number of rows and columns
    //   layout: {rows:5, columns:3},
    //   bigranges: [
    //     {val:-2,fill:"#39bcd9",display:"Less than -2"},
    //     //{val:-2,fill:"#a2d8e7",display:"-3 to -2"},
    //     {val:0,fill:"#69c5dc",display:"-2 to 0"},
    //     // {val:0,fill:"#3abcda",display:"-1 to 0"},
    //     {val:2,fill:"#a2d8e7",display:"0 to 2"},
    //     //{val:2,fill:"#aca480",display:"1 to 2"},
    //     {val:4,fill:"#cee9f2",display:"2 to 4"},
    //     //{val:4,fill:"#b1b9d4",display:"3 to 4"},
    //     {val:6,fill:"#b1b9d3",display:"4 to 6"},
    //     // {val:6,fill:"#8d97bf",display:"5 to 6"},
    //     {val:8,fill:"#8c96be",display:"6 to 8"},
    //     // {val:8,fill:"#6574aa",display:"7 to 8"},
    //     {val:10,fill:"#6574aa",display:"8 to 10"},
    //     // {val:10,fill:"#3d5194",display:"9 to 10"},
    //     {val:1000,fill:"#3c5094",display:"More than 10"}
    //   ],
    //   smallranges: null,
    //   keyTitle: "% change, 2010 to 2013"
    // },
    // 3: house prices
    // House price change in 15s, from less than -15 to more than +90 (eight plots)
    // (the full range for HPI goes from -17.7 to +103.7)
    // "hpr":{
    //   compare: "LESS-EQUAL",
    //   // LAYOUT sets key layout: number of rows and columns
    //   layout: {rows:5, columns:3},
    //   bigranges: [
    //     {val:-15,fill:"#39bcd9",display:"Less than -15"},
    //     // {val:-2,fill:"#a2d8e7",display:"-3 to -2"},
    //     {val:0,fill:"#69c5dc",display:"-15 to 0"},
    //     // {val:0,fill:"#3abcda",display:"-1 to 0"},
    //     {val:15,fill:"#a2d8e7",display:"0 to 15"},
    //     // {val:2,fill:"#aca480",display:"1 to 2"},
    //     {val:30,fill:"#cee9f2",display:"15 to 30"},
    //     // {val:4,fill:"#b1b9d4",display:"3 to 4"},
    //     {val:45,fill:"#b1b9d3",display:"30 to 45"},
    //     // {val:6,fill:"#8d97bf",display:"5 to 6"},
    //     {val:60,fill:"#8c96be",display:"45 to 60"},
    //     // {val:8,fill:"#6574aa",display:"7 to 8"},
    //     {val:75,fill:"#6574aa",display:"60 to 75"},
    //     // {val:10,fill:"#3d5194",display:"9 to 10"},
    //     {val:1000,fill:"#3c5094",display:"More than 75"}
    //   ],
    //   smallranges: null,
    //   keyTitle: "% change in annual average, May 2010 to Dec 2014"
    // },
    // 4: salaries
    // Salaries change in 5s from less than -25 to more than +25 (eight plots)
    // (the full range on salaries goes from -25.3 to +28.3)
    // "sal":{
    //   compare: "LESS-EQUAL",
    //   // LAYOUT sets key layout: number of rows and columns
    //   layout: {rows:5, columns:3},
    //   bigranges: [
    //     {val:-20,fill:"#39bcd9",display:"Less than -20"},
    //     {val:-10,fill:"#69c5dc",display:"-20 to -10"},
    //     {val:0,fill:"#a2d8e7",display:"-10 to 0"},
    //     {val:10,fill:"#8c96be",display:"0 to 10"},
    //     {val:20,fill:"#6574aa",display:"10 to 20"},
    //     {val:1000,fill:"#3c5094",display:"More than 20"}
    //   ],
    //   smallranges: null,
    //   keyTitle: "% change in annual average earnings, 2010 to 2014"
    // }
  };


  var version = '0.0.4';
  // SOURCE FOLDERS
  // Just locations; actual map and data files will be defined by topic
  my.sourcefiles = {
    // LITERAL PATHS are in my versioned folder
    literalpaths: "http://cdn.static-economist.com/sites/default/files/external/minerva_assets/ukel_map/test/" + version + "/ukliteralpaths.json",
    // CONSTITUENCY LOOKUPS of HEX LOCATIONS are in my versioned folder
    constituencylookupdata: "http://cdn.static-economist.com/sites/default/files/external/minerva_assets/ukel_map/test/" + version + "/constituencylookup.json",
    // ALEX'S LIVE FOLDERS
    // GLOBAL -- timestame, seats, and winners --
    results2010:        "http://cdn.static-economist.com/sites/default/files/external/minerva_assets/ukel_livemap_2015_night/rBasic2010.json",
    results2015:        "http://cdn.static-economist.com/sites/default/files/external/minerva_assets/ukel_livemap_2015_night/finalBasic2015.json",
    // ALL SINGLE CONSTITUENCY RESULTS -- 2010 AND 2015
    singleconstitfolder: "http://cdn.static-economist.com/sites/default/files/external/minerva_assets/ukel_livemap_2015_night/consFinalResults/",
    // NOTE: temporarily, for 2017:
    results2017: "files-from-cdn/seatsAndWinners2017.json",
    constitfolder2017: "files-from-cdn/live-results/"
    // These should eventually be replaced by a 'winners' file on CDN. And 2017 single constit files should go in the singleconstitfolder...
  };

  // STRINGS
  // Just overall strings. Topic-specific strings defined elsewhere
  my.strings = {
    // Date format is "day, full month name, yyyy"
    dateformat: "%d %B %Y",
    // NOTE: does this change? Is it even visible...?
    projecttitle: "<h1 class='title-main'>Election maps</h1><h2 class='title-fly'></h2><div class='update-box'><span class='update-label'>Last updated</span><span class='update-time'>March 10 2014 10.51AM</span></div><div class='title-rubric'>As Britain approaches its most unpredictable election in decades, the current political map reveals a fragmented country. Can one party break out of its strongholds and win a majority or (more likely, it seems) does another 'hung parliament' beckon?</div>",
    keyPrefix: "key_",
    shortMonths: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    defaultHeader:"",
    defaultSubHeader:"",
    defaultText: "Britain is divided into 650 constituencies. Each sends one MP to the House of Commons in Westminster. Rural seats are much larger than urban ones, so our map shows both the true geographic picture of the country and a schematic view of the political landscape."
  };

  // STARTCHECKS
  // Allows for 2 scenarios: bigger and smaller than the threshold set above (windowThreshold.threshold)
  //    name is component name
  //    ready is flag set to true as each component is initialised
  //    if kickoff===true, component's 'update' method is called at startup
  //    if update===true, components are updated after a user-gesture
  // *** IMPORTANT: framework and datafilter MUST be called first *** *** ***
  // INITIALLY, NO SMALL OPTION & THRESHOLD SET SMALL TO PREVENT IT BEING TRIPPED
  my.startchecks = {
    big: {
      // framework: {name: 'framework', ready:false, kickoff:true, update:true},
      // datafilter has no kickoff or update: it does what it has to on init
      datafilter: {name: 'datafilter', ready:false, kickoff:false, update:true},
      dropdowns: {name: 'dropdowns', ready:false, kickoff:true, update:false},
      keys: {name: 'keys', ready:false, kickoff:true, update:true},
      map: {name: 'map', ready:false, kickoff:true, update:true},
      treemap: {name: 'treemap', ready:false, kickoff:true, update:true},
      // footer: {name: 'footer', ready:false, kickoff:true, update:false}
    },
    small: {
      // framework: {name: 'framework', ready:false, kickoff:true, update:true},
      // datafilter has no kickoff or update: it does what it has to on init
      datafilter: {name: 'datafilter', ready:false, kickoff:false, update:true},
      dropdowns: {name: 'dropdowns', ready:false, kickoff:true, update:false},
      keys: {name: 'keys', ready:false, kickoff:true, update:true},
      map: {name: 'map', ready:false, kickoff:true, update:true},
      treemap: {name: 'treemap', ready:false, kickoff:true, update:true},
      // footer: {name: 'footer', ready:false, kickoff:true, update:false}
    }
  };

  // TABS
  my.tabs = {
    0: {
      label: "2017",
      children: {},
      id: "sev"
    },
    1: {
      label: "2015",
      children: {},
      id: "fif"
    },
    2: {
      label: "2010",
      children: {},
      id: "ten"
    // },
    // 2: {
    //   label: "Population",
    //   children: {},
    //   id: "pop"
    // },
    // 3: {
    //   label: "House prices",
    //   children: {},
    //   id: "hpr"
    // },
    // 4: {
    //   label: "Salaries",
    //   children: {},
    //   id: "sal"
    }
  };

  // RESULTS
  my.results2010 = {
    con: 302,
    lab: 256,
    lib: 56,
    dup:8,
    snp:6,
    snf:5,
    plc:3,
    sdl:3,
    ukp:2,
    grn:1,
    res:1,
    bnp:0,
    ind:5,
    oth:2,
    uup:0,
    total: 650
  };
  // NOTE: this currently gets overwritten from 2015 winners file
  // but will eventually be the data used...
  my.results2015 = {
    con:331,
    lab:232,
    lib:8,
    grn:1,
    ukp:1,
    bnp:0,
    snp:56,
    plc:3,
    ind:0,
    res:0,
    snf:4,
    sdl:3,
    dup:8,
    uup:2,
    oth:1,
    total: 650
};

  // DEMOGRAPHICS
  // national % change 2010-15, for column charts
  // NOTE: becomes redundant
  // var howToUse = "<div class='how-to-use'>Select or search for a constituency for a national comparison.</div>";
  // my.demographics = {
  //   hpr: {
  //     fill: {
  //       cons: "#9f0737",
  //       nat: "#929ca2",
  //     },
  //     nat_avg: 17,
  //     min: -20,
  //     max: 120,
  //     explanation: "House prices, % change in annual average, May 2010 to Dec 2014" + howToUse
  //   },
  //   sal: {
  //     fill: {
  //       cons: "#9f0737",
  //       nat: "#929ca2",
  //     },
  //     nat_avg: 4.7,
  //     min: -30,
  //     max: 30,
  //     explanation: "Salaries, % change in annual average earnings, 2010 to 2014" + howToUse
  //   },
  //   pop: {
  //     fill: {
  //       cons: "#9f0737",
  //       nat: "#929ca2",
  //     },
  //     nat_avg: 2.3,
  //     min: -5,
  //     max: 20,
  //     explanation: "Population, % change 2010 to 2013" + howToUse
  //   }
  // };

  // PARTIES
  // All lookups for parties: colours, strings...
  // NOTE: revised colours to come
  my.parties = {
    con: {
      id:"con",
      longname:"Conservative Party",
      midname:"Conservative",
      shortname:"Con",
      keyname:"Con",
      colour: "#3356f9",
      // heatcolour are used for one-party heatmaps
      heatcolour: "#3356f9",
      currentseats: 307
    },
    lab: {
      id:"lab",
      longname:"Labour Party",
      midname:"Labour",
      shortname:"Lab",
      keyname:"Lab",
      colour:"#df181c",
      heatcolour: "#df181c",
      currentseats: 258
    },
    lib: {
      id:"lib",
      longname:"Liberal Democrat Party",
      midname:"Lib Dem",
      shortname:"LD",
      keyname:"Lib Dem",
      colour:"#fd9d28",
      heatcolour: "#fd9d28",
      currentseats: 57
    },
    grn: {
      id:"grn",
      longname:"Green Party",
      midname:"Green",
      shortname:"Green",
      keyname:"Green",
      colour:"#6a9e3f",
      heatcolour: "#6a9e3f",
      currentseats: 1
    },
    ukp: {
      id:"ukp",
      longname:"UK Independence Party",
      midname:"UKIP",
      shortname:"UKIP",
      keyname:"UKIP",
      colour:"#79279f",
      heatcolour: "#79279f",
      currentseats:0
    },
    plc: {
      id:"plc",
      longname:"Plaid Cymru",
      midname:"Plaid Cymru",
      shortname:"PC",
      keyname:"PC",
      colour:"#5eb130",
      heatcolour: "#5eb130",
      currentseats:3
    },
    res: {
      id:"res",
      longname:"Respect",
      midname:"Respect",
      shortname:"Respect",
      keyname:"Respect",
      colour:"#aca580",
      heatcolour: "#aca580",
      currentseats:1
    },
    snp: {
      id:"snp",
      longname:"Scottish National Party",
      midname:"SNP",
      shortname:"SNP",
      keyname:"SNP",
      colour:"#fbca2c",
      heatcolour: "#fbca2c",
      currentseats:6
    },
    bnp: {
      id:"bnp",
      longname:"British National Party",
      midname:"BNP",
      shortname:"BNP",
      keyname:"BNP",
      colour:"#8fbcee",
      heatcolour: "#af781e",
      currentseats:0
    },
    ind: {
      id:"ind",
      longname:"Independent",
      midname:"Ind",
      shortname:"Ind",
      keyname:"Ind",
      colour:"#888888",
      heatcolour: "#888888",
      currentseats:1
    },
    oth: {
      id:"oth",
      longname:"Other",
      midname:"Other",
      shortname:"Other",
      keyname:"Other",
      colour:"#f0dcac",
      heatcolour: "#929ca1",
      currentseats:0
    },
    sdl: {
      id:"sdl",
      longname:"Social Democratic and Labour Party",
      midname:"SDLP",
      shortname:"SDLP",
      keyname:"SDLP",
      colour:"#005223",
      heatcolour: "#005223",
      currentseats:3
    },
    snf: {
      id:"snf",
      longname:"Sinn Fein",
      midname:"SF",
      shortname:"SF",
      keyname:"SF",
      colour:"#8fdb64",
      heatcolour: "#4e6718",
      currentseats:5
    },
    uup: {
      id:"uup",
      longname:"Ulster Unionist Party",
      midname:"Unionist",
      shortname:"UUP",
      keyname:"UUP",
      colour:"#ff6600",
      heatcolour: "#ff6600",
      currentseats:0
    },
    dup: {
      id:"dup",
      longname:"Democratic Unionist Party",
      midname:"DUP",
      shortname:"DUP",
      keyname:"DUP",
      colour:"#800a06",
      heatcolour: "#800a06",
      currentseats:8
    }
  };
  // PARTIES ends

  // CONSOLIDATION LIST is an array of parties that get folded into "other" for small widget
  my.consolidationList = ['dup','uup','bnp','res','ind','plc','snf','snp','sdl'];

  return my;
}());
// CONTROLLER ends
