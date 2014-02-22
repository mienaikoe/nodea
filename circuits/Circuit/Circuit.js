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


function Circuit(ctx, persistedNoda, circuitReplacementCallback) {
	this.ctx = ctx;	
	this.persistedNoda = persistedNoda;
	this.circuitReplacementCallback = circuitReplacementCallback;
	
	this.handle = this.constructor.name;
	this.id = persistedNoda.id;
	this.asciiCode = persistedNoda.ordinal;
	this.key = String.fromCharCode(this.asciiCode);
	
	this.noda = jQuery('<spiv/>',{class: 'node ' + this.handle, id: 'key_'+this.asciiCode, html: this.key});
	this.swytche = jQuery('<spiv/>',{class: 'trackSwitch ' + this.handle, html: this.key});
	this.trackline = $('<spiv/>',{id: 'track_'+this.asciiCode, class:'nodeTrack'});
	
	this.notes = [];
	
	this.chain = new EffectsChain(this.ctx, this.ctx.destination);
	this.destination = this.chain.input;
};


Circuit.prototype.extractSettings = function(settings){
};

Circuit.prototype.extractNotes = function(notes){
	notes.forEach( function(persistedNote){ 
		var studioNote = new Note(persistedNote);
		studioNote.noda = this;
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
	// Overriden
	if( this.constructor !== Circuit ){
		this.generateCircuitDivision(DrawerUtils.createDivision(circuitSection, this.handle));
		
		var effectsSection = DrawerUtils.createSection(detailsElement, "Effects");
		// TODO: Fill out Effects Section based on persisted node
		this.chain.render(effectsSection);
	}
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
		var circuitBody = $(data).appendTo(divisionBody);
		$(circuitBody).
			keydown(    function(ev){ ev.stopPropagation(); }).
			keyup(      function(ev){ ev.stopPropagation(); });
	
		self.generateCircuitBody.call(self,circuitBody);
	});
};

Circuit.prototype.generateCircuitBody = function(circuitBody){	
};








Circuit.prototype.addNote = function(note){
    if( note !== null ){
        this.notes.push(note);
    }
};

Circuit.prototype.deleteNote = function(note){
	var idx = this.notes.indexOf(note);
	if( idx !== -1 ){
		this.notes.splice(idx, 1);
	}
};



// playback

Circuit.prototype.play = function(sliversPerSecond, startingAt){
};

Circuit.prototype.pause = function(){
	this.turnOffPassiveRecording();
    this.lightOff('active');
};



// recording

Circuit.prototype.on = function() {
	navigator.vibrate(10);
};

Circuit.prototype.off = function() {
	navigator.vibrate(10);
};



Circuit.prototype.turnOnPassiveRecording = function(){
	this.passiveRecording = true;
};

Circuit.prototype.turnOffPassiveRecording = function(){
	this.passiveRecording = false;
	this.lightOff('recording');
};






// lighting

Circuit.prototype.lightOn = function(lightType){
    $(this.noda).addClass(lightType);
    $(this.swytche).addClass(lightType);
	return this;
};
Circuit.prototype.lightOff = function(lightType){
    $(this.noda).removeClass(lightType);
    $(this.swytche).removeClass(lightType);
	return this;
};

Circuit.prototype.lightsOut = function(){
    $(this.noda).removeClass('active').removeClass('recording').removeClass('selected');
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
	return {};
};


Circuit.circuitsManifest = [
	"",
	"Sampler",
	"Oscillator"
];