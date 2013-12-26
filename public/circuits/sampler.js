function Sampler(ctx, persistedNoda) {
	
	// Vital to Noda Creation. Does some basic logic so that you can get right to the Noda-Specific Items.
	this.initialize(ctx, persistedNoda);
	
	this.noda.attr('style', 'background-color:#eb3;');
	
	this.bufferUrl = persistedNoda.settings.sourceFile;
    if (!this.bufferUrl) {
        return;
    }
	
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


// Vital to Noda Creation. This Inherits the prototype of a Blank Noda
Sampler.prototype = Object.create(BlankNoda.prototype, {
	constructor: { value: Sampler, enumerable: false }
});


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







// lighting

Sampler.prototype.lightOn = function(lightType){
    $(this.noda).addClass(lightType).attr('style','background-color:#fc4;');
    $(this.swytche).addClass(lightType);
};
Sampler.prototype.lightOff = function(lightType){
    $(this.noda).removeClass(lightType).attr('style','background-color:#eb3;');
    $(this.swytche).removeClass(lightType);
};









// saving

Sampler.prototype.marshalSettings = function(){
	return {
		sourceFile: this.bufferUrl
	};
};