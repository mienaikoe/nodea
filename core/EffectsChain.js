AudioNode.prototype.input = this;
AudioNode.prototype.output = this;



var EffectsChain = function(ctx, destination){
	this.chain = [];
	
	this.source = ctx.createPassThrough();
	this.input = this.source.input;
	this.destination = destination; //include .output?
	
	this.input.connect(destination);
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
	
	effect.output.connect(this.destination);
	this.chain.push(effect);
};

EffectsChain.prototype.pop = function(){
	if( this.chain.length === 0 ){ return; }
	
	var effect = this.chain.pop();
	effect.disconnect();
	
	var prevEffect = this.get(this.chain.length-1);
	prevEffect.output.disconnect();
	prevEffect.output.connect(this.destination);
	
	return effect;
};

EffectsChain.prototype.insert = function(effect, idx){
	if( !effect || idx >= this.chain.length || idx < 0 ){ return; }

	if( idx === this.chain.length-1 ){
		return this.push(effect);
	}

	if( idx !== 0 ){
		var prevEffect = this.get(idx-1);
		prevEffect.output.disconnect();
		prevEffect.output.connect(effect.input);
	}
	
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
	if( idx !== 0 ){
		var prevEffect = this.get(idx-1);
		prevEffect.output.disconnect();
		prevEffect.output.connect(nextEffect.input);
	}
	
	this.chain.splice(idx, 1);
};





// Sounding

EffectsChain.prototype.render = function(section){
	this.chain.forEach(function(effect){ 
		var division = DrawerUtils.createDivision(section,effect.constructor.name);
		effect.render(division);
	}, this);
};

EffectsChain.prototype.start = function(when){
	this.chain.forEach(function(effect){ effect.start(when); }, this);
};

EffectsChain.prototype.stop = function(when){
	this.chain.forEach(function(effect){ effect.stop(when); }, this);
};