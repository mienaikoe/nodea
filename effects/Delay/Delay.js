/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function Delay(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	this.input = ctx.createChannelSplitter();
	this.output = ctx.createChannelMerger();
	
	this.dryGain = ctx.createGain();
	this.input.connect(this.dryGain);
	this.dryGain.connect(this.output);
	
	this.delay = ctx.createDelay();
	this.wetGain = ctx.createGain();
	this.input.connect(this.delay);
	this.delay.connect(this.wetGain);
	this.wetGain.connect(this.output);
	
	this.delay.delayTime = Delay.INPUT_ATTRIBUTES["Delay Time"].attributes.default;
	this.dryGain.gain.value = 0.7;
	this.wetGain.gain.value = 0.3;
}

Delay.extends(Effect);





Delay.INPUT_ATTRIBUTES = {
	"Delay Time":	{
		attributes: {min: 0.00, max: 1.00, step: 0.05, default: 0.05},
		changer: function(key, value){
			this.delay.delayTime.value = value;
			studio.invalidateSavedStatus();
		},
		valuer: function(instance){
			return instance.delay.delayTime.value;
		}
	},
		
	"Wet/Dry":	{
		attributes: {min: 0.00, max: 1.00, step: 0.05,	default: 0.70}, 
		changer: function(key, value){
			this.wetGain.gain.value = value;
			this.dryGain.gain.value = 1.00 - value;
			studio.invalidateSavedStatus();
		},
		valuer: function(instance){
			return instance.wetGain.gain.value;
		}
	}
};

Delay.prototype.render = function(division) {
	for( key in Delay.INPUT_ATTRIBUTES ){
		var input = Delay.INPUT_ATTRIBUTES[key];
		this.createSlider(key, input.attributes, input.valuer(this), input.changer, division );
	}
};





// marshal / load
Delay.prototype.marshal = function() {
	var ret = Effect.prototype.marshal.call(this);
	ret.delayTime = this.input.delayTime.value;
	return ret;
};

Delay.prototype.load = function(settings) {
	if( settings ){
		this.delay.delayTime.value = settings.delayTime;
	}
};
