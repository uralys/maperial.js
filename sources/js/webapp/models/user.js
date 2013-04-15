(function() {
	'use strict';

	var User = Ember.Object.extend({
		uid: "",
		email: "",
		name: "",
		maperialToken: "",
		maps: Ember.A([]),
		styles: Ember.A([]),
		datasets: Ember.A([]),
		colorbars: Ember.A([]),
		fonts: Ember.A([]),
		icons: Ember.A([]),
		loggedIn: false,
		waiting: false,
		
		//---------------------------//
		
		isCreatingANewMap:false,
		isViewingAMap:false,
		isExportingAMap:false,
		selectedMap:null,
	});
	
	App.user = User.create();
	
})( App);
