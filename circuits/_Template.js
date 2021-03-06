function CircuitTemplate(ctx, machine, marshaledCircuit, destination, circuitReplacementCallback) {
	/* The Super Constructor will Instantiate things 
	 * that every circuit needs, including each 
	 * visual component and the event ties for each one.
	 **/
	Circuit.call(this, ctx, machine, marshaledCircuit, destination, circuitReplacementCallback);
	
	/* Build out any further initialization you need to do here. 
	 */
};


// This Inherits the prototype of Circuit
CircuitTemplate.prototype = Object.create(Circuit.prototype, {
	constructor: { 
		value: CircuitTemplate, // Change This to your Circuit Handle
		enumerable: false 
	}
});



CircuitTemplate.prototype.extractSettings = function(settings){
	Circuit.prototype.extractSettings.call(this, settings);
	
	if(settings){
		/* Any necessary settings that you add in the marshalSettings function 
		 * will be in settings
		 */
	}
	
	/* Set Default values here.
	 */
};




/*
 * --- Drawer Layout ---
 * 
 * @param circuitBody is the main element of the drawer.
 * circuitBody has already been filled out with the contents of {handle}.html
 * Use this function to fill in info, turn knobs, attach events on {handle}.html
 */

CircuitTemplate.prototype.generateCircuitBody = function(circuitBody){
};


/*
 * --- Note Creation ---
 * 
 * These functions are here if you want to override them. In many cases, 
 * you'll want to do something extra to the note object. If your circuit
 * won't need these, then feel free to delete them.
 */
CircuitTemplate.prototype.addNote = function(note){
	Circuit.prototype.addNote.call(this, note);
};
CircuitTemplate.prototype.deleteNote = function(note){
	Circuit.prototype.deleteNote.call(this, note);
};



/*
 * --- Playback ---
 *		
 * These functions alert your circuit to when the User has requested
 * the song to Play or Pause. 
 * @param startWhen is a float that represents the Studio's startTime with offset.
 * @param note is the note associated with the start event. 
 *   If there is no backing note, you are required to pass an anonymous object 
 *   that has any parameters you would require of a normal note.
 */
CircuitTemplate.prototype.scheduleCircuitStart = function(startWhen, note){
};

CircuitTemplate.prototype.scheduleCircuitStop = function(endWhen, note){
};


CircuitTemplate.prototype.pause = function(){
	Circuit.prototype.pause.call(this);
	// Turn Off note scheduling here.
};









/*
 * --- User Input ---
 * 
 * The following functions (on,off) notify your Circuit
 * when the user has pressed the key bound to your circuit.
 * Use these functions to audibly play your note. All else 
 * will be handled for you 
 */

CircuitTemplate.prototype.on = function() {
	Circuit.prototype.on.call(this);
	// schedule note to play
};


CircuitTemplate.prototype.off = function() {
	Circuit.prototype.off.call(this);
	// stop note from playing
};







/* --- Marshaling ---
 * 
 * This function is for saving any settings you have on your circuit 
 * that you want passed to its constructor whenever this instance of 
 * your Circuit is created. This will appear in the constructor as 
 * persistedNoda.settings
 */

CircuitTemplate.prototype.marshalSettings = function(){
	return {
	};
};