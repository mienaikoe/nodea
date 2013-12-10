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
            function(buffer) { console.log("Error decoding sample for "+bufferUrl); }
        );
    };
    request.send();
};

Noda.prototype.addNote = function(note){
    if( note !== null ){
        note.source = this.allocateSource();
        this.notes.push(note);
        project.timings.push(note);
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
    for( var _i in this.notes ){
        var note = this.notes[_i];
        this.deallocateSource(note.source);
        note.source = this.allocateSource();
    }
    this.lightOff('active');
};

Noda.prototype.resetSources = function(){
    for( var _i in this.notes ){
        this.notes[_i].source = this.allocateSource();
    }
};





// recording

Noda.prototype.on = function() {
    // if recording, notify ideas of new note.
    if (this.buffer && !this.src) {
        this.src = this.allocateSource();
        this.src.start(0);
        
        if( ideas.recording ){
            if( ideas.startTime !== null ){ //active recording
                ideas.noteOn(this);
                this.lightOn('recording');
            } else { // passive recording
                if( this.passiveRecording ){
                    this.turnOffPassiveRecording();
                } else {
                    ideas.noteOn(this);
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
        ideas.noteOff(this);
        this.passiveRecording = false;
        this.lightOff('recording');
};



Noda.prototype.off = function() {
    if (this.src) {
        this.deallocateSource(this.src);
        this.src = null;
        
        if( ideas.recording ){
            if( ideas.startTime !== null ){ //active recording
                ideas.noteOff(this);
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

Noda.prototype.keyCodeToAsciiMap = {
    // numbers  
    48: 48, 49: 49, 50: 50, 51: 51, 52: 52, 53: 53, 54: 54, 55: 55, 56: 56, 
    
    // uppercase latin
    65: 65, 66: 66, 67: 67, 68: 68, 69: 69, 70: 70, 71: 71, 72: 72, 73: 73, 
    74: 74, 75: 75, 76: 76, 77: 77, 78: 78, 79: 79, 80: 80, 81: 81, 82: 82, 
    83: 83, 84: 84, 85: 85, 86: 86, 87: 87, 88: 88, 89: 89, 90: 90, 
    
    // lowercase latin
    97: 65, 98: 66, 99: 67, 100: 68, 101: 69, 102: 70, 103: 71, 104: 72, 
    105: 73, 106: 74, 107: 75, 108: 76, 109: 77, 110: 78, 111: 79, 112: 80, 
    113: 81, 114: 82, 115: 83, 116: 84, 117: 85, 118: 86, 119: 87, 120: 88, 
    121: 89, 122: 90, 
    
    // punctuation
    186: 59, 188: 44, 190: 46, 191: 47
};