var DelayedLoad = {
	
	loadedScripts: {},
	
	loadScript: function(type, handle, onload) {
		if(type===undefined || handle===undefined){
			console.warn("loadScript called with undefined type or handle");
			return;
		}
		
		var label = type + ":" + handle;

		var callbacks = DelayedLoad.loadedScripts[label];
		if (callbacks) {
			if (callbacks.length === 0) {
				onload.call(this);
			} else {
				callbacks.push(onload);
			}
		} else {
			DelayedLoad.loadedScripts[label] = [onload];

			var circuitJavascript = document.createElement('script');
			circuitJavascript.setAttribute("type", "text/javascript");
			circuitJavascript.setAttribute("src", "/nodea/" + type + "/" + handle + "/" + handle + ".js");
			document.head.appendChild(circuitJavascript);

			var self = this;
			circuitJavascript.onload = function() {
				self.loadedScripts[label].forEach(function(callback) {
					callback.call(self);
				});
				self.loadedScripts[label] = [];
			};
		}
	},
	
	loadBuffer: function(bufferUrl, callback){
		var self = this;
		var request = new XMLHttpRequest();
		request.open("GET", bufferUrl, true);
		request.responseType = "arraybuffer";
		request.onload = function() {
			self.ctx.decodeAudioData(
				request.response,
				function(buffer) {
					callback(buffer);
				},
				function() { 
					console.log("Error decoding sample for "+this.bufferUrl); 
					callback(null);
				}
			);
		};
		try{
			request.send();
		} catch(err) { // Not working...
			console.error("Error when trying to fetch Buffer Source");
			console.error(err.get_stack());
			callback(null);
		}
	}
};
