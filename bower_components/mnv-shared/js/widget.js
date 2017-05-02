function Widget(){
  // Insert here additional methods shared beetwen the widget
  // e.g. entering animation or preloader
  this.addPreloader = function (){
    if($('.mnv-preloader-overlay', this.el).length===0){
      $("<div class='mnv-preloader-overlay'></div>").appendTo(this.el);
    }
    if($('.mnv-preloader-loader', this.el).length===0){
      $("<div class='mnv-preloader-loader'></div>").appendTo(this.el);
    }
  }

  this.removePreloader = function (){
    $(".mnv-preloader-loader", this.el).fadeOut(200, function(){
      $(this).remove();
      $(".mnv-preloader-overlay", this.el).fadeOut(300, function(){
        $(this).remove();
      });
    });    
  }

  this.bindEvent = function(){
    var me = this;
    this.el.on("loading", function(){
      me.addPreloader();
    });

    this.el.on("loaded", function(){
      me.removePreloader();
    });
  }

}

Widget.prototype.log = function(txt){
  // widgetConfig.minerva.debugMode to be added
  if(window.console && window.console.log){
    console.log(this.id + ' --> ' + txt);
  }
}