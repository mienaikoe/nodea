var DelayedLoad = {
	loadeds: {},
	load: function(type, handle, onload) {
		var label = type + ":" + handle;

		var callbacks = DelayedLoad.loadeds[label];
		if (callbacks) {
			if (callbacks.length === 0) {
				onload.call(this);
			} else {
				callbacks.push(onload);
			}
		} else {
			DelayedLoad.loadeds[label] = [onload];

			var circuitJavascript = document.createElement('script');
			circuitJavascript.setAttribute("type", "text/javascript");
			circuitJavascript.setAttribute("src", "/nodea/" + type + "/" + handle + "/" + handle + ".js");
			document.head.appendChild(circuitJavascript);

			var self = this;
			circuitJavascript.onload = function() {
				self.loadeds[label].forEach(function(callback) {
					callback.call(self);
				});
				self.loadeds[label] = [];
			};
		}
	}
};
