var DrawerUtils = {
	createSection: function(container, title, className){
		className = className ? className : '';
		var drawerSection = $("<div/>", {class: "drawer_section toggle"}).appendTo(container);
		drawerSection.head = $("<div/>", {class: "ds_heading"}).appendTo(drawerSection);
		$("<div/>", {class: "heading_text sinistra toggler", text: '>> '+title}).appendTo(drawerSection.head);
		drawerSection.body = $("<div/>", {class: "ds_body togglee "+className}).appendTo(drawerSection);
		return drawerSection;
	},
	
	makeSectionAddable: function(sectionBody, adderCallback){
		var heading = $(sectionBody).siblings(".ds_heading").first();
		var hoverFunc = function(){ $(this).toggleClass("hover"); };
		$("<div/>",{class: 'heading_button dextra', text: '+'}).appendTo(heading)
			.hover(hoverFunc, hoverFunc)
			.on("click",function(ev){
				ev.stopPropagation();
				adderCallback();
			});
	},

	createDivision: function(section, title, className){
		className = className ? className : '';
		var drawerDivision = $("<div/>", {class: "drawer_division toggle"}).appendTo(section);
		if( title !== null ){
			drawerDivision.header = $("<div/>", {class: "dd_heading"}).appendTo(drawerDivision);
			$("<div/>", {class: "heading_text sinistra toggler", text: '>> '+title}).appendTo(drawerDivision.header);
		}
		drawerDivision.body = $("<div/>", {class: "dd_body togglee "+className}).appendTo(drawerDivision);
		return drawerDivision;
	},
	
	makeDivisionRemovable: function(division, removerCallback){
		var heading = $(division).children(".dd_heading").first();
		var hoverFunc = function(){ $(this).toggleClass("hover"); };
		return $("<div/>",{class: 'heading_button dextra', text: '\u00d7'}).appendTo(heading)
			.hover(hoverFunc, hoverFunc)
			.on("click",function(ev){
				ev.stopPropagation();
				removerCallback();
			});
	},

	activateDrawerToggles: function(drawer){
		$(drawer).find(".toggler").each(function(idx, toggler){
			var togglee = $(toggler).closest(".toggle").find('.togglee');
			var hoverFunc = function(){ $(this).toggleClass("hover"); };
			$(toggler).
					hover( hoverFunc, hoverFunc ).
					on("click", function(){ togglee.toggle(); });
		});
	},
	
	
	
	// Useful Drawer UI Tools
	
	createSlider: function(key, attributes, value, changer, container){
		var sliderBox = $("<div>",{class:"envelope_slider"});
		$("<label>"+key+"</label>").appendTo(sliderBox);
		var slider = $("<input/>", $.extend({type:'range', value: value, id: this.id+'_slider_'+key}, attributes)).
			appendTo(sliderBox).
			on("change", function(){
				$(this).blur();
				changer(key, parseFloat(this.value));
			});
		if(container){
			sliderBox.appendTo(container);
		}	
		return slider;
	},
	
	createSelector: function(options, selected, changer, container){		
		var selector = $("<select/>");

		if(options instanceof Array){
			newOpts = {};
			options.forEach(function(item, idx){
				newOpts[item] = item;
			});
			options = newOpts;
		}
		
		for(key in options){
			if(!options.hasOwnProperty(key)){
				continue;
			}
			$("<option/>",{
				html: options[key], 
				value: key,
				selected: (selected === key)
			}).appendTo(selector);
		}
		
		$(selector).on("change", function(){
			var value = $(selector).val();
			if( value ){
				changer(value);
			}
		});
		if(container){
			selector.appendTo(container);
		}
		return selector;
	}
	
	
};


