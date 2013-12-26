function BlankNoda(asciiCode) {
	this.initialize(null, {
		id: null,
		ordinal: asciiCode,
		notes: []
	});
};

BlankNoda.prototype.initialize = function(ctx, persistedNoda){
	this.context = ctx;	
	
	this.id = persistedNoda.id;
	this.asciiCode = persistedNoda.ordinal;
	this.key = String.fromCharCode(this.asciiCode);
	
	this.noda = jQuery('<spiv/>',{class: 'node', id: 'key_'+this.asciiCode, html: this.key}).click(function() {
		// TODO: Create Setup Popup for This Noda
	});

	this.swytche = jQuery('<spiv/>',{class: 'trackSwitch', html: this.key}).click(function(){
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

BlankNoda.prototype.addNote = function(note){
    if( note !== null ){
        this.notes.push(note);
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
	this.passiveRecording = false;
	this.lightOff('recording');
};

BlankNoda.prototype.off = function() {
};




// lighting

BlankNoda.prototype.lightOn = function(lightType){
    $(this.noda).addClass(lightType);
    $(this.swytche).addClass(lightType);
};
BlankNoda.prototype.lightOff = function(lightType){
    $(this.noda).removeClass(lightType);
    $(this.swytche).removeClass(lightType);
};

BlankNoda.prototype.lightsOut = function(){
    $(this.noda).removeClass('active').removeClass('recording');
    $(this.swytche).removeClass('active').removeClass('recording');
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