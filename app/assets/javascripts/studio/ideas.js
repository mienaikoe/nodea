var Ideas = function() {
    
    this.container = $("#ideas");
    
    this.sliversPerBeat = (192 / project.beat); // 48 for a quarter note, 24 for an eight note, ...
    this.sliversPerSecond = (project.bpm * this.sliversPerBeat) / 60;
    
    this.startTime = null;
    this.recording = false;
    this.recordingNotes = {};
    
    this.tracksContainer = this.container.children("#tracks");

    for( _i in project.timings ){
        this.createNoteContainer(project.timings[_i]);
    }
            
    var barsContainer = this.container.children("#barlines");        
    for( var _i=0; _i < project.numBeats; _i++  ){
        jQuery('<div/>',{class: 'beat'}).prependTo(barsContainer);
    }
    
    var containerHeight = (project.numBeats*this.sliversPerBeat)+1;    
    this.maxBottom = $('#circuit').outerHeight();
    this.minBottom = this.maxBottom - containerHeight;
    this.container.css('height', containerHeight+'px' ).css('bottom', this.maxBottom+'px');
};

Ideas.prototype.framesPerSecond = 20;






// Recording
Ideas.prototype.toggleRecording = function(){
    this.recording = !this.recording;
    if( this.recording === false ) {
        for( _i in this.recordingNotes ){
            this.recordingNotes[_i].noda.turnOffPassiveRecording();
        }
        this.recordingNotes = {};
    }
};

Ideas.prototype.noteOn = function( noda ){
    var note = {key: noda.key, on: this.sliverFor(Date.now()), noda: noda};
    this.recordingNotes[noda.key] = note;
    this.createNoteContainer(note);
};

Ideas.prototype.noteOff = function( noda ){
    console.log('note off');
    var note = this.recordingNotes[noda.key];
    if( typeof note === 'undefined' ){ 
        return;
    }
    
    var thisSliver = this.sliverFor(Date.now());
    if( note.on === thisSliver ){
        note.container.remove();
    } else {
        note.off = thisSliver;
        note.noda.addNote(note);
    }

    delete this.recordingNotes[noda.key];
};

Ideas.prototype.createNoteContainer = function(note){
    if( assert(note) ){
        var clazz = 'note';
        if( typeof note.off === 'undefined' ){
            note.off = note.on+1;
            clazz = 'note recording';
        } 
        var slivers = note.off - note.on;
        note.container = jQuery('<div/>',{
            class: clazz,
            style: 'bottom: '+note.on+'px; height: '+slivers+'px;'
        }).prependTo(this.tracksContainer.children('#track_'+note.key.charCodeAt(0)));
    }
};

Ideas.prototype.removeNoteContainer = function(note){
    note.container.remove();
};








// Playback

Ideas.prototype.constructPlayIntervalFxn = function( ){
    var ides = this;
    return function(){ ides.frame(); };
};

Ideas.prototype.start = function(){
    // schedule all notes to play
    this.lastFrameSliver = this.currentSliver();
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
        noda.lightOff('active');
    }
    for( var key in this.recordingNotes ){
        var note = this.recordingNotes[key];
        console.log(note);
        note.noda.turnOffPassiveRecording();
        if( note.container ){
            note.container.css('height',note.off-note.on+'px');
        }
    }
};

Ideas.prototype.playpause = function(){
    if( this.startTime === null ){ 
        this.start(); 
    } else { 
        this.pause(); 
    }
    
};



Ideas.prototype.currentSliver = function(){
    return Math.ceil( this.maxBottom - parseFloat(this.container.css('bottom')) );
};

Ideas.prototype.sliverFor = function(epoch){
    if( this.startTime === null ){
        return this.currentSliver();
    } else {
        return Math.ceil( (epoch - this.startTime) * this.sliversPerSecond / 1000 );
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
      
    var sliver = this.sliverFor(Date.now());
    this.container.css('bottom', this.maxBottom-sliver+'px');
    
    // handle lighting
    for( _i in project.timings ){
        var note = project.timings[_i];
        if( note.on <= sliver && note.on > this.lastFrameSliver ){
            note.noda.lightOn('active');
        } else if( note.off <= sliver && note.off > this.lastFrameSliver ){
            note.noda.lightOff('active');
        }
    }
    for( _j in this.recordingNotes ){
        var note = this.recordingNotes[_j];
        if( note.container ){
            note.container.css('height', sliver-note.start+'px');
        }
    }
    
    this.lastFrameSliver = sliver;
};

Ideas.prototype.reset = function(){
    this.pause();
    this.container.css('bottom',this.maxBottom+'px');
};

// not sure you'd ever need this...
Ideas.prototype.end = function(){
    this.pause();
    this.container.css('bottom', this.minBottom+'px');
};