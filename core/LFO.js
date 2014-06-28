var LFO = function(ctx, options){
	if(typeof options !== 'object'){
		return LFO.default();
	}
		
	this.destination = options.destination;
	this.amplitude = options.amplitude;
		
	this.oscillator = ctx.createOscillator();
	this.gainer = ctx.createGainNode();
	
	this.oscillator.frequency.value = options.frequency;
	this.gainer.gain.value = options.amplitude;
	
	this.oscillator.connect(this.gainer);
	this.oscillator.start(0);
};

LFO.default = function(ctx){
	return new LFO(ctx, {frequency: 3, amplitude: 1, destination: "volume"});
};


LFO.ATTRIBUTES = {
	frequency: {min: 0.0, max: 12.0, step: 0.01, default: 3.0}
};



LFO.prototype.connect = function(oscillator){
	switch(this.destination){
		case "volume":
			this.gainer.connect(oscillator.gainer.gain);
			break;
		case "frequency":
			this.gainer.gain.value = this.amplitude*1000;
			this.gainer.connect(oscillator.detune);
			break;
	}
};


LFO.prototype.render = function(container){
	DrawerUtils.createSlider("LFO frequency", LFO.ATTRIBUTES.frequency, this.oscillator.frequency, function(key, value){
		this.oscillator.frequency.value = parseInt(value);
	}.bind(this), container);
};



LFO.prototype.marshal = function(){
	return {
		frequency: this.oscillator.frequency.value,
		amplitude: this.amplitude,
		destination: this.destination
	};
};


LFO.prototype.destroy = function(){
	this.oscillator.disconnect();
	this.gainer.disconnect();
	delete this.oscillator;
	delete this.gainer;
};