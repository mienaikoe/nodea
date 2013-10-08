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
    src.onended = function(){console.log('ended');};
    return src;
};

Noda.prototype.deallocateSource = function(src){
    src.stop(0);
    src.disconnect(0);
};





// playback

Noda.prototype.startSources = function(sliversPerSecond, startingAt){
    var startTime = this.context.currentTime;
    for( var _i in this.notes ){
        var note = this.notes[_i];
        if( note.on >= startingAt ){
            note.source.start((note.on/sliversPerSecond)+startTime);
            note.source.stop((note.off/sliversPerSecond)+startTime);
        }
    }
};

Noda.prototype.stopSources = function(){
    for( var _i in this.notes ){
        var note = this.notes[_i];
        this.deallocateSource(note.source);
        note.source = null;
    }
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