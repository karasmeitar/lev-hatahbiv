'use strict';


var firebase = require('firebase');

var config = {};



exports.getProductPriceById=function(product_id){
    return 5;
    var database = firebase.database();

    var userId = firebase.auth().currentUser.uid;
    return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
        var username = snapshot.val().username;
        // ...
    });

};


exports.init = function (c) {
    config = c;
    firebase.initializeApp({
        databaseURL: config.fireBase.databaseURL,
        serviceAccount: config.fireBase.serviceAccount, //this is file that I downloaded from Firebase Console
    });
};