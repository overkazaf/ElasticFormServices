const Router = require('koa-router');
const router = new Router();
const mongoose = require('mongoose');
const koaBody = require('koa-body');
const co = require('co');

router.post('/form/submit', koaBody(),
	co.wrap(function *(ctx) {
		let {
			rid,
			fid,
		} = ctx.request.body;
	 	// => POST body object
	  	
	  	console.log('rid', rid, 'fid', fid);
	  	const FormRecord = mongoose.model('FormRecord');

		yield FormRecord.findOne({fid: 1}, (err, data) => {
		  if (err) {
		    this.body = JSON.stringify(err);
		  }

		  console.log('data inside formRecord', data);

		  this.body = JSON.stringify({
		  	code: 0,
		  	message: 'hahaha',
		  	data: {},
		  })
		});

		this.respond = false;
	})
);

module.exports = router;