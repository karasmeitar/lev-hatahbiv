'use strict';

var paypal = require('paypal-rest-sdk');
var productsDb = require('../models/productsDb')
var config = {};

// Routes

exports.index = function (req, res) {
  res.render('index');
};

exports.purchase = function (req, res) {
	var method = req.body.method;
	var products = req.body.products;
	var sum = 0;

	for(var i=0; i < products.length; i++)
	{
		var price = productsDb.getProductPriceById(products[i].product_id);
		if(products[i].ammount > 0) {
			sum += price * products[i].ammount;
		}
	}

	var payment = {
		"intent": "sale",
		"payer": {
		},
		"transactions": [{
			"amount": {
				"currency": 'ILS',
				"total": sum
			},
			"description": req.param('description')
		}]
	};

	if (method === 'paypal') {
		payment.payer.payment_method = 'paypal';
		payment.redirect_urls = {
			"return_url": "http://*/execute",
			"cancel_url": "http://*/cancel"
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

			var redirectUrl;
			for(var i=0; i < payment.links.length; i++) {
				var link = payment.links[i];
				if (link.method === 'REDIRECT') {
					redirectUrl = link.href;
				}
			}

			req.session.paymentId = payment.id;
			res.redirect(redirectUrl);
		}
	});
};

exports.execute = function (req, res) {
	var paymentId = req.session.paymentId;
	var payerId = req.param('PayerID');

	var details = { "payer_id": payerId };
	var payment = paypal.payment.execute(paymentId, details, function (error, payment) {
		if (error) {
			console.log(error);
			res.render('error', { 'error': error });
		} else {
			res.render('execute', { 'payment': payment });
		}
	});
};

exports.cancel = function (req, res) {
  res.render('cancel');
};

// Configuration

exports.init = function (c) {
	config = c;
	paypal.configure(c.api);
};