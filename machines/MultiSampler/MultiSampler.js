function MultiSampler( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback);
	
	this.setInstrument(this.instrumentName);
};

MultiSampler.extends(Machine);

MultiSampler.templateHTML = "<div id='MultiSampler'> \
    <div class='mainFields'> \
        <spiv> \
            <select id='MultiSampler-ScaleType'></select> \
            <div class='thicket'>SCALE TYPE</div> \
        </spiv> \
		<br/> \
        <spiv> \
            <select id='MultiSampler-ScaleKey'></select> \
            <div class='thicket'>SCALE KEY</div> \
        </spiv> \
		<spiv> \
            <input type='number' id='MultiSampler-ScaleOctave'></input> \
            <div class='thicket'>SCALE OCTAVE</div> \
        </spiv> \
		<br/> \
		<spiv> \
			<select id='MultiSampler-Instrument'></input> \
			<div class='thicket'>INSTRUMENT</div> \
		</spiv> \
	</div> \
</div>";


MultiSampler.prototype.extractSettings = function(settings){
	Machine.prototype.extractSettings.call(this, settings);
	
	var scaleColor = "C";
	var scaleOctave = 4;
	var instrumentName = "calvichord";
	
	if( settings ){
		if( settings.scaleType ){
			this.scaleType = settings.scaleType;
		}
		if( settings.instrument ){
			this.instrument = settings.instrument;
		}
		if( settings.color ){
			scaleColor = settings.color;
		}
		if( settings.octave){
			scaleOctave = settings.octave;
		}
	}
	
	if(!this.scaleType){
		this.scaleType = "pentatonic";
	}
		
	if(!MultiSampler.INSTRUMENTS[instrumentName]){
		instrumentName = "clavichord";
	}
	
	this.scalePitch = new Pitch(scaleColor, scaleOctave);
	this.scale = Scales.scalePitches(this.scalePitch, this.scaleType, 30 );
	this.instrumentName = instrumentName;
};


MultiSampler.prototype.setInstrument = function(instrumentName){
	this.instrumentName = instrumentName;
	this.instrument = MultiSampler.INSTRUMENTS[instrumentName];
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		var circuit = this.circuits[key];
		if( circuit.constructor.name === "Sampler" ){
			var sampleUrl = this.bufferUrlForPitch(this.scale[idx]);
			if(sampleUrl){
				circuit.setBuffer(sampleUrl);
			}
		}
	}, this);
};


MultiSampler.prototype.defaultCircuit = function(ordinal){
	return { 
		id: null, 
		ordinal: ordinal, 
		handle: "Sampler", 
		notes: [], 
		settings: {
			bufferUrl: "circuits/Sampler/samples/Vibe_A3.wav"
		}
	};
};



MultiSampler.prototype.generateMachineBody = function(machineBody){	
	var self = this;
			
	var scaleType = machineBody.find("#MultiSampler-ScaleType").val(this.scaleType);
	Scales.scaleTypeSelector(scaleType, this.scaleType, function(ev){ 
		self.scaleType = this.value;
		self.rescale();
		self.studio.invalidateSavedStatus();
	}); 
	
	var scaleKey = machineBody.find("#MultiSampler-ScaleKey").val(this.scalePitch.color);
	Pitch.pitchKeySelector(scaleKey, this.scalePitch.color, function(ev){ 
		self.scalePitch.color = this.value;
		self.rescale();
		self.studio.invalidateSavedStatus();
	}); 
	
	var scaleOctave = machineBody.find("#MultiSampler-ScaleOctave").val(this.scalePitch.octave);
	scaleOctave.change( function(ev){ 
		self.scalePitch.octave = parseInt(this.value);
		self.rescale();
		self.studio.invalidateSavedStatus();
	}); 
	
	var instrumentSelector = machineBody.find("#MultiSampler-Instrument").val(this.instrumentName);
	for( var instrumentName in MultiSampler.INSTRUMENTS ){
		$("<option/>",{value: instrumentName, html: instrumentName.titlecase()}).appendTo(instrumentSelector);
	}
	instrumentSelector.change( function(ev){
		self.setInstrument(this.value);
		self.studio.invalidateSavedStatus();
	});
};






MultiSampler.prototype.rescale = function(){
	this.scale = Scales.scalePitches(this.scalePitch, this.scaleType, 30 );
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		var circuit = this.circuits[key];
		if( circuit.constructor.name === "Sampler" ){
			circuit.setBuffer(this.bufferUrlForPitch(this.scale[idx]));
		}
	}, this);
	this.studio.invalidateSavedStatus();
};

MultiSampler.prototype.bufferUrlForPitch = function(pitch){
	var sampleFile = this.instrument[pitch.pitchName()];
	if(sampleFile){
		return "samples/" + this.instrumentName + "/" + sampleFile;
	} else {
		return null;
	}
};


MultiSampler.prototype.marshalSettings = function(){
	var ret = Machine.prototype.marshalSettings.call(this);
	ret.scaleType = this.scaleType;
	ret.instrument = this.instrumentName;
	ret.color = this.scalePitch.color;
	ret.octave = this.scalePitch.octave;
	return ret;
};


MultiSampler.INSTRUMENTS = {
	clavichord: {
		"A#2": "ClavichordA#2.wav",
		"A2": "ClavichordA2.wav",
		"B3": "ClavichordB3.wav",
		"C#5": "ClavichordC#5.wav",
		"C6": "ClavichordC6.wav",
		"D3": "ClavichordD3.wav",
		"E4": "ClavichordE4.wav",
		"F3": "ClavichordF3.wav",
		"G#5": "ClavichordG#5.wav",
		"A#3": "ClavichordA#3.wav",
		"A3": "ClavichordA3.wav",
		"B4": "ClavichordB4.wav",
		"C#6": "ClavichordC#6.wav",
		"D#2": "ClavichordD#2.wav",
		"D4": "ClavichordD4.wav",
		"E5": "ClavichordE5.wav",
		"F4": "ClavichordF4.wav",
		"G2": "ClavichordG2.wav",
		"A#4": "ClavichordA#4.wav",
		"A4": "ClavichordA4.wav",
		"B5": "ClavichordB5.wav",
		"C2": "ClavichordC2.wav",
		"D#3": "ClavichordD#3.wav",
		"D5": "ClavichordD5.wav",
		"F#2": "ClavichordF#2.wav",
		"F5": "ClavichordF5.wav",
		"G3": "ClavichordG3.wav",
		"A5": "ClavichordA5.wav",
		"C#2": "ClavichordC#2.wav",
		"C3": "ClavichordC3.wav",
		"D#4": "ClavichordD#4.wav",
		"D6": "ClavichordD6.wav",
		"F#3": "ClavichordF#3.wav",
		"G#2": "ClavichordG#2.wav",
		"G4": "ClavichordG4.wav",
		"A#5": "ClavichordA#5.wav",
		"C#3": "ClavichordC#3.wav",
		"C4": "ClavichordC4.wav",
		"D#5": "ClavichordD#5.wav",
		"E2": "ClavichordE2.wav",
		"F#4": "ClavichordF#4.wav",
		"G#3": "ClavichordG#3.wav",
		"G5": "ClavichordG5.wav",
		"A1": "ClavichordA1.wav",
		"B2": "ClavichordB2.wav",
		"C#4": "ClavichordC#4.wav",
		"C5": "ClavichordC5.wav",
		"D2": "ClavichordD2.wav",
		"E3": "ClavichordE3.wav",
		"F#5": "ClavichordF#5.wav",
		"G#4": "ClavichordG#4.wav",
		"F2": "ClavichordF2.wav"
	},
	bowed_crotales: {
		"A#1": "A#1_crotbow.wav",
		"A2": "A2_crotbow.wav",
		"C#1": "C#1_crotbow.wav",
		"C2": "C2_crotbow.wav",
		"D#2": "D#2_crotbow.wav",
		"E1": "E1_crotbow.wav",
		"F#2": "F#2_crotbow.wav",
		"G#1": "G#1_crotbow.wav",
		"G2": "G2_crotbow.wav",
		"A#2": "A#2_crotbow.wav",
		"B1": "B1_crotbow.wav",
		"C#2": "C#2_crotbow.wav",
		"C3": "C3_crotbow.wav",
		"D1": "D1_crotbow.wav",
		"E2": "E2_crotbow.wav",
		"F1": "F1_crotbow.wav",
		"G#2": "G#2_crotbow.wav",
		"A1": "A1_crotbow.wav",
		"B2": "B2_crotbow.wav",
		"C1": "C1_crotbow.wav",
		"D#1": "D#1_crotbow.wav",
		"D2": "D2_crotbow.wav",
		"F#1": "F#1_crotbow.wav",
		"F2": "F2_crotbow.wav",
		"G1": "G1_crotbow.wav"
	},
	bowed_glockenspiel: {
		"A#1": "A#1_glockbow.wav",
		"A1": "A1_glockbow.wav",
		"B1": "B1_glockbow.wav",
		"C#2": "C#2_glockbow.wav",
		"C3": "C3_glockbow.wav",
		"D#3": "D#3_glockbow.wav",
		"E2": "E2_glockbow.wav",
		"F#3": "F#3_glockbow.wav",
		"G#1": "G#1_glockbow.wav",
		"G1": "G1_glockbow.wav",
		"A#3": "A#3_glockbow.wav",
		"A3": "A3_glockbow.wav",
		"B3": "B3_glockbow.wav",
		"C#3": "C#3_glockbow.wav",
		"C4": "C4_glockbow.wav",
		"D2": "D2_glockbow.wav",
		"E3": "E3_glockbow.wav",
		"F2": "F2_glockbow.wav",
		"G#3": "G#3_glockbow.wav",
		"G3": "G3_glockbow.wav",
		"A#4": "A#4_glockbow.wav",
		"A4": "A4_glockbow.wav",
		"B4": "B4_glockbow.wav",
		"C2": "C2_glockbow.wav",
		"D#2": "D#2_glockbow.wav",
		"D3": "D3_glockbow.wav",
		"F#2": "F#2_glockbow.wav",
		"F3": "F3_glockbow.wav",
		"G#4": "G#4_glockbow.wav",
		"G4": "G4_glockbow.wav"
	}
};