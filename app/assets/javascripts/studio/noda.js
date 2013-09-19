var Noda = function(noda, swytche, ctx) {
    this.noda = noda;
    this.swytche = swytche;
    this.context = ctx;
};

Noda.prototype.setBuffer = function(buffer) {
    this.buffer = buffer;
};

Noda.prototype.on = function() {
    if (this.buffer && !this.src) {
        this.src = this.context.createBufferSource();
        this.src.buffer = this.buffer;
        this.src.connect(this.context.destination);
        this.src.start(0);
    }
    $(this.noda).addClass('active');
    $(this.swytche).addClass('active');
};

Noda.prototype.off = function() {
    if (this.src) {
        this.src.stop(0);
        this.src.disconnect(0);
        this.src = null;
    }
    $(this.noda).removeClass('active');
    $(this.swytche).removeClass('active');
};