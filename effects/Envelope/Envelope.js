/*
 * Large parts of this file are borrowed from
 * http://secretfeature.com/mono-synth/part3/scripts/MonoSynth.js
 * 
 */

function Envelope(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	this.input = ctx.createGainNode();
	this.input.gain.value = 0.0;
	this.output = this.input;

	for( key in Envelope.SLIDER_ATTRIBUTES){
		this[key] = Envelope.SLIDER_ATTRIBUTES[key].default;
	}
}





Envelope.SLIDER_ATTRIBUTES = {
	attack:		{min: 0.0, max: 2.0, step: 0.05,	default: 0.05},
	decay:		{min: 0.0, max: 2.0, step: 0.05,	default: 0.05},
	sustain:	{min: 0.0, max: 1.0, step: 0.05,	default: 0.2},
	release:	{min: 0.0, max: 2.0, step: 0.05,	default: 0.1}
};

Envelope.prototype.render = function(division) {
	var changeMaker = function(self, envelopeKey){
		return function(){
			self[envelopeKey] = parseFloat(this.value); 
			studio.invalidateSavedStatus();
		};
	};
	
	var self = this;
	for(key in Envelope.SLIDER_ATTRIBUTES){
		var sliderBox = $("<div>",{class:"envelope_slider"}).appendTo(division);
		$("<label>"+key+"</label>").appendTo(sliderBox);
		$("<input/>", $.extend({type:'range', value: this[key], id: 'slider_'+key}, Envelope.SLIDER_ATTRIBUTES[key])).
			appendTo(sliderBox).
			change(changeMaker(self, key));
	}
};






Envelope.prototype.start = function(when) {
	var gain = this.input.gain;
	gain.setValueAtTime(gain.value, when);
	gain.linearRampToValueAtTime(1.0, when + this.attack);
	gain.linearRampToValueAtTime(this.sustain, when + this.attack + this.decay);
	return 0;
};

Envelope.prototype.stop = function(when) {
	var gain = this.input.gain;
	gain.setValueAtTime(gain.value, when);
	gain.linearRampToValueAtTime(0.0, when + this.release);
	return this.release;
};



// marshal / load
Envelope.prototype.marshal = function() {
	var ret = Effect.prototype.marshal.call(this);
	for( envParam in Envelope.SLIDER_ATTRIBUTES ){
		ret[envParam] = this[envParam];
	}
	return ret;
};

Envelope.prototype.load = function(settings){
	for( envParam in settings ){
		this[envParam] = settings[envParam];
	}
};