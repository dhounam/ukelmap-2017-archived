var mnv_ukelmapTagConfig = {
  elements: '.mnv-map-uk-election-2017-election-night',
  url: mnv_ukelmap.model.sourcefiles.results2017,
  callbackName: 'seatsAndWinners2017CB',
  pollingTime: 10000
};
MnvDRSI.subscribe(mnv_ukelmapTagConfig);

// I've set pollingTime to 10secs, which is Umbi's minimum...

$(document).ready(function(){
  'use strict';
  mnv_ukelmap.controller.initFramework();
});
