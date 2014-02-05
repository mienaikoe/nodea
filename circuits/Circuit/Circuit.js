/*
 * Circuit
 * 
 * 
 * This class defines a Basic Circuit, which is a manager of sound creation used by Nodea Studio.
 * A Noda also manages the configuration of notes as well as their scheduling and playing that 
 * will sound on playback. Every Circuit Should Inherit from this unless it has a very good 
 * reason not to. 
 * 
 * 
 */


function Circuit(ctx, persistedNoda, circuitReplacementCallback) {
	this.ctx = ctx;	
	this.persistedNoda = persistedNoda;
	this.circuitReplacementCallback = circuitReplacementCallback;
	
	this.id = persistedNoda.id;
	this.asciiCode = persistedNoda.ordinal;
	this.key = String.fromCharCode(this.asciiCode);
	
	this.noda = jQuery('<spiv/>',{class: 'node ' + this.constructor.name, id: 'key_'+this.asciiCode, html: this.key});
	this.swytche = jQuery('<spiv/>',{class: 'trackSwitch ' + this.constructor.name, html: this.key});
	this.trackline = $('<spiv/>',{id: 'track_'+this.asciiCode, class:'nodeTrack'});
	
	this.notes = persistedNoda.notes.map( function(persistedNote){ 
		var studioNote = new Note(persistedNote);
		studioNote.noda = this;
		studioNote.createContainer().prependTo(this.trackline);
		return studioNote;
	}, this);
};





// Drawers and Circuit Bindings

Circuit.prototype.generateDrawer = function(){	
	var detailsElement = $("#circuit_controls");
	detailsElement.empty();
		
	var circuitSection = this.createDrawerSection(detailsElement, this.constructor.name);
	
	this.generateGeneralDivision(this.createDrawerDivision(circuitSection, "General"));
	// Overriden
	if( this.constructor !== Circuit ){
		this.generateSettingsDivision(this.createDrawerDivision(circuitSection, "Settings"));
		
		var effectsSection = this.createDrawerSection(detailsElement, "Effects");
		// TODO: Fill out Effects Section based on persisted node
	}
};

Circuit.prototype.generateGeneralDivision = function(divisionBody){		
	// TODO: Add Key Code
	// TODO: Other useful data
	
	var selector = $("<select/>").appendTo(divisionBody);
	Circuit.circuitsManifest.forEach(function(circuitName){
		$("<option/>",{
			html: circuitName, 
			value: circuitName,
			selected: (this.constructor.name === circuitName)
		}).appendTo(selector);
	}, this);
	
	var commiter = $("<button>Change</button>").appendTo(divisionBody);
	var self = this;
	$(commiter).click(function(){
		if( $(selector).val()){
			self.circuitReplacementCallback(self, $(selector).val());
		}
	});
};


Circuit.prototype.generateSettingsDivision = function(divisionBody) {	
};




Circuit.prototype.createDrawerSection = function(container, title){
	var drawerSection = $("<div/>", {class: "drawer_section toggle"}).appendTo(container);
	$("<div/>", {class: "ds_heading toggler", text: '>> '+title}).appendTo(drawerSection);
	return $("<div/>", {class: "ds_body togglee"}).appendTo(drawerSection);
};

Circuit.prototype.createDrawerDivision = function(section, title){
	var drawerDivision = $("<div/>", {class: "drawer_division toggle"}).appendTo(section);
	$("<div/>", {class: "dd_heading toggler", text: '>> '+title}).appendTo(drawerDivision);
	return $("<div/>", {class: "dd_body togglee"}).appendTo(drawerDivision);
};



Circuit.prototype.addNote = function(note){
    if( note !== null ){
        this.notes.push(note);
    }
};

Circuit.prototype.deleteNote = function(note){
	var idx = this.notes.indexOf(note);
	if( idx !== -1 ){
		this.notes.splice(idx, 1);
	}
};



// playback

Circuit.prototype.play = function(sliversPerSecond, startingAt){
};

Circuit.prototype.pause = function(){
	this.turnOffPassiveRecording();
    this.lightOff('active');
};



// recording

Circuit.prototype.on = function() {
	navigator.vibrate(10);
};

Circuit.prototype.off = function() {
	navigator.vibrate(10);
};



Circuit.prototype.turnOnPassiveRecording = function(){
	this.passiveRecording = true;
};

Circuit.prototype.turnOffPassiveRecording = function(){
	this.passiveRecording = false;
	this.lightOff('recording');
};






// lighting

Circuit.prototype.lightOn = function(lightType){
    $(this.noda).addClass(lightType);
    $(this.swytche).addClass(lightType);
	return this;
};
Circuit.prototype.lightOff = function(lightType){
    $(this.noda).removeClass(lightType);
    $(this.swytche).removeClass(lightType);
	return this;
};

Circuit.prototype.lightsOut = function(){
    $(this.noda).removeClass('active').removeClass('recording').removeClass('selected');
    $(this.swytche).removeClass('active').removeClass('recording').removeClass('selected');
	return this;
};







// saving

Circuit.prototype.marshal = function(){
	return {
		handle: this.constructor.name,
		ordinal: this.asciiCode,
		notes: this.notes.map( function(note){return {start: note.start, finish: note.finish};} ),
		settings: this.marshalSettings()
	};
};

Circuit.prototype.marshalSettings = function(){
	return {};
};


Circuit.circuitsManifest = [
	"",
	"Sampler"
];