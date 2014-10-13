function Sampler(ctx, machine, marshaledCircuit, destination, circuitReplacementCallback) {
	Circuit.call(this, ctx, machine, marshaledCircuit, destination, circuitReplacementCallback);
	this.setBuffer(this.bufferUrl);
};


// vital to Noda Creation. This Inherits the static values from Circuit
Sampler.extends(Circuit);

Sampler.templateHTML = "<div id='Sampler'>\
    <div class='fieldLabel'>Sample Source</div>\
    <div class='mainFields'>\
        <textarea id='Sampler-Source' class='urlarea'></textarea>\
		<div id='Sampler-SourceValid'></div> \
    </div>\
	<div class='mainFields'>\
		<label>entire</label>\
		<input id='Sampler-Entire' type='checkbox'></input>\
	<div>\
	<div class='mainFields'>\
		<label>window</label>\
		<input id='Sampler-Start' type='number' min='0' max='1' step-'0.01'></input>\
		<input id='Sampler-Stop' type='number' min='-1' max='0' step-'0.01'></input>\
	<div>\
</div>";


Sampler.prototype.extractSettings = function(settings){
	Circuit.prototype.extractSettings.call(this, settings);
	
	this.playEntire = false;
	this.start = 0;
	this.stop = 0;
	
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
		if( assert(settings.start) ){
			this.start = settings.start;
		}
		if( assert(settings.stop) ){
			this.stop = settings.stop;
		}
	}	
};


Sampler.prototype.generateCircuitBody = function(circuitDivision){
	var circuitBody = Circuit.prototype.generateCircuitBody.call(this, circuitDivision);
	
	var self = this;
	this.controls.source = $(circuitBody).find("#Sampler-Source").
		text(this.bufferUrl).
		change(	function(ev){ 
			self.setBuffer(this.value);
		});
		
	this.controls.valid = $(circuitBody).find("#Sampler-SourceValid");
	this.validateBuffer();
		
	this.controls.entire = $(circuitBody).find("#Sampler-Entire").
		attr("checked", self.playEntire).
		on("change", function(ev){
			self.playEntire = this.checked;
			$(this).blur();
			studio.invalidateSavedStatus();
		});
		
	this.controls.start = $(circuitBody).find("#Sampler-Start").
		val(this.start).
		on("change", function(ev){
			self.start = parseFloat(this.value);
		});
		
	this.controls.stop = $(circuitBody).find("#Sampler-Stop").
		val(this.stop).
		on("change", function(ev){
			self.stop = parseFloat(this.value);
		});
		
	return circuitBody;
};


Sampler.prototype.setBuffer = function(bufferUrl){	
	if( bufferUrl ){
		this.ctx.fetchBuffer(bufferUrl).then(
			function(buffer){
				this.bufferUrl = bufferUrl; 
				this.buffer = buffer; 
				this.bufferChanged();
			}.bind(this), 
			function(err){
				console.error(err);
				this.bufferUrl = null;
				this.buffer = null;
				this.bufferChanged();
			}.bind(this)); 
	} else {
		this.bufferUrl = null;
		this.buffer = null;
		this.bufferChanged();
	}
	if(studio){
		studio.invalidateSavedStatus(); 
	}
};

Sampler.prototype.bufferChanged = function(){
	this.resetSources();
	this.bindBufferToNotes();
	this.validateBuffer();
};

Sampler.prototype.validateBuffer = function(){
	if(!(this.controls && this.controls.valid)){
		return;
	}
	if( this.buffer ){
		this.controls.valid.text("valid").attr("class","valid");
	} else {
		this.controls.valid.text("invalid").attr("class","invalid");
	}
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
Sampler.prototype.canPlayback = function(){
	return assert(this.buffer);
};


Sampler.prototype.scheduleCircuitStart = function(startWhen, note){
	if( !note.source ){
		return false;
	}
	var delayTime = Circuit.prototype.scheduleCircuitStart.call(this, startWhen, note);
	note.source.started = startWhen + delayTime;
	var duration = note.source.buffer.duration - this.start + this.stop;
	note.source.start(note.source.started, this.start, duration );
	return delayTime;
};

Sampler.prototype.scheduleCircuitStop = function(endWhen, note){
	if( !note.source ){
		return false;
	}
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
		if(this.buffer){
			note.source = this.allocateSource(); 
			note.source.connect(note.envelope);
		}
	}, this);
};





// recording

Sampler.prototype.on = function(location) {
	if( Circuit.prototype.on.call(this, location) ){
		this.source = this.allocateSource();
		this.envelope = this.allocateEnvelope();
		this.source.connect(this.envelope);
		this.scheduleCircuitStart(this.ctx.currentTime, {source: this.source, envelope: this.envelope});
		return true;
	} else {
		return false;
	}
};


Sampler.prototype.off = function(location) {
	if( Circuit.prototype.off.call(this, location) ){
		var targetSource = this.source;
		var targetEnvelope = this.envelope;
		delayTime = this.scheduleCircuitStop(this.ctx.currentTime, {source: targetSource, envelope: targetEnvelope});
		var self = this;
		window.setTimeout(function(){
			self.deallocateSource(targetSource);
		}, delayTime*1000);
		return true;
	} else {
		return false;
	}
};




// saving

Sampler.prototype.marshalSettings = function(){
	return {
		bufferUrl: this.bufferUrl,
		playEntire: this.playEntire,
		start: this.start,
		stop: this.stop
	};
};