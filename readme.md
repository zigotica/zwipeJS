#zwipeJS
##Tiny jQuery slider with hardware accelerated CSS transitions

zwipeJS is a very small javascript slider (~3Kb compressed, source ~450LOC). It extends jQuery as a plugin, and uses touch events when available, resorting to mouse events otherwise. It avoids flickering by using CSS transforms where available, and scroll positions in older browsers. This means it can be used in most situations and devices. Pointer events will be added in the future.

###Configuration
####Simple markup

You can use any markup elements you want, you simply define the selectors you want to use in settings:

```
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
```

Please note a minimum of two parent elements are needed for the block containing the individual slides. See detailed examples below.

####Snap, centering, number of slides advancing…

You can customise some key properties in settings:

```
minDist : 50,       // if moved distance smaller than minDist we do not change slide
snap : true,        // true: snap to wrapper onEnd, false: do not snap
advanceOne : false, // false: go to closest onEnd (based on half slides), false: only one
centered: false,    // true: center item in wrapper when active, false: set on edge
silent : false,     // false: update position while zwipping, true: do not update
```

Please note there is no Loop behaviour at the moment.


####Optional navigation

Also define if you want to show bullet / arrow navigation

```
bulletable : true,  // true: use bullets for navigation, false: do not use
arrowable : true,   // true: use arrows for navigation, false: do not use
```

####Avoid when triggering actionable elements

Since you can have any type of HTML inside your slides, even actionable elements, you might want to exclude these from triggering zwipe using the given properties in settings:

```
avoidEls : ['A','BUTTON', 'INPUT'],
avoidCls : ['dontzwipe'],
```

####Custom callbacks

You can also define custom callbacks for start / move / end / goTo methods:

```
// customisable callbacks
zwipeStartCallback: function ( obj, data, opts ) { },
zwipeMoveCallback: function ( obj, data, opts ) { },
zwipeEndCallback: function ( obj, data, opts ) { },
goToCallback: function ( obj, opts ) { }
```


###Demos

See [working demo of zwipeJS](http://zigotica.github.io/zwipeJS/)


###Contributions

Please contribute to [zwipeJS github repo](http://www.github.com/zigotica/zwipeJS/)

###License

zwipeJS is licensed under [FreeBSD](http://www.github.com/zigotica/zwipeJS/blob/master/license.txt). Both project and documentation site created by [zigotica](http://www.zigotica.com).
