Oscillator.LFO = function(ctx, options){
	if(typeof options !== 'object'){
		return Oscillator.LFO.default();
	}
		
	this.destination = options.destination;
	this.strength = options.strength || 1;
		
	this.signal = ctx.createOscillator();
	this.gainer = ctx.createGain();
	
	this.signal.frequency.value = options.frequency;
	if(options.signalType){
		this.signal.type = options.signalType;
	}
	this.gainer.gain.value = options.strength;
	
	if(typeof options.bypass === 'boolean'){
		this.bypass = options.bypass;
	} else {
		this.bypass = false;
	}
	
	this.connectionTarget = null;
	
	this.signal.connect(this.gainer);
	this.signal.start(0);
};

Oscillator.LFO.default = function(ctx){
	return new Oscillator.LFO(ctx, {frequency: 3, strength: 1, destination: "volume", signalType: "sine", bypass: false});
};


Oscillator.LFO.ATTRIBUTES = {
	frequency: {min: 0.0, max: 12.0, step: 0.01, default: 3.0},
	strength: {min: 0.0, max: 1.0, step: 0.05, default: 0.8}
};

Oscillator.LFO.DESTINATIONS = ["volume","frequency"];



Oscillator.LFO.prototype.connect = function(signal){
	this.connectionTarget = signal;
	switch(this.destination){
		case "volume":
			this.gainer.gain.value = this.strength;
			if(!this.bypass){
				this.gainer.connect(signal.lfoIn.gain);
			}
			break;
		case "frequency":
			this.gainer.gain.value = this.strength*100;
			if(!this.bypass){
				this.gainer.connect(signal.detune);
			}
			break;
	}
};


Oscillator.LFO.prototype.render = function(oscContainer){
	this.container = $("<div/>",{class: "lfoContainer"}).appendTo(oscContainer);
	
	var signalTypeDiv = $("<div/>",{class:"envelope_slider"}).appendTo(this.container);
	$("<label/>",{text:"signal type"}).appendTo(signalTypeDiv);
	var signalTypeSpiv = $("<spiv/>").appendTo(signalTypeDiv);
	var signalTypeSelector = DrawerUtils.createSelector(Oscillator.SIGNAL_TYPES, this.signalType, function(value){
		this.signal.type = value;
	}.bind(this), signalTypeSpiv).addClass("medium");

	var destinationDiv = $("<div/>",{class:"envelope_slider"}).appendTo(this.container);
	$("<label/>",{text:"destination"}).appendTo(destinationDiv);
	var destinationSpiv = $("<spiv/>").appendTo(destinationDiv);
	var destinationSelector = DrawerUtils.createSelector(Oscillator.LFO.DESTINATIONS, this.destination, function(value){
		this.destination = value;
	}.bind(this), destinationSpiv).addClass("medium");
	
	var frequencySlider = DrawerUtils.createSlider("frequency", Oscillator.LFO.ATTRIBUTES.frequency, this.signal.frequency.value, function(key, value){
		this.signal.frequency.value = parseInt(value);
	}.bind(this), this.container);
	
	var strengthSlider = DrawerUtils.createSlider("strength", Oscillator.LFO.ATTRIBUTES.strength, this.strength, function(key, value){
		this.strength = parseFloat(value);
	}.bind(this), this.container);
	
	this.controls = {
		signalTypeSelector : signalTypeSelector,
		destinationSelector: destinationSelector,
		frequencySlider: frequencySlider,
		strengthSlider: strengthSlider
	};
	return this.controls;
};

Oscillator.LFO.prototype.toggleBypass = function(){
	this.bypass = !this.bypass;
	if(this.bypass){
		this.gainer.disconnect();
	} else {
		if(this.connectTarget){
			this.connect(this.connectionTarget);
		}
	}
	if( this.bypassToggler ){
		$(this.bypassToggler).html(this.bypass ? "off" : "on");
	}
	if( this.container ){
		this.container.toggleClass("bypass");
	}
};



Oscillator.LFO.prototype.marshal = function(){
	return {
		frequency: this.signal.frequency.value,
		type: this.signal.type,
		strength: this.strength,
		destination: this.destination,
		bypass: this.bypass
	};
};


Oscillator.LFO.prototype.destroy = function(){
	this.signal.disconnect();
	this.gainer.disconnect();
	delete this.signal;
	delete this.gainer;
};