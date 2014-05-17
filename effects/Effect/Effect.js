

function Effect(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	/* because you can't create a generic audio node for pass-through
	 * and there need to be several nodes that link to this node
	 */
	this.input = ctx.createGainNode();
	this.input.gain.value = 1.0;

	this.output = this.input;
}





Effect.prototype.render = function(divisionBody, type) {
	var selector = $("<select/>").appendTo(divisionBody);
	Effect.effectsManifest[type].forEach(function(effectName){
		$("<option/>",{
			html: effectName, 
			value: effectName,
			selected: (this.handle === effectName)
		}).appendTo(selector);
	}, this);
	
	var commiter = $("<button>Change</button>").appendTo(divisionBody);
	var self = this;
	$(commiter).click(function(){
		if( $(selector).val()){
			self.effectReplacementCallback(self, $(selector).val());
		}
	});
};

Effect.prototype.start = function(now) {
	return 0;
};

Effect.prototype.stop = function(now) {
	return 0;
};

Effect.prototype.marshal = function(){
	return {
		handle: "Effect"
	};
};



// TODO: Mark that Envelope is exclusively for circuits
Effect.effectsManifest = {
	machines: [""],
	circuits: ["","Envelope"]
};