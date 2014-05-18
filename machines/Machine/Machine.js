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
		click(function(ev){
			self.studio.selectMachine(self.ascii);
		});
		
	this.circuitsContainer = $("<div/>",{class:"circuits"}).hide();
	
	this.chain = new EffectsChain(this.ctx, this.ctx.destination, "machines");
	this.destination = this.chain.input;
	
	this.extractSettings(marshaledMachine.settings);
	this.extractCircuits(marshaledMachine.circuits);
	
	// Touchpad maybe later
	//jQuery('<div/>',{class: 'touchpad'}).appendTo(this.keyContainer);
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
	this.studio.keyset.domOrder.forEach(function(keySetRow){
		var keyRow = jQuery('<div/>',{class: 'circuitRow '+nodeRowClass}).appendTo(this.circuitsContainer);
		keySetRow.forEach(function(keySetKey){
			// Bad Hack: Fills out Containers so incoming containers can have proper placement.
			$("<spiv/>").appendTo(keyRow);
			
			var marshaledCircuit = marshaledCircuits[keySetKey];
			if( !marshaledCircuit ){
				marshaledCircuit = this.defaultCircuit(keySetKey);
			}
			
			this.initializeCircuit(marshaledCircuit);
		}, this);
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
	DelayedLoad.load("circuits", marshaledCircuit.handle, function(){
		var newCircuit = self.eagerInitializeCircuit(marshaledCircuit);
		callback.call(self, newCircuit);
	});
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
	
	var keyRowPosition = 0;
	var keyPosition = 0;
	var keyset = this.studio.keyset.domOrder;
	for( idx in keyset ){
		keyRowPosition = idx;
		var keysetRow = keyset[idx];
		keyPosition = keysetRow.indexOf(marshalledCircuit.ordinal);
		if( keyPosition !== -1 ){
			break;
		}
	}	
	this.circuitsContainer.children().eq(keyRowPosition).children().eq(keyPosition).replaceWith(circuit.container);
		
	var self = this;
	circuit.container.
			mousedown(function(ev){ 
				self.circuitOn(circuit.asciiCode);
				self.mousedCircuits[circuit.asciiCode] = circuit;
				ev.stopPropagation(); }).
			mouseup(function(ev){ 
				self.circuitOff(circuit.asciiCode); 
				delete self.mousedCircuits[circuit.asciiCode];
			}).
			click(function(ev){ ev.stopPropagation(); });
		
	return circuit;
};


Machine.prototype.replaceCircuit = function( oldCircuit, newHandle ){
	var marshaledCircuit = oldCircuit.marshal();
	marshaledCircuit.handle = newHandle;
	
	var self = this;
	this.initializeCircuit( marshaledCircuit, function(newCircuit){
		self.circuits[oldCircuit.ordinal] = newCircuit;
		newCircuit.swytche.click();
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
		circuit.on(this.pixelFor(Date.now()));
		this.recordingNodas.push(circuit);
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
		circuit.off(this.location);
		this.invalidateSavedStatus();
		this.recordingNodas.splice(this.recordingNodas.indexOf(circuit), 1);
	} else {
		circuit.off();
	}
	
	circuit.keydown = false;
};





// Drawers and Circuit Bindings

Machine.prototype.generateDrawer = function(){	
	var detailsElement = $("#machine_controls");
	detailsElement.empty();
	
	var machineSection = DrawerUtils.createSection(detailsElement, this.handle);
	this.generateGeneralDivision(DrawerUtils.createDivision(machineSection, "General"));
	if( this.constructor !== Machine ){
		this.generateMachineDivision(DrawerUtils.createDivision(machineSection, this.handle));
	}
	
	this.chain.render( DrawerUtils.createSection(detailsElement, "Effects"), "machines" );
	
	DrawerUtils.activateDrawerToggles($("#machine_drawer"));
};

Machine.prototype.generateGeneralDivision = function(divisionBody){		
	// TODO: Add Key Code
	// TODO: Other useful data
	
	var selector = $("<select/>").appendTo(divisionBody);
	Machine.machinesManifest.forEach(function(machineName){
		$("<option/>",{
			html: machineName, 
			value: machineName,
			selected: (this.handle === machineName)
		}).appendTo(selector);
	}, this);
	
	var commiter = $("<button>Change</button>").appendTo(divisionBody);
	var self = this;
	$(commiter).click(function(){
		if( $(selector).val()){
			self.machineReplacementCallback(self, $(selector).val());
		}
	});
};


Machine.prototype.generateMachineDivision = function(divisionBody) {
	var self = this;
	$.get("machines/"+this.handle+"/"+this.handle+".html",null,function(data){
		self.machineBody = $(data).appendTo(divisionBody);
		self.machineBody.
			keydown(    function(ev){ ev.stopPropagation(); }).
			keyup(      function(ev){ ev.stopPropagation(); });
	
		self.generateMachineBody.call(self, self.machineBody);
	});
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
};


Machine.prototype.swytcheSelected = function(ordinal){
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
	ret = {};
	for( key in this.circuits ){
		var circuit = this.circuits[key];
		if(circuit.handle !== "Circuit"){
			ret[key] = this.circuits[key].marshal();
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
	"",
	"Uncharted"
];