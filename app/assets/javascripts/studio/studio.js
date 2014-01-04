//= require_tree .

var assert = function(obj){
	return (typeof(obj) !== 'undefined' && obj !== null);
};

window.requestAnimationFrame = 
		window.requestAnimationFrame || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame ||
		window.msRequestAnimationFrame;

if( !window.requestAnimationFrame ){
	alert("It looks like your browser doesn't support this application. Please try a more modern Browser.");
}
	            
navigator.vibrate = 
		navigator.vibrate || 
		navigator.webkitVibrate || 
		navigator.mozVibrate || 
		navigator.msVibrate ||
		function(duration){};




function NodeaStudio(ideasContainer, circuitsContainer, project) {
	this.project_id = project.id;
	this.project_name = project.name;
	this.project_description = project.description;	
	this.keyset = project.keyset;
	this.saved = true;
		
	this.beats_per_minute = project.beats_per_minute;
	this.beats_per_bar = project.beats_per_bar;
	this.resetPixelTiming();
	
	// Convenience Variable for setting event handling.
	var self = this;
	
	// TODO: Don't know if i should add some global filters or effects to this and have those be configurable as well.
	this.ctx = new webkitAudioContext(); 
	
	
	// === Main UI Containers ===
	this.circuitsContainer = $(circuitsContainer).click(function(ev){ 
		self.nodas.forEach(function(noda){ 
			noda.lightOff('selected'); 
		}); 
	});

	this.ideasContainer = $(ideasContainer).bind('mousewheel', function(ev){ self.advance((ev.originalEvent.wheelDelta > 0) ? -1 : 1); });
	this.barsContainer = $('<div id="barlines"></div>').appendTo(this.ideasContainer);
	this.tracksContainer = $('<div id="tracks"></div>').appendTo(this.ideasContainer);
	
	
	// === Instantiate Nodas ===
	this.nodas = [];
	this.notes = [];
	var keyset = this.keySets[this.keyset];
	var keyContainer = $(this.circuitsContainer).find("#nodes");
	var swytcheContainer = $(this.circuitsContainer).find("#swytches");
	
	var circuitStyles = document.createElement("style");
	for( var circuitId in project.circuits){
		var circuit = project.circuits[circuitId];
		circuitStyles.appendChild(document.createTextNode(".node."+circuit.handle+"{ background-image: url('"+circuit.image+"'); }"));
	}
	document.head.appendChild(circuitStyles);
	
	var nodeRowClass = "sinistra";
	keyset.forEach(function(keySetRow){
		var keyRow = jQuery('<div/>',{class: 'nodeRow '+nodeRowClass}).appendTo(keyContainer);
		keySetRow.forEach(function(keySetKey){
			var persistedNoda = project.nodas.filter(function(noda){ return noda.ordinal === keySetKey; })[0];
			
			var circuitConstructor;
			if( persistedNoda ){
				var circuit = project.circuits[persistedNoda.circuit_id];
				circuitConstructor = window[circuit.handle];
			} else {
				persistedNoda = { id: null, ordinal: keySetKey,	notes: [] };
				circuitConstructor = Circuit;
			}
			
			var interactiveNoda = new circuitConstructor(this.ctx, persistedNoda);
			this.nodas[keySetKey] = interactiveNoda;
			interactiveNoda.noda.appendTo(keyRow).
					mousedown(function(ev){ 
						self.noteOn(interactiveNoda);
						interactiveNoda.mousedown = true; 
						ev.stopPropagation(); }).
					mouseup(function(ev){ 
						self.noteOff(interactiveNoda); 
						interactiveNoda.mousedown = false;}).
					click(function(ev){ ev.stopPropagation(); });
					
			interactiveNoda.swytche.appendTo(swytcheContainer).
					click(function(ev){
						self.nodas.forEach(function(noda){noda.lightOff('selected');});
						interactiveNoda.lightOn('selected');
						interactiveNoda.generateDrawer();
						ev.stopPropagation();
			});
			
			interactiveNoda.trackline.appendTo(this.tracksContainer);
			
			this.notes = this.notes.concat(interactiveNoda.notes);
		}, this);
		nodeRowClass = nodeRowClass === 'sinistra' ? 'dextra' : 'sinistra';
	}, this);
	
	jQuery('<div/>',{class: 'touchpad'}).appendTo(keyContainer);
	
	
	// === Event Handling ===
	$("body").keydown(function(ev) {
	    if( ev.keyCode in self.keyCodeToAsciiMap ){
			var interactiveNoda = self.nodas[self.keyCodeToAsciiMap[ev.keyCode]];
	        self.noteOn( interactiveNoda );
			interactiveNoda.keydown = true;
	    } else if( ev.keyCode in self.eventControlMap ){
	        self.eventControlMap[ev.keyCode](self);
	    } else {
			console.log(ev.keyCode);
	        return;
	    }
	    ev.preventDefault();
	}).keyup(function(ev) {
	    if( ev.keyCode in self.keyCodeToAsciiMap ){
			var interactiveNoda = self.nodas[self.keyCodeToAsciiMap[ev.keyCode]];
	        self.noteOff( interactiveNoda );
			interactiveNoda.keydown = false;
	    } else if( ev.keyCode in self.eventControlMap ){
	        // do nothing
	    } else {
	        return;
	    }
	    ev.preventDefault();
	}).mouseup(function(ev){
		self.nodas.forEach(function(noda){ if(noda.mousedown){ self.noteOff(noda); } });
	});
	
	

	// Middle Controls
	// TODO: Should these be initialized in js?
	this.advanceBox = $("#advance_box");
	this.advanceAmount = parseInt(this.advanceBox.val()) / this.beats_per_bar;
	this.advanceBox.
			change(	function(){ self.advanceAmount = parseInt(this.value) / this.beats_per_bar; });
	
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



	this.maxBottom = $(circuitsContainer).outerHeight();
	this.minBottom = 0;
	this.bar_count = 0;
	this.setBars(project.bar_count, true);
	this.setLocation(0);



	// === Animation/Timing ===
	this.startTime = null;
	this.startFrameTimestamp = null;
	this.recording = false;
	this.recordingNotes = [];
};





// Timing

NodeaStudio.prototype.pixels_per_beat = 12; // subject to change

NodeaStudio.prototype.resetPixelTiming = function(){
	this.pixels_per_bar = this.pixels_per_beat * this.beats_per_bar;
	this.pixels_per_second = (this.beats_per_minute/60) * this.pixels_per_beat;
	this.maxLocation = this.pixels_per_bar * this.bar_count;
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
	if( noda.keydown || noda.mousedown ){
		return;
	}
	noda.on();
	if( this.recording ){
		if( this.startTime !== null ){ //active recording
			this.recordingOn( noda );
		} else if( noda.passiveRecording ){
			noda.turnOffPassiveRecording();
		} else {
			noda.turnOnPassiveRecording();
			this.recordingOn( noda );
		}
	} else {
		noda.lightOn('active');
	}
};

NodeaStudio.prototype.recordingOn = function( noda ){
	var note = new Note({start: this.pixelFor(Date.now()), noda: noda});
	this.recordingNotes[noda.key] = note;
	note.createContainer();
	this.invalidateSavedStatus();
	noda.lightOn('recording');
};



NodeaStudio.prototype.noteOff = function( noda ){
	noda.off();
	if( this.recording ){
		if( this.startTime !== null ){ //active recording
			this.recordingOff(noda);
			noda.lightOff('recording');
		}
	} else {
		noda.lightOff('active');
	}
};

NodeaStudio.prototype.recordingOff = function( noda ){
	var note = this.recordingNotes[noda.key];
	if( typeof note === 'undefined' ){ 
	    return;
	}

	if( note.start === this.location ){
	    note.container.remove();
	} else {
	    note.finish = thisPixel;
	    note.container.css('height',(note.finish-note.start)+'px');
	    note.noda.addNote(note);
	    this.notes.push(note);
		this.invalidateSavedStatus();
	}

	delete this.recordingNotes[noda.key];
};








// Playback

NodeaStudio.prototype.play = function(){
	if( this.startTime === null ){
	    $('#mode_controls #playpause').addClass("active");
	    this.resetPixelTiming();
	    this.nodas.forEach(function(noda){
			noda.lightOff('active').lightOff('selected');
			noda.play( this.pixels_per_second, this.location );
		}, this);
	    this.startTime = Date.now() - (this.location / (this.pixels_per_second/1000));
		this.lastLocation = this.location;
	    requestAnimationFrame(this.frame.bind(this));
	}
};

NodeaStudio.prototype.pause = function(){
	if( this.startTime !== null){
	    $('#mode_controls #playpause').removeClass("active");
	    this.nodas.forEach(function(noda){ noda.pause(); });
		this.recordingNotes.forEach(function(note){ this.noteOff(note.noda); }, this);
		this.startTime = null;
	    this.startFrameTimestamp = null;
	}
};

NodeaStudio.prototype.playpause = function(){
	this.startTime ? this.pause() : this.play(); 
};


NodeaStudio.prototype.pixelFor = function(epoch){
	if( this.startTime === null ){
	    return this.location;
	} else {
	    return this.pixelForProgress(epoch - this.startTime);
	}
};

NodeaStudio.prototype.pixelForProgress = function(progress){
	return Math.ceil( (this.pixels_per_second/1000) * progress );
};





NodeaStudio.prototype.setLocation = function(location){
	this.location = location;
	$(this.ideasContainer).css('bottom', (-location+this.maxBottom) + 'px');
};

NodeaStudio.prototype.setBars = function(howmany, duringStartup){
	try{
		howmany = parseInt(howmany);
		if( howmany === this.bar_count ){
			return;
		}
		var difference = howmany - this.bar_count;
		this.minBottom -= difference*this.pixels_per_bar;
		this.maxLocation += difference;
		this.ideasContainer.css("height", this.maxBottom-this.minBottom+'px');

		if( howmany > this.bar_count ){
			for( var i = difference; i > 0; i--){
				var bar = $('<div/>', {class: 'bar', style: 'height: '+(this.pixels_per_bar-1)+'px;'}).appendTo(this.barsContainer);
				for( var j = this.beats_per_bar; j>0 ; j-- ){
					$('<div/>', {class: 'beat', style: 'height: '+(this.pixels_per_beat-1)+'px;'}).appendTo(bar);
				}
			}
		} else{
			this.barsContainer.find('.bar').splice(0, -difference).forEach(function(el){ el.remove(); });
		}
		this.bar_count = howmany;
		this.countBox.val(howmany);
		if(!duringStartup){
			this.invalidateSavedStatus();
		}
	} catch( ex ) {
		this.notify('Invalid Value for Count. Please Enter a Number', ex.message);
	}
	// remove notifications once notifications system is built
};

NodeaStudio.prototype.setBPM = function(value){
	try{
		this.beats_per_minute = parseInt(value);
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
	
	if( this.location >= this.maxLocation ){
	    if( this.recording ){
	        this.setBars(this.bar_count + 4);
	    } else {
	        return this.pause();
	    }
	} 
	   
	if( this.startFrameTimestamp === null ){
	    this.startFrameTimestamp = timestamp - (this.location / (this.pixels_per_second/1000));
	}
	  
	var newLocation = this.pixelForProgress(timestamp-this.startFrameTimestamp);
	
	this.setLocation(newLocation);
	
	// handle lighting
	this.notes.forEach( function(note){
	    if( note.start <= newLocation && note.start >= this.lastLocation ){
	        note.noda.lightOn('active');
	    } else if( note.finish <= newLocation && note.finish > this.lastLocation ){
	        note.noda.lightOff('active');
	    }
	}, this);
	this.recordingNotes.forEach( function(note){
		if( note.container ){ 
			note.container.css('height', newLocation-note.start+'px'); 
		}
	});

	this.lastLocation = newLocation;
	
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
	var newLocation = this.location+(this.advanceAmount*howmuch);
	if( newLocation > this.maxLocation ){
	    newLocation = this.maxLocation;
	} else if( newLocation < 0){
	    newLocation = 0;
	} 
	if( newLocation !== this.location ){
	    this.setLocation(newLocation);
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
	$('#save').addClass('warning');
};


NodeaStudio.prototype.save = function(){
	if( !this.saved ){
		$('#save').removeClass('warning').addClass('active');
		var saveObject = {
			project_id: this.project_id,
			name: this.project_name,
			description: this.project_description,
			beats_per_minute: this.beats_per_minute,
			beats_per_bar: this.beats_per_bar,
			keyset: this.keyset,
			bar_count: this.bar_count,
			nodas: this.nodas.map(function(noda){return noda.marshal();}).filter(function(noda){ return noda.handle !== 'Circuit'; })
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
				$('#save').removeClass('active').addClass('warning');
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