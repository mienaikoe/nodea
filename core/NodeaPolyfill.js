
var assert = function(obj){
	return (typeof(obj) !== 'undefined' && obj !== null);
};

window.requestAnimationFrame = 
		window.requestAnimationFrame || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame ||
		window.msRequestAnimationFrame;
		
window.AudioContext = 
		window.AudioContext || 
		window.webkitAudioContext;

window.AudioContext.prototype.createGain =
		window.AudioContext.prototype.createGain || 
		window.AudioContext.prototype.createGain;

if( !window.requestAnimationFrame || !window.AudioContext ){
	alert("It looks like your browser doesn't support this application. Please try a more modern Browser.");
}

navigator.vibrate = 
		navigator.vibrate || 
		navigator.webkitVibrate || 
		navigator.mozVibrate || 
		navigator.msVibrate ||
		function(duration){};

Object.defineProperty(Object.prototype, 'extends', {
    value: function (constructor) {
        this.prototype = Object.create(constructor.prototype, {
			constructor: {
				value: this,
				enumerable: false
			}
		});
    },
    enumerable: false
});






AudioNode.prototype.connectSuper = AudioNode.prototype.connect;
AudioNode.prototype.connect = function(target){
	AudioNode.prototype.connectSuper.call(this, target);
	console.log("Connecting "+this.toString()+" to "+target.toString());
    if( this.forwardConnections ){
		this.forwardConnections.push(target);
	} else {
		this.forwardConnections = [target];
	}
	if( target.backwardConnections ){
		target.backwardConnections.push(this);
	} else {
		target.backwardConnections = [this];
	}
};



AudioContext.prototype.fetchBuffer = function(bufferUrl){
	return new Promise( function(good, bad){
		var request = new XMLHttpRequest();
		request.open("GET", bufferUrl, true);
		request.responseType = "arraybuffer";
		request.onload = function() {
			this.decodeAudioData( request.response,
				function(buffer) {
					good(buffer);
				}.bind(this),
				function() {
					bad("Error decoding Buffer Source wth URL: "+bufferUrl);
				}
			);
		}.bind(this);
		try{
			request.send();
		} catch(err) { // Not working...
			console.error(err);
			bad("Error fetching Buffer Source with URL: "+bufferUrl);
		}
	}.bind(this));
};

AudioContext.prototype.createStub = function(){
	return this.createGain(); // TODO: Do something more fancy that takes up less memory.
};

String.prototype.titlecase = function(){
	var pieces = this.match(/[a-zA-Z0-9]+/g);
	var ret = pieces.map(function(word, idx){
		return word.substr(0,1).toUpperCase() + word.substr(1);
	}).reduce(function(last, current, idx){
		return last + " " + current;
	});
	return ret;
};