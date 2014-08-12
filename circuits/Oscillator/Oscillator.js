// LFO.js
var LFO = function(ctx, options){
	if(typeof options !== 'object'){
		return LFO.default();
	}
		
	this.destination = options.destination;
	this.strength = options.strength || 1;
		
	this.signal = ctx.createOscillator();
	this.gainer = ctx.createGain();
	
	this.signal.frequency.value = options.frequency;
	if(options.signalType){
		this.signal.type = options.signalType;
	}
	this.gainer.gain.value = options.strength;
	
	if(typeof options.bypass === 'boolean'){
		this.bypass = options.bypass;
	} else {
		this.bypass = false;
	}
	
	this.connectionTarget = null;
	
	this.signal.connect(this.gainer);
	this.signal.start(0);
};

LFO.default = function(ctx){
	return new LFO(ctx, {frequency: 3, strength: 1, destination: "volume", signalType: "sine", bypass: false});
};


LFO.ATTRIBUTES = {
	frequency: {min: 0.0, max: 12.0, step: 0.01, default: 3.0},
	strength: {min: 0.0, max: 1.0, step: 0.05, default: 0.8}
};

LFO.DESTINATIONS = ["volume","frequency"];



LFO.prototype.connect = function(signal){
	this.connectionTarget = signal;
	switch(this.destination){
		case "volume":
			this.gainer.gain.value = this.strength;
			if(!this.bypass){
				this.gainer.connect(signal.lfoIn.gain);
			}
			break;
		case "frequency":
			this.gainer.gain.value = this.strength*100;
			if(!this.bypass){
				this.gainer.connect(signal.detune);
			}
			break;
	}
};


LFO.prototype.render = function(oscContainer){
	this.container = $("<div/>",{class: "lfoContainer"}).appendTo(oscContainer);
	
	var signalTypeContainer = $("<spiv/>").appendTo(this.container);
	var signalTypeSelector = DrawerUtils.createSelector(Oscillator.SIGNAL_TYPES, this.signalType, function(value){
		this.signal.type = value;
	}.bind(this), signalTypeContainer);
	$("<div/>",{class:"thicket", text: "SIGNAL TYPE"}).appendTo(signalTypeContainer);

	var destinationContainer = $("<spiv/>").appendTo(this.container);
	var destinationSelector = DrawerUtils.createSelector(LFO.DESTINATIONS, this.destination, function(value){
		this.destination = value;
	}.bind(this), destinationContainer);
	$("<div/>",{class:"thicket", text: "DESTINATION"}).appendTo(destinationContainer);
	
	var frequencySlider = DrawerUtils.createSlider("frequency", LFO.ATTRIBUTES.frequency, this.signal.frequency, function(key, value){
		this.signal.frequency.value = parseInt(value);
	}.bind(this), this.container);
	
	var strengthSlider = DrawerUtils.createSlider("strength", LFO.ATTRIBUTES.strength, this.strength, function(key, value){
		this.strength = parseFloat(value);
	}.bind(this), this.container);
	
	this.controls = {
		signalTypeSelector : signalTypeSelector,
		destinationSelector: destinationSelector,
		frequencySlider: frequencySlider,
		strengthSlider: strengthSlider
	};
	return this.controls;
};

LFO.prototype.toggleBypass = function(){
	this.bypass = !this.bypass;
	if(this.bypass){
		this.gainer.disconnect();
	} else {
		if(this.connectTarget){
			this.connect(this.connectionTarget);
		}
	}
	if( this.bypassToggler ){
		$(this.bypassToggler).html(this.bypass ? "off" : "on");
	}
	if( this.container ){
		this.container.toggleClass("bypass");
	}
};



LFO.prototype.marshal = function(){
	return {
		frequency: this.signal.frequency.value,
		type: this.signal.type,
		strength: this.strength,
		destination: this.destination,
		bypass: this.bypass
	};
};


LFO.prototype.destroy = function(){
	this.signal.disconnect();
	this.gainer.disconnect();
	delete this.signal;
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
	this.controls.signals = [];
	
	this.signalNodes = [];
};

Oscillator.extends(Circuit);

Oscillator.templateHTML = "<div id='Oscillator'>\
    <div class='fieldLabel'>Pitch</div>\
    <div class='mainFields'>\
        <spiv>\
            <select id='Oscillator-Color'></select>\
            <div class='thicket'>KEY</div>\
        </spiv>\
        <spiv>\
            <input type='number' class='short' id='Oscillator-Octave'></input>\
            <div class='thicket'>OCTAVE</div>\
        </spiv>\
        <button id='Oscillator-Add'>add signal</button>\
    </div>\
    <div id='Oscillator-List' class='mainFields'></div>\
</div>";


Oscillator.prototype.extractSettings = function(settings){
	Circuit.prototype.extractSettings.call(this, settings);
	if(settings){
		if(settings.pitch){
			this.pitch = new Pitch(settings.pitch.color, parseInt(settings.pitch.octave));
		}
		
		this.signalsAttributes = [];
		if(settings.signalsAttributes){
			settings.signalsAttributes.forEach(function(oscSettings){
				this.signalsAttributes.push(this.extractSignalSettings(oscSettings));
			}, this);
		}
		if(this.signalsAttributes.length === 0){
			this.signalsAttributes.push(Oscillator.defaultSignal(this.ctx));
		}
	}
	
	if(!this.pitch){
		this.pitch = Oscillator.DEFAULT_PITCH;
	}
};

Oscillator.DEFAULT_PITCH = new Pitch("A",4);

Oscillator.defaultSignal = function(ctx){
	return {
		signalType: "sine",
		offset: {semitones: 0, cents: 0},
		volume: 1,
		lfo: LFO.default(ctx)
	};
};

Oscillator.SIGNAL_TYPES = [
	"sine","square","sawtooth","triangle"
];


Oscillator.prototype.extractSignalSettings = function(settings){
	var signal = {};
	if( settings){
		/* Any necessary settings that you add in the marshalSettings function 
		 * will be in settings
		 */
		if(settings.offset){
			signal.offset = settings.offset;
		}
		if(settings.signalType){
			signal.signalType = settings.signalType;
		}
		if(settings.volume){
			signal.volume = settings.volume;
		}
		if(settings.lfo){
			signal.lfo = new LFO(this.ctx,settings.lfo);
		}
	}
	
	if(!signal.offset){
		signal.offset = {semitones: 0, cents: 0};
	}
	if(!signal.signalType){
		signal.signalType = "sine";
	}
	if(!signal.volume){
		signal.volume = 1;
	}
	if(!signal.lfo){
		signal.lfo = LFO.default(this.ctx);
	}
	
	return signal;
};




Oscillator.prototype.addSignal = function(){
	this.signalsAttributes.push(Oscillator.defaultSignal(this.ctx));
	this.generateDrawer();
};

Oscillator.prototype.removeSignal = function(signal){
	var idx = this.signalsAttributes.indexOf(signal);
	if(idx > -1){
		this.signalsAttributes.splice(idx,1);
		signal.lfo.destroy();
		this.resetSignals();
		if(signal.signalDiv){
			signal.signalDiv.remove();
		}
	}
};


Oscillator.prototype.repitch = function(pitch){
	this.pitch = pitch;
	if( this.isDisplaying() ){
		this.circuitBody.find("#Oscillator-Color").val(pitch.color).change();
		this.circuitBody.find("#Oscillator-Octave").val(pitch.octave).change();
	}
	this.resetSignals();
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
		self.pitch.color = this.value;
		studio.invalidateSavedStatus(); 
	});
	
	this.controls.octaveSelector = $(circuitBody).find("#Oscillator-Octave");
	this.controls.octaveSelector.
		val(this.pitch.octave).
		change(	function(ev){ 
			self.pitch.octave = this.value;
			studio.invalidateSavedStatus(); 
		});
		
	this.controls.signalAdder = $(circuitBody).find("#Oscillator-Add");
	this.controls.signalAdder.
		click(	function(ev){ 
			self.addSignal();
			studio.invalidateSavedStatus(); 
		});
				
	var signalList = $(circuitBody).find("#Oscillator-List");
	this.signalsAttributes.forEach( function(signal, idx){
		var signalControls = this.generateSignalBody(signal, signalList, idx);
		this.controls.signals[idx] = signalControls;
	}, this);
};



Oscillator.prototype.generateSignalBody = function(signal, signalList, idx){
	var self = this;
	var signalDiv = $("<div/>",{id:"signal_"+idx, class:"listed"}).appendTo(signalList);
	signal.signalDiv = signalDiv;

	var fieldLabel = $("<div/>",{class:"fieldLabel",text:"Signal "+(idx+1)}).appendTo(signalDiv);
	var signalRemover = $("<div/>",{class:"toggler dextra",text:"\u00d7"}).
			appendTo(fieldLabel).
			mouseover(function(ev){
				$(this).addClass("hover");
			}).
			mouseout(function(ev){
				$(this).removeClass("hover");
			}).
			click(function(ev){
				self.removeSignal(signal);
			});

	// Volume
	var volumeSlider = DrawerUtils.createSlider("volume", Circuit.ENVELOPE_ATTRIBUTES.volume, signal.volume, 
		function(key, value){
			signal.volume = value;
			self.resetSignals();
			studio.invalidateSavedStatus();
		}.bind(this), signalDiv);

	// Signal Type
	var signalTypeDiv = $("<spiv></spiv>").appendTo(signalDiv);
	var signalTypeSelector = DrawerUtils.createSelector(Oscillator.SIGNAL_TYPES, signal.signalType, function(value){ 
		signal.signalType = value;
		this.resetSignals();
		studio.invalidateSavedStatus();
	}.bind(this), signalTypeDiv);
	$("<div class='thicket'>SIGNAL TYPE</div>").appendTo(signalTypeDiv);

	// Semitones
	var semitoneDiv = $("<spiv></spiv>").appendTo(signalDiv);
	var semitoneInput = $("<input/>",{type:"number",value:signal.offset.semitones, class:"short"}).
			appendTo(semitoneDiv).
			change(function(ev){
				signal.offset.semitones = parseInt(this.value);
				self.resetSignals();
			});
	$("<div class='thicket'>SEMITONES</div>").appendTo(semitoneDiv);

	// Cents
	var centsDiv = $("<spiv></spiv>").appendTo(signalDiv);
	var centsInput = $("<input/>",{type:"number",value:signal.offset.cents, class:"short"}).
			appendTo(centsDiv).
			change(function(ev){
				signal.offset.cents = parseInt(this.value);
				self.resetSignals();
			});
	$("<div class='thicket'>CENTS</div>").appendTo(centsDiv);
	
	// LFO
	var lfoLabel = $("<div/>",{class:"fieldLabel sub", text: "LFO "+(idx+1)}).appendTo(signalDiv);
	var lfoBypass = $("<div/>",{class:"toggler dextra",text:(signal.lfo.bypass ? "off" : "on")}).appendTo(lfoLabel);
	signal.lfo.bypassToggler = lfoBypass;
	lfoBypass.
			mouseover(function(ev){
				$(this).addClass("hover");
			}).
			mouseout(function(ev){
				$(this).removeClass("hover");
			}).
			click(function(ev){
				signal.lfo.toggleBypass();
			});
	
	signal.lfo.render(signalDiv);
	
	// Return manifest of all controls created
	signal.controls = {
		signalRemover: signalRemover,
		volumeSlider: volumeSlider,
		signalTypeSelector: signalTypeSelector,
		semitoneInput: semitoneInput,
		centsInput: centsInput,
		lfoBypass: lfoBypass,
		lfo: signal.lfo.controls
	};
	return signal.controls;
};





/*
 * --- Note Creation ---
 * 
 * These functions are here if you want to override them. In many cases, 
 * you'll want to do something extra to the note object. If your circuit
 * won't need these, then feel free to delete them.
 */
Oscillator.prototype.addNoteNoUndo = function(note){
	Circuit.prototype.addNoteNoUndo.call(this, note);
	note.signals = this.allocateSignals();
	note.signals.forEach(function(signal){
		signal.gainer.connect(note.envelope);
	});
};
Oscillator.prototype.deleteNote = function(note){	
	note.signals.forEach(function(signal){
		this.deallocateSignal(signal);
	}, this);
	Circuit.prototype.deleteNote.call(this, note);
};

Oscillator.prototype.allocateSignals = function(){
	var signals = [];
	this.signalsAttributes.forEach(function(signalAttributes){
		var oscNode = this.ctx.createOscillator();
		oscNode.type = signalAttributes.signalType;
		oscNode.frequency.value = Pitch.addCents(this.pitch.frequency, (signalAttributes.offset.semitones*100)+signalAttributes.offset.cents); // detune is reserved for LFO
		oscNode.gainer = this.ctx.createGain();
		oscNode.gainer.gain.value = signalAttributes.volume;
		oscNode.lfoIn = this.ctx.createGain();
		
		signalAttributes.lfo.connect(oscNode);
		oscNode.connect(oscNode.lfoIn);
		oscNode.lfoIn.connect(oscNode.gainer);
		
		signals.push(oscNode);
	}, this);
	return signals;
};

Oscillator.prototype.deallocateSignal = function(osc){
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
	note.signals.forEach(function(signal){
		signal.start(startWhen + delayTime);
	});
	return delayTime;
};

Oscillator.prototype.scheduleCircuitStop = function(endWhen, note){
	var delayTime = Circuit.prototype.scheduleCircuitStop.call(this, endWhen, note);
	note.signals.forEach(function(signal){
		signal.stop(endWhen + delayTime);
	});
	return delayTime;
};

Oscillator.prototype.pause = function(){
	Circuit.prototype.pause.call(this);
	this.resetSignals();
};



Oscillator.prototype.resetSignals = function(){
	this.notes.forEach(function(note){ 
		note.signals.forEach(function(osc){
			this.deallocateSignal(osc);
		}, this);
		note.signals = this.allocateSignals();
		note.signals.forEach(function(signal){
			signal.gainer.connect(note.envelope);
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
	this.signalNodes.forEach(function(osc){
		this.deallocateSignal(osc);
	}, this);
	this.signalNodes = this.allocateSignals();
	this.signalNodes.forEach(function(oscNode){
		oscNode.gainer.connect(this.envelope);
	}, this);
	this.scheduleCircuitStart(this.ctx.currentTime, {signals: this.signalNodes, envelope: this.envelope});
};


Oscillator.prototype.off = function(location) {
	Circuit.prototype.off.call(this, location);
	if( this.signalNodes && this.envelope ){
		this.scheduleCircuitStop(this.ctx.currentTime, {signals: this.signalNodes, envelope: this.envelope});
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
	if( this.signalsAttributes ){
		ret.signalsAttributes = [];
		this.signalsAttributes.forEach(function(osc){
			ret.signalsAttributes.push({
				signalType: osc.signalType,
				offset: osc.offset,
				volume: osc.volume,
				lfo: osc.lfo.marshal()
			});
		});
	}
	return ret;
};
