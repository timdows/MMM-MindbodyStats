'use strict';

Module.register("MMM-MindbodyStats", {

	jsonData: null,

	// Default module config.
	defaults: {
		loginUrl: "https://prod-swamis.mindbody.io/api/v1/auth",
		username: "",
		password: "",
		scheduleUrl: "https://prod-beacons.mindbody.io/api/v1/schedule?page%5Bsize%5D=50&page%5Bnumber%5D=1&filter%5Bascending%5D=false",
		updateInterval: 12 * 60 * 60 * 1000
	},

	start: function () {
		this.getJson();
		this.scheduleUpdate();
	},

	scheduleUpdate: function () {
		var self = this;
		setInterval(function () {
			self.getJson();
		}, this.config.updateInterval);
	},

	// Request node_helper to get json from url
	getJson: function () {
		this.sendSocketNotification("MMM-MindbodyStats_GET_JSON", this.config);
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "MMM-MindbodyStats_JSON_RESULT") {
			// Only continue if the notification came from the request we made
			// This way we can load the module more than once
			if (payload.url === this.config.url)
			{
				this.jsonData = payload.data;
				this.updateDom(500);
			}
		}
	},

	// Override dom generator.
	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.className = "xsmall";

		if (!this.jsonData) {
			wrapper.innerHTML = "Awaiting json data...";
			return wrapper;
		}
		
		var table = document.createElement("table");
		var tbody = document.createElement("tbody");
		
		var items = [];
		if (this.config.arrayName) {
			items = this.jsonData[this.config.arrayName];
		}
		else {
			items = this.jsonData;
		}

		// Check if items is of type array
		if (!(items instanceof Array)) {
			wrapper.innerHTML = "Json data is not of type array! " +
				"Maybe the config arrayName is not used and should be, or is configured wrong";
			return wrapper;
		}

		items.forEach(element => {
			var row = this.getTableRow(element);
			tbody.appendChild(row);
		});

		table.appendChild(tbody);
		wrapper.appendChild(table);
		return wrapper;
	},

	getTableRow: function (jsonObject) {
		var row = document.createElement("tr");
		for (var key in jsonObject) {
			var cell = document.createElement("td");
			
			var valueToDisplay = "";
			if (key === "icon") {
				cell.classList.add("fa", jsonObject[key]);
			}
			else if (this.config.tryFormatDate) {
				valueToDisplay = this.getFormattedValue(jsonObject[key]);
			}
			else {
				valueToDisplay = jsonObject[key];
			}

			var cellText = document.createTextNode(valueToDisplay);
			cell.appendChild(cellText);
			row.appendChild(cell);
		}
		return row;
	},

	// Format a date string or return the input
	getFormattedValue: function (input) {
		var m = moment(input);
		if (typeof input === "string" && m.isValid()) {
			// Show a formatted time if it occures today
			if (m.isSame(new Date(), "day") && m.hours() !== 0 && m.minutes() !== 0 && m.seconds() !== 0) {
				return m.format("HH:mm:ss");
			}
			else {
				return m.format("YYYY-MM-DD");
			}
		}
		else {
			return input;
		}
	}

});