//= require_tree .

var assert = function(obj){
	return (typeof(obj) !== 'undefined' && obj !== null);
};


window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
	                          window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	                  


var NodeaStudio = function(ideasContainer, circuitsContainer, project) {
	this.project = project; 
	
	// Convenience Variable for setting event handling.
	var self = this;
	
	// TODO: Don't know if i should add some global filters or effects to this and have those be configurable as well.
	this.ctx = new webkitAudioContext(); 
	
	
	
	
	// === Circuits ===
	this.circuitsContainer = $(circuitsContainer);
	this.nodas = [];
	var keySet = this.keySets[project.keySet];
	var keyContainer = $(this.circuitsContainer).find("#nodes");
	var swytcheContainer = $(this.circuitsContainer).find("#swytches");
	var swytcheClass = 'trackSwitch first';
	keySet.map(function(keySetRow){
		var keyRow = jQuery('<div/>',{class: 'nodeRow'}).appendTo(keyContainer);
		keySetRow.map(function(keySetKey){
			var character = String.fromCharCode(keySetKey);
			var noda = jQuery('<spiv/>',{class: 'node', id: 'key_'+keySetKey, html: character}).appendTo(keyRow).click(function() {
				// TODO: Create Setup Popup for This Noda
			});
			
			var swytche = jQuery('<spiv/>',{class: swytcheClass, html: character}).appendTo(swytcheContainer).click(function(){
				// TODO: not sure what to make the swytches do
			});
			swytcheClass = 'trackSwitch';
			
			var nodeNotes = [];
	        project.timings.map(function(timing){ if( timing.key === character ){nodeNotes.push(timing);} });
	        self.nodas[keySetKey] = new Noda(noda, swytche, self.ctx, nodeNotes, project.bindings[keySetKey]);
		});
	});
	
	// Event Handling
	$("body").keydown(function(ev) {
	    if( ev.keyCode in self.keyCodeToAsciiMap ){
	        var noda = self.nodas[self.keyCodeToAsciiMap[ev.keyCode]];
	        if( noda ){ noda.on(); } 
	    } else if( ev.keyCode in self.eventControlMap ){
	        self.eventControlMap[ev.keyCode](self);
	    } else {
	        return;
	    }
	    ev.preventDefault();
	}).keyup(function(ev) {
	    if( ev.keyCode in self.keyCodeToAsciiMap ){
	        var noda = self.nodas[self.keyCodeToAsciiMap[ev.keyCode]];
	        if( noda ){ noda.off(); }
	    } else if( ev.keyCode in self.eventControlMap ){
	        // do nothing
	    } else {
	        return;
	    }
	    ev.preventDefault();
	});
	
	
	
	
	// === Ideas ===
	this.ideasContainer = $(ideasContainer);
	this.ideasContainer.bind('mousewheel', function(ev){ self.advance((ev.originalEvent.wheelDelta > 0) ? -1 : 1); });
	this.tracksContainer = $('<div id="tracks"></div>').appendTo(this.ideasContainer);
	var first = true;
	for( i in this.asciiKeys ){
	    $('<spiv/>',{id: 'track_'+this.asciiKeys[i].charCodeAt(0), class:(first ? 'nodeTrack first' : 'nodeTrack')}).appendTo(this.tracksContainer);
	    first = false;
	}
	
	this.barsContainer = $('<div id="barlines"></div>').appendTo(this.ideasContainer);
	for( var _i=0; _i < project.numBeats; _i++  ){
	    jQuery('<div/>',{class: 'beat'}).prependTo(this.barsContainer);
	}

	for( _i in project.timings ){
	    this.createNoteContainer(project.timings[_i]);
	}



	// Middle Controls
	// TODO: Should these be initialized in js?
	this.advanceBox = $("#advance_box");
	this.advanceAmount = parseInt(this.advanceBox.val()) / project.beat;
	this.advanceBox.change(function(){ self.advanceAmount = parseInt(this.value) / project.beat; });
	$("#bpm_box").
	    change(     function(){ project.bpm = parseInt(this.value); } ).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });


	// Animation Timing
	this.resetSliverTiming();
	this.startTime = null;
	this.startFrameTimestamp = null;
	this.recording = false;
	this.recordingNotes = {};
	var containerHeight = (project.numBeats*this.sliversPerBeat)+1;    
	this.maxBottom = $('#circuits').outerHeight();
	this.minBottom = this.maxBottom - containerHeight;
	this.ideasContainer.css('height', containerHeight+'px' ).css('bottom', this.maxBottom+'px');
};





// Timing

NodeaStudio.prototype.framesPerSecond = 20;

NodeaStudio.prototype.resetSliverTiming = function(){
	this.sliversPerBeat = (192 / this.project.beat); // 48 for a quarter note, 24 for an eight note, ...
	this.sliversPerSecond = (this.project.bpm * this.sliversPerBeat) / 60;
};



NodeaStudio.prototype.currentBottom = function(){
	return parseFloat(this.ideasContainer.css('bottom'));
};


// Recording

NodeaStudio.prototype.toggleRecording = function(){
	this.recording = !this.recording;
	if( !this.recording ) {
	    for( _i in this.recordingNotes ){
	        this.recordingNotes[_i].noda.turnOffPassiveRecording();
	    }
	    this.recordingNotes = {};
	}
	$('#controls #record').toggleClass("active");
};

NodeaStudio.prototype.noteOn = function( noda ){
	var note = {key: noda.key, on: this.sliverFor(Date.now()), noda: noda};
	this.recordingNotes[noda.key] = note;
	this.createNoteContainer(note);
};

NodeaStudio.prototype.noteOff = function( noda ){
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
	    this.project.timings.push(note);
	}

	delete this.recordingNotes[noda.key];
};

NodeaStudio.prototype.createNoteContainer = function(note){
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

NodeaStudio.prototype.removeNoteContainer = function(note){
	note.container.remove();
};








// Playback

NodeaStudio.prototype.start = function(){
	if( this.startTime === null ){
	    $('#controls #playpause').addClass("active");
	    this.resetSliverTiming();
	    this.lastFrameSliver = this.currentSliver();
	    var self = this;
	    this.nodas.map(function(noda){ noda.startSources( self.sliversPerSecond, self.lastFrameSliver ); });
	    this.startTime = Date.now() - (this.lastFrameSliver / (this.sliversPerSecond/1000));    
	    requestAnimationFrame(this.frame.bind(this));
	}
};

NodeaStudio.prototype.pause = function(){
	if( this.startTime !== null){
	    $('#controls #playpause').removeClass("active");
	    this.startTime = null;
	    this.startFrameTimestamp = null;
	    this.nodas.map(function(noda){ noda.stopSources(); });
	    for( var key in this.recordingNotes ){
	        var note = this.recordingNotes[key];
	        note.noda.turnOffPassiveRecording();
	        if( note.container ){
	            note.container.css('height',note.off-note.on+'px');
	        }
	    }
	}
};

NodeaStudio.prototype.playpause = function(){
	this.startTime ? this.pause() : this.start(); 
};



NodeaStudio.prototype.currentSliver = function(){
	return Math.ceil( this.maxBottom - this.currentBottom() );
};

NodeaStudio.prototype.sliverFor = function(epoch){
	if( this.startTime === null ){
	    return this.currentSliver();
	} else {
	    return this.sliverForProgress(epoch - this.startTime);
	}
};

NodeaStudio.prototype.sliverForProgress = function(progress){
	return Math.ceil( progress / 1000 * this.sliversPerSecond );
};

NodeaStudio.prototype.addBars = function(howmany){
	this.minBottom -= howmany*this.sliversPerBeat;
	this.ideasContainer.css("height", this.maxBottom-this.minBottom);
	this.project.numBeats += howmany;
	while(howmany-- > 0){
	    this.barsContainer.append('<div class="beat"></div>');
	}
};


NodeaStudio.prototype.frame = function( timestamp ){
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

	
	this.ideasContainer.css('bottom', this.maxBottom-sliver+'px');
	
	// handle lighting
	var self = this;
	this.project.timings.map( function(note){
	    if( note.on <= sliver && note.on > self.lastFrameSliver ){
	        note.noda.lightOn('active');
	    } else if( note.off <= sliver && note.off > self.lastFrameSliver ){
	        note.noda.lightOff('active');
	    }
	});
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

NodeaStudio.prototype.head = function(){
	this.pause();
	this.ideasContainer.css('bottom',this.maxBottom+'px');
};
NodeaStudio.prototype.tail = function(){
	this.pause();
	this.ideasContainer.css('bottom', this.minBottom+'px');
};


NodeaStudio.prototype.advance = function(howmuch){
	this.pause();
	var currentBottom = this.currentBottom();
	var newBottom = currentBottom+(this.advanceAmount*howmuch);
	if( newBottom < this.minBottom ){
	    newBottom = this.minBottom;
	} else if( newBottom > this.maxBottom){
	    newBottom = this.maxBottom;
	} 
	if( newBottom !== currentBottom ){
	    this.ideasContainer.css('bottom', newBottom+'px');
	}
};

NodeaStudio.prototype.incrementAdvanceBox = function(forward){
	var oldSelection = this.advanceBox.find("option:selected");
	var newSelection = (forward) ? oldSelection.prev("option") : oldSelection.next("option");
	if( newSelection.val() !== undefined ){
	    oldSelection.removeAttr("selected");
	    newSelection.attr("selected","selected");
	    this.advanceBox.trigger("change");
	}
};



NodeaStudio.prototype.asciiKeys = [
	'1','2','3','4','5','6','7','8','9','0',
	'q','w','e','r','t','y','u','i','o','p',
	'a','s','d','f','g','h','j','k','l',';',
	'z','x','c','v','b','n','m',',','.','/'
];


NodeaStudio.prototype.keyCodeToAsciiMap = {
	// numbers  
	48:  48,	49:  49,	50:  50,	51:  51,	52:  52,	
	53:  53,	54:  54,	55:  55,	56:  56,	57:  57,	
	
	 // uppercase latin
	65:  97,	66:  98,	67:  99,	68:  100,	69:  101,	
	70:  102,	71:  103,	72:  104,	73:  105,	74:  106,	
	75:  107,	76:  108,	77:  109,	78:  110,	79:  111,	
	80:  112,	81:  113,	82:  114,	83:  115,	84:  116,	
	85:  117,	86:  118,	87:  119,	88:  120,	89:  121,	
	90:  122,	
	
	// lowercase latin
	97:  97,	98:  98,	99:  99,	100: 100,	101: 101,	
	102: 102,	103: 103,	104: 104,	105: 105,	106: 106,	
	107: 107,	108: 108,	109: 109,	110: 110,	111: 111,	
	112: 112,	113: 113,	114: 114,	115: 115,	116: 116,	
	117: 117,	118: 118,	119: 119,	120: 120,	121: 121,	
	122: 122,	
	
	// punctuation
	186: 59,	188: 44,	190: 46,	191: 47
};

NodeaStudio.prototype.keySets = {
	desktop: [
		// top numbers
	    [49,  50,  51,  52,  53],
	    [54,  55,  56,  57,  48],
		
		// left letters
		[113, 119, 101, 114, 116, 
		 97,  115, 100, 102, 103, 
		 122, 120, 99,  118, 98],
	 
		// right letters
	    [121, 117, 105, 111, 112, 
		 104, 106, 107, 108, 59,  
		 110, 109, 44,  46,  47]
	]	
};


NodeaStudio.prototype.eventControlMap = {
	//spacebar
	32: function(studio){ studio.playpause(); },
	
	// home, page, end
	33: function(studio){ studio.advance(-8); },
	34: function(studio){ studio.advance(8); },
	35: function(studio){ studio.head(); },
	36: function(studio){ studio.tail(); },
	
	// arrow keys
	// TODO: Find another use for these
	37: function(studio){ studio.incrementAdvanceBox(false); },
	38: function(studio){ studio.advance(-1); },
	39: function(studio){ studio.incrementAdvanceBox(true); },
	40: function(studio){ studio.advance(1); }
};