/*
 * Large parts of this file are borrowed from
 * http://secretfeature.com/mono-synth/part3/scripts/MonoSynth.js
 * 
 */

function Reverb(ctx, effectReplacementCallback) {
	this.ctx = ctx;
	this.effectReplacementCallback = effectReplacementCallback;

	this.input = ctx.createConvolver();
	this.output = this.input;
	
	this.setCategory(Reverb.DEFAULT_CATEGORY);
	this.setSpace(Reverb.DEFAULT_SPACE);
}

Reverb.extends(Effect);




Reverb.prototype.setCategory = function(category, supressReset){
	if( category && this.category !== category ){
		this.category = category;
		this.space = Reverb.IMPULSES[category][0];
		if(!supressReset){
			this.resetBuffer();
		}
	}
};


Reverb.prototype.setSpace = function(space){
	if( space && this.space !== space ){
		this.space = space;
		this.resetBuffer();
	}
};


Reverb.prototype.resetBuffer = function(){
	this.ctx.fetchBuffer( "effects/Reverb/impulses/"+this.category+"/"+this.space+".wav").then( 
		function(buffer){
			this.input.buffer = buffer;
		}.bind(this), 
		function(err){
			console.error(err);
		});
};




Reverb.prototype.render = function(division, type) {
	Effect.prototype.render.call(this, division, type);
	var self = this;
	
	var spaceContainer = $("<div/>",{"class":"envelope_slider"});
	$("<label>",{html: "space"}).appendTo(spaceContainer);
	var spaceChooser = $("<select></select>",{id: "space_chooser"}).on("change", function(){
		self.setSpace(this.value);
		studio.invalidateSavedStatus();
	}).appendTo(spaceContainer);
	
	var categoryContainer = $("<div/>",{"class":"envelope_slider"});
	$("<label>",{html: "category"}).appendTo(categoryContainer);
	var categoryChooser = $("<select></select>",{id: "convolution_chooser"}).on("change", function(){
		self.setCategory(this.value);
		studio.invalidateSavedStatus();
		spaceChooser.empty();
		Reverb.IMPULSES[this.value].forEach( function(impulse){
			$("<option></option>",{html: impulse}).appendTo(spaceChooser);
		}, this);
	}).appendTo(categoryContainer);
	
	for( category in Reverb.IMPULSES ){
		$("<option></option>",{
			"value": category, 
			"html": category.titlecase(), 
			"selected": (category === self.category)
		}).appendTo(categoryChooser);
	}
	Reverb.IMPULSES[this.category].forEach( function(space){
		$("<option></option>",{
			"value": space,
			"html": space.titlecase(), 
			"selected": (space === self.space)
		}).appendTo(spaceChooser);
	}, this);

	categoryContainer.appendTo(division.body);
	spaceContainer.appendTo(division.body);
};



// marshal / load
Reverb.prototype.marshal = function() {
	var ret = Effect.prototype.marshal.call(this);
	ret.category = this.category;
	ret.space = this.space;
	return ret;
};

Reverb.prototype.load = function(settings) {
	if( settings ){
		this.setCategory(settings.category, true);
		this.setSpace(settings.space);
	}
};





Reverb.IMPULSES = {
	"ambiences":
			[
				"ambience_hall",
				"announcer",
				"heavy_ambience",
				"large_ambience",
				"medium_ambience",
				"small_ambience",
				"strong_ambience",
				"very_large_ambience"
			],
	"car":
			[
				"a_van",
				"beetle_interior",
				"bmw_limo",
				"cardoor-at_midnight",
				"car_frontseat_dialoge",
				"car_front_2_backseat",
				"car_interior_blue",
				"insode_truck",
				"limo_interior"
			],
	"dialog":
			[
				"dialoge_1",
				"dialoge_2",
				"dialoge_3",
				"dialogue+music_slap",
				"room_conversation"
			],
	"drums_and_percussion":
			[
				"bossa_nova_perc_room",
				"dance_snare",
				"drum_perc_soft_1",
				"drum_room_xpander",
				"drum_trash-stuff",
				"hard_drum_space",
				"kick&bass_ambience",
				"lap_dance_snare",
				"overhead_mics",
				"perc_modulation",
				"perc_stright_tail",
				"small_perc_room",
				"snare_room_bright",
				"snare_room_long",
				"tom-tom_reverb",
				"vintage_snare_room_2"
			],
	"empty_rooms":
			[
				"empty_autorium",
				"empty_basement",
				"empty_corridor",
				"empty_indoor_pool",
				"empty_nightclub",
				"empty_restaurant",
				"empty_stairwell",
				"empty_store"
			],
	"garage":
			[
				"garage",
				"home_garage",
				"indoor_parking_lot",
				"parking_distant",
				"parking_garage",
				"wide_garage"
			],
	"hall":
			[
				"acoustic_fill",
				"ambient_hall",
				"auto_park",
				"ballad_vocal_hall",
				"beefy_hall",
				"big_empty_club",
				"big_stage",
				"bottom_heavy",
				"bright_guitar_hall",
				"bright_theatre",
				"brite_stage&hall",
				"brite_stage",
				"cathedral",
				"church",
				"church_piano",
				"concert_arena",
				"echo_hall",
				"empty_arena",
				"front_row",
				"grand_vocal_hall",
				"jazz_hall",
				"key_hall",
				"large_brite_hall",
				"large_chior_hall",
				"large_church",
				"large_hall",
				"large_hall_clear",
				"large_stage&hall",
				"large_warm_hall",
				"med-large_hall",
				"medium_choir_hall",
				"medium_hall",
				"medium_vocal_hall",
				"med_stage&hall",
				"med_vox_hall",
				"multi",
				"piano_hall_1st_row",
				"recital",
				"short&deep",
				"small_brite_hall",
				"small_church",
				"small_dense_hall",
				"small_hall",
				"small_mt_stage",
				"small_stage&hall",
				"stage_and_hall",
				"taj_mahal_deep6",
				"venue_warm_1",
				"vocal_hall_1",
				"warm_cathedral"
			],
	"hotel":
			[
				"big_stairway",
				"big_stairwell",
				"centered_hallway",
				"down_the_hall",
				"elevator_shaft",
				"grand_ballroom",
				"hotel_lobby",
				"in_the_air_vent",
				"in_the_room",
				"meat_locker",
				"reception_aera",
				"wine-cellar"
			],
	"house":
			[
				"a_small_room",
				"basement_1",
				"basement_2",
				"basement_large",
				"big_room",
				"chamber",
				"closet-with-clothes",
				"dining_room",
				"drapes_&_curtains",
				"furnished_basement",
				"furnished_room",
				"furnished_room_2",
				"hallway",
				"interior_kitchen",
				"in_the_kitchen",
				"kitchen",
				"livingroom",
				"living_room",
				"living_room_blue",
				"modern_kitchen",
				"natural_wood_room",
				"real_living_room",
				"room_with_a_view",
				"semifurnished_quantec",
				"small_stairway",
				"storage_room",
				"store_room",
				"store_room_1",
				"the_2nd_bedroom",
				"under_the_blanket",
				"unfurnished_room",
				"walk_in_closet",
				"wood_floor"
			],
	"melodic_instruments":
			[
				"acoustic_gtr_ambience",
				"acoustic_guitar_space",
				"blackface_amp",
				"concert_piano",
				"crazey_phasey",
				"oil_drum",
				"rhodes_thicken",
				"slapback_piano",
				"smockey_sax",
				"sweeping_weirdverb"
			],
	"office":
			[
				"back_of_the_glass",
				"conference_room",
				"conf_room_damped",
				"corridor",
				"dense-centered_room",
				"glass_office",
				"large_office",
				"office",
				"soft-warehouse",
				"warehouse-blue",
				"wooden_office",
				"backyard",
				"backyard_quantec",
				"backyard_quantec_wide",
				"big_city",
				"city_foot_chase",
				"deep_valley",
				"distance_in_jungle",
				"dog_in_the_alley",
				"forrest_in_autum",
				"mine-corridor",
				"on_the_street"
			],
	"plate":
			[
				"ambient_plate",
				"bright_plate",
				"dessert_plate",
				"drum_plate",
				"drum_plate_stuff",
				"drum_wood_plate",
				"echo_plate",
				"fat_plate",
				"large_plate",
				"long_brite_space",
				"medium_plate",
				"percussion_plate",
				"piano_plate",
				"plated-gate",
				"silky_gold_plate",
				"slapback_plate",
				"small_plate",
				"snare_plate",
				"stairway_plate",
				"tin_plate",
				"vocal_plate",
				",ey_plate"
			],
	"public_places":
			[
				"AES_show_lobby",
				"airport_pa",
				"back_there",
				"boston_garden_hall",
				"brill_building_lobby",
				"budapest_west_railway",
				"classroom",
				"courtyard",
				"dark_tunnel",
				"factory",
				"frankfurter_hbf",
				"kellars_cell_blue",
				"large_locker_room",
				"locker_room",
				"long_swimingpool",
				"louvre_pyramid_hall",
				"medium_church",
				"party_chitchat",
				"pentagon_corridor",
				"plaster_walls",
				"scissorhands_parlor",
				"subway_platform_1",
				"subway_tunnel",
				"the_abbey",
				"watchtower_inside"
			],
	"rooms":
			[
				"band_rehearsal_room",
				"clear_guitar_room",
				"clear_room",
				"large_brite_room",
				"large_room",
				"large_wood_room",
				"medium_room",
				"mid_brite_room",
				"music_club",
				"pulpit",
				"small&brite",
				"small_booth",
				"small_room",
				"small_wood_room",
				"snare_strainer",
				"studio_20x20_ft",
				"studio_40x40_ft",
				"the_studio",
				"very_small_room",
				"vocal_breeze",
				"wide_ambient_chamber"
			],
	"studio":
			[
				"band_practice_room",
				"dance-studio",
				"enhancer_verb_2",
				"large&stage_blue",
				"live_VO_booth",
				"open_mics",
				"recording_booth",
				"scoring_stage_1",
				"scoring_stage_2",
				"small_foley_blue",
				"studio_small",
				"tight&natural",
				"tight&smooth"
			],
	"toilets_and_bathrooms":
			[
				"bathroom_blue",
				"bathroom_stall",
				"big_toilet",
				"In_the_shower",
				"public_mens_room",
				"public_toilet",
				"small_bathroom",
				"toilet_stall",
				"too_small_mens_room"
			],
	"very_small":
			[
				"claustrophobia",
				"claustro_phonebooth",
				"close-breathing",
				"near_the_wall",
				"phonebooth",
				"phonebooth_tight"
			],
	"vocal":
			[
				"bright_male_vox",
				"gospel_verb_1",
				"leader_of_the_band",
				"slapback_vox_1",
				"vocal_deep_male",
				"vocal_female"
			]
};


Reverb.DEFAULT_CATEGORY = "rooms";
Reverb.DEFAULT_SPACE = "the_studio";
