function MultiSampler( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback);
	
	this.setInstrument(this.instrumentName);
	this.resetPlayEntire();
};

MultiSampler.extends(Machine);

MultiSampler.templateHTML = "<div id='MultiSampler'> \
    <div class='mainFields'> \
		<div class='envelope_slider'>\
			<label>Scale Type</label>\
			<spiv> \
				<select id='MultiSampler-ScaleType'></select> \
			</spiv> \
		</div>\
		<div class='envelope_slider'>\
			<label>Scale Pitch</label>\
			<spiv class='encroach'> \
				<select class='medium' id='MultiSampler-ScaleKey'></select> \
				<div class='thicket'>KEY</div> \
			</spiv> \
			<spiv class='encroach'> \
				<input type='number' id='MultiSampler-ScaleOctave'></input> \
				<div class='thicket'>OCTAVE</div> \
			</spiv> \
		</div>\
		<div class='envelope_slider'>\
			<label>Instrument</label>\
			<spiv> \
				<select id='MultiSampler-Instrument'></select> \
			</spiv> \
		</div>\
		<div class='envelope_slider'>\
			<label>Entire</label>\
			<spiv> \
				<input type='checkbox' id='MultiSampler-PlayEntire'></input> \
			</spiv> \
		</div>\
	</div> \
</div>";


MultiSampler.prototype.extractSettings = function(settings){
	Machine.prototype.extractSettings.call(this, settings);
	
	var scaleColor = "C";
	var scaleOctave = 4;
	var instrumentName = "clavichord";
	this.playEntire = false;
	
	if( settings ){
		if( settings.scaleType ){
			this.scaleType = settings.scaleType;
		}
		if( settings.instrumentName ){
			instrumentName = settings.instrumentName;
		}
		if( settings.color ){
			scaleColor = settings.color;
		}
		if( settings.octave){
			scaleOctave = settings.octave;
		}
		if( settings.entire){
			this.playEntire = settings.playEntire;
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
	this.resetBuffers();
};

MultiSampler.prototype.resetBuffers = function(){
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		var circuit = this.circuits[key];
		if( circuit.constructor.name === "Sampler" ){
			var sampleUrl = this.bufferUrlForPitch(this.scale[idx]);
			if(sampleUrl){
				circuit.setBuffer(sampleUrl);
			} else {
				circuit.unsetBuffer();
			}
		}
	}, this);
};

MultiSampler.prototype.resetPlayEntire = function(){
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		var circuit = this.circuits[key];
		if( circuit.constructor.name === "Sampler" ){
			circuit.playEntire = this.playEntire;
		}
	}, this);
};


MultiSampler.prototype.defaultCircuit = function(ordinal){
	return { 
		id: null, 
		ordinal: ordinal, 
		handle: "Sampler", 
		notes: [], 
		settings: {}
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
	
	var instrumentSelector = machineBody.find("#MultiSampler-Instrument");
	for( var instrumentName in MultiSampler.INSTRUMENTS ){
		$("<option/>",{value: instrumentName, html: instrumentName.titlecase()}).appendTo(instrumentSelector);
	}
	instrumentSelector.val(this.instrumentName);
	instrumentSelector.change( function(ev){
		self.setInstrument(this.value);
		self.studio.invalidateSavedStatus();
	});
	
	var playEntireBox = machineBody.find("#MultiSampler-PlayEntire");
	playEntireBox.change( function(ev){
		self.playEntire = this.checked;
		self.resetPlayEntire();
	});
};






MultiSampler.prototype.rescale = function(){
	this.scale = Scales.scalePitches(this.scalePitch, this.scaleType, 30 );
	this.resetBuffers();
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
	ret.instrumentName = this.instrumentName;
	ret.color = this.scalePitch.color;
	ret.octave = this.scalePitch.octave;
	ret.playEntire = this.playEntire;
	return ret;
};


MultiSampler.INSTRUMENTS = {
	clavichord: {
		"A#2": "ClavichordAs2.wav",
		"A2": "ClavichordA2.wav",
		"B3": "ClavichordB3.wav",
		"C#5": "ClavichordCs5.wav",
		"C6": "ClavichordC6.wav",
		"D3": "ClavichordD3.wav",
		"E4": "ClavichordE4.wav",
		"F3": "ClavichordF3.wav",
		"G#5": "ClavichordGs5.wav",
		"A#3": "ClavichordAs3.wav",
		"A3": "ClavichordA3.wav",
		"B4": "ClavichordB4.wav",
		"C#6": "ClavichordCs6.wav",
		"D#2": "ClavichordDs2.wav",
		"D4": "ClavichordD4.wav",
		"E5": "ClavichordE5.wav",
		"F4": "ClavichordF4.wav",
		"G2": "ClavichordG2.wav",
		"A#4": "ClavichordAs4.wav",
		"A4": "ClavichordA4.wav",
		"B5": "ClavichordB5.wav",
		"C2": "ClavichordC2.wav",
		"D#3": "ClavichordDs3.wav",
		"D5": "ClavichordD5.wav",
		"F#2": "ClavichordFs2.wav",
		"F5": "ClavichordF5.wav",
		"G3": "ClavichordG3.wav",
		"A5": "ClavichordA5.wav",
		"C#2": "ClavichordCs2.wav",
		"C3": "ClavichordC3.wav",
		"D#4": "ClavichordDs4.wav",
		"D6": "ClavichordD6.wav",
		"F#3": "ClavichordFs3.wav",
		"G#2": "ClavichordGs2.wav",
		"G4": "ClavichordG4.wav",
		"A#5": "ClavichordAs5.wav",
		"C#3": "ClavichordCs3.wav",
		"C4": "ClavichordC4.wav",
		"D#5": "ClavichordDs5.wav",
		"E2": "ClavichordE2.wav",
		"F#4": "ClavichordFs4.wav",
		"G#3": "ClavichordGs3.wav",
		"G5": "ClavichordG5.wav",
		"A1": "ClavichordA1.wav",
		"B2": "ClavichordB2.wav",
		"C#4": "ClavichordCs4.wav",
		"C5": "ClavichordC5.wav",
		"D2": "ClavichordD2.wav",
		"E3": "ClavichordE3.wav",
		"F#5": "ClavichordFs5.wav",
		"G#4": "ClavichordGs4.wav",
		"F2": "ClavichordF2.wav"
	},
	bowed_crotales: {
		"A#7": "As1_crotbow.wav",
		"A8": "A2_crotbow.wav",
		"C#7": "Cs1_crotbow.wav",
		"C8": "C2_crotbow.wav",
		"D#8": "Ds2_crotbow.wav",
		"E7": "E1_crotbow.wav",
		"F#8": "Fs2_crotbow.wav",
		"G#7": "Gs1_crotbow.wav",
		"G8": "G2_crotbow.wav",
		"A#8": "As2_crotbow.wav",
		"B7": "B1_crotbow.wav",
		"C#8": "Cs2_crotbow.wav",
		"C9": "C3_crotbow.wav",
		"D7": "D1_crotbow.wav",
		"E8": "E2_crotbow.wav",
		"F7": "F1_crotbow.wav",
		"G#8": "Gs2_crotbow.wav",
		"A7": "A1_crotbow.wav",
		"B8": "B2_crotbow.wav",
		"C7": "C1_crotbow.wav",
		"D#7": "Ds1_crotbow.wav",
		"D8": "D2_crotbow.wav",
		"F#7": "Fs1_crotbow.wav",
		"F8": "F2_crotbow.wav",
		"G7": "G1_crotbow.wav"
	},
	bowed_glockenspiel: {
		"A#7": "As1_glockbow.wav",
		"A7": "A1_glockbow.wav",
		"B7": "B1_glockbow.wav",
		"C#8": "Cs2_glockbow.wav",
		"C9": "C3_glockbow.wav",
		"D#9": "Ds3_glockbow.wav",
		"E8": "E2_glockbow.wav",
		"F#9": "Fs3_glockbow.wav",
		"G#7": "Gs1_glockbow.wav",
		"G7": "G1_glockbow.wav",
		"A#9": "As3_glockbow.wav",
		"A9": "A3_glockbow.wav",
		"B9": "B3_glockbow.wav",
		"C#9": "Cs3_glockbow.wav",
		"C10": "C4_glockbow.wav",
		"D8": "D2_glockbow.wav",
		"E9": "E3_glockbow.wav",
		"F8": "F2_glockbow.wav",
		"G#9": "Gs3_glockbow.wav",
		"G9": "G3_glockbow.wav",
		"A#10": "As4_glockbow.wav",
		"A10": "A4_glockbow.wav",
		"B10": "B4_glockbow.wav",
		"C8": "C2_glockbow.wav",
		"D#8": "Ds2_glockbow.wav",
		"D9": "D3_glockbow.wav",
		"F#8": "Fs2_glockbow.wav",
		"F9": "F3_glockbow.wav",
		"G#10": "Gs4_glockbow.wav",
		"G10": "G4_glockbow.wav"
	}
};