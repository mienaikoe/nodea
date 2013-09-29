var Noda = function(noda, swytche, ctx, notes, bufferUrl) {
    this.noda = noda;
    this.swytche = swytche;
    this.ascii = $(swytche).text();
    this.context = ctx;
    this.notes = notes;
    

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





Noda.prototype.startSources = function(secPerSliver){
    var startTime = this.context.currentTime;
    for( var _i in this.notes ){
        var note = this.notes[_i];
        note.source.start((note.start*secPerSliver)+startTime);
        note.source.stop((note.end*secPerSliver)+startTime);
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





Noda.prototype.on = function() {
    if (this.buffer && !this.src) {
        this.src = this.allocateSource();
        this.src.start(0);
    }
    $(this.noda).addClass('active');
    $(this.swytche).addClass('active');
};

Noda.prototype.off = function() {
    if (this.src) {
        this.deallocateSource(this.src);
        this.src = null;
    }
    $(this.noda).removeClass('active');
    $(this.swytche).removeClass('active');
};