AudioNode.prototype.input = this;
AudioNode.prototype.output = this;
// TODO: Swap out output/input for just one field: node


var EffectsChain = function(ctx, destination, type){
	this.chain = [];
	this.ctx = ctx;
	this.type = type;
	
	this.source = new Effect(this.ctx, this.replacementCallback());
	this.input = this.source.input;
	
	this.destination = {input: destination, output: destination};
	this.output = destination;
	
	this.input.connect(this.output);
};

EffectsChain.prototype.get = function(idx){
	if( idx < 0 ){
		return this.source;
	} else if (idx < this.chain.length ){
		return this.chain[idx];
	} else {
		return this.destination;
	}
};

EffectsChain.prototype.push = function(effect){
	if( !effect ){ return; }

	var prevEffect = this.get(this.chain.length-1);
	
	prevEffect.output.disconnect();
	prevEffect.output.connect(effect.input);
	
	effect.output.connect(this.destination.input);
	this.chain.push(effect);
};

EffectsChain.prototype.pop = function(){
	if( this.chain.length === 0 ){ return; }
	
	var effect = this.chain.pop();
	effect.output.disconnect();
	
	var prevEffect = this.get(this.chain.length-1);
	prevEffect.output.disconnect();
	prevEffect.output.connect(this.destination.input);
	
	return effect;
};

EffectsChain.prototype.insert = function(effect, idx){
	if( !effect || idx >= this.chain.length || idx < 0 ){ return; }

	if( idx === this.chain.length-1 ){
		return this.push(effect);
	}

	var prevEffect = this.get(idx-1);
	prevEffect.output.disconnect();
	prevEffect.output.connect(effect.input);
	
	var nextEffect = this.get(idx+1);
	effect.output.connect(nextEffect.input);
	
	this.chain.splice(idx, 0, effect);
};

EffectsChain.prototype.remove = function(idx){
	if( idx >= this.chain.length || idx < 0 ){ return; }

	if( idx === this.chain.length-1 ){
		return this.pop();
	}
	
	var nextEffect = this.get(idx+1);
	var prevEffect = this.get(idx-1);
	prevEffect.output.disconnect();
	prevEffect.output.connect(nextEffect.input);
	
	this.chain.splice(idx, 1);
};





// Sounding


EffectsChain.prototype.start = function(when){
	var waitTime = 0;
	this.chain.forEach(function(effect){ 
		waitTime += effect.start(when); 
	}, this);
	return waitTime;
};

EffectsChain.prototype.stop = function(when){
	var waitTime = 0;
	this.chain.map(function(effect){ 
		waitTime += effect.stop(when); 
	}, this);
	return waitTime;
};


// Browser Interaction

EffectsChain.prototype.render = function(section){
	this.section = section;
	var self = this;
	DrawerUtils.makeSectionAddable(section, function(ev){
		var effect = new Effect(self.ctx, self.replacementCallback());
		self.chain.push(effect);
		var effectIndex = self.chain.length - 1;
		var division = DrawerUtils.createDivision(section,"Effect");
		DrawerUtils.makeDivisionRemovable(division, function(ev){
			self.remove(effectIndex);
			$(division).parent().remove();
		});
		effect.render(division.body, self.type);
	});
	
	this.rerender();
};

EffectsChain.prototype.rerender = function(){
	if( this.section ){
		this.section.empty();
		var self = this;
		this.chain.forEach(function(effect, effectIndex){ 
			var division = DrawerUtils.createDivision(this.section, effect.constructor.name);
			DrawerUtils.makeDivisionRemovable(division, function(ev){
				self.remove(effectIndex);
				$(division).parent().remove();
			});
			effect.render(division.body, self.type);
		}, this);
	}
};


EffectsChain.prototype.marshal = function(){
	 return this.chain.map(function(effect){
		var ret = effect.marshal();
		ret.type = effect.constructor.name;
		return ret;
	 });
};

EffectsChain.prototype.replacementCallback = function(){
	var self = this;
	return function(oldEffect, newHandle){
		 self.replaceEffect(oldEffect, newHandle);
	};
};

EffectsChain.prototype.load = function(chainSettings){
	chainSettings.forEach(function(effectSettings){
		var self = this;			

		var newEffect = new window[effectSettings.handle](self.ctx, self.replacementCallback());
		newEffect.load(effectSettings);
		self.push( newEffect );
		self.rerender();

	}, this);
};

EffectsChain.prototype.loadDefault = function(){
	this.push(new Envelope(this.ctx, this.replacementCallback()));
};


EffectsChain.prototype.replaceEffect = function( oldEffect, newHandle ){
	var self = this;

	var idx = self.chain.indexOf(oldEffect);
	if( idx === -1 ){
		console.error("Could not find old effect in chain");
		return;
	}

	oldEffect.output.disconnect(0);

	var newEffect = new window[newHandle](self.ctx, self.replacementCallback());
	self.chain[idx] = newEffect;

	var prevEffect = self.get(idx-1);
	prevEffect.output.disconnect(0);
	prevEffect.output.connect(newEffect.input);

	var nextEffect = self.get(idx+1);
	newEffect.output.connect(nextEffect.input);

	self.rerender();
	studio.invalidateSavedStatus();

};