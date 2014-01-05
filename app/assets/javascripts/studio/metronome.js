var Metronome = function(ctx, button, bpm_input){
	var self = this;
	
	this.ctx = ctx;
	this.button = button;
	this.oscillators = [];
	
	this.bpm_input = bpm_input;
	this.bpm_input.change(function(){self.updateBPM();});
	self.updateBPM();
};

Metronome.prototype.toggle = function(){
	var self = this;
	if( this.start ){
		clearInterval(this.interval);
		this.oscillators.forEach(function(osc){osc.stop(0);});
		this.oscillators = [];
		this.start = null;
		this.button.removeClass("active");
	} else {
		this.start = this.ctx.currentTime;
		this.scheduleMetronome();
		this.interval = setInterval(function(){ self.scheduleMetronome(); }, 10);
		this.button.addClass("active");
	}
	return this;
};

Metronome.prototype.reset = function(){
	this.resetting = true;
	this.oscillators.forEach(function(osc){osc.stop(0);});
	this.oscillators = [];
	this.start = this.ctx.currentTime;
	this.resetting = false;
};


Metronome.prototype.updateBPM = function(){
	try{
		var bpm = parseInt(this.bpm_input.val());
		this.reset();
		this.seconds_between_beats = 60/bpm;
	} catch( ex ) {
		console.error("Invalid BPM Value", ex.message);
	}
};

Metronome.prototype.scheduleMetronome = function(){
	if(this.resetting){ return; }
	
	var thisStart = this.start + (this.oscillators.length * this.seconds_between_beats);
	while( thisStart < this.ctx.currentTime + 2 ){ // if scheduled to play 2 seconds in the future or previous
		var oscillator = this.ctx.createOscillator();
		oscillator.type = "sine";
		oscillator.frequency.value = 1000;
		oscillator.connect(this.ctx.destination);
				
		oscillator.start(thisStart);
		oscillator.stop(thisStart + .020);
		
		this.oscillators.push(oscillator);
		this.ticksScheduled++;
		
		thisStart += this.seconds_between_beats;
	}
	
	if(this.oscillators.length > 20 ){
		var excess = this.oscillators.splice(0,1);
		if( excess && excess.length > 0 ){ excess[0].disconnect(0); }
	}
};