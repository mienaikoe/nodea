

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




Effect.prototype.createSlider = function(key, attributes, value, changer, division){
	var self = this;
	var sliderBox = $("<div>",{class:"envelope_slider"}).appendTo(division);
	$("<label>"+key+"</label>").appendTo(sliderBox);
	$("<input/>", $.extend({type:'range', value: value, id: 'slider_'+key}, attributes)).
		appendTo(sliderBox).
		change(function(){
			changer.call(self, key, parseFloat(this.value));
		});
};



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
	machines: ["","Compressor","Reverb"],
	circuits: ["","Compressor","Reverb","Leveler","Filter"]
};