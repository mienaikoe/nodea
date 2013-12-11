var Ideas = function() {
    
    this.container = $("#ideas");
    this.advanceBox = $("#advance_box");
    this.advanceAmount = parseInt(this.advanceBox.val()) / project.beat;
    this.advanceBox.change(function(){ ideas.advanceAmount = parseInt(this.value) / project.beat; });
    
    this.setSliverTiming();
    
    this.startTime = null;
    this.startFrameTimestamp = null;
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





// Timing

Ideas.prototype.framesPerSecond = 20;

Ideas.prototype.setSliverTiming = function(){
    this.sliversPerBeat = (192 / project.beat); // 48 for a quarter note, 24 for an eight note, ...
    this.sliversPerSecond = (project.bpm * this.sliversPerBeat) / 60;
};



Ideas.prototype.currentBottom = function(){
    return parseFloat(this.container.css('bottom'));
};


// Recording

Ideas.prototype.toggleRecording = function(){
    this.recording = !this.recording;
    if( this.recording === false ) {
        for( _i in this.recordingNotes ){
            this.recordingNotes[_i].noda.turnOffPassiveRecording();
        }
        this.recordingNotes = {};
    }
    $('#controls #record').toggleClass("active");
};

Ideas.prototype.noteOn = function( noda ){
    var note = {key: noda.key, on: this.sliverFor(Date.now()), noda: noda};
    this.recordingNotes[noda.key] = note;
    this.createNoteContainer(note);
};

Ideas.prototype.noteOff = function( noda ){
    var note = this.recordingNotes[noda.key];
    if( typeof note === 'undefined' ){ 
        return;
    }
    
    var thisSliver = this.sliverFor(Date.now());
    if( note.on === thisSliver ){
        note.container.remove();
    } else {
        note.off = thisSliver;
        note.container.css('height',(note.off-note.on)+'px');
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

Ideas.prototype.start = function(){
    if( this.startTime === null ){
        $('#controls #playpause').addClass("active");
        this.setSliverTiming();
        this.lastFrameSliver = this.currentSliver();
        for( var _i in nodas ){
            nodas[_i].startSources( this.sliversPerSecond, this.lastFrameSliver );
        }  

        this.startTime = Date.now() - (this.lastFrameSliver / (this.sliversPerSecond/1000));    
        requestAnimationFrame(this.frame.bind(this));
    }
};

Ideas.prototype.pause = function(){
    if( this.startTime !== null){
        $('#controls #playpause').removeClass("active");
        this.startTime = null;
        this.startFrameTimestamp = null;
        nodas.map(function(noda){ noda.stopSources(); });
        for( var key in this.recordingNotes ){
            var note = this.recordingNotes[key];
            note.noda.turnOffPassiveRecording();
            if( note.container ){
                note.container.css('height',note.off-note.on+'px');
            }
        }
    }
};

Ideas.prototype.playpause = function(){
    this.startTime ? this.pause() : this.start(); 
};



Ideas.prototype.currentSliver = function(){
    return Math.ceil( this.maxBottom - this.currentBottom() );
};

Ideas.prototype.sliverFor = function(epoch){
    if( this.startTime === null ){
        return this.currentSliver();
    } else {
        return this.sliverForProgress(epoch - this.startTime);
    }
};

Ideas.prototype.sliverForProgress = function(progress){
    return Math.ceil( progress / 1000 * this.sliversPerSecond );
};


Ideas.prototype.frame = function( timestamp ){
    if( this.startTime === null ){
        return this.pause();
    }
    
    if( this.currentBottom <= this.minBottom ){
        return this.pause();
    } 
       
    if( this.startFrameTimestamp === null ){
        this.startFrameTimestamp = timestamp - (this.lastFrameSliver / (this.sliversPerSecond/1000));
    }
      
    var sliver = this.sliverForProgress(timestamp-this.startFrameTimestamp);
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
    
    requestAnimationFrame(this.frame.bind(this));
};




// Navigation

Ideas.prototype.head = function(){
    this.pause();
    this.container.css('bottom',this.maxBottom+'px');
};
Ideas.prototype.tail = function(){
    this.pause();
    this.container.css('bottom', this.minBottom+'px');
};


Ideas.prototype.advance = function(howmuch){
    this.pause();
    var currentBottom = this.currentBottom();
    var newBottom = currentBottom+(this.advanceAmount*howmuch);
    if( newBottom < this.minBottom ){
        newBottom = this.minBottom;
    } else if( newBottom > this.maxBottom){
        newBottom = this.maxBottom;
    } 
    if( newBottom !== currentBottom ){
        this.container.css('bottom', newBottom+'px');
    }
};

Ideas.prototype.incrementAdvanceBox = function(forward){
    var oldSelection = this.advanceBox.find("option:selected");
    var newSelection = (forward) ? oldSelection.prev("option") : oldSelection.next("option");
    if( newSelection.val() !== undefined ){
        oldSelection.removeAttr("selected");
        newSelection.attr("selected","selected");
        this.advanceBox.trigger("change");
    }
};




Ideas.prototype.eventControlMap = {
    //spacebar
    32: function(ides){ ides.playpause(); },
    
    // home, page, end
    33: function(ides){ ides.advance(-8); },
    34: function(ides){ ides.advance(8); },
    35: function(ides){ ides.head(); },
    36: function(ides){ ides.tail(); },
    
    // arrow keys
    // TODO: Find another use for these
    37: function(ides){ ides.incrementAdvanceBox(false); },
    38: function(ides){ ides.advance(-1); },
    39: function(ides){ ides.incrementAdvanceBox(true); },
    40: function(ides){ ides.advance(1); }
};