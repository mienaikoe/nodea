function Sampler(ctx, machine, marshaledCircuit, destination, circuitReplacementCallback) {
	Circuit.call(this, ctx, machine, marshaledCircuit, destination, circuitReplacementCallback);
	
	this.dynamicNote = new Note({noda: this});
	
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
	startWhen += this.chain.start(startWhen);
	note.source.start(startWhen);
	note.started = startWhen; 	
};

Sampler.prototype.scheduleCircuitStop = function(endWhen, note){
	if(this.playEntire){
		endWhen = note.started + this.buffer.duration;
	} 
	endWhen += this.chain.stop(endWhen);
	
	
	var targetSrc = note.source;
	targetSrc.stop(endWhen);
			
	var self = this;
	window.setTimeout(function(){
		self.deallocateSource(targetSrc);
	}, endWhen*1000);
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
	this.dynamicNote.source = this.allocateSource();
	this.scheduleCircuitStart(this.ctx.currentTime, this.dynamicNote);
};


Sampler.prototype.off = function(location) {
	Circuit.prototype.off.call(this, location);
    if (this.dynamicNote.source) {
		this.scheduleCircuitStop(this.ctx.currentTime, this.dynamicNote);
    }
};




// saving

Sampler.prototype.marshalSettings = function(){
	return {
		sourceFile: this.bufferUrl,
		playEntire: this.playEntire
	};
};