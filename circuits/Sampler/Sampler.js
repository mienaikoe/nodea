function Sampler(ctx, persistedNoda, circuitReplacementCallback) {
	Circuit.call(this, ctx, persistedNoda, circuitReplacementCallback);
	
	/* The order and timing of setting and note extraction is up to you.
	 */
	this.extractSettings(persistedNoda.settings);
	
	var self = this;
	this.resetBufferLocation(function(){
		self.extractNotes(persistedNoda.notes);
	});
};


// vital to Noda Creation. This Inherits the static values from Circuit
Sampler.prototype = Object.create(Circuit.prototype, {
	constructor: { value: Sampler, enumerable: false }
});



Sampler.prototype.extractSettings = function(settings){
	if(settings){
		if( settings.sourceFile ){
			this.bufferUrl = settings.sourceFile;
		}
	}

	if( !this.bufferUrl ){
		this.bufferUrl = 'circuits/Sampler/samplers/Vibe_A3.wav';
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
            function() { console.log("Error decoding sample for "+this.bufferUrl); }
        );
    };
    request.send();
};


Sampler.prototype.generateCircuitBody = function(circuitBody){
	var self = this;
	$(circuitBody).find("#Sampler-Source").
		text(this.bufferUrl).
		change(	function(ev){ 
			self.bufferUrl = this.value; 
			self.resetBufferLocation(); 
			studio.invalidateSavedStatus(); 
		});
			
	/*
	$("<div/>", {class: 'fieldLabel', html: 'Sample Source'}).appendTo(divisionBody);
	var self = this;
	var mainFields = $("<div/>", {class: "mainFields"}).appendTo(divisionBody);
	$("<textarea/>", {class: 'urlarea', html: this.bufferUrl}).appendTo(mainFields).
		change(		function(ev){ self.bufferUrl = this.value; self.resetBufferLocation(); studio.invalidateSavedStatus(); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	*/
};



Sampler.prototype.addNote = function(note){
	Circuit.prototype.addNote.call(this, note);
	note.source = this.allocateSource();
};

Sampler.prototype.deleteNote = function(note){ // not sure if needed
	this.deallocateSource(note.source);
	Circuit.prototype.deleteNote.call(this, note);
};

Sampler.prototype.allocateSource = function(){
    var src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.connect(this.ctx.destination);
    return src;
};

Sampler.prototype.deallocateSource = function(src){
	if(src){ src.disconnect(0); }
};





// playback

Sampler.prototype.play = function(pixelsPerSecond, startingAt){
    var startTime = this.ctx.startTime;
    this.notes.forEach( function(note){
        if( note.start >= startingAt ){
            note.source.start(((note.start-startingAt)/pixelsPerSecond)+startTime);
            note.source.stop(((note.finish-startingAt)/pixelsPerSecond)+startTime);
        }
    });
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

Sampler.prototype.on = function() {
	Circuit.prototype.on.call(this);
    if (this.buffer && !this.src) {
        this.src = this.allocateSource();
        this.src.start(0);
    }
};


Sampler.prototype.off = function() {
	Circuit.prototype.off.call(this);
    if (this.src) {
        this.deallocateSource(this.src);
        this.src = null;
    }
};







// saving

Sampler.prototype.marshalSettings = function(){
	return {
		sourceFile: this.bufferUrl
	};
};