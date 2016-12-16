'use strict';

var _ = require('underscore');
var firebase = require('firebase');
var async = require('async');
var config = {};
var logger = require('./../logger');




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
    return items.orderByChild('id').equalTo(parseInt(id)).limitToFirst(1).once('value').then(function(snapshot) {
        return snapshot.val();
    });
}

exports.saveOrder = function writeUserData(userData,products,total,status,payment_id,callback) {
    firebase.database().ref('orders/'+payment_id).set({
        useData: userData,
        products: products,
        total: total,
        status: 0,
        dateTime: Date.now(),
        payment_id: payment_id
    }).then(function () {
        callback('ok');
    })
    .catch(function (error) {
            logger.error('Synchronization failed');
    });
}

exports.init = function (c) {
    config = c;
    firebase.initializeApp(config.fireBase.config);
};

exports.updateOrderStatus = function writeUserData(payment_id,status,callback) {
    firebase.database().ref('orders/'+payment_id).set({
        status: status,
        }).then(function () {
        callback('ok');
    })
        .catch(function (error) {
            logger.error('Synchronization failed');
            callback('error');
        });
}
