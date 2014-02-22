var DrawerUtils = {
	createSection: function(container, title, className){
		className = className ? className : '';
		var drawerSection = $("<div/>", {class: "drawer_section toggle"}).appendTo(container);
		$("<div/>", {class: "ds_heading toggler", text: '>> '+title}).appendTo(drawerSection);
		return $("<div/>", {class: "ds_body togglee "+className}).appendTo(drawerSection);
	},

	createDivision: function(section, title, className){
		className = className ? className : '';
		var drawerDivision = $("<div/>", {class: "drawer_division toggle"}).appendTo(section);
		$("<div/>", {class: "dd_heading toggler", text: '>> '+title}).appendTo(drawerDivision);
		return $("<div/>", {class: "dd_body togglee "+className}).appendTo(drawerDivision);
	}
	
};