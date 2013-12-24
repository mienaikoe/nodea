var Noda = function(noda, swytche, ctx, notes, bufferUrl) {
    this.noda = noda;
    this.swytche = swytche;
    this.key = $(swytche).text();
    this.context = ctx;
    
    this.notes = notes;
    for( var ni in notes ){
        notes[ni].noda = this;
    }

    if (!bufferUrl) {
        return;
    } 
    var thisNoda = this;
    var request = new XMLHttpRequest();
    request.open("GET", bufferUrl, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        thisNoda.context.decodeAudioData(
            request.response,
            function(buffer) { 
                console.log('Setting Buffer for '+thisNoda.key);
                thisNoda.buffer = buffer; 
                thisNoda.resetSources();
            },
            function() { console.log("Error decoding sample for "+bufferUrl); }
        );
    };
    request.send();
};

Noda.prototype.addNote = function(note){
    if( note !== null ){
        note.source = this.allocateSource();
        this.notes.push(note);
    }
};


Noda.prototype.allocateSource = function(){
    var src = this.context.createBufferSource();
    src.buffer = this.buffer;
    src.connect(this.context.destination);
    src.onended = function(){console.log('allocation complete');};
    return src;
};

Noda.prototype.deallocateSource = function(src){
    src.stop(0);
    src.disconnect(0);
};





// playback

Noda.prototype.startSources = function(sliversPerSecond, startingAt){
    var startTime = this.context.currentTime;
    this.notes.map( function(note){
        if( note.on >= startingAt ){
            note.source.start(((note.on-startingAt)/sliversPerSecond)+startTime);
            note.source.stop(((note.off-startingAt)/sliversPerSecond)+startTime);
        }
    });
};

Noda.prototype.stopSources = function(){
	var self = this;
    this.notes.map(function(note){ 
	    self.deallocateSource(note.source);
        note.source = self.allocateSource();
	});
    this.lightOff('active');
};

Noda.prototype.resetSources = function(){
	var self = this;
	this.notes.map(function(note){ note.source = self.allocateSource(); });
};





// recording

Noda.prototype.on = function() {
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


Noda.prototype.turnOffPassiveRecording = function(){
        studio.noteOff(this);
        this.passiveRecording = false;
        this.lightOff('recording');
};



Noda.prototype.off = function() {
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

Noda.prototype.lightOn = function(lightType){
    $(this.noda).addClass(lightType);
    $(this.swytche).addClass(lightType);
};
Noda.prototype.lightOff = function(lightType){
    $(this.noda).removeClass(lightType);
    $(this.swytche).removeClass(lightType);
};

Noda.prototype.lightsOut = function(){
    $(this.noda).removeClass('active').removeClass('recording');
    $(this.swytche).removeClass('active').removeClass('recording');
};





// event helpers

