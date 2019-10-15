sap.ui.define([
	'./BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device',
	'kronos/ui/graphapp/model/formatter'
], function (BaseController, JSONModel, Device, formatter) {
	"use strict";
	return BaseController.extend("kronos.ui.graphapp.controller.Home", {
		formatter: formatter,

		onInit: function () {
			var graphModel = this.getOwnerComponent().getModel("graph");
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
			this.oGraph._fZoomLevel = 0.75;
			debugger;
		}
	});
});