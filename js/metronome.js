var Metronome = function(ctx, button, bpm){
	this.ctx = ctx;
	var gainNode = this.ctx.createGainNode();
	gainNode.gain.value = 0.1;
	gainNode.connect(this.ctx.destination);
	this.destination = gainNode;
	
	this.button = button;
	this.armed = false;
	this.oscillators = [];
	
	this.setBPM(bpm);
};


Metronome.prototype.toggleArmament = function(){
	if(this.armed){
		this.armed = false;
		this.button.removeClass('active');
	} else {
		this.armed = true;
		this.button.addClass('active');
	}
	
	if( this.ctx.startTime ){
		this.toggle();
	} 
};


Metronome.prototype.toggle = function(){
	if( this.interval ){
		this.stop();
	} else {
		this.start();
	}
};

Metronome.prototype.start = function(){
	if( this.armed && !this.interval ){
		this.scheduleMetronome();
		var self = this;
		this.interval = setInterval(function(){ self.scheduleMetronome(); }, 40);
	}
	return this;
};


Metronome.prototype.stop = function(){
	if( this.interval ){
		clearInterval(this.interval);
		this.interval = null;
		this.reset();
	}
};

Metronome.prototype.reset = function(){
	this.resetting = true;
	this.oscillators.forEach(function(osc){osc.stop(0);});
	this.oscillators = [];
	this.resetting = false;
};


Metronome.prototype.setBPM = function(bpm){
	var newStartTime = this.ctx.startTime ? (this.ctx.startTime + ((this.oscillators.length-1)*this.seconds_between_beats)) : null;
	this.reset(newStartTime);
	this.seconds_between_beats = 60/bpm;
};

Metronome.prototype.scheduleMetronome = function(){
	if(this.resetting){ return; }
	
	var metroStart = this.ctx.startTime + (this.oscillators.length * this.seconds_between_beats);
	while( metroStart < this.ctx.currentTime + 2 ){ // if scheduled to play 2 seconds in the future or previous
		var oscillator = this.ctx.createOscillator();
		oscillator.type = "sine";
		oscillator.frequency.value = 1000;
		oscillator.connect(this.destination);

		oscillator.start(metroStart);
		oscillator.stop(metroStart + .024);
		
		this.oscillators.push(oscillator);
		this.ticksScheduled++;
		
		metroStart += this.seconds_between_beats;
	}
};