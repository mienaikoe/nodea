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
    <div class='mainFields envelope_slider'>\
	    <label>Pitch</label>\
        <spiv class='encroach'>\
            <select class='medium' id='Oscillator-Color'></select>\
            <div class='thicket'>KEY</div>\
        </spiv>\
        <spiv class='encroach'>\
            <input type='number' class='medium' id='Oscillator-Octave'></input>\
            <div class='thicket'>OCTAVE</div>\
        </spiv>\
    </div>\
	<button id='Oscillator-Add'>add signal</button>\
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
			this.signalsAttributes.push(this.defaultSignal(this.ctx));
		}
	}
	
	if(!this.pitch){
		this.pitch = Oscillator.DEFAULT_PITCH;
	}
};

Oscillator.DEFAULT_PITCH = new Pitch("A",4);

Oscillator.prototype.defaultSignal = function(ctx){
	return {
		signalType: "sine",
		offset: {semitones: 0, cents: 0},
		volume: 1,
		lfo: Oscillator.LFO.default(ctx),
		filter: Oscillator.EnvFilter.default(ctx, this)
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
			signal.lfo = new Oscillator.LFO(this.ctx,settings.lfo);
		}
		if(settings.filter){
			signal.filter = new Oscillator.EnvFilter(this.ctx, this, settings.filter);
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
		signal.lfo = Oscillator.LFO.default(this.ctx);
	}
	if(!signal.filter){
		signal.filter = Oscillator.EnvFilter.default(this.ctx, this);
	}
	
	return signal;
};




Oscillator.prototype.addSignal = function(){
	this.signalsAttributes.push(this.defaultSignal(this.ctx));
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


Oscillator.prototype.generateCircuitDivision = function(sectionBody){
	Circuit.prototype.generateCircuitDivision.call(this, sectionBody);
	
	this.signalsAttributes.forEach( function(signal, idx){
		signal.signalDiv = DrawerUtils.createDivision(sectionBody, "Signal "+(idx+1));
		var signalControls = this.generateSignalBody(signal, signal.signalDiv.body, idx);
		var self = this;
		signalControls.signalRemover = DrawerUtils.makeDivisionRemovable(signal.signalDiv, function(ev){
			self.removeSignal(signal);
		});
		this.controls.signals[idx] = signalControls;
	}, this);
};


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
};



Oscillator.prototype.generateSignalBody = function(signal, signalList, idx){
	var self = this;
	var signalBody = $("<div/>",{id:"signal_"+idx, class:"listed"}).appendTo(signalList);

	// Volume
	var volumeSlider = DrawerUtils.createSlider("volume", Circuit.ENVELOPE_ATTRIBUTES.volume, signal.volume, 
		function(key, value){
			signal.volume = value;
			self.resetSignals();
			studio.invalidateSavedStatus();
		}.bind(this), signalBody);

	// Signal Type
	var signalTypeDiv = $("<div/>",{class: "envelope_slider"}).appendTo(signalBody);
	$("<label/>",{text:"signal type"}).appendTo(signalTypeDiv);
	var signalTypeSpiv = $("<spiv/>").appendTo(signalTypeDiv);
	var signalTypeSelector = DrawerUtils.createSelector(Oscillator.SIGNAL_TYPES, signal.signalType, function(value){ 
		signal.signalType = value;
		this.resetSignals();
		studio.invalidateSavedStatus();
	}.bind(this), signalTypeSpiv).addClass("medium");

	// Semitones
	var semitoneDiv = $("<div/>",{class: "envelope_slider"}).appendTo(signalBody);
	$("<label/>",{text:"pitch offset"}).appendTo(semitoneDiv);
	var semitoneSpiv = $("<spiv/>",{class:"encroach"}).appendTo(semitoneDiv);
	var semitoneInput = $("<input/>",{type:"number",value:signal.offset.semitones, class:"medium"}).
			appendTo(semitoneSpiv).
			on("change", function(ev){
				signal.offset.semitones = parseInt(this.value);
				self.resetSignals();
			});
	$("<spiv/>",{class:"thicket",text:"SEMITONES"}).appendTo(semitoneSpiv);

	// Cents
	var centsSpiv = $("<spiv/>",{class: "encroach"}).appendTo(semitoneDiv);
	var centsInput = $("<input/>",{type:"number",value:signal.offset.cents, class:"medium"}).
			appendTo(centsSpiv).
			on("change", function(ev){
				signal.offset.cents = parseInt(this.value);
				self.resetSignals();
			});
	$("<spiv/>",{class:"thicket",text:"CENTS"}).appendTo(centsSpiv);
	
	// Oscillator.LFO
	var lfoLabel = $("<div/>",{class:"fieldLabel sub", text: "LFO"}).appendTo(signalBody);
	var lfoBypass = $("<div/>",{class:"toggler dextra",text:(signal.lfo.bypass ? "off" : "on")}).appendTo(lfoLabel);
	signal.lfo.bypassToggler = lfoBypass;
	lfoBypass.
			mouseover(function(ev){
				$(this).addClass("hover");
			}).
			mouseout(function(ev){
				$(this).removeClass("hover");
			}).
			on("click", function(ev){
				signal.lfo.toggleBypass();
			});
	
	signal.lfo.render(signalBody);
	
	// Oscillator.EnvFilter
	var filterLabel = $("<div/>",{class:"fieldLabel sub", text: "Filter"}).appendTo(signalBody);
	var filterBypass = $("<div/>",{class:"toggler dextra",text:(signal.filter.bypass ? "off" : "on")}).appendTo(filterLabel);
	signal.filter.bypassToggler = filterBypass;
	filterBypass.
			mouseover(function(ev){
				$(this).addClass("hover");
			}).
			mouseout(function(ev){
				$(this).removeClass("hover");
			}).
			on("click", function(ev){
				signal.filter.toggleBypass();
			});
	
	signal.filter.render(signalBody);
	
	// Return manifest of all controls created
	signal.controls = {
		volumeSlider: volumeSlider,
		signalTypeSelector: signalTypeSelector,
		semitoneInput: semitoneInput,
		centsInput: centsInput,
		lfoBypass: lfoBypass,
		lfo: signal.lfo.controls,
		filterBypass: filterBypass,
		filter: signal.filter.controls
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
		oscNode.frequency.value = Pitch.addCents(this.pitch.frequency, (signalAttributes.offset.semitones*100)+signalAttributes.offset.cents); // detune is reserved for Oscillator.LFO
		
		oscNode.gainer = this.ctx.createGain();
		oscNode.gainer.gain.value = signalAttributes.volume;
		
		oscNode.lfoIn = this.ctx.createGain();
		signalAttributes.lfo.connect(oscNode);
		
		oscNode.filter = signalAttributes.filter;
		
		oscNode.connect(oscNode.lfoIn);
		oscNode.lfoIn.connect(signalAttributes.filter.input);
		signalAttributes.filter.output.connect(oscNode.gainer);
		
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
	startWhen += delayTime;
	note.signals.forEach(function(signal){
		signal.filter.start(startWhen);
		signal.start(startWhen);
	});
	return delayTime;
};

Oscillator.prototype.scheduleCircuitStop = function(endWhen, note){
	var delayTime = Circuit.prototype.scheduleCircuitStop.call(this, endWhen, note);
	endWhen += delayTime;
	note.signals.forEach(function(signal){
		signal.filter.stop(endWhen);
		signal.stop(endWhen);
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
	this.envelope = this.allocateEnvelope();
	this.signalNodes.forEach(function(osc){
		this.deallocateSignal(osc);
	}, this);
	this.signalNodes = this.allocateSignals();
	this.signalNodes.forEach(function(oscNode){
		oscNode.gainer.connect(this.envelope);
	}, this);
	this.scheduleCircuitStart(this.ctx.currentTime, {signals: this.signalNodes, envelope: this.envelope});
	Circuit.prototype.on.call(this, location);
};


Oscillator.prototype.off = function(location) {
	if( this.signalNodes && this.envelope ){
		this.scheduleCircuitStop(this.ctx.currentTime, {signals: this.signalNodes, envelope: this.envelope});
	}
	Circuit.prototype.off.call(this, location);
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
				lfo: osc.lfo.marshal(),
				filter: osc.filter.marshal()
			});
		});
	}
	return ret;
};
