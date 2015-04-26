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
	controller: ["$scope", "$element", "$attrs", "$filter", timepickerCtrl],
	link: postLink
    };

    function timepickerCtrl($scope, $element, $attrs, $filter) {
	var self = this;

        self.options = {
            useMeridian: false,
            hourStep: 1,
            minuteStep: 15
        };

        self.updateRange = function(timeValue) {
            var minHour = self.options.useMeridian? 1 : 0;
            var maxHour = self.options.useMeridian? 12: 23;
            var minMinute = 0;
            var maxMinute = 59;
            
            self.range = {
                hour: {min: minHour, max: maxHour, step: self.options.hourStep},
                minute: {min: minMinute, max: maxMinute, step: self.options.minuteStep}
            };
        };
        
        self.readTime = function(timeValue) {
            if (!timeValue) return null;
            var timeText = $filter('date')(timeValue,  self.options.useMeridian?'h:m:a':'H:m' );
            console.log("readTime 1", timeText);
            var pieces = timeText.split(':');
            
            var timeModel = {
                hour: parseInt(pieces[0]),
                minute: parseInt(pieces[1])                  
            };
            if (self.options.useMeridian) {
                timeModel.meridian = (pieces[2] == 'AM')? 0 : 1;
            }
            console.log("readTime 2", timeModel);
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

        elem.attr('layout', 'row');        
        scope.useMeridian = timepicker.options.useMeridian;	
        scope.timeValue = {hour: null, minute: null, meridian: null};

        angular.isDefined(attrs['useMeridian']) && scope.$watch(function() {
            return scope.$eval(attrs['useMeridian']);
        }, function(newValue) {
            timepicker.options.useMeridian = (newValue != null)? newValue : false;
            if (ngModel.$modelValue) {
                setViewValue(timepicker.readTime(ngModel.$modelValue));               
            } 
            ngModel.$render();
        });

        angular.isDefined(attrs['hourStep']) && attrs.$observe('hourStep', function(newValue) {
            timepicker.range.hour.step = (newValue != null)? newValue : 1;
        });

        angular.isDefined(attrs['minuteStep']) && attrs.$observe('minuteStep', function(newValue) {
            timepicker.range.minute.step = (newValue != null)? newValue : 15;
        });        

        scope.$watch(function() {
            return timepicker.options;
        }, function(newValue) {
            timepicker.updateRange(scope.timeValue);
            scope.useMeridian = timepicker.options.useMeridian;
        }, true);
        
	scope.$watch('timeValue', setViewValue, true);
                
	ngModel.$formatters.push(formatter);
	ngModel.$parsers.push(parser);
	ngModel.$render = renderer;
        
	ngModel.$validators.setHourAndMinute = function(modelValue, viewValue) {
	    if (modelValue == null && viewValue == null) return true;
	    if (viewValue.hour != null && viewValue.minute != null) {
		if (scope.useMeridian) {
		    return viewValue.meridian != null;
		} else {
		    return true;
		}
		
	    } else {
		return false;
	    }
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
	    return date;
	}
	
	function formatter(modelValue ) {
            console.log("formatter", modelValue);
            return timepicker.readTime(modelValue);
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