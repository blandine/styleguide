angular.module('wfm.components.timepicker', [
])
    .directive('wfmTimepicker', timepickerDirective)
    .directive('minuteInput', minuteInputDirective)
    .directive('hourInput', hourInputDirective);

function timepickerDirective() {

    return {
	restrict: 'E',
	require: ["wfmTimepicker", "ngModel"],
	template: '<input type="text" ng-model="hourValue" hour-input flex />:<input type="text" ng-model="minuteValue" minute-input flex/>' +
	    '<select ng-model="meridianValue" ng-options="meridian.name for meridian in meridians" flex></select>',
	controller: ["$scope", "$element", "$attrs", "$filter", timepickerCtrl],
	link: postLink
    };

    function timepickerCtrl($scope, $element, $attrs, $filter) {
	var self = this;
	
	self.useMeridian = angular.isDefined($attrs.useMeridian) && $attrs.useMeridian;
	self.ceiling = {
	    hour: self.useMeridian? 12 : 24,
	    minute: 60,
	    meridian: self.useMeridian? 2 : 0	    
	};
	var meridians = [
	    { name: "AM", value: 0},
	    { name: "PM", value: 1}
	];

	$scope.meridianValue = self.useMeridian? meridians[0]: null;
	$scope.useMeridian = self.useMeridian;	
	$scope.meridians = meridians;

	self.readHour = function(timeValue) {
	    return $filter('date')(timeValue, self.useMeridian?"hh" : "HH");
	};

	self.readMinute = function(timeValue) {
	    return $filter('date')(timeValue, "mm");
	};

	self.readMeridian = function(timeValue) {
	    if (self.useMeridian){
		
		var meridianText = $filter('date')(timeValue, 'a');		
		meridianText = (meridianText)? meridianText.toLowerCase(): meridianText;

		if ( meridianText == 'am') {
		    return meridians[0];
		} else if ( meridianText == 'pm') {
		    return meridians[1];
		} else {
		    return null;
		}
		
	    } else {
		return null;
	    }
	};
	
	self.changeByKeyPress = function(evt, ngModel, ceiling) {	   
	    var action;
	    if (evt.which === 38) {
		evt.preventDefault();
		action = increment;
	    } else if (evt.which === 40) {
		evt.preventDefault();
		action = decrement;
	    }
	    if (action) {
		ngModel.$setViewValue(action(ngModel.$modelValue, ceiling));
		ngModel.$render();
	    }	    
	};

	self.changeByMouseWheel = function(evt, ngModel, ceiling) {
	    evt.preventDefault();
	    var isScrollingUp = function(e) {
		if (e.originalEvent) {
		    e = e.originalEvent;
		}
		var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
		return (e.detail || delta > 0);
	    };
	    var action = isScrollingUp(evt)? increment: decrement;
	    if (action) {
		ngModel.$setViewValue(action(ngModel.$modelValue, ceiling));
		ngModel.$render();
	    }	    
	};
	
	function increment(value, ceiling) {
	    if (!value) return 1;
	    return (value + 1) % ceiling;
	}

	function decrement(value, ceiling) {
	    if (!value) return ceiling - 1;
	    return (value - 1 + ceiling) % ceiling;		
	}			
	
    }

    function postLink(scope, elem, attrs, ctrls) {
	var timepicker = ctrls[0];
	var ngModel = ctrls[1];

	ngModel.$formatters.push(formatter);
	ngModel.$parsers.push(parser);
	ngModel.$render = renderer;

	scope.$watch('hourValue', setViewValue);
	scope.$watch('minuteValue', setViewValue);
	scope.$watch('meridianValue', setViewValue);

	ngModel.$validators.setHourAndMinute = function(modelValue, viewValue) {
	    if (modelValue == null && viewValue == null) return true;
	    if (viewValue.hourValue != null && viewValue.minuteValue != null) {
		if (scope.useMeridian) {
		    return viewValue.meridianValue != null;
		} else {
		    return true;
		}
		
	    } else {
		return false;
	    }
	};	

	function setViewValue() {
	    ngModel.$setViewValue({
		hourValue: scope.hourValue,
		minuteValue: scope.minuteValue,
		meridianValue: scope.meridianValue
	    });
	};
	
	function renderer() {

	    console.log('renderer', ngModel.$viewValue);
	    
	    scope.hourValue = ngModel.$viewValue.hourValue;
	    scope.minuteValue = ngModel.$viewValue.minuteValue;
	    scope.meridianValue = ngModel.$viewValue.meridianValue;
	}
	
	function parser(viewValue) {
	    var date = new Date();

	    var meridianAdjustment;
	    if (viewValue.meridianValue) {
		meridianAdjustment = viewValue.meridianValue.value * 12;
	    }
	    
	    date.setHours(viewValue.hourValue + meridianAdjustment  );
	    date.setMinutes(viewValue.minuteValue);
	    return date;
	}
	
	function formatter(modelValue ) {
	    console.log('formatter', modelValue);
	    return {
		hourValue : timepicker.readHour(modelValue),
		minuteValue : timepicker.readMinute(modelValue),
		meridianValue: timepicker.readMeridian(modelValue)
	    };	    
	}	
    }    
}


function hourInputDirective() {

    return {	
	require: ['ngModel', '^wfmTimepicker'],
	restrict: 'A',
	link: postLink
    };

    function postLink(scope, elem, attrs, ctrls) {

	var ngModel = ctrls[0];
	var wfmTimepicker = ctrls[1];


	elem.attr('placeholder', wfmTimepicker.showMeridian? 'hh' : 'HH');
	elem.bind('focus', onFocus);
	elem.bind('blur', onBlur);

	
	ngModel.$validators.number = function(modelValue, viewValue) {
	    if (viewValue != null && (angular.isString(viewValue) && viewValue)) {
		return isFinite(viewValue);
	    } else {
		return true;
	    }	    	   
	};
	
	ngModel.$validators.range = function(modelValue, viewValue) {
	    if (modelValue != null) {
		return modelValue >=0 && modelValue < wfmTimepicker.ceiling.hour;
	    } else {
		return true;
	    }	    
	};	

	ngModel.$parsers.push(function(viewValue) {
	    if (viewValue != null) {
		var parsed = parseInt(viewValue);
		if (isFinite(parsed)) return parsed;
	    }
	    return null;
	});
	

	function changeByKeyPress(evt) {
	    wfmTimepicker.changeByKeyPress(evt, ngModel, wfmTimepicker.ceiling.hour);
	}

	function changeByMouseWheel(evt) {
	    wfmTimepicker.changeByMouseWheel(evt, ngModel, wfmTimepicker.ceiling.hour);
	}
	

	function onFocus(evt) {
	    elem.bind('keydown', changeByKeyPress);
	    elem.bind('mousewheel wheel', changeByMouseWheel);
	}

	function onBlur(evt) {
	    elem.unbind('keydown', changeByKeyPress);
	    elem.unbind('mousewheel wheel', changeByMouseWheel);	    
	}
		
    }    
}

function minuteInputDirective() {
    return {
	restrict: 'A',
	require: ['ngModel', '^wfmTimepicker'],
	link: postLink
    };

    function postLink(scope, elem, attrs, ctrls) {
	var ngModel = ctrls[0];
	var wfmTimepicker = ctrls[1];


	elem.attr('placeholder', 'mm');
	elem.bind('focus', onFocus);
	elem.bind('blur', onBlur);

	
	ngModel.$validators.number = function(modelValue, viewValue) {
	    if (viewValue != null && (angular.isString(viewValue) && viewValue)) {
		return isFinite(viewValue);
	    } else {
		return true;
	    }	    	   
	};
	
	ngModel.$validators.range = function(modelValue, viewValue) {
	    if (modelValue != null) {
		return modelValue >=0 && modelValue < wfmTimepicker.ceiling.minute;
	    } else {
		return true;
	    }	    
	};	

	ngModel.$parsers.push(function(viewValue) {
	    if (viewValue != null) {
		var parsed = parseInt(viewValue);
		if (isFinite(parsed)) return parsed;
	    }
	    return null;
	});
		
	function changeByKeyPress(evt) {
	    wfmTimepicker.changeByKeyPress(evt, ngModel, wfmTimepicker.ceiling.minute);
	}

	function changeByMouseWheel(evt) {
	    wfmTimepicker.changeByMouseWheel(evt, ngModel, wfmTimepicker.ceiling.minute);
	}
	

	function onFocus(evt) {
	    elem.bind('keydown', changeByKeyPress);
	    elem.bind('mousewheel wheel', changeByMouseWheel);
	}

	function onBlur(evt) {
	    elem.unbind('keydown', changeByKeyPress);
	    elem.unbind('mousewheel wheel', changeByMouseWheel);	    
	}		
    }    
}


