function Chart(){
  var chart = this;
  chart.timer = {};
  // Redraw on resize to provide responsivness.
  $(window).resize( function() {
    this.clearTimeout(chart.timer);
    chart.timer = window.setTimeout(function() {
      console.log('Triggering reDraw to Charts');
      $('.mnv-ec-chart').trigger('reDraw');
    }, 200);
  });

  // Inherithed events from widget class
  var widgetEvents = this.bindEvent;
  
  this.bindEvent = function(){
    var me = this;
    widgetEvents.apply(this);

    this.el.on("reDraw", function(){
      me.reDraw();
    });
  }

  this.reDraw = function (){
    $('svg ' , this.el).remove();
    this.init(this.settings);
    this.change();
  }
}

Chart.prototype = new Widget();