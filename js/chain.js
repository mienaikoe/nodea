var audioNodeConnector = AudioNode.prototype.connect;
AudioNode.prototype.connect = function(destination){
	audioNodeConnector(destination);
	this.destinations.push(destination);
};

var audioNodeDisconnector = AudioNode.prototype.disconnect;
AudioNode.prototype.connect = function(){
	audioNodeDisconnector();
	var idx = this.destinations.indexOf(destination);
	if( idx != -1 ){ 
		this.destinations.splice(idx,1); 
	}
};
