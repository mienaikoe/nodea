function DrumMachine( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback);
	
	this.setInstrument(this.instrumentName);
	this.resetPlayEntire();
};

DrumMachine.extends(Machine);

DrumMachine.templateHTML = "<div id='DrumMachine'> \
    <div class='mainFields'> \
		<div class='envelope_slider'>\
			<label>Instrument</label>\
			<spiv> \
				<select id='DrumMachine-Instrument'></select> \
			</spiv> \
		</div>\
		<div class='envelope_slider'>\
			<label>Entire</label>\
			<spiv> \
				<input type='checkbox' id='DrumMachine-PlayEntire'></input> \
			</spiv> \
		</div>\
	</div> \
	<div class='mainFields'>\
		<div id='DrumMachine-Circuits'></div>\
	</div>\
</div>";


DrumMachine.prototype.extractSettings = function(settings){
	Machine.prototype.extractSettings.call(this, settings);
	
	var instrumentName = "standard_kit";
	this.playEntire = false;
	
	if( settings ){
		if( settings.instrumentName ){
			instrumentName = settings.instrumentName;
		}
		if( settings.playEntire){
			this.playEntire = settings.playEntire;
		}
	}
		
	if(!DrumMachine.INSTRUMENTS[instrumentName]){
		instrumentName = "standard_kit";
	}

	this.instrumentName = instrumentName;
};


DrumMachine.prototype.setInstrument = function(instrumentName){
	this.instrumentName = instrumentName;
	this.instrument = DrumMachine.INSTRUMENTS[instrumentName];
	this.resetBuffers();
};

DrumMachine.prototype.resetBuffers = function(){
	if(!this.circuits){
		return;
	}
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		var circuit = this.circuits[key];
		if( circuit.constructor.name === "Sampler" ){
			var sampleUrl = this.instrument[idx];
			circuit.setBuffer(sampleUrl);
		}
	}, this);
};

DrumMachine.prototype.resetPlayEntire = function(){
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		var circuit = this.circuits[key];
		if( circuit.constructor.name === "Sampler" ){
			circuit.playEntire = this.playEntire;
		}
	}, this);
};


DrumMachine.prototype.defaultCircuit = function(ordinal){
	return { 
		id: null, 
		ordinal: ordinal, 
		handle: "Sampler", 
		notes: [], 
		settings: {}
	};
};



DrumMachine.prototype.generateMachineBody = function(machineBody){	
	var self = this;
					
	var instrumentSelector = machineBody.find("#DrumMachine-Instrument");
	for( var instrumentName in DrumMachine.INSTRUMENTS ){
		$("<option/>",{value: instrumentName, html: instrumentName.titlecase()}).appendTo(instrumentSelector);
	}
	instrumentSelector.val(this.instrumentName);
	instrumentSelector.on("change", function(ev){
		self.setInstrument(this.value);
		self.studio.invalidateSavedStatus();
	});
	
	var playEntireBox = machineBody.find("#DrumMachine-PlayEntire");
	playEntireBox.prop("checked", this.playEntire);
	playEntireBox.on("change", function(ev){
		self.playEntire = this.checked;
		self.resetPlayEntire();
		$(this).blur();
	});
	
	var circuitsBox = machineBody.find("#DrumMachine-Circuits");
	var circuitRow = null;
	var circuitRowClass = "sinistra";
	this.studio.keyset.chromaticOrder.forEach(function(key, idx){
		if(idx % 5 === 0){
			circuitRow = $("<div/>",{"class":"circuitRow tiny "+circuitRowClass}).prependTo(circuitsBox);
			circuitRowClass = (circuitRowClass === "sinistra" ? "dextra" : "sinistra");
		}		
		var circuit = this.circuits[key];
		$("<spiv/>",{"class":"circuit tiny", "html": String.fromCharCode(key)}).
			click(function(ev){
				// some sort of selection lighting
				machineBody.find("#Sampler").remove();
				var fakeDivision = {body: machineBody};
				circuit.generateCircuitBody(fakeDivision);
			}).
			appendTo(circuitRow);
	}, this);
};







DrumMachine.prototype.marshalSettings = function(){
	var ret = Machine.prototype.marshalSettings.call(this);
	ret.instrumentName = this.instrumentName;
	ret.playEntire = this.playEntire;
	return ret;
};


DrumMachine.INSTRUMENTS = {
	"standard_kit": [
		"basso.wav"
	]
};