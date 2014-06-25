function Uncharted( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback);
	
};

Uncharted.extends(Machine);


Uncharted.prototype.extractSettings = function(settings){
	Machine.prototype.extractSettings.call(this, settings);
	
	if( settings ){
		if( settings.scalePitch ){
			this.scalePitch = new Pitch(settings.scalePitch.color, settings.scalePitch.octave);
		}
		if( settings.scaleType ){
			this.scaleType = settings.scaleType;
		}
	}
	
	if(!this.scalePitch){
		this.scalePitch = new Pitch("C",4);
	}
	if(!this.scaleType){
		this.scaleType = "pentatonic";
	}
	
	this.scale = Scales.scalePitches(this.scalePitch, this.scaleType, 30 );
};



Uncharted.prototype.defaultCircuit = function(ordinal){
	var idx = this.studio.keyset.chromaticOrder.indexOf(ordinal);

	return { 
		id: null, 
		ordinal: ordinal, 
		handle: "Oscillator", 
		notes: [], 
		settings: {
			pitch: this.scale[idx],
			oscillatorAttributes: [
				{	signalType: "sine",
					offset: {semitones: 0, cents: 0}
				}
			]
		}
	};
};



Uncharted.prototype.generateMachineBody = function(machineBody){	
	var self = this;
	
	var scaleKeySelector = machineBody.find("#Uncharted-Key");
	Pitch.pitchKeySelector(scaleKeySelector);
	scaleKeySelector.val(this.scalePitch.color).
		change(	function(ev){ 
			self.scalePitch = new Pitch(this.value, self.scalePitch.octave);
			self.rescale();
			self.studio.invalidateSavedStatus(); 
		});
	machineBody.find("#Uncharted-Octave").
		val(this.scalePitch.octave).
		change(	function(ev){ 
			self.scalePitch = new Pitch( self.scalePitch.color, parseInt(this.value) );
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
	this.scale = Scales.scalePitches(this.scalePitch, this.scaleType, 30 );
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		var circuit = this.circuits[key];
		if( circuit.constructor.name === "Oscillator" ){
			circuit.repitch(this.scale[idx]);
		}
	}, this);
};


Uncharted.prototype.marshalSettings = function(){
	var ret = Machine.prototype.marshalSettings.call(this);
	ret.scalePitch = this.scalePitch.marshal();
	ret.scaleType = this.scaleType;
	return ret;
};