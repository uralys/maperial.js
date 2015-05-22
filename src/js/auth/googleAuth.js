// -------------------------------------------//
//	 	Google Login Lib
// -------------------------------------------//

this.GoogleAuth = {};

// -------------------------------------------//

// Logging in through the init process (onload = GoogleAuthOnload)
// <script src="https://apis.google.com/js/client.js?onload=GoogleAuthOnload"></script>
GoogleAuthOnload = function (app) {
    gapi.client.setApiKey(App.Globals.apiKey);
    window.setTimeout(GoogleAuth.checkGoogleAuth, 1);
}

// -------------------------------------------//

GoogleAuth.checkGoogleAuth = function () {
    gapi.auth.authorize({
        client_id: App.Globals.googleClientId,
        scope: App.Globals.scopes,
        immediate: true
    }, GoogleAuth.googleAuthResult);
}

//------------------------------------------------------------------------------------------//
// Logging in through the login window

GoogleAuth.googleAuthorize = function (event) {
    gapi.auth.authorize({
        client_id: App.Globals.googleClientId,
        scope: App.Globals.scopes,
        immediate: false
    }, GoogleAuth.googleAuthResult);
    return false;
}

//------------------------------------------------//

GoogleAuth.googleAuthResult = function (authResult) {
    if (authResult && !authResult.error) {
        App.user.set("loggedIn", true);
        $("#signinButton").fadeOut(1350);
        GoogleAuth.getUser();
    } else {
        $("#signinButton").click(GoogleAuth.openLoginWindow);
        Ember.Route.transitionTo("home");
    }
}

//------------------------------------------------------------------------------------------//

GoogleAuth.getUser = function () {
    //	gapi.client.load('plus', 'v1', function() {
    //		var request = gapi.client.plus.people.get({
    //			'userId': 'me'
    //		});

    gapi.client.load('oauth2', 'v2', function () {
        var request = gapi.client.oauth2.userinfo.get({
            'fields': 'email,name,picture'
        });

        request.execute(function (response) {
            //			if(response.picture)
            //				image.src = response.picture;

            App.user.set("name", response.name);
            App.user.set("email", response.email);

            UserManager.getGoogleUser();
        });
    });
}
