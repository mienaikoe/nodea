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
	
	this.setConvolution(Reverb.DEFAULT_CONVOLUTION);
}

Reverb.extends(Effect);




Reverb.CONVOLUTIONS = ["room","hall"];
Reverb.DEFAULT_CONVOLUTION = "room";

Reverb.prototype.setConvolution = function(convolution){
	if( convolution && this.convolution !== convolution ){
		this.convolution = convolution;
		this.ctx.fetchBuffer( "effects/Reverb/convolutions/"+convolution+".wav").then( 
			function(buffer){
				this.input.buffer = buffer;
			}.bind(this), 
			function(err){
				console.error(err);
			});
	}
};




Reverb.prototype.render = function(division, type) {
	Effect.prototype.render.call(this, division, type);
	var self = this;
	
	var container = $("<div/>",{"class":"envelope_slider"}).appendTo(division.body);
	
	$("<label>",{html: "space"}).appendTo(container);
	
	var convoChooser = $("<select></select>",{id: "convolution_chooser"}).on("change", function(){
		self.setConvolution(this.value);
		studio.invalidateSavedStatus();
	}).appendTo(container);
	
	Reverb.CONVOLUTIONS.forEach( function(convo){
		$("<option></option>",{html: convo, selected: (convo === self.convolution)}).appendTo(convoChooser);
	}, this);
};



// marshal / load
Reverb.prototype.marshal = function() {
	var ret = Effect.prototype.marshal.call(this);
	ret.convolution = this.convolution;
	return ret;
};

Reverb.prototype.load = function(settings) {
	if( settings ){
		this.setConvolution(settings.convolution);
	}
};