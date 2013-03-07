module DataTable {
  var pluginName = 'datatable';
  angular.module(pluginName, ['bootstrap', 'ngResource', 'hawtioCore']).
          directive('hawtioGrid', function (workspace, $timeout, $filter) {
            // return the directive link function. (compile function not needed)
            return function (scope, element, attrs) {
              var gridOptions = null;
              var data = null;
              var widget = null;
              var timeoutId = null;
              var initialised = false;


              // used to update the UI
              function updateGrid() {
                Core.$applyNowOrLater(scope);
              }

              function convertToDataTableColumn(columnDef) {
                var data = {
                  mData: columnDef.field
                };
                var name = columnDef.displayName;
                if (name) {
                  data["sTitle"] = name;
                }
                var width = columnDef.width;
                if (angular.isNumber(width)) {
                  data["sWidth"] = "" + width + "px";
                }
                var template = columnDef.cellTemplate;
                if (template) {
                  var html = $(template);
                  // TODO we could share a child scope for all columns maybe?
                  var childScope = scope.$new(false);
                  data["mRender"] = function (data, type, full) {
                    var entity = full;
                    childScope["row"] = {
                      entity: entity,

                      getProperty: (name) => {
                        return entity[name];
                      }
                    };
                    var partial = workspace.$compile(html);
                    var results = partial(childScope);

                    // TODO bit dirty hack - we should not have to turn into a string only to then reparse back into DOM!
                    // return results;

                    // TODO this feels dirty
                    Core.$applyNowOrLater(childScope);
                    return results.html();
                  };
                }
                var cellFilter = columnDef.cellFilter;
                if (cellFilter) {
                  var filter = $filter(cellFilter);
                  if (filter) {
                    data["mRender"] = function (data, type, full) {
                      return filter(data);
                    }
                  }
                }
                return data;
              }

              function onTableDataChange(value) {
                gridOptions = value;
                if (gridOptions) {
                  // TODO deal with updating the gridOptions on the fly?
                  if (widget === null) {
                    var widgetOptions = {
                      disableAddColumns: true,
                      rowDetailTemplateId: 'activemqMessageTemplate',
                      ignoreColumns: gridOptions.ignoreColumns,
                      flattenColumns: gridOptions.flattenColumns
                    };

                    // lets find a child table element
                    // or lets add one if there's not one already
                    var rootElement = $(element);
                    var tableElement = rootElement.children("table");
                    if (!tableElement.length) {
                      $("<table class='table'></table>").appendTo(rootElement);
                      tableElement = rootElement.children("table");
                    }
                    var trElement = Core.getOrCreateElements(tableElement, ["thead", "tr"]);

                    // TODO populate...
                    var columns = [];
                    var columnCounter = 1;
                    columns.push(
                            {
                              "mDataProp": null,
                              "sClass": "control center",
                              "sDefaultContent": '<i class="icon-plus"></i>'
                            });

                    var th = trElement.children("th");
                    if (th.length < columnCounter++) {
                      $("<th></th>").appendTo(trElement);
                    }
                    angular.forEach(gridOptions.columnDefs, (columnDef) => {
                      // if there's not another <tr> then lets add one
                      th = trElement.children("th");
                      if (th.length < columnCounter++) {
                        var name = columnDef.displayName || "";
                        $("<th>" + name + "</th>").appendTo(trElement);
                      }
                      columns.push(convertToDataTableColumn(columnDef));
                    });
                    widget = new TableWidget(scope, workspace, columns, widgetOptions);
                    widget.tableElement = tableElement;

                    // TODO....
                    // lets make sure there is enough th headers for the columns!

                  }
                  if (!data) {
                    // TODO deal with the data name changing one day?
                    data = gridOptions.data;
                    if (data) {
                      scope.$watch(data, function (value) {
                        if (initialised || (value && value.length)) {
                          initialised = true;
                          widget.populateTable(value);
                          updateLater();
                        }
                      });
                    }
                  }
                }
                updateGrid();
              }

              // watch the expression, and update the UI on change.
              scope.$watch(attrs.hawtioGrid, onTableDataChange);

              // schedule update in one second
              function updateLater() {
                // save the timeoutId for canceling
                timeoutId = $timeout(function () {
                  updateGrid(); // update DOM
                }, 100);
              }

              // listen on DOM destroy (removal) event, and cancel the next UI update
              // to prevent updating ofter the DOM element was removed.
              element.bind('$destroy', function () {
                $timeout.cancel(timeoutId);
              });

              updateLater(); // kick off the UI update process.
            }
          }
  );

  hawtioPluginLoader.addModule(pluginName);
}