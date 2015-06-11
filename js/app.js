/**
 * Initialize the Game and starts it.
 */
var game = new Game();

function init() {
	if(game.init())
		game.start();
}

/**
 * Define an object to hold all our images for the game so images
 * are only ever created once. This type of object is known as a
 * singleton.
 */
var imageRepository = new function() {
	// Define images
	this.background = new Image();
	this.spaceship = new Image();
	this.bullets = new Image();

	//making sure that all images have loaded before the starting the game
	var numOfImages = 3;
	var numOfLoadedImages = 0;
	function imageLoaded() {
		numOfLoadedImages++
		if(numOfLoadedImages === numOfImages){
			window.init();
		}
	}
	this.background.onload = function(){
		imageLoaded();
	}
	this.spaceship.onload = function(){
		imageLoaded();
	}
	this.bullets.onload = function(){
		imageLoaded();
	}

	// Set images src
	this.background.src = "img/road.png";
	this.spaceship.src = "img/car.png";
	this.bullets.src = "img/bullets.png";
}


// this drawable object will be the base class for everything else drawable in the game
function Drawable() {
	this.init = function(x, y, width, height) {
		// Defualt variables
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;

	// Define abstract function to be implemented in child objects
	this.draw = function() {
	};
	this.move = function() {
	};
}

//createda drawable object of background
function Background() {
	this.speed = 2; // Redefine speed of the background for panning

	// Implement abstract function
	this.draw = function() {
		// Pan background
		this.y += this.speed;
		this.context.drawImage(imageRepository.background, this.x, this.y);

		// Draw another image at the top edge of the first image
		//this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight));

		// If the image scrolled off the screen, reset
		if (this.y >= this.canvasHeight)
			this.y = 0;
	};
}
// Set Background to inherit properties from Drawable
Background.prototype = new Drawable();

//bullets object
function bullets() {
	//this will be true if the bullet is being used
	this.alive = false;

	//setting bullet values
	this.spawn = function(x, y, speed){
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.alive = true;
	}

	//using another rectangle to erase the bullet and move it.
	//once a bullet has reached the edge of the canvas a conditional will tell it to delete/redraw
	this.draw = function(){
		this.context.clearRect(this.x, this.y, this.width, this.height);
		this.y -= this.speed;
		if(this.y <= 0 - this.height){
			return true;
		} else {
				this.context.drawImage(imageRepository.bullet, this.x, this.y);
		}
	}

	//resets the bullet values
	this.clear =  function(){
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.alive = false;
	}
}
bullets.prototype= new Drawable();

function pool(maxSize){
	//max number of bullets allowed in this pool object
	var size = maxSize;
	var pool = [];

	//populating pool array with bullet objects
	this.init = function(){
		for(var i = 0; i < size; i++){
			//initializing the bullet object
			var bullet = new bullets();
			bullet.init(0, 0, imageRepository.bullets.width,imageRepository.bullets.height);
			pool[i] = bullets;
		}
	};

	//grabbing last bullet pushed tot he array, init's it, and pushes it to the front of thea rray
	this.get = function() {
		if(!pool[size-1].alive) {
			pool[size - 1].spawn(x, y, speed);
			pool.unshift(pool.pop());
		}
	};

	//this lets 2 bullets get shot at the same time
	//the get is used twiice, but have to make another function for it so
	//hopefully the bullets will come out of the headlights or something
	this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
		if(!pool[size - 1].alive &&
		   !pool[size - 2].alive) {
				this.get(x1, y1, speed1);
				this.get(x2, y2, speed2);
			 }
	};

	//any bullets that arein use need to be drawn
	//so this function will help out with that
	this.animate = function(){
		for(var i = 0; i < size; i++){
			//only draw new ones until we find that a bullet is not alive
			if(pool[i].alive) {
				if(pool[i].draw()){
					pool[i].clear();
					pool[i].push((pool.splice(i, 1))[0]);
				}
			}
			else {
				break;
			}
		}
	}
}

//creating a ship object that the player will be able to move around the screen
//the rectangles is used again to continuously redraw the shape
function ship(){
	this.speed = 4;
	this.bulletPool = new pool(30);
	this.bulletPool.init();

	var fireRate = 20;
	var counter = 0;

	this.draw = function(){
		this.context.drawImage(imageRepository.spaceship, this.x, this.y)
	};
	this.move = function() {
		counter ++
		//checking for user input to determine movement of the spaceship
		if(KEY_STATUS.left || KEY_STATUS.right || KEY_STATUS.down || KEY_STATUS.up){
			//if this evals to true, the ship has moved so we need to remove it from its current location and redraw
			//it in its new location
			this.context.clearRect(this.x, this.y, this.width, this.height);

			//updating the x and the y according to the direction moved
			//also redraw the ship in its new location
			if (KEY_STATUS.left) {
				this.x -= this.speed
				if (this.x <= 0) // Keep player within the screen
					this.x = 0;
			} else if (KEY_STATUS.right) {
				this.x += this.speed
				if (this.x >= this.canvasWidth - this.width)
					this.x = this.canvasWidth - this.width;
			} else if (KEY_STATUS.up) {
				this.y -= this.speed
				if (this.y <= this.canvasHeight/4*3)
					this.y = this.canvasHeight/4*3;
			} else if (KEY_STATUS.down) {
				this.y += this.speed
				if (this.y >= this.canvasHeight - this.height)
					this.y = this.canvasHeight - this.height;
			}

			// Finish by redrawing the ship
			this.draw();
		}
	}
}


//gameobject
function Game() {
	//gets the canvas information and the context,
	//sets upall drawable objects in the game
	this.init = function() {
		// Get the canvas element
		this.bgCanvas = document.getElementById('background');

		// Test to see if canvas is supported
		if (this.bgCanvas.getContext) {
			this.bgContext = this.bgCanvas.getContext('2d');

			// Initialize objects to contain their context and canvas
			// information
			Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;

			// Initialize the background object
			this.background = new Background();
			this.background.init(0,0); // Set draw point to 0,0
			return true;
		} else {
			return false;
		}
	};

	// Start the animation loop
	this.start = function() {
		animate();
	};
}


/**
 * The animation loop. Calls the requestAnimationFrame shim to
 * optimize the game loop and draws all game objects. This
 * function must be a gobal function and cannot be within an
 * object.
 */
function animate() {
	requestAnimFrame( animate );
	game.background.draw();
}


/**
 * requestAnim shim layer by Paul Irish
 * Finds the first API that works to optimize the animation loop,
 * otherwise defaults to setTimeout().
 */
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			};
})();
