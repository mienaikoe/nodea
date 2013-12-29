//= require_tree .

var assert = function(obj){
	return (typeof(obj) !== 'undefined' && obj !== null);
};


window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
	                          window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	                  


function NodeaStudio(ideasContainer, circuitsContainer, project) {
	this.project_id = project.id;
	this.project_name = project.name;
	this.project_description = project.description;
	this.bpm = project.bpm;
	this.beat = project.beat;
	this.keyset = project.keyset;
	this.beat_count = project.beat_count;
	this.saved = true;
	
	// Convenience Variable for setting event handling.
	var self = this;
	
	// TODO: Don't know if i should add some global filters or effects to this and have those be configurable as well.
	this.ctx = new webkitAudioContext(); 
	
	
	// === Containers ===
	this.circuitsContainer = $(circuitsContainer);
	this.ideasContainer = $(ideasContainer).bind('mousewheel', function(ev){ self.advance((ev.originalEvent.wheelDelta > 0) ? -1 : 1); });
	this.barsContainer = $('<div id="barlines"></div>').appendTo(this.ideasContainer);
	this.tracksContainer = $('<div id="tracks"></div>').appendTo(this.ideasContainer);
	for( var i=0; i < this.beat_count; i++  ){
	    jQuery('<div/>',{class: 'beat'}).prependTo(this.barsContainer);
	}
	
	// === Noda Iteration ===
	this.nodas = [];
	this.notes = [];
	var keyset = this.keySets[this.keyset];
	var keyContainer = $(this.circuitsContainer).find("#nodes");
	var swytcheContainer = $(this.circuitsContainer).find("#swytches");
	var nodeRowClass = "sinistra";
	keyset.forEach(function(keySetRow){
		var keyRow = jQuery('<div/>',{class: 'nodeRow '+nodeRowClass}).appendTo(keyContainer);
		keySetRow.forEach(function(keySetKey){
			var persistedNoda = project.nodas.filter(function(noda){ return noda.ordinal === keySetKey; })[0];
			
			var interactiveNoda;
			if( persistedNoda ){
				var circuit = project.circuits[persistedNoda.circuit_id];
				interactiveNoda = new window[circuit.javascript_name](this.ctx, persistedNoda);
			} else {
				interactiveNoda = new BlankNoda(keySetKey);
			}
						
			this.nodas[keySetKey] = interactiveNoda;
			interactiveNoda.noda.appendTo(keyRow);
			interactiveNoda.swytche.appendTo(swytcheContainer);
			interactiveNoda.trackline.appendTo(this.tracksContainer);
			
			this.notes = this.notes.concat(interactiveNoda.notes);
		}, this);
		nodeRowClass = nodeRowClass === 'sinistra' ? 'dextra' : 'sinistra';
	}, this);
	
	jQuery('<div/>',{class: 'touchpad'}).appendTo(keyContainer);
	
	
	// Event Handling
	$("body").keydown(function(ev) {
	    if( ev.keyCode in self.keyCodeToAsciiMap ){
	        self.nodas[self.keyCodeToAsciiMap[ev.keyCode]].on();
	    } else if( ev.keyCode in self.eventControlMap ){
	        self.eventControlMap[ev.keyCode](self);
	    } else {
			console.log(ev.keyCode);
	        return;
	    }
	    ev.preventDefault();
	}).keyup(function(ev) {
	    if( ev.keyCode in self.keyCodeToAsciiMap ){
	        self.nodas[self.keyCodeToAsciiMap[ev.keyCode]].off();
	    } else if( ev.keyCode in self.eventControlMap ){
	        // do nothing
	    } else {
	        return;
	    }
	    ev.preventDefault();
	});
	
	

	// Middle Controls
	// TODO: Should these be initialized in js?
	this.advanceBox = $("#advance_box");
	this.advanceAmount = parseInt(this.advanceBox.val()) / this.beat;
	this.advanceBox.
			change(	function(){ self.advanceAmount = parseInt(this.value) / this.beat; });
	
	this.bpmBox = $("#bpm");
	this.bpmBox.
	    change(     function(){ self.setBPM(this.value); } ).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	this.countBox = $("#count");
	this.countBox.
		change(		function(){ self.setBars(this.value); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	$('#name').
		change(		function(){ self.setName(this.value); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	$('#description').
		change(		function(){ self.setDescription(this.value); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });


	// Animation Timing
	this.resetSliverTiming();
	this.startTime = null;
	this.startFrameTimestamp = null;
	this.recording = false;
	this.recordingNotes = [];
	var containerHeight = (this.beat_count*this.sliversPerBeat)+1;    
	this.maxBottom = $('#circuits').outerHeight();
	this.minBottom = this.maxBottom - containerHeight;
	this.ideasContainer.css('height', containerHeight+'px' ).css('bottom', this.maxBottom+'px');
};





// Timing

NodeaStudio.prototype.framesPerSecond = 20;

NodeaStudio.prototype.resetSliverTiming = function(){
	this.sliversPerBeat = (192 / this.beat); // 48 slivers per beat for a quarter note, 24 for an eight note, ...
	this.sliversPerSecond = (this.bpm * this.sliversPerBeat) / 60;
};



NodeaStudio.prototype.currentBottom = function(){
	return parseFloat(this.ideasContainer.css('bottom'));
};


// Recording

NodeaStudio.prototype.toggleRecording = function(){
	this.recording = !this.recording;
	if( !this.recording ) {
		this.recordingNotes.forEach(function(note){ 
			this.noteOff(note.noda);
			note.noda.turnOffPassiveRecording();
		}, this);
	    this.recordingNotes = [];
	}
	$('#mode_controls #record').toggleClass("active");
};

NodeaStudio.prototype.noteOn = function( noda ){
	var note = new Note({start: this.sliverFor(Date.now()), noda: noda});
	this.recordingNotes[noda.key] = note;
	note.createContainer();
	this.invalidateSavedStatus();
};

NodeaStudio.prototype.noteOff = function( noda ){
	var note = this.recordingNotes[noda.key];
	if( typeof note === 'undefined' ){ 
	    return;
	}
	
	var thisSliver = this.sliverFor(Date.now());
	if( note.start === thisSliver ){
	    note.container.remove();
	} else {
	    note.finish = thisSliver;
	    note.container.css('height',(note.finish-note.start)+'px');
	    note.noda.addNote(note);
	    this.notes.push(note);
	}

	delete this.recordingNotes[noda.key];
};








// Playback

NodeaStudio.prototype.play = function(){
	if( this.startTime === null ){
	    $('#mode_controls #playpause').addClass("active");
	    this.resetSliverTiming();
	    this.lastFrameSliver = this.currentSliver();
	    this.nodas.forEach(function(noda){
			noda.lightOff('active');
			noda.play( this.sliversPerSecond, this.lastFrameSliver );
		}, this);
	    this.startTime = Date.now() - (this.lastFrameSliver / (this.sliversPerSecond/1000));    
	    requestAnimationFrame(this.frame.bind(this));
	}
};

NodeaStudio.prototype.pause = function(){
	if( this.startTime !== null){
	    $('#mode_controls #playpause').removeClass("active");
	    this.startTime = null;
	    this.startFrameTimestamp = null;
	    this.nodas.forEach(function(noda){ noda.pause(); });
		this.recordingNotes.forEach(function(note){ this.noteOff(note.noda); }, this);
	}
};

NodeaStudio.prototype.playpause = function(){
	this.startTime ? this.pause() : this.play(); 
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



NodeaStudio.prototype.setBars = function(howmany){
	try{
		howmany = parseInt(howmany);
		if( howmany === this.beat_count ){
			return;
		}
		var difference = howmany - this.beat_count;
		this.minBottom -= difference*this.sliversPerBeat;
		this.ideasContainer.css("height", this.maxBottom-this.minBottom+'px');
		if( howmany > this.beat_count ){
			for( var i = difference; i > 0; i--){
				this.barsContainer.append('<div class="beat"></div>');
			}
		} else{
			this.barsContainer.find('.beat').splice(0, -difference).forEach(function(el){ el.remove(); });
		}
		this.beat_count = howmany;
		this.countBox.val(howmany);
		this.invalidateSavedStatus();
	} catch( ex ) {
		this.notify('Invalid Value for Count. Please Enter a Number', ex.message);
	}
	// remove notifications once notifications system is built
};

NodeaStudio.prototype.setBPM = function(value){
	try{
		this.bpm = parseInt(value);
		this.invalidateSavedStatus();
	} catch( ex ){
		this.notify('Invalid Value for BPM. Please Enter a Number', ex.message);
	}
	// remove notifications once notifications system is built
};

NodeaStudio.prototype.setName = function(value){
	this.project_name = value;
	this.invalidateSavedStatus();
};

NodeaStudio.prototype.setDescription = function(value){
	this.project_description = value;
	this.invalidateSavedStatus();
};




NodeaStudio.prototype.frame = function( timestamp ){
	if( this.startTime === null ){
	    return this.pause();
	}
	
	if( this.currentBottom() <= this.minBottom ){
	    if( this.recording ){
	        this.setBars(this.beat_count + 4);
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
	this.notes.forEach( function(note){
	    if( note.start <= sliver && note.start >= this.lastFrameSliver ){
	        note.noda.lightOn('active');
	    } else if( note.finish <= sliver && note.finish > this.lastFrameSliver ){
	        note.noda.lightOff('active');
	    }
	}, this);
	this.recordingNotes.forEach( function(note){
		if( note.container ){ 
			note.container.css('height', sliver-note.start+'px'); 
		}
	});

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



// saving project

NodeaStudio.prototype.invalidateSavedStatus = function(){
	this.saved = false;
	$('#save').addClass('recording');
};


NodeaStudio.prototype.save = function(){
	if( !this.saved ){
		$('#save').removeClass('recording').addClass('active');
		var saveObject = {
			project_id: this.project_id,
			name: this.project_name,
			description: this.project_description,
			bpm: this.bpm,
			beat: this.beat,
			keyset: this.keyset,
			beat_count: this.beat_count,
			nodas: this.nodas.map(function(noda){return noda.marshal();}).filter(function(noda){ return noda.javascript_name !== 'BlankNoda'; })
		};

		var self = this;
		$.ajax({
			type: "POST",
			url: "/studio/save",
			data: JSON.stringify(saveObject),
			contentType: 'application/json; charset=utf-8',
			success: function(){
				$('#save').removeClass('active').addClass('kosher');
				setTimeout(function(){ $('#save').removeClass('kosher'); }, 3000 );
			},
			error: function(jqxhr, msg, ex){
				$('#save').removeClass('active').addClass('recording');
				self.notify("Save Failed. Please Try Again.", msg);
			}
		});
	}
};

NodeaStudio.prototype.notify = function(words, errorMessage){
	if(errorMessage !== undefined){
		console.error(errorMessage);
	}
	alert(words);
};


NodeaStudio.prototype.deleteNote = function(note){
	var idx = this.notes.indexOf(note);
	if( idx !== -1 ){
		note.removeContainer();
		this.notes.splice(idx,1);
		note.noda.deleteNote(note);
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
	40: function(studio){ studio.advance(1); },
	
	// delete key
	46: function(studio){ studio.deleteNote(studio.selectedNote); },
	
	// backspace key
	8: function(studio){ studio.deleteNote(studio.selectedNote); }
	
};