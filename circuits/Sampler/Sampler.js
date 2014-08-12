function Sampler(ctx, machine, marshaledCircuit, destination, circuitReplacementCallback) {
	Circuit.call(this, ctx, machine, marshaledCircuit, destination, circuitReplacementCallback);
	this.setBuffer(this.bufferUrl);
};


// vital to Noda Creation. This Inherits the static values from Circuit
Sampler.extends(Circuit);

Sampler.templateHTML = "<div id=\"Sampler\">\
    <div class=\"fieldLabel\">Sample Source</div>\
    <div class=\"mainFields\">\
        <textarea id=\"Sampler-Source\" class=\"urlarea\"></textarea>\
        <input id=\"Sampler-Entire\" type=\"checkbox\"></input>\
        <label>Play Entire Note</label>\
    </div>\
</div>";


Sampler.prototype.extractSettings = function(settings){
	Circuit.prototype.extractSettings.call(this, settings);
	
	this.playEntire = false;
	
	if(settings){
		if( settings.sourceFile ){
			this.bufferUrl = settings.sourceFile;
		}
		if( settings.bufferUrl ){
			this.bufferUrl = settings.bufferUrl;
		}
		if( settings.playEntire ){
			this.playEntire = settings.playEntire;
		}
	}
};


Sampler.prototype.generateCircuitBody = function(circuitBody){
	var self = this;
	$(circuitBody).find("#Sampler-Source").
		text(this.bufferUrl).
		change(	function(ev){ 
			self.setBuffer(this.value);
		}); // TODO: Make this more foolproof.
		
	$(circuitBody).find("#Sampler-Entire").
		attr("checked", self.playEntire).
		change(function(ev){
			self.playEntire = this.checked;
			$(this).blur();
			studio.invalidateSavedStatus();
		});
};


Sampler.prototype.setBuffer = function(bufferUrl){	
	if( bufferUrl ){
		this.bufferUrl = bufferUrl; 
		this.ctx.fetchBuffer(this.bufferUrl).then(
			function(buffer){
				this.buffer = buffer; 
				this.resetSources();
				this.bindBufferToNotes();
			}.bind(this), 
			function(err){
				console.error(err);
				this.unsetBuffer();
			}.bind(this)); 
	} else {
		this.unsetBuffer();
	}
	if(studio){
		studio.invalidateSavedStatus(); 
	}
};

Sampler.prototype.unsetBuffer = function(){
	this.bufferUrl = null;
	this.buffer = null;
	this.resetSources();
	this.bindBufferToNotes();
};



Sampler.prototype.bindBufferToNotes = function(){
	try{ 
		this.notes.forEach(function(note){
			if( this.buffer ){
				note.source = this.allocateSource(); 
				note.source.connect(note.envelope);
			} else {
				note.source = null;
			}
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
	if(note.source){
		note.source.started = startWhen + delayTime; 	
		note.source.start(note.source.started);
	}
	return delayTime;
};

Sampler.prototype.scheduleCircuitStop = function(endWhen, note){
	var delayTime;
	if(!note.source){
		delayTime = Circuit.prototype.scheduleCircuitStop.call(this, endWhen, note);
	} else if(this.playEntire){
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
		if(this.buffer){
			note.source = this.allocateSource(); 
			note.source.connect(note.envelope);
		}
	}, this);
};





// recording

Sampler.prototype.on = function(location) {
	Circuit.prototype.on.call(this, location);
	if(this.buffer){
		this.source = this.allocateSource();
		this.envelope = this.allocateEnvelope();
		this.source.connect(this.envelope);
		this.scheduleCircuitStart(this.ctx.currentTime, {source: this.source, envelope: this.envelope});
	}
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
		bufferUrl: this.bufferUrl,
		playEntire: this.playEntire
	};
};