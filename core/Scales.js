var Pitch = function(color, octave){
	if(!color){ throw "Invalid Note Color: "+color};
	this.color = color;
	
	this.primary = Pitch.PRIMARIES.FREQUENCIES[this.color];
	if( !this.primary ){ throw "Invalid Note Color: "+color; }
	
	if( typeof octave !== "number" ){ throw "Invalid Octave: " + octave; }
	this.octave = octave;
	
	this.frequency = Pitch.addOctaves( this.primary, octave );
};

Pitch.prototype.marshal = function(){
	return {
		color: this.color,
		octave: this.octave
	};
};

Pitch.fromName = function(pitchName){
	var color = Pitch.pitchColor(pitchName);
	return new Pitch(color, parseInt(pitchName.substr(color.length, pitchName.length)));
};

Pitch.prototype.pitchName = function(){
	return this.color + this.octave;
};

Pitch.pitchColor = function(pitchName){
	if( !pitchName ){ throw "Invalid Note Name: "+pitchName; }

	var pitchColor = pitchName.charCodeAt(0);
	if( !pitchColor ){ throw "Invalid Note Name: "+pitchName; }

	var modifier = pitchName.charAt(1);
	if( !modifier ){ throw "Invalid Note Name: "+pitchName; }

	if( modifier === "♭" ){
		pitchColor -= 1;
		modifier = "#";
	} else if( modifier !== "#") {
		modifier = "";
	}

	return String.fromCharCode(pitchColor) + modifier;
};

Pitch.addHalfSteps = function( frequency, halfSteps ){
	return frequency * Math.pow(2, (halfSteps/12.0));
};

Pitch.addCents = function( frequency, cents ){
	return frequency * Math.pow(2, (cents/1200.0));
};

Pitch.addWholeSteps = function( frequency, halfSteps ){
	return frequency * Math.pow(2, (halfSteps/6.0));
};
		
Pitch.addOctaves = function( frequency, octaves ){
	return frequency * Math.pow(2, octaves);
};

Pitch.A0 = 13.75;

Pitch.PRIMARIES = {
	FREQUENCIES: {
		"C":	Pitch.addHalfSteps(Pitch.A0, -9),
		"C#":	Pitch.addHalfSteps(Pitch.A0, -8),
		"D":	Pitch.addHalfSteps(Pitch.A0, -7),
		"D#":	Pitch.addHalfSteps(Pitch.A0, -6),
		"E":	Pitch.addHalfSteps(Pitch.A0, -5),
		"F":	Pitch.addHalfSteps(Pitch.A0, -4),
		"F#":	Pitch.addHalfSteps(Pitch.A0, -3),
		"G":	Pitch.addHalfSteps(Pitch.A0, -2),
		"G#":	Pitch.addHalfSteps(Pitch.A0, -1),
		"A":	Pitch.A0,
		"A#":	Pitch.addHalfSteps(Pitch.A0, 1),
		"B":	Pitch.addHalfSteps(Pitch.A0, 2)
	},
	ORDER: [
		"C","C#","D","D#","E","F","F#","G","G#","A","A#","B"
	]
};


Pitch.pitchKeySelector = function(selectBox, value, changer){
	for( var key in Pitch.PRIMARIES.FREQUENCIES ){
		var fullKey = key;
		if( key.indexOf("#") !== -1 ){
			var flatKey = String.fromCharCode(key.charCodeAt(0)+1);
			if(flatKey === "H"){
				flatKey = "A";
			}
			fullKey += "/" + flatKey + "♭";
		}
		$("<option></option>",{value: key, html: fullKey, selected: (value === key)}).appendTo(selectBox);
	}
	selectBox.on("change", function(ev){
		if(changer){changer.call(this,ev);}
		$(this).blur();
	});
};









	

var Scales = {	

	scaleFrequencies: function( startingPitch, scaleType, pitchCount ){		
		var scaleSteps = Scales.SCALE_TYPES[scaleType];
		if(!scaleSteps){ throw "Invalid Scale Type: "+scaleType }
		
		var ret = [startingPitch.frequency];
		var octaveIndex = startingPitch.octave;
		var scaleIndex = 0;
		while(startingPitchCount > 0){
			if( scaleIndex > scaleSteps.length-1 ) {
				scaleIndex = 0;
				octaveIndex++;
			}
			ret.push( Pitch.addHalfSteps(startingPitch.primary, (octaveIndex*12) + scaleSteps[scaleIndex]) );
			scaleIndex++;
			startingPitchCount--;
		}
		
		return ret;
	},
	scalePitches: function( startingPitch, scaleType, pitchCount ){
		var scaleSteps = Scales.SCALE_TYPES[scaleType];
		if(!scaleSteps){ throw "Invalid Scale Type: "+scaleType }
		
		var ret = [startingPitch];
		pitchCount--;
		var octaveIndex = startingPitch.octave;
		var scaleIndex = 1;
		var semitones = Pitch.PRIMARIES.ORDER.indexOf(startingPitch.color);
		while(pitchCount > 0){
			if( scaleIndex > scaleSteps.length-1 ) {
				scaleIndex = 0;
				octaveIndex++;
			}
			
			var color = Pitch.PRIMARIES.ORDER[((semitones+scaleSteps[scaleIndex]) % Pitch.PRIMARIES.ORDER.length)];
			var octave = Math.floor(((octaveIndex*12) + semitones + scaleSteps[scaleIndex]) / Pitch.PRIMARIES.ORDER.length);
			ret.push(new Pitch(color, octave));
			scaleIndex++;
			pitchCount--;
		}
		
		return ret;
	}
};


Scales.SCALE_TYPES = {
	mixed_western:	[0,2,3,4,5,7,8,9,10,11],
	major:			[0,2,4,5,7,5,7,9,11,12],
	natural_minor:	[0,2,3,5,7,5,7,8,10,12],
	harmonic_minor:	[0,2,3,5,7,5,7,8,11,12],
	pentatonic:		[0,2,4,7,9],
	jazz:			[0,3,5,6,7,10],
	chromatic:		[0,1,2,3,4,5,6,7,8,9,10,11]
};

Scales.scaleTypeSelector = function(selectBox, value, changer){
	for( type in Scales.SCALE_TYPES ){
		$("<option></option>",{value: type, html: type.titlecase(), selected: (value === type)}).appendTo(selectBox);
	}
	selectBox.on("change", function(ev){
		if(changer){changer.call(this,ev);}
		$(this).blur();
	});
};

