function Uncharted( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback);
	
};

Uncharted.extends(Machine);


Uncharted.prototype.extractSettings = function(settings){
	Machine.prototype.extractSettings.call(this, settings);
	this.scaleKey = "C";
	this.octave = 4;
	this.scaleType = "pentatonic";
	
	if( settings ){
		if( settings.scaleKey ){
			this.scaleKey = settings.scaleKey;
		}
		if( typeof settings.octave === "number" ){
			this.octave = settings.octave;
		}
		if( settings.scaleType ){
			this.scaleType = settings.scaleType;
		}
	} 
	
	this.scale = Scales.scaleFrequencies(this.scaleKey+this.octave.toString(), this.scaleType, 30 );
};



Uncharted.prototype.defaultCircuit = function(ordinal){
	var idx = this.studio.keyset.chromaticOrder.indexOf(ordinal);

	return { 
		id: null, 
		ordinal: ordinal, 
		handle: "Oscillator", 
		notes: [], 
		settings: {
			signalType: "square",
			frequency: this.scale[idx]
		}
	};
};



Uncharted.prototype.generateMachineBody = function(machineBody){	
	var self = this;
	
	var scaleKeySelector = machineBody.find("#Uncharted-Key");
	Pitch.pitchKeySelector(scaleKeySelector);
	scaleKeySelector.val(this.scaleKey).
		change(	function(ev){ 
			self.scaleKey = this.value;
			self.rescale();
			self.studio.invalidateSavedStatus(); 
		});
	machineBody.find("#Uncharted-Octave").
		val(this.octave).
		change(	function(ev){ 
			self.octave = parseInt(this.value);
			self.rescale();
			self.studio.invalidateSavedStatus(); 
		});
		
	var scaleType = machineBody.find("#Uncharted-ScaleType");
	Scales.scaleTypeSelector(scaleType, this.scaleType);
	scaleType.change( function(ev){ 
		self.scaleType = this.value;
		self.rescale();
		self.studio.invalidateSavedStatus(); 
		$(this).blur();
	});	
};



Uncharted.prototype.rescale = function(){
	this.scale = Scales.scaleFrequencies(this.scaleKey+this.octave.toString(), this.scaleType, 30 );
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		var circuit = this.circuits[key];
		if( circuit.constructor.name === "Oscillator" ){
			circuit.repitch(this.scale[idx]);
		}
	}, this);
};


Uncharted.prototype.marshalSettings = function(){
	var ret = Machine.prototype.marshalSettings.call(this);
	ret.scaleKey = this.scaleKey;
	ret.scaleType = this.scaleType;
	ret.octave = this.octave;
	return ret;
};