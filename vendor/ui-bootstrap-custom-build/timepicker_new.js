angular.module('wfm.components.timepicker', [])
//.directive('timepickerContainer', timepickerContainerDirective)
.directive('hourInput', hourInputDirective)
//.directive('minuteInput', minuteInputDirective)
//.directive('meridianInput', meridianInputDirective)
;


function hourInputDirective() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: linkFunction
    };

    function linkFunction(scope, elem, attrs, ngModel) {

        var CEILING = (angular.isDefined(attrs.showMeridian) && attrs.showMeridian)? 12 : 24;
                             
        elem.bind('focus', onFocus);
        elem.bind('blur', onBlur);

        function increment(value) {
            if (!value) return 1;
            return value + 1 >= CEILING ? value + 1 - CEILING : value + 1;            
        }

        function decrement(value) {
            if (!value) return CEILING - 1;
            return value -1 < 0 ? value - 1 + CEILING : value - 1;
        }
                
        function onFocus(evt) {
            elem.bind('keydown', changeByKeyPress);
            elem.bind('wheeldown wheel', changeByMouseWheel);
        }

        function onBlur(evt) {
            elem.unbind('keydown', changeByKeyPress);
            elem.unbind('wheeldown wheel', changeByMouseWheel);            
        }
        
        function changeByKeyPress(evt) {
            var action;
            if (evt.which === 38 ) {
                action = increment;
            } else if (evt.which === 40) {
                action = decrement;
            }
            if (action) {
                evt.preventDefault();
                ngModel.$setViewValue(action(ngModel.$modelValue));
                ngModel.$render();
            }
        }

        function changeByMouseWheel(evt) {                
            var isScrollingUp = function(e) {
                if (e.originalEvent) {
                    e = e.originalEvent;
                }             
                var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
                return (e.detail || delta > 0);
            };

            var action = isScrollingUp(evt)? increment: decrement;
            if (action) {
                evt.preventDefault();
                ngModel.$setViewValue( action(ngModel.$modelValue));
                ngModel.$render();
            }
        }

    } 
}
    
    







