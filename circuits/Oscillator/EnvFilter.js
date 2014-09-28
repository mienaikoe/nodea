Oscillator.EnvFilter = function(ctx, oscillator, options){
	if(typeof options !== 'object'){
		return Oscillator.EnvFilter.default();
	}
		
	this.biquadder = ctx.createBiquadFilter();
	this.biquadder.filter_type = options.filter_type || 'lowpass';
	this.frequency = options.frequency || Oscillator.EnvFilter.FILTER_ATTRIBUTES.frequency.default;
	this.Q = assert(options.Q) ? options.Q : Oscillator.EnvFilter.FILTER_ATTRIBUTES.Q.default;
	this.oscillator = oscillator;
	switch(this.biquadder.filter_type){
		case 'lowpass':
		case 'lowshelf':
			this.biquadder.frequency = Filter.MAX_FREQ; // is set down with envelope
			this.biquadder.Q = this.Q;
			break;
		case 'highpass':
		case 'highshelf':
			this.biquadder.frequency = 0; // is set up with envelope
			this.biquadder.Q = this.Q;
			break;
		default:
			this.biquadder.frequency = this.frequency;
			this.biquadder.Q = Filter.MAX_Q; // is set out with envelope
	};
	
	this.bypasser = ctx.createPassthrough(); // TODO: Doesn't work
	if(typeof options.bypass === 'boolean'){
		this.bypass = options.bypass;
	} else {
		this.bypass = false;
	}
	
	this.input = this.output = (this.bypass ? this.bypasser : this.biquadder);
	
	for( var key in Filter.ENVELOPE_ATTRIBUTES){
		this[key] = assert(options[key]) ? options[key] : Filter.ENVELOPE_ATTRIBUTES[key].default;
	}
};

Oscillator.EnvFilter.FILTER_ATTRIBUTES = {
	frequency: { // frequency really represents the multiplier since this is keyboard-tracked.
		min: 0,	
		max: 2, 
		step: .05,	
		default: 1
	},
	Q: Filter.FILTER_ATTRIBUTES.Q
};

Oscillator.EnvFilter.default = function(ctx, oscillator){
	return new Oscillator.EnvFilter(ctx, oscillator, {
		type: "lowpass", 
		frequency: Oscillator.EnvFilter.FILTER_ATTRIBUTES.frequency.default, 
		Q: Oscillator.EnvFilter.FILTER_ATTRIBUTES.Q.default, 
		attack: Filter.ENVELOPE_ATTRIBUTES.attack.default,
		release: Filter.ENVELOPE_ATTRIBUTES.release.default,
		bypass: false
	});
};



Oscillator.EnvFilter.prototype.render = function(oscContainer){
	this.container = $("<div/>",{class: "filterContainer"}).appendTo(oscContainer);
	
	var filterTypeDiv = $("<div/>",{class:"envelope_slider"}).appendTo(this.container);
	$("<label/>",{text:"filter type"}).appendTo(filterTypeDiv);
	var filterTypeSpiv = $("<spiv/>").appendTo(filterTypeDiv);
	var filterTypeSelector = DrawerUtils.createSelector(Object.keys(Filter.FILTER_TYPES), this.biquadder.type, function(value){
		this.biquadder.type = value;
	}.bind(this), filterTypeSpiv).addClass("medium");
	
	this.controls = {
		filterTypeSelector : filterTypeSelector
	};
	
	for( var key in Oscillator.EnvFilter.FILTER_ATTRIBUTES ){ // Q, frequency
		var attributes = Oscillator.EnvFilter.FILTER_ATTRIBUTES[key];
		var changer = function(key, value){
			this[key] = value;
			studio.invalidateSavedStatus();
		}.bind(this);
		this.controls[key+"Slider"] = DrawerUtils.createSlider(key, attributes, this[key], changer, this.container);
	}
	
	for(key in Filter.ENVELOPE_ATTRIBUTES){ // adsr
		var attributes = Filter.ENVELOPE_ATTRIBUTES[key];
		var changer = function(key, value){
			this[key] = value;
			studio.invalidateSavedStatus();
		}.bind(this);
		this.controls[key+"Slider"] = DrawerUtils.createSlider(key, attributes, this[key], changer, this.container);
	}

	return this.controls;
};

Oscillator.EnvFilter.prototype.toggleBypass = function(){
	this.bypass = !this.bypass;
	this.input = this.output = (this.bypass ? this.bypasser : this.biquadder);
	
	if( this.bypassToggler ){
		$(this.bypassToggler).html(this.bypass ? "off" : "on");
	}
	if( this.container ){
		this.container.toggleClass("bypass");
	}
};



Oscillator.EnvFilter.prototype.start = function(when) {
	switch(this.biquadder.filter_type){
		case 'lowpass':
		case 'lowshelf':
			var frequency = this.biquadder.frequency;
			frequency.cancelScheduledValues(when);
			frequency.setValueAtTime(Filter.MAX_FREQ, when);
			frequency.linearRampToValueAtTime(
					(this.frequency*this.oscillator.pitch.frequency), 
					when + this.attack
			);
			break;
		case 'highpass':
		case 'highshelf':
			var frequency = this.biquadder.frequency;
			frequency.cancelScheduledValues(when);
			frequency.setValueAtTime(0, when);
			frequency.linearRampToValueAtTime(
					(this.frequency*this.oscillator.pitch.frequency), 
					when + this.attack
			);
			break;
		default:
			var q = this.biquadder.Q;
			q.cancelScheduledValues(when);
			q.setValueAtTime(Filter.MAX_Q, when);
			q.linearRampToValueAtTime(this.Q, when + this.attack);
			break;
	};

	return 0;
};

Oscillator.EnvFilter.prototype.stop = function(when) {
		switch(this.biquadder.filter_type){
		case 'lowpass':
		case 'lowshelf':
			var frequency = this.biquadder.frequency;
			frequency.cancelScheduledValues(when);
			frequency.setValueAtTime(frequency.value, when);
			frequency.linearRampToValueAtTime(Filter.MAX_FREQ, when + this.release);
			break;
		case 'highpass':
		case 'highshelf':
			var frequency = this.biquadder.frequency;
			frequency.cancelScheduledValues(when);
			frequency.setValueAtTime(frequency.value, when);
			frequency.linearRampToValueAtTime(0, when + this.release);
			break;
		default:
			var q = this.biquadder.Q;
			q.cancelScheduledValues(when);
			q.setValueAtTime(q.value, when);
			q.linearRampToValueAtTime(Filter.MAX_Q, when + this.release);
			break;
	};

	return 0;
};




Oscillator.EnvFilter.prototype.marshal = function(){
	return {
		type: this.biquadder.type,
		frequency: this.frequency,
		Q: this.Q,
		attack: this.attack,
		release: this.release,
		bypass: this.bypass
	};
};


Oscillator.EnvFilter.prototype.destroy = function(){
	this.biquadder.disconnect();
	this.bypasser.disconnect();
	delete this.biquadder;
	delete this.bypasser;
};