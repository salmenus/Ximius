/* 
 * The XIMIS animation framework
 * Salmen Hichri, march 2011
 */
var Xim={about:"Ximius animation API, version 0.1"};

/* Ximius namespaces */
Xim.Shapes={}; // The drawable forms

/* The gradient orientations constants */
Xim.HORIZONTAL_GRADIENT=2001;
Xim.VERTICAL_GRADIENT=2002;

/* The color management package */
Xim.Style={
	// The possible color types in Ximius
	SIMPLE_FILL:1001,			/* A unique color */		
	TRANSPARENT_FILL:1002,	/* A unique transparent color */
	GRADIENT_FILL:1003,		/* A gradient color that could be transparent */
	
	/* Check is color HEX color */
	isColor:function(color)
	{ return typeof(color)==="string" && color!==""; },
	
	/* Check config form simple color */
	isSimpleFill:function(config /* required */)
	{ return Xim.Style.isColor(config) || (typeof(config)==="object" && Xim.Style.isColor(config.color) && typeof(config.opacity)!=="number"); },
	
	/* Check config for transparent color */
	isTransparentFill:function(config /* required */)
	{ return typeof(config)==="object" && Xim.Style.isColor(config.color) && typeof(config.opacity)==="number" && config.opacity!==null && config.opacity!==1; },
	
	/* Check config for gradient color */
	isGradientFill:function(config /* required */)
	{ return  typeof(config)==="object" && !Xim.Style.isSimpleFill(config) && !Xim.Style.isTransparentFill(config) && config.gradient===true && typeof(config.from)!=="undefined" && typeof(config.to)!=="undefined"
	&& (Xim.Style.isSimpleFill(config.from) || Xim.Style.isTransparentFill(config.from)) && (Xim.Style.isSimpleFill(config.to) || Xim.Style.isTransparentFill(config.to)); },

	/* Check if the config is a fill style */
	isFill:function(config /* required */)
	{ return Xim.Style.isSimpleFill(config) || Xim.Style.isTransparentFill(config) || Xim.Style.isGradientFill(config); },
	
	/* Check if the config is a stroke style */
	isStroke:function(config /* required */)
	{ return (Xim.Style.isSimpleFill(config) || Xim.Style.isTransparentFill(config) || Xim.Style.isGradientFill(config)) && (typeof(config.size)==="undefined" || typeof(config.size)==="number")  ; },

	/* Check direction for gradient */
	isGradientDirection:function(direction)
	{ return typeof(direction)==="number" && (direction===Xim.HORIZONTAL_GRADIENT || direction===Xim.VERTICAL_GRADIENT); }
};

/* A fill style in Ximius */
Xim.Style.Color=function(config /* required */) 
{
	var fillType;
	var color;
	var opacity;
	
	var gradient;
	var direction;
	var fromColor;
	var toColor;
	var dir=null;
	
	// Check and initialize config
	if(typeof(config)==="undefined" || config===null || (typeof(config)!=="object" && typeof(config)!=="string"))
	{ throw "Xim.Style.Color : Color config is required [Color config should be a string value or a Xim color descriptor] [more details about this error on http://ximi.us/api/colors]"; }
	
	// Identify fill color type
	if(Xim.Style.isSimpleFill(config))
	{
		fillType=Xim.Style.SIMPLE_FILL;
		if(typeof(config)==="string") {color=config;} else {color=config.color;}
	}
	else
	{
		if(Xim.Style.isTransparentFill(config))
		{
			fillType=Xim.Style.TRANSPARENT_FILL;
			color=config.color;
			opacity=config.opacity;
		}
		else
		{
			if(Xim.Style.isGradientFill(config))
			{
				fillType=Xim.Style.GRADIENT_FILL;
				gradient=true;
				fromColor=config.from;
				toColor=config.to;
				
				if(typeof(config.direction)==="number" && Xim.Style.isGradientDirection(config.direction)) 
				{ dir=config.direction; }
			}
			else
			{ throw "Xim.Style.Color : Unidentifiable fill style configuration [Fill style should be a simple color, transparent color, or a gradient] [more details about this error on http://ximi.us/api/fill-styles]"; }
		}
	}
	
	/* Apply a fill tyle to a stroke or fill */
	var applyStyle=function(onStroke, context, xPos, yPos, width, height)
	{
		if(typeof(context)==="undefined" || context===null || !(context instanceof CanvasRenderingContext2D))
		{ throw "Xim.Style.Color.applyToFill() : Wrong parameter type [\"context\" should be an instance of \"CanvasRenderingContext2D\"] [more details about this error on http://ximi.us/api/fill-styles]"; }
		
		if(fillType===Xim.Style.GRADIENT_FILL && (typeof(xPos)!=="number" || typeof(yPos)!=="number" || typeof(width)!=="number" || typeof(height)!=="number"))
		{ throw "Xim.Style.Color.applyToFill() : Missing parameters [In order to apply a gradient filling, gradient start and end points should be specified] [more details about this error on http://ximi.us/api/fill-styles]"; }
		
		if(fillType===Xim.Style.GRADIENT_FILL && dir===null)
		{ throw "Xim.Style.Color.applyToFill() : For gradient fills, gradient direction should be specified [more details about this error on http://ximi.us/api/fill-styles]"; }
		
		// Simple color
		var finalStyle;
		var finalOpacity;
		
		switch(fillType)
		{
			case Xim.Style.SIMPLE_FILL:
				finalStyle=color;
				finalOpacity=1;
			break;
			
			case Xim.Style.TRANSPARENT_FILL:
				finalOpacity=opacity;
				finalStyle=color;
			break;
			
			case Xim.Style.GRADIENT_FILL:
				var xEnd, yEnd;
				
				if(dir===Xim.HORIZONTAL_GRADIENT)
				{ xEnd=xPos+width; yEnd=yPos; }
				else
				{ xEnd=xPos; yEnd=yPos+height; }
				
				var lingrad=context.createLinearGradient(xPos, yPos, xEnd, yEnd);
				lingrad.addColorStop(0, fromColor);
				lingrad.addColorStop(1, toColor);
				
				finalOpacity=1;
				finalStyle=lingrad;
			break;
		}
		
		// Apply style on stroke or fill
		context.globalAlpha=finalOpacity;
		
		if(onStroke)
		{ context.strokeStyle=finalStyle; }
		else
		{ context.fillStyle=finalStyle; }
	};
	
	/* @public */
	this.type=fillType;
	
	/* @public */
	this.applyToFill=function(context /* required */, xPos /* optional */, yPos /* optional */, width /* optional */, height /* optional */)
	{ applyStyle(false, context, xPos, yPos, width, height); };
	
	this.applyToStroke=function(context /* required */, xPos /* optional */, yPos /* optional */, width /* optional */, height /* optional */)
	{ applyStyle(true, context, xPos, yPos, width, height); };
};

/* A drawing */
Xim.Layer=function(width /* required */, height /* required */, config /* optional */)
{
	if(typeof(config)!=="object") { config={}; }
	
	// Check requited paramaters
	if(typeof(width)==="undefined" || typeof(height)==="undefined")
	{ throw "Xim.Layer : Missing required constructor paramters [more details about this error on http://ximi.us/api/drawing]"; }
	
	if(width===null || isNaN(width) || height===null || isNaN(height))
	{ throw "Xim.Layer : Wrong constructor parameter types [more details about this error on http://ximi.us/api/drawing]"; }
	
	var id=null;
	var objects=[];
	
	
	if(typeof(config.id)==="string" && config.id!=="") { id=config.id; }
	
	/* @public | Add an object to the drawing */
	this.add=function()
	{
		var it;
		for(it=0;it<arguments.length;it++)
		{
			var ximObj=arguments[it];
			
			if(!ximObj.isDrawable)
			{ throw "Xim.Layer : Wrong parameter type [Only \"Xim.Drawable\" objects could be added to a drawing] [more details about this error on http://ximi.us/api/drawing]"; }
			
			objects[objects.length]=ximObj;
		}
	};
	
	/* @public | Remove objects from the drawing */
	this.remove=function(ximObj /* required */)
	{
		if(typeof(ximObj)!=="object" || ximObj===null) {return;}
		
		var i;
		for(i=0;i<objects.length;i++) 
		{ if(objects[i]===ximObj) {objects.splice(i, 1);} }
	};
	
	/* @public | Check if an object is in the layer or not */
	this.contains=function(ximObj /* required */)
	{
		if(typeof(ximObj)!=="object" || ximObj===null) {return false;}
		
		var i;
		for(i in objects) {
			if(objects[i]===ximObj) {return true;}
		}
		return false;
	};
	
	/* @public */
	this.id=id;
	this.width=width;
	this.height=height;
	this.objects=objects;
};

/* Drawable object */
Xim.Drawable=/* @abstract */ function(x /* required */, y /* required */, width /* optional */, height /* optional */, config /* optional */)
{
	if(typeof(x)==="undefined" || typeof(y)==="undefined")
	{ throw "Xim.Drawable : Missing constructor required paramters [more details about this error on http://ximi.us/api/drawing]"; }
	
	if(x===null || isNaN(x) || y===null || isNaN(y))
	{ throw "Xim.Drawable : Wrong constructor parameter types [more details about this error on http://ximi.us/api/drawing]"; }
	
	var clazz=this;
	
	var initializer={};
	if(typeof(config)!=="object" || config===null || config.constructor!=={}.constructor) { config={}; }
	
	if(width===null || isNaN(width)) { initializer.width=0; } else { initializer.width=width; }
	if(height===null || isNaN(height)) { initializer.height=0; } else { initializer.height=height; }
	
	if(Xim.Style.isFill(config.background)) { initializer.background=config.background; } else { initializer.background=null; }
	if(Xim.Style.isStroke(config.stroke)) { initializer.stroke=config.stroke; } else { initializer.stroke=null; }

	// Initialize object ID
	if(typeof(config.id)==="string" && config.id!=="") { initializer.id=config.id; } else { initializer.id=null; }
	
	// Initialize rotation
	if(!isNaN(config.rotation)) { initializer.rotation=config.rotation; } else { initializer.rotation=0; }
	
	// Calculate line width from stroke
	if(typeof(initializer.stroke)==="object" && initializer.stroke!==null && typeof(initializer.stroke.size)==="number")
	{initializer.lineWidth=config.stroke.size;} else {initializer.lineWidth=1;}
	
	/* @public | required members */
	this.isDrawable=true;
	this.x=x;
	this.y=y;
	
	/* @public | optional config */
	this.id=initializer.id;
	
	this.width=initializer.width;
	this.height=initializer.height;
	this.rotation=initializer.rotation;
	
	this.background=initializer.background;
	this.stroke=initializer.stroke;
	this.lineWidth=initializer.lineWidth;
	
	/* @abstract @protected | Draw a object in the canvas context */
	this.__drawInContext=function(context /* required */) 
	{ throw "Xim.Drawable.__drawInContext() : Call to abstract function [This function should be called from an implementation of the abstract class \"Xim.Drawable\"] [more details about this error on http://ximi.us/api/drawing]"; };

	/* @protect | Initialize context */
	this.__initContext=function(context /* required */)
	{
		context.translate(clazz.x+clazz.width/2, clazz.y+clazz.height/2);
		if(clazz.rotation!==null && clazz.rotation!==0)
		{
			var alpha=clazz.rotation*Math.PI/180;
			context.rotate(alpha);
		}
	};
	
	// This will will limit access to the public members from instance to force inheritance
	return { isAbstract:true };
};

/* Rectangle */
Xim.Shapes.Rectangle=function(x /* required */, y /* required */, width /* required */, height /* required */, config /* optional */)
{
	// Inherit from Xim.Drawable
	Xim.Drawable.call(this, x, y, width, height, config);
	
	var clazz=this;
	
	// Check required parameters
	if(typeof(width)==="undefined" || typeof(height)==="undefined")
	{ throw "Xim.Rectangle : Missing required constructor paramters [more details about this error on http://ximi.us/api/forms]"; }
	
	// Check param types
	if(width===null || isNaN(width) || height===null || isNaN(height))
	{ throw "Xim.Rectangle : Wrong constructor parameter types [more details about this error on http://ximi.us/api/forms]"; }
	
	/* @protected | Draw the rectangle in the specified context */
	this.__drawInContext=function(context /* required */)
	{
		if(typeof(context)==="undefined" || context===null || !(context instanceof CanvasRenderingContext2D))
		{ throw "Xim.Rectangle.draw() : Wrong parameter type [\"context\" should be an instance of \"CanvasRenderingContext2D\"] [more details about this error on http://ximi.us/api/forms]"; }
		
		context.save();
		clazz.__initContext(context);
		
		var startX=-clazz.width/2;
		var startY=-clazz.height/2;
		
		
		if(clazz.background!==null)
		{
			var fillStyle=new Xim.Style.Color(clazz.background);
			fillStyle.applyToFill(context,startX, startY, clazz.width, clazz.height);
			context.fillRect(startX, startY, clazz.width, clazz.height);
		}
		
		if(clazz.stroke!==null)
		{
			var strokeStyle=new Xim.Style.Color(clazz.stroke);
			strokeStyle.applyToStroke(context,startX, startY, clazz.width, clazz.height);
			context.lineWidth=clazz.lineWidth;
			context.strokeRect(startX, startY, clazz.width, clazz.height);
		}
		
		context.restore();
	};
};

/* Image */
Xim.Image=function(url /* required */, x/* required */, y /* required */, config /* optional */)
{
	// Inherit from Xim.Drawable
	if(typeof(config)!=="object" || config===null) { config={}; }
	Xim.Drawable.call(this, x, y, config.width, config.height, config);

	var clazz=this;
	var initializer={};
	
	// Check required parameters
	if(typeof(url)==="undefined")
	{ throw "Xim.Image : Missing required constructor paramter \"url\" [more details about this error on http://ximi.us/api/image]"; }
	
	// Check param types
	if(typeof(url)!=="string" || url==="")
	{ throw "Xim.Image : Wrong constructor parameter types [more details about this error on http://ximi.us/api/image]"; }
	
	// Initialize config function
	if(config.width!==null && !isNaN(config.width)) { initializer.width=config.width; } else { initializer.width=null; }
	if(config.height!==null && !isNaN(config.height)) { initializer.height=config.height; } else { initializer.height=null; }
	if(config.opacity!==null && !isNaN(config.opacity)) { initializer.opacity=config.opacity; } else { initializer.opacity=1; }
	
	/* @public */
	this.url=url;
	this.width=initializer.width;
	this.height=initializer.height;
	this.opacity=initializer.opacity;
	
	/* Load image */
	var canDraw=false;
	var drawAfterLoading=false;
	var drawingContext=null;
	var img=new Image();
	
	img.src=clazz.url;
	img.onload=function()
	{
		canDraw=true;
		if(drawAfterLoading)
		{
			clazz.__drawInContext(drawingContext);
			drawingContext=null;
		}
	};
	
	/* @protected | Draw the image on the canvas */
	this.__drawInContext=function(context /* required */)
	{
		if(typeof(context)==="undefined" || context===null || !(context instanceof CanvasRenderingContext2D))
		{ throw "Xim.Rectangle.draw() : Wrong parameter type [\"context\" should be an instance of \"CanvasRenderingContext2D\"] [more details about this error on http://ximi.us/api/forms]"; }

		// Draw image and stroke
		if(!canDraw)
		{
			drawAfterLoading=true;
			drawingContext=context;
		}
		else
		{
			if(clazz.width===null) {clazz.width=img.width;}
			if(clazz.height===null) {clazz.height=img.height;}
			
			var startX=-clazz.width/2;
			var startY=-clazz.height/2;
			
			context.save();
			clazz.__initContext(context);
			
			// Image
			context.globalAlpha=clazz.opacity;
			context.drawImage(img, startX, startY, clazz.width, clazz.height);
			
			// Stroke
			if(clazz.stroke!==null)
			{
				var strokeStyle=new Xim.Style.Color(clazz.stroke);
				strokeStyle.applyToStroke(context,startX, startY, clazz.width, clazz.height);
				context.lineWidth=clazz.lineWidth;
				context.strokeRect(startX, startY, clazz.width, clazz.height);
			}
			
			context.restore();
		}
	};
};

/* Drawing canvas */
Xim.Canvas=function(canvasId /* required */, config /* optional */)
{
	// Check required parameters
	if(typeof(canvasId)==="undefined")
	{ throw "Xim.LayerArea : Missing required constructor paramter [\"canvasId\" is needed] [more details about this error on http://ximi.us/api/drawing]"; }
	
	// Check param types
	if(typeof(canvasId)!=="string" || canvasId==="")
	{ throw "Xim.LayerArea : Wrong constructor parameter type [\"canvasId\" should be a nonempty string] [more details about this error on http://ximi.us/api/drawing]"; }
	
	/* @public | Assign a canvas */
	this.setCanvasId=function(pramCanvasId)
	{
		if(typeof(pramCanvasId)!=="string" || pramCanvasId==="")
		{ throw "Xim.LayerArea.setCanvas() : Wrong parameter type [\"canvasId\" should be a nonempty string] [more details about this error on http://ximi.us/api/drawing]"; }
		
		var canvasObj=document.getElementById(pramCanvasId);
		if(typeof(canvasObj)!=="object" || canvasObj===null ||canvasObj.tagName.toUpperCase()!=="CANVAS")
		{ throw "Xim.LayerArea.setCanvas() : Drawing area is not found or is not a canvas [more details about this error on http://ximi.us/api/drawing]"; }
		
		canvasId=pramCanvasId;
	};
	
	/* @public | Return the canvas ID */
	this.getCanvasId=function()
	{
		return canvasId;
	};
	
	this.setCanvasId(canvasId);
	
	/* @public | Transform a Xim.Layer to a visual image */
	this.draw=function(aDrawing)
	{
		if(typeof(aDrawing)!=="object" || aDrawing===null)
		{ throw "Xim.LayerArea.draw() : Missing required paramter [\"drawing\" is needed] [more details about this error on http://ximi.us/api/drawing]"; }
		
		if(!(aDrawing instanceof Xim.Layer))
		{ throw "Xim.LayerArea.draw() : Wrong parameter type [\"drawing\" should be a \"Xim.Layer\" instance] [more details about this error on http://ximi.us/api/drawing]"; }
		
		var canvas=document.getElementById(canvasId);
		var context=canvas.getContext("2d");
		var it;
		
		for(it=0;it<aDrawing.objects.length;it++)
		{ aDrawing.objects[it].__drawInContext(context); }
	};
	
	/* @public | Clear the drawing area */
	this.clear=function()
	{
		var canvas=document.getElementById(canvasId);
		var context=canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
	};
};

/* Animation namespace */
Xim.Animation={};

/* Global animation constants */
Xim.Animation.NB_IMAGES_PER_SECOND=72;
Xim.Animation.UNIT_TIME=1000/Xim.Animation.NB_IMAGES_PER_SECOND;
Xim.Animation.PARAMETERS=["x", "y", "rotation", "width", "height", "opacity"];

/* Global animation variables */
Xim.Animation.CurrentScenes=[];

/* Animate an object */
Xim.animate=function(sceneId /* required */)
{
	var scene=Xim.Animation.CurrentScenes[sceneId];
	if(scene===null) { throw "Xim.animate : Wrong constructor parameter value [Parameter \"sceneId\" don't match any scene] [more details about this error on http://ximi.us/api/animation]";  }
	
	if(!scene.playing)
	{
		clearInterval(scene.__interval);
		scene.__interval=null;
		Xim.Animation.CurrentScenes[sceneId]=null;
		return;
	}
	
	if(scene.__isFinish())
	{
		if(scene.repeat)
		{
			scene.reset();
			scene.play();
		}
		else
		{
			scene.end();
			scene.playing=false;
			clearInterval(scene.__interval);
			scene.__interval=null;
			Xim.Animation.CurrentScenes[sceneId]=null;
		}
	}
	else
	{
		scene.__next();	
		scene.__drawCurrentImage();
	}
};

/* An animation scene */
Xim.Scene=function(layer /* required */, canvas /* required */, animTime /* required */, config /* optional */)
{
	if(!(layer instanceof Xim.Layer) || !(canvas instanceof Xim.Canvas) || typeof(animTime)!=="number")
	{ throw "Xim.Scene : Wrong constructor parameter types [more details about this error on http://ximi.us/api/animation]"; }
	
	if(animTime<=0)
	{ throw "Xim.Scene : Wrong constructor parameter value [Parameter \"animTime\" should be a positive number] [more details about this error on http://ximi.us/api/animation]"; }
	
	if(typeof(config)!=="object" || config===null) { config={}; }
	
	var scene=this;
	
	/* @public | Public scene properties */
	this.duration=animTime;
	this.nbSteps=Math.floor((animTime*Xim.Animation.NB_IMAGES_PER_SECOND)/1000);
	this.currentStep=0;

	this.layer=layer;
	this.canvas=canvas;
	this.playing=false;
	this.repeat=false;
	
	/* Initialize the scene ID */
	var sceneId=(new Date()).getTime() + "x" + Math.floor(Math.random() * 1000);
	
	if(typeof(config.repeat)==="boolean")
	{ scene.repeat=config.repeat; }
	
	/* @protected | Used to save the scene objects */
	this.__interval=null;
	this.__objects=[];
	this.__animators=[];
	this.__initialStates=[];
	
	/* @protected | Used inside the framework to animate images */
	this.__drawCurrentImage=function()
	{
		scene.canvas.clear();
		scene.canvas.draw(scene.layer);
	};
	
	/* @protected | Unsed inside the framework to move objects to the next step of the animation */
	this.__next=function()
	{
		var i;
		for(i=0; i<scene.__animators.length; i++) { scene.__animators[i].__next(); }
		scene.currentStep++;
	};
	
	/* @protected | Used inside the framework to check if the animation is ended or not */
	this.__isFinish=function()
	{ return scene.currentStep>=scene.nbSteps; };
	
	/* @public | animate an aboject */
	this.animate=function(obj /* required */, final /* required */, config /* optional */)
	{
		if(typeof(obj)!=="object" || !obj.isDrawable)
		{ throw "Xim.Scene.add() : Wrong parameter type [Only \"Xim.Drawable\" objects could be added to an scene] [more details about this error on http://ximi.us/api/animation]"; }
		
		if(!scene.layer.contains(obj)) 
		{ throw "Xim.Scene.add() : Object to don't belongs to layer [Can't add to the scene an object that don't belongs to one of its layers] [more details about this error on http://ximi.us/api/animation]"; }
		
		if(typeof(final)!=="object")
		{ throw "Xim.Animatin.add() : Wrong parameter type [Parameter \"final\" should be an object status descriptor] [more details about this error on http://ximi.us/api/animation]"; }
		
		var unit={};
		var initial={};
		var i;
		
		for(i in Xim.Animation.PARAMETERS)
		{
			// Save initial states and calculate unit steps
			var param=Xim.Animation.PARAMETERS[i];
			initial[param]=obj[param];
			
			if(typeof(final[param])==="number" && obj[param]!==final[param])
			{unit[param]=(final[param]-obj[param])/scene.nbSteps;}
			else
			{unit[param]=0; final[param]=obj[param];}
		}
		
		var index=scene.__objects.length;
		var animator=new Xim.Animator(index, scene, unit, final);
		
		scene.__objects[index]=obj;
		scene.__animators[index]=animator;
		scene.__initialStates[index]=initial;
	};
	
	/* @public | Start or resume playing the scene */
	this.play=function()
	{
		if(scene.playing===false)
		{
			scene.playing=true;
			Xim.Animation.CurrentScenes[sceneId]=scene;
			scene.__interval=setInterval("Xim.animate(\"" + sceneId + "\")", Xim.Animation.UNIT_TIME);
		}
	};
	
	/* @public | Stop playing scene temporary */
	this.pause=function() {scene.playing=false;};
	
	/* @public | Put an end to the scene */
	this.end=function()
	{
		var i;
		for(i=0; i<scene.__animators.length; i++)
		{ scene.__animators[i].__end(); }
		
		scene.playing=false;
		scene.currentStep=scene.nbSteps;
		clearInterval(scene.interval);
	};
	
	/* @public | Reset the scene to its initial state */
	this.reset=function()
	{
		if(scene.playing) {scene.pause();}
		var i, objIndex;
		
		for(objIndex in scene.__objects)
		{
			var obj=scene.__objects[objIndex];
			var initialState=scene.__initialStates[objIndex];
			
			for(i in Xim.Animation.PARAMETERS)
			{
				var param=Xim.Animation.PARAMETERS[i];
				if(typeof(initialState[param])!==null)
				{obj[param]=initialState[param];}
			}
		}
		
		
		clearInterval(scene.__interval);
		scene.__interval=null;
		scene.currentStep=0;
		scene.playing=false;
		scene.__drawCurrentImage();
		
		Xim.Animation.CurrentScenes[sceneId]=null;
	};
};

/* Animation information */
Xim.Animator=function(objIndex /* required */, scene /* required */, stepVectorParam /* required */, finalVectorParam /* required */)
{
	if(typeof(stepVectorParam)!=="object" || stepVectorParam===null || typeof(finalVectorParam)!=="object" || finalVectorParam===null)
	{ throw "Xim.Animator : Wrong constructor parameter types [Only animation vectors could used to animate an object] [more details about this error on http://ximi.us/api/animation]"; }
	
	var stepVector=stepVectorParam;
	var finalVector=finalVectorParam;
	
	/* @protected | Move object to next position */
	this.__next=function()
	{
		var i;
		for(i in Xim.Animation.PARAMETERS)
		{
			var param=Xim.Animation.PARAMETERS[i];
			scene.__objects[objIndex][param]+=stepVector[param];
		}
	};
	
	/* @protected | Set final position */
	this.__end=function()
	{
		var i;
		for(i in Xim.Animation.PARAMETERS)
		{
			var param=Xim.Animation.PARAMETERS[i];
			scene.__objects[objIndex][param]=finalVector[param];
		}
	};
};
