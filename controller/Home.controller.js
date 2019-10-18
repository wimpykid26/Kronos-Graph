sap.ui.define([
	'./BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device',
	'kronos/ui/graphapp/model/formatter',
	"sap/ui/model/BindingMode",
	"sap/suite/ui/commons/networkgraph/Status"
], function (BaseController, JSONModel, Device, formatter, BindingMode, Status) {
	"use strict";
	return BaseController.extend("kronos.ui.graphapp.controller.Home", {
		formatter: formatter,

		onInit: function () {
			var EventBus = sap.ui.getCore().getEventBus();
			var graphModel = {};
			EventBus.subscribe("FilterChannel", "DialogClose", this._handleFilterEvent, this)
			graphModel = this.getOwnerComponent().getModel("graph");
			this.parentModel = jQuery.sap.extend(true, {}, graphModel);
			graphModel.setSizeLimit(Number.MAX_SAFE_INTEGER);
			this.setModel(graphModel);
			this.oModelSettings = new JSONModel({
				maxIterations: 200,
				maxTime: 500,
				initialTemperature: 200,
				coolDownStep: 1
			});
			this.getView().setModel(this.oModelSettings, "settings");
			this.oGraph = this.byId("graph");
			//Bind statuses to graph;
			var oStatusTemplate = new Status({
				key: "{key}",
				title: "{title}",
				borderColor: "{borderColor}",
				backgroundColor: "{backgroundColor}"
			})
			this.oGraph.bindAggregation("statuses", {
				path: "/statuses",
				template: oStatusTemplate,
				templateShareable: false
			});
			this.oGraph._fZoomLevel = 0.75;
		},

		_filterNearestNeighborhood: function (localModel, filter) {
			//Remove duplicates from filter.
			if (filter.length > 0) {
				filter = Array.from(new Set(filter));
				debugger;
				var unfilteredArrLines = localModel.lines;
				//Use any line going to or from the set of nearest neighborhood filter nodes.
				var filteredArrLines = unfilteredArrLines.filter((line) => { return filter.includes(line.from) || filter.includes(line.to) });
				localModel.lines = filteredArrLines;
				//Remove all nodes other than in filters.
				var unfilteredArrNodes = localModel.nodes;
				var filteredArrNodes = unfilteredArrNodes.filter((node) => {
					return filteredArrLines.some((line) =>
						line.from == node.key || line.to == node.key)
				});
				localModel.nodes = filteredArrNodes;
			}
			return localModel;
		},

		_filterLegends: function (localModel, filter) {
			if (Object.entries(filter).length !== 0 && filter.constructor === Object) {
				//If value set then update status color else, set default
				var statuses = this.oGraph.getStatuses();
				statuses.forEach((status) => {
					switch (status.getTitle()) {
						case "Location": {
							status.setBackgroundColor(filter.location ? filter.location : "#525DF4");
							status.setBorderColor(filter.location ? filter.location : "#525DF4");
							break;
						}
						case "Person": {
							status.setBackgroundColor(filter.person ? filter.person : "#E8743B");
							status.setBorderColor(filter.person ? filter.person : "#E8743B");
							break;
						}
						case "Organization": {
							status.setBackgroundColor(filter.organization ? filter.organization : "#13A4B4");
							status.setBorderColor(filter.organization ? filter.organization : "#13A4B4");
							break;
						}
						case "Time": {
							status.setBackgroundColor(filter.time ? filter.time : "#19A979");
							status.setBorderColor(filter.time ? filter.time : "#19A979");
							break;
						}
					}
				})
			}
			return localModel;
		},

		_handleFilterEvent: function (sChanel, sEvent, sData) {
			//Get all nodes from parent model.
			var localModel = jQuery.sap.extend(true, {}, this.parentModel.oData);
			//Copy parent model to local model
			//Apply filters to local Model.
			localModel = this._filterNearestNeighborhood(localModel, sData.nearestNeighborhood);
			localModel = this._filterLegends(localModel, sData.legends);
			//Set View Model with local Model
			this.byId("graph").getModel().setProperty("/nodes", localModel.nodes);
			this.byId("graph").getModel().setProperty("/lines", localModel.lines);
			this.byId("graph").getModel().setProperty("/groups", localModel.groups);
		}
	});
});