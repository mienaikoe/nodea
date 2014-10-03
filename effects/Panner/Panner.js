/*
 * Large parts of this file are borrowed from
 * http://secretfeature.com/mono-synth/part3/scripts/MonoSynth.js
 * 
 */

function Panner(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	this.input = ctx.createPanner();
	this.output = this.input;
	
	this.input.panningModel = "equalpower";
	this.input.distanceMode = "inverse";
}

Panner.extends(Effect);



Panner.DIRECTION_ATTRIBUTES = {min: -90, max: 90, step: 1, default: 0};


Panner.prototype.render = function(division, type) {
	Effect.prototype.render.call(this, division, type);
	DrawerUtils.createSlider("direction", Panner.DIRECTION_ATTRIBUTES, this.direction, function(key, value){
		this.setPan(value);
	}.bind(this), division.body);
};


Panner.prototype.setPan = function(value){
	var xDeg = value;
	var zDeg = xDeg + 90;
	if (zDeg > 90) {
	  zDeg = 180 - zDeg;
	}
	this.input.setPosition(
		Math.sin(xDeg * (Math.PI / 180)), 
		0, 
		Math.sin(zDeg * (Math.PI / 180)));
};



/*
 * Start / Stop
 * @param when is the audio API timing for starting nodes.
 * @return is the amount of time you want to delay the connecting ciruits. 
 *   This is useful for instances where the effect will only work if the 
 *   source continues for a certain time (i.e. release effects or 100% wet delays).
 */

Panner.prototype.start = function(when) {
	return 0;
};

Panner.prototype.stop = function(when) {
	return 0;
};



// marshal / load
Panner.prototype.marshal = function() {
	var ret = Effect.prototype.marshal.call(this);
	ret.direction = this.direction;
	return ret;
};

Panner.prototype.load = function(settings){
	for( settingKey in settings ){
		if(settingKey === "direction"){
			this.direction = settings[settingKey];
		} else {
			this.input[settingKey] = settings[settingKey];
		}
	}
};