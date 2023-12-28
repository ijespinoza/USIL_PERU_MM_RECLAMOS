sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
	"sap/ui/core/date/UI5Date",
	"sap/ui/core/Fragment"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter, FilterOperator, Sorter, MessageBox, MessageToast, UI5Date, Fragment) {
        "use strict";
        let that,
            ZMMGS_BUSCA_CENTRO,
            ZMMGS_BUSCA_RESERV,
            ZMMGS_CREA_RECLAMO,
            ZMMGS_TIPO_RECLAMO,
            ZMMGS_RESP_RECLAMO,
            ZMMGS_REPORT_RESERV;

        return Controller.extend("com.indra.gestionreclamos.controller.Home", {
            onInit: function () {
                that = this;   
                ZMMGS_BUSCA_CENTRO = this.getOwnerComponent().getModel("ZMMGS_BUSCA_CENTRO");
                ZMMGS_BUSCA_RESERV = this.getOwnerComponent().getModel("ZMMGS_BUSCA_RESERV");
                ZMMGS_CREA_RECLAMO = this.getOwnerComponent().getModel("ZMMGS_CREA_RECLAMO");
                ZMMGS_TIPO_RECLAMO = this.getOwnerComponent().getModel("ZMMGS_TIPO_RECLAMO");
                ZMMGS_RESP_RECLAMO = this.getOwnerComponent().getModel("ZMMGS_RESP_RECLAMO");
                ZMMGS_REPORT_RESERV = this.getOwnerComponent().getModel("ZMMGS_REPORT_RESERV");
                
                this.getDataInicial();
                this.getCentros();
                this.getTipoReclamo();
                this.getResponsable();
                this.getCurrentUserData();
                this.byId("fcReserva");
                that.getView().setModel(new JSONModel([]), "oReserva");
            },
            onCrearReclamo: function () {
                let bValidarCampos = that.validarCampos();

                if (!bValidarCampos) {
                    MessageBox.error("Por favor, completar los datos obligatorios.");
                    return;
                }

                sap.ui.core.BusyIndicator.show(0);
                let oEntry = {
                    "code" : "",
                    "message" : "",
                    "Ent_inputSet": [
                        {
                          "RSNUM": that.byId("txtReserva").getValue(),
                          "TIPO": that.byId("cboTipoReclamo").getSelectedKey(),
                          "RESPONSABLE": that.byId("cboResponsable").getSelectedKey(),
                          "ESTADO_RECLAMO": that.byId("txtEstadoReclamo").getValue(),
                          "DETALLE": that.byId("txtDetalle").getValue(),
                          "USU_CREADOR_RECLAMO": that.byId("IdUsuarioCreador").getValue()
                        }
                    ],
                    "Ent_outputSet": []
                };
				ZMMGS_CREA_RECLAMO.create("/Ent_DataSet", oEntry, {
					success: function (oData) {
                        console.log(oData);
                        let aResult = oData.Ent_outputSet.results;
                        if (aResult.length !== 0) {
                            that.byId("txtReclamo").setValue(aResult[0].ID);
                            MessageBox.success("Reclamo/Sugerencia " + aResult[0].ID + " registrado correctamente.");
                        }

                        if (oData.code === "500") {
                            MessageBox.error(oData.message);
                        }
                        sap.ui.core.BusyIndicator.hide(0);
					},
					error: function (oError) {
						MessageBox.error(oError.responseText);
                        sap.ui.core.BusyIndicator.hide(0);
					}
				});
            },
            validarCampos: function () {
                let aCombos = ["cboCentro","cboTipoReclamo","cboResponsable"],
                    aTextos = ["txtEstadoReclamo","txtDetalle","txtReserva"];

                for (let i = 0; i < aTextos.length; i++) {
                    let sInput = that.byId(aTextos[i]).getValue();
                    if (sInput == "") {
                        return false;
                    }
                }

                for (let o = 0; o < aCombos.length; o++) {
                    let sLista = that.byId(aCombos[o]).getSelectedKey();
                    if (sLista == "" || sLista == 0) {
                        return false;
                    }
                }

                return true;
            }, 
            _BuscarReserva: function (sValue) {
                if (!sValue) {
                    MessageBox.error("Por favor, ingresar N° de reserva");
                    return;
                }
                sap.ui.core.BusyIndicator.show(0);
                let oEntry = {
                    "code" : "",
                    "message" : "",
                    "Ent_inputSet": [
                        {
                          "RSNUM": sValue
                        }
                    ],
                    "Ent_outputSet": []
                }
				ZMMGS_BUSCA_RESERV.create("/Ent_DataSet", oEntry, {
					success: function (oData) {
                        let aReserva = oData.Ent_outputSet.results;

                        if (aReserva.length !== 0) {
                            let oReserva = aReserva[0];
                            that.getView().setModel(new JSONModel(oReserva), "reserva");
                        } else {
                            that.getView().setModel(new JSONModel({}), "reserva");
                            oEvent.getSource().setValue("");
                            MessageBox.error("No hay datos con este N° de Reserva.");
                        }
                        sap.ui.core.BusyIndicator.hide(0);
					},
					error: function (oError) {
						MessageBox.error(oError.responseText);
                        sap.ui.core.BusyIndicator.hide(0);
					}
				});
            },
            onOpenDialogReserva: function () {
                let sCentro = that.byId("cboCentro").getSelectedKey();

                if (sCentro === "") {
                    MessageBox.error("Por favor, seleccionar un Centro.");
                    return;
                }

                if (!this.ReservaDialog) {
                    this.ReservaDialog = sap.ui.xmlfragment(this.getView().getId(),
                        "com.indra.gestionreclamos.view.dialog.ListaReservas",
                        this);
    
                    this.getView().addDependent(this.ReservaDialog);
                }

                this.byId("txtCentro").setValue(sCentro);
                this.getView().getModel("oReserva").setData([]);
                this.ReservaDialog.open();
            },
            _cancelarDialogReserva: function () {
                this.getView().getModel("oReserva").setData([]);
                this.byId("dpFechaCreacion").setValue("");
                this.byId("txtCentro").setValue("");
                this.ReservaDialog.close();
            },
            onBuscarReserva: function (oEvent) {
                let fecha_creacion = this.byId("dpFechaCreacion").getValue(),
                    sCentro = this.byId("txtCentro").getValue();

                if (fecha_creacion !== "") {
                    fecha_creacion = formatoFechaString(this.byId("dpFechaCreacion").getDateValue()) + "-" + formatoFechaString(this.byId("dpFechaCreacion").getSecondDateValue());
                } else {
                    MessageBox.error("Por favor, seleccionar un rango de fecha.");
                    return;
                }

                let oEntry = {
                    "Ent_inputSet": [
                        {
                          "RSNUM":"",
                          "RSDAT": fecha_creacion,
                          "ABLAD":"",
                          "ADVCODE":"",
                          "EST_RES":"",
                          "WERKS": sCentro,
                          "SGTXT":"",
                          "USNAM":""
                        }
                    ],
                    "Ent_outputSet": []
                };

                sap.ui.core.BusyIndicator.show(0);
                ZMMGS_REPORT_RESERV.create("/Ent_DataSet", oEntry, {
					success: function (oData) {                        
                        let aReservas = oData.Ent_outputSet.results;
                        if (aReservas.length === 0) {
                            MessageToast.show("No hay datos que mostrar.");
                        }
                        that.getView().setModel(new JSONModel(aReservas), "oReserva");
                        sap.ui.core.BusyIndicator.hide();
					},
					error: function (oError) {
						MessageBox.error(oError.responseText);
                        sap.ui.core.BusyIndicator.hide();
					}
				});

                function formatoFechaString(date) {
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Añade un cero si es necesario
                    const day = date.getDate().toString().padStart(2, '0'); // Añade un cero si es necesario

                    return `${year}${month}${day}`;
                }
            },
            onSelectReserva: function (oEvent) {
                let oFila = oEvent.getSource().getSelectedItem().getBindingContext("oReserva").getObject();
                this._BuscarReserva(oFila.RSNUM);
                this._cancelarDialogReserva();
                this.byId("txtReserva").setValue(oFila.RSNUM);
                console.log(oFila);
            },
            getDataInicial: function () {
                let oModel = new JSONModel();
                oModel.setData({
                    valueDTP3: UI5Date.getInstance()
                });
                that.getView().setModel(new JSONModel({}), "reserva");
                that.byId("txtReserva").setValue("");
                that.byId("cboTipoReclamo").setSelectedKey("");
                that.byId("cboResponsable").setSelectedKey("");
                that.byId("txtReclamo").setValue("");
                that.byId("txtDetalle").setValue("");
                that.byId("cboCentro").setSelectedKey("");
			    that.getView().setModel(oModel);
            },
            getCentros: function () {
                let oEntry = {
                    "Ent_outputSet": []
                };
				ZMMGS_BUSCA_CENTRO.create("/Ent_DataSet", oEntry, {
					success: function (oData) {
                        let aCentros = oData.Ent_outputSet.results;
                        that.getView().setModel(new JSONModel(aCentros), "centro");
					},
					error: function (oError) {
						MessageBox.error(oError.responseText);
					}
				});
            },
            getTipoReclamo: function () {
                let oEntry = {
                    "code" : "",
                    "message" : "",
                    "Ent_outputSet": []
                };
				ZMMGS_TIPO_RECLAMO.create("/Ent_DataSet", oEntry, {
					success: function (oData) {
                        let aTipoReclamo = oData.Ent_outputSet.results;
                        that.getView().setModel(new JSONModel(aTipoReclamo), "tiporeclamo");
					},
					error: function (oError) {
						MessageBox.error(oError.responseText);
					}
				});
            },
            getResponsable: function () {
                let oEntry = {
                    "code" : "",
                    "message" : "",
                    "Ent_outputSet": []
                };
				ZMMGS_RESP_RECLAMO.create("/Ent_DataSet", oEntry, {
					success: function (oData) {
                        let aResponsable = oData.Ent_outputSet.results;
                        that.getView().setModel(new JSONModel(aResponsable), "responsable");
					},
					error: function (oError) {
						MessageBox.error(oError.responseText);
					}
				});
            },
            onLimpiar: function () {
                that.getDataInicial();
            },
            getCurrentUserData: function () {
                if (sap.ushell.Container) {
                    sap.ushell.Container.getServiceAsync("UserInfo").then(function (UserInfo) {
                        if (UserInfo.getEmail()) {
                            let currentUserEmail = UserInfo.getEmail();
                            let urlUserApi = that.getBaseURL() + "/scim/Users?filter=emails.value eq \"" + currentUserEmail + "\"";

                            $.ajax(urlUserApi, {
                                async: false,
                                success: function (data) {
                                    console.log(data);
                                    var userData = data;
                                    var oModel = that.getOwnerComponent().getModel("userData");
                                    if (oModel) {
                                        oModel.setProperty("/givenName", userData.Resources[0].name.givenName);
                                        oModel.setProperty("/familyName", userData.Resources[0].name.familyName);
                                        oModel.setProperty("/userId", userData.Resources[0].userName);
                                        oModel.setProperty("/userAndName", userData.Resources[0].userName + "-" + userData.Resources[0].name.givenName + " " + userData.Resources[0].name.familyName);
                                    }
                                },
                                error: function (error) {
                                    console.log(error);
                                }
                            });
                        }
                    });
                }
                
            },
            getBaseURL: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                return appModulePath;
            }
        });
    });
