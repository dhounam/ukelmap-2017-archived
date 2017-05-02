function countDown(duration, display, autostart) {
    var timer = duration, minutes, seconds, interval, start, reset, restart, me;
    me = this;
    if(display===null){
        console.log('CountDown ---> Unable to find the destination tag for the countDown');
        return false;
    }
    
    function init(){
        minutes = parseInt(duration / 60, 10)
        seconds = parseInt(duration % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;
        timer = duration;
        if(autostart===true){
            start();
        }
    }
    
    start = function (){
        me.interval = setInterval(function () {
            minutes = parseInt(timer / 60, 10)
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                stop();
            }
        }, 1000);
    }

    stop = function(){
        window.clearInterval(me.interval);
    }

    reset = function(){
        stop();
        init();
    }

    restart = function(){
        stop();
        init();
        start();
    }

    init();

    return {
        start: start,
        restart: restart,
        stop: stop,
        reset: reset,
        interval: interval
    }
}