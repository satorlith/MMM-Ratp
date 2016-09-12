/* Timetable for Paris local transport Module */

/* Magic Mirror
 * Module: MMM-Ratp
 *
 * By Louis-Guillaume MORAND
 * based on a script from Benjamin Angst http://www.beny.ch and Georg Peters (https://lane6.de)
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const forge = require('node-forge');
const unirest = require('unirest');

module.exports = NodeHelper.create({

		start: function () {
	    		this.started = false;
			console.log("NodeH started");
	  	},

	  

		/* updateTimetable(transports)
		 * Calls processTransports on succesfull response.
		 */
		updateTimetable: function() {
			var url = this.config.apiURL 
			var self = this;
			var retry = false;

			if(this.config.debugging) {
				console.log("Function updateTimeTable");
			}

		    unirest.post(url)
		   
		    .send(JSON.stringify(data))
		    .end(function (r) {
		    	if (r.error) {
		    		self.updateDom(this.config.animationSpeed);
		    		// console.log(self.name + " : " + r.error);
		    		retry = false;
		    	}
		    	else {
		    		// console.log("body: ", JSON.stringify(r.body));
		    		self.processTransports(r.body);
		    	}

		    	if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : this.config.retryDelay);
				}
		    });
		},

		/* processTransports(data)
		 * Uses the received data to set the various values.
		 */
		processTransports: function(data) {
			if(this.config.debugging) {
				console.log("Processing transports:" + data);
			}

			this.transports = [];
		
		    this.lineInfo = "test"; //data.informations.type + " " + data.informations.line + " (vers " + data.informations.destination.name + ")";
			for (var i = 0, count = data.schedules.length; i < count; i++) {

				var nextTransport = data.schedules[i];

				this.transports.push({
								next: nextTransport.message
				});
			}
			this.loaded = true;
			this.sendSocketNotification("TRANSPORTS", this.transports);
		},

		/* scheduleUpdate()
		 * Schedule next update.
		 * argument delay number - Millis econds before next update. If empty, this.config.updateInterval is used.
		 */
		scheduleUpdate: function(delay) {
			var nextLoad = this.config.updateInterval;
			if (typeof delay !== "undefined" && delay >= 0) {
				nextLoad = delay;
			}

			var self = this;
			clearTimeout(this.updateTimer);
			this.updateTimer = setTimeout(function() {
				self.updateTimetable();
			}, nextLoad);
		},

		socketNotificationReceived: function(notification, payload) {
			console.log("Notif received: " + notification);
			const self = this;
			if(this.config.debugging) {
				console.log("Notif received: " + notification);
				console.log(payload);
			}
		  if (notification === 'CONFIG' && this.started == false) {
		    this.config = payload;	     
		    this.started = true;
		    self.scheduleUpdate(this.config.initialLoadDelay);
		    };
		  }
});