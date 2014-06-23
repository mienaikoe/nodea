
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

window.AudioContext.prototype.createGainNode =
		window.AudioContext.prototype.createGainNode || 
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


// TODO: Make Audio Params for each vol, and the general vol
AudioContext.prototype.createStereoGain = function(bufferSize) {
	if (!bufferSize) {
		bufferSize = 2048;
	}

	var node = this.createScriptProcessor(bufferSize);
	node.channelVolumes = [0.8, 0.8];
	node.setGain = function(value){
		node.channelVolumes = [value,value];
	};
	node.onaudioprocess = function(ev) {
		var inBuff = ev.inputBuffer;
		var outBuff = ev.outputBuffer;
		for (var channel = 0; channel < 2; channel++) {
			var outData = outBuff.getChannelData(channel);
			var inData = inBuff.getChannelData(channel);
			for (var sample = 0; sample < inBuff.length; sample++) {
				outData[sample] = channelVolumes[channel] * inData[sample];
			}
		}
	};
	
	return node;
};

/*
AudioNode.prototype.connectSuper = AudioNode.prototype.connect;
AudioNode.prototype.connect = function(target){
   console.log("Connecting "+this.toString()+" to "+target.toString());
   AudioNode.prototype.connectSuper.call(this, target);
};
*/