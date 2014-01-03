function Sampler(ctx, persistedNoda) {
	Circuit.call(this, ctx, persistedNoda); // vital
	
	this.bufferUrl = persistedNoda.settings.sourceFile;
    if (!this.bufferUrl) {
        return;
    }
	
    this.resetBufferLocation();
};


// vital to Noda Creation. This Inherits the static values from Circuit
Sampler.prototype = Object.create(Circuit.prototype, {
	constructor: { value: Sampler, enumerable: false }
});




Sampler.prototype.resetBufferLocation = function(){
	var self = this;
    var request = new XMLHttpRequest();
    request.open("GET", this.bufferUrl, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        self.context.decodeAudioData(
            request.response,
            function(buffer) { 
                console.log('Setting Buffer for '+self.key);
                self.buffer = buffer; 
                self.resetSources();
            },
            function() { console.log("Error decoding sample for "+this.bufferUrl); }
        );
    };
    request.send();
};


Sampler.prototype.generateDrawerSettings = function(detailsElement){
	detailsElement.text("You've Chosen a Sampler. Here are the following details:");
	
	$("<div/>", {class: 'clearfix'}).appendTo(detailsElement);
	
	$("<div/>", {class: 'fieldLabel', html: 'Sample Source'}).appendTo(detailsElement);
	
	var self = this;
	var mainFields = $("<div/>", {class: "mainFields"}).appendTo(detailsElement);
	$("<textarea/>", {class: 'urlarea', html: this.bufferUrl}).appendTo(mainFields).
		change(		function(ev){ self.bufferUrl = this.value; self.resetBufferLocation(); studio.invalidateSavedStatus(); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
};



Sampler.prototype.addNote = function(note){
	Circuit.prototype.addNote.call(this, note);
	note.source = this.allocateSource();
};


Sampler.prototype.allocateSource = function(){
    var src = this.context.createBufferSource();
    src.buffer = this.buffer;
    src.connect(this.context.destination);
    return src;
};

Sampler.prototype.deallocateSource = function(src){
	if(src){ src.stop(0); src.disconnect(0); }
};





// playback

Sampler.prototype.play = function(sliversPerSecond, startingAt){
    var startTime = this.context.currentTime;
    this.notes.forEach( function(note){
        if( note.start >= startingAt ){
            note.source.start(((note.start-startingAt)/sliversPerSecond)+startTime);
            note.source.stop(((note.finish-startingAt)/sliversPerSecond)+startTime);
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