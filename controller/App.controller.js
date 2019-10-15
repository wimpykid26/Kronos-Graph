sap.ui.define([
	'./BaseController',
	'sap/ui/core/Fragment',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/m/ResponsivePopover',
	'sap/m/MessagePopover',
	'sap/m/ActionSheet',
	'sap/m/Button',
	'sap/m/Link',
	'sap/m/Bar',
	'sap/ui/core/IconPool',
	'sap/ui/layout/VerticalLayout',
	'sap/m/NotificationListItem',
	'sap/m/MessagePopoverItem',
	'sap/m/InputListItem',
	'sap/m/Select',
	'sap/ui/core/CustomData',
	'sap/m/MessageToast',
	'sap/ui/Device',
	'sap/ui/core/Item',
	'sap/ui/core/syncStyleClass',
	'sap/m/library',
	'sap/m/Label',
	'sap/ui/model/Filter',
	'sap/m/Token',
	'sap/ui/model/FilterOperator',
	'sap/ui/unified/ColorPickerPopover'
], function (
	BaseController,
	Fragment,
	Controller,
	JSONModel,
	ResponsivePopover,
	MessagePopover,
	ActionSheet,
	Button,
	Link,
	Bar,
	IconPool,
	VerticalLayout,
	NotificationListItem,
	MessagePopoverItem,
	InputListItem,
	Select,
	CustomData,
	MessageToast,
	Device,
	Item,
	syncStyleClass,
	mobileLibrary,
	Label,
	Filter,
	Token,
	FilterOperator,
	ColorPickerPopover
) {
		"use strict";

		// shortcut for sap.m.PlacementType
		var PlacementType = mobileLibrary.PlacementType;

		// shortcut for sap.m.VerticalPlacementType
		var VerticalPlacementType = mobileLibrary.VerticalPlacementType;

		// shortcut for sap.m.ButtonType
		var ButtonType = mobileLibrary.ButtonType;

		return BaseController.extend("kronos.ui.graphapp.controller.App", {

			_bExpanded: true,

			onInit: function () {
				// set explored app's demo model on this sample
				var dataModel = this.getOwnerComponent().getModel("edges");
				var graphModel = this.getOwnerComponent().getModel("graph");
				// the default limit of the model is set to 100. We want to show all the entries.
				dataModel.setSizeLimit(1000000);
				this.getView().setModel(dataModel);
				this.getView().setModel(graphModel, "graph");
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
				// if the app starts on desktop devices with small or meduim screen size, collaps the sid navigation
				if (Device.resize.width <= 1024) {
					this.onSideNavButtonPress();
				}
				Device.media.attachHandler(function (oDevice) {
					if ((oDevice.name === "Tablet" && this._bExpanded) || oDevice.name === "Desktop") {
						this.onSideNavButtonPress();
						// set the _bExpanded to false on tablet devices
						// extending and collapsing of side navigation should be done when resizing from
						// desktop to tablet screen sizes)
						this._bExpanded = (oDevice.name === "Desktop");
					}
				}.bind(this));
			},

			/**
			 * Convenience method for accessing the router.
			 * @public
			 * @param {sap.ui.base.Event} oEvent The item select event
			 */
			onItemSelect: function (oEvent) {
				var oItem = oEvent.getParameter('item');
				var sKey = oItem.getKey();
				// if you click on home, settings or statistics button, call the navTo function
				if (sKey === "home") {
					// if the device is phone, collaps the navigation side of the app to give more space
					if (Device.system.phone) {
						this.onSideNavButtonPress();
					}
					this.getRouter().navTo(sKey);
				} else {
					this._openNavPopover(sKey, oEvent);
					MessageToast.show(sKey);
				}
			},

			handleValueHelp: function (oEvent) {
				var sInputValue = oEvent.getSource().getValue();
				// create value help dialog
				var title = '';
				if (!this._valueHelpDialog || this._valueHelpDialog.bIsDestroyed) {
					switch (oEvent.getSource().getId()) {
						case 'container-graphapp---app--multiInput':
							name = "kronos.ui.graphapp.view.fragment.InputDialog";
							title = 'Edge Type';
							break;
						case 'container-graphapp---app--multiInputVertex':
							name = "kronos.ui.graphapp.view.fragment.VertexSearchHelp";
							title = 'Source Node Type';
							break;
						case 'container-graphapp---app--multiInputVertex2':
							name = "kronos.ui.graphapp.view.fragment.VertexSearchHelp";
							title = 'Target Node Type';
							break;
						case 'container-graphapp---app--multiInputNode':
							name = "kronos.ui.graphapp.view.fragment.NodeSearchHelp";
							title = 'Node';
							break;
						case 'container-graphapp---app--multiInputSource':
							name = "kronos.ui.graphapp.view.fragment.NodeSearchHelp";
							title = 'Source Node';
							break;
						case 'container-graphapp---app--multiInputTarget':
							name = "kronos.ui.graphapp.view.fragment.NodeSearchHelp";
							title = 'Target Node';
							break;
						case 'container-graphapp---app--InputNeighbor':
							name = "kronos.ui.graphapp.view.fragment.SingleNodeSearch";
							title = 'Nearest Neighborhood';
							break;
					}
					Fragment.load({
						id: this.getView().getId(),
						name: name,
						controller: this
					}).then(function (oValueHelpDialog) {
						this._valueHelpDialog = oValueHelpDialog;
						this._valueHelpDialog.setTitle(title);
						this.getView().addDependent(this._valueHelpDialog);
						this._openValueHelpDialog(sInputValue);
					}.bind(this));
				} else {
					this._openValueHelpDialog(sInputValue);
				}
			},

			_openValueHelpDialog: function (sInputValue) {
				// create a filter for the binding
				var filter = '';
				if (this._valueHelpDialog.getTitle() == 'Node' || 'Source Node' || 'Target Node') {
					filter = 'title';
				} else {
					filter = 'Name';
				}
				this._valueHelpDialog.getBinding("items").filter([new Filter(
					filter,
					FilterOperator.Contains,
					sInputValue
				)]);

				// open value help dialog filtered by the input value
				this._valueHelpDialog.open(sInputValue);
			},

			_handleValueHelpSearch: function (evt) {
				var sValue = evt.getParameter("value");
				var filter = '';
				if (this._valueHelpDialog.getTitle() == 'Node' || 'Source Node' || 'Target Node') {
					filter = 'title';
				} else {
					filter = 'Name'
				}
				var oFilter = new Filter(
					filter,
					FilterOperator.Contains,
					sValue
				);
				evt.getSource().getBinding("items").filter([oFilter]);
			},

			_handleValueHelpClose: function (evt) {
				var aSelectedItems = evt.getParameter("selectedItems");
				var oMultiInput = '';
				switch (evt.getSource().getTitle()) {
					case 'Edge Type': oMultiInput = this.byId("multiInput"); break;
					case 'Source Node Type': oMultiInput = this.byId("multiInputVertex"); break;
					case 'Target Node Type': oMultiInput = this.byId("multiInputVertex2"); break;
					case 'Node': oMultiInput = this.byId("multiInputNode"); break;
					case 'Source Node': oMultiInput = this.byId("multiInputSource"); break;
					case 'Target Node': oMultiInput = this.byId("multiInputTarget"); break;
					case 'Nearest Neighborhood':
						var oSingleInput = this.byId("InputNeighbor");
						if (aSelectedItems && aSelectedItems.length > 0) {
							oSingleInput.setValue(aSelectedItems[0].getTitle())
						}
						this._valueHelpDialog.destroy();
						return;
				}
				if (aSelectedItems && aSelectedItems.length > 0) {
					aSelectedItems.forEach(function (oItem) {
						oMultiInput.addToken(new Token({
							text: oItem.getTitle()
						}));
					});
				}
				this._valueHelpDialog.destroy();
			},

			_closeDialogBox() {
				//Get Selected Keys from Single Input.
				//Nearest Neighborhood
			},

			_openNavPopover(key, oEvent) {
				const popoverTitle = {
					"filters": "filterTitle",
					"legends": "legendTitle",
					"shortestDistance": "shortestDistanceTitle",
					"nearestNeighborhood": "nearestNeighborhoodTitle"
				};
				var oBundle = this.getModel("i18n").getResourceBundle();
				var oButton = new Button({
					text: oBundle.getText("navigationButtonText"),
					press: function () {
						this._closeDialogBox()
					}
				});
				var oDialog = '';
				switch (key) {
					case 'filters':
						oDialog = "kronos.ui.graphapp.view.fragment.Dialog";
						break;
					case 'shortestDistance':
						oDialog = "kronos.ui.graphapp.view.fragment.ShortestDistance";
						break;
					case 'legends':
						oDialog = "kronos.ui.graphapp.view.fragment.Legends";
						break;
					case 'nearestNeighborhood':
						oDialog = "kronos.ui.graphapp.view.fragment.NearestNeighborhood";
						break;
				}
				this._oDialogList = sap.ui.xmlfragment(this.getView().getId(), oDialog, this);

				var oNavigationPopover = new ResponsivePopover({
					title: oBundle.getText(popoverTitle[key]),
					endButton: oButton,
					modal: true,
					contentWidth: "500px",
					placement: PlacementType.Horizontal,
					content: this._oDialogList,
					afterClose: function () {
						oNavigationPopover.destroy();
					}
				});
				this.byId("app").addDependent(oNavigationPopover);
				// forward compact/cozy style into dialog
				syncStyleClass(this.getView().getController().getOwnerComponent().getContentDensityClass(), this.getView(), oNavigationPopover);
				oNavigationPopover.openBy(oEvent.getSource());
			},

			onUserNamePress: function (oEvent) {
				var oBundle = this.getModel("i18n").getResourceBundle();
				// close message popover
				var oMessagePopover = this.byId("errorMessagePopover");
				if (oMessagePopover && oMessagePopover.isOpen()) {
					oMessagePopover.destroy();
				}
				var fnHandleUserMenuItemPress = function (oEvent) {
					MessageToaost.show(oEvent.getSource().getText() + " was pressed");
				};
				var oActionSheet = new ActionSheet(this.getView().createId("userMessageActionSheet"), {
					title: oBundle.getText("userHeaderTitle"),
					showCancelButton: false,
					buttons: [
						new Button({
							text: 'User Settings',
							type: ButtonType.Transparent,
							press: fnHandleUserMenuItemPress
						}),
						new Button({
							text: "Online Guide",
							type: ButtonType.Transparent,
							press: fnHandleUserMenuItemPress
						}),
						new Button({
							text: 'Feedback',
							type: ButtonType.Transparent,
							press: fnHandleUserMenuItemPress
						}),
						new Button({
							text: 'Help',
							type: ButtonType.Transparent,
							press: fnHandleUserMenuItemPress
						}),
						new Button({
							text: 'Logout',
							type: ButtonType.Transparent,
							press: fnHandleUserMenuItemPress
						})
					],
					afterClose: function () {
						oActionSheet.destroy();
					}
				});
				// forward compact/cozy style into dialog
				syncStyleClass(this.getView().getController().getOwnerComponent().getContentDensityClass(), this.getView(), oActionSheet);
				oActionSheet.openBy(oEvent.getSource());
			},

			onSideNavButtonPress: function () {
				var oToolPage = this.byId("app");
				var bSideExpanded = oToolPage.getSideExpanded();
				this._setToggleButtonTooltip(bSideExpanded);
				oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
			},

			_setToggleButtonTooltip: function (bSideExpanded) {
				var oToggleButton = this.byId('sideNavigationToggleButton');
				if (bSideExpanded) {
					oToggleButton.setTooltip('Large Size Navigation');
				} else {
					oToggleButton.setTooltip('Small Size Navigation');
				}
			},
			openColorPicker: function (oEvent) {
				this.inputId = oEvent.getSource().getId();
				if (!this.oColorPickerSimplifiedPopover) {
					this.oColorPickerSimplifiedPopover = new ColorPickerPopover("oColorPickerSimpplifiedPopover", {
						colorString: "pink",
						displayMode: sap.ui.unified.ColorPickerDisplayMode.Simplified,
						mode: sap.ui.unified.ColorPickerMode.HSL,
						change: this.handleChange.bind(this)
					});
				}
				this.oColorPickerSimplifiedPopover.openBy(oEvent.getSource());
			},

			handleChange: function (oEvent) {
				var oView = this.getView(),
					oInput = oView.byId(this.inputId);
				oInput.setValue(oEvent.getParameter("colorString"));
				oInput.setValueState("None");
				this.inputId = "";
				MessageToast.show("Chosen color string: " + oEvent.getParameter("colorString"));
			},

			handleInputChange: function (oEvent) {
				var oInput = oEvent.getSource(),
					bValid = coreLibrary.CSSColor.isValid(oEvent.getParameter("value")),
					sState = bValid ? "None" : "Error";

				oInput.setValueState(sState);
			},
			// Errors Pressed
			onMessagePopoverPress: function (oEvent) {
				if (!this.byId("errorMessagePopover")) {
					var oMessagePopover = new MessagePopover(this.getView().createId("errorMessagePopover"), {
						placement: VerticalPlacementType.Bottom,
						items: {
							path: 'alerts>/alerts/errors',
							factory: this._createError
						},
						afterClose: function () {
							oMessagePopover.destroy();
						}
					});
					this.byId("app").addDependent(oMessagePopover);
					// forward compact/cozy style into dialog
					syncStyleClass(this.getView().getController().getOwnerComponent().getContentDensityClass(), this.getView(), oMessagePopover);
					oMessagePopover.openBy(oEvent.getSource());
				}
			},

			/**
			 * Event handler for the notification button
			 * @param {sap.ui.base.Event} oEvent the button press event
			 * @public
			 */
			onNotificationPress: function (oEvent) {
				var oBundle = this.getModel("i18n").getResourceBundle();
				// close message popover
				var oMessagePopover = this.byId("errorMessagePopover");
				if (oMessagePopover && oMessagePopover.isOpen()) {
					oMessagePopover.destroy();
				}
				var oButton = new Button({
					text: oBundle.getText("notificationButtonText"),
					press: function () {
						MessageToast.show("Show all Notifications was pressed");
					}
				});
				var oNotificationPopover = new ResponsivePopover(this.getView().createId("notificationMessagePopover"), {
					title: oBundle.getText("notificationTitle"),
					contentWidth: "300px",
					endButton: oButton,
					placement: PlacementType.Bottom,
					content: {
						path: 'alerts>/alerts/notifications',
						factory: this._createNotification
					},
					afterClose: function () {
						oNotificationPopover.destroy();
					}
				});
				this.byId("app").addDependent(oNotificationPopover);
				// forward compact/cozy style into dialog
				syncStyleClass(this.getView().getController().getOwnerComponent().getContentDensityClass(), this.getView(), oNotificationPopover);
				oNotificationPopover.openBy(oEvent.getSource());
			},

			/**
			 * Factory function for the notification items
			 * @param {string} sId The id for the item
			 * @param {sap.ui.model.Context} oBindingContext The binding context for the item
			 * @returns {sap.m.NotificationListItem} The new notification list item
			 * @private
			 */
			_createNotification: function (sId, oBindingContext) {
				var oBindingObject = oBindingContext.getObject();
				var oNotificationItem = new NotificationListItem({
					title: oBindingObject.title,
					description: oBindingObject.description,
					priority: oBindingObject.priority,
					close: function (oEvent) {
						var sBindingPath = oEvent.getSource().getCustomData()[0].getValue();
						var sIndex = sBindingPath.split("/").pop();
						var aItems = oEvent.getSource().getModel("alerts").getProperty("/alerts/notifications");
						aItems.splice(sIndex, 1);
						oEvent.getSource().getModel("alerts").setProperty("/alerts/notifications", aItems);
						oEvent.getSource().getModel("alerts").updateBindings("/alerts/notifications");
						MessageToast.show("Notification has been deleted.");
					},
					datetime: oBindingObject.date,
					authorPicture: oBindingObject.icon,
					press: function () {
						var oBundle = this.getModel("i18n").getResourceBundle();
						MessageToast.show(oBundle.getText("notificationItemClickedMessage", oBindingObject.title));
					},
					customData: [
						new CustomData({
							key: "path",
							value: oBindingContext.getPath()
						})
					]
				});
				return oNotificationItem;
			},

			_createError: function (sId, oBindingContext) {
				var oBindingObject = oBindingContext.getObject();
				var oLink = new Link("moreDetailsLink", {
					text: "More Details",
					press: function () {
						MessageToast.show("More Details was pressed");
					}
				});
				var oMessageItem = new MessagePopoverItem({
					title: oBindingObject.title,
					subtitle: oBindingObject.subTitle,
					description: oBindingObject.description,
					counter: oBindingObject.counter,
					link: oLink
				});
				return oMessageItem;
			}

		});
	});