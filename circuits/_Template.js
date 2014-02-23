function Template(ctx, persistedNoda, circuitReplacementCallback) {
	/* The Super Constructor will Instantiate things 
	 * that every circuit needs, including each 
	 * visual component and the event ties for each one.
	 **/
	Circuit.call(this, ctx, persistedNoda, circuitReplacementCallback);

	/* The order and timing of setting and note extraction is up to you.
	 */
	this.extractSettings(persistedNoda.settings);
	this.extractNotes(persistedNoda.notes);
	
	/* Build out any further initialization you need to do here. 
	 */
};


// This Inherits the prototype of Circuit
Template.prototype = Object.create(Circuit.prototype, {
	constructor: { 
		value: Template, // Change This to your Circuit Handle
		enumerable: false 
	}
});



Template.prototype.extractSettings = function(settings){
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

Template.prototype.generateCircuitBody = function(circuitBody){
};


/*
 * --- Note Creation ---
 * 
 * These functions are here if you want to override them. In many cases, 
 * you'll want to do something extra to the note object. If your circuit
 * won't need these, then feel free to delete them.
 */
Template.prototype.addNote = function(note){
	Circuit.prototype.addNote.call(this, note);
};
Template.prototype.deleteNote = function(note){
	Circuit.prototype.deleteNote.call(this, note);
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
Template.prototype.play = function(pixelsPerSecond, startingAt){
    var startTime = this.ctx.startTime;
    this.notes.forEach( function(note){
        if( note.start >= startingAt ){
            // Schedule when Note Plays and Stops here.
        }
    });
};

Template.prototype.pause = function(){
	Circuit.prototype.pause.call(this);
	// Turn Off note scheduling here
};









/*
 * --- User Input ---
 * 
 * The following functions (on,off) notify your Circuit
 * when the user has pressed the key bound to your circuit.
 * Use these functions to audibly play your note. All else 
 * will be handled for you 
 */

Template.prototype.on = function() {
	Circuit.prototype.on.call(this);
	// schedule note to play
};


Template.prototype.off = function() {
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

Template.prototype.marshalSettings = function(){
	return {
	};
};