(function() {

angular.module('wfm.components.timepicker', [])
    .directive('wfmTimepicker', timepickerDirective)
    .directive('minuteInput', minuteInputDirective)
    .directive('hourInput', hourInputDirective);

function timepickerDirective() {
    return {
	restrict: 'E',
	require: ["wfmTimepicker", "ngModel"],
        template: timepickerTemplate,
        scope: {
            'useMeridian' : '=?',
            'hourStep' : '@?',
            'minuteStep' : '@?',
	    'maxTime': '=?',
	    'minTime': '=?'
        },
	controller: ["$scope", "$element", "$attrs", "$filter", "$log", timepickerCtrl],        
	link: postLink
    };

    function timepickerCtrl($scope, $element, $attrs, $filter, $log) {
	var self = this;

        self.updateRange = function(useMeridian, hourStep, minuteStep) {                        
            var minHour = useMeridian? 1 : 0;
            var maxHour = useMeridian? 12: 23;
            var minMinute = 0;
            var maxMinute = 59;

            hourStep = hourStep? parseInt(hourStep): 1;
            minuteStep = minuteStep? parseInt(minuteStep): 15;
            
            self.range = {
                hour: {min: minHour, max: maxHour, step: hourStep},
                minute: {min: minMinute, max: maxMinute, step: minuteStep}
            };
        };
        self.updateRange();
        
        
        self.readTime = function(timeValue, useMeridian) {
            if (!timeValue) return null;
            var timeText = self.getTimeText(timeValue, useMeridian);
            var pieces = timeText.split(':');
            
            var timeModel = {
                hour: parseInt(pieces[0]),
                minute: parseInt(pieces[1])                  
            };
            if (useMeridian) {
                timeModel.meridian = (pieces[2] == 'AM')? 0 : 1;
            }
            return timeModel;
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

	self.getTimeText = function(timeValue, useMeridian) {
	    if (!timeValue) return null;
            return $filter('date')(timeValue, useMeridian?'h:m:a':'H:m' );
	};

        self.logTimeValue = function(timeValue) {
            $log.log( $filter('date')(timeValue, 'HH:mm') );
        };
        
	function increment(value, range) {
	    if (value == null) return range.min;
            var overflow = value + range.step - range.max;
            return (overflow > 0)? range.min + overflow - 1 : value + range.step;
	}

	function decrement(value, range) {
	    if (value == null) return range.max;
            var overflow = value - range.step - range.min;
	    return (overflow < 0)? range.max + overflow + 1: value - range.step;
	}			
	
    }

    function postLink(scope, elem, attrs, ctrls) {
	var timepicker = ctrls[0];
	var ngModel = ctrls[1];
        var debug =  angular.isDefined(attrs['debug']);
        
        elem.attr('layout', 'row');        
        scope.timeValue = {hour: null, minute: null, meridian: null};
                
        scope.$watch('useMeridian', function(newValue, oldValue) {
            timepicker.updateRange(newValue, scope.hourStep, scope.minuteStep);
            if (ngModel.$modelValue) {
                setViewValue(timepicker.readTime(ngModel.$modelValue, newValue));
            } 
            ngModel.$render();
        });

        scope.$watch('hourStep', function(newValue) {
            timepicker.updateRange(scope.useMeridian, newValue, scope.minuteStep);
        });

        scope.$watch('minuteStep', function(newValue) {
            timepicker.updateRange(scope.useMeridian, scope.hourStep, newValue);
        });     
        
	scope.$watch('timeValue', setViewValue, true);
	scope.$watch(function() {
	    console.log("watcher", ngModel.$dirty, ngModel.$invalid);
	    return ngModel.$dirty && ngModel.$invalid;
	}, function(newValue) {
	    if (newValue) {
		var errMsg;
		if (angular.isDefined(ngModel.$error["minTime"])) {
		    errMsg = "Min-time: " + timepicker.getTimeText(scope.minTime);
		    scope.$broadcast('timepicker.notification.invalid', errMsg);
		}

		if (angular.isDefined(ngModel.$error['maxTime'])) {
		    errMsg = "Max-time: " + timepicker.getTimeText(scope.maxTime);
		    scope.$broadcast('timepicker.notification.invalid', errMsg);
		}
		console.log(ngModel.$error);
	    }	    
	});
	
	ngModel.$formatters.push(formatter);
	ngModel.$parsers.push(parser);
	ngModel.$render = renderer;
        
	ngModel.$validators.setHourAndMinute = function(modelValue, viewValue) {
	    if (modelValue == null && viewValue == null) return true;
	    if (viewValue.hour != null && viewValue.minute != null) {
		return ! scope.useMeridian || viewValue.meridian != null;
	    } else {
		return false;
	    }
	};	

	ngModel.$validators.minTime = function(modelValue, viewValue) {
	    if (modelValue == null) return true;	    
	    return isNaN(scope.minTime) ||
		new Date(modelValue.getTime()).setFullYear(1970, 0, 1) >=
		new Date(scope.minTime.getTime()).setFullYear(1970, 0, 1);	    
	};

	ngModel.$validators.maxTime = function(modelValue, viewValue) {
	    if (modelValue == null) return true;	    
	    return isNaN(scope.maxTime) ||
		new Date(modelValue.getTime()).setFullYear(1970, 0, 1) <=
		new Date(scope.maxTime.getTime()).setFullYear(1970, 0, 1);	    
	};

	
	function setViewValue(newValue, oldValue) {
	    ngModel.$setViewValue(angular.copy(newValue));
	};
	
	function renderer() {
            scope.timeValue = ngModel.$viewValue || {};
            if ( scope.useMeridian && scope.timeValue.meridian == null) {
                scope.timeValue.meridian = 0;
            }
	}
	
	function parser(viewValue) {
	    var date = new Date();
	    var meridianAdjustment = 0;
	    if (viewValue.meridian != null) {
		meridianAdjustment = viewValue.meridian * 12;
                if (viewValue.hour == 12) {
                    meridianAdjustment -= 12;
                }
	    }            
	    date.setHours(viewValue.hour + meridianAdjustment  );
	    date.setMinutes(viewValue.minute);

            if (debug) {
                timepicker.logTimeValue(date);
            }
            
	    return date;
	}
	
	function formatter(modelValue ) {           
            return timepicker.readTime(modelValue, scope.useMeridian);
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


	scope.$on('timepicker.notification.invalid', function() {
	    ngModel.$setValidity('range', false);
	});
	
	ngModel.$validators.number = function(modelValue, viewValue) {
	    if (viewValue != null && (angular.isString(viewValue) && viewValue)) {
		return isFinite(viewValue);
	    } else {
		return true;
	    }	    	   
	};
	
	ngModel.$validators.range = function(modelValue, viewValue) {
	    if (modelValue != null) {
		return modelValue >= wfmTimepicker.range.hour.min &&
                  modelValue <= wfmTimepicker.range.hour.max;
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
	    wfmTimepicker.changeByKeyPress(evt, ngModel, wfmTimepicker.range.hour);
	}

	function changeByMouseWheel(evt) {
	    wfmTimepicker.changeByMouseWheel(evt, ngModel, wfmTimepicker.range.hour);
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
	
	scope.$on('timepicker.notification.invalid', function() {
	    ngModel.$setValidity('range', false);
	});

	
	ngModel.$validators.number = function(modelValue, viewValue) {
	    if (viewValue != null && (angular.isString(viewValue) && viewValue)) {
		return isFinite(viewValue);
	    } else {
		return true;
	    }	    	   
	};
	
	ngModel.$validators.range = function(modelValue, viewValue) {
	    if (modelValue != null) {
		return modelValue >= wfmTimepicker.range.minute.min &&
                  modelValue <= wfmTimepicker.range.minute.max;
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
	    wfmTimepicker.changeByKeyPress(evt, ngModel, wfmTimepicker.range.minute);
	}

	function changeByMouseWheel(evt) {
	    wfmTimepicker.changeByMouseWheel(evt, ngModel, wfmTimepicker.range.minute);
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

function timepickerTemplate() {
    return '<input name="hourValueInput" type="text" ng-model="timeValue.hour" hour-input flex required />:<input name="minuteValueInput" type="text" ng-model="timeValue.minute" minute-input flex required/>' +
      '<select name="meridianValueInput" ng-model="timeValue.meridian" ng-if="useMeridian" flex required><option value="0">AM</option><option value="1">PM</option></select>';
}

})();
