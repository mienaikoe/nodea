/*
 * Base Circuit
 * 
 * 
 * This class defines a Basic Circuit, which is a manager of sound creation used by Nodea Studio.
 * A Noda also manages the configuration of notes as well as their scheduling and playing that 
 * will sound on playback. Every Circuit Should Inherit from this unless it has a very good 
 * reason not to. 
 * 
 * TODO: Make an API for Circuits
 * 
 */


function BlankNoda(ctx, persistedNoda) {

	this.context = ctx;	
	
	this.id = persistedNoda.id;
	this.asciiCode = persistedNoda.ordinal;
	this.key = String.fromCharCode(this.asciiCode);
	
	var self = this;
	this.noda = jQuery('<spiv/>',{class: 'node ' + this.cssClass, id: 'key_'+this.asciiCode, html: this.key}).click(function(ev) {
		self.generateDrawer();
		ev.stopPropagation();
	});

	this.swytche = jQuery('<spiv/>',{class: 'trackSwitch ' + this.cssClass, html: this.key}).click(function(){
		// TODO: not sure what to make the swytches do
	});
	
	this.trackline = $('<spiv/>',{id: 'track_'+this.asciiCode, class:'nodeTrack'});
	
	this.notes = persistedNoda.notes.map( function(persistedNote){ 
		var studioNote = new Note(persistedNote);
		studioNote.noda = this;
		studioNote.createContainer().prependTo(this.trackline);
		return studioNote;
	}, this);
};



BlankNoda.prototype.cssClass = 'base';





// Drawers and Circuit Bindings

BlankNoda.prototype.generateDrawer = function(){
	var details = this.generateDrawerBase();
	details.text("You've Chosen a Blank Node. You may bind this node to a new circuit.");
	
	// ciruit binding select options
	
	this.generateDrawerEffects();
};

BlankNoda.prototype.generateDrawerBase = function(){
	studio.nodas.forEach(function(noda){ noda.lightOff('selected'); });
	this.lightOn('selected');
	
	var details = $("#circuit_details");
	details.empty();
	
	// Key Code
	$('<div/>', {class: ''});
	
	// Number of Notes & Usage Percent vs. other notes
	
	// Bound Circuit Details
	
	
	return details;
};

BlankNoda.prototype.generateDrawerEffects = function(){
	// If there is an Effects List, show it here.
};



BlankNoda.prototype.addNote = function(note){
    if( note !== null ){
        this.notes.push(note);
    }
};

BlankNoda.prototype.deleteNote = function(note){
	var idx = this.notes.indexOf(note);
	if( idx !== -1 ){
		this.notes.splice(idx, 1);
	}
};



// playback

BlankNoda.prototype.play = function(sliversPerSecond, startingAt){
};

BlankNoda.prototype.pause = function(){
	this.turnOffPassiveRecording();
    this.lightOff('active');
};


BlankNoda.prototype.head = function(){
};

BlankNoda.prototype.tail = function(){
};





// recording

BlankNoda.prototype.on = function() {
};

BlankNoda.prototype.turnOffPassiveRecording = function(){
	studio.noteOff(this);
	this.passiveRecording = false;
	this.lightOff('recording');
};

BlankNoda.prototype.off = function() {
};




// lighting

BlankNoda.prototype.lightOn = function(lightType){
    $(this.noda).addClass(lightType);
    $(this.swytche).addClass(lightType);
	return this;
};
BlankNoda.prototype.lightOff = function(lightType){
    $(this.noda).removeClass(lightType);
    $(this.swytche).removeClass(lightType);
	return this;
};

BlankNoda.prototype.lightsOut = function(){
    $(this.noda).removeClass('active').removeClass('recording').removeClass('selected');
    $(this.swytche).removeClass('active').removeClass('recording').removeClass('selected');
	return this;
};







// saving

BlankNoda.prototype.marshal = function(){
	return {
		javascript_name: this.constructor.name,
		ordinal: this.asciiCode,
		notes: this.notes.map( function(note){return {start: note.start, finish: note.finish};} ),
		settings: this.marshalSettings()
	};
};

BlankNoda.prototype.marshalSettings = function(){
	return {};
};