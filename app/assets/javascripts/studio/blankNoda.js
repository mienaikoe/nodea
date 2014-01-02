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
	this.noda = jQuery('<spiv/>',{class: 'node ' + this.constructor.name, id: 'key_'+this.asciiCode, html: this.key}).click(function(ev) {
		self.generateDrawer();
		ev.stopPropagation();
	});

	this.swytche = jQuery('<spiv/>',{class: 'trackSwitch ' + this.constructor.name, html: this.key}).click(function(){
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





// Drawers and Circuit Bindings

BlankNoda.prototype.generateDrawer = function(){
	studio.nodas.forEach(function(noda){ noda.lightOff('selected'); });
	this.lightOn('selected');
	
	var detailsElement = $("#circuit_details");
	detailsElement.empty();
	
	// TODO: Add Key Code
	// TODO: Other useful data
	
	
	// Overriden
	this.generateDrawerSettings(detailsElement);
	

	
	// TODO: Effects
};

BlankNoda.prototype.generateDrawerSettings = function(detailsElement){	
	detailsElement.text("You've Chosen a Blank Node. You may bind this node to a new circuit.");
	
	// TODO: ciruit binding select options
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



// recording

BlankNoda.prototype.on = function() {
	this.keydown = true;
};

BlankNoda.prototype.off = function() {
	this.keydown = false;
};



BlankNoda.prototype.turnOnPassiveRecording = function(){
	this.passiveRecording = true;
};

BlankNoda.prototype.turnOffPassiveRecording = function(){
	this.passiveRecording = false;
	this.lightOff('recording');
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
		handle: this.constructor.name,
		ordinal: this.asciiCode,
		notes: this.notes.map( function(note){return {start: note.start, finish: note.finish};} ),
		settings: this.marshalSettings()
	};
};

BlankNoda.prototype.marshalSettings = function(){
	return {};
};