var Ideas = function(project, circuit) {
    
    this.project = project;
    this.numBars = project.timings.length;
    this.circuit = circuit;
    this.container = $("#ideas");
    
    this.sliversPerBeat = (192 / project.beat); // 48 for a quarter note, 24 for an eight note, ...
    this.sliversPerSecond = (this.project.bpm * this.sliversPerBeat) / 60;
    
    this.startTime = null;
    
    var tracksContainer = this.container.children("#tracks");
    var barsContainer = this.container.children("#barlines");
    
    var numSlivers = 0;
            
    var createNote = function(note){
        if( assert(note) ){
            var height = note.end - note.start;
            jQuery('<div/>',{
                class: 'note',
                style: 'bottom: '+note.start+'px; height: '+height+'px;'
            }).prependTo(tracksContainer.children('#track_'+note.key.charCodeAt(0)));
        }
    };
    
    

    for( _i in project.timings ){
        var note = project.timings[_i];
        if( note.end > numSlivers ){
            numSlivers = note.end;
        }
        createNote(note);
    }
            
    this.numBeats = numSlivers / this.sliversPerBeat;
    for( var _i=0; _i < this.numBeats; _i++  ){
        jQuery('<div/>',{class: 'beat'}).prependTo(barsContainer);
    } // probably a better way to do this
    
    
    var containerHeight = (this.numBeats*this.sliversPerBeat)+1;
    this.container.css('height', containerHeight+'px' );
    this.minBottom = this.maxBottom - containerHeight;
    
};

Ideas.prototype.framesPerSecond = 20;
Ideas.prototype.maxBottom = 300;





Ideas.prototype.constructPlayIntervalFxn = function( ){
    var ides = this;
    return function(){ ides.frame(); };
};

Ideas.prototype.start = function(){
    // schedule all notes to play
    this.lastFrameSliver = this.maxBottom - parseFloat(this.container.css('bottom'));
    var nodas = this.circuit.nodas;
    for( var _i in nodas ){
        nodas[_i].startSources( this.sliversPerSecond, this.lastFrameSliver );
    }
    this.startTime = Date.now() - (this.lastFrameSliver / (this.sliversPerSecond/1000));
    this.playInterval = window.setInterval(this.constructPlayIntervalFxn(), 1000/this.framesPerSecond);
};

Ideas.prototype.pause = function(){
    this.startTime = null;
    clearInterval(this.playInterval);
    var nodas = this.circuit.nodas;
    for( var _i in nodas ){
        var noda = nodas[_i];
        noda.stopSources();
        noda.resetSources();
    }
};


Ideas.prototype.frame = function(){
    if( this.startTime === null ){
        return this.pause();
    }
    
    var currBott = parseFloat(this.container.css('bottom'));
    if( currBott <= this.minBottom ){
        return this.pause();
    } 
      
    var sliver = this.sliversPerSecond * ((Date.now()-this.startTime)/1000);
    this.container.css('bottom', this.maxBottom-sliver+'px');
    
    // handle lighting
    for( _i in project.timings ){
        var note = project.timings[_i];
        if( note.start <= sliver && note.start > this.lastFrameSliver ){
            note.noda.lightOn();
        } else if( note.end <= sliver && note.end > this.lastFrameSliver ){
            note.noda.lightOff();
        }
    }
    this.lastFrameSliver = sliver;
};

Ideas.prototype.reset = function(){
    this.pause();
    this.container.css('bottom',this.maxBottom+'px');
};

Ideas.prototype.end = function(){
    this.pause();
    this.container.css('bottom', this.minBottom+'px');
};