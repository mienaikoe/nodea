function Sampler(ctx, machine, marshaledCircuit, destination, circuitReplacementCallback) {
	Circuit.call(this, ctx, machine, marshaledCircuit, destination, circuitReplacementCallback);
		
	var self = this;
	DelayedLoad.loadBuffer(this.bufferUrl, function(buffer){
		self.buffer = buffer; 
        self.resetSources();
		self.bindBufferToNotes();
	});
};


// vital to Noda Creation. This Inherits the static values from Circuit
Sampler.extends(Circuit);



Sampler.prototype.extractSettings = function(settings){
	Circuit.prototype.extractSettings.call(this, settings);
	
	this.playEntire = false;
	
	if(settings){
		if( settings.sourceFile ){
			this.bufferUrl = settings.sourceFile;
		}
		if( settings.playEntire ){
			this.playEntire = settings.playEntire;
		}
	}

	if( !this.bufferUrl ){
		this.bufferUrl = 'circuits/Sampler/samples/Vibe_A3.wav';
	}
};


Sampler.prototype.generateCircuitBody = function(circuitBody){
	var self = this;
	$(circuitBody).find("#Sampler-Source").
		text(this.bufferUrl).
		change(	function(ev){ 
			self.bufferUrl = this.value; 
			DelayedLoad.loadBuffer(self.bufferUrl, function(buffer){
                self.buffer = buffer; 
                self.resetSources();
			}); 
			studio.invalidateSavedStatus(); 
		}); // TODO: Make this more foolproof.
		
	$(circuitBody).find("#Sampler-Entire").
		attr("checked", self.playEntire).
		change(function(ev){
			self.playEntire = this.checked;
			$(this).blur();
			studio.invalidateSavedStatus();
		});
};



Sampler.prototype.bindBufferToNotes = function(){
	try{ 
		this.notes.forEach(function(note){
			note.source = this.allocateSource(); 
			note.source.connect(note.envelope);
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
    return src;
};

Sampler.prototype.deallocateSource = function(src){
	if(src){ src.disconnect(0); }
};





// playback


Sampler.prototype.scheduleCircuitStart = function(startWhen, note){
	var delayTime = Circuit.prototype.scheduleCircuitStart.call(this, startWhen, note);
	note.source.started = startWhen + delayTime; 	
	note.source.start(note.source.started);
	return delayTime;
};

Sampler.prototype.scheduleCircuitStop = function(endWhen, note){
	var delayTime;
	if(this.playEntire){
		wholeEnd = note.source.started + this.buffer.duration;
		Circuit.prototype.scheduleCircuitStop.call(this, wholeEnd - this.envelopeAttributes.release, note);
		note.source.stop(wholeEnd);
		delayTime = wholeEnd - endWhen;
	} else {
		delayTime = Circuit.prototype.scheduleCircuitStop.call(this, endWhen, note);
		note.source.stop(endWhen + delayTime);
	}
	return delayTime;
};

Sampler.prototype.pause = function(){
	Circuit.prototype.pause.call(this);
	this.resetSources();
};






Sampler.prototype.resetSources = function(){
	this.notes.forEach(function(note){ 
		this.deallocateSource(note.source); 
		note.source = this.allocateSource(); 
		note.source.connect(note.envelope);
	}, this);
};





// recording

Sampler.prototype.on = function(location) {
	Circuit.prototype.on.call(this, location);
	this.source = this.allocateSource();
	this.envelope = this.allocateEnvelope();
	this.source.connect(this.envelope);
	this.scheduleCircuitStart(this.ctx.currentTime, {source: this.source, envelope: this.envelope});
};


Sampler.prototype.off = function(location) {
	Circuit.prototype.off.call(this, location);
	if (this.source && this.envelope) {
		var targetSource = this.source;
		var targetEnvelope = this.envelope;
		delayTime = this.scheduleCircuitStop(this.ctx.currentTime, {source: targetSource, envelope: targetEnvelope});
		var self = this;
		window.setTimeout(function(){
			self.deallocateSource(targetSource);
		}, delayTime*1000);
	}
};




// saving

Sampler.prototype.marshalSettings = function(){
	return {
		sourceFile: this.bufferUrl,
		playEntire: this.playEntire
	};
};