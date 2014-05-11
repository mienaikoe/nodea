function Machine( ctx, tabDefinition, studio, marshalledMachine ){
	this.ctx = ctx;
	this.ascii = tabDefinition.ascii;
	this.color = tabDefinition.color;
	
	this.studio = studio;
	
	if( !marshalledMachine.circuits ){
		marshalledMachine.circuits = {};
	}
	
	this.circuits = {};
	
	var self = this;
	this.tab = $("<spiv/>",{class:"machine", html:String.fromCharCode(this.ascii)}).
		click(function(ev){
			self.studio.selectMachine(self.ascii);
		});
		
	this.circuitsContainer = $("<div/>",{class:"circuits"}).hide();
	
	
	// === Instantiate Circuits ===
	var nodeRowClass = "sinistra";
	this.studio.keyset.forEach(function(keySetRow){
		var keyRow = jQuery('<div/>',{class: 'circuitRow '+nodeRowClass}).appendTo(this.circuitsContainer);
		keySetRow.forEach(function(keySetKey){
			// Bad Hack: Fills out Containers so incoming containers can have proper placement.
			$("<spiv/>").appendTo(keyRow);
			
			var marshalledCircuit = marshalledMachine.circuits[keySetKey];
			if( !marshalledCircuit ){
				marshalledCircuit = { id: null, ordinal: keySetKey, handle: "Circuit", notes: [] };
			}
			
			this.initializeCircuit(marshalledCircuit);
		}, this);
		nodeRowClass = nodeRowClass === 'sinistra' ? 'dextra' : 'sinistra';
	}, this);
	
	
	// Touchpad maybe later
	//jQuery('<div/>',{class: 'touchpad'}).appendTo(this.keyContainer);
};




Machine.prototype.initializeCircuit = function(marshalledCircuit, callback){
	if(!callback){
		callback = function(newCircuit){};
	}
	
	var self = this;
	DelayedLoad.load("circuits", marshalledCircuit.handle, function(){
		var newCircuit = self.eagerInitializeCircuit(marshalledCircuit);
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
	var ordinal = marshalledCircuit.ordinal;
	var trackline = this.studio.tracks[ordinal];
	var swytche = this.studio.swytches[ordinal];
	var circuit = new circuitConstructor(this.ctx, marshalledCircuit, trackline, swytche, function(oldCircuit, newHandle){
		 self.replaceCircuit(oldCircuit, newHandle);
	});
	
	this.circuits[marshalledCircuit.ordinal] = circuit;
	
	var keyRowPosition = 0;
	var keyPosition = 0;
	for( idx in this.studio.keyset ){
		keyRowPosition = idx;
		var keysetRow = this.studio.keyset[idx];
		keyPosition = keysetRow.indexOf(marshalledCircuit.ordinal);
		if( keyPosition !== -1 ){
			break;
		}
	}	
	this.circuitsContainer.children().eq(keyRowPosition).children().eq(keyPosition).replaceWith(circuit.container);
		
	var self = this;
	circuit.container.
			mousedown(function(ev){ 
				self.studio.noteOn(circuit);
				circuit.mousedown = true; 
				ev.stopPropagation(); }).
			mouseup(function(ev){ 
				self.studio.noteOff(circuit); 
				circuit.mousedown = false;}).
			click(function(ev){ ev.stopPropagation(); });
		
	return circuit;
};




Machine.prototype.replaceCircuit = function( oldCircuit, newHandle ){
	var persistedNoda = oldCircuit.persistedNoda;
	persistedNoda.handle = newHandle;
	
	var self = this;
	this.initializeCircuit( persistedNoda, function(newCircuit){
		self.circuits[oldCircuit.ordinal] = newCircuit;
		newCircuit.swytche.click();
		self.studio.invalidateSavedStatus();
	});
};










Machine.prototype.select = function(){
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
	return {
		ascii: this.ascii,
		handle: this.constructor.name,
		circuits: this.circuits.map(function(circuit){ circuit.marshal(); }),
		settings: this.marshalSettings()
	};
};

Machine.prototype.marshalSettings = function(){
	return {};
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
