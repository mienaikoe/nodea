function Synthesizer( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback);
	
};

Synthesizer.extends(Machine);


Synthesizer.prototype.extractSettings = function(settings){
	Machine.prototype.extractSettings.call(this, settings);
	
	var marshaledTemplateOscillator;
	
	if( settings ){
		if( settings.scaleType ){
			this.scaleType = settings.scaleType;
		}
		if( settings.templateOscillator ){
			marshaledTemplateOscillator = settings.templateOscillator;
		}
	}
	
	if(!this.scaleType){
		this.scaleType = "pentatonic";
	}
		
	if(!marshaledTemplateOscillator){
		var keySetKey = this.studio.keyset.chromaticOrder[0];
		marshaledTemplateOscillator = this.defaultCircuit(keySetKey, new Pitch("C",4));
	}
	
	this.templateOscillator = new Oscillator(this.ctx, this, marshaledTemplateOscillator, this.ctx.createStub(), function(){});
	this.scale = Scales.scalePitches(this.templateOscillator.pitch, this.scaleType, 30 );
};



Synthesizer.prototype.defaultCircuit = function(ordinal, pitch){
	var idx = this.studio.keyset.chromaticOrder.indexOf(ordinal);

	return { 
		id: null, 
		ordinal: ordinal, 
		handle: "Oscillator", 
		notes: [], 
		settings: {
			pitch: pitch,
			oscillatorAttributes: [
				{	signalType: "sine",
					offset: {semitones: 0, cents: 0}
				}
			]
		}
	};
};



Synthesizer.prototype.generateMachineBody = function(machineBody){	
	var self = this;
			
	var scaleType = machineBody.find("#Synthesizer-ScaleType");
	Scales.scaleTypeSelector(scaleType, this.scaleType, function(ev){ 
		self.scaleType = this.value;
		self.rescale();
		self.studio.invalidateSavedStatus();
	}); 
};

Synthesizer.prototype.generateDrawer = function(){	
	var machineSection = Machine.prototype.generateDrawer.call(this);
	
	// Render Template Oscillator
	var circuitDivision = this.templateOscillator.generateCircuitDivision(
			DrawerUtils.createDivision(machineSection.body, "Oscillator Template"),
			function(){	
				// Callbacks on Controls
				var self = this;
				this.templateOscillator.controls.colorSelector.off("change").change(function(ev){
					self.templateOscillator.pitch = new Pitch(this.value, self.templateOscillator.pitch.octave);
					self.rescale();
					self.studio.invalidateSavedStatus(); 
				});

				this.templateOscillator.controls.octaveSelector.off("change").change(function(ev){ 
					self.templateOscillator.pitch = new Pitch( self.templateOscillator.pitch.color, parseInt(this.value) );
					self.rescale();
					self.studio.invalidateSavedStatus(); 
				});
			}.bind(this)
	);	
	
	var envelopeDivision = this.templateOscillator.generateEnvelopeDivision(
			DrawerUtils.createDivision(machineSection.body, "Amp Envelope"));
};


/*
controls = {
	colorSelector,
	octaveSelector,
	oscillatorAdder,
	oscillators: [
		{
			oscRemover: oscRemover,
			volumeSlider: volumeSlider,
			signalTypeSelector: signalTypeSelector,
			semitoneInput: semitoneInput,
			centsInput: centsInput,
			lfoBypass: lfoBypass
		},{
			oscRemover: oscRemover,
			volumeSlider: volumeSlider,
			signalTypeSelector: signalTypeSelector,
			semitoneInput: semitoneInput,
			centsInput: centsInput,
			lfoBypass: lfoBypass
		}
	],
	gain: {
		volume
	},
	envelope: {
		attack,
		decay,
		sustain,
		release
	}
};
 */



Synthesizer.prototype.rescale = function(){
	this.scale = Scales.scalePitches(this.templateOscillator.pitch, this.scaleType, 30 );
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		var circuit = this.circuits[key];
		if( circuit.constructor.name === "Oscillator" ){
			circuit.repitch(this.scale[idx]);
		}
	}, this);
};


Synthesizer.prototype.marshalSettings = function(){
	var ret = Machine.prototype.marshalSettings.call(this);
	ret.scaleType = this.scaleType;
	ret.templateOscillator = this.templateOscillator.marshal();
	return ret;
};