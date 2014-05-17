function Uncharted( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback);
	
};

Uncharted.prototype = Object.create(Machine.prototype, {
	constructor: { value: Uncharted, enumerable: false }
});


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



