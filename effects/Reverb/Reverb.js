/*
 * Large parts of this file are borrowed from
 * http://secretfeature.com/mono-synth/part3/scripts/MonoSynth.js
 * 
 */

function Reverb(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	this.input = ctx.createConvolver();
	this.output = this.input;
	
	this.convolution = Reverb.DEFAULT_CONVOLUTION;
	this.resetBuffer();
}


Reverb.CONVOLUTIONS = ["room","hall"];
Reverb.DEFAULT_CONVOLUTION = "room";

Reverb.prototype.resetBuffer = function(){
	var self = this;
	DelayedLoad.loadBuffer( "effects/Reverb/convolutions/"+this.convolution+".wav", function(buffer){
		self.input.buffer = buffer;
	});
};




Reverb.prototype.render = function(division) {
	var self = this;
	var convoChooser = $("<select></select>",{id: "convolution_chooser"}).appendTo(division).change(function(){
		self.convolution = this.value;
		self.resetBuffer();
		studio.invalidateSavedStatus();
	});
	
	Reverb.CONVOLUTIONS.forEach( function(convo){
		$("<option></option>",{html: convo}).appendTo(convoChooser);
	}, this);
};



// marshal / load
Reverb.prototype.marshal = function() {
	var ret = Effect.prototype.marshal.call(this);
	ret.convolution = this.convolution;
	return ret;
};

Reverb.prototype.load = function(settings){
	this.convolution = settings.convolution;
};