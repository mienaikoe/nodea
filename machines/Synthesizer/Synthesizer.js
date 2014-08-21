function Synthesizer( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback);
	
	this.rescale();
};

Synthesizer.extends(Machine);

Synthesizer.templateHTML = "<div id='Synthesizer'> \
    <div class='mainFields'> \
		<div class='envelope_slider'>\
			<label>Scale Type</label>\
			<spiv> \
				<select id='Synthesizer-ScaleType'></select> \
			</spiv> \
		</div>\
    </div> \
</div>";


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
			signalsAttributes: [
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
			DrawerUtils.createDivision(machineSection.body, "Oscillator Template"));
	
	var envelopeDivision = this.templateOscillator.generateEnvelopeDivision(
			DrawerUtils.createDivision(machineSection.body, "Amp Envelope"));
	
	this.bindControls(this.templateOscillator.controls);	
};

Synthesizer.prototype.bindControls = function(controls){
	// Callbacks on Osc Controls
	var self = this;
	var oscControls = this.templateOscillator.controls;
	oscControls.colorSelector.change(function(ev){
		self.rescale();
		self.studio.invalidateSavedStatus(); 
	});
	oscControls.octaveSelector.change(function(ev){
		self.rescale();
		self.studio.invalidateSavedStatus(); 
	});
	
	
	
	// Callbacks on each Oscillator
	function eachOscCallbackConstructor(index, signalCallback){
		return function(ev){
			for( ordinal in self.circuits ){
				var circuit = self.circuits[ordinal];
				var signal = null;
				if(circuit.constructor.name === "Oscillator"){
					if(typeof index === 'number'){
						signal = circuit.signalsAttributes[index];
					}
					signalCallback(circuit, signal, this);
				}
			}
			studio.invalidateSavedStatus();
		};
	}
	
	oscControls.signalAdder.click(	eachOscCallbackConstructor(null, 
			function(oscillator, signal, control){
				oscillator.addSignal();
				self.generateDrawer();
			})
	);

	this.templateOscillator.signalsAttributes.forEach(function(signal, idx){
		var signalControls = signal.controls;
		signalControls.signalRemover.click( eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				oscillator.removeSignal(signal);
				self.generateDrawer();
			}) );
		
		signalControls.volumeSlider.change( eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				signal.volume = control.value;
				oscillator.resetSignals();
				if(signal.controls && signal.controls.volumeSlider){
					signal.controls.volumeSlider.value = control.value;
				}
			}) );
			
		signalControls.signalTypeSelector.change( eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				signal.signalType = control.value;
				oscillator.resetSignals();
				if(signal.controls && signal.controls.volumeSlider){
					signal.controls.volumeSlider.value = control.value;
				}
			}) );	
		
		signalControls.semitoneInput.change( eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				signal.offset.semitones = parseInt(control.value);
				oscillator.resetSignals();
			}) );
			
		signalControls.centsInput.change( eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				signal.offset.cents = parseInt(control.value);
				oscillator.resetSignals();
			}) );	


		// LFO Controls
		signalControls.lfoBypass.click( eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				signal.lfo.toggleBypass();
			}) );
			
		signalControls.lfo.signalTypeSelector.change(eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				signal.lfo.signal.type = control.value;
			}) );
			
		signalControls.lfo.destinationSelector.change(eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				signal.lfo.destination = control.value;
				oscillator.resetSignals();
			}) );
			
		signalControls.lfo.frequencySlider.change(eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				signal.lfo.signal.frequency.value = parseInt(control.value);
			}) );
			
		signalControls.lfo.strengthSlider.change(eachOscCallbackConstructor(idx, 
			function(oscillator, signal, control){
				signal.lfo.strength = parseFloat(control.value);
			}) );
	});
	
	for(var key in Circuit.ENVELOPE_ATTRIBUTES){
		var attributes = Circuit.ENVELOPE_ATTRIBUTES[key];
		var changer = (function(attrKey){
			return eachOscCallbackConstructor(null,
				function(oscillator, signal, control){
					oscillator.envelopeAttributes[attrKey] = parseFloat(control.value);
				}
			);
		}(key));
		controls.envelope[key].change(changer);
	}
};







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