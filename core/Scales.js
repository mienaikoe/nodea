var Pitch = function(pitchName){
	this.color = Pitch.pitchColor(pitchName);
	if(!this.color){ throw "Invalid Note Name: "+pitchName; }

	this.primary = Pitch.PRIMARIES[this.color];
	if( !this.primary ){ throw "Invalid Note Name: "+pitchName; }

	this.octave = parseInt(pitchName.substr(this.color.length, pitchName.length));
	if( typeof this.octave !== "number" ){ throw "Invalid Note Name: " + pitchName; }
	
	this.frequency = Pitch.addOctaves( this.primary, this.octave+1 );
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

Pitch.addHalfStepsName = function( pitchName, halfSteps ){
	
};

Pitch.addHalfSteps = function( frequency, halfSteps ){
	return frequency * Math.pow(2, (halfSteps/12.0));
};

Pitch.addWholeSteps = function( frequency, halfSteps ){
	return frequency * Math.pow(2, (halfSteps/6.0));
};
		
Pitch.addOctaves = function( frequency, octaves ){
	return frequency * 2 * octaves;
};

Pitch.A0 = 13.75;

Pitch.PRIMARIES = {
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
};












	

var Scales = {	

	scaleFrequencies: function( startingNote, scaleType, pitchCount ){
		var pitch = new Pitch(startingNote);
		
		var scaleSteps = Scales.SCALE_TYPES[scaleType];
		if(!scaleSteps){ throw "Invalid Scale Type: "+scaleType }
		
		var ret = [pitch.primary];
		var octaveIndex = pitch.octave;
		var scaleIndex = 0;
		while(pitchCount > 0){
			if( scaleIndex > scaleSteps.length-1 ) {
				scaleIndex = 0;
				octaveIndex++;
			}
			ret.push( Pitch.addHalfSteps(pitch.primary, (octaveIndex*12) + scaleSteps[scaleIndex]) );
			scaleIndex++;
			pitchCount--;
		}
		
		return ret;
	}

};


Scales.SCALE_TYPES = {
	mixed_western:	[2,3,4,5,7,8,9,11,12],
	major:			[2,4,5,7,9,11,12],
	natural_minor:	[2,3,5,7,8,10,12],
	harmonic_minor:	[2,3,5,7,8,11,12],
	pentatonic:		[2,4,7,9,12],
	jazz:			[3,5,6,7,10,12]
};


