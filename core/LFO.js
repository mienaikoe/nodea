var LFO = function(ctx, options){
	if(typeof options !== 'object'){
		return LFO.default();
	}
		
	this.destination = options.destination;
	this.strength = options.strength || 1;
		
	this.oscillator = ctx.createOscillator();
	this.gainer = ctx.createGainNode();
	
	this.oscillator.frequency.value = options.frequency;
	this.oscillator.type = "sine";//options.signalType;
	this.gainer.gain.value = options.strength;
	
	this.oscillator.connect(this.gainer);
	this.oscillator.start(0);
};

LFO.default = function(ctx){
	return new LFO(ctx, {frequency: 3, strength: 1, destination: "volume", signalType: "sine"});
};


LFO.ATTRIBUTES = {
	frequency: {min: 0.0, max: 12.0, step: 0.01, default: 3.0},
	strength: {min: 0.0, max: 1.0, step: 0.05, default: 0.8}
};

LFO.DESTINATIONS = ["volume","frequency"];



LFO.prototype.connect = function(oscillator){
	switch(this.destination){
		case "volume":
			this.gainer.gain.value = this.strength;
			this.gainer.connect(oscillator.lfoIn.gain);
			break;
		case "frequency":
			this.gainer.gain.value = this.strength*100;
			this.gainer.connect(oscillator.detune);
			break;
	}
};


LFO.prototype.render = function(container){
	var destinationContainer = $("<spiv/>").appendTo(container);
	DrawerUtils.createSelector(LFO.DESTINATIONS, this.destination, function(value){
		this.destination = value;
	}.bind(this), destinationContainer);
	$("<div/>",{class:"thicket", text: "DESTINATION"}).appendTo(destinationContainer);
	
	var signalTypeContainer = $("<spiv/>").appendTo(container);
	DrawerUtils.createSelector(Oscillator.SIGNAL_TYPES, this.signalType, function(value){
		this.oscillator.type = value;
	}.bind(this), signalTypeContainer);
	$("<div/>",{class:"thicket", text: "SIGNAL TYPE"}).appendTo(signalTypeContainer);
	
	DrawerUtils.createSlider("frequency", LFO.ATTRIBUTES.frequency, this.oscillator.frequency, function(key, value){
		this.oscillator.frequency.value = parseInt(value);
	}.bind(this), container);
	DrawerUtils.createSlider("strength", LFO.ATTRIBUTES.strength, this.strength, function(key, value){
		this.strength = parseFloat(value);
	}.bind(this), container);
};



LFO.prototype.marshal = function(){
	return {
		frequency: this.oscillator.frequency.value,
		type: this.oscillator.type,
		strength: this.strength,
		destination: this.destination
	};
};


LFO.prototype.destroy = function(){
	this.oscillator.disconnect();
	this.gainer.disconnect();
	delete this.oscillator;
	delete this.gainer;
};