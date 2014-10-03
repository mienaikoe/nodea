/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function Compressor(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	this.input = ctx.createDynamicsCompressor();
	this.output = this.input;
	
	for( var key in Compressor.SLIDER_ATTRIBUTES){
		this[key] = Compressor.SLIDER_ATTRIBUTES[key].default;
	}
}

Compressor.extends(Effect);





Compressor.SLIDER_ATTRIBUTES = {
	ratio:		{min: 1, max: 20, step: 1,	default: 12},
	knee:		{min: 0, max: 40, step: 1,	default: 30},
	threshold:	{min: -100, max: 0, step: 1,	default: -24},
	reduction:	{min: 1, max: 20, step: 0.5,	default: 12},
	attack:		{min: 0.00, max: 1.00, step: 0.05,	default: 0.05},
	release:	{min: 0.00, max: 1.00, step: 0.05,	default: 0.05}
};

Compressor.prototype.render = function(division, type) {
	Effect.prototype.render.call(this, division, type);
	for(key in Compressor.SLIDER_ATTRIBUTES){
		var attributes = Compressor.SLIDER_ATTRIBUTES[key];
		var changer = function(key, value){
			this.input[key].value = value;
			studio.invalidateSavedStatus();
		}.bind(this);
		DrawerUtils.createSlider(key, attributes, this.input[key].value, changer, division.body );
	}
};





// marshal / load
Compressor.prototype.marshal = function() {
	var ret = Effect.prototype.marshal.call(this);
	for( var key in Compressor.SLIDER_ATTRIBUTES ){
		ret[key] = this.input[key].value;
	}
	return ret;
};

Compressor.prototype.load = function(settings) {
	if( settings ){
		for( var key in Compressor.SLIDER_ATTRIBUTES ){
			this.input[key].value = settings[key];
		}
	}
};
