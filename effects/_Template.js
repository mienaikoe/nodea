/*
 * Large parts of this file are borrowed from
 * http://secretfeature.com/mono-synth/part3/scripts/MonoSynth.js
 * 
 */

function Envelope(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	this.input = null; // this is required or else everything breaks.
	this.output = this.input;

}


Envelope.prototype.render = function(division) {
	// Render the UI for your Effect Here
};




/*
 * Start / Stop
 * @param when is the audio API timing for starting nodes.
 * @return is the amount of time you want to delay the connecting ciruits. 
 *   This is useful for instances where the effect will only work if the 
 *   source continues for a certain time (i.e. release effects or 100% wet delays).
 */

Envelope.prototype.start = function(when) {
	return 0;
};

Envelope.prototype.stop = function(when) {
	return 0;
};



// marshal / load
Envelope.prototype.marshal = function() {
	var ret = {};
	// fill in ret here. You will load what this creates in the load function.
	return ret;
};

Envelope.prototype.load = function(settings){
	for( envParam in settings ){
		this[envParam] = settings[envParam];
	}
};