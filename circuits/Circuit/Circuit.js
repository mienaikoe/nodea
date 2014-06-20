/*
 * Circuit
 * 
 * 
 * This class defines a Basic Circuit, which is a manager of sound creation used by Nodea Studio.
 * A Noda also manages the configuration of notes as well as their scheduling and playing that 
 * will sound on playback. Every Circuit Should Inherit from this unless it has a very good 
 * reason not to. 
 * 
 * 
 */


function Circuit(ctx, machine, marshaledCircuit, destination, circuitReplacementCallback) {
	this.ctx = ctx;	
	this.machine = machine;
	this.marshaledCircuit = marshaledCircuit;
	this.circuitReplacementCallback = circuitReplacementCallback;
	
	this.handle = this.constructor.name;
	this.id = marshaledCircuit.id;
	this.asciiCode = marshaledCircuit.ordinal;
	this.key = String.fromCharCode(this.asciiCode);
	
	this.trackline = machine.studio.tracks[this.asciiCode];
	this.swytche = machine.studio.swytches[this.asciiCode];
	
	this.container = jQuery('<spiv/>',{class: 'circuit ' + this.handle, id: 'key_'+this.asciiCode, html: this.key});
	
	this.notes = [];
	this.recordingNote = null;
			
	this.envelopeAttributes = {};
	for( key in Circuit.ENVELOPE_ATTRIBUTES){
		this.envelopeAttributes[key] = Circuit.ENVELOPE_ATTRIBUTES[key].default;
	}
	this.envelopeAttributes.volume = Circuit.GAIN_ATTRIBUTES.volume.default;
	
	this.chain = new EffectsChain(this.ctx, destination, "circuits");
	this.destination = this.chain.input;
	
	this.extractSettings(marshaledCircuit.settings);
	this.extractNotes(marshaledCircuit.notes);	
};


Circuit.GAIN_ATTRIBUTES = {
	volume:		{min: 0.00, max: 1.00, step: 0.05,	default: 0.80}
};

Circuit.ENVELOPE_ATTRIBUTES = {	
	attack:		{min: 0.00, max: 2.00, step: 0.05,	default: 0.05},
	decay:		{min: 0.00, max: 2.00, step: 0.05,	default: 0.05},
	sustain:	{min: 0.00, max: 1.00, step: 0.05,	default: 0.20},
	release:	{min: 0.00, max: 2.00, step: 0.05,	default: 0.10}
};


Circuit.prototype.extractChain = function(settings){
	if( settings.chain ){
		this.chain.load(settings.chain);
	} else {
		this.chain.load([{type:"Envelope", attack:0.1, decay:0.1, sustain:0.1, release:0.1}]);
	}
};


Circuit.prototype.extractSettings = function(settings){
	if( settings ){
		this.extractChain(settings);
	}
};

Circuit.prototype.extractNotes = function(notes){
	notes.forEach( function(persistedNote){ 
		var studioNote = new Note(persistedNote);
		studioNote.envelope = this.allocateEnvelope();
		studioNote.circuit = this;
		studioNote.createContainer().prependTo(this.trackline);
		this.addNote(studioNote);
		return studioNote;
	}, this);
};



// Drawers and Circuit Bindings

Circuit.prototype.generateDrawer = function(){	
	var detailsElement = $("#circuit_controls");
	detailsElement.empty();
	
	var circuitSection = DrawerUtils.createSection(detailsElement, this.handle);
	this.generateGeneralDivision(DrawerUtils.createDivision(circuitSection, "General"));
	if( this.constructor !== Circuit ){
		this.generateCircuitDivision(DrawerUtils.createDivision(circuitSection, this.handle));
	}
	this.generateEnvelopeDivision(DrawerUtils.createDivision(circuitSection, "Envelope"));
	
	this.chain.render( DrawerUtils.createSection(detailsElement, "Effects") );
	
	DrawerUtils.activateDrawerToggles($("#circuit_drawer"));
};

Circuit.prototype.generateGeneralDivision = function(divisionBody){		
	// TODO: Add Key Code
	// TODO: Other useful data
	
	var selector = $("<select/>").appendTo(divisionBody);
	Circuit.circuitsManifest.forEach(function(circuitName){
		$("<option/>",{
			html: circuitName, 
			value: circuitName,
			selected: (this.handle === circuitName)
		}).appendTo(selector);
	}, this);
	
	var commiter = $("<button>Change</button>").appendTo(divisionBody);
	var self = this;
	$(commiter).click(function(){
		if( $(selector).val()){
			self.circuitReplacementCallback(self, $(selector).val());
		}
	});
};


Circuit.prototype.generateCircuitDivision = function(divisionBody) {
	var self = this;
	$.get("circuits/"+this.handle+"/"+this.handle+".html",null,function(data){
		self.circuitBody = $(data).appendTo(divisionBody);
		self.circuitBody.
			keydown(    function(ev){ ev.stopPropagation(); }).
			keyup(      function(ev){ ev.stopPropagation(); });
	
		self.generateCircuitBody.call(self,self.circuitBody);
	});
};

Circuit.prototype.generateEnvelopeDivision = function(divisionBody){
	for(key in Circuit.GAIN_ATTRIBUTES){
		var attributes = Circuit.GAIN_ATTRIBUTES[key];
		var changer = function(key, value){
			this.envelopeAttributes[key] = value;
			studio.invalidateSavedStatus();
		};
		this.createSlider(key, attributes, this.envelopeAttributes[key], changer, divisionBody);
	}
	
	for(key in Circuit.ENVELOPE_ATTRIBUTES){
		var attributes = Circuit.ENVELOPE_ATTRIBUTES[key];
		var changer = function(key, value){
			this.envelopeAttributes[key] = value;
			studio.invalidateSavedStatus();
		};
		this.createSlider(key, attributes, this.envelopeAttributes[key], changer, divisionBody);
	}
};

Circuit.prototype.createSlider = function(key, attributes, value, changer, division){
	var self = this;
	var sliderBox = $("<div>",{class:"envelope_slider"}).appendTo(division);
	$("<label>"+key+"</label>").appendTo(sliderBox);
	$("<input/>", $.extend({type:'range', value: value, id: this.id+'_slider_'+key}, attributes)).
		appendTo(sliderBox).
		change(function(){
			changer.call(self, key, parseFloat(this.value));
		});
};




Circuit.prototype.generateCircuitBody = function(circuitBody){	
};

Circuit.prototype.isDisplaying = function(){
	return this.circuitBody && this.circuitBody.closest("html").length > 0;
};



Circuit.prototype.allocateEnvelope = function(){
	var envelope = this.ctx.createGainNode();
	envelope.gain.value = 0;
	envelope.connect(this.destination);
	return envelope;
};

// Note Manipulation

Circuit.prototype.addNoteNoUndo = function(note){
	if( note !== null ){
		this.notes.push(note);
		if( !note.container ){ 
			note.createContainer(); 
		}
	}
};

Circuit.prototype.addNote = function(note){
	this.addNoteNoUndo(note);
	
	var self = this;
	studio.pushUndoRedo(
		function(){self.deleteNoteNoUndo(note);}, 
		function(){self.addNoteNoUndo(note);}
	);
};




Circuit.prototype.deleteNoteNoUndo = function(note){
	note.envelope.disconnect(0);
	var idx = this.notes.indexOf(note);
	if( idx !== -1 ){
		this.notes.splice(idx, 1);
		if(note.container){ 
			note.container.remove();
			note.container = null;
		}
	}
};

Circuit.prototype.deleteNote = function(note){
	this.deleteNoteNoUndo(note);
	
	var self = this;
	studio.pushUndoRedo(
		function(){self.addNoteNoUndo(note);}, 
		function(){self.deleteNoteNoUndo(note);}
	);
};






// playback

Circuit.prototype.play = function(pixelsPerSecond, startingAt){
    var startTime = this.ctx.startTime;
    this.notes.forEach( function(note){
        if( note.start >= startingAt ){
			var startWhen = ((note.start-startingAt)/pixelsPerSecond)+startTime;
			var endWhen = ((note.finish-startingAt)/pixelsPerSecond)+startTime;
            this.scheduleCircuitStart(startWhen, note);
			this.scheduleCircuitStop(endWhen, note);
        }
    }, this);
};


Circuit.prototype.scheduleCircuitStart = function(startWhen, note){
	var gain = note.envelope.gain;
	var attributes = this.envelopeAttributes;
	gain.setValueAtTime(gain.value, startWhen);
	gain.linearRampToValueAtTime(attributes.volume, startWhen + attributes.attack);
	gain.linearRampToValueAtTime(attributes.sustain*attributes.volume, startWhen + attributes.attack + attributes.decay);
	return this.chain.start(startWhen);
};

Circuit.prototype.scheduleCircuitStop = function(endWhen, note){
	var release = this.envelopeAttributes.release;
	note.envelope.gain.linearRampToValueAtTime(0.0, endWhen + release);
	return release + this.chain.stop(endWhen);
};


Circuit.prototype.pause = function(){
    this.lightOff('active');
};



// recording

Circuit.prototype.on = function(location) {
	if(location){
		this.recordingNote = new Note({start: location, circuit: this});
		this.recordingNote.envelope = this.allocateEnvelope();
		this.recordingNote.createContainer();
		this.lightOn('recording');
	} else {
		this.lightOn('active');
	}
	
	navigator.vibrate(10);
};

Circuit.prototype.off = function(location) {
	if(location && this.recordingNote !== null){
		var note = this.recordingNote;
		if( note.start > location ){
			note.container.remove();
		} else {
			if( note.start === location ){
				location++;
			}
			note.newFinishNoUndo(location);
			this.addNote(note);
		}
		this.recordingNote = null;
		this.lightOff('recording');
	} else {
		this.lightOff('active');
	}
};




Circuit.prototype.frame = function( location ){
	var note = this.recordingNote;
	if( note !== null && note.container ){ 
		note.container.css('height', location-note.start+'px'); 
	}
};








// lighting

Circuit.prototype.lightOn = function(lightType){
    $(this.container).addClass(lightType);
    $(this.swytche).addClass(lightType);
	return this;
};
Circuit.prototype.lightOff = function(lightType){
    $(this.container).removeClass(lightType);
    $(this.swytche).removeClass(lightType);
	return this;
};

Circuit.prototype.lightsOut = function(){
    $(this.container).removeClass('active').removeClass('recording').removeClass('selected');
    $(this.swytche).removeClass('active').removeClass('recording').removeClass('selected');
	return this;
};







// saving

Circuit.prototype.marshal = function(){
	return {
		handle: this.handle,
		ordinal: this.asciiCode,
		notes: this.notes.map( function(note){return {start: note.start, finish: note.finish};} ),
		settings: this.marshalSettings()
	};
};

Circuit.prototype.marshalSettings = function(){
	return {
		chain: this.chain.marshal()
	};
};


Circuit.circuitsManifest = [
	"",
	"Sampler",
	"Oscillator"
];