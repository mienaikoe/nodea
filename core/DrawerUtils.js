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
			.click(function(ev){
				ev.stopPropagation();
				adderCallback();
			});
	},

	createDivision: function(section, title, className){
		className = className ? className : '';
		var drawerDivision = $("<div/>", {class: "drawer_division toggle"}).appendTo(section);
		var divisionHeader = $("<div/>", {class: "dd_heading"}).appendTo(drawerDivision);
		$("<div/>", {class: "heading_text sinistra toggler", text: '>> '+title}).appendTo(divisionHeader);
		return $("<div/>", {class: "dd_body togglee "+className}).appendTo(drawerDivision);
	},
	
	makeDivisionRemovable: function(sectionBody, removerCallback){
		var heading = $(sectionBody).siblings(".dd_heading").first();
		var hoverFunc = function(){ $(this).toggleClass("hover"); };
		$("<div/>",{class: 'heading_button dextra', text: '\u00d7'}).appendTo(heading)
			.hover(hoverFunc, hoverFunc)
			.click(function(ev){
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
					click(function(){ togglee.toggle(); });
		});
	},
	
	
	
	// Useful Drawer UI Tools
	
	createSlider: function(key, attributes, value, changer, container){
		var sliderBox = $("<div>",{class:"envelope_slider"});
		$("<label>"+key+"</label>").appendTo(sliderBox);
		var slider = $("<input/>", $.extend({type:'range', value: value, id: this.id+'_slider_'+key}, attributes)).
			appendTo(sliderBox).
			change(function(){
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
		options.forEach(function(machineName){
			$("<option/>",{
				html: machineName, 
				value: machineName,
				selected: (selected === machineName)
			}).appendTo(selector);
		}, this);
		$(selector).change(function(){
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


