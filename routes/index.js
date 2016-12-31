'use strict';

var paypal = require('paypal-rest-sdk');
var productsDb = require('../models/fireBaseDB')
var _ = require('underscore');
var config = {};
var logger = require('./../logger');

// Routes


exports.purchase = function (req, res) {
	var method = req.body.method;
	var products = req.body.products;
	var sum = 0;


	productsDb.getProductPriceByIds(products, function (itemrows) {

		var sum=0;
		for(var index=0;index < products.length;index++){
				var currdbProduct = _.findWhere(itemrows[0],{id:parseInt(products[index].product_id)});
				if(currdbProduct){
					sum+= products[index].amount * currdbProduct.price;
				}

		}
		createPaypalPayment(method,sum,req,res);
	});


}

function createPaypalPayment(method,sum,req,res){
	var payment = {
		"intent": "sale",
		"payer": {
		},
		"transactions": [{
			"amount": {
				"currency": 'ILS',
				"total": sum
			},
			"description": 'test'
		}]
	};

	if (method === 'paypal') {
		payment.payer.payment_method = 'paypal';
		payment.redirect_urls = {
			"return_url": "https://lev-hatahbiv.herokuapp.com/execute",
			"cancel_url": "https://lev-hatahbiv.herokuapp.com/cancel"
		};
	} else if (method === 'credit_card') {
		var funding_instruments = [
			{
				"credit_card": {
					"type": req.param('type').toLowerCase(),
					"number": req.param('number'),
					"expire_month": req.param('expire_month'),
					"expire_year": req.param('expire_year'),
					"first_name": req.param('first_name'),
					"last_name": req.param('last_name')
				}
			}
		];
		payment.payer.payment_method = 'credit_card';
		payment.payer.funding_instruments = funding_instruments;
	}

	paypal.payment.create(payment, function (error, payment) {
		if (error) {
			console.log(error);
			res.send({ 'error': error });
		} else {
			logger.info(JSON.stringify(payment));
			var redirectUrl;
			for(var i=0; i < payment.links.length; i++) {
				var link = payment.links[i];
				if (link.method === 'REDIRECT') {
					redirectUrl = link.href;
				}
			}

			var url = redirectUrl;
			productsDb.saveOrder(req.body.user_data,req.body.products,sum,0,payment.id,function(status){
				if(status === 'ok'){
					res.send(redirectUrl);
				}
				else{
					logger.error('Error in saving order in DB : '+JSON.stringify(req.session.products)+' for user: '+JSON.stringify(req.session.userData));
					res.status(500).send("Error in saving order in firebase");
				}
			});

		}
	});
}

exports.execute = function (req, res) {
	var paymentId = req.param('paymentId');
	var payerId = req.param('PayerID');
	var details = { "payer_id": payerId };
	var payment = paypal.payment.execute(paymentId, details, function (error, payment) {
		if (error) {
			logger.error('Error for Creating Purchase for paymentId: ' + paymentId);
			console.log('Error for Creating Purchase for paymentId: ' + paymentId);
		} else {
			productsDb.updateOrderStatus(paymentId,1,function(status){
				if(status === 'ok'){
					logger.info('Purchase Executed for paymentId: ' + paymentId);
					console.log('Purchase Executed for paymentId: ' + paymentId);
					res.redirect('https://lev-hatahbiv.firebaseapp.com?purchase=true');
				}
				else{
					res.redirect('https://lev-hatahbiv.firebaseapp.com?purchase=error');
				}
			});

		}
	});
};

exports.cancel = function (req, res) {
	res.redirect('https://lev-hatahbiv.firebaseapp.com?purchase=canceled');
};

// Configuration

exports.init = function (c) {
	config = c;
	paypal.configure(c.api);
};