'use strict';

var _ = require('underscore');
var firebase = require('firebase');
var async = require('async');
var config = {};



exports.getProductPriceByIds=function(product_ids,callback){
    var tempProducts = _.clone(product_ids);
    var database = firebase.database();
    var items =firebase.database().ref('/store-items');
    var rows = [];
    var promiseArray=[]
    for(var index=0;index <tempProducts.length;index++){
        var id =tempProducts[index].product_id;
        promiseArray.push(getItemByIdPromise(items,id));
    }
    Promise.all(promiseArray).then(function(results){
        callback(results);
    });

};

function getItemByIdPromise(items,id){
    return items.orderByChild('id').equalTo(id).limitToFirst(1).once('value').then(function(snapshot) {
        return snapshot.val();
    });
}

exports.init = function (c) {
    config = c;
    firebase.initializeApp(config.fireBase.config);
};