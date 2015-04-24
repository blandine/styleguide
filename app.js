var app = angular.module('styleguideApp', ['ngMaterial', 'ui.grid', 'ui.grid.autoResize', 'ui.grid.exporter', 'ui.grid.selection', 'ui.bootstrap', 'ui.bootstrap.timepicker', 'wfm.components.timepicker'])
    .controller('mainCtrl', function ($scope, $filter) {
  /*
  * Code for Grid
  */
  var data = [];
  for(var i=0; i<100;i++){
    data[i]={}
    for(var j=0;j<10;j++){
	    data[i]["j"+j]=j;
    }
  }
  $scope.gridOptions = {
    exporterCsvFilename: 'myFile.csv',
    exporterMenuPdf: false,
    enableSelectAll: true,
    enableRowSelection: true,
    selectionRowHeaderWidth: 35,
    data:data
  };
  $scope.gridOptions.enableGridMenu = true;

  /*
  * Code for datepicker
  */
  $scope.dayInRange = function(date, mode) {
    console.log('inRange');
  };


  /*
   * Code for timepicker
   */  
	$scope.$watch('sometime', function(value) {
	    $scope.formattedSometime = ($scope.sometime != null)? $filter('date')($scope.sometime, 'HH:mm') : null;	    
	});


	$scope.increaseOneHour = function() {
	    var newDate = new Date();
	    newDate.setHours($scope.sometime.getHours() + 1);
	    newDate.setMinutes($scope.sometime.getMinutes());
	    console.log("before assign", newDate);
	    $scope.sometime = newDate;	
	};

    

});
