/*
 * Large parts of this file are borrowed from
 * http://secretfeature.com/mono-synth/part3/scripts/MonoSynth.js
 * 
 */

function Envelope(ctx) {
	this.ctx = ctx;

	this.input = ctx.createGainNode();
	this.input.gain.value = 0.0;
	this.output = this.input;

	for( key in Envelope.SLIDER_ATTRIBUTES){
		this[key] = Envelope.SLIDER_ATTRIBUTES[key].value;
	}
}


// This allows all other places in the studio to create one of these 
// and auto-tie it to the context they were working with.
window.AudioContext.prototype.createEnvelope = function() {
	return new Envelope(this);
};



Envelope.SLIDER_ATTRIBUTES = {
	attack:		{min: 0.0, max: 3.0, step: 0.1,		value: 0.2},
	decay:		{min: 0.0, max: 3.0, step: 0.1,		value: 0.2},
	sustain:	{min: 0.0, max: 1.0, step: 0.05,	value: 0.2},
	release:	{min: 0.0, max: 3.0, step: 0.1,		value: 0.2}
};

Envelope.prototype.render = function(division) {
	var self = this;
	for(key in Envelope.SLIDER_ATTRIBUTES){
		var sliderBox = $("<div>",{class:"envelope_slider"}).appendTo(division);
		$("<label>"+key+"</label>").appendTo(sliderBox);
		$("<input/>", $.extend({type:'range'}, Envelope.SLIDER_ATTRIBUTES[key])).
			appendTo(sliderBox).
			change(function(){ self[key] = this.value; });
	}
};






Envelope.prototype.start = function(when) {
	var gain = this.input.gain;
	gain.cancelScheduledValues(when);
	gain.setValueAtTime(gain.value, when);
	gain.linearRampToValueAtTime(1.0, when + this.attack);
	gain.linearRampToValueAtTime(this.sustain, when + this.attack + this.decay);
};

Envelope.prototype.stop = function(when) {
	var gain = this.input.gain;
	gain.cancelScheduledValues(0.0);
	gain.setValueAtTime(gain.value, when);
	gain.linearRampToValueAtTime(0.0, when + this.release);
};