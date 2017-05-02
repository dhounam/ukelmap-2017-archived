/*
  Author: Umberto Babini.
  Purpose: This class provide utilities for the creation of queryString primarly used to bypass server cache on demand
*/
function MNVqueryStringGenerator(){
  // Create a queryString base on the day date and the
  function UTCMinuteSteps(stepMinuteInterval){
    var d = new Date();
    return d.getUTCFullYear() + '-' + d.getUTCMonth() + '-' + d.getUTCDate() + '-' + d.getUTCHours() + '-' + (d.getUTCMinutes() - ( d.getUTCMinutes() % stepMinuteInterval));
  }
  return {
    UTCMinuteSteps: UTCMinuteSteps
  }
}