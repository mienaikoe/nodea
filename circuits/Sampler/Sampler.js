function Sampler(ctx, persistedNoda, circuitReplacementCallback) {
	Circuit.call(this, ctx, persistedNoda, circuitReplacementCallback);
	
	/* The order and timing of setting and note extraction is up to you.
	 */
	this.extractSettings(persistedNoda.settings);
	this.extractNotes(persistedNoda.notes);
	
	var self = this;
	this.resetBufferLocation(function(){
		self.bindBufferToNotes();
	});
};


// vital to Noda Creation. This Inherits the static values from Circuit
Sampler.prototype = Object.create(Circuit.prototype, {
	constructor: { value: Sampler, enumerable: false }
});



Sampler.prototype.extractSettings = function(settings){
	Circuit.prototype.extractSettings.call(this, settings);
	
	this.recordEntire = false;
	
	if(settings){
		if( settings.sourceFile ){
			this.bufferUrl = settings.sourceFile;
		}
		if( settings.recordEntire ){
			this.recordEntire = settings.recordEntire;
		}
	}

	if( !this.bufferUrl ){
		this.bufferUrl = 'circuits/Sampler/samples/Vibe_A3.wav';
	}
};



Sampler.prototype.resetBufferLocation = function(callback){
	var self = this;
    var request = new XMLHttpRequest();
    request.open("GET", this.bufferUrl, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        self.ctx.decodeAudioData(
            request.response,
            function(buffer) { 
                console.log('Setting Buffer for '+self.key);
                self.buffer = buffer; 
                self.resetSources();
				callback.call(self);
            },
            function() { 
				console.log("Error decoding sample for "+this.bufferUrl); 
			}
        );
    };
	try{
		request.send();
	} catch(err) { // Not working...
		console.error("Error when trying to fetch Buffer Source");
		console.error(err);
		callback.call(self);
	}
};


Sampler.prototype.generateCircuitBody = function(circuitBody){
	var self = this;
	$(circuitBody).find("#Sampler-Source").
		text(this.bufferUrl).
		change(	function(ev){ 
			self.bufferUrl = this.value; 
			self.resetBufferLocation(); 
			studio.invalidateSavedStatus(); 
		}); // TODO: Make this more foolproof.
		
	$(circuitBody).find("#Sampler-Entire").
		attr("checked", self.recordEntire).
		change(function(ev){
			self.recordEntire = this.checked;
		});
};



Sampler.prototype.bindBufferToNotes = function(){
	try{ 
		this.notes.forEach(function(note){
			note.source = this.allocateSource(); 
		}, this);
	} catch (exception) {
		console.error("Error Allocating Source: ");
		console.error(exception);
	}
};

Sampler.prototype.deleteNote = function(note){ // not sure if needed
	this.deallocateSource(note.source);
	Circuit.prototype.deleteNote.call(this, note);
};

Sampler.prototype.allocateSource = function(){
    var src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.connect(this.destination);
    return src;
};

Sampler.prototype.deallocateSource = function(src){
	if(src){ src.disconnect(0); }
};





// playback


Sampler.prototype.scheduleCircuitStart = function(startWhen, note){
	note.source.start(startWhen+this.chain.start(startWhen));
};

Sampler.prototype.scheduleCircuitStop = function(endWhen, note){
	note.source.stop(endWhen+this.chain.stop(endWhen));
};

Sampler.prototype.pause = function(){
	Circuit.prototype.pause.call(this);
	this.resetSources();
};






Sampler.prototype.resetSources = function(){
	this.notes.forEach(function(note){ 
		this.deallocateSource(note.source); 
		note.source = this.allocateSource(); 
	}, this);
};





// recording

Sampler.prototype.on = function(location) {
	Circuit.prototype.on.call(this, location);
	this.src = this.allocateSource();
	this.scheduleCircuitStart(this.chain.start(this.ctx.currentTime), {source: this.src});
};


Sampler.prototype.off = function(location) {
	Circuit.prototype.off.call(this, location);
    if (this.src) {
		var targetSrc = this.src;
		var curTime = this.ctx.currentTime;
		var delayTime = this.chain.stop(curTime);
		
		this.scheduleCircuitStop(curTime+delayTime, {source: targetSrc});
		
		var self = this;
		window.setTimeout(function(){
			self.deallocateSource(targetSrc);
		}, delayTime*1000);
    }
};




// saving

Sampler.prototype.marshalSettings = function(){
	return {
		sourceFile: this.bufferUrl
	};
};