// File contains spare bits of code deleted from other files in the UK election map project

// From map.js:



  // MARGINAL COLOUR
  // Colour winning party in marginal seats only
  function marginalColour(data) {
    var winner, isMarginal, col;
    // By default:
    col = "#ffffff";
    winner = data.win;
    isMarginal = data.marginal.toLowerCase();
    if (isMarginal === "true") {
      col = model.parties[winner].colour;
    }
    return col;
  }
  // MARGINAL COLOUR ends 
  

 // GET OPACITY
  // Passed raw data, returns an opacity (heat-map only)
  // This is currently hard-coded to return Kenn's margin
  // between 1st and 2nd...
  function getOpacity(data) {
    var opacity, turnout, p1, p2, vMargin;
    opacity = 1;
    turnout = data.turnout;
    p1 = data.place_1;
    p2 = data.place_2;
    vMargin = p1 - p2;
    if (vMargin >= 40) {
      opacity = 1;
    }
    else if (vMargin >= 30) {
      opacity = 0.75;
    }
    else if (vMargin >= 20) {
      opacity = 0.5;
    }
    else {
      opacity = 0.25;
    }
    return opacity;
  }
  // GET OPACITY


  

  // STATIC HACK: GET STATIC OPACITY
  // Passed raw data, returns an opacity (heat-map only)
  function getStaticOpacity(data) {
    var opacity, marginal;
    opacity = 0;
    marginal = +data.marginal;
    /*
      -4 to 13
     12.21% to -3.93
     -2
     0
     2
     4
     6
     8
     10
     12
     14
     */
    if (marginal <= -2) {
      opacity = 0.1;
    }
    else if (marginal <= 0) {
      opacity = 0.2;
    }
    else if (marginal <= 2) {
      opacity = 0.3;
    }
    else if (marginal <= 4) {
      opacity = 0.4;
    }
    else if (marginal <= 6) {
      opacity = 0.5;
    }
    else if (marginal <= 8) {
      opacity = 0.6;
    }
    else if (marginal <= 10) {
      opacity = 0.7;
    }
    else if (marginal <= 12) {
      opacity = 0.8;
    }
    else if (marginal <= 14) {
      opacity = 0.9;
    }
    else {
      opacity = 0
    }
    return opacity;
  }
  // STATIC HACK: GET STATIC OPACITY ENDS


  // This was just to add all parties totals, apart from the "big six",
  // to "Other"
  function consolidateOtherParties(o) {
    var otherVal, consolArray, i, v, winVal;
    return o;
    otherVal = o.oth;
    if (isNaN(otherVal)) { otherVal = 0; }
    consolArray = model.consolidationList;
    winVal = +o[o.win];
    for (i in consolArray) {
      v = o[consolArray[i]];
      if (!isNaN(v)) {
        otherVal += v;
        o[consolArray[i]] = 'na';
      }
    }
    o.oth = otherVal;
    // So does the 'winner' change?
    // (do ">=" becos there may be only 1 'other' party)
    if (otherVal >= winVal) {
      o.win = "oth";
    }
    return o;
  }
