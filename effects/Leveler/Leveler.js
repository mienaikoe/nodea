/*
 * Large parts of this file are borrowed from
 * http://secretfeature.com/mono-synth/part3/scripts/MonoSynth.js
 * 
 */

function Leveler(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	this.input = ctx.createGainNode();
	this.input.gain.value = 0.0;
	this.output = this.input;
	
	for( key in Leveler.ENVELOPE_ATTRIBUTES){
		this[key] = Leveler.ENVELOPE_ATTRIBUTES[key].default;
	}
}

Leveler.extends(Effect);


Leveler.GAIN_ATTRIBUTES = {
	volume:		{min: 0.00, max: 1.00, step: 0.05,	default: 0.80}
};

Leveler.ENVELOPE_ATTRIBUTES = {	
	
	attack:		{min: 0.00, max: 2.00, step: 0.05,	default: 0.05},
	decay:		{min: 0.00, max: 2.00, step: 0.05,	default: 0.05},
	sustain:	{min: 0.00, max: 1.00, step: 0.05,	default: 0.20},
	release:	{min: 0.00, max: 2.00, step: 0.05,	default: 0.10}
};




Leveler.prototype.render = function(division) {	
	for(key in Leveler.GAIN_ATTRIBUTES){
		var attributes = Leveler.GAIN_ATTRIBUTES[key];
		var changer = function(key, value){
			this[key] = value;
			studio.invalidateSavedStatus();
		}.bind(this);
		DrawerUtils.createSlider(key, attributes, this[key], changer, division);
	}
	
	$("<br>").appendTo(division);
	
	for(key in Leveler.ENVELOPE_ATTRIBUTES){
		var attributes = Leveler.ENVELOPE_ATTRIBUTES[key];
		var changer = function(key, value){
			this[key] = value;
			studio.invalidateSavedStatus();
		}.bind(this);
		DrawerUtils.createSlider(key, attributes, this[key], changer, division);
	}
};






Leveler.prototype.start = function(when) {
	var gain = this.input.gain;
	gain.setValueAtTime(gain.value, when);
	gain.linearRampToValueAtTime(this.volume, when + this.attack);
	gain.linearRampToValueAtTime(this.sustain*this.volume, when + this.attack + this.decay);
	return 0;
};

Leveler.prototype.stop = function(when) {
	var gain = this.input.gain;
	gain.linearRampToValueAtTime(0.0, when + this.release);
	return this.release;
};



// marshal / load
Leveler.prototype.marshal = function() {
	var ret = Effect.prototype.marshal.call(this);
	ret.filter_type = this.input.type;
	for( key in Leveler.ENVELOPE_ATTRIBUTES ){
		ret[key] = this[key];
	}
	for( key in Leveler.GAIN_ATTRIBUTES ){
		ret[key] = this[key];
	}
	return ret;
};

Leveler.prototype.load = function(settings){
	if( settings ){
		for( key in Leveler.GAIN_ATTRIBUTES ){
			var setting = settings[key];
			if(setting){ this[key] = setting; }
		}
		for( key in Leveler.ENVELOPE_ATTRIBUTES ){
			var setting = settings[key];
			if(setting){ this[key] = setting; }
		}
		if( settings.filter_type ){
			this.input.type = settings.filter_type;
		}
	}
};

