/*!
 *  zwipeJS 0.1.0
 *  Tiny jQuery slider with hardware accelerated CSS transitions
 *  http://www.github.com/zigotica/zwipeJS
 *
 *  Author: Sergi Meseguer
 *  http://www.zigotica.com
 *
 *  Licensed under FreeBSD
 *  http://www.github.com/zigotica/zwipeJS/blob/master/license.txt
 */

;(function ($, undefined) {
    // cache events
    var touchable= ('ontouchstart' in window);
    var startEvt = (touchable)?'touchstart.zwipe':'mousedown.zwipe';
    var moveEvt  = (touchable)?'touchmove.zwipe':'mousemove.zwipe';
    var endEvt   = (touchable)?'touchend.zwipe touchcancel.zwipe':'mouseup.zwipe mouseout.zwipe';
    var cancelEvt= (touchable)?'touchcancel.zwipe':'mouseout.zwipe';

    var methods = {
        init : function( options ) {console.log("init.zwipe, startEvt", startEvt);
            var $this, $wrapper, $outer, $items;
            // to be cleared onEnd:
            var touches = moves = stdEvt = id = null;
            var _evtData = {};

            $this = $(this);
            id = $this.attr("id");

            var settings = $.extend({
                // initial slide
                active : 0,
                // behaviour
                minDist : 50,       // if moved distance smaller than minDist we do not change slide
                snap : true,        // true: snap to wrapper onEnd, false: do not snap
                advanceOne : false, // false: go to closest onEnd (based on half slides), false: only one
                centered: false,    // true: center item in wrapper when active, false: set on edge
                silent : false,     // false: update position while zwipping, true: do not update
                // navigation
                bulletable : true,  // true: use bullets for navigation, false: do not use
                arrowable : true,   // true: use arrows for navigation, false: do not use
                // forbidden tagName/classList
                avoidEls : ['A','BUTTON', 'INPUT'],
                avoidCls : ['dontzwipe'],
                // customisable selectors/classes
                wrapperSelector: '.wrappersliderbox',
                outerSelector: '.outersliderbox',
                childrenSelector: '> li',
                activeClass : 'active',
                bulletBoxClass: 'bulletsbox',
                bulletClass: 'bullet',
                arrowBoxClass: 'arrowsbox',
                arrowClass: 'arrow',
                arrowPrevClass: 'arrow-prev',
                arrowNextClass: 'arrow-next',
                animatingClass: '___zwipping',
                // customisable callbacks
                zwipeStartCallback: function ( obj, data, opts ) { /*console.log("start.zwipe");*/ },
                zwipeMoveCallback: function ( obj, data, opts ) { /*console.log("move.zwipe");*/ },
                zwipeEndCallback: function ( obj, data, opts ) { /*console.log("end.zwipe");*/ },
                goToCallback: function ( obj, opts ) { /*console.log("goto.zwipe");*/ }
            }, options);

            // supported transforms, if any
            function supportedTransform() {
                var prefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' ');
                var div = document.createElement('div');
                for(var i = 0, pl = prefixes.length; i < pl; i++) {
                    if(div && div.style[prefixes[i]] !== undefined) return prefixes[i];
                }
                return false;
            }

            function savePositions(){
                settings.sizes = [];
                settings.positions = [];
                settings.sizeVal = 0;

                $items.each(function() {
                    settings.sizes.push( parseInt( $(this).css(settings.sizeDim), 10) );
                });
                settings.sizes.forEach(function(element, index, array) {
                    settings.sizeVal += element;
                    settings.positions.push( - settings.sizeVal );
                });
                $this.css(settings.sizeDim, settings.sizeVal +"px");
            }

            // parents, normally needed to build control elements (arrows/bullets)
            $wrapper = $this.closest(settings.wrapperSelector);
            $outer = $wrapper.closest(settings.outerSelector);

            // set direction/dimensions
            if( $outer.hasClass('horizontal') ){
                settings.axis = "X";
                settings.dir = "left";
                settings.sizeDim = "width";
            }
            else if( $outer.hasClass('vertical') ){
                settings.axis = "Y";
                settings.dir = "top";
                settings.sizeDim = "height";
            }

            // set slider dimensions, adding individual items size
            $items = $this.find(settings.childrenSelector);
            count  = $items.length;
            savePositions();
            $(window).on("resize.zwipe orientationchange.zwipe", savePositions);

            // save count to options object
            settings.count  = count;

            // does device support transforms
            settings.supportedTransform = supportedTransform();
            settings.transformable = !!settings.supportedTransform;

            // expose settings to HTML element so we can use goBy/goTo/destroy
            $this.data("opts", settings);

            // set active item if HTML element has the class
            settings.activeSelector = "."+settings.activeClass;
            if( $items.filter( settings.activeSelector ).length > 0 ) {
                settings.active = $items.filter( settings.activeSelector ).index();
            }

            // build navigation, if any
            if( settings.bulletable) {
                settings.bullets = '';
                for (var i = 0; i < settings.count; i++) {
                    settings.bullets += '<a class="'+settings.bulletClass+'" onclick="$(\'#'+id+'\').zwipe(\'goTo\', '+i+')"></a>';
                };
                $outer.append('<div class="'+settings.bulletBoxClass+'">'+settings.bullets+'</div>');
            }
            if( settings.arrowable) {
                settings.arrows = '<a class="'+settings.arrowClass+' '+settings.arrowPrevClass+'" onclick="$(\'#'+id+'\').zwipe(\'goBy\', -1)"><</a><a class="'+settings.arrowClass+' '+settings.arrowNextClass+'" onclick="$(\'#'+id+'\').zwipe(\'goBy\', 1)">></a>';
                $outer.append('<div class="'+settings.arrowBoxClass+'">'+settings.arrows+'</div>');
            }

            // go to active item
            methods.goTo(settings.active, $this);

            var onStart = function(e) {console.log("start.zwipe");
                var $instance = $(this),
                    ot      = e.originalEvent.target,
                    tag     = ot.tagName,
                    clsArr  = ot.classList,
                    clsLen  = clsArr.length,
                    avdElsLen  = settings.avoidEls.length,
                    avdClsLen  = settings.avoidCls.length,
                    act     = $items.filter( settings.activeSelector ).index();

                // save active to options object
                settings.active = (act > -1)? act : settings.active;

                // listen for move
                $instance.on(moveEvt, onMove);

                // listen for end
                $instance.on(endEvt, onEnd);

                // silently cancel if already animating
                if( $instance.hasClass(settings.animatingClass) ) {
                    return;
                }
                // silently cancel if event generated in a forbidden tagName/classList
                for(var i=0; i<avdElsLen; i++){
                    if(tag == settings.avoidEls[i]){
                        return;
                    }
                }
                for(var j=0; j<avdClsLen; j++){
                    for(var k=0; k<clsLen; k++){
                        if(clsArr[k] == settings.avoidCls[j]){
                            return;
                        }
                    }
                }

                // avoid page scrolling while using zwipe
                e.stopPropagation();

                $instance.addClass(settings.animatingClass);

                touches = e.touches || e.originalEvent.touches || null;
                moves   = e;
                stdEvt  = (touches) ? touches[0] : moves;

                // should we continue
                if(touches){
                    if(touches.length === 1 ) {
                        _evtData.zwipping = 1;
                    }
                    /* multifingers: cancel this evt instance */
                    else {
                        return;
                    }
                }
                else {
                    _evtData.moving = 1;
                }

                // save stadarised events data for initial state
                _evtData.step   = 0;
                _evtData.lastPosition  = $items.eq( settings.count-1 )[settings.sizeDim]();
                _evtData.wrapperSize   = $instance[settings.sizeDim]();
                _evtData.maxPosition   = _evtData.lastPosition - _evtData.wrapperSize,
                _evtData.deltaX = 0;
                _evtData.deltaY = 0;
                _evtData.startX = stdEvt.pageX;
                _evtData.startY = stdEvt.pageY;

                // update settings to HTML element so we can use goBy/goTo
                $instance.data("opts", settings);

                // get initial position depending on transform matrix or scroll
                if(settings.transformable) {
                    _evtData.transform = $instance.css( settings.supportedTransform );
                    if(_evtData.transform == "none") {
                        _evtData.transX0 = 0;
                        _evtData.transY0 = 0;
                    }
                    else {
                        var vals = _evtData.transform.substr(7, _evtData.transform.length - 8).split(', ');
                        _evtData.transX0 = vals[4];
                        _evtData.transY0 = vals[5];
                    }
                    $instance.css(settings.supportedTransform, "translate"+settings.axis+"(" + _evtData["trans"+settings.axis+"0"]+"px)");
                }
                else{
                    _evtData["trans"+settings.axis+"0"] = $instance.css(settings.dir);

                    $instance.css(settings.dir, _evtData["trans"+settings.axis+"0"]+"px");
                }

                // start callback
                settings.zwipeStartCallback( $instance, _evtData, settings );
            };

            var onMove = function(e) {console.log("move.zwipe");
                e.preventDefault();

                var pos;
                var $instance = $(this);

                touches = e.touches || e.originalEvent.touches || null;
                moves   = e;
                stdEvt  = (touches) ? touches[0] : moves;

                if(_evtData.zwipping || _evtData.moving) {
                    _evtData.deltaX = stdEvt.pageX - _evtData.startX;
                    _evtData.deltaY = stdEvt.pageY - _evtData.startY;
                    _evtData.step++;
                    _evtData.increases = (_evtData["delta"+settings.axis] >= 0)?false:true;
                    _evtData.constraint_limits = false;

                    // constraint: along axis movement
                    _evtData.horizontal = ( Math.abs(_evtData.deltaX) > Math.abs(_evtData.deltaY) )?true:false;
                    _evtData.constraint_axis = (
                        (_evtData.horizontal && settings.axis === "X")
                        ||
                        (!_evtData.horizontal && settings.axis === "Y")
                    );

                    pos = parseInt( _evtData["trans"+settings.axis+"0"], 10)+_evtData["delta"+settings.axis];

                    // constraint: end collision, …
                    if(( _evtData.increases && pos > _evtData.maxPosition ) || ( !_evtData.increases && pos < 0)){
                        _evtData.constraint_limits = true;
                    }

                    // if axis and limits constraints fulfill
                    // step > 5 because we could be zwipping both directions and get a delta=0 misinterpreting axis
                    if( (_evtData.step > 5 || _evtData.constraint_axis) && _evtData.constraint_limits ){
                            if(!settings.silent){
                                if(settings.transformable){
                                    $instance.css(settings.supportedTransform, "translate"+settings.axis+"(" + pos + "px)");
                                }
                                else {
                                    $instance.css(settings.dir, pos + "px");
                                }
                            }

                            // move callback
                            settings.zwipeMoveCallback( $instance, _evtData, settings );
                    }
                    else { /* constraints do not fulfill */
                        $instance.trigger(cancelEvt);
                    }
                }
            };

            var onEnd = function(e) {console.log("end.zwipe");
                var i;
                var $instance = $(this);
                var pos = parseInt( _evtData["trans"+settings.axis+"0"], 10)+_evtData["delta"+settings.axis];

                // surpased minimum Distance, change slide
                if( Math.abs(_evtData["delta"+settings.axis]) > settings.minDist) {
                    // one by one
                    if( settings.advanceOne ) {
                        if( _evtData.increases ) {
                            methods.goBy(1, $this);
                        }
                        else {
                            methods.goBy(-1, $this);
                        }
                    }
                    // allow zwipping multiple slides
                    // active: middle distance of previous slide + 1px in viewport
                    else {
                        i = settings.positions.map(function(val, key){
                            return val + (settings.sizes[key] / 2) < pos;
                        }).indexOf(true);
                        methods.goTo(i, $this);
                    }
                }
                // did not surpase minimum Distance, if snap, reset slide position
                else if (settings.snap){
                    methods.goTo(settings.active, $this);
                }

                // end callback
                settings.zwipeEndCallback( $instance, _evtData, settings );

                // remove class
                $instance.removeClass(settings.animatingClass);

                // remove move/end listening until start triggered again
                $instance.off(moveEvt, onMove);
                $instance.off(endEvt, onEnd);

                /* clean memory */
                $instance = touches = moves = stdEvt = id = null;
                _evtData = {};
            };

            var onDestroy = function(e) {console.log("destroy.zwipe");
                // stop listening to events
                $this.off('.zwipe');

                // remove associated action links
                $outer.find( "."+settings.bulletBoxClass ).remove();
                $outer.find( "."+settings.arrowBoxClass ).remove();

                // clean vars and objects
                $this.data("opts", null);
                $this = $wrapper = $outer = $items = null;
            }

            /* listen for start event */
            $this.on(startEvt, onStart);

            /* listen for start event */
            $this.on('destroy.zwipe', onDestroy);
        },

        goTo : function (toIndex, $this) {console.log("goto.zwipe");
            var zList = $this || $(this);
            var opts = zList.data("opts");
            var toPos, $bullets, $wrapper, $outer;

            // move only if inside valid range
            if(toIndex >= opts.count || toIndex < 0) { return; }

            // cache expensive data
            $wrapper = zList.parent();
            $outer = $wrapper.parent();
            var wDim = zList.parent()[opts.sizeDim]();
            var $items = zList.find( opts.childrenSelector );
            var $item = $items.eq(toIndex);
            var iDim = $item[opts.sizeDim]();
            var iPos = $item.position()[opts.dir];

            // update active classes
            $items.removeClass( opts.activeClass );
            $item.addClass( opts.activeClass );

            // update bullets, if any
            if( opts.bulletable ){
                $bullets = $outer.find( "."+opts.bulletClass );
                $bullets.removeClass( opts.activeClass );
                $bullets.eq(toIndex).addClass( opts.activeClass );
            }

            // calculate new position
            toPos = iPos * -1;
            if (opts.centered && opts.sizes[toIndex] < wDim ) {
                toPos = toPos + ((wDim - iDim) / 2);
            }

            // reposition (will animate using CSS transition)
            if(opts.transformable) {
                zList.css(opts.supportedTransform, "translate"+opts.axis+"(" + toPos + "px)");
            }
            else {
                zList.css(opts.dir, toPos + 'px');
            }

            // update active item
            opts.active = toIndex;

            // goTo callback
            opts.goToCallback( zList, opts );
        },

        goBy : function ( dir, $this ) {
            var zList = $this || $(this);
            var opts = zList.data("opts");

            if(dir < 0 && opts.active > 0) {
                methods.goTo(parseInt(opts.active - 1), zList);
            }
            else if(dir > 0 && opts.active < opts.count - 1) {
                methods.goTo(parseInt(opts.active + 1), zList);
            }
            else if (opts.snap){
                methods.goTo(opts.active, zList);
            }
        },

        destroy : function ( $this ) {
            var zList = $this || $(this);

            zList.trigger("destroy.zwipe");
        }
    };

    $.fn.zwipe = function( method ) {
        if ( methods[method] ) {
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        }
        else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        }
        else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.zwipe' );
        }
    };

})(jQuery);