var Ideas = function(project) {
    
    this.project = project;
    this.numBars = project.timings.length;
    this.container = $("#ideas");
    
    this.sliversPerBeat = (192 / project.beat); // 48 for a quarter note, 24 for an eight note, ...
    this.sliversPerSecond = (this.project.bpm * this.sliversPerBeat) / 60;
    
    this.startTime = null;
    this.recording = false;
    
    var tracksContainer = this.container.children("#tracks");
    var barsContainer = this.container.children("#barlines");
    
    var numSlivers = 0;
            
    var createNote = function(note){
        if( assert(note) ){
            var slivers = note.off - note.on;
            jQuery('<div/>',{
                class: 'note',
                style: 'bottom: '+note.on+'px; height: '+slivers+'px;'
            }).prependTo(tracksContainer.children('#track_'+note.key.charCodeAt(0)));
        }
    };
    
    for( _i in project.timings ){
        var note = project.timings[_i];
        if( note.off > numSlivers ){
            numSlivers = note.off;
        }
        createNote(note);
    }
            
    this.numBeats = numSlivers / this.sliversPerBeat;
    for( var _i=0; _i < this.numBeats; _i++  ){
        jQuery('<div/>',{class: 'beat'}).prependTo(barsContainer);
    } // probably a better way to do this
    
    
    var containerHeight = (this.numBeats*this.sliversPerBeat)+1;
    this.container.css('height', containerHeight+'px' ).css('bottom', this.maxBottom+'px');
    this.minBottom = this.maxBottom - containerHeight;
    
};

Ideas.prototype.framesPerSecond = 20;
Ideas.prototype.maxBottom = 330;


// Settings Toggles
Ideas.prototype.toggleRecording = function(){
    this.recording = !this.recording;
};





// Playback

Ideas.prototype.constructPlayIntervalFxn = function( ){
    var ides = this;
    return function(){ ides.frame(); };
};

Ideas.prototype.start = function(){
    // schedule all notes to play
    this.lastFrameSliver = this.maxBottom - parseFloat(this.container.css('bottom'));
    for( var _i in nodas ){
        nodas[_i].startSources( this.sliversPerSecond, this.lastFrameSliver );
    }
    this.startTime = Date.now() - (this.lastFrameSliver / (this.sliversPerSecond/1000));
    this.playInterval = window.setInterval(this.constructPlayIntervalFxn(), 1000/this.framesPerSecond);
};

Ideas.prototype.pause = function(){
    this.startTime = null;
    clearInterval(this.playInterval);
    for( var _i in nodas ){
        var noda = nodas[_i];
        noda.stopSources();
        noda.resetSources();
    }
};

Ideas.prototype.playpause = function(){
    if( ideas.startTime === null ){ 
        ideas.start(); 
    } else { 
        ideas.pause(); 
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
        if( note.on <= sliver && note.on > this.lastFrameSliver ){
            note.noda.lightOn();
        } else if( note.off <= sliver && note.off > this.lastFrameSliver ){
            note.noda.lightOff();
        }
    }
    this.lastFrameSliver = sliver;
};

Ideas.prototype.reset = function(){
    this.pause();
    for( var _i in nodas ){
       nodas[_i].lightOff();
    }
    this.container.css('bottom',this.maxBottom+'px');
};

// not sure you'd ever need this...
Ideas.prototype.end = function(){
    this.pause();
    this.container.css('bottom', this.minBottom+'px');
};