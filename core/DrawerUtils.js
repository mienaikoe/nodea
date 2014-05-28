var DrawerUtils = {
	createSection: function(container, title, className){
		className = className ? className : '';
		var drawerSection = $("<div/>", {class: "drawer_section toggle"}).appendTo(container);
		var sectionHeader = $("<div/>", {class: "ds_heading"}).appendTo(drawerSection);
		$("<div/>", {class: "heading_text sinistra toggler", text: '>> '+title}).appendTo(sectionHeader);
		return $("<div/>", {class: "ds_body togglee "+className}).appendTo(drawerSection);
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
	}
	
	
};

