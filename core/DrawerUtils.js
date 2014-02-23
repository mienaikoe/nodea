var DrawerUtils = {
	createSection: function(container, title, className){
		className = className ? className : '';
		var drawerSection = $("<div/>", {class: "drawer_section toggle"}).appendTo(container);
		$("<div/>", {class: "ds_heading toggler", text: '>> '+title}).appendTo(drawerSection);
		return $("<div/>", {class: "ds_body togglee "+className}).appendTo(drawerSection);
	},
	
	makeSectionAddable: function(sectionBody, adderCallback){
		var heading = $(sectionBody).siblings(".ds_heading").first();
		$("<span/>",{class: 'dextra', text: '+'}).appendTo(heading).click(function(ev){
			ev.stopPropagation();
			adderCallback();
		});
	},

	createDivision: function(section, title, className){
		className = className ? className : '';
		var drawerDivision = $("<div/>", {class: "drawer_division toggle"}).appendTo(section);
		$("<div/>", {class: "dd_heading toggler", text: '>> '+title}).appendTo(drawerDivision);
		return $("<div/>", {class: "dd_body togglee "+className}).appendTo(drawerDivision);
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

