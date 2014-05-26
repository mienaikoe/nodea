/*
 * Large parts of this file are borrowed from
 * http://secretfeature.com/mono-synth/part3/scripts/MonoSynth.js
 * 
 */



/*
 * Gain
 * Detune
 * Q
 * Frequency
 * type
 */

function Filter(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	this.input = ctx.createBiquadFilter();
	this.input.Q = Filter.MAX_Q;
	this.output = this.input;
	
	for( key in Filter.ENVELOPE_ATTRIBUTES){
		this[key] = Filter.ENVELOPE_ATTRIBUTES[key].default;
	}
	for( key in Filter.FILTER_ATTRIBUTES){
		this[key] = Filter.FILTER_ATTRIBUTES[key].default;
	}
}

Filter.extends(Effect);




Filter.MAX_Q = 1000;

Filter.FILTER_ATTRIBUTES = {
	frequency:	{min: 0,	max: 20000, step: 100,	default: 400},
	detune:		{min: -4800, max: 4800, step: 100,	default: 0},
	Q:			{min: 1, max: Filter.MAX_Q, step: 10,	default: 100}
};

Filter.ENVELOPE_ATTRIBUTES = {	
	attack:		{min: 0.00, max: 2.00, step: 0.05,	default: 0.05},
	decay:		{min: 0.00, max: 2.00, step: 0.05,	default: 0.05},
	sustain:	{min: 0.00, max: 1.00, step: 0.05,	default: 0.20},
	release:	{min: 0.00, max: 2.00, step: 0.05,	default: 0.10}
};

Filter.FILTER_TYPES = {
	lowpass: "Low Pass",
	highpass: "High Pass",
	bandpass: "Band Pass"
};



Filter.prototype.render = function(division) {
	var self = this;
	
	var typeChooser = $("<select></select>",{id: "type_chooser"}).appendTo(division).change(function(){
		self.input.type = this.value;
		studio.invalidateSavedStatus();
	});
	
	for( key in Filter.FILTER_TYPES ){
		$("<option></option>",{value: key, html: Filter.FILTER_TYPES[key], selected: (key===this.input.type)}).appendTo(typeChooser);
	}
	
	
	for( key in Filter.FILTER_ATTRIBUTES ){
		var attributes = Filter.FILTER_ATTRIBUTES[key];
		var changer = function(key, value){
			this.input[key].value = value;
			studio.invalidateSavedStatus();
		};
		this.createSlider(key, attributes, this.input[key].value, changer, division);
	}
	
	$("<br>").appendTo(division);
	
	for(key in Filter.ENVELOPE_ATTRIBUTES){
		var attributes = Filter.ENVELOPE_ATTRIBUTES[key];
		var changer = function(key, value){
			this[key] = value;
			studio.invalidateSavedStatus();
		};
		this.createSlider(key, attributes, this[key], changer, division);
	}
};






Filter.prototype.start = function(when) {
	var q = this.input.Q;
	q.setValueAtTime(this.Q, when);
	q.linearRampToValueAtTime(Filter.MAX_Q, when + this.attack);
	q.linearRampToValueAtTime(this.Q, when + this.attack + this.decay);
	return 0;
};

Filter.prototype.stop = function(when) {
	var gain = this.input.gain;
	gain.linearRampToValueAtTime(Filter.MAX_Q, when + this.release);
	return 0;
};



// marshal / load
Filter.prototype.marshal = function() {
	var ret = Effect.prototype.marshal.call(this);
	ret.filter_type = this.input.type;
	for( key in Filter.ENVELOPE_ATTRIBUTES ){
		ret[key] = this[key];
	}
	for( key in Filter.FILTER_ATTRIBUTES ){
		ret[key] = this.input[key].value;
	}
	return ret;
};

Filter.prototype.load = function(settings){
	if( settings ){
		for( key in Filter.FILTER_ATTRIBUTES ){
			var setting = settings[key];
			if(setting){ this.input[key].value = setting; }
		}
		for( key in Filter.ENVELOPE_ATTRIBUTES ){
			var setting = settings[key];
			if(setting){ this[key] = setting; }
		}
		if( settings.filter_type ){
			this.input.type = settings.filter_type;
		}
	}
};