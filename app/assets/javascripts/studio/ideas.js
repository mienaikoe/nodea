var Ideas = function(project) {
        
    this.project = project;
    this.numBars = project.timings.length;
    this.container = $("#ideas");
    var tracksContainer = this.container.children("#tracks");
    var barsContainer = this.container.children("#barlines");
    
    var numBeats = 0;
    var activeNotes = {};
        
    var timeToPixels = function( time ){
        return (numBeats*192/this.project.beat) + time;
    };
    
    
    var cutActiveNote = function( key, endTime, key ){
        var startTime = activeNotes[key];
        if( assert(startTime) ){
            var height = endTime - startTime;
            jQuery('<div/>',{
                class: 'note',
                style: 'bottom: '+startTime+'px; height: '+height+'px;'
            }).prependTo(tracksContainer.children('#track_'+key.charCodeAt(0)));
            delete activeNotes[key];
        }
    };
    
    

    for( _i in project.timings ){
        var bar = project.timings[_i];
        for( _j in bar ){
            var beat = bar[_j];
            var beatclass = 'beat';
            if( _j === bar.length-1 ){
                beatclass += ' upbeat';
            }
            jQuery('<div/>',{
                class: beatclass
            }).prependTo(barsContainer);
            for( _k in beat ){
                var action = beat[_k];
                if( assert(action.keyOn) ){
                    var note = activeNotes[action.keyOn];
                    if( !assert(note) ){
                        activeNotes[action.keyOn] = timeToPixels(action.time);
                    }
                } else if( assert(action.keyOff) ){
                    cutActiveNote( action.keyOff, timeToPixels(action.time), action.keyOff );
                }
            }
            numBeats++;
        }
    }
    
    var thisTimeInPixels = timeToPixels(0);
    for( _l in activeNotes ){
        var note = activeNotes[_l];
        if( assert(note) ){
            console.log(_l);
            cutActiveNote( note, (thisTimeInPixels), _l );
        }
    }
    
    this.numBeats = numBeats;
    this.container.css('height', thisTimeInPixels + 1);
    
};

Ideas.prototype.constructPlayIntervalFxn = function( ){
    var ides = this;
    return function(){ ides.advance(-5); };
};

Ideas.prototype.start = function(){
    this.playInterval = window.setInterval(this.constructPlayIntervalFxn(), 50);
};

Ideas.prototype.pause = function(){
    clearInterval(this.playInterval);
};

Ideas.prototype.advance = function(amt){
    console.log('advancing');
    var currBott = parseFloat(this.container.css('bottom'));
    if( currBott <= -parseFloat(this.container.css('height'))+300 ){
        this.pause();
    } else {
        this.container.css('bottom', currBott+amt+'px');
    }
};

Ideas.prototype.reset = function(){
    this.pause();
    this.container.css('bottom','300px');
};
