var DelayedLoad = {
	
	loadedScripts: {},
	
	// TODO: Replace with Require js
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
	}
};
