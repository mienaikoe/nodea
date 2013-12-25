var BlankNoda = function(asciiCode) {
	
	this.asciiCode = asciiCode;
	this.key = String.fromCharCode(this.asciiCode);
	
	this.noda = jQuery('<spiv/>',{class: 'node', id: 'key_'+this.asciiCode, html: this.key}).click(function() {
		// TODO: Create Setup Popup for This BlankNoda
	});

	this.swytche = jQuery('<spiv/>',{class: 'trackSwitch', html: this.key}).click(function(){
		// TODO: not sure what to make the swytches do
	});
	
	this.trackline = $('<spiv/>',{id: 'track_'+this.asciiCode, class:'nodeTrack'});
	
        
    this.notes = [];
};

BlankNoda.prototype.addNote = function(note){
    if( note !== null ){
        this.notes.push(note);
    }
};



// playback

BlankNoda.prototype.startSources = function(sliversPerSecond, startingAt){
};

BlankNoda.prototype.stopSources = function(){
};

BlankNoda.prototype.resetSources = function(){
};





// recording

BlankNoda.prototype.on = function() {
};

BlankNoda.prototype.turnOffPassiveRecording = function(){
};

BlankNoda.prototype.off = function() {
};



