/* 
 * The Ximius animation framework
 * Salmen Hichri, May 2011
 * http://www.ximius.org
 */

var Xim = 
{
	version: "Ximius version 0.2"
};

/* Ximius packages */
Xim.Drawing = {};

/* The color management package */
Xim.Style = 
{
	/* The possible color types in Ximius */
	SIMPLE_FILL: 1001, /* A unique color */
	TRANSPARENT_FILL: 1002, /* A unique transparent color */
	GRADIENT_FILL: 1003, /* A gradient color that could be transparent */
	
	/* The gradient orientations constants */
	HORIZONTAL_GRADIENT: 2001,
	VERTICAL_GRADIENT: 2002,
	
	/* Check is color HEX color */
	isColor: function(color)
	{
		return typeof(color) === "string" && color !== "";
	},
	
	/* Check config form simple color */
	isSimpleFill: function(config /* required */)
	{
		return Xim.Style.isColor(config) || (typeof(config) === "object" && Xim.Style.isColor(config.color) && typeof(config.opacity) !== "number");
	},
	
	/* Check config for transparent color */
	isTransparentFill: function(config /* required */)
	{
		return typeof(config) === "object" && Xim.Style.isColor(config.color) && typeof(config.opacity) === "number" && config.opacity !== null && config.opacity !== 1;
	},
	
	/* Check config for gradient color */
	isGradientFill: function(config /* required */)
	{
		return typeof(config) === "object" && !Xim.Style.isSimpleFill(config) && !Xim.Style.isTransparentFill(config) && config.gradient === true && typeof(config.from) !== "undefined" && typeof(config.to) !== "undefined" &&
		(Xim.Style.isSimpleFill(config.from) || Xim.Style.isTransparentFill(config.from)) &&
		(Xim.Style.isSimpleFill(config.to) || Xim.Style.isTransparentFill(config.to));
	},
	
	/* Check if the config is a fill style */
	isFill: function(config /* required */)
	{
		return Xim.Style.isSimpleFill(config) || Xim.Style.isTransparentFill(config) || Xim.Style.isGradientFill(config);
	},
	
	/* Check if the config is a stroke style */
	isStroke: function(config /* required */)
	{
		return (Xim.Style.isSimpleFill(config) || Xim.Style.isTransparentFill(config) || Xim.Style.isGradientFill(config)) && (typeof(config.size) === "undefined" || typeof(config.size) === "number");
	},
	
	/* Check direction for gradient */
	isGradientDirection: function(direction)
	{
		return typeof(direction) === "number" && (direction === Xim.Style.HORIZONTAL_GRADIENT || direction === Xim.Style.VERTICAL_GRADIENT);
	}
};

/* A fill style in Ximius */
Xim.Style.Color = function(config /* required */)
{
	var fillType;
	var color;
	var opacity;
	
	var gradient;
	var direction;
	var fromColor;
	var toColor;
	var dir = null;
	
	// Check and initialize config
	if (typeof(config) === "undefined" || config === null || (typeof(config) !== "object" && typeof(config) !== "string")) 
	{
		throw "Xim.Style.Color : Color config is required [Color config should be a string value or a Xim color descriptor] [more details about this error on http://ww.ximius.org/api/colors]";
	}
	
	// Identify fill color type
	if (Xim.Style.isSimpleFill(config)) 
	{
		fillType = Xim.Style.SIMPLE_FILL;
		if (typeof(config) === "string") 
		{
			color = config;
		}
		else 
		{
			color = config.color;
		}
	}
	else 
	{
		if (Xim.Style.isTransparentFill(config)) 
		{
			fillType = Xim.Style.TRANSPARENT_FILL;
			color = config.color;
			opacity = config.opacity;
		}
		else 
		{
			if (Xim.Style.isGradientFill(config)) 
			{
				fillType = Xim.Style.GRADIENT_FILL;
				gradient = true;
				fromColor = config.from;
				toColor = config.to;
				
				if (typeof(config.direction) === "number" && Xim.Style.isGradientDirection(config.direction)) 
				{
					dir = config.direction;
				}
			}
			else 
			{
				throw "Xim.Style.Color : Unidentifiable fill style configuration [Fill style should be a simple color, transparent color, or a gradient] [more details about this error on http://www.ximius.org/api/fill-styles]";
			}
		}
	}
	
	/* Apply a fill tyle to a stroke or fill */
	var applyStyle = function(onStroke, context, xPos, yPos, width, height)
	{
		if (typeof(context) === "undefined" || context === null || !(context instanceof CanvasRenderingContext2D)) 
		{
			throw "Xim.Style.Color.applyToFill() : Wrong parameter type [\"context\" should be an instance of \"CanvasRenderingContext2D\"] [more details about this error on http://www.ximius.org/api/fill-styles]";
		}
		
		if (fillType === Xim.Style.GRADIENT_FILL && (typeof(xPos) !== "number" || typeof(yPos) !== "number" || typeof(width) !== "number" || typeof(height) !== "number")) 
		{
			throw "Xim.Style.Color.applyToFill() : Missing parameters [In order to apply a gradient filling, gradient start and end points should be specified] [more details about this error on http://www.ximius.org/api/fill-styles]";
		}
		
		if (fillType === Xim.Style.GRADIENT_FILL && dir === null) 
		{
			throw "Xim.Style.Color.applyToFill() : For gradient fills, gradient direction should be specified [more details about this error on http://www.ximius.org/api/fill-styles]";
		}
		
		// Simple color
		var finalStyle;
		var finalOpacity;
		
		if(isNaN(context.globalAlpha) || context.globalAlpha > 1) 
		{
			context.globalAlpha = 1;
		}
		
		if(context.globalAlpha < 0) 
		{
			context.globalAlpha = 0;
		}
		
		switch (fillType)
		{
			case Xim.Style.SIMPLE_FILL:
				finalStyle = color;
				finalOpacity = 1;
				break;
				
			case Xim.Style.TRANSPARENT_FILL:
				finalOpacity = opacity;
				finalStyle = color;
				break;
				
			case Xim.Style.GRADIENT_FILL:
				var xEnd, yEnd;
				
				if (dir === Xim.Style.HORIZONTAL_GRADIENT) 
				{
					xEnd = xPos + width;
					yEnd = yPos;
				}
				else 
				{
					xEnd = xPos;
					yEnd = yPos + height;
				}
				
				var lingrad = context.createLinearGradient(xPos, yPos, xEnd, yEnd);
				lingrad.addColorStop(0, fromColor);
				lingrad.addColorStop(1, toColor);
				
				finalOpacity = 1;
				finalStyle = lingrad;
				break;
		}
		
		// Apply style on stroke or fill
		context.globalAlpha *= finalOpacity;
		
		if (onStroke) 
		{
			context.strokeStyle = finalStyle;
		}
		else 
		{
			context.fillStyle = finalStyle;
		}
	};
	
	/* @public */
	this.type = fillType;
	
	/* @public */
	this.applyToFill = function(context /* required */, xPos /* optional */, yPos /* optional */, width /* optional */, height /* optional */)
	{
		applyStyle(false, context, xPos, yPos, width, height);
	};
	
	/* @public */
	this.applyToStroke = function(context /* required */, xPos /* optional */, yPos /* optional */, width /* optional */, height /* optional */)
	{
		applyStyle(true, context, xPos, yPos, width, height);
	};
};

/* A drawing */
Xim.Layer = function(width /* required */, height /* required */, config /* optional */)
{
	if (typeof(config) !== "object") 
	{
		config = {};
	}
	
	// Check requited paramaters
	if (typeof(width) === "undefined" || typeof(height) === "undefined") 
	{
		throw "Xim.Layer : Missing required constructor paramters [more details about this error on http://www.ximius.org/api/drawing]";
	}
	
	if (width === null || isNaN(width) || height === null || isNaN(height)) 
	{
		throw "Xim.Layer : Wrong constructor parameter types [more details about this error on http://www.ximius.org/api/drawing]";
	}
	
	var id = null;
	var objects = [];
	
	
	if (typeof(config.id) === "string" && config.id !== "") 
	{
		id = config.id;
	}
	
	/* @public | Add an object to the drawing */
	this.add = function()
	{
		var it;
		for (it = 0; it < arguments.length; it++) 
		{
			var ximObj = arguments[it];
			
			if (!ximObj.isDrawable) 
			{
				throw "Xim.Layer : Wrong parameter type [Only \"Xim.Drawing.Drawable\" objects could be added to a drawing] [more details about this error on http://www.ximius.org/api/drawing]";
			}
			
			objects[objects.length] = ximObj;
		}
	};
	
	/* @public | Remove objects from the drawing */
	this.remove = function(ximObj /* required */)
	{
		if (typeof(ximObj) !== "object" || ximObj === null) 
		{
			return;
		}
		
		var i;
		for (i = 0; i < objects.length; i++) 
		{
			if (objects[i] === ximObj) 
			{
				objects.splice(i, 1);
			}
		}
	};
	
	/* @public | Check if an object is in the layer or not */
	this.contains = function(ximObj /* required */)
	{
		if (typeof(ximObj) !== "object" || ximObj === null) 
		{
			return false;
		}
		
		var i;
		for (i in objects) 
		{
			if (objects[i] === ximObj) 
			{
				return true;
			}
		}
		return false;
	};
	
	/* @public */
	this.id = id;
	this.width = width;
	this.height = height;
	this.objects = objects;
};

/* Drawable object */
Xim.Drawing.Drawable =/* @abstract */ function(x /* required */, y /* required */, width /* optional */, height /* optional */, config /* optional */)
{
	if (typeof(x) === "undefined" || typeof(y) === "undefined") 
	{
		throw "Xim.Drawing.Drawable : Missing constructor required paramters [more details about this error on http://www.ximius.org/api/drawing]";
	}
	
	if (x === null || isNaN(x) || y === null || isNaN(y)) 
	{
		throw "Xim.Drawing.Drawable : Wrong constructor parameter types [more details about this error on http://www.ximius.org/api/drawing]";
	}
	
	var clazz = this;
	
	var initializer = {};
	if (typeof(config) !== "object" || config === null || config.constructor !== {}.constructor) 
	{
		config = {};
	}
	
	if (width === null || isNaN(width)) 
	{
		initializer.width = 0;
	}
	else 
	{
		initializer.width = width;
	}
	
	if (height === null || isNaN(height)) 
	{
		initializer.height = 0;
	}
	else 
	{
		initializer.height = height;
	}
	
	if (Xim.Style.isFill(config.background)) 
	{
		initializer.background = config.background;
	}
	else 
	{
		initializer.background = null;
	}
	if (Xim.Style.isStroke(config.stroke)) 
	{
		initializer.stroke = config.stroke;
	}
	else 
	{
		initializer.stroke = null;
	}
	
	// Initialize object ID
	if (typeof(config.id) === "string" && config.id !== "") 
	{
		initializer.id = config.id;
	}
	else 
	{
		initializer.id = null;
	}
	
	// Initialize rotation
	if (!isNaN(config.rotation)) 
	{
		initializer.rotation = config.rotation;
	}
	else 
	{
		initializer.rotation = 0;
	}
	
	// Initialize opacity
	if (!isNaN(config.opacity) && config.opacity >= 0 && config.opacity <= 1) 
	{
		initializer.opacity = config.opacity;
	}
	else 
	{
		initializer.opacity = 1;
	}
	
	// Calculate line width from stroke
	if (typeof(initializer.stroke) === "object" && initializer.stroke !== null && typeof(initializer.stroke.size) === "number") 
	{
		initializer.lineWidth = config.stroke.size;
	}
	else 
	{
		initializer.lineWidth = 1;
	}
	
	/* @public | required members */
	this.isDrawable = true;
	
	this.x = x;
	this.y = y;
	this.width = initializer.width;
	this.height = initializer.height;
	this.rotation = initializer.rotation;
	this.opacity = initializer.opacity;
	
	/* @public | optional config */
	this.id = initializer.id;
	
	this.background = initializer.background;
	this.stroke = initializer.stroke;
	this.lineWidth = initializer.lineWidth;
	
	/* @protect | Unique ID */
	this.__id = "__." + (new Date()).getTime() + "." + Math.floor(Math.random() * 1000) + "." + Math.floor(Math.random() * 1000);
	
	/* @abstract @protected | Draw a object in the canvas context */
	this.__drawInContext = function(context /* required */)
	{
		throw "Xim.Drawing.Drawable.__drawInContext() : Call to abstract function [This function should be called from an implementation of the abstract class \"Xim.Drawing.Drawable\"] [more details about this error on http://www.ximius.org/api/drawing]";
	};
	
	/* @protect | Initialize context */
	this.__initContext = function(context /* required */)
	{
		context.translate(clazz.x + clazz.width / 2, clazz.y + clazz.height / 2);
		if (clazz.rotation !== null && clazz.rotation !== 0) 
		{
			var alpha = clazz.rotation * Math.PI / 180;
			context.rotate(alpha);
		}
	};
	
	// This will will limit access to the public members from instance to force inheritance
	return {
		isAbstract: true
	};
};

/* Rectangle */
Xim.Drawing.Rectangle = function(x /* required */, y /* required */, width /* required */, height /* required */, config /* optional */)
{
	// Inherit from Xim.Drawing.Drawable
	Xim.Drawing.Drawable.call(this, x, y, width, height, config);
	
	var clazz = this;
	
	// Check required parameters
	if (typeof(width) === "undefined" || typeof(height) === "undefined") 
	{
		throw "Xim.Drawing.Rectangle : Missing required constructor paramters [more details about this error on http://www.ximius.org/api/forms]";
	}
	
	// Check param types
	if (width === null || isNaN(width) || height === null || isNaN(height)) 
	{
		throw "Xim.Drawing.Rectangle : Wrong constructor parameter types [more details about this error on http://www.ximius.org/api/forms]";
	}
	
	/* @protected | Draw the rectangle in the specified context */
	this.__drawInContext = function(context /* required */)
	{
		if (typeof(context) === "undefined" || context === null || !(context instanceof CanvasRenderingContext2D)) 
		{
			throw "Xim.Drawing.Rectangle.draw() : Wrong parameter type [\"context\" should be an instance of \"CanvasRenderingContext2D\"] [more details about this error on http://www.ximius.org/api/forms]";
		}
		
		context.save();
		clazz.__initContext(context);
		
		var startX = -clazz.width / 2;
		var startY = -clazz.height / 2;
		
		// Fix Alpha
		if(clazz.opacity < 0) 
		{
			clazz.opacity = 0;
		}
		
		if(clazz.opacity > 1) 
		{
			clazz.opacity = 1;
		}
		
		context.globalAlpha = clazz.opacity;
		
		if (clazz.background !== null) 
		{
			var fillStyle = new Xim.Style.Color(clazz.background);
			fillStyle.applyToFill(context, startX, startY, clazz.width, clazz.height);
			context.fillRect(startX, startY, clazz.width, clazz.height);
		}
		
		if (clazz.stroke !== null) 
		{
			var strokeStyle = new Xim.Style.Color(clazz.stroke);
			strokeStyle.applyToStroke(context, startX, startY, clazz.width, clazz.height);
			context.lineWidth = clazz.lineWidth;
			context.strokeRect(startX, startY, clazz.width, clazz.height);
		}
		
		context.restore();
	};
};

/* Image */
Xim.Drawing.Image = function(url /* required */, x/* required */, y /* required */, config /* optional */)
{
	// Inherit from Xim.Drawing.Drawable
	if (typeof(config) !== "object" || config === null) 
	{
		config = {};
	}
	
	Xim.Drawing.Drawable.call(this, x, y, config.width, config.height, config);
	
	var clazz = this;
	var initializer = {};
	
	// Check required parameters
	if (typeof(url) === "undefined") 
	{
		throw "Xim.Drawing.Image : Missing required constructor paramter \"url\" [more details about this error on http://www.ximius.org/api/image]";
	}
	
	// Check param types
	if (typeof(url) !== "string" || url === "") 
	{
		throw "Xim.Drawing.Image : Wrong constructor parameter types [more details about this error on http://www.ximius.org/api/image]";
	}
	
	// Initialize config function
	if (config.width !== null && !isNaN(config.width)) 
	{
		initializer.width = config.width;
	}
	else 
	{
		initializer.width = null;
	}
	if (config.height !== null && !isNaN(config.height)) 
	{
		initializer.height = config.height;
	}
	else 
	{
		initializer.height = null;
	}
	if (config.opacity !== null && !isNaN(config.opacity)) 
	{
		initializer.opacity = config.opacity;
	}
	else 
	{
		initializer.opacity = 1;
	}
	
	/* @public */
	this.url = url;
	this.width = initializer.width;
	this.height = initializer.height;
	
	/* Load image */
	var canDraw = false;
	var drawAfterLoading = false;
	var drawingContext = null;
	var img = new Image();
	
	img.src = clazz.url;
	img.onload = function()
	{
		canDraw = true;
		if (drawAfterLoading) 
		{
			clazz.__drawInContext(drawingContext);
			drawingContext = null;
		}
	};
	
	/* @protected | Draw the image on the canvas */
	this.__drawInContext = function(context /* required */)
	{
		if (typeof(context) === "undefined" || context === null || !(context instanceof CanvasRenderingContext2D)) 
		{
			throw "Xim.Drawing.Rectangle.draw() : Wrong parameter type [\"context\" should be an instance of \"CanvasRenderingContext2D\"] [more details about this error on http://www.ximius.org/api/forms]";
		}
		
		// Draw image and stroke
		if (!canDraw) 
		{
			drawAfterLoading = true;
			drawingContext = context;
		}
		else 
		{
			if (clazz.width === null) 
			{
				clazz.width = img.width;
			}
			if (clazz.height === null) 
			{
				clazz.height = img.height;
			}
			
			var startX = -clazz.width / 2;
			var startY = -clazz.height / 2;
			
			context.save();
			clazz.__initContext(context);
			
			// Fix Alpha
			if(clazz.opacity < 0) 
			{
				clazz.opacity = 0;
			}
			
			if(clazz.opacity > 1) 
			{
				clazz.opacity = 1;
			}
			
			context.globalAlpha = clazz.opacity;
			
			// Image
			context.drawImage(img, startX, startY, clazz.width, clazz.height);
			
			// Stroke
			if (clazz.stroke !== null) 
			{
				var strokeStyle = new Xim.Style.Color(clazz.stroke);
				strokeStyle.applyToStroke(context, startX, startY, clazz.width, clazz.height);
				context.lineWidth = clazz.lineWidth;
				context.strokeRect(startX, startY, clazz.width, clazz.height);
			}
			
			context.restore();
		}
	};
};

/* Drawing canvas */
Xim.Canvas = function(canvasId /* required */, config /* optional */)
{

	var canvas = this;
	
	// Check required parameters
	if (typeof(canvasId) === "undefined") 
	{
		throw "Xim.LayerArea : Missing required constructor paramter [\"canvasId\" is needed] [more details about this error on http://www.ximius.org/api/drawing]";
	}
	
	// Check param types
	if (typeof(canvasId) !== "string" || canvasId === "") 
	{
		throw "Xim.LayerArea : Wrong constructor parameter type [\"canvasId\" should be a nonempty string] [more details about this error on http://www.ximius.org/api/drawing]";
	}
	
	/* @public | Assign a canvas */
	this.setCanvasId = function(pramCanvasId)
	{
	
		if (typeof(pramCanvasId) !== "string" || pramCanvasId === "") 
		{
			throw "Xim.LayerArea.setCanvasId() : Wrong parameter type [\"canvasId\" should be a nonempty string] [more details about this error on http://www.ximius.org/api/drawing]";
		}
		
		var canvasObj = document.getElementById(pramCanvasId);
		if (typeof(canvasObj) !== "object" || canvasObj === null || canvasObj.tagName.toUpperCase() !== "CANVAS") 
		{
			throw "Xim.LayerArea.setCanvasId() : Drawing area is not found or is not a canvas [more details about this error on http://www.ximius.org/api/drawing]";
		}
		
		canvasId = pramCanvasId;
		
		canvas.width = canvasObj.width;
		canvas.height = canvasObj.height;
	};
	
	/* @public | Return the canvas ID */
	this.getCanvasId = function()
	{
		return canvasId;
	};
	
	/* @public | Width, Height */
	this.width = 0;
	this.height = 0;
	
	this.setCanvasId(canvasId);
	
	/* @public | Transform a Xim.Layer to a visual image */
	this.draw = function(aDrawing)
	{
		if (typeof(aDrawing) !== "object" || aDrawing === null) 
		{
			throw "Xim.LayerArea.draw() : Missing required paramter [\"drawing\" is needed] [more details about this error on http://www.ximius.org/api/drawing]";
		}
		
		if (!(aDrawing instanceof Xim.Layer)) 
		{
			throw "Xim.LayerArea.draw() : Wrong parameter type [\"drawing\" should be a \"Xim.Layer\" instance] [more details about this error on http://www.ximius.org/api/drawing]";
		}
		
		var canvas = document.getElementById(canvasId);
		var context = canvas.getContext("2d");
		var it;
		
		for (it = 0; it < aDrawing.objects.length; it++) 
		{
			aDrawing.objects[it].__drawInContext(context);
		}
	};
	
	/* @public | Clear the drawing area */
	this.clear = function()
	{
		var canvas = document.getElementById(canvasId);
		var context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
	};
};

/* Animation namespace */
Xim.Animation = {};

/* Global animation constants */
Xim.Animation.NB_FRAMES_PER_SECOND = 60;
Xim.Animation.PARAMETERS = ["x", "y", "rotation", "width", "height", "opacity"];

/* Global animation variables */
Xim.Animation.CurrentScenes = [];

/* Animate an object */
Xim.animate = function(sceneId /* required */)
{
	var scene = Xim.Animation.CurrentScenes[sceneId];
	if (scene === null) 
	{
		throw "Xim.animate : Wrong constructor parameter value [Parameter \"sceneId\" don't match any scene] [more details about this error on http://www.ximius.org/api/animation]";
	}
	
	if (!scene.playing) 
	{
		clearInterval(scene.__interval);
		scene.__interval = null;
		Xim.Animation.CurrentScenes[sceneId] = null;
		return;
	}
	
	if (scene.__isFinished()) 
	{
		if (scene.repeat) 
		{
			scene.reset();
			scene.play();
		}
		else 
		{
			scene.end();
			scene.playing = false;
			clearInterval(scene.__interval);
			scene.__interval = null;
			Xim.Animation.CurrentScenes[sceneId] = null;
		}
	}
	else 
	{
		scene.__next();
		scene.__drawCurrentImage();
	}
};

/* An animation scene */
Xim.Scene = function(layer /* required */, canvas /* required */, nbFrames /* required */, config /* optional */)
{

	if (!(layer instanceof Xim.Layer) || !(canvas instanceof Xim.Canvas) || typeof(nbFrames) !== "number") 
	{
		throw "Xim.Scene : Wrong constructor parameter types [more details about this error on http://www.ximius.org/api/animation]";
	}
	
	if (nbFrames <= 0) 
	{
		throw "Xim.Scene : Wrong constructor parameter value [Parameter \"nbFrames\" should be a positive number] [more details about this error on http://www.ximius.org/api/animation]";
	}
	
	if (typeof(config) !== "object" || config === null) 
	{
		config = {};
	}
	
	var scene = this;
	
	/* @public | Public scene properties */
	this.nbFrames = nbFrames;
	this.currentFrame = 0;
	
	if (!isNaN(config.frameRate) && config.frameRate > 0) 
	{
		this.frameRate = config.frameRate;
	}
	else 
	{
		this.frameRate = Xim.Animation.NB_FRAMES_PER_SECOND;
	}
	
	this.layer = layer;
	this.canvas = canvas;
	this.playing = false;
	this.repeat = false;
	
	/* Initialize the scene ID */
	var sceneId = (new Date()).getTime() + "_" + Math.floor(Math.random() * 1000);
	
	if (typeof(config.repeat) === "boolean") 
	{
		scene.repeat = config.repeat;
	}
	
	/* @protected | Used to save the scene objects */
	this.__interval = null;
	this.__objects = [];
	
	/* @protected | Used inside the framework to animate images */
	this.__drawCurrentImage = function()
	{
		scene.canvas.clear();
		scene.canvas.draw(scene.layer);
	};
	
	/* @protected | Unsed inside the framework to move objects to the next frame of the animation */
	this.__next = function()
	{
		scene.currentFrame++;
		
		var objId;
		var animIndex;
		for (objId in scene.__objects) 
		{
			for (animIndex in scene.__objects[objId].animators) 
			{
				var animator = scene.__objects[objId].animators[animIndex];
				if (animator.__canDrawInFrame(scene.currentFrame)) 
				{
					animator.__next();
				}
			}
		}
	};
	
	/* @protected | Reset the initial state of all the objects of the scene */
	this.__initialize = function()
	{
		var paramIndex, objId;
		
		for (objId in scene.__objects) 
		{
			var initialState = scene.__objects[objId].initialState;
			
			for (paramIndex in Xim.Animation.PARAMETERS) 
			{
				var param = Xim.Animation.PARAMETERS[paramIndex];
				if (typeof(initialState[param]) !== null) 
				{
					scene.__objects[objId].object[param] = initialState[param];
				}
			}
		}
		
		scene.currentFrame = 0;
	};
	
	/* @protected | Used inside the framework to check if the animation is ended or not */
	this.__isFinished = function()
	{
		return scene.currentFrame >= scene.nbFrames;
	};
	
	/* @private | Unit time */
	var __unitTime = -1;
	
	/* @private | Used to calculate unit time for an animation */
	var __calculateUnitTime = function()
	{
		if (__unitTime !== -1) 
		{
			return __unitTime;
		}
		
		/* Drawing unit time */
		__unitTime = (1000 / scene.frameRate);
		
		if (__unitTime < 0) 
		{
			__unitTime = 1000 / Xim.Animation.frameRate;
		}
		
		return __unitTime;
	};
	
	/* @public | animate an aboject */
	this.animate = function(obj /* required */, fromFrame /* required */, toFrame /* end */, final /* required */, config /* optional */)
	{
		if (typeof(obj) !== "object" || !obj.isDrawable || typeof(obj.__id) !== "string" || obj.__id === "") 
		{
			throw "Xim.Scene.animate() : Wrong parameter type [Only \"Xim.Drawing.Drawable\" objects could be added to an scene] [more details about this error on http://www.ximius.org/api/animation]";
		}
		
		if (!scene.layer.contains(obj)) 
		{
			throw "Xim.Scene.animate() : Object to don't belongs to layer [Can't add to the scene an object that don't belongs to one of its layers] [more details about this error on http://www.ximius.org/api/animation]";
		}
		
		
		if (isNaN(fromFrame) || fromFrame <= 0 || fromFrame > nbFrames || isNaN(toFrame) || toFrame <= 0 || toFrame > nbFrames) 
		{
			throw "Xim.Scene.animate() : Wrong parameter types or values [Parameters \"fromFrame\" and \"toFrame\" should be positive integers between 1 and \"nbFrames\"] [more details about this error on http://www.ximius.org/api/animation]";
		}
		
		if (fromFrame > toFrame) 
		{
			throw "Xim.Scene.animate() : Wrong parameter value [Paramer \"fromFrame\" should be less than or equals to \"toFrame\"] [more details about this error on http://www.ximius.org/api/animation]";
		}
		
		if (typeof(final) !== "object") 
		{
			throw "Xim.Animatin.animate() : Wrong parameter type [Parameter \"final\" should be an object status descriptor] [more details about this error on http://www.ximius.org/api/animation]";
		}
		
		var index = obj.__id;
		
		/* Add the object to the scene if don't exists yet */
		var i, param;
		if (typeof(scene.__objects[index]) !== "object" || scene.__objects[index] === null) 
		{
			scene.__objects[index] = {};
			scene.__objects[index].object = obj;
			scene.__objects[index].animators = [];
			
			/* Set initial state */
			var initial = [];
			for (i in Xim.Animation.PARAMETERS) 
			{
				param = Xim.Animation.PARAMETERS[i];
				initial[param] = obj[param];
			}
			
			scene.__objects[index].initialState = initial;
		}
		
		/* Check the intersection of the animation with the other animators */
		var animIndex;
		for (animIndex in scene.__objects[index].animators) 
		{
			if (scene.__objects[index].animators[animIndex].intersect(fromFrame, toFrame)) 
			{
				throw "Xim.Animatin.animate() : Can't add animation to the object [\"fromFrame\" and \"toFrame\" should not intersect with other animators on this object] [more details about this error on http://www.ximius.org/api/animation]";
			}
		}
		
		var newAnimator = new Xim.Animator(obj.__id, 0, scene, fromFrame, toFrame, final);
		var last = scene.__objects[index].animators.length - 1;
		
		/* Shit the animators located after the new one, if needed */
		i = last;
		while (i >= 0 && scene.__objects[index].animators[i] !== null && scene.__objects[index].animators[i].after(newAnimator)) 
		{
			scene.__objects[index].animators[i + 1] = scene.__objects[index].animators[i];
			i--;
		}
		
		/* Insert the new animator */
		scene.__objects[index].animators[i + 1] = newAnimator;
		
		/* Update the animators' positions */
		var j;
		for (j = i + 1; j <= last + 1; j++) 
		{
			scene.__objects[index].animators[j].setPosition(j);
		}
	};
	
	/* @public | Start or resume playing the scene */
	this.play = function()
	{
		if (scene.playing === false) 
		{
			scene.playing = true;
			Xim.Animation.CurrentScenes[sceneId] = scene;
			scene.__interval = setInterval("Xim.animate(\"" + sceneId + "\")", __calculateUnitTime());
		}
	};
	
	/* @public | Stop playing scene temporary */
	this.pause = function()
	{
		scene.playing = false;
	};
	
	/* @public | Put an end to the scene */
	this.end = function()
	{
		var obj;
		var animIndex;
		for (obj in scene.__objects) 
		{
			for (animIndex in scene.__objects[obj].animators) 
			{
				scene.__objects[obj].animators[animIndex].__end();
			}
		}
		
		scene.playing = false;
		scene.currentFrame = scene.nbFrames;
		clearInterval(scene.interval);
	};
	
	/* @public | Reset the scene to its initial state */
	this.reset = function()
	{
		if (scene.playing) 
		{
			scene.pause();
		}
		
		scene.__initialize();
		clearInterval(scene.__interval);
		scene.__interval = null;
		scene.currentFrame = 0;
		scene.playing = false;
		scene.__drawCurrentImage();
		
		Xim.Animation.CurrentScenes[sceneId] = null;
	};
};

/* Animation information */
Xim.Animator = function(objId /* required */, animatorPosition /* required */, scene /* required */, fromFrame /* required */, toFrame /* required */, toState /* required */)
{
	if (isNaN(fromFrame) || isNaN(toFrame) || (toFrame - fromFrame) < 0) 
	{
		throw "Xim.Animator : Wrong constructor parameter types [\"fromFrame\" and \"toFrame\" should be two positive integers and \"fromFrame\" should be less than or equals to \"toFrame\"] [more details about this error on http://www.ximius.org/api/animation]";
	}
	
	var animator = this;
	
	var nbFrames = toFrame - fromFrame + 1;
	var currentFrame = 1;
	
	/* @protected | Share variables */
	this.__from = fromFrame;
	this.__to = toFrame;
	
	var position = animatorPosition;
	var frameVector = {};
	
	/* @public | Check if the animator is in intersection with another animator or not */
	this.intersect = function(from /* required */, to /* required */)
	{
		if (typeof(from) !== "number" || typeof(to) !== "number") 
		{
			return false;
		}
		
		return (from >= animator.__from && from <= animator.__to) || (to >= animator.__from && to <= animator.__to) ||
		(animator.__from >= from && animator.__from <= to) ||
		(animator.to >= from && animator.__to <= to);
	};
	
	/* @public | Check if this animator is located before the animator given in parameter or not */
	this.before = function(animatorParam /* required */)
	{
		return animator.__to < animatorParam.__from;
	};
	
	/* @public | Check if this animator is located after the animator given in parameter or not */
	this.after = function(animatorParam /* required */)
	{
		return animator.__from > animatorParam.__to;
	};
	
	/* @public | Change animator position */
	this.setPosition = function(positionParam /* required */)
	{
		if (typeof(positionParam) !== "number" || positionParam < 0) 
		{
			throw "Xim.Animator.setPosition() : Wrong parameter type [\"positionParam\" should be a positive number] [more details about this error on http://www.ximius.org/api/animation]";
		}
		
		position = positionParam;
		updateFrameVector();
	};
	
	/* @public | Return the state of the object at the end of the animation */
	this.getFinalState = function()
	{
		var i;
		var finalState = {};
		var fromState = animator.getFromState();
		for (i in Xim.Animation.PARAMETERS) 
		{
			var param = Xim.Animation.PARAMETERS[i];
			finalState[param] = fromState[param] + frameVector[param] * nbFrames;
		}
		
		return finalState;
	};
	
	/* @public | Return the final state of the previous animator on the object, or the initial state */
	this.getFromState = function()
	{
		if (position === 0) 
		{
			// If it's the first animator, return the initial position
			var initialState = {};
			var i;
			
			for (i in Xim.Animation.PARAMETERS) 
			{
				var param = Xim.Animation.PARAMETERS[i];
				initialState[param] = scene.__objects[objId].object[param];
			}
			
			return initialState;
		}
		else 
		{ /* Return the position of the previous animator */
			return scene.__objects[objId].animators[position - 1].getFinalState();
		}
	};
	
	/* @protected | Check if an object should be drawn in a frame or not */
	this.__canDrawInFrame = function(frameNbr /* required */)
	{
		if (isNaN(frameNbr) || frameNbr < fromFrame || frameNbr > toFrame) 
		{
			return false;
		}
		
		return true;
	};
	
	/* @protected | Move object to next position */
	this.__next = function()
	{
		var i;
		
		for (i in Xim.Animation.PARAMETERS) 
		{
			var param = Xim.Animation.PARAMETERS[i];
			scene.__objects[objId].object[param] += frameVector[param];
		}
		
		currentFrame++;
	};
	
	/* @protected | Move the object to a position corresponding to a specific frame in the animation */
	this.__moveTo = function(relativeFrameNbr /* required */)
	{
		if (isNaN(relativeFrameNbr) || relativeFrameNbr <= 0 || relativeFrameNbr > nbFrames) 
		{
			throw "Xim.Animator.__moveTo() : Wrong parameter type or value [\"relativeFrameNbr\" should be a positive number between 1 and \"nbFrames\"]";
		}
		
		var i;
		for (i in Xim.Animation.PARAMETERS) 
		{
			var param = Xim.Animation.PARAMETERS[i];
			scene.__objects[objId].object[param] += frameVector[param] * relativeFrameNbr;
		}
		
		currentFrame = relativeFrameNbr;
	};
	
	/* @protected | Move the object to a position corresponding to a specific frame in the scene */
	this.__moveToScene = function(absoluteFrame /* required */)
	{
		animator.__moveTo(absoluteFrame - fromFrame);
	};
	
	/* @protected | Set final position */
	this.__end = function()
	{
		var i;
		var finalState = animator.getFinalState();
		
		for (i in Xim.Animation.PARAMETERS) 
		{
			var param = Xim.Animation.PARAMETERS[i];
			scene.__objects[objId].object[param] = finalState[param];
		}
		
		currentFrame = nbFrames;
	};
	
	/* @private | Calculate unit step for each animation parameter */
	var updateFrameVector = function()
	{
		var i;
		var fromState = animator.getFromState();
		
		for (i in Xim.Animation.PARAMETERS) 
		{
			var param = Xim.Animation.PARAMETERS[i];
			if (typeof(toState[param]) === "number" && fromState[param] !== toState[param]) 
			{
				frameVector[param] = (toState[param] - fromState[param]) / nbFrames;
			}
			else 
			{
				frameVector[param] = 0;
				toState[param] = fromState[param];
			}
		}
	};
};

