

function Effect(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	/* because you can't create a generic audio node for pass-through
	 * and there need to be several nodes that link to this node
	 */
	this.input = ctx.createGain();
	this.input.gain.value = 1.0;

	this.output = this.input;
}








Effect.prototype.render = function(division, type) {
	var self = this;	
	var selector = DrawerUtils.createSelector(
			Effect.effectsManifest[type], this.constructor.name, this.effectReplacementCallback.bind(this), division.head).
			addClass("heading_select").addClass("sinistra");
	$(selector).appendTo(division.header);
	
	/*var selector = $("<select/>").appendTo(division.body);
	Effect.effectsManifest[type].forEach(function(effectName){
		$("<option/>",{
			html: effectName, 
			value: effectName,
			selected: (this.handle === effectName)
		}).appendTo(selector);
	}, this);
	
	var commiter = $("<button>Change</button>").appendTo(division.body);
	var self = this;
	$(commiter).on("click",function(){
		if( $(selector).val()){
			self.effectReplacementCallback(self, $(selector).val());
		}
	});
	*/
};

Effect.prototype.start = function(now) {
	return 0;
};

Effect.prototype.stop = function(now) {
	return 0;
};

Effect.prototype.marshal = function(){
	return {
		handle: this.constructor.name
	};
};

Effect.prototype.load = function(settings){
	for( envParam in settings ){
		this[envParam] = settings[envParam];
	}
};



// TODO: Mark that Envelope is exclusively for circuits
Effect.effectsManifest = {
	machines: ["Effect","Compressor","Reverb","Delay","Panner"],
	circuits: ["Effect","Compressor","Reverb","Delay","Filter","Panner"]
};