function Oscillator(ctx, persistedNoda, circuitReplacementCallback) {
	/* The Super Constructor will Instantiate things 
	 * that every circuit needs, including each 
	 * visual component and the event ties for each one.
	 **/
	Circuit.call(this, ctx, persistedNoda, circuitReplacementCallback);

	/* The order and timing of setting and note extraction is up to you.
	 */
	this.extractSettings(persistedNoda.settings);
	this.extractNotes(persistedNoda.notes);
	
	/* Build out any further initialization you need 
	 * to do here. 
	 */
};


// This Inherits the prototype of Circuit
Oscillator.prototype = Object.create(Circuit.prototype, {
	constructor: { 
		value: Oscillator, // Change This to your Circuit Handle
		enumerable: false 
	}
});


Oscillator.prototype.extractSettings = function(settings){
	Circuit.prototype.extractSettings.call(this, settings);
	
	if( settings){
		/* Any necessary settings that you add in the marshalSettings function 
		 * will be in settings
		 */		
		if(settings.frequency){
			this.frequency = settings.frequency;
		}
		if(settings.type){
			this.signalType = settings.signalType;
		}
	}
	
	if(!this.frequency){
		this.frequency = 440; // Concert A ?
	}
	if(!this.signalType){
		this.signalType = "sine";
	}
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
	$(circuitBody).find("#Oscillator-Frequency").
		val(this.frequency).
		change(	function(ev){ 
			self.frequency = parseInt(this.value);
			studio.invalidateSavedStatus(); 
		});
		
	var signalSelector = $(circuitBody).find("#Oscillator-SignalType");
	signalSelector.find("option[value='"+self.signalType+"']").attr("selected","selected");
	signalSelector.change( function(ev){ 
		self.signalType = this.value;
		self.resetOscillators();
		studio.invalidateSavedStatus(); 
	});	
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
	note.oscillator = this.allocateOscillator();
};
Oscillator.prototype.deleteNote = function(note){
	this.deallocateOscillator(note.oscillator);
	Circuit.prototype.deleteNote.call(this, note);
};

Oscillator.prototype.allocateOscillator = function(){
	var oscillator = this.ctx.createOscillator();
	oscillator.type = this.signalType;
	oscillator.frequency.value = this.frequency;
	oscillator.connect(this.destination);
	return oscillator;
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
	note.oscillator.start(startWhen+this.chain.start(startWhen));
};

Oscillator.prototype.scheduleCircuitStop = function(endWhen, note){
	note.oscillator.stop(endWhen+this.chain.stop(endWhen));
};

Oscillator.prototype.pause = function(){
	Circuit.prototype.pause.call(this);
	this.resetOscillators();
};



Oscillator.prototype.resetOscillators = function(){
	this.notes.forEach(function(note){ 
		this.deallocateOscillator(note.oscillator); 
		note.oscillator = this.allocateOscillator(); 
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

Oscillator.prototype.on = function() {
	Circuit.prototype.on.call(this);
	this.oscillator = this.allocateOscillator();
	this.scheduleCircuitStart(this.chain.start(this.ctx.currentTime), {oscillator: this.oscillator});
};


Oscillator.prototype.off = function() {
	Circuit.prototype.off.call(this);
	if( this.oscillator ){
		var targetOsc = this.oscillator;
		var curTime = this.ctx.currentTime;
		var delayTime = this.chain.stop(curTime);
		
		this.scheduleCircuitStop(this.chain.start(this.ctx.currentTime), {oscillator: targetOsc});
		
		var self = this;
		window.setTimeout(function(){
			self.deallocateOscillator(targetOsc);
		}, delayTime*1000);
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
	return $.extend(Circuit.prototype.marshalSettings.call(this), 
		{	frequency: this.frequency,
			signalType: this.signalType
		} );
};
