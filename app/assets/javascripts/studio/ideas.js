var Ideas = function() {
    
    this.container = $("#ideas");
    this.container.bind('mousewheel', function(ev){ ideas.advance((ev.originalEvent.wheelDelta > 0) ? -1 : 1); });
    
    // Create Notes Panel
    this.tracksContainer = $('<div id="tracks"></div>').appendTo(this.container);
    var first = true;
    for( i in this.asciiKeys ){
        $('<spiv/>',{id: 'track_'+this.asciiKeys[i].charCodeAt(0), class:(first ? 'nodeTrack first' : 'nodeTrack')}).appendTo(this.tracksContainer);
        first = false;
    }
    
    this.barsContainer = $('<div id="barlines"></div>').appendTo(this.container);
    for( var _i=0; _i < project.numBeats; _i++  ){
        jQuery('<div/>',{class: 'beat'}).prependTo(this.barsContainer);
    }

    for( _i in project.timings ){
        this.createNoteContainer(project.timings[_i]);
    }

    // Middle Controls
    this.advanceBox = $("#advance_box");
    this.advanceAmount = parseInt(this.advanceBox.val()) / project.beat;
    this.advanceBox.change(function(){ ideas.advanceAmount = parseInt(this.value) / project.beat; });
    
    // Timing
    this.setSliverTiming();
    this.startTime = null;
    this.startFrameTimestamp = null;
    this.recording = false;
    this.recordingNotes = {};
    var containerHeight = (project.numBeats*this.sliversPerBeat)+1;    
    this.maxBottom = $('#circuits').outerHeight();
    this.minBottom = this.maxBottom - containerHeight;
    this.container.css('height', containerHeight+'px' ).css('bottom', this.maxBottom+'px');

    // Event Handling
    $("body").keydown(function(ev) {
        if( ev.keyCode in Ideas.prototype.keyCodeToAsciiMap ){
            var noda = nodas[Ideas.prototype.keyCodeToAsciiMap[ev.keyCode]];
            if( noda ){ noda.on(); } 
        } else if( ev.keyCode in Ideas.prototype.eventControlMap ){
            Ideas.prototype.eventControlMap[ev.keyCode](ideas);
        } else {
            return;
        }
        ev.preventDefault();
    }).keyup(function(ev) {
        if( ev.keyCode in Ideas.prototype.keyCodeToAsciiMap ){
            var noda = nodas[Ideas.prototype.keyCodeToAsciiMap[ev.keyCode]];
            if( noda ){ noda.off(); }
        } else if( ev.keyCode in Ideas.prototype.eventControlMap ){
            // do nothing
        } else {
            return;
        }
        ev.preventDefault();
    });

    $("#bpm_box").
        change(     function(){ project.bpm = parseInt(this.value) } ).
        keydown(    function(ev){ ev.stopPropagation(); }).
        keyup(      function(ev){ ev.stopPropagation(); });

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
    if( !this.recording ) {
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

Ideas.prototype.addBars = function(howmany){
    this.minBottom -= howmany*this.sliversPerBeat;
    this.container.css("height", this.maxBottom-this.minBottom);
    project.numBeats += howmany;
    while(howmany-- > 0){
        this.barsContainer.append('<div class="beat"></div>');
    }
};


Ideas.prototype.frame = function( timestamp ){
    if( this.startTime === null ){
        return this.pause();
    }
    
    if( this.currentBottom() <= this.minBottom ){
        if( this.recording ){
            this.addBars(4);
        } else {
            return this.pause();
        }
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



Ideas.prototype.asciiKeys = [
    '1','2','3','4','5','6','7','8','9','0',
    'q','w','e','r','t','y','u','i','o','p',
    'a','s','d','f','g','h','j','k','l',';',
    'z','x','c','v','b','n','m',',','.','/'
];


Ideas.prototype.keyCodeToAsciiMap = {
    // numbers  
    48: 48, 49: 49, 50: 50, 51: 51, 52: 52, 53: 53, 54: 54, 55: 55, 56: 56, 
    
    // uppercase latin
    65: 65, 66: 66, 67: 67, 68: 68, 69: 69, 70: 70, 71: 71, 72: 72, 73: 73, 
    74: 74, 75: 75, 76: 76, 77: 77, 78: 78, 79: 79, 80: 80, 81: 81, 82: 82, 
    83: 83, 84: 84, 85: 85, 86: 86, 87: 87, 88: 88, 89: 89, 90: 90, 
    
    // lowercase latin
    97: 65, 98: 66, 99: 67, 100: 68, 101: 69, 102: 70, 103: 71, 104: 72, 
    105: 73, 106: 74, 107: 75, 108: 76, 109: 77, 110: 78, 111: 79, 112: 80, 
    113: 81, 114: 82, 115: 83, 116: 84, 117: 85, 118: 86, 119: 87, 120: 88, 
    121: 89, 122: 90, 
    
    // punctuation
    186: 59, 188: 44, 190: 46, 191: 47
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