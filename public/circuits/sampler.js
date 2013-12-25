var Sampler = function(ctx, persistedNoda) {
	
    this.context = ctx;	
	this.asciiCode = persistedNoda.ordinal;
	this.key = String.fromCharCode(this.asciiCode);
	
	this.noda = jQuery('<spiv/>',{class: 'node', id: 'key_'+this.asciiCode, html: this.key}).click(function() {
		// TODO: Create Setup Popup for This Noda
	});

	this.swytche = jQuery('<spiv/>',{class: 'trackSwitch', html: this.key}).click(function(){
		// TODO: not sure what to make the swytches do
	});
	
	this.trackline = $('<spiv/>',{id: 'track_'+this.asciiCode, class:'nodeTrack'});
	
        
    this.notes = persistedNoda.notes;
    for( var ni in this.notes ){
        this.notes[ni].noda = this;
    }

	var bufferUrl = persistedNoda.settings.sourceFile;
    if (!bufferUrl) {
        return;
    }
	
    var self = this;
    var request = new XMLHttpRequest();
    request.open("GET", bufferUrl, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        self.context.decodeAudioData(
            request.response,
            function(buffer) { 
                console.log('Setting Buffer for '+self.key);
                self.buffer = buffer; 
                self.resetSources();
            },
            function() { console.log("Error decoding sample for "+bufferUrl); }
        );
    };
    request.send();
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
    src.onended = function(){console.log('allocation complete');};
    return src;
};

Sampler.prototype.deallocateSource = function(src){
    src.stop(0);
    src.disconnect(0);
};





// playback

Sampler.prototype.startSources = function(sliversPerSecond, startingAt){
    var startTime = this.context.currentTime;
    this.notes.map( function(note){
        if( note.start >= startingAt ){
            note.source.start(((note.start-startingAt)/sliversPerSecond)+startTime);
            note.source.stop(((note.finish-startingAt)/sliversPerSecond)+startTime);
        }
    });
};

Sampler.prototype.stopSources = function(){
	var self = this;
    this.notes.map(function(note){ 
	    self.deallocateSource(note.source);
        note.source = self.allocateSource();
	});
    this.lightOff('active');
};

Sampler.prototype.resetSources = function(){
	var self = this;
	this.notes.map(function(note){ note.source = self.allocateSource(); });
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


Sampler.prototype.turnOffPassiveRecording = function(){
        studio.noteOff(this);
        this.passiveRecording = false;
        this.lightOff('recording');
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
    $(this.noda).addClass(lightType);
    $(this.swytche).addClass(lightType);
};
Sampler.prototype.lightOff = function(lightType){
    $(this.noda).removeClass(lightType);
    $(this.swytche).removeClass(lightType);
};

Sampler.prototype.lightsOut = function(){
    $(this.noda).removeClass('active').removeClass('recording');
    $(this.swytche).removeClass('active').removeClass('recording');
};

