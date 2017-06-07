"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

// CONTROLLER
mnv_ukelmap.model = (function(){
  var my;
  my = {};

  // GO-LIVE TIME: 10pm on 8 June 2017 as ms
  // Note that months are from zero (so 5 for June)
  // And, since June is BST, subtract 1 from hour (i.e. 21 for 10pm)
  // my.goliveTime = new Date(Date.UTC(2017, 5, 8, 21, 0, 0));
  // But for TESTING (4 = May; hour must be T-1)
  // NOTE: strict mode won't allow leading zeroes in numbers
  my.goliveTime = Date.UTC(2017, 4, 31, 10, 22, 0);

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
    singlefound: false,
    dataindex: "fif",
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
    undeclared: '#dbe2e7',
    remain: '#5DA4DF',
    leave: '#C89608',
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
        // {id:'res'},
        {id:'uup'},
        // {id:'bnp'},
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
        // {id:'res'},
        {id:'uup'},
        // {id:'bnp'},
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
        // {id:'res'},
        {id:'uup'},
        // {id:'bnp'},
        {id:'oth'}
      ],
      smallranges: null,
      keyTitle: "Seats"
    },
    // BREXIT
    // Details to come, using old salaries for now
    "brx":{
      compare: "LESS-EQUAL",
      // LAYOUT sets key layout: number of rows and columns
      layout: {rows:5, columns:3},
      // Range values are for %-remain
      bigranges: [
        {val:30,fill:"#8D6300",display:"30 or less"},
        {val:40,fill:"#C89608",display:"30 to 40"},
        {val:50,fill:"#FFCB4D",display:"40 to 50"},
        {val:60,fill:"#98DAFF",display:"50 to 60"},
        {val:70,fill:"#5DA4DF",display:"60 to 70"},
        {val:1000,fill:"#00588D",display:"More than 70"}
      ],
      smallranges: null,
      keyTitle: "Percent 'Remain'"
    }
  };


  var version = '0.0.4';
  // SOURCE FOLDERS
  // Just locations; actual map and data files will be defined by topic
  my.sourcefiles = {
    // Relative paths to data folder...
    // Constituency path files:
    literalpaths: "data/ukliteralpaths.json",
    constituencylookupdata: "data/constituencylookup.json",
    // Collated files:
    results2010: "data/seatsAndWinners2010.json",
    results2015: "data/seatsAndWinners2015.json",
    results2017: "data/seatsAndWinners2017.json",
    // Brexit:
    resultsBrexit: "data/brexit.json",
    // LITERAL PATHS are in my versioned folder
    // literalpaths: "http://cdn.static-economist.com/sites/default/files/external/minerva_assets/ukel_map/test/" + version + "/ukliteralpaths.json",
    // CONSTITUENCY LOOKUPS of HEX LOCATIONS are in my versioned folder
    // constituencylookupdata: "http://cdn.static-economist.com/sites/default/files/external/minerva_assets/ukel_map/test/" + version + "/constituencylookup.json",
    // ALEX'S LIVE FOLDERS
    // GLOBAL -- timestame, seats, and winners --
    // results2010:        "http://cdn.static-economist.com/sites/default/files/external/minerva_assets/ukel_livemap_2015_night/rBasic2010.json",
    // results2015:        "http://cdn.static-economist.com/sites/default/files/external/minerva_assets/ukel_livemap_2015_night/finalBasic2015.json",
    // Single-constituency results start with a partial path, shared for all years
    // Year-specific elements are added inferentially in datafilter.findConstituencyData
    // (NOTE: doesn't end with '/', since year has to be added to folder name)
    singleconstitfolder: "data/live-results",
    // NOTE: temporarily, for 2017:
    // results2017: "files-from-cdn/seatsAndWinners2017.json",
    // constitfolder2010: "data/live-results2010/",
    // constitfolder2015: "data/live-results2015/",
    // constitfolder2017: "data/live-results2017/",
    // These should eventually be replaced by a 'winners' file on CDN. And 2017 single constit files should go in the singleconstitfolder...
    // BREXIT data are local...
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
    defaultText: "Britain is divided into 650 constituencies. Each sends one MP to the House of Commons in Westminster. Rural seats are much larger than urban ones, so our map shows both the true geographic picture of the country and a schematic view of the political landscape.",
    brexitText: "The United Kingdom European Union membership referendum took place on 23 June 2016",
    footnote: {
      default: "",
      // big: "*Includes by-elections    <sup>†</sup>Excludes by-elections",
      big: "*Includes subsequent by-elections",
      small: "*Includes subsequent by-elections",
      spare: "Results for Stoke-on-Trent Central; Copeland; Richmond Park; Witney; Batley and Seen; Tooting; Ogmore; Sheffield Brightside and Hillsborough; and Oldham West and Royton, are by-elections"

    }
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
      dropdowns: {name: 'dropdowns', ready:false, kickoff:true, update:true},
      keys: {name: 'keys', ready:false, kickoff:true, update:true},
      map: {name: 'map', ready:false, kickoff:true, update:true},
      treemap: {name: 'treemap', ready:false, kickoff:true, update:true},
      // footer: {name: 'footer', ready:false, kickoff:true, update:false}
    },
    small: {
      // framework: {name: 'framework', ready:false, kickoff:true, update:true},
      // datafilter has no kickoff or update: it does what it has to on init
      datafilter: {name: 'datafilter', ready:false, kickoff:false, update:true},
      dropdowns: {name: 'dropdowns', ready:false, kickoff:true, update:true},
      keys: {name: 'keys', ready:false, kickoff:true, update:true},
      map: {name: 'map', ready:false, kickoff:true, update:true},
      treemap: {name: 'treemap', ready:false, kickoff:true, update:true},
      // footer: {name: 'footer', ready:false, kickoff:true, update:false}
    }
  };

  // TABS
  my.unlivetabs = {
    0: {
      label: "2015-17*",
      children: {},
      id: "fif"
    },
    1: {
      label: "2010<sup>†</sup>",
      children: {},
      id: "ten"
    },
    2: {
      label: "EU referendum",
      children: {},
      id: "brx"
    }
  };
  my.livetabs = {
    0: {
      label: "2017",
      children: {},
      id: "sev"
    },
    1: {
      label: "2015-17*",
      children: {},
      id: "fif"
    },
    2: {
      // label: "2010<sup>†</sup>",
      label: "2010-15*",
      children: {},
      id: "ten"
    },
    3: {
      label: "EU referendum",
      children: {},
      id: "brx"
    }
  };

  // RESULTS
  my.results2010 = {
    con: 303,
    lab: 259,
    lib: 57,
    dup: 8,
    snp: 6,
    snf: 5,
    plc: 3,
    sdl: 3,
    ukp: 2,
    oth: 2,
    grn: 1,
    ind: 1,
    uup: 0,
    total: 650
  };
  my.results2015 = {
    con: 330,
    lab: 230,
    snp: 54,
    lib: 9,
    dup: 8,
    snf: 4,
    ind: 5,
    plc: 3,
    sdl: 3,
    uup: 2,
    grn: 1,
    oth: 1,
    total: 650
};
// Overall national 'Remain' vote in the referendum:
my.resultsBrexit = {
  val: 48.1,
};

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
      colour: "rgba(0, 107, 161, 1)",
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
      colour:"rgba(219, 68, 75, 1)",
      heatcolour: "#df181c",
      currentseats: 258
    },
    lib: {
      id:"lib",
      longname:"Liberal Democrat Party",
      midname:"Lib Dem",
      shortname:"LD",
      keyname:"Lib Dem",
      colour:"rgba(234, 179, 51, 1)",
      heatcolour: "#fd9d28",
      currentseats: 57
    },
    grn: {
      id:"grn",
      longname:"Green Party",
      midname:"Green",
      shortname:"Green",
      keyname:"Green",
      colour:"rgba(54, 153, 139, 1)",
      heatcolour: "#6a9e3f",
      currentseats: 1
    },
    ukp: {
      id:"ukp",
      longname:"UK Independence Party",
      midname:"UKIP",
      shortname:"UKIP",
      keyname:"UKIP",
      colour:"rgba(154, 96, 128, 1)",
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
    // res: {
    //   id:"res",
    //   longname:"Respect",
    //   midname:"Respect",
    //   shortname:"Respect",
    //   keyname:"Respect",
    //   colour:"#aca580",
    //   heatcolour: "#aca580",
    //   currentseats:1
    // },
    snp: {
      id:"snp",
      longname:"Scottish National Party",
      midname:"SNP",
      shortname:"SNP",
      keyname:"SNP",
      colour:"#fddd03",
      heatcolour: "#fbca2c",
      currentseats:6
    },
    // bnp: {
    //   id:"bnp",
    //   longname:"British National Party",
    //   midname:"BNP",
    //   shortname:"BNP",
    //   keyname:"BNP",
    //   colour:"#8fbcee",
    //   heatcolour: "#af781e",
    //   currentseats:0
    // },
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
      colour:"#96B4D2",
      heatcolour: "#96B4D2",
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

  // BORDERS FOR SCOTLAND, WALES AND LONDON
  my.scotData = [
    {
      id: "S14000008",
      // Name is redundant; just for my sanity.
      name: "Berwickshire, Roxburgh and Selkirk",
      // Index segements from zero
      // Remember: these are points, not 'sides'
      // First 'constit' includes first point; subsequent omit this,
      // since path continues...
      points: [0,1]
    },
    {id: "S14000045", name: "Midlothian", points: [0,1,2]},
    {id: "S14000014", name: "Dumfriesshire, Clydesdale and Tweeddale", points: [1,2]}
  ];
  my.walesData = [
    {id: "W07000042", name: "Delyn", points: [3,4,5,0]},
    {id: "W07000043", name: "Alyn and Deeside", points: [5,0,1]},
    {id: "W07000044", name: "Wrexham", points: [0,1]},
    {id: "W07000062", name: "Clwyd", points: [0,1]},
    {id: "W07000063", name: "Montgomery", points: [0,1]},
    {id: "W07000068", name: "Brecon", points: [0,1]},
    {id: "W07000064", name: "Ceredigion", points: [0,1]},
    {id: "W07000072", name: "Blaenau Gwent", points: [0]},
    {id: "W07000053", name: "Torfaen", points: [5,0,1]},
    {id: "W07000054", name: "Monmouth", points: [0,1]},
    {id: "W07000055", name: "Newport East", points: [0,1,2]},
    {id: "W07000051", name: "Cardiff North", points: [1]},
    {id: "W07000056", name: "Newport West", points: [0,1,2]}
  ];
  my.lonData = [
    {id: "E14000636", name: "Chipping Barnet", points: [3,4,5,0]},
    {id: "E14000692", name: "Enfield Southgate", points: [5,0]},
    {id: "E14000691", name: "Enfield North", points: [5,0]},
    {id: "E14000687", name: "Edmonton", points: [5,0]},
    {id: "E14000634", name: "Chingford", points: [5,0]},
    {id: "E14000759", name: "Ilford North", points: [5,0]},
    {id: "E14000760", name: "Ilford South", points: [5,0]},
    {id: "E14000900", name: "Romford", points: [5,0,1]},
    {id: "E14000751", name: "Hornchurch", points: [0,1,2]},
    {id: "E14000657", name: "Dagenham", points: [1,2]},
    {id: "E14000696", name: "Erith", points: [1,2]},
    {id: "E14000558", name: "Bexleyheath", points: [1,2]},
    {id: "E14000872", name: "Orpington", points: [1,2]},
    {id: "E14000551", name: "Beckenham", points: [1,2]},
    {id: "E14000654", name: "Croydon Central", points: [1,2]},
    {id: "E14000656", name: "Croydon South", points: [1,2,3]},
    {id: "E14000621", name: "Carshalton", points: [2,3]},
    {id: "E14000823", name: "Mitcham", points: [2,3]},
    {id: "E14000984", name: "Sutton", points: [2]},
    {id: "E14000770", name: "Kingston", points: [1,2,3,4]},
    {id: "E14001005", name: "Twickenham", points: [3,4]},
    {id: "E14000701", name: "Feltham", points: [3]},
    {id: "E14000737", name: "Hayes", points: [2,3,4]},
    {id: "E14001007", name: "Uxbridge", points: [3,4,5]},
    {id: "E14000675", name: "Ealing North", points: [4]},
    {id: "E14000906", name: "Ruislip", points: [3,4,5]},
    {id: "E14000732", name: "Harrow West", points: [4,5]},
    {id: "E14000731", name: "Harrow East", points: [4,5]},
    {id: "E14000741", name: "Hendon", points: [4]}
  ];

  return my;
}());
// CONTROLLER ends
