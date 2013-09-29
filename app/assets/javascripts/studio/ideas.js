var Ideas = function(project, circuit) {
    
    this.project = project;
    this.numBars = project.timings.length;
    this.circuit = circuit;
    this.container = $("#ideas");
    
    this.sliversPerBeat = (192 / project.beat);
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
    this.minBottom = this.circuitHeight - containerHeight;
    
};

Ideas.prototype.framesPerSecond = 20;
Ideas.prototype.circuitHeight = 300;





Ideas.prototype.constructPlayIntervalFxn = function( ){
    var ides = this;
    return function(){ ides.advance(-5); };
};

Ideas.prototype.start = function(){
    // schedule all notes to play?
    var nodas = this.circuit.nodas;
    var secPerSliver = 60 / (this.project.bpm * this.sliversPerBeat);
    for( var _i in nodas ){
        nodas[_i].startSources( secPerSliver );
    }
    
    this.playInterval = window.setInterval(this.constructPlayIntervalFxn(), 1000/this.framesPerSecond);
};

Ideas.prototype.pause = function(){
    this.startTime = null;
    clearInterval(this.playInterval);
    var nodas = this.circuit.nodas;
    for( var _i in nodas ){
        nodas[_i].resetSources();
    }
};

Ideas.prototype.advance = function(amt){
    console.log('advancing');
    var currBott = parseFloat(this.container.css('bottom'));
    if( currBott <= this.minBottom ){
        this.pause();
    } else {
        this.container.css('bottom', currBott+amt+'px');
    }
};

Ideas.prototype.reset = function(){
    this.pause();
    this.container.css('bottom',this.circuitHeight+'px');
};

Ideas.prototype.end = function(){
    this.pause();
    this.container.css('bottom', this.minBottom+'px');
};