// LFO.js
var LFO = function(ctx, options){
	if(typeof options !== 'object'){
		return LFO.default();
	}
		
	this.destination = options.destination;
	this.strength = options.strength || 1;
		
	this.oscillator = ctx.createOscillator();
	this.gainer = ctx.createGain();
	
	this.oscillator.frequency.value = options.frequency;
	if(options.signalType){
		this.oscillator.type = options.signalType;
	}
	this.gainer.gain.value = options.strength;
	
	if(typeof options.bypass === 'boolean'){
		this.bypass = options.bypass;
	} else {
		this.bypass = false;
	}
	
	this.connectionTarget = null;
	
	this.oscillator.connect(this.gainer);
	this.oscillator.start(0);
};

LFO.default = function(ctx){
	return new LFO(ctx, {frequency: 3, strength: 1, destination: "volume", signalType: "sine"});
};


LFO.ATTRIBUTES = {
	frequency: {min: 0.0, max: 12.0, step: 0.01, default: 3.0},
	strength: {min: 0.0, max: 1.0, step: 0.05, default: 0.8}
};

LFO.DESTINATIONS = ["volume","frequency"];



LFO.prototype.connect = function(oscillator){
	this.connectionTarget = oscillator;
	switch(this.destination){
		case "volume":
			this.gainer.gain.value = this.strength;
			if(!this.bypass){
				this.gainer.connect(oscillator.lfoIn.gain);
			}
			break;
		case "frequency":
			this.gainer.gain.value = this.strength*100;
			if(!this.bypass){
				this.gainer.connect(oscillator.detune);
			}
			break;
	}
};


LFO.prototype.render = function(oscContainer){
	this.container = $("<div/>",{class: "lfoContainer"}).appendTo(oscContainer);
	
	var signalTypeContainer = $("<spiv/>").appendTo(this.container);
	DrawerUtils.createSelector(Oscillator.SIGNAL_TYPES, this.signalType, function(value){
		this.oscillator.type = value;
	}.bind(this), signalTypeContainer);
	$("<div/>",{class:"thicket", text: "SIGNAL TYPE"}).appendTo(signalTypeContainer);

	var destinationContainer = $("<spiv/>").appendTo(this.container);
	DrawerUtils.createSelector(LFO.DESTINATIONS, this.destination, function(value){
		this.destination = value;
	}.bind(this), destinationContainer);
	$("<div/>",{class:"thicket", text: "DESTINATION"}).appendTo(destinationContainer);
	
	DrawerUtils.createSlider("frequency", LFO.ATTRIBUTES.frequency, this.oscillator.frequency, function(key, value){
		this.oscillator.frequency.value = parseInt(value);
	}.bind(this), this.container);
	
	DrawerUtils.createSlider("strength", LFO.ATTRIBUTES.strength, this.strength, function(key, value){
		this.strength = parseFloat(value);
	}.bind(this), this.container);
};

LFO.prototype.toggleBypass = function(){
	this.bypass = !this.bypass;
	this.container.toggleClass("bypass");
	if(this.bypass){
		this.gainer.disconnect();
	} else {
		this.connect(this.connectionTarget);
	}
};



LFO.prototype.marshal = function(){
	return {
		frequency: this.oscillator.frequency.value,
		type: this.oscillator.type,
		strength: this.strength,
		destination: this.destination,
		bypass: this.bypass
	};
};


LFO.prototype.destroy = function(){
	this.oscillator.disconnect();
	this.gainer.disconnect();
	delete this.oscillator;
	delete this.gainer;
};








// Oscillator.js
function Oscillator(ctx, machine, marshaledCircuit, destination, circuitReplacementCallback) {
	/* The Super Constructor will Instantiate things 
	 * that every circuit needs, including each 
	 * visual component and the event ties for each one.
	 **/
	Circuit.call(this, ctx, machine, marshaledCircuit, destination, circuitReplacementCallback);
	
	/* Build out any further initialization you need 
	 * to do here. 
	 */
	this.controls.oscillators = [];
	
	this.oscillatorNodes = [];
};

Oscillator.extends(Circuit);


Oscillator.prototype.extractSettings = function(settings){
	Circuit.prototype.extractSettings.call(this, settings);
	if(settings){
		if(settings.pitch){
			this.pitch = new Pitch(settings.pitch.color, settings.pitch.octave);
		}
		
		this.oscillatorAttributes = [];
		if(settings.oscillatorAttributes){
			settings.oscillatorAttributes.forEach(function(oscSettings){
				this.oscillatorAttributes.push(this.extractOscillatorSettings(oscSettings));
			}, this);
		}
		if(this.oscillatorAttributes.length === 0){
			this.oscillatorAttributes.push(Oscillator.DEFAULT_OSCILLATOR);
		}
	}
	
	if(!this.pitch){
		this.pitch = Oscillator.DEFAULT_PITCH;
	}
};

Oscillator.DEFAULT_PITCH = new Pitch("A",4);

Oscillator.DEFAULT_OSCILLATOR = {
	signalType: "sine",
	offset: {semitones: 0, cents: 0},
	volume: 1
};

Oscillator.SIGNAL_TYPES = [
	"sine","square","sawtooth","triangle"
];


Oscillator.prototype.extractOscillatorSettings = function(settings){
	var osc = {};
	if( settings){
		/* Any necessary settings that you add in the marshalSettings function 
		 * will be in settings
		 */
		if(settings.offset){
			osc.offset = settings.offset;
		}
		if(settings.signalType){
			osc.signalType = settings.signalType;
		}
		if(settings.volume){
			osc.volume = settings.volume;
		}
		if(settings.lfo){
			osc.lfo = new LFO(this.ctx,settings.lfo);
		}
	}
	
	if(!osc.offset){
		osc.offset = {semitones: 0, cents: 0};
	}
	if(!osc.signalType){
		osc.signalType = "sine";
	}
	if(!osc.volume){
		osc.volume = 1;
	}
	if(!osc.lfo){
		osc.lfo = LFO.default(this.ctx);
	}
	
	return osc;
};




Oscillator.prototype.addOscillator = function(){
	var defaultOsc = Oscillator.DEFAULT_OSCILLATOR;
	defaultOsc.lfo = LFO.default(this.ctx);
	
	this.oscillatorAttributes.push(Oscillator.DEFAULT_OSCILLATOR);
	this.generateDrawer();
};

Oscillator.prototype.removeOscillator = function(oscillator){
	var idx = this.oscillatorAttributes.indexOf(oscillator);
	if(idx > -1){
		this.oscillatorAttributes.splice(idx,1);
		oscillator.lfo.destroy();
	}
	this.generateDrawer();
};


Oscillator.prototype.repitch = function(pitch){
	this.pitch = pitch;
	if( this.isDisplaying() ){
		this.circuitBody.find("#Oscillator-Color").val(pitch.color).change();
		this.circuitBody.find("#Oscillator-Octave").val(pitch.octave).change();
	}
	this.resetOscillators();
};




/*
 * --- Drawer Layout ---
 * 
 * @param circuitBody is the main element of the drawer.
 * circuitBody has already been filled out with the contents of {handle}.html
 * Use this function to fill in info, turn knobs, attach events on {handle}.html
 */

Oscillator.prototype.generateCircuitBody = function(circuitBody){
	var self = this;
	
	// Pitch
	this.controls.colorSelector = $(circuitBody).find("#Oscillator-Color");
	Pitch.pitchKeySelector(this.controls.colorSelector, this.pitch.color,	function(ev){ 
		self.color = this.value;
		studio.invalidateSavedStatus(); 
	});
	
	this.controls.octaveSelector = $(circuitBody).find("#Oscillator-Octave");
	this.controls.octaveSelector.
		val(this.pitch.octave).
		change(	function(ev){ 
			self.octave = this.value;
			studio.invalidateSavedStatus(); 
		});
		
	this.controls.oscillatorAdder = $(circuitBody).find("#Oscillator-Add");
	this.controls.oscillatorAdder.
		click(	function(ev){ 
			self.addOscillator();
			studio.invalidateSavedStatus(); 
		});
				
	var oscillatorList = $(circuitBody).find("#Oscillator-List");
	this.oscillatorAttributes.forEach( function(oscillator, idx){
		var oscillatorControls = this.generateOscillatorBody(oscillator, oscillatorList, idx);
		this.controls.oscillators[idx] = oscillatorControls;
	}, this);
};



Oscillator.prototype.generateOscillatorBody = function(oscillator, oscillatorList, idx){
	var self = this;
	var oscillatorDiv = $("<div/>",{id:"oscillator_"+idx, class:"listed"}).appendTo(oscillatorList);

	var fieldLabel = $("<div/>",{class:"fieldLabel",text:"Signal "+(idx+1)}).appendTo(oscillatorDiv);
	var oscRemover = $("<div/>",{class:"toggler dextra",text:"\u00d7"}).
			appendTo(fieldLabel).
			mouseover(function(ev){
				$(this).addClass("hover");
			}).
			mouseout(function(ev){
				$(this).removeClass("hover");
			}).
			click(function(ev){
				self.oscillatorAttributes.splice(idx,1);
				self.resetOscillators();
				oscillatorDiv.remove();
			});

	// Volume
	var volumeSlider = DrawerUtils.createSlider("volume", Circuit.GAIN_ATTRIBUTES.volume, oscillator.volume, 
		function(key, value){
			oscillator.volume = value;
			self.resetOscillators();
			studio.invalidateSavedStatus();
		}.bind(this), oscillatorDiv);

	// Signal Type
	var signalDiv = $("<spiv></spiv>").appendTo(oscillatorDiv);
	var signalTypeSelector = DrawerUtils.createSelector(Oscillator.SIGNAL_TYPES, oscillator.signalType, function(value){ 
		oscillator.signalType = value;
		this.resetOscillators();
		studio.invalidateSavedStatus();
	}.bind(this), signalDiv);
	$("<div class='thicket'>SIGNAL TYPE</div>").appendTo(signalDiv);

	// Semitones
	var semitoneDiv = $("<spiv></spiv>").appendTo(oscillatorDiv);
	var semitoneInput = $("<input/>",{type:"number",value:oscillator.offset.semitones, class:"short"}).
			appendTo(semitoneDiv).
			change(function(ev){
				oscillator.offset.semitones = parseInt(this.value);
			});
	$("<div class='thicket'>SEMITONES</div>").appendTo(semitoneDiv);

	// Cents
	var centsDiv = $("<spiv></spiv>").appendTo(oscillatorDiv);
	var centsInput = $("<input/>",{type:"number",value:oscillator.offset.cents, class:"short"}).
			appendTo(centsDiv).
			change(function(ev){
				oscillator.offset.cents = parseInt(this.value);
			});
	$("<div class='thicket'>CENTS</div>").appendTo(centsDiv);
	
	// LFO
	var lfoLabel = $("<div/>",{class:"fieldLabel sub", text: "LFO "+(idx+1)}).appendTo(oscillatorDiv);
	var lfoBypass = $("<div/>",{class:"toggler dextra",text:(oscillator.lfo.bypass ? "off" : "on")}).
			appendTo(lfoLabel).
			mouseover(function(ev){
				$(this).addClass("hover");
			}).
			mouseout(function(ev){
				$(this).removeClass("hover");
			}).
			click(function(ev){
				oscillator.lfo.toggleBypass();
				$(this).html(oscillator.lfo.bypass ? "off" : "on");
			});
	
	oscillator.lfo.render(oscillatorDiv);
	
	// Return manifest of all controls created
	return {
		oscRemover: oscRemover,
		volumeSlider: volumeSlider,
		signalTypeSelector: signalTypeSelector,
		semitoneInput: semitoneInput,
		centsInput: centsInput,
		lfoBypass: lfoBypass
	};
};





/*
 * --- Note Creation ---
 * 
 * These functions are here if you want to override them. In many cases, 
 * you'll want to do something extra to the note object. If your circuit
 * won't need these, then feel free to delete them.
 */
Oscillator.prototype.addNote = function(note){
	Circuit.prototype.addNote.call(this, note);
	note.oscillators = this.allocateOscillators();
	note.oscillators.forEach(function(oscillator){
		oscillator.gainer.connect(note.envelope);
	});
};
Oscillator.prototype.deleteNote = function(note){	
	note.oscillators.forEach(function(oscillator){
		this.deallocateOscillator(oscillator);
	}, this);
	Circuit.prototype.deleteNote.call(this, note);
};

Oscillator.prototype.allocateOscillators = function(){
	var oscillators = [];
	this.oscillatorAttributes.forEach(function(oscillator){
		var oscNode = this.ctx.createOscillator();
		oscNode.type = oscillator.signalType;
		oscNode.frequency.value = Pitch.addCents(this.pitch.frequency, (oscillator.offset.semitones*100)+oscillator.offset.cents); // detune is reserved for LFO
		oscNode.gainer = this.ctx.createGain();
		oscNode.gainer.gain.value = oscillator.volume;
		oscNode.lfoIn = this.ctx.createGain();
		
		oscillator.lfo.connect(oscNode);
		oscNode.connect(oscNode.lfoIn);
		oscNode.lfoIn.connect(oscNode.gainer);
		
		oscillators.push(oscNode);
	}, this);
	return oscillators;
};

Oscillator.prototype.deallocateOscillator = function(osc){
	if(osc){ osc.disconnect(0); }
};


/*
 * --- Playback ---
 *		
 * These functions alert your circuit to when the User has requested
 * the song to Play or Pause. 
 * @param sliversPerSecond is an integer that represents the Studio's
 *			note resolution. Combine this with a variable in units of 
 *			slivers or seconds to translate between the two units.
 * @param startAt is an integer that represents the sliver that the
 *			playback should begin at. Schedule your notes based
 *			on this parameter.
 */
Oscillator.prototype.scheduleCircuitStart = function(startWhen, note){
	var delayTime = Circuit.prototype.scheduleCircuitStart.call(this, startWhen, note);
	note.oscillators.forEach(function(oscillator){
		oscillator.start(startWhen + delayTime);
	});
	return delayTime;
};

Oscillator.prototype.scheduleCircuitStop = function(endWhen, note){
	var delayTime = Circuit.prototype.scheduleCircuitStop.call(this, endWhen, note);
	note.oscillators.forEach(function(oscillator){
		oscillator.stop(endWhen + delayTime);
	});
	return delayTime;
};

Oscillator.prototype.pause = function(){
	Circuit.prototype.pause.call(this);
	this.resetOscillators();
};



Oscillator.prototype.resetOscillators = function(){
	this.notes.forEach(function(note){ 
		note.oscillators.forEach(function(osc){
			this.deallocateOscillator(osc);
		}, this);
		note.oscillators = this.allocateOscillators();
		note.oscillators.forEach(function(oscillator){
			oscillator.gainer.connect(note.envelope);
		});
	}, this);
};










/*
 * --- User Input ---
 * 
 * The following functions (on,off) notify your Circuit
 * when the user has pressed the key bound to your circuit.
 * Use these functions to audibly play your note. All else 
 * will be handled for you 
 */

Oscillator.prototype.on = function(location) {
	Circuit.prototype.on.call(this, location);
	this.envelope = this.allocateEnvelope();
	this.oscillatorNodes.forEach(function(osc){
		this.deallocateOscillator(osc);
	}, this);
	this.oscillatorNodes = this.allocateOscillators();
	this.oscillatorNodes.forEach(function(oscNode){
		oscNode.gainer.connect(this.envelope);
	}, this);
	this.scheduleCircuitStart(this.ctx.currentTime, {oscillators: this.oscillatorNodes, envelope: this.envelope});
};


Oscillator.prototype.off = function(location) {
	Circuit.prototype.off.call(this, location);
	if( this.oscillatorNodes && this.envelope ){
		this.scheduleCircuitStop(this.ctx.currentTime, {oscillators: this.oscillatorNodes, envelope: this.envelope});
	}
};







/* --- Marshaling ---
 * 
 * This function is for saving any settings you have on your circuit 
 * that you want passed to its constructor whenever this instance of 
 * your Circuit is created. This will appear in the constructor as 
 * persistedNoda.settings
 */

Oscillator.prototype.marshalSettings = function(){
	ret = Circuit.prototype.marshalSettings.call(this);
	if( this.pitch ){
		ret.pitch = this.pitch.marshal();
	}
	if( this.oscillatorAttributes ){
		ret.oscillatorAttributes = [];
		this.oscillatorAttributes.forEach(function(osc){
			ret.oscillatorAttributes.push({
				signalType: osc.signalType,
				offset: osc.offset,
				volume: osc.volume,
				lfo: osc.lfo.marshal()
			});
		});
	}
	return ret;
};
