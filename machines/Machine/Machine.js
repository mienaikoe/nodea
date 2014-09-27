function Machine( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	this.ctx = ctx;
	this.ascii = tabDefinition.ascii;
	this.color = tabDefinition.color;
	this.handle = marshaledMachine.handle;
	this.machineReplacementCallback = machineReplacementCallback;
	
	this.studio = studio;
	
	if( !marshaledMachine.circuits ){
		marshaledMachine.circuits = {};
	}
	
	this.circuits = {};
	this.mousedCircuits = {};
	
	var self = this;
	this.tab = $("<spiv/>",{class:"machine", html:String.fromCharCode(this.ascii)}).
		on("click", function(ev){
			self.studio.selectMachine(self.ascii);
		});
		
	this.circuitsContainer = $("<div/>",{class:"circuits"}).hide();
	
	this.chain = new EffectsChain(this.ctx, this.ctx.destination, "machines");
	this.destination = this.chain.input;
	
	this.extractSettings(marshaledMachine.settings);
	this.extractCircuits(marshaledMachine.circuits);
	
	// Touchpad maybe later
	//$('<div/>',{class: 'touchpad'}).appendTo(this.keyContainer);
};




Machine.prototype.extractChain = function(settings){
	if( settings.chain ){
		this.chain.load(settings.chain);
	}
};


Machine.prototype.extractSettings = function(settings){
	if( settings ){
		this.extractChain(settings);
	}
};


Machine.prototype.extractCircuits = function(marshaledCircuits){
	var nodeRowClass = "sinistra";
	var keyRow;
	this.studio.keyset.domOrder.forEach(function(keySetKey, idx){
		var rowKeyIndex = idx%15;
		if( rowKeyIndex === 0 ){
			keyRow = $('<div/>',{class: 'circuitRow '+nodeRowClass}).appendTo(this.circuitsContainer);
		}
		
		var marshaledCircuit = marshaledCircuits[keySetKey];
		if( !marshaledCircuit ){
			marshaledCircuit = this.defaultCircuit(keySetKey);
		}
		marshaledCircuit.tempContainer = $('<div/>',{class: 'circuit'}).appendTo(keyRow);
		if(marshaledCircuit.handle === 'Function'){
			marshaledCircuit.handle = "Circuit";
		}

		this.initializeCircuit(marshaledCircuit, function(newCircuit, marshaledCircuit){
			marshaledCircuit.tempContainer.replaceWith(newCircuit.container);
			delete marshaledCircuit.tempContainer;
			if(this.selectedCircuit === newCircuit.asciiCode){
				this.swytcheSelected(newCircuit.asciiCode);
			}
		}.bind(this));
		nodeRowClass = nodeRowClass === 'sinistra' ? 'dextra' : 'sinistra';
	}, this);
};

Machine.prototype.defaultCircuit = function(ordinal){
	return { id: null, ordinal: ordinal, handle: "Circuit", notes: [] };
};


Machine.prototype.initializeCircuit = function(marshaledCircuit, callback){
	if(!callback){
		callback = function(newCircuit){};
	}
	
	var self = this;

	var newCircuit = self.eagerInitializeCircuit(marshaledCircuit);
	callback.call(self, newCircuit, marshaledCircuit);
	
};


Machine.prototype.eagerInitializeCircuit = function(marshalledCircuit){
	var handle = marshalledCircuit.handle;
	
	var circuitConstructor = window[handle];
	if(!circuitConstructor){
		console.error("Could not find Constructor for "+handle);
		return;
	}
	
	this.studio.circuitStylesheet.innerHTML += ".node."+handle+
		"{ background-image: url('circuits/"+handle+"/"+handle+".png'); background-size: cover; }";
	
	
	var self = this;
	var circuit = new circuitConstructor(this.ctx, this, marshalledCircuit, this.destination, function(oldCircuit, newHandle){
		 self.replaceCircuit(oldCircuit, newHandle);
	});
	
	this.circuits[marshalledCircuit.ordinal] = circuit;
		
	var self = this;
	circuit.container.
			on("mousedown",function(ev){ 
				self.circuitOn(circuit.asciiCode);
				self.mousedCircuits[circuit.asciiCode] = circuit;
				ev.stopPropagation(); }).
			on("mouseup",function(ev){ 
				self.circuitOff(circuit.asciiCode); 
				delete self.mousedCircuits[circuit.asciiCode];
			}).
			on("click", function(ev){ ev.stopPropagation(); });
		
	return circuit;
};


Machine.prototype.replaceCircuit = function( oldCircuit, newHandle ){
	var marshaledCircuit = oldCircuit.marshal();
	marshaledCircuit.handle = newHandle;
	
	var self = this;
	this.initializeCircuit( marshaledCircuit, function(newCircuit, marshaledCircuit){
		newCircuit.swytche.trigger("click");
		oldCircuit.container.replaceWith(newCircuit.container);
		self.studio.invalidateSavedStatus();
	});
};


Machine.prototype.mouseup = function(){
	for( asciiCode in this.mousedCircuits ){
		this.noteOff(this.mousedCircuits[asciiCode]);
	}
	this.mousedCircuits = {};
};





// Playback

Machine.prototype.circuitOn = function( ordinal ){
	var circuit = this.circuits[ordinal];
	if( circuit.keydown || circuit.mousedown ){
		return;
	}
	
	if( this.studio.recording ){
		circuit.on(this.studio.pixelFor(Date.now()));
		this.studio.recordingNodas.push(circuit);
	} else {
		circuit.on();
	}
	
	circuit.keydown = true;	
};


Machine.prototype.circuitOff = function( ordinal ){
	var circuit = this.circuits[ordinal];
	if(!circuit){
		return;
	}
	
	if( this.studio.recording ){
		circuit.off(this.studio.location);
		this.invalidateSavedStatus();
		var recordingNodas = this.studio.recordingNodas;
		recordingNodas.splice(recordingNodas.indexOf(circuit), 1);
	} else {
		circuit.off();
	}
	
	circuit.keydown = false;
};





// Drawers and Circuit Bindings

Machine.prototype.generateDrawer = function(){	
	var detailsElement = $("#machine_controls");
	detailsElement.empty();
	
	var machineSection = DrawerUtils.createSection(detailsElement, "Machine");
	DrawerUtils.createSelector(Machine.machinesManifest, this.handle, this.replaceSelf.bind(this), machineSection.head).addClass("heading_select").addClass("dextra");
	if( this.constructor !== Machine ){
		this.generateMachineDivision(DrawerUtils.createDivision(machineSection.body, this.handle));
	}
	
	this.chain.render( DrawerUtils.createSection(detailsElement, "Effects").body, "machines" );
	
	DrawerUtils.activateDrawerToggles($("#machine_drawer"));
	
	return machineSection;
};

Machine.prototype.replaceSelf = function(newHandle){
	this.machineReplacementCallback(this, newHandle);
};


Machine.prototype.generateMachineDivision = function(divisionBody) {
	this.machineBody = $(this.constructor.templateHTML).appendTo(divisionBody);
	this.machineBody.
		on("keydown",    function(ev){ ev.stopPropagation(); }).
		on("keyup",      function(ev){ ev.stopPropagation(); });
	this.generateMachineBody.call(this, this.machineBody);
};

Machine.prototype.generateMachineBody = function(machineBody){	
};

Machine.prototype.isDisplaying = function(){
	return this.machineBody && this.machineBody.closest("html").length > 0;
};









Machine.prototype.select = function(){
	this.generateDrawer();
	
	$(".machine").removeAttr("style");
	$("#circuits .circuits").hide();
	
	this.tab.attr("style", "background: linear-gradient("+this.color+", #444);");
	this.circuitsContainer.show();
	
	if(!this.selectedCircuit){
		this.selectedCircuit = NodeaStudio.defaultCircuitCode;
	}
	this.swytcheSelected(this.selectedCircuit);
};


Machine.prototype.swytcheSelected = function(ordinal){
	this.selectedCircuit = ordinal;
	ordinal = ordinal.toString();
	for( ascii in this.circuits){
		var circuit = this.circuits[ascii];
		if( ascii === ordinal ){
			circuit.lightOn('selected');
			circuit.generateDrawer();
		} else {
			circuit.lightOff('selected');
		}
	}
};





Machine.prototype.invalidateSavedStatus = function(){
	this.studio.invalidateSavedStatus();
};

Machine.prototype.marshal = function(){
	var ret= {
		ascii: this.ascii,
		handle: this.constructor.name,
		circuits: this.marshalCircuits(),
		settings: this.marshalSettings()
	};
	
	return ret;
};

Machine.prototype.marshalCircuits = function(){
	var ret = {};
	for( var key in this.circuits ){
		var circuit = this.circuits[key];
		if(circuit.handle !== "Circuit"){
			ret[key] = circuit.marshal();
		}
	}
	return ret;
};

Machine.prototype.marshalSettings = function(){
	return {
		chain: this.chain.marshal()
	};
};





// === Constants ===

Machine.ASCII_KEYS = [
	'1','2','3','4','5','6','7','8','9','0',
	'q','w','e','r','t','y','u','i','o','p',
	'a','s','d','f','g','h','j','k','l',';',
	'z','x','c','v','b','n','m',',','.','/'
];


Machine.keyCodeToAsciiMap = {
	 // uppercase latin
	65:  97,	66:  98,	67:  99,	68:  100,	69:  101,	
	70:  102,	71:  103,	72:  104,	73:  105,	74:  106,	
	75:  107,	76:  108,	77:  109,	78:  110,	79:  111,	
	80:  112,	81:  113,	82:  114,	83:  115,	84:  116,	
	85:  117,	86:  118,	87:  119,	88:  120,	89:  121,	
	90:  122,	
	
	// punctuation
	186: 59,	188: 44,	190: 46,	191: 47
};


Machine.machinesManifest = [
	"Machine",
	"Synthesizer",
	"MultiSampler"
];