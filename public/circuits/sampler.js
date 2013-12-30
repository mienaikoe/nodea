function Sampler(ctx, persistedNoda) {
	BlankNoda.call(this, ctx, persistedNoda); // vital
	
	this.bufferUrl = persistedNoda.settings.sourceFile;
    if (!this.bufferUrl) {
        return;
    }
	
    this.resetBufferLocation();
};


// vital to Noda Creation. This Inherits the static values from BlankNoda
Sampler.prototype = Object.create(BlankNoda.prototype, {
	constructor: { value: Sampler, enumerable: false }
});



// vital
Sampler.prototype.cssClass = 'sampler';




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


Sampler.prototype.generateDrawer = function(){
	var details = this.generateDrawerBase();
	details.text("You've Chosen a Sampler. Here are the following details:");
	
	$("<div/>", {class: 'clearfix'}).appendTo(details);
	
	$("<div/>", {class: 'fieldLabel', html: 'Sample Source'}).appendTo(details);
	
	var self = this;
	var mainFields = $("<div/>", {class: "mainFields"}).appendTo(details);
	$("<textarea/>", {class: 'urlarea', html: this.bufferUrl}).appendTo(mainFields).
		change(		function(ev){ self.bufferUrl = this.value; self.resetBufferLocation(); studio.invalidateSavedStatus(); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });

	this.generateDrawerEffects();
};



Sampler.prototype.addNote = function(note){
    if( note !== null ){
        note.source = this.allocateSource();
        this.notes.push(note);
    }
};


Sampler.prototype.allocateSource = function(){
    var src = this.context.createBufferSource();
    src.buffer = this.buffer;
    src.connect(this.context.destination);
    return src;
};

Sampler.prototype.deallocateSource = function(src){
	if( src ){ 
		src.stop(0); 
		src.disconnect(0); 
	}
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
	this.turnOffPassiveRecording();
	this.resetSources();
    this.lightOff('active');
};






Sampler.prototype.resetSources = function(){
	this.notes.forEach(function(note){ 
		this.deallocateSource(note.source); 
		note.source = this.allocateSource(); 
	}, this);
};





// recording

Sampler.prototype.on = function() {
    // if recording, notify ideas of new note.
    if (this.buffer && !this.src) {
        this.src = this.allocateSource();
        this.src.start(0);
        
        if( studio.recording ){
            if( studio.startTime !== null ){ //active recording
                studio.noteOn(this);
                this.lightOn('recording');
            } else { // passive recording
                if( this.passiveRecording ){
                    this.turnOffPassiveRecording();
                } else {
                    studio.noteOn(this);
                    this.passiveRecording = true;
                    this.lightOn('recording');
                }
            }
        } else {
            this.lightOn('active');
        }
    }
};


Sampler.prototype.off = function() {
    if (this.src) {
        this.deallocateSource(this.src);
        this.src = null;
        
        if( studio.recording ){
            if( studio.startTime !== null ){ //active recording
                studio.noteOff(this);
                this.lightOff('recording');
            }
        } else {
            this.lightOff('active');
        }
    }
};







// saving

Sampler.prototype.marshalSettings = function(){
	return {
		sourceFile: this.bufferUrl
	};
};