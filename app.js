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
        $scope.sometime = new Date();
	        
	$scope.increaseOneHour = function() {
            if ($scope.sometime == null) return;
            $scope.sometime.setHours($scope.sometime.getHours() + 1);
	    $scope.sometime = angular.copy($scope.sometime);	
	};

        $scope.increase15Minute = function() {
            if ($scope.sometime == null) return;
            $scope.sometime.setMinutes($scope.sometime.getMinutes() + 15);
	    $scope.sometime = angular.copy($scope.sometime);	
	};


        $scope.decreaseOneHour = function() {
            if ($scope.sometime == null) return;
            $scope.sometime.setHours($scope.sometime.getHours() - 1);
	    $scope.sometime = angular.copy($scope.sometime);	
	};

        $scope.decrease15Minute = function() {
            if ($scope.sometime == null) return;
            $scope.sometime.setMinutes($scope.sometime.getMinutes() - 15);
	    $scope.sometime = angular.copy($scope.sometime);	
	};

    

});
