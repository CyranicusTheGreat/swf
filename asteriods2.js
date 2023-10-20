////
// Boss.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Boss', {

	url: '/images/boss/body.gif',
	width: 184,
	height: 96,
	collisions: false,
	state: 'idle',
	
	category: 'boss',
	
	setup: function() {
		// delay before appearing, so we can change out music
		this.removeFromAether();
		this.hide();
		
		var music_id = Effect.Game.getLevelProps().music;
		Effect.Audio.getTrack( music_id ).fadeOut( 45 * 5 );
		
		var self = this;
		Effect.Game.scheduleEvent( 45 * 5, function() { self.appear(); } );
	},
	
	appear: function() {
		// NOW we can show up
		this.x = (this.plane.scrollX + (this.port.portWidth / 2)) - (this.width / 2);
		this.y = this.plane.scrollY - 140; // room for guns
		this.show();
		
		this.state = 'flyin';
		this.targetY = this.plane.scrollY + 60;
		
		this.old_music = CrystalGalaxy.saveLevelMusic = Effect.Game.getLevelProps().music;
		Effect.Game.getLevelProps().music = 'music_final_boss'; // in case user pauses / resumes
		Effect.Audio.getTrack( 'music_final_boss' ).rewind().setVolume(1.0).play();
		
		this.guns = [];
		this.doors = [];
		
		this.guns.push( this.plane.createSprite( 'BossGun', {
			ox: 38,
			oy: 81,
			frameX: 0,
			zIndex: this.zIndex - 1,
			boss: this
		} ) );
		this.guns.push( this.plane.createSprite( 'BossGun', {
			ox: 130,
			oy: 81,
			frameX: 1,
			zIndex: this.zIndex - 1,
			boss: this
		} ) );
		
		this.doors.push( this.plane.createSprite( 'BossDoor', {
			ox: 5,
			oy: 35,
			zIndex: this.zIndex + 1,
			boss: this
		} ) );
		this.doors.push( this.plane.createSprite( 'BossDoor', {
			ox: 68,
			oy: 66,
			zIndex: this.zIndex + 1,
			boss: this
		} ) );
		this.doors.push( this.plane.createSprite( 'BossDoor', {
			ox: 132,
			oy: 35,
			zIndex: this.zIndex + 1,
			boss: this
		} ) );		
	},
	
	logic: function(clock) {
		this[ 'logic_' + this.state ](clock);
		
		// the boss 'body' doesn't use collisions in the traditional sense
		// so we have to check for player collisions manually
		var player = this.plane.getSprite('player');
		if (this.getRect().rectIn( player.getRect() )) {
			player.onHit(this);
		}
	},
	
	logic_idle: function(clock) {
		// do nothing
	},
	
	logic_flyin: function(clock) {
		this.yd = ((this.targetY - this.y) / 32);
		
		var hit = this.move();
		if (hit) this.handleHit(hit);
		
		if (Math.abs(this.targetY - this.y) < 1) {
			this.state = 'roam';
			this.attackMode = 'guns';
			this.numGuns = 2;
			this.numDoors = 3;
			this.targetX = this.x;
			this.easeX = 48;
			this.yd = 0;
			this.y = this.targetY;
		}
	},
	
	logic_roam: function(clock) {
		var player = this.plane.getSprite('player');
		if ((this.attackMode == 'guns') && (player.y < this.y + this.height)) {
			// if player tries to get alongside us, smash him
			this.targetX = player.centerPointX() - (this.width / 2);
		}
		
		this.xd = ((this.targetX - this.x) / this.easeX);
		this.yd = ((this.targetY - this.y) / this.easeX);
		
		var hit = this.move();
		if (hit) this.handleHit(hit);
		
		if (Math.abs(this.targetX - this.x) < 1) {
			// pick new target
			if (probably((this.attackMode == 'guns') ? 0.5 : 0.25)) this.targetX = player.centerPointX() - (this.width / 2);
			else this.targetX = this.plane.scrollX + (Math.random() * (this.port.portWidth - this.width));
		}
		
		if (this.attackMode == 'doors') {
			if (Math.abs(this.targetY - this.y) < 1) {
				if (probably(0.25)) this.targetY = player.centerPointY() - (this.height / 2);
				else this.targetY = this.plane.scrollY + (Math.random() * (this.port.portHeight - this.height));
			}
		}
	},
	
	loseGun: function() {
		Debug.trace('Boss', "in loseGun(), numGuns before: " + this.numGuns);
		this.numGuns--;
		if (this.numGuns < 1) {
			Debug.trace('Boss', "Switching attachMode to doors");
			this.attackMode = 'doors';
			this.easeX = 32;
			
			var self = this;
			Effect.Game.scheduleEvent( 45, function() { self.openDoor(); } );
		}
	},
	
	openDoor: function() {
		// pick random door, open it
		if (this.state == 'roam') {
			var good_doors = [];
			for (var idx = 0; idx < this.doors.length; idx++) {
				if (!this.doors[idx].dead) good_doors.push( this.doors[idx] );
			}
			var door = good_doors[ Math.floor(Math.random() * good_doors.length) ];
			door.openSesame();
			
			// spawn something random?
			
			
			var self = this;
			Effect.Game.scheduleEvent( 45 * (4 + Math.floor(Math.random() * 6)), function() { self.openDoor(); } );
		}
	},
	
	loseDoor: function() {
		// lose a door, all 3 and we're dead!
		this.numDoors--;
		if (!this.numDoors) {
			// that's it!
			this.explode();
		}
	},
	
	handleHit: function(result) {
		if (result && result.events) {
			for (var idx = 0, len = result.events.length; idx < len; idx++) {
				var hit = result.events[idx];
				if (hit.target.onHit) hit.target.onHit(this);
			}
		}
	},
	
	onHit: function(source) {
		// something hit us
		if (source.category == 'character') source.onHit(this);
	},
	
	logic_death: function(clock) {
		// lots of explosions and particles
		if (this.hideTimer) {
			this.hideTimer--;
			if (!this.hideTimer) {
				this.hide();
				for (var idx = 0; idx < this.doors.length; idx++) {
					this.doors[idx].hide();
				}
			}
		}
		
		if (Math.random() < (this.deathTimer / (45 * 6))) {
			var ex_size = probably(0.5) ? 128 : 64;
			Effect.Port.getPlane('particles').createSprite( 'Explosion', {
				x: (this.x - (ex_size / 2)) + (Math.random() * this.width),
				y: (this.y - (ex_size / 2)) + (Math.random() * this.height),
				size: ex_size,
				explosionType: 'explosion2',
				frameDelta: 0.5
			});

			CrystalGalaxy.create_debris({
				debrisClass: rand_array(['ship','sphere']),
				cx: this.centerPointX(),
				cy: this.centerPointY(),
				amount: rand_array([2, 4, 8]),
				scatter: 128,
				distance: rand_array([8, 16, 24])
			});

			if (probably(0.5)) Effect.Audio.playSound( rand_array(['explosion32','explosion64','explosion96']) );
		}
		
		this.deathTimer--;
		if (!this.deathTimer) {
			this.destroy();
			CrystalGalaxy.level_complete();
		}
	},
	
	explode: function() {
		// huge explosion
		this.state = 'death';
		this.category = 'harmless';
		this.hideTimer = 45 * 3;
		this.deathTimer = 45 * 6;
		
		this.plane.findSprites({ type: 'BossMissile' }).each( function(sprite) {
			sprite.explode();
		} );
		
		var music_id = Effect.Game.getLevelProps().music;
		Effect.Audio.getTrack( music_id ).fadeOut( 45 * 1 );
	},
	
	destroy: function() {
		// destroy our parts
		for (var idx = 0; idx < this.guns.length; idx++) {
			if (!this.guns[idx].destroyed) this.guns[idx].destroy();
		}
		for (var idx = 0; idx < this.doors.length; idx++) {
			if (!this.doors[idx].destroyed) this.doors[idx].destroy();
		}
		
		// restore music
		Effect.Game.getLevelProps().music = this.old_music;
		
		// call super's destroy
		Sprite.prototype.destroy.call(this);
	}
	
} );


////
// BossDoor.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'BossDoor', {

	url: '/images/boss/door.gif',
	width: 46,
	height: 22,
	collisions: false, // until we 'open'
	
	category: 'enemy',
	energy: 20,
	state: 'idle',
	
	logic: function(clock) {
		this[ 'logic_' + this.state ](clock);
	},
	
	logic_idle: function(clock) {
		// do nothing
	},
	
	logic_opening: function(clock) {
		// door is opening
		if (clock % 10 == 0) {
			this.setFrameX( this.frameX + 1 );
			if (this.frameX >= 4) {
				this.state = 'hold';
				this.holdTimer = 90;
				
				// launch missile
				this.plane.createSprite( 'BossMissile', {
					x: this.centerPointX() - 16,
					y: this.centerPointY() - 16,
					angle: Math.random() * 360,
					zIndex: 5
				} );
				Effect.Audio.playSound( 'launch_fighter' );
			}
		}
	},
	
	logic_hold: function(clock) {
		// hold open while player can shoot us
		this.holdTimer--;
		if (!this.holdTimer) {
			this.state = 'closing';
		}
	},
	
	logic_closing: function(clock) {
		// door is opening
		if (clock % 10 == 0) {
			this.setFrameX( this.frameX - 1 );
			if (this.frameX <= 0) {
				this.state = 'idle';
				this.collisions = false;
			}
		}
	},
	
	openSesame: function() {
		this.collisions = true;
		this.state = 'opening';
	},
	
	onHit: function(source) {
		// something hit us
		switch (source.category) {
			case 'character':
				// send hit back to character
				source.onHit(this);
				break;
			case 'projectile':
				this.energy--;
				if (!this.energy) this.explode();
				else {
					Effect.Audio.playSound( 'hit_enemy' );
				}
				break;
		} // switch type
	},
	
	explode: function() {
		// end of life for us
		Effect.Port.getPlane('particles').createSprite( 'Explosion', {
			x: this.centerPointX() - 32,
			y: this.centerPointY() - 32
		});
		
		CrystalGalaxy.create_debris({
			debrisClass: 'ship',
			cx: this.centerPointX(),
			cy: this.centerPointY(),
			amount: 8,
			scatter: 8,
			distance: 6
		});

		Effect.Audio.playSound( 'explosion64' );
		
		// switch to "dead" mode:
		this.setFrameX( 5 );
		this.collisions = false;
		this.dead = true;
		this.state = 'idle';
		
		this.boss.loseDoor();
	},
	
	draw: function() {
		// synchronize position with body
		this.x = this.boss.x + this.ox;
		this.y = this.boss.y + this.oy;
		this.__parent.draw.call(this);
	}
	
} );

////
// BossGun.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'BossGun', {

	url: '/images/boss/guns.gif',
	width: 15,
	height: 43,
	collisions: true,
	
	category: 'enemy',
	energy: 40,
	shotTimer: 0,
	angle: 270,
	
	logic: function(clock) {
		if (clock % 3 == 0) {
			if (this.offsetY < 0) this.offsetY++; // recoil
		}
		
		if ((this.boss.attackMode == 'guns') && !this.shotTimer && (clock % 8 == 0)) {
			// check if player is in range
			var player = this.plane.getSprite('player');
			var ang = this.centerPoint().getAngle( player.centerPoint() );
			if (Math.abs( this.angle - ang ) < 25) {
				// shoot!
				var pt = (new Point(this.centerPointX(), this.y + this.height)).project( this.angle, 1 );

				Effect.Port.getPlane('particles').createSprite( 'BossLaser', {
					x: pt.x - 32,
					y: pt.y - 32,
					angle: this.angle
				});

				Effect.Audio.playSound( "boss_shoot" );
				
				this.shotTimer = 45;
				this.offsetY = -8; // recoil
			}
		}
		if (this.shotTimer) this.shotTimer--;
	},
	
	onHit: function(source) {
		// something hit us
		switch (source.category) {
			case 'character':
				// send hit back to character
				source.onHit(this);
				break;
			case 'projectile':
				this.energy--;
				if (this.energy < 1) this.explode();
				else {
					Effect.Audio.playSound( 'hit_enemy' );
				}
				break;
		} // switch type
	},
	
	explode: function() {
		// end of life for us
		Debug.trace('BossGun', "in explode(), boss.numGuns = " + this.boss.numGuns);
		
		if (!this.destroyed && (this.boss.state == 'roam')) {
			Effect.Port.getPlane('particles').createSprite( 'Explosion', {
				x: this.centerPointX() - 32,
				y: this.centerPointY() - 32
			});
		
			CrystalGalaxy.create_debris({
				debrisClass: 'ship',
				cx: this.centerPointX(),
				cy: this.centerPointY(),
				amount: 8,
				scatter: 8,
				distance: 6
			});

			Effect.Audio.playSound( 'explosion64' );

			this.destroy();
			
			Debug.trace('BossGun', "calling this.boss.loseGun()");
			this.boss.loseGun();
		}
	},
	
	draw: function() {
		// synchronize position with body
		this.x = this.boss.x + this.ox;
		this.y = this.boss.y + this.oy;
		this.__parent.draw.call(this);
	}
	
} );

////
// BossLaser.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'BossLaser', {
	
	url: 'boss-laser.png',
	width: 64,
	height: 64,
	hitRect: new Rect(8, 8, 56, 56),
	collisions: true,
	dieOffscreen: true,
	
	angle: 0,
	maxDelta: 6,
	category: 'projectile',
	
	setup: function() {
		var pt = (new Point()).project( this.angle, this.maxDelta );
		this.xd = pt.x;
		this.yd = pt.y;
		
		// this.xd = Math.cos( DECIMAL_TO_RADIANS( (this.angle) % 360) ) * this.maxDelta;
		// this.yd = Math.sin( DECIMAL_TO_RADIANS( (this.angle) % 360) ) * this.maxDelta;
		
		var rotate = this.angle - 90;
		if (rotate < 0) rotate += 360;
		// this.setFrameX( Math.floor( ((rotate % 180) / 180) * 32 ) );
	},
	
	logic: function(clock) {
		var hit = this.move(this.xd, this.yd, Effect.Port.getPlane('sprites'), Effect.Port.getPlane('tiles'));
		if (hit) {
			if (hit.target.solid) {
				this.explode();
			}
			else if (hit.target.category == 'character') {
				hit.target.onHit(this);
				this.explode();
			}
		}
	},
	
	onHit: function(source) {
		// something hit us
	},

	explode: function() {
		// end of life for us
		this.plane.createSprite( 'Ricochet', {
			x: this.x,
			y: this.y
		});

		// Effect.Audio.playSound( 'hit' );

		this.destroy();
	}	
	
} );

////
// BossMissile.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'BossMissile', {
	url: 'big_missile.png',
	width: 32,
	height: 32,
	hitRect: new Rect(8, 8, 24, 24),
	collisions: true,
	dieOffscreen: true,
	
	category: 'projectile',
	angle: 0,
	angleDelta: 0,
	angleSpeed: 2,
	state: 'seek',
	speed: 3,
	energy: 3,
	score: 0
} );

BossMissile.prototype.setup = function() {
	// convert some props to numbers
	this.score = this.energy * 100;
	
	this.head = new Point();
	this.tail = new Point();
	
	var img = Effect.ImageLoader.lookupImage(this.url).img;
	
	this.width = img.height; // yes, this is deliberate!
	this.height = img.height;
	
	this.maxFrames = Math.floor( img.width / img.height );
	this.hitRect.set( 8, 8, this.width - 8, this.height - 8 );
	
	if (this.cx && this.cy) {
		this.x = this.cx - (this.width / 2);
		this.y = this.cy - (this.height / 2);
	}
	
	this.thrust = -8;
	this.thrustSprite = this.plane.createSprite( 'ShipThrust', {
		character: this,
		zIndex: this.zIndex - 1
	} );
};

BossMissile.prototype.logic = function() {
	// animation
	this[ 'logic_' + this.state ]();
};

BossMissile.prototype.logic_add = function() {
	// behavior logic A.D.D. (Angle / Distance / Delta)
	var pt = new Point(0, 0).project( this.angle, this.speed );
	this.xd = pt.x;
	this.yd = pt.y;
	
	/*this.x += this.xd;
	this.y += this.yd;
	if (this.getRect().rectIn( ship.getRect() )) {
		ship.onHit(this);
		this.explode();
		return;
	}*/
	
	var hit = this.move( this.xd, 0 );
	if (hit) this.handleHit(hit);
	if (this.destroyed) return;
	
	hit = this.move( 0, this.yd );
	if (hit) this.handleHit(hit);
	if (this.destroyed) return;
	
	if (this.angleDelta) {
		this.angle += this.angleDelta;
	}
	
	if (this.angle < 0) this.angle += 360;
	else if (this.angle >= 360) this.angle -= 360;
	
	// set frame
	this.setFrameX( Math.floor(this.maxFrames * ((((360 - this.angle) + 90) % 360) / 360)) );
	
	 // for ShipThrust
	this.rotate = (360 - this.angle) + 90;
	if (this.rotate >= 360) this.rotate -= 360;
	else if (this.rotate < 0) this.rotate += 360;
	
	return hit;
};

BossMissile.prototype.handleHit = function(hit) {
	if (hit.target.category == 'character') hit.target.onHit(this);
	if (hit.target.solid || ((hit.target.category == 'character') && !hit.target.invincible)) {
		this.explode();
	}
};

BossMissile.prototype.logic_seek = function() {
	// seek character and randomly fire at it
	var ship = this.plane.getSprite('player');
	var dest_angle = this.centerPoint().getAngle( ship.centerPoint() );
	if (this.tow || (ship.state == 'death')) {
		// we got a crystal, flee!
		dest_angle += 180;
		if (dest_angle >= 360) dest_angle -= 360;
	}
	
	var dest_angle_a = dest_angle;
	var dest_angle_b = dest_angle + 360;
	var dest_angle_c = dest_angle - 360;
	if (Math.abs(dest_angle_b - this.angle) < Math.abs(dest_angle - this.angle)) dest_angle = dest_angle_b;
	if (Math.abs(dest_angle_c - this.angle) < Math.abs(dest_angle - this.angle)) dest_angle = dest_angle_c;
	
	if (dest_angle > this.angle) {
		this.angle += this.angleSpeed;
		if (this.angle > dest_angle) this.angle = dest_angle;
	}
	else if (dest_angle < this.angle) {
		this.angle -= this.angleSpeed;
		if (this.angle < dest_angle) this.angle = dest_angle;
	}
	
	var hit = this.logic_add();
	
	// set head and tail points for tow chain
	this.tail.set( this.centerPoint().project( (this.angle + 180) % 360, this.width / 2 ) );
	this.head.set( this.centerPoint().project( this.angle, this.width / 2 ) );
};

BossMissile.prototype.onHit = function(source) {
	// something hit us
	switch (source.category) {
		case 'character':
			// send hit back to character
			source.onHit(this);
			this.energy--;
			if (!this.energy) this.explode();
			break;
		case 'projectile':
			this.energy--;
			if (!this.energy) this.explode();
			else {
				Effect.Audio.playSound( 'hit_enemy' );
			}
			break;
	} // switch type
};

BossMissile.prototype.explode = function() {
	// end of life for us
	Effect.Port.getPlane('particles').createSprite( 'Explosion', {
		x: this.centerPointX() - 32,
		y: this.centerPointY() - 32
	});
	
	CrystalGalaxy.create_debris({
		debrisClass: 'ship',
		cx: this.centerPointX(),
		cy: this.centerPointY(),
		amount: 8,
		scatter: 16,
		distance: 4
	});
	
	Effect.Audio.playSound( 'explosion32' );
	
	if (probably(0.5)) {
		this.plane.createSprite( 'Crystal', {
			x: this.centerPointX() - (Crystal.prototype.width / 2),
			y: this.centerPointY() - (Crystal.prototype.height / 2)
		});
	}
	
	this.destroy();
};

BossMissile.prototype.destroy = function() {
	// make sure we kill our thrust sprite
	this.thrustSprite.destroy();
	delete this.thrustSprite;
	
	// call super's destroy
	Sprite.prototype.destroy.call(this);
};

////
// Buddy.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend('Buddy', {
	url: 'crawler.png',
	width: 36,
	height: 36,
	collisions: true,
	dieOffscreen: true,
	
	category: 'projectile',
	state: 'idle',
	frameFloat: 0,
	frameDelta: 1
} );

Buddy.prototype.logic = function() {
	// perform logic
	this[ 'logic_' + this.state ]();
};

Buddy.prototype.logic_idle = function() {
	// sit there, waiting to be picked up
};

Buddy.prototype.logic_tow = function() {
	// being towed, don't do anything
	// until special tow chain logic
};

Buddy.prototype.logic_recover = function() {
	// bring rotation back to 0, then switch image back
	this.state = 'idle';
};

Buddy.prototype.setup_tow = function(source) {
	// setup tow chain
	this.head = source.tail.clone();
	this.tail = this.head.getPointFromProjection( source.head.getAngle(source.tail), this.width );
	this.state = 'tow';
	this.collisions = false;
	this.dieOffscreen = false;
};

Buddy.prototype.detach_tow = function() {
	// no longer in tow (ship died, most likely)
	this.state = 'recover';
	this.collisions = true;
	this.dieOffscreen = true;
	
	if (this.tow) this.tow.detach_tow();
	this.tow = null;
};

Buddy.prototype.follow = function(source) {
	// follow object in front of us (multi-taildragger)
	// and do the same for object behind us, if applicable
	if (source.type == 'Ship') {
		// for the ship, the head and tail are inset, so add padding
		this.head.set( source.head.getPointFromProjection( source.head.getAngle(source.tail), 64 ) );
	}
	else {
		// normally just follow the tail
		this.head.set( source.tail );
	}
	this.tail = this.head.getPointFromProjection( this.head.getAngle(this.tail), this.width );
	
	// constrict to angle range
	var source_angle_a = source.head.getAngle(source.tail);
	var source_angle_b = source_angle_a + 360;
	var source_angle_c = source_angle_a - 360;
	var my_angle = this.head.getAngle(this.tail);
	
	var source_angle = source_angle_a;
	
	if (Math.abs(source_angle_b - my_angle) < Math.abs(source_angle - my_angle)) {
		source_angle = source_angle_b;
	} // b less than a
	if (Math.abs(source_angle_c - my_angle) < Math.abs(source_angle - my_angle)) {
		source_angle = source_angle_c;
	} // c less than b or a
	
	if (Math.abs(source_angle - my_angle) > 65) {
		if (my_angle < source_angle) my_angle = source_angle - 65;
		else my_angle = source_angle + 65;
		
		if (my_angle < 0) my_angle += 360;
		else if (my_angle >= 360) my_angle -= 360;
		
		this.tail = this.head.getPointFromProjection( my_angle, this.width );
	}
		
	var pt = this.head.getMidPoint( this.tail );
	pt.offset( 0 - (this.width / 2), 0 - (this.height / 2) );
	
	this.xd = pt.x - this.x;
	this.yd = pt.y - this.y;
	
	this.rotate = 360 - (this.tail.getAngle(this.head) - 90);
	if (this.rotate < 0) this.rotate += 360;
	else if (this.rotate >= 360) this.rotate -= 360;
	
	this.x += this.xd;
	this.y += this.yd;
	
	// set frame
	this.setFrameX( Math.floor(64 * (this.rotate / 360)) );
	
	// continue on down the chain...
	if (this.tow) this.tow.follow(this);
};

Buddy.prototype.offset = function(xd, yd) {
	// move crystal from port scroll
	this.head.offset( xd, yd );
	this.tail.offset( xd, yd );
	this.x += xd;
	this.y += yd;
	
	// tow chain
	if (this.tow) this.tow.offset(xd, yd);
};

Buddy.prototype.shoot = function() {
	// player is shooting
	var pt = new Point( this.centerPointX(), this.centerPointY() );
	var deg = this.frameX * (360 / 64);
	var ang = ((360 - deg) + 90) % 360;
	pt.project( ang, 16 );
	
	Effect.Port.getPlane('particles').createSprite( 'ShipLaser', {
		url: 'laser-buddy.png',
		cx: pt.x,
		cy: pt.y,
		rotate: deg,
		character: this.character
	});
	
	if (this.tow) this.tow.shoot();
};

Buddy.prototype.onHit = function(source) {
	// something hit us
	
	switch (source.category) {
		case 'character':
			// give character the buddy
			source.powerUp('option', this);
			
			// this.destroy();
			break;
	} // switch type
};

////
// Crystal.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend('Crystal', {
	url: 'crystal5.png',
	width: 36,
	height: 36,
	collisions: true,
	dieOffscreen: true,
	
	category: 'powerup',
	state: 'idle',
	frameFloat: 0,
	frameDelta: 1
} );

Crystal.prototype.logic = function() {
	// perform logic
	this[ 'logic_' + this.state ]();
};

Crystal.prototype.logic_idle = function() {
	// sit there, waiting to be picked up
	this.frameFloat += this.frameDelta;
	if (this.frameFloat >= 32) this.frameFloat -= 32;
	else if (this.frameFloat < 0) this.frameFloat += 32;
	this.setFrameX( Math.floor(this.frameFloat) );
};

Crystal.prototype.logic_tow = function() {
	// being towed, don't do anything
	// until special tow chain logic
};

Crystal.prototype.logic_recover = function() {
	// bring rotation back to 0, then switch image back
	this.rotate /= 2;
	if (this.rotate < 1) {
		this.state = 'idle';
		this.setImage( 'crystal5.png' );
		return;
	}
	
	this.xd /= 2; if (Math.abs(this.xd) < 1) this.xd = 0;
	this.yd /= 2; if (Math.abs(this.yd) < 1) this.yd = 0;
	
	this.x += this.xd;
	this.y += this.yd;
	
	// set frame
	this.setFrameX( Math.floor(32 * (this.rotate / 360)) );
};

Crystal.prototype.setup_tow = function(source) {
	// setup tow chain
	this.head = source.tail.clone();
	this.tail = this.head.getPointFromProjection( source.head.getAngle(source.tail), this.width );
	this.setImage( 'crystal5-rotate.png' );
	this.state = 'tow';
	this.collisions = false;
	this.dieOffscreen = false;
};

Crystal.prototype.detach_tow = function() {
	// no longer in tow (ship died, most likely)
	this.state = 'recover';
	this.collisions = true;
	this.dieOffscreen = true;
	
	if (this.tow) this.tow.detach_tow();
	this.tow = null;
};

Crystal.prototype.follow = function(source) {
	// follow object in front of us (multi-taildragger)
	// and do the same for object behind us, if applicable
	if (source.type == 'Ship') {
		// for the ship, the head and tail are inset, so add padding
		this.head.set( source.head.getPointFromProjection( source.head.getAngle(source.tail), 64 ) );
	}
	else {
		// normally just follow the tail
		this.head.set( source.tail );
	}
	this.tail = this.head.getPointFromProjection( this.head.getAngle(this.tail), this.width );
	
	// constrict to angle range
	var source_angle_a = source.head.getAngle(source.tail);
	var source_angle_b = source_angle_a + 360;
	var source_angle_c = source_angle_a - 360;
	var my_angle = this.head.getAngle(this.tail);
	
	var source_angle = source_angle_a;
	
	if (Math.abs(source_angle_b - my_angle) < Math.abs(source_angle - my_angle)) {
		source_angle = source_angle_b;
	} // b less than a
	if (Math.abs(source_angle_c - my_angle) < Math.abs(source_angle - my_angle)) {
		source_angle = source_angle_c;
	} // c less than b or a
	
	if (Math.abs(source_angle - my_angle) > 65) {
		if (my_angle < source_angle) my_angle = source_angle - 65;
		else my_angle = source_angle + 65;
		
		if (my_angle < 0) my_angle += 360;
		else if (my_angle >= 360) my_angle -= 360;
		
		this.tail = this.head.getPointFromProjection( my_angle, this.width );
	}
		
	var pt = this.head.getMidPoint( this.tail );
	pt.offset( 0 - (this.width / 2), 0 - (this.height / 2) );
	
	this.xd = pt.x - this.x;
	this.yd = pt.y - this.y;
	
	this.rotate = 360 - (this.tail.getAngle(this.head) - 90);
	if (this.rotate < 0) this.rotate += 360;
	else if (this.rotate >= 360) this.rotate -= 360;
	
	this.x += this.xd;
	this.y += this.yd;
	
	// set frame
	this.setFrameX( Math.floor(32 * (this.rotate / 360)) );
	
	// continue on down the chain...
	if (this.tow) this.tow.follow(this);
};

Crystal.prototype.offset = function(xd, yd) {
	// move crystal from port scroll
	this.head.offset( xd, yd );
	this.tail.offset( xd, yd );
	this.x += xd;
	this.y += yd;
	
	// tow chain
	if (this.tow) this.tow.offset(xd, yd);
};

Crystal.prototype.shoot = function() {
	// player is shooting, pass down the chain
	if (this.tow) this.tow.shoot();
};

Crystal.prototype.onHit = function(source) {
	// something hit us
	
	switch (source.category) {
		case 'character':
			// give character the crystal
			source.powerUp('crystal', this);
			
			// this.destroy();
			break;
	} // switch type
};

////
// Debris.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Debris', {
	url: 'debris_ship.png',
	width: 20,
	height: 20,
	collisions: false,
	dieOffscreen: true,
	
	counter: 0,
	deltaDiv: 16,
	debrisClass: 'ship',
	debrisVersion: 0,
	angle: 0,
	distance: 0
} );

Debris.prototype.setup = function() {
	// override sprite init
	if (this.cx && this.cy) {
		this.x = this.cx - (this.width / 2);
		this.y = this.cy - (this.height / 2);
	}
	
	if (this.distance) {
		var pt = new Point();
		pt.project( this.angle, this.distance );
		this.xd = pt.x;
		this.yd = pt.y;
	}
	
	if (this.debrisClass) this.setImage( 'fx/debris_' + this.debrisClass + '.png' );
	this.debrisVersion = Math.floor( Math.random() * (this.img.height / this.height) );
	
	this.maxFrames = Math.floor( this.img.width / this.width );
	
	// this.setZIndex( this.plane.zIndex + 1 ); // above other sprites
};

Debris.prototype.logic = function(clock) {
	// logic loop
	this.xd = easeFloat(this.xd, this.deltaDiv);
	this.yd = easeFloat(this.yd, this.deltaDiv);
	this.x += this.xd;
	this.y += this.yd;
	
	this.setFrame( this.counter, this.debrisVersion );
	if (clock % 2) this.counter++;
	if (this.counter >= this.maxFrames) this.destroy();
};

////
// EnemyShip.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'EnemyShip', {
	url: 'ship1.gif',
	width: 64,
	height: 64,
	hitRect: new Rect(8, 8, 56, 56),
	collisions: true,
	dieOffscreen: true,
	
	category: 'enemy',
	angle: 0,
	angleDelta: 0,
	angleSpeed: 2,
	shipType: 1,
	state: 'add',
	speed: 1,
	shootProb: 0.03,
	mineProb: 0.1,
	energy: 1,
	groupId: 0,
	score: 100
} );

EnemyShip.prototype.setup = function() {
	// convert some props to numbers
	this.angle = parseFloat( this.angle );
	this.angleDelta = parseFloat( this.angleDelta );
	this.speed = parseFloat( this.speed );
	this.shootProb = parseFloat( this.shootProb );
	this.energy = parseInt( this.energy, 10 );
	
	this.score = this.energy * 100;
		
	if (this.groupId) {
		this.group = CrystalGalaxy.spriteGroups[ this.groupId ];
	}
	
	this.head = new Point();
	this.tail = new Point();
	
	var url = this.shipType;
	if (url.toString().match(/^\d+$/)) url = 'ship' + url;
	
	var img = Effect.ImageLoader.lookupImage(url).img;
	
	this.width = img.height; // yes, this is deliberate!
	this.height = img.height;
	this.setImage( url );
	
	this.maxFrames = Math.floor( img.width / img.height );
	this.hitRect.set( 8, 8, this.width - 8, this.height - 8 );
	
	if (this.cx && this.cy) {
		this.x = this.cx - (this.width / 2);
		this.y = this.cy - (this.height / 2);
	}
	
	switch (this.state) {
		case 'seek':
			var ship = this.plane.getSprite('player');
			this.angle = this.centerPoint().getAngle( ship.centerPoint() );
			break;
	} // switch state
	
	// remove from aether, so we die normally
	this.removeFromAether();
};

EnemyShip.prototype.logic = function() {
	// animation
	this[ 'logic_' + this.state ]();
	
	// tow chain
	if (this.tow) this.tow.follow(this);
};

EnemyShip.prototype.logic_add = function() {
	// behavior logic A.D.D. (Angle / Distance / Delta)
	var b = CrystalGalaxy.scroll_behavior;
	var pt = new Point(0, 0).project( this.angle, this.speed ).project( b.angle, b.distance / 2 );
	this.xd = pt.x;
	this.yd = pt.y;
	
	/*this.x += this.xd;
	this.y += this.yd;
	if (this.getRect().rectIn( ship.getRect() )) {
		ship.onHit(this);
		this.explode();
		return;
	}*/
	
	var hit = this.move( this.xd, 0 );
	if (hit) this.handleHit(hit);
	if (this.destroyed) return;
	
	hit = this.move( 0, this.yd );
	if (hit) this.handleHit(hit);
	if (this.destroyed) return;
	
	if (this.angleDelta) {
		this.angle += this.angleDelta;
	}
	
	if (this.angle < 0) this.angle += 360;
	else if (this.angle >= 360) this.angle -= 360;
	
	// set frame
	this.setFrameX( Math.floor(this.maxFrames * ((((360 - this.angle) + 90) % 360) / 360)) );
	
	if ((this.state == 'add') && this.group && (this.group.remain < this.group.count)) {
		this.state = 'seek';
	}
	
	return hit;
};

EnemyShip.prototype.handleHit = function(hit) {
	if (hit.target.onHit) hit.target.onHit(this);
	if (hit.target.solid || ((hit.target.category == 'character') && !hit.target.invincible)) {
		this.explode();
	}
};

EnemyShip.prototype.logic_seek = function() {
	// seek character and randomly fire at it
	var ship = this.plane.getSprite('player');
	var dest_angle = this.centerPoint().getAngle( ship.centerPoint() );
	if (this.tow || (ship.state == 'death')) {
		// we got a crystal, flee!
		dest_angle += 180;
		if (dest_angle >= 360) dest_angle -= 360;
	}
	
	var dest_angle_a = dest_angle;
	var dest_angle_b = dest_angle + 360;
	var dest_angle_c = dest_angle - 360;
	if (Math.abs(dest_angle_b - this.angle) < Math.abs(dest_angle - this.angle)) dest_angle = dest_angle_b;
	if (Math.abs(dest_angle_c - this.angle) < Math.abs(dest_angle - this.angle)) dest_angle = dest_angle_c;
	
	if (dest_angle > this.angle) {
		this.angle += this.angleSpeed;
		if (this.angle > dest_angle) this.angle = dest_angle;
	}
	else if (dest_angle < this.angle) {
		this.angle -= this.angleSpeed;
		if (this.angle < dest_angle) this.angle = dest_angle;
	}
	
	var hit = this.logic_add();
	if (hit && (hit.target.type == 'Crystal')) {
		// nah nah nah
		Effect.Audio.playSound( 'steal_crystal' );

		// tie one on
		var obj = hit.target;
		var end = this;
		while (end.tow) end = end.tow;
		end.tow = obj;
		obj.setup_tow(end);
		obj = null;
	}
	
	if ((Math.abs(dest_angle - this.angle) < 20) && !this.tow && (Math.random() < this.shootProb)) {
		this.shoot();
	}
	
	if ((this.shipType == 6) && (Math.random() < this.mineProb)) {
		this.mine();
	}
	
	// steal crystals from character tow chain
	if (ship.tow && !this.tow) {
		var rect = this.getRect();
		var obj = ship.tow;
		while (obj) {
			if ((obj.type == 'Crystal') && obj.rectIn(rect)) {
				// yup, steal one
				ship.steal(obj);
				
				// nah nah nah
				Effect.Audio.playSound( 'steal_crystal' );

				// tie one on
				var end = this;
				while (end.tow) end = end.tow;
				end.tow = obj;
				obj.setup_tow(end);
				obj = null;
			}
			else obj = obj.tow;
		}
	} // ship.tow
	
	// set head and tail points for tow chain
	this.tail.set( this.centerPoint().project( (this.angle + 180) % 360, this.width / 2 ) );
	this.head.set( this.centerPoint().project( this.angle, this.width / 2 ) );
};

EnemyShip.prototype.logic_death = function() {
	// we're dead
	if (Effect.Game.logicClock == this.dieAt) {
		this.destroy();
	}
};

EnemyShip.prototype.shoot = function() {
	// shoot
	if (!this.lastShot || (Effect.Game.logicClock - this.lastShot >= 30)) {
		this.lastShot = Effect.Game.logicClock;
		var pt = this.centerPoint().clone();
		var deg = this.frameX * (360 / this.maxFrames);
		var ang = ((360 - deg) + 90) % 360;
		pt.project( ang, this.width / 2 );
	
		Effect.Port.getPlane('particles').createSprite( 'EnemyShipLaser', {
			x: pt.x - 8,
			y: pt.y - 8,
			rotate: deg
		});
	
		Effect.Audio.playSound( "enemy_ship_shoot.mp3" );
	}
};

EnemyShip.prototype.mine = function() {
	// lay a mine
	if (!this.lastMine || (Effect.Game.logicClock - this.lastMine >= 45)) {
		this.lastMine = Effect.Game.logicClock;
		var pt = this.centerPoint().clone();
		var deg = this.frameX * (360 / this.maxFrames);
		var ang = ((360 - deg) + 90) % 360;
		pt.project( ang + 180, this.width / 2 );
		
		if (CrystalGalaxy.gameMode == 'survival') {
			// don't drop mines offscreen
			if (!this.plane.getScreenRect().pointIn(pt)) return;
		}
	
		this.plane.createSprite( 'Mine', {
			x: pt.x - (Mine.prototype.width / 2),
			y: pt.y - (Mine.prototype.height / 2),
			owner: this
		});
	
		Effect.Audio.playSound( "drop_mine.mp3" );
	}
};

EnemyShip.prototype.onHit = function(source) {
	// something hit us
	switch (source.category) {
		case 'character':
			// send hit back to character
			source.onHit(this);
			this.energy--;
			if (!this.energy) this.explode();
			break;
		case 'projectile':
			this.energy--;
			if (!this.energy) this.explode();
			else {
				Effect.Audio.playSound( 'hit_enemy' );
			}
			break;
	} // switch type
};

EnemyShip.prototype.destroy = function() {
	// make sure tow chain is detached
	if (this.tow) this.tow.detach_tow();
	this.tow = null;
	
	// call super's destroy
	Sprite.prototype.destroy.call(this);
};

EnemyShip.prototype.explode = function() {
	// end of life for us
	Effect.Port.getPlane('particles').createSprite( 'Explosion', {
		x: this.centerPointX() - 32,
		y: this.centerPointY() - 32
	});
	
	CrystalGalaxy.create_debris({
		debrisClass: 'ship',
		cx: this.centerPointX(),
		cy: this.centerPointY(),
		amount: 8,
		scatter: 32,
		distance: 6
	});
	
	Effect.Audio.playSound( 'explosion64' );
	
	this.state = 'death';
	this.hide();
	this.collisions = false;
	this.dieAt = Effect.Game.logicClock + (this.interval ? this.interval : 1);
	
	if (this.group && this.group.remain) {
		this.group.remain--;
		if (!this.group.remain) {
			// all of group are dead -- bonus spawn?  crystal?
			
			this.plane.createSprite( 'Crystal', {
				x: this.centerPointX() - (Crystal.prototype.width / 2),
				y: this.centerPointY() - (Crystal.prototype.height / 2)
			});
		}
	}
	
	// bye bye tow chain
	if (this.tow) this.tow.detach_tow();
	this.tow = null;
};

////
// EnemyShipLaser.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'EnemyShipLaser', {
	url: 'missile1.gif',
	width: 16,
	height: 16,
	collisions: true,
	dieOffscreen: true,
	
	category: 'projectile',
	maxDelta: 4
} );

EnemyShipLaser.prototype.setup = function() {
	// override sprite init
	// this.require('x', 'y');
		
	this.xd = Math.cos( DECIMAL_TO_RADIANS( (this.rotate - 90) % 360) ) * this.maxDelta;
	this.yd = Math.sin( DECIMAL_TO_RADIANS( (this.rotate - 90) % 360) ) * this.maxDelta;
	this.setFrameX( Math.floor( ((this.rotate % 360) / 360) * 32 ) );
};

EnemyShipLaser.prototype.logic = function() {
	// movement
	var hit = this.move(this.xd, 0, Effect.Port.getPlane('sprites'), Effect.Port.getPlane('tiles'));
	if (hit) this.handleHit( hit );
	if (this.destroyed) return;
	
	var hit = this.move(0, this.yd, Effect.Port.getPlane('sprites'), Effect.Port.getPlane('tiles'));
	if (hit) this.handleHit( hit );
};

EnemyShipLaser.prototype.handleHit = function(hit) {
	if (hit.target.solid) {
		this.explode();
	}
	else if (hit.target.category == 'character') {
		hit.target.onHit(this);
		this.explode();
	}
};

EnemyShipLaser.prototype.onHit = function(source) {
	// something hit us
	
};

EnemyShipLaser.prototype.explode = function() {
	// end of life for us
	this.plane.createSprite( 'Ricochet', {
		x: this.x - 8,
		y: this.y - 8
	});
	
	// Effect.Audio.playSound( 'hit' );
	
	this.destroy();
};

////
// Explosion.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Explosion', {
	url: 'explosion2-64.png',
	width: 64,
	height: 64,
	collisions: false,
	dieOffscreen: true,
	
	explosionType: 'explosion2',
	frameFloat: 0,
	frameDelta: 0.5
} );

Explosion.prototype.setup = function() {
	// override sprite init
	if (this.size) {
		this.width = this.size;
		this.height = this.size;
		this.setImage( 'fx/' + this.explosionType + '-' + this.size + '.png' );
	}
	
	this.maxFrames = Math.floor( this.img.width / this.width );
	
	if (this.cx && this.cy) {
		this.x = this.cx - (this.width / 2);
		this.y = this.cy - (this.height / 2);
	}
	
	this.setZIndex( this.plane.zIndex + 1 ); // above other sprites
};

Explosion.prototype.logic = function() {
	// logic loop
	this.setFrameX( Math.floor(this.frameFloat) );
	this.frameFloat += this.frameDelta;
	if (this.frameFloat >= this.maxFrames) this.destroy();
};

////
// Lightning.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Lightning', {

	url: 'lightning1-128.png',
	width: 128,
	height: 128,
	collisions: true,
	hitRect: new Rect(32, 32, 96, 96),
	
	category: 'projectile',
	angle: 0,
	coil: null,
	
	setup: function() {
		this.setFrame( Math.floor( (((360 - this.angle) % 180) / 180) * 16 ), Math.floor( Math.random() * 3 ) );
		this.setZIndex( this.coil.zIndex - 1 ); // behind our coil
	},
	
	logic: function(clock) {
		this.setFrame( Math.floor( (((360 - this.angle) % 180) / 180) * 16 ), Math.floor( Math.random() * 3 ) );
		
		var newx = this.x + this.xd;
		var newy = this.y + this.yd;
		
		var hit = this.move();
		if (hit) {
			if (hit.target.category && hit.target.category.match(/(character|enemy)/)) {
				if (hit.target.onHit && (hit.target.type != 'TeslaCoil')) hit.target.onHit(this);
			}
		}
		
		this.x = newx;
		this.y = newy;
	}
	
} );

////
// Mine.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Mine', {
	
	url: 'images/objects/mine.png',
	width: 32,
	height: 32,
	collisions: true,
	solid: false,
	dieOffscreen: true,
	category: 'enemy',
	dieTimer: 0,
	score: 100,
	
	logic: function(clock) {
		if (this.dieTimer) {
			this.dieTimer--;
			if (!this.dieTimer) {
				// kill everything in the area
				this.category = 'projectile';
				var self = this;
				this.plane.findSpritesByRect( this.getRect().inset(-48, -48) ).each( function(sprite) {
					if (sprite.category && sprite.category.match(/enemy|character/)) {
						sprite.onHit( self );
					}
				} );

				this.destroy();
			}
		}
	},
	
	onHit: function(source) {
		if (source.category == 'character') source.onHit(this);
		if (!this.dieTimer && (source.id != this.owner.id)) this.explode();
	},
	
	explode: function() {
		Effect.Port.getPlane('particles').createSprite( 'Explosion', {
			cx: this.centerPointX(),
			cy: this.centerPointY(),
			size: 128,
			frameDelta: 0.5
		});
		
		CrystalGalaxy.create_debris({
			debrisClass: 'ship',
			cx: this.centerPointX(),
			cy: this.centerPointY(),
			amount: 8,
			scatter: 8,
			distance: 16
		});
		
		Effect.Audio.playSound( 'explosion96.mp3' );
		
		this.dieTimer = 15;
	}
	
} );

////
// Orb.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Orb', {
	
	url: 'images/objects/orb.png',
	width: 32,
	height: 32,
	collisions: true,
	solid: true,
	dieOffscreen: true,
	score: 25,
	category: 'orb',
	
	onHit: function(source) {
		if (source.category == 'projectile') this.pop();
	},
	
	pop: function() {
		Effect.Audio.playSound( 'orb_pop.mp3' );
		this.destroy();
	}
	
} );

////
// Particle.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Particle', {
	url: 'particle_a.png',
	width: 8,
	height: 8,
	collisions: false,
	dieOffscreen: true,
	
	counter: 0,
	deltaDiv: 16,
	particleClass: 'a',
	particleVersion: 0,
	angle: 0,
	distance: 0
} );

Particle.prototype.setup = function() {
	// override sprite init
	if (this.cx && this.cy) {
		this.x = this.cx - (this.width / 2);
		this.y = this.cy - (this.height / 2);
	}
	
	if (this.distance) {
		var pt = new Point();
		pt.project( this.angle, this.distance );
		this.xd = pt.x;
		this.yd = pt.y;
	}
	
	if (this.particleClass) this.setImage( 'fx/particle_' + this.particleClass + '.png' );
	this.particleVersion = Math.floor( Math.random() * 3 );
	
	// this.setZIndex( this.plane.zIndex + 1 ); // above other sprites
};

Particle.prototype.logic = function(clock) {
	// logic loop
	this.xd = easeFloat(this.xd, this.deltaDiv);
	this.yd = easeFloat(this.yd, this.deltaDiv);
	this.x += this.xd;
	this.y += this.yd;
	
	this.setFrame( this.counter, this.particleVersion );
	if (clock % 2) this.counter++;
	if (this.counter > 23) this.destroy();
};

////
// Planet.js
// Enemy Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Planet', {
	url: 'planets/alien1.gif',
	width: 128,
	height: 128,
	collisions: false
} );

Planet.prototype.setup = function() {
	// override sprite init
	Debug.trace('Planet', "Setting up planet: " + this.planetType);
	var img = Effect.ImageLoader.lookupImage(this.planetType).img;
	this.width = img.width;
	this.height = img.height;
	this.centerPt = new Point(this.centerPointX(), this.centerPointY());
	this.setImage( this.planetType );
};

////
// Ricochet.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Ricochet', {
	url: 'fx/ricochet1.gif',
	width: 32,
	height: 32,
	dieOffscreen: true,
	counter: 0
} );

Ricochet.prototype.logic = function() {
	// logic loop
	this.setFrameX( this.counter );
	this.counter++;
	if (this.counter > 7) this.destroy();
};

////
// Rock.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Rock', {
	url: 'rocks/rock_a_64.png',
	width: 64,
	height: 64,
	collisions: true,
	solid: true,
	screenLoop: false,
	dieOffscreen: true,
	
	category: 'projectile',
	maxDelta: 8,
	maxFrames: 48,
	frameFloat: 0,
	frameDelta: 0,
	rockClass: 'a',
	size: 64,
	score: 100
} );

Rock.prototype.setup = function() {
	// override sprite init
	// this.require('x', 'y');
	
	this.size = parseInt( this.size, 10 );
	this.xd = parseFloat( this.xd );
	this.yd = parseFloat( this.yd );
	
	switch (this.size) {
		case 32: this.score = 100; break;
		case 64: this.score = 200; break;
		case 96: this.score = 400; break;
	}
	
	// get characteristics from class
	this.width = this.size;
	this.height = this.size;
	this.setImage( 'rocks/rock_' + this.rockClass + '_' + this.size + '.png' );
	
	var padding = Math.floor( this.size / 8 );
	this.hitRect = new Rect( padding, padding, this.width - padding, this.height - padding );
	
	var image = Effect.ImageLoader.lookupImage( this.url );
	assert(image && image.loaded && image.img && image.img.width, "Sprite image "+this.url+" is not loaded" );
	var img = image.img;
	this.maxFrames = img.width / this.width;
	this.frameFloat = Math.floor( Math.random() * this.maxFrames );
	
	if (!this.frameDelta) {
		var frameDelta = (Math.random() * 2) - 1;
		if (Math.abs(frameDelta) < 0.5) frameDelta *= 2;
		this.frameDelta = frameDelta;
	}
	
	if (this.isAether()) {
		this.group = {};
		switch (this.size) {
			case 32: this.group.remain = 1; break;
			case 64: this.group.remain = 3; break;
			case 96: this.group.remain = 7; break;
		}
	}
	
	this.removeFromAether();
	
	if (this.screenLoop) this.dieOffscreen = false;
};

Rock.prototype.logic = function() {
	// movement
	
	/* this.x += this.xd;
	this.y += this.yd;
	if (this.getRect().rectIn( ship.getRect() )) {
		ship.onHit(this);
		this.explode();
		return;
	} */
	
	var newx = this.x + this.xd;
	var hit = this.move( this.xd, 0 );
	this.x = newx;
	
	if (hit && hit.target.type != 'Rock') {
		if (hit.target.onHit) hit.target.onHit(this);
		if (hit.target.solid || (hit.target.category && hit.target.category.match(/(projectile|enemy)/)) || ((hit.target.type == 'Ship') && !hit.target.invincible)) {
			this.explode( 0 - this.xd, 0 );
			return;
		}
	}
	
	var newy = this.y + this.yd;
	var hit = this.move( 0, this.yd );
	this.y = newy;
	
	if (hit && hit.target.type != 'Rock') {
		if (hit.target.onHit) hit.target.onHit(this);
		if (hit.target.solid || (hit.target.category && hit.target.category.match(/(projectile|enemy)/)) || ((hit.target.type == 'Ship') && !hit.target.invincible)) {
			this.explode( 0, 0 - this.yd );
			return;
		}
	}
	
	/*if (this.xd || this.yd) {
		var zeroPt = new Point( 0, 0 );
		var angle = zeroPt.getAngle( new Point(this.xd, this.yd) );
		var centerPt = new Point( this.centerPointX(), this.centerPointY() );
		var outerPt = centerPt.getPointFromProjection( angle, this.size / 4 );
		
		if (this.xd) {
			var xHit = this.plane.movePointX( outerPt.x, outerPt.y, this.xd );
			if (xHit && (xHit.target.type != 'Rock')) {
				if ((this.xd > 0) && xHit.target.onHitRight) xHit.target.onHitRight(this);
				else if ((this.xd < 0) && xHit.target.onHitLeft) xHit.target.onHitLeft(this);
				else if (xHit.target.onHit) xHit.target.onHit(this);
				
				if (xHit.target.solid) {
					this.explode();
					return;
				}
				else {
					this.x = (xHit.correctedX - (outerPt.x - this.x));
					outerPt.x = xHit.correctedX;
				}
			} // xHit
			else this.x += this.xd;
		} // xd
		
		if (this.yd) {
			var yHit = this.plane.movePointY( outerPt.x, outerPt.y, this.yd );
			if (yHit && (yHit.target.type != 'Rock')) {
				if ((this.yd > 0) && yHit.target.onHitBottom) yHit.target.onHitBottom(this);
				else if ((this.yd < 0) && yHit.target.onHitTop) yHit.target.onHitTop(this);
				else if (yHit.target.onHit) yHit.target.onHit(this);
				
				if (yHit.target.solid) {
					this.explode();
					return;
				}
				else this.y = (yHit.correctedY - (outerPt.y - this.y));
			} // yHit
			else this.y += this.yd;
		} // yd
		
	} // deltas nonzero
	*/
	
	/*if (this.xd < 0) {
		var xHit = this.plane.moveLineX( this.x + this.hitRect.left, this.y + this.hitRect.top, this.y + this.hitRect.bottom, this.xd );
		if (xHit) {
			if (xHit.target.onHitRight) xHit.target.onHitRight(this);
			else if (xHit.target.onHit) xHit.target.onHit(this);
			
			if (xHit.target.solid) {
				this.explode();
				return;
			}
			else this.x = xHit.correctedX - this.hitRect.left;
		}
		else this.x += this.xd;
	}
	else if (this.xd > 0) {
		var xHit = this.plane.moveLineX( this.x + this.hitRect.right - 1, this.y + this.hitRect.top, this.y + this.hitRect.bottom, this.xd );
		if (xHit) {
			if (xHit.target.onHitLeft) xHit.target.onHitLeft(this);
			else if (xHit.target.onHit) xHit.target.onHit(this);
			
			if (xHit.target.solid) {
				this.explode();
				return;
			}
			else this.x = (xHit.correctedX - this.hitRect.right) + 1;
		}
		else this.x += this.xd;
	}
	
	if (this.yd < 0) {
		var yHit = this.plane.moveLineY( this.y + this.hitRect.top, this.x + this.hitRect.left, this.x + this.hitRect.right, this.yd );
		if (yHit) {
			if (yHit.target.onHitBottom) yHit.target.onHitBottom(this);
			else if (yHit.target.onHit) yHit.target.onHit(this);
			
			if (yHit.target.solid) {
				this.explode();
				return;
			}
			else this.y = yHit.correctedY - this.hitRect.top;
		}
		else this.y += this.yd;
	}
	else if (this.yd > 0) {
		var yHit = this.plane.moveLineY( this.y + this.hitRect.bottom - 1, this.x + this.hitRect.left, this.x + this.hitRect.right, this.yd );
		if (yHit) {
			if (yHit.target.onHitTop) yHit.target.onHitTop(this);
			else if (yHit.target.onHit) yHit.target.onHit(this);
			
			if (yHit.target.solid) {
				this.explode();
				return;
			}
			else this.y = (yHit.correctedY - this.hitRect.bottom) + 1;
		}
		else this.y += this.yd;
	}*/
	
	// animation
	this.frameFloat += this.frameDelta;
	if (this.frameFloat >= this.maxFrames) this.frameFloat -= this.maxFrames;
	else if (this.frameFloat < 0) this.frameFloat += this.maxFrames;
	this.setFrameX( Math.floor(this.frameFloat) );
};

Rock.prototype.onHit = function(source) {
	// something hit us
	
	switch (source.category) {
		case 'character':
			// send hit back to character
			source.onHit(this);
			this.explode();
			break;
		case 'projectile':
			this.explode();
			break;
		case 'enemy':
			this.explode();
			break;
	} // switch type
};

Rock.prototype.explode = function( pxd, pyd ) {
	// end of life for us
	if (this.destroyed) return;
	
	if (!pxd) pxd = 0;
	if (!pyd) pyd = 0;
	
	/*Effect.Port.getPlane('particles').createSprite({
		type: Explosion,
		size: (this.size == 96) ? 128 : 64,
		cx: this.centerPointX(),
		cy: this.centerPointY()
	});*/
	var p_args = {
		particleClass: this.rockClass,
		cx: this.centerPointX(),
		cy: this.centerPointY()
	};
	
	switch (this.size) {
		case 96:
			for (var idx=0; idx<2; idx++) {
				CrystalGalaxy.spawn_rock({
					x: this.centerPointX() - 32, 
					y: this.centerPointY() - 32, 
					xd: pxd,
					yd: pyd,
					rockClass: this.rockClass, 
					rockSize: 64,
					group: this.group ? this.group : null,
					screenLoop: this.screenLoop
				});
			}
			p_args.amount = 12;
			p_args.scatter = 16;
			p_args.distance = 8;
			break;
		
		case 64:
			for (var idx=0; idx<2; idx++) {
				CrystalGalaxy.spawn_rock({
					x: this.centerPointX() - 16, 
					y: this.centerPointY() - 16, 
					xd: pxd,
					yd: pyd,
					rockClass: this.rockClass, 
					rockSize: 32,
					group: this.group ? this.group : null,
					screenLoop: this.screenLoop
				});
			}
			p_args.amount = 8;
			p_args.scatter = 12;
			p_args.distance = 8;
			break;
		
		case 32:
			p_args.amount = 8;
			p_args.scatter = 8;
			p_args.distance = 4;
			break;
	}
	
	CrystalGalaxy.create_particles(p_args);
	
	Effect.Audio.playSound( 'explosion' + this.size );
	
	if (this.group && this.group.remain) {
		this.group.remain--;
		if (!this.group.remain) {
			// all of group are dead -- bonus spawn?  crystal?
			
			this.plane.createSprite( 'Crystal', {
				x: this.centerPointX() - 24,
				y: this.centerPointY() - 24
			});
		}
	}
	
	this.destroy();
};

////
// Ship.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Ship', {
	url: 'ships/ship5.png',
	width: 64,
	height: 74,
	hitRect: new Rect(16, 16, 48, 48),
	collisions: true,
	
	category: 'character',
	state: 'roam',
	rotate: 0,
	invincible: false,
	thrustMax: 8,
	thrustVol: 0,
	thrust: 0,
	shields: false,
	score: 0,
	crystals: 0,
	lives: 5,
	dirtyDisplay: true,
	requestShoot: false,
	requestBuy: false,
	leftMouseButtonDown: false,
	maxFrames: 60,
	
	powerups: null,
	powerup_map: {
		rapid: 2,
		laser: 4,
		option: 6,
		shields: 8
	},
	allow_mult_powerups: {
		option: 1
	}
} );

Ship.prototype.setup = function() {
	this.powerups = {};
	this.character = this;
	this.head = new Point(0, 0);
	this.tail = new Point(0, 0);
	
	var pt = this.port.getMouseCoords() || new Point();
	this.rawMouse = pt.clone();
};

Ship.prototype.onKeyDown = function(key) {
	// receive keyDown event
	// this can fire between logic frames, so we just set a flag here, allowing
	// the next logic frame to pick up the request.
	if (key == 'select') this.requestBuy = true;
};

Ship.prototype.start_flyin = function() {
	// prepare ship to "fly onscreen"
	// pick location just offscreen, based on scroll angle
	var ang = (CrystalGalaxy.scroll_behavior.targetAngle + 180) % 360;
	var pt = new Point( this.plane.scrollX + (this.port.portWidth / 2), this.plane.scrollY + (this.port.portHeight / 2) );
	pt.project( ang, this.port.portWidth * 0.6 );
	
	this.head.set( pt );
	this.tail.set( pt.clone().project(ang, 64) );
	
	var pt2 = this.head.getMidPoint( this.tail );
	pt2.offset( -32, -37 );
	this.x = pt2.x;
	this.y = pt2.y;
	
	this.state = 'flyin';
	
	this.flyinPt = this.head.clone();
	this.flyinCount = 0;
	this.flyinDuration = 90;
	
	this.collisions = true;
	this.invincible = true;
	this.invincibleEnd = Effect.Game.logicClock + (3 * 45);
	
	this.show(true);
};

Ship.prototype.start_flyout = function() {
	// prepare ship to "fly offscreen" at the end of a level
	// pick direction based on scroll angle
	var ang = CrystalGalaxy.scroll_behavior.targetAngle;
	var pt = new Point( this.plane.scrollX + (this.port.portWidth / 2), this.plane.scrollY + (this.port.portHeight / 2) );
	pt.project( ang, this.port.portWidth * 0.6 );
	
	this.state = 'flyout';
	
	this.flyoutSourcePt = this.head.clone();
	this.flyoutDestPt = pt;
	this.flyoutCount = 0;
	this.flyoutDuration = 90;
	
	this.collisions = false;
	this.invincible = true;
	this.invincibleEnd = Effect.Game.logicClock + (4 * 45);
	
	this.show(true);
};

Ship.prototype.getRawMouse = function() {
	// return raw mouse coords -- may be scripted (part of fly-in animation)
	switch (this.state) {
		case 'flyin':
			return this.flyinPt.clone().morph( this.rawMouse, this.flyinCount / this.flyinDuration, 'EaseOut', 'Quintic' );
			break;
		
		case 'flyout':
			return this.flyoutSourcePt.clone().morph( this.flyoutDestPt, this.flyoutCount / this.flyoutDuration, 'EaseIn', 'Quadratic' );
			break;
		
		default:
			return this.rawMouse;
			break;
	}
};

Ship.prototype.logic = function(clock) {
	// perform logic routine
	this[ 'logic_' + this.state ](clock);
	
	// invincible timer
	if (this.invincible && (Effect.Game.logicClock >= this.invincibleEnd)) {
		this.invincible = false;
		this.show(true);
	}
	
	// tow chain
	if (this.tow) this.tow.follow(this);
};

Ship.prototype.logic_flyin = function(clock) {
	// fly towards mouse
	this.flyinCount++;
	if (this.flyinCount >= this.flyinDuration) {
		this.state = 'roam';
		this.collisions = true;
		this.invincible = true;
		this.invincibleEnd = clock + (3 * 45);
		this.requestShoot = false;
		this.requestBuy = false;
		this.leftMouseButtonDown = false;
		delete this.flyinPt;
		delete this.flyinCount;
	}
	this.logic_roam(clock);
};

Ship.prototype.logic_flyout = function(clock) {
	// fly away
	this.flyoutCount++;
	if (this.flyoutCount >= this.flyoutDuration) {
		this.state = 'idle';
		return;
	}
	this.logic_roam(clock);
};

Ship.prototype.logic_idle = function(clock) {
	// do nothing
};

Ship.prototype.logic_roam = function(clock) {
	// perform logic while standing idle
	
	// key presses
	if (this.state == 'roam') {
		if (this.requestShoot) this.shoot();
		else if (this.requestBuy) this.buy_powerup();
	}
	
	// update head of ship from mouse
	/* this.head.set(
		this.port.scrollX + this.unzoom( this.rawMouse.x ), 
		this.port.scrollY + this.unzoom( this.rawMouse.y )
	); */
	this.head.set( this.getRawMouse() );
	
	// set new position and rotation
	// (taildragger algorithm)
	this.tail = this.head.getPointFromProjection( this.head.getAngle(this.tail), 64 );
	var pt = this.head.getMidPoint( this.tail );
	pt.offset( -32, -37 );
	
	// calculate thrust based on movement
	this.thrust = pt.getDistance( new Point(this.x, this.y) );
	if (this.thrust > this.thrustMax) this.thrust = this.thrustMax;
	
	if (this.thrust > this.thrustVol) this.thrustVol++;
	else if (this.thrust < this.thrustVol) this.thrustVol--;
	if (this.thrustVol > this.thrustMax) this.thrustVol = this.thrustMax;
	else if (this.thrustVol < 0) this.thrustVol = 0;
	
	if (Effect.Audio.enabled && (Effect.Game.logicClock % 4 == 0)) {
		var thrustSound = Effect.Audio.getTrack('engine');
		if (thrustSound) {
			/*if (this.thrustVol > 0) {
				thrustSound.setVolume( (this.thrustVol / this.thrustMax) / 3 );
				if (!thrustSound.isPlaying()) thrustSound.play();
			}
			else {
				if (thrustSound.isPlaying()) thrustSound.stop();
			}*/
			
			var adjVol = (this.thrustVol / this.thrustMax) / 3;
			if (!this.lastAdjVol || (adjVol != this.lastAdjVol)) {
				thrustSound.setVolume( adjVol );
				this.lastAdjVol = adjVol;
			}
		}
	}
	
	this.xd = pt.x - this.x;
	this.yd = pt.y - this.y;
	
	this.rotate = 360 - (this.tail.getAngle(this.head) - 90);
	if (this.rotate < 0) this.rotate += 360;
	else if (this.rotate >= 360) this.rotate -= 360;
	
	// movement
	var newx = this.x + this.xd;
	var newy = this.y + this.yd;
	
	var hit = this.move();
	
	if (this.invincible) {
		// if invincible, move to destination regardless of solids in between
		this.x = newx;
		this.y = newy;
	}
	
	if (hit) this.handleHit(hit);
	
	// set frame
	this.setFrameX( Math.floor(60 * (this.rotate / 360)) );
};

Ship.prototype.logic_death = function() {
	// ship is dead
};

Ship.prototype.handleHit = function(hit) {
	// handle collision
	if (hit.target.onHit && !this.invincible) hit.target.onHit(this);
	else if (hit.target.type == 'Crystal') {
		// you can collect crystals while invincible
		this.powerUp('crystal', hit.target);
	}
	else if (hit.target.type == 'Buddy') {
		// you can collect buddies while invincible
		this.powerUp('option', hit.target);
	}
	if (hit.target.solid && !this.invincible && (hit.target.type != 'Rock')) {
		this.explode(hit.target);
		return;
	}
};

Ship.prototype.offset = function(xd, yd) {
	// move ship from port scroll
	// this is because ship is always moving with the level
	this.head.offset( xd, yd );
	this.tail.offset( xd, yd );
	this.rawMouse.offset( xd, yd );
	
	this.xd = xd;
	this.yd = yd;
	
	var newx = this.x + this.xd;
	var newy = this.y + this.yd;
	
	var hit = this.move();
	
	if (this.invincible) {
		// if invincible, move to destination regardless of solids in between
		this.x = newx;
		this.y = newy;
	}
	
	if (hit) this.handleHit(hit);
	
	// tow chain
	if (this.tow) this.tow.offset(xd, yd);
};

Ship.prototype.steal = function(obj) {
	// detach object from tow chain
	if (obj.type == 'Crystal') {
		this.crystals--;
		this.dirtyDisplay = true;
	}
	
	var parent_obj = this;
	var end = this.tow;
	while (end) {
		if (end.id == obj.id) {
			parent_obj.tow = end.tow;
			end.tow = null;
			return end;
		}
		parent_obj = end;
		end = end.tow;
	}
	return null;
};

Ship.prototype.shoot = function() {
	// shoot
	var pt = new Point( this.centerPointX(), this.centerPointY() );
	var deg = this.frameX * (360 / 60);
	var ang = ((360 - deg) + 90) % 360;
	pt.project( ang, this.powerups.laser ? 32 : 16 );
	
	Effect.Port.getPlane('particles').createSprite( 'ShipLaser', {
		cx: pt.x,
		cy: pt.y,
		rotate: deg,
		character: this,
		powerup: !!this.powerups.laser
	});
	
	Effect.Audio.playSound( this.powerups.laser ? "laser" : "photon" );
	this.requestShoot = false;
	
	if (this.tow) this.tow.shoot();
	
	if (this.powerups.rapid && this.leftMouseButtonDown && !this.noScheduleRapid) {
		// rapid fire
		var self = this;
		self.noScheduleRapid = true;
		Effect.Game.scheduleEvent( 6, function() { self.noScheduleRapid = false; self.requestShoot = true; } );
	}
};

Ship.prototype.addScore = function(amount) {
	// increase score
	this.score += amount;
	this.dirtyDisplay = true;
};

Ship.prototype.canReceiveHit = function() {
	// make sure character isn't in the middle of a special animation
	switch (this.state) {
		case 'roam':
			return 1; // yes
			break;
		default:
			return 0; // no
			break;
	}
};

Ship.prototype.powerUp = function(powerType, source) {
	// receive power-up
	if (this.state != 'death') switch (powerType) {
		case 'crystal':
			this.crystals++;
			this.score += 100;
			this.dirtyDisplay = true;
			this.beepIfPowerUpAvailable = true;
			
			Effect.Port.getPlane('particles').createSprite( 'Sparkle', {
				cx: source.centerPointX(),
				cy: source.centerPointY()
			});
			
			Effect.Audio.playSound( 'get_crystal' );
			
			// setup tow
			var end = this;
			while (end.tow) end = end.tow;
			end.tow = source;
			source.setup_tow(end);
			break;
		
		case 'rapid':
			this.score += 200;
			this.dirtyDisplay = true;
			break;
		
		case 'laser':
			this.score += 500;
			this.dirtyDisplay = true;
			break;
		
		case 'option':
			this.score += 1000;
			this.dirtyDisplay = true;
			
			if (!source) {
				source = Effect.Port.getPlane('sprites').createSprite( 'Buddy', {
					x: 0,
					y: 0
				});
			}
			else {
				Effect.Port.getPlane('particles').createSprite( 'Sparkle', {
					cx: source.centerPointX(),
					cy: source.centerPointY()
				});
			}
			
			Effect.Audio.playSound( 'get_option' );
			
			source.character = this;
			
			// setup tow
			var end = this;
			while (end.tow) end = end.tow;
			end.tow = source;
			source.setup_tow(end);
			break;
		
		case 'shields':
			this.powerups.shields = 1;
			this.score += 2000;
			this.dirtyDisplay = true;
			this.setImage( 'ship5-shields.png' );
			this.shieldHitCount = 3;
			break;
	}
};

Ship.prototype.get_best_powerup = function() {
	// find best powerup based on our crystals, and which powerups we already have
	var best_powerup = null;
	var best_cost = 0;
	for (var powerup_id in this.powerup_map) {
		var cost = this.powerup_map[powerup_id];
		if ((this.crystals >= cost) && (cost > best_cost) && (!this.powerups[powerup_id] || (this.allow_mult_powerups[powerup_id]))) {
			best_powerup = powerup_id;
			best_cost = cost;
		}
	}
	return best_powerup;
};

Ship.prototype.buy_powerup = function() {
	// buy powerup
	this.requestBuy = false;
	var best_powerup = this.get_best_powerup();
	
	if (best_powerup && (this.state != 'death')) {
		var cost = this.powerup_map[best_powerup];
		
		while (cost) {
			var parent_obj = this;
			var end = this.tow;
			while (end) {
				if (end.type == 'Crystal') {
					parent_obj.tow = end.tow;
					end.tow = null;
					end.destroy();
					break;
				}
				parent_obj = end;
				end = end.tow;
			}
			
			this.crystals--;
			cost--;
		}
		
		this.dirtyDisplay = true;
		this.powerUp( best_powerup );
		
		this.powerups[ best_powerup ] = 1;
		
		Effect.Audio.playSound( 'buy_powerup.mp3' );
		
		this.lastBestPowerup = '';
	}
};

Ship.prototype.explode = function(source) {
	// Debug.trace('Ship', "This exploded us: " + dumper(source));
	if (this.state == 'death') return;
	
	// ship died
	Effect.Port.getPlane('particles').createSprite( 'Explosion', {
		cx: this.centerPointX(),
		cy: this.centerPointY(),
		size: 128,
		frameDelta: 0.5,
		character: this
	});
	
	CrystalGalaxy.create_debris({
		debrisClass: 'ship',
		cx: this.centerPointX(),
		cy: this.centerPointY(),
		amount: 32,
		scatter: 64,
		distance: 12
	});
	
	Effect.Audio.playSound('ship_explosion');
	
	var thrustSound = Effect.Audio.getTrack('engine');
	if (thrustSound) thrustSound.setVolume(0);
	
	this.state = 'death';
	this.collisions = false;
	this.hide();
	this.invincible = false;
	
	// make sure tow chain is detached
	if (this.tow) this.tow.detach_tow();
	this.tow = null;
	this.crystals = 0;
	this.powerups = {};
	this.lastBestPowerup = '';
	
	// remove shields, if applicable
	this.setImage( 'ship5.png' );
	
	this.lives--;
	if (CrystalGalaxy.gameMode == 'survival') {
		this.lives = 0; // only one life for survival mode
		this.survivalScore = Math.floor( (Effect.Game.logicClock - CrystalGalaxy.logicStart) / 45 );
	}
	this.update_hud();
	
	if (this.lives > 0) {
		var self = this;
		Effect.Game.scheduleEvent( 45 * 1, function() { Effect.Audio.playSound( 'respawn.mp3' ); } );
		Effect.Game.scheduleEvent( 45 * 2, function() { self.start_flyin(); } );
	}
	else {
		// game over
		CrystalGalaxy.scroll_behavior.targetDist = 0; // stop scrolling
		
		// remove hud sprites
		var hplane = Effect.Port.getPlane('huds');
		hplane.deleteAll();
		
		// fade out music
		var music_id = Effect.Game.getLevelProps().music;
		if (music_id) Effect.Audio.getTrack( music_id ).fadeOut( 45 * 2 );
		
		// set timer to show game over banner
		var self = this;
		Effect.Game.scheduleEvent( 45 * 3, function() { self.game_over(); } );
	}
};

Ship.prototype.game_over = function() {
	// show game over banner
	Effect.Port.showCursor();
	
	var hplane = Effect.Port.getPlane('huds');
	
	hplane.createSprite( StaticImageSprite, {
		url: '/images/interface/game_over_bkgnd.png',
		x: -800,
		y: 180
	} )	.tween({
		delay: 0,
		duration: 45 * 3,
		mode: 'EaseOut',
		algorithm: 'Quintic',
		properties: {
			x: { start: -800, end: 0 }
		}
	});
	
	hplane.createSprite( StaticImageSprite, {
		id: 'game_over',
		url: '/images/interface/game_over_title.png',
		x: 800,
		y: 240,
		zIndex: hplane.zIndex + 1
	} ).tween({
		delay: 0,
		duration: 45 * 3,
		mode: 'EaseOut',
		algorithm: 'Quintic',
		properties: {
			x: { start: 800, end: 74 }
		}
	});
	
	Effect.Audio.playSound( 'game_over.mp3' );
	
	if (CrystalGalaxy.gameMode == 'survival') {
		// show score, and buttons for tweet and title
		this.clickToTweet = true;
		var self = this;
		Effect.Game.scheduleEvent( 45 * 5, function() { self.show_tweet(); } );
	}
	else if (CrystalGalaxy.gameMode == 'standard') {
		this.clickToTitle = true;
		Effect.Game.scheduleEvent( 45 * 10, function() { CrystalGalaxy.return_to_title(); } );
	}
};

Ship.prototype.show_tweet = function() {
	// show tweet controls
	delete this.clickToTweet;
	Effect.Game.clearSchedule();
	Effect.Audio.playSound( 'high_score' );
	
	var hplane = Effect.Port.getPlane('huds');
	
	// move game over out of the way
	hplane.getSprite('game_over').lastTween.destroyed = 1;
	hplane.getSprite('game_over').tween({
		delay: 0,
		duration: 45 * 2,
		mode: 'EaseOut',
		algorithm: 'Quintic',
		properties: {
			x: { start: 74, end: -652 }
		}
	});
	
	// create HUD sprite for final score display
	var finalScore = this.survivalScore;
	var text = "CONGRATULATIONS! YOU SURVIVED FOR " + finalScore + " SECONDS!";
	var msg = new TextSprite();
	msg.setZIndex( 91 ); // above everything else
	msg.setFont( 'digitaldream' );
	msg.setTableSize( text.length, 1 );
	msg.setTracking( 1.0, 1.0 );
	msg.setPosition( 800, 230 );
	hplane.attach(msg);
	msg.setString( 0, 0, text );
	msg.tween({
		delay: 0,
		duration: 45 * 2,
		mode: 'EaseOut',
		algorithm: 'Quintic',
		properties: {
			x: { start: 800, end: (Effect.Port.portWidth / 2) - ((text.length * 16) / 2) }
		}
	});
	
	// create 'back' and 'tweet' buttons
	hplane.createSprite( 'TitleButton', {
		url: 'button_back.png',
		x: 800,
		y: 295,
		zIndex: hplane.zIndex + 1,
		onMouseUp: function() {
			CrystalGalaxy.return_to_title();
			Effect.Audio.playSound( 'click' );
		}
	} ).tween({
		delay: 0,
		duration: 45 * 2,
		mode: 'EaseOut',
		algorithm: 'Quintic',
		properties: {
			x: { start: 800, end: 180 }
		}
	}).captureMouse();
	
	hplane.createSprite( 'TitleButton', {
		url: 'button_tweet.png',
		x: 1020,
		y: 295,
		zIndex: hplane.zIndex + 1,
		onMouseUp: function() {
			var tweet = "I survived for " + finalScore + " seconds in Crystal Galaxy: " + location.href;
			window.open('http://twitter.com/home?status=' + encodeURIComponent(tweet));
			Effect.Audio.playSound( 'click' );
		}
	} ).tween({
		delay: 0,
		duration: 45 * 2,
		mode: 'EaseOut',
		algorithm: 'Quintic',
		properties: {
			x: { start: 1020, end: 400 }
		}
	}).captureMouse();
};

Ship.prototype.onHit = function(source) {
	// something else hit us
	if (this.invincible) return;
	
	switch (source.category) {
		case 'enemy':
		case 'projectile':
		case 'boss':
			if (this.canReceiveHit() && (!source.character)) {
				// death or shield failure
				if (this.powerups.shields) {
					this.shieldHitCount--;
					if (this.shieldHitCount < 1) {
						delete this.powerups.shields;
						this.setImage( 'ship5.png' );
						Effect.Audio.playSound( 'lose_shields.mp3' );
					}
				}
				else {
					this.explode(source);
				}
				// stop music and play death march
				// Effect.Game.getLevelMusic().stop();
				// Effect.Audio.playSound( 'music_die' );
			} // canReceiveHit
			break;
	} // switch category
};

// event handling
// only update state, wait until logic() to do anything

Ship.prototype.mouse_down = function(pt, buttonNum) {
	if (this.state == 'roam') {
		if (buttonNum == Effect.LEFT_BUTTON) {
			this.requestShoot = true;
			this.leftMouseButtonDown = true;
		}
		else if (buttonNum == Effect.RIGHT_BUTTON) this.requestBuy = true;
	}
	else if (this.state == 'death') {
		if (this.clickToTitle) {
			delete this.clickToTitle;
			CrystalGalaxy.return_to_title();
		}
		else if (this.clickToTweet) {
			delete this.clickToTweet;
			this.show_tweet();
		}
	}
};

Ship.prototype.mouse_up = function(pt, buttonNum) {
	if (buttonNum == Effect.LEFT_BUTTON) {
		this.leftMouseButtonDown = false;
	}
};

Ship.prototype.mouse_move = function(pt) {
	this.rawMouse = pt;
};

Ship.prototype.update_hud = function() {
	// update hud
	var hud = Effect.Port.getPlane('huds').getSprite('hud');
	if (hud) {
		hud.setString( 0, 0, "!x" );
		hud.setPadInt( 2, 0, this.crystals, 2 );
		
		// display the next powerup
		var best_powerup = this.get_best_powerup();
		if (best_powerup) {
			var cost = this.powerup_map[best_powerup];
			hud.setString( 5, 0, "- " + best_powerup + " x0" + cost );
			
			if (this.beepIfPowerUpAvailable) {
				this.beepIfPowerUpAvailable = false;
				if (this.lastBestPowerup != best_powerup) {
					Effect.Audio.playSound( 'powerup_available.mp3' );
				}
			}
			
			this.lastBestPowerup = best_powerup;
		}
		else {
			hud.setString( 5, 0, "             " );
		}
		
		if (CrystalGalaxy.gameMode == 'standard') {
			if (this.lives <= 5) {
				var str = '';
				for (var idx = 0; idx < this.lives; idx++) str += '"';
				while (str.length < 5) str = ' ' + str;
				hud.setString( 33, 0, str );
			}
			else {
				hud.setString( 33, 0, '"x' );
				hud.setPadInt( 35, 0, Math.min(this.lives, 99), 2 );
				hud.setString( 37, 0, ' ' );
			}
	
			hud.setPadInt( 39, 0, this.score, 9 );
		}
		else if (CrystalGalaxy.gameMode == 'survival') {
			var sec = Math.floor( (Effect.Game.logicClock - CrystalGalaxy.logicStart) / 45 );
			hud.setString( 38, 0, "TIME:" );
			hud.setPadInt( 44, 0, sec, 4 );
		}
	}
};

Ship.prototype.draw = function(clock) {
	// override built-in Sprite.draw() function to flicker character
	// if he just got hit by an enemy
	if (this.invincible && (this.state == 'roam')) this.show( clock % 2 );
	
	// VERY IMPPORTANT: call parent draw() function
	this.__parent.draw.call(this);
};
////
// ShipLaser.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'ShipLaser', {
	url: 'fx/laser1-16.png',
	width: 16,
	height: 16,
	collisions: true,
	dieOffscreen: true,
	
	category: 'projectile',
	maxDelta: 16
} );

ShipLaser.prototype.setup = function() {
	// override sprite init
	// this.require('cx', 'cy');
	
	if (this.powerup) {
		this.width = 64;
		this.height = 64;
		this.setImage( 'laser-thin.png' );
		this.x = this.cx - 32;
		this.y = this.cy - 32;
		this.hitRect = new Rect(16, 16, 48, 48);
	}
	else {
		this.x = this.cx - 8;
		this.y = this.cy - 8;
	}
	
	this.xd = Math.cos( DECIMAL_TO_RADIANS( (this.rotate - 90) % 360) ) * this.maxDelta;
	this.yd = Math.sin( DECIMAL_TO_RADIANS( (this.rotate - 90) % 360) ) * this.maxDelta;
	this.setFrameX( Math.floor( ((this.rotate % 180) / 180) * 30 ) );
};

ShipLaser.prototype.logic = function() {
	// movement
	var newx = this.x + this.xd;
	var hit = this.move(this.xd, 0, Effect.Port.getPlane('sprites'));
	this.x = newx;
	
	if (hit && (hit.target.type != 'Ship')) {
		if (hit.target.onHit) hit.target.onHit(this);
		if (hit.target.solid || (hit.target.category == 'enemy')) {
			this.give_score(hit);
			if (!this.powerup || (hit.target.solid && (hit.target.category != 'orb'))) {
				this.explode();
				return;
			}
		}
	}
	
	var newy = this.y + this.yd;
	var hit = this.move(0, this.yd, Effect.Port.getPlane('sprites'));
	this.y = newy;
	
	if (hit && (hit.target.type != 'Ship')) {
		if (hit.target.onHit) hit.target.onHit(this);
		if (hit.target.solid || (hit.target.category == 'enemy')) {
			this.give_score(hit);
			if (!this.powerup || (hit.target.solid && (hit.target.category != 'orb'))) {
				this.explode();
				return;
			}
		}
	}
};

ShipLaser.prototype.give_score = function(hit) {
	if ((hit.target.destroyed || (hit.target.state == 'death')) && hit.target.score) {
		this.character.score += hit.target.score;
		this.character.dirtyDisplay = true;
	}
};

ShipLaser.prototype.onHit = function(source) {
	// something hit us
	
};

ShipLaser.prototype.explode = function() {
	// end of life for us
	this.plane.createSprite( 'Ricochet', {
		x: this.centerPointX() - 16,
		y: this.centerPointY() - 16
	});
	
	// Effect.Audio.playSound( 'hit' );
	
	this.destroy();
};

////
// ShipThrust.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'ShipThrust', {
	url: 'fx/flame2.png',
	width: 32,
	height: 32,
	
	offsetAngle: 0,
	offsetDistance: 0
} );

ShipThrust.prototype.setup = function() {
	// override sprite init
	// this.require('character');
	
	this.pt = new Point(0, 0);

	// set sprite members
	this.setZIndex( this.character.zIndex - 1 ); // under character
};

ShipThrust.prototype.logic = function() {
	// logic loop
};

ShipThrust.prototype.draw = function() {
	// draw sprite
	this.setFrameX( Math.floor(64 * (((this.character.rotate + 180) % 360) / 360)) );
	this.setFrameY( Effect.Game.drawClock % 2 );
	
	if (this.character.thrust && !this.visible) this.show();
	else if (!this.character.thrust && this.visible) this.hide();
	
	if (!this.character.visible && this.visible) this.hide();
	
	this.pt.set( this.character.centerPointX(), this.character.centerPointY() );
	var deg = this.character.frameX * (360 / this.character.maxFrames);
	var ang = ((360 - deg) + 270) % 360;
	this.pt.project( ang, 30 + (this.character.thrust * 1) );
	
	if (this.offsetDistance) {
		// ship has 3D style rotation, so vary distance from each thrust by comparing angle to 0 and 180
		var oDist = this.offsetDistance;
				
		if (deg >= 0 && deg < 90) oDist *= (deg / 90);
		else if (deg >= 90 && deg < 180) oDist *= ((90 - (deg % 90)) / 90);
		else if (deg >= 180 && deg < 270) oDist *= ((deg % 90) / 90);
		else oDist *= ((90 - (deg % 90)) / 90);
		
		this.pt.project( ang + this.offsetAngle, this.offsetDistance - oDist );
	}
	
	this.x = this.pt.x - 16;
	this.y = this.pt.y - 16;
	
	Sprite.prototype.draw.call(this);
};

////
// Sparkle.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Sparkle', {
	url: 'fx/sparkle3-64.png',
	width: 64,
	height: 64,
	dieOffscreen: true,
	
	counter: 0,
	size: 64
} );

Sparkle.prototype.setup = function() {
	// override sprite init
	if (this.size) {
		this.width = this.size;
		this.height = this.size;
		this.setImage( 'fx/sparkle3-' + this.size + '.png' );
	}
	
	if (this.cx && this.cy) {
		this.x = this.cx - (this.width / 2);
		this.y = this.cy - (this.height / 2);
	}
	
	this.setZIndex( this.plane.zIndex + 1 ); // above other sprites
};

Sparkle.prototype.logic = function() {
	// logic loop
	this.setFrameX( this.counter );
	this.counter++;
	if (this.counter > 7) this.destroy();
};

////
// Sphere.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Sphere', {

	url: '/images/objects/mirror_sphere.png',
	width: 64,
	height: 64,
	hitRect: new Rect(8, 8, 56, 56),
	collisions: true,
	dieOffscreen: true,
	
	category: 'enemy',
	energy: 4,
	behavior: '',
	groupId: '',
	deltaMax: 0,
	deltaDir: 0,
	score: 100,
	
	setup: function() {
		if (this.groupId) {
			this.group = CrystalGalaxy.spriteGroups[ this.groupId ];
		}
		
		this.energy = parseInt( this.energy, 10 );
		this.deltaMax = parseFloat( this.deltaMax );
		this.deltaDir = parseFloat( this.deltaDir );
		
		this.score = this.energy * 100;
		
		// remove from aether, so we die normally
		this.removeFromAether();
	},
	
	logic: function(clock) {
		if (this.behavior) this[ 'logic_' + this.behavior ](clock);
		
		if (clock % 3 == 0) {
			this.setFrameX( this.frameX + 1 );
			if (this.frameX >= 16) this.setFrameX( 0 );
		}
	},
	
	logic_wavev: function(clock) {
		// wave vertically
		this.yd += this.deltaDir;
		if (Math.abs(this.yd) > this.deltaMax) this.deltaDir *= -1;
		
		var hit = this.move();
		if (hit) {
			if (hit.target.onHit) hit.target.onHit(this);
			if (hit.target.solid || ((hit.target.category == 'character') && !hit.target.invincible)) {
				this.explode();
				return null;
			}
		}
	},
	
	logic_trig: function(clock) {
		this.angle = (this.angle + this.angleDelta) % 360;
		this.distance += this.distanceDelta;
		if (this.distance <= 0) this.distanceDelta *= -1;
		
		var pt = this.plane.getScreenRect().centerPoint().project( this.angle, this.distance ).offset(-32, -32);
		this.xd = pt.x - this.x;
		this.yd = pt.y - this.y;
		
		var hit = this.move();
		if (hit) {
			if (hit.target.onHit) hit.target.onHit(this);
			if (hit.target.solid || ((hit.target.category == 'character') && !hit.target.invincible)) {
				this.explode();
				return null;
			}
		}
	},
	
	onHit: function(source) {
		// something hit us
		switch (source.category) {
			case 'character':
				// send hit back to character
				source.onHit(this);
				break;
			case 'projectile':
				this.energy--;
				if (!this.energy) this.explode();
				else {
					Effect.Audio.playSound( 'hit_enemy' );
				}
				break;
		} // switch type
	},
	
	explode: function() {
		// end of life for us
		/* Effect.Port.getPlane('particles').createSprite( 'Explosion', {
			x: this.centerPointX() - 32,
			y: this.centerPointY() - 32
		}); */
		
		CrystalGalaxy.create_debris({
			debrisClass: 'sphere',
			cx: this.centerPointX(),
			cy: this.centerPointY(),
			amount: 20,
			scatter: 32,
			distance: 6
		});

		// Effect.Audio.playSound( 'explosion64' );
		Effect.Audio.playSound( 'smash_glass.mp3' );

		this.destroy();

		if (this.group && this.group.remain) {
			this.group.remain--;
			if (!this.group.remain) {
				// all of group are dead -- bonus spawn?  crystal?

				this.plane.createSprite( 'Crystal', {
					x: this.centerPointX() - (Crystal.prototype.width / 2),
					y: this.centerPointY() - (Crystal.prototype.height / 2)
				});
			}
		}
	}
	
} );

////
// TeslaCoil.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'TeslaCoil', {

	url: 'buoy.png',
	width: 64,
	height: 64,
	collisions: true,
	solid: false,
	hitRect: new Rect(8, 8, 56, 56),
	dieOffscreen: true,
	
	category: 'enemy',
	energy: 10,
	score: 1000,
	angle: 0,
	angleDelta: 2,
	numBolts: 3,
	
	setup: function() {
		// create some lightning
		this.angle = parseFloat( this.angle );
		this.angleDelta = parseFloat( this.angleDelta );
		this.numBolts = parseInt( this.numBolts, 10 );
		
		this.lightning = [];
		var centerPt = this.centerPoint();
		
		for (var idx = 0; idx < this.numBolts; idx++) {
			var pt = centerPt.clone().project( this.angle, 64 + (idx * 112) );
			var bolt = this.plane.createSprite( 'Lightning', {
				x: pt.x - 64,
				y: pt.y - 64,
				angle: this.angle,
				coil: this
			} );
			this.lightning.push( bolt );
		}
		
		this.removeFromAether();
	},
	
	logic: function(clock) {
		this.x += this.xd;
		this.y += this.yd;
		
		if (clock % 3 == 0) {
			this.setFrameX( this.frameX + 1 );
			if (this.frameX >= 32) this.setFrameX( 0 );
		}
		
		this.angle += this.angleDelta;
		if (this.angle >= 360) this.angle -= 360;
		else if (this.angle < 0) this.angle += 360;
		
		var centerPt = this.centerPoint();
		
		for (var idx = 0; idx < this.numBolts; idx++) {
			var bolt = this.lightning[idx];
			var pt = centerPt.clone().project( this.angle, 64 + (idx * 112) );
			bolt.angle = this.angle;
			bolt.xd = (pt.x - 64) - bolt.x;
			bolt.yd = (pt.y - 64) - bolt.y;
		}
		
		CrystalGalaxy.requestSound.lightning1 = 1;
	},
	
	onHit: function(source) {
		// something hit us
		switch (source.category) {
			case 'character':
				// send hit back to character
				source.onHit(this);
				break;
			case 'projectile':
				this.energy--;
				if (!this.energy) this.explode();
				else {
					Effect.Audio.playSound( 'hit_enemy' );
				}
				break;
		} // switch type
	},
	
	explode: function() {
		Effect.Port.getPlane('particles').createSprite( 'Explosion', {
			x: this.centerPointX() - 64,
			y: this.centerPointY() - 64,
			size: 128,
			explosionType: 'explosion4',
			frameDelta: 0.35
		});

		CrystalGalaxy.create_debris({
			debrisClass: 'ship',
			cx: this.centerPointX(),
			cy: this.centerPointY(),
			amount: 32,
			scatter: 32,
			distance: 6
		});

		Effect.Audio.playSound( 'explosion64' );
		
		this.plane.createSprite( 'Crystal', {
			x: this.centerPointX() - (Crystal.prototype.width / 2),
			y: this.centerPointY() - (Crystal.prototype.height / 2)
		});
		
		this.destroy();
	},
	
	destroy: function() {
		// destroy lightning
		for (var idx = 0; idx < this.numBolts; idx++) {
			this.lightning[idx].destroy();
		}
		
		// call super's destroy
		Sprite.prototype.destroy.call(this);
	}
	
} );

////
// Tiles.js
// Tile Objects
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Tile.extend( 'Ground', {
	collisions: true,
	solid: true
} );

Tile.extend( 'HalfHoriz', {
	collisions: true,
	solid: false,
	
	onHit: function(source) {
		
	}
} );

Tile.extend( 'Orbs', {
	collisions: false,
	solid: false,
	category: 'orb',
	ready: false,
	
	onScreen: function() {
		this.solid = true;
		this.collisions = true;
		this.ready = true;
	},
	
	onHit: function(source) {
		// convert tile to sprites
		if (this.ready && (source.type == 'ShipLaser')) {
			var tile = this.plane.lookupTile( this.tx, this.ty );
			if (tile.match(/\?/)) tile = tile.replace(/\?.+$/, '');
			else tile = 0;
		
			this.plane.setTile( this.tx, this.ty, tile, false );
			this.plane.setTile( this.tx, this.ty, null, true );
		
			var x = this.tx * this.plane.tileSizeX;
			var y = this.ty * this.plane.tileSizeY;
			var sourceRect = source.getRect();
		
			for (var py = 0; py < 2; py++) {
				for (var px = 0; px < 2; px++) {
					var orb = this.plane.spritePlane.createSprite( 'Orb', {
						x: x + (px * 32),
						y: y + (py * 32)
					} );
					if (orb.getRect().rectIn( sourceRect )) orb.pop();
				} // px loop
			} // py loop
		}
	}
} );

Tile.extend( 'ScrollBehavior', {
	collisions: false,
	solid: false,
	
	onScreen: function() {
		CrystalGalaxy.scroll_behavior.targetAngle = parseFloat( this.targetAngle );
		CrystalGalaxy.scroll_behavior.targetDist = parseFloat( this.targetDist );
	}
} );

Tile.extend( 'Message', {
	collisions: false,
	solid: false,
	
	onScreen: function() {
		CrystalGalaxy.show_message( this.text );
	}
} );

////
// TitleButton.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'TitleButton', {

	url: 'button_new_game.png',
	width: 220,
	height: 28,
	
	setup: function() {
		// create glow sprites
		this.glow_top = this.plane.createSprite( StaticImageSprite, {
			url: '/images/title/button_glow_top.png', 
			x: this.x, 
			y: this.y - 21, 
			zIndex: this.zIndex,
			button: this,
			draw: function() {
				this.x = this.button.x;
				this.y = this.button.y - 21;
				Sprite.prototype.draw.call(this);
			}
		} );
		this.glow_bottom = this.plane.createSprite( StaticImageSprite, {
			url: '/images/title/button_glow_bottom.png', 
			x: this.x, 
			y: this.y + 28, 
			zIndex: this.zIndex,
			button: this,
			draw: function() {
				this.x = this.button.x;
				this.y = this.button.y + 28;
				Sprite.prototype.draw.call(this);
			}
		} );
	},
	
	onMouseOver: function() {
		this.setFrameX(1);
		Effect.Audio.playSound( 'rollover.mp3' );
	},
	
	onMouseOut: function() {
		this.setFrameX(0);
	}
	
} );

////
// Turret.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'Turret', {
	
	url: 'turret.png',
	width: 48,
	height: 48,
	hitRect: new Rect(8, 8, 40, 40),
	collisions: true,
	solid: false,
	
	category: 'enemy',
	energy: 5,
	angle: 0,
	shotTimer: 0,
	score: 500,
	
	setup: function() {
		this.angle = parseFloat( this.angle );
		switch (this.angle) {
			case 0: this.setFrameY(1); break;
			case 90: this.setFrameY(0); break;
			case 180: this.setFrameY(3); break;
			case 270: this.setFrameY(2); break;
		}
		this.mod = Math.floor( Math.random() * 8 );
	},
	
	logic: function(clock) {
		if (clock % 3 == 0) {
			if (this.frameX > 0) this.setFrameX( this.frameX - 1 );
		}
		
		if (!this.shotTimer && (clock % 8 == this.mod)) {
			// check if player is in range
			var player = this.plane.getSprite('player');
			var ang = this.centerPoint().getAngle( player.centerPoint() );
			if (Math.abs( this.angle - ang ) < 20) {
				// shoot!
				var pt = this.centerPoint().clone().project( this.angle, 32 );

				Effect.Port.getPlane('particles').createSprite( 'TurretLaser', {
					x: pt.x - 16,
					y: pt.y - 16,
					angle: this.angle
				});

				Effect.Audio.playSound( "turret_shoot" );
				
				this.shotTimer = 45;
				this.setFrameX( 5 );
			}
		}
		if (this.shotTimer) this.shotTimer--;
	},
	
	onHit: function(source) {
		// something hit us
		switch (source.category) {
			case 'character':
				// send hit back to character
				source.onHit(this);
				break;
			case 'projectile':
				this.energy--;
				if (!this.energy) this.explode();
				else {
					Effect.Audio.playSound( 'hit_enemy' );
				}
				break;
		} // switch type
	},
	
	explode: function() {
		// end of life for us
		Effect.Port.getPlane('particles').createSprite( 'Explosion', {
			x: this.centerPointX() - 32,
			y: this.centerPointY() - 32
		});
		
		CrystalGalaxy.create_debris({
			debrisClass: 'ship',
			cx: this.centerPointX(),
			cy: this.centerPointY(),
			amount: 8,
			scatter: 32,
			distance: 6
		});

		Effect.Audio.playSound( 'explosion64' );

		this.destroy();
		
		this.plane.createSprite( 'Crystal', {
			x: this.centerPointX() - (Crystal.prototype.width / 2),
			y: this.centerPointY() - (Crystal.prototype.height / 2)
		});
	}
	
} );

////
// TurretLaser.js
// Sprite Object
// 
// Crystal Galaxy
// Effect Games LLC
// Copyright (c) 2005 - 2009 Joseph Huckaby
////

Sprite.extend( 'TurretLaser', {
	
	url: 'laser1-32.png',
	width: 32,
	height: 32,
	hitRect: new Rect(8, 8, 24, 24),
	collisions: true,
	dieOffscreen: true,
	
	angle: 0,
	maxDelta: 4,
	category: 'projectile',
	
	setup: function() {
		var pt = (new Point()).project( this.angle, this.maxDelta );
		this.xd = pt.x;
		this.yd = pt.y;
		
		// this.xd = Math.cos( DECIMAL_TO_RADIANS( (this.angle) % 360) ) * this.maxDelta;
		// this.yd = Math.sin( DECIMAL_TO_RADIANS( (this.angle) % 360) ) * this.maxDelta;
		
		var rotate = this.angle - 90;
		if (rotate < 0) rotate += 360;
		this.setFrameX( Math.floor( ((rotate % 180) / 180) * 32 ) );
	},
	
	logic: function(clock) {
		var hit = this.move(this.xd, this.yd, Effect.Port.getPlane('sprites'), Effect.Port.getPlane('tiles'));
		if (hit) {
			if (hit.target.solid) {
				this.explode();
			}
			else if (hit.target.category == 'character') {
				hit.target.onHit(this);
				this.explode();
			}
		}
	},
	
	onHit: function(source) {
		// something hit us
	},

	explode: function() {
		// end of life for us
		this.plane.createSprite( 'Ricochet', {
			x: this.x,
			y: this.y
		});

		// Effect.Audio.playSound( 'hit' );

		this.destroy();
	}	
	
} );

// Crystal Galaxy
// Effect Games LLC
// Version: 1.0b
// Author: Joseph Huckaby
// Copyright (c) 2009 Effect Games LLC

Effect.Game.addEventListener( 'onLoadGame', function() {
	// setup our game
	
	// load title screen
	Effect.Game.loadLevel( 'TitleScreen', CrystalGalaxy.do_title_screen );
	
	// Hook the 'start' key for pausing and resuming the game
	// or starting a new game if we're on the title screen "level"
	Effect.Game.setKeyHandler('start', {
		onKeyDown: function() {
			if (Effect.Game.getState() == 'title') CrystalGalaxy.start_new_game();
			else Effect.Game.pause();
		}
	} );
	Effect.Game.setResumeKey( 'start' );
	
	// Hook the pause and resume events so we can control the music and play a pause sound
	Effect.Game.addEventListener( 'onPause', function() {
		Effect.Audio.quiet();
		Effect.Audio.playSound( 'pause_resume.mp3' );
		
		var splane = Effect.Port.getPlane('sprites');
		if (splane) {
			var player = splane.getSprite('player');
			if (player) player.leftMouseButtonDown = false;
		}
	} );
	
	Effect.Game.addEventListener( 'onResume', function() {
		Effect.Audio.playSound( 'pause_resume.mp3' );
		
		if (Effect.Game.getState() == 'run') Effect.Audio.getTrack('engine').play();
		
		// fade music back in over 45 frames, to not overwhelm the sound effect
		var music_id = Effect.Game.getLevelProps().music;
		if (music_id) Effect.Audio.getTrack( music_id ).fadeIn( 45 );
		
		var splane = Effect.Port.getPlane('sprites');
		if (splane) {
			var player = splane.getSprite('player');
			if (player) player.leftMouseButtonDown = false;
		}
	} );
	
	// finally, if the user has disabled, then re-enabled music, we have to resume the track
	Effect.Game.addEventListener( 'onEnableMusic', function() {
		var music_id = Effect.Game.getLevelProps().music;
		if (music_id) Effect.Audio.getTrack( music_id ).play();
	} );
	
	// more event hooks
	Effect.Game.setStateHandler( 'title', function(clock) {
		// Effect.Port.setBackgroundOffset( clock, 0 );
	} );
	
	Effect.Game.setStateHandler( 'run', function(clock) {
		// handle autoscroll
		var b = CrystalGalaxy.scroll_behavior;
		var splane = Effect.Port.getPlane('sprites');
		if (!splane) return;
		var player = splane.getSprite('player');
		
		if (CrystalGalaxy.gameMode == 'standard') {
			// b.angle += ((b.targetAngle - b.angle) / b.angleEase);
			b.angle = b.targetAngle;
		
			b.distance += ((b.targetDist - b.distance) / b.distEase);
		
			b.scroll.project( b.angle, b.distance );

			var pt = b.scroll.clone().floor();
			player.offset( pt.x - Effect.Port.scrollX, pt.y - Effect.Port.scrollY ); // counteract scroll affect on ship
			Effect.Port.setScroll( pt.x, pt.y );
		}
		
		if (player.dirtyDisplay) {
			// update HUD
			player.update_hud();
			player.dirtyDisplay = false;
		}
		
		// handle sound loops
		var snds = CrystalGalaxy.requestSound;
		for (var key in snds) {
			var track = Effect.Audio.getTrack(key);
			if (snds[key]) {
				if (!track.isPlaying()) {
					Debug.trace('cg', "There is a request to play audio track " + key + " and it is not currently playing, so calling play() on it now");
					track.play();
				}
				snds[key] = 0;
			}
			else {
				if (track.isPlaying()) {
					Debug.trace('cg', "There is no longer a need to play audio track " + key + " but it is still playing, so calling stop() on it now");
					track.stop();
				}
				delete snds[key];
			}
		}
		
		// survival mode
		if (CrystalGalaxy.gameMode == 'survival') {
			// spawn stuff, increasing probability
			if (clock % 45 == 0) {
				CrystalGalaxy.survival_idle();
			}
		} // survival
	} ); // run state handler (logic)
	
	/* Effect.Game.addEventListener( 'onMouseMove', function(pt) {
		Debug.trace("Game.onMouseMove: " + dumper(pt));
	} ); */
	
	Effect.Game.addEventListener( 'onMouseMove', function(globalPt) {
		// Debug.trace("Port.onMouseMove: " + dumper(pt));
		var pt = Effect.Port.getMouseCoords( true );
		if (pt.x < Effect.Port.scrollX) pt.x = Effect.Port.scrollX;
		else if (pt.x >= Effect.Port.scrollX + Effect.Port.portWidth) pt.x = (Effect.Port.scrollX + Effect.Port.portWidth) - 1;
		if (pt.y < Effect.Port.scrollY) pt.y = Effect.Port.scrollY;
		else if (pt.y >= Effect.Port.scrollY + Effect.Port.portHeight) pt.y = (Effect.Port.scrollY + Effect.Port.portHeight) - 1;
		
		CrystalGalaxy.lastMousePt = pt;
		if (Effect.Game.getState() == 'run') {
			Effect.Port.getPlane('sprites').getSprite('player').mouse_move(pt);
		}
	} );
	
	Effect.Port.addEventListener( 'onMouseDown', function(pt, buttonNum) {
		if (Effect.Game.getState() == 'run') {
			Effect.Port.getPlane('sprites').getSprite('player').mouse_down(pt, buttonNum);
		}
	} );
	
	Effect.Port.addEventListener( 'onMouseUp', function(pt, buttonNum) {
		if (Effect.Game.getState() == 'run') {
			Effect.Port.getPlane('sprites').getSprite('player').mouse_up(pt, buttonNum);
		}
	} );
	
	Effect.Game.addEventListener( 'onKeyDown', function(name, code) {
		if (Effect.Game.getState() == 'title') {
			var c = CrystalGalaxy;
			if ((c.konamiIdx < c.konamiCodes.length) && (code == c.konamiCodes[c.konamiIdx])) {
				c.konamiIdx++;
				if (c.konamiIdx >= c.konamiCodes.length) {
					Effect.Audio.playSound( 'get_option' );
				}
			}
		}
	} );
} );

var CrystalGalaxy = {
	
	konamiCodes: [38, 38, 40, 40, 37, 39, 37, 39, 66, 65],
	konamiIdx: 0,
	
	lastMousePt: new Point(),
	rockSizes: [32, 64, 96],
	rockClasses: ['a', 'b', 'c', 'd'],
	
	spriteGroups: {},
	
	requestSound: {},
	
	scroll_behavior: {
		scroll: new Point(),
		angle: 0,
		distance: 0,
		targetAngle: 0,
		angleEase: 32,
		targetDist: 0,
		distEase: 32
	},
	
	do_title_screen: function() {
		// title screen is now loaded
		Effect.Game.clearSchedule();
		Effect.Game.setState( 'title' );
		Effect.Port.setScroll( 0, 0 );
		
		var splane = Effect.Port.getPlane('sprites');
		if (!splane) {
			splane = new SpritePlane('sprites');
			splane.zIndex = 2;
			Effect.Port.attach(splane);
		}
		
		var bplane = Effect.Port.getPlane('bkgnd');
		if (!bplane) {
			bplane = new SpritePlane('bkgnd');
			bplane.zIndex = 1;
			bplane.setScrollSpeed( 0.5 );
			Effect.Port.attach(bplane);
		}
		
		Effect.Port.tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				backgroundOffsetX: { start: 150, end: 0 }
			}
		});
		
		splane.createSprite( StaticImageSprite, { url: '/images/title/title.png', x: 130, y: -150, zIndex: 3 } ).tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				y: { start: -150, end: 40 }
			}
		});
		
		splane.createSprite( StaticImageSprite, { url: '/images/title/crystal.png', x: 410, y: 600, zIndex: 2 } ).tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				y: { start: 600, end: -5 }
			}
		});
		
		splane.createSprite( StaticImageSprite, { url: '/images/title/ship.png', x: -480, y: 220, zIndex: 2 } ).tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				x: { start: -480, end: 110 }
			}
		});
		
		bplane.createSprite( StaticImageSprite, { url: '/images/title/planet.png', x: 800, y: 220, zIndex: 1 } ).tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				x: { start: 800, end: -20 }
			}
		});
		
		// hook mouse events for the buttons
		splane.createSprite( 'TitleButton', {
			url: 'button_new_game.png',
			x: 800,
			y: 600,
			zIndex: 4,
			onMouseUp: function() { CrystalGalaxy.start_new_game(); }
		} ).tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				x: { start: 800, end: 570 },
				y: { start: 600, end: 425 }
			}
		}).captureMouse();
		
		splane.createSprite( 'TitleButton', {
			url: 'button_survival.png',
			x: 800,
			y: 600,
			zIndex: 4,
			onMouseUp: function() { CrystalGalaxy.start_survival(); }
		} ).tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				x: { start: 800, end: 570 },
				y: { start: 645, end: 470 }
			}
		}).captureMouse();
		
		splane.createSprite( 'TitleButton', {
			url: 'button_about.png',
			x: 800,
			y: 600,
			zIndex: 4,
			onMouseUp: function() { CrystalGalaxy.show_about(); }
		} ).tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				x: { start: 800, end: 570 },
				y: { start: 690, end: 515 }
			}
		}).captureMouse();
		
		// play title music
		var music_id = Effect.Game.getLevelProps().music;
		Effect.Audio.getTrack( music_id ).rewind().play();
		
		// reset konami code
		CrystalGalaxy.konamiIdx = 0;
	},
	
	show_about: function() {
		// show about page
		var splane = Effect.Port.getPlane('sprites');
		
		if (!splane.getSprite('about')) {
			splane.createSprite( StaticImageSprite, { id: 'about', url: '/images/title/about.png', x: 810, y: 566, zIndex: 1 } );
			
			splane.createSprite( 'TitleButton', {
				url: 'button_back.png',
				x: 1090,
				y: 1107,
				zIndex: 4,
				onMouseUp: function() { CrystalGalaxy.cancel_about(); }
			} ).captureMouse();
		}
		
		Effect.Audio.playSound( 'click' );
		
		Effect.Port.tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				scrollX: 800,
				scrollY: 576
			}
		});
	},
	
	cancel_about: function() {
		// return to title
		Effect.Audio.playSound( 'click' );
		
		Effect.Port.tween({
			delay: 0,
			duration: 180,
			mode: 'EaseOut',
			algorithm: 'Quintic',
			properties: {
				scrollX: 0,
				scrollY: 0
			}
		});
	},
	
	start_new_game: function() {
		// start new game (from title screen)
		var port = Effect.Port;
		
		CrystalGalaxy.spriteGroups = {};
		CrystalGalaxy.gameMode = 'standard';
		
		Effect.Audio.quiet();
		Effect.Audio.playSound( 'start_new_game.mp3' );
		
		Effect.Game.clearSchedule();
		Effect.Game.removeAllTweens();
		Effect.Port.removeAll();
		Effect.Port.setBackgroundColor('black');
	
		Effect.Game.loadLevel( 'Level1', CrystalGalaxy.start_level ); // level loaded
	}, // start_new_game
	
	start_survival: function() {
		// start new game (from title screen)
		var port = Effect.Port;
		
		CrystalGalaxy.scroll_behavior.targetDist = 0;
		CrystalGalaxy.scroll_behavior.distance = 0;
		
		CrystalGalaxy.spriteGroups = {};
		CrystalGalaxy.gameMode = 'survival';
		CrystalGalaxy.logicStart = Effect.Game.logicClock;
		
		Effect.Audio.quiet();
		Effect.Audio.playSound( 'start_new_game.mp3' );
		
		Effect.Game.clearSchedule();
		Effect.Game.removeAllTweens();
		Effect.Port.removeAll();
		Effect.Port.setBackgroundColor('black');
	
		Effect.Game.loadLevel( 'Survival', CrystalGalaxy.start_level ); // level loaded
	}, // start_survival
	
	start_level: function() {
		// level is loaded!
		Effect.Game.setState( 'run' );
		
		// particle plane
		// (for objects that don't have to hit each other)
		if (!Effect.Port.getPlane('particles')) {
			var particle_plane = new SpritePlane('particles');
			particle_plane.zIndex = 4;
			Effect.Port.attach(particle_plane);
		}
	
		// initialize our heads-up display
		if (!Effect.Port.getPlane('huds')) {
			var hplane = new SpritePlane('huds');
			hplane.setZIndex( 90 );
			hplane.setScrollSpeed( 0 );
			Effect.Port.attach(hplane);
			
			hplane.createSprite( StaticImageSprite, {
				url: '/images/interface/hud_background.png',
				x: 0,
				y: 0
			} );
			
			var hud = new TextSprite('hud');
			hud.setZIndex( 91 ); // above everything else
			// hud.setFont( 'digitaldream' );
			hud.setCustomFont( '/fonts/digitaldream-19pt-custom.png', 16, 20 );
			hud.setTableSize( 50, 1 );
			hud.setTracking( 1.0, 1.0 );
			hud.setPosition( 16, 7 );
			hplane.attach(hud);
		}

		// get references to our planes, which were created when the level loaded
		var splane = Effect.Port.getPlane('sprites');
		var tplane = Effect.Port.getPlane('tiles');

		// connect the planes, for collision detection
		if (tplane) splane.linkTilePlane( tplane );

		// locate our player sprite and scroll to its position
		var player = splane.getSprite( 'player' );
		if (!player) alert("FAIL");
		
		player.powerups = {};
		player.setImage( 'ship5.png' );
		player.tow = null;
		player.crystals = 0;
		player.lastBestPowerup = '';
		
		if (CrystalGalaxy.konamiIdx >= CrystalGalaxy.konamiCodes.length) {
			player.lives = 30;
		}
		
		Effect.Port.follow( player );
		CrystalGalaxy.scroll_behavior.scroll.set( Effect.Port.scrollX, Effect.Port.scrollY );
		
		// capture key for buy powerup
		player.setKeyHandler( 'select' );

		// update our HUD with the player's current stats
		player.update_hud();
		
		// setup taildragger
		// player.head.set( player.x + 32, player.y );
		// player.rawMouse.set( player.head );
		// player.tail.set( player.head.getPointFromOffset( 0, 64 ) );
		player.rawMouse.set( Effect.Port.getMouseCoords() || CrystalGalaxy.lastMousePt );
		player.start_flyin();

		// start our music track
		var music_id = Effect.Game.getLevelProps().music;
		Effect.Audio.getTrack( music_id ).rewind().setVolume(1.0).play();
		
		// ship thrust sprites
		var flame1 = Effect.Port.getPlane('particles').createSprite( 'ShipThrust', {
			dieOffscreen: false,
			x: 1000,
			y: 1000,
			offsetAngle: 90,
			offsetDistance: 4,
			character: player
		});

		var flame2 = Effect.Port.getPlane('particles').createSprite( 'ShipThrust', {
			dieOffscreen: false,
			x: 1000,
			y: 1000,
			offsetAngle: 270,
			offsetDistance: 4,
			character: player
		});
		
		// start the ship thrust sound
		var thrustSound = Effect.Audio.getTrack('engine');
		thrustSound.setVolume( 0 );
		thrustSound.play();
		
		// hide the cursor
		Effect.Port.hideCursor();
		
		// setup all enemy ship groups
		splane.findSprites( {}, true ).each( function(sprite) {
			if (sprite.groupId) {
				if (!CrystalGalaxy.spriteGroups[ sprite.groupId ]) CrystalGalaxy.spriteGroups[ sprite.groupId ] = { count: 0 };
				CrystalGalaxy.spriteGroups[ sprite.groupId ].count++;
			}
		} );
		
		for (var key in CrystalGalaxy.spriteGroups) {
			CrystalGalaxy.spriteGroups[key].remain = CrystalGalaxy.spriteGroups[key].count;
		}
		
		// show ready message
		if (Effect.Game.getLevelProps().startMsg) {
			Effect.Game.scheduleEvent( 30, function() {
				CrystalGalaxy.show_message( Effect.Game.getLevelProps().startMsg );
			} );
		}
		
		/* if (CrystalGalaxy.gameMode == 'survival') {
			// start us out with a fine rock
			Effect.Game.scheduleEvent( 45 * 3, function() {
				CrystalGalaxy.spawn_rock({ screenLoop: true });
			} );
		} */
	}, // start_level
	
	survival_idle: function() {
		var splane = Effect.Port.getPlane('sprites');
		var player = splane.getSprite('player');
		var max_sec = 250; // after N seconds, we're spawning at "full speed"
		
		var sec = Math.floor( (Effect.Game.logicClock - CrystalGalaxy.logicStart) / 45 );
		if (sec > max_sec) sec = max_sec;
		
		var difficulty = (sec / max_sec); // 0.0 to 1.0
		var rnd = Math.random() * max_sec;
		
		// if no enemies are onscreen, force a spawn
		var numEnemies = splane.findSprites({ category: 'enemy' }).length + splane.findSprites({ type: 'Rock' }).length;
		
		var enemyTypes = ['rock','rock','rock','miner','shooter','miner','shooter'];
		if (sec > 30) enemyTypes.push( 'sphere' );
		if (sec > 60) enemyTypes.push( 'tesla' );
		if (sec > 120) { enemyTypes.push( 'shooter' ); enemyTypes.push( 'shooter' ); }
		if (sec == max_sec) { enemyTypes.push( 'shooter' ); enemyTypes.push( 'shooter' ); }
		
		if (((rnd < sec) || !numEnemies) && (sec > 3) && (player.state != 'death')) {
			switch (rand_array(enemyTypes)) {
				case 'rock':
					CrystalGalaxy.spawn_rock({ screenLoop: true });
					break;
				
				case 'miner':
					CrystalGalaxy.spawn_ship({
						shipType: 6,
						state: 'seek',
						angleSpeed: 2 + (3 * difficulty),
						speed: 2 + (3 * difficulty),
						energy: 3 + (3 * difficulty),
						shootProb: 0
					});
					break;
				
				case 'shooter':
					CrystalGalaxy.spawn_ship({
						shipType: 1,
						state: 'seek',
						angleSpeed: 2 + (3 * difficulty),
						speed: 2 + (3 * difficulty),
						energy: 3 + (3 * difficulty),
						shootProb: 0.01 + (0.1 * difficulty)
					});
					break;
				
				case 'tesla':
					var pt = new Point( Effect.Port.scrollX + (Effect.Port.portWidth / 2), Effect.Port.scrollY + (Effect.Port.portHeight / 2) );
					var dist = Math.sqrt( Math.pow(Effect.Port.portWidth / 2, 2) + Math.pow(Effect.Port.portHeight / 2, 2) );
					var ang = Math.random() * 360;
					pt.project( ang, dist ).floor();
					
					var delta = (new Point()).project( ang + 180, 2 + (2 * difficulty) );
					
					Effect.Port.getPlane('sprites').createSprite( 'TeslaCoil', {
						x: pt.x - 32,
						y: pt.y - 32,
						xd: delta.x,
						yd: delta.y,
						angle: ang,
						angleDelta: 0.5 + (1 * difficulty),
						numBolts: 4
					});
					break;
				
				case 'sphere':
					var ang = Math.random() * 360;
					var dist = Math.sqrt( Math.pow(Effect.Port.portWidth / 2, 2) + Math.pow(Effect.Port.portHeight / 2, 2) );
					var pt = Effect.Port.getPlane('sprites').getScreenRect().centerPoint().project( ang, dist ).offset(-32, -32);

					Effect.Port.getPlane('sprites').createSprite( 'Sphere', {
						x: pt.x,
						y: pt.y,
						angle: ang,
						angleDelta: 0.5 + (2 * difficulty),
						distance: dist,
						distanceDelta: -1 - (2 * difficulty),
						behavior: 'trig'
					});
					break;
			} // switch type
		} // time to spawn
		
		player.update_hud(); // time counter
	},
	
	spawn_ship: function(args) {
		var pt = new Point( Effect.Port.scrollX + (Effect.Port.portWidth / 2), Effect.Port.scrollY + (Effect.Port.portHeight / 2) );
		var dist = Math.sqrt( Math.pow(Effect.Port.portWidth / 2, 2) + Math.pow(Effect.Port.portHeight / 2, 2) );
		pt.project( Math.random() * 360, dist ).floor();
		
		args.cx = pt.x;
		args.cy = pt.y;

		Effect.Port.getPlane('sprites').createSprite( 'EnemyShip', args);
	},
	
	spawn_rock: function(args) {
		// spawn new rock object
		if (!args) args = {};
		var port = Effect.Port;
		var x = args.x;
		var y = args.y;
		var rockClass = args.rockClass;
		var rockSize = args.rockSize;
		
		// if (!rockSize) rockSize = rockSizes[ parseInt(Math.random() * 3) ];
		if (!rockSize) rockSize = 96;
		if (!rockClass) rockClass = CrystalGalaxy.rockClasses[ Math.floor(Math.random() * 4) ];
		
		var xd = args.xd;
		if (!xd) {
			xd = Math.floor(Math.random() * 6) - 3;
			if (!xd) xd = 2;
			else if (Math.abs(this.xd) == 1) this.xd *= 2;
		}
		
		var yd = args.yd;
		if (!yd) {
			var yd = Math.floor(Math.random() * 6) - 3;
			if (!yd) yd = -2;
			else if (Math.abs(this.yd) == 1) this.yd *= 2;
		}
		
		if (!x && !y) {
			if (Math.abs(xd) > Math.abs(yd)) {
				// more of a horizontal rock
				if (xd < 0) x = port.scrollX + port.portWidth;
				else x = port.scrollX - rockSize;

				y = (port.scrollY - rockSize) + Math.floor( Math.random() * (port.portHeight + rockSize) );
			}
			else {
				// more of a vertical rock
				if (yd < 0) y = port.scrollY + port.portHeight;
				else y = port.scrollY - rockSize;

				x = (port.scrollX - rockSize) + Math.floor( Math.random() * (port.portWidth + rockSize) );
			}
		}
		
		var frameDelta = (Math.random() * 2) - 1;
		if (Math.abs(frameDelta) < 0.25) frameDelta *= 2;
		
		if (!args.group) {
			args.group = {};
			switch (rockSize) {
				case 32: args.group.remain = 1; break;
				case 64: args.group.remain = 3; break;
				case 96: args.group.remain = 7; break;
			}
		}

		Effect.Port.getPlane('sprites').createSprite( 'Rock', {
			x: x,
			y: y,
			xd: xd,
			yd: yd,
			frameFloat: 0,
			frameDelta: frameDelta,
			rockClass: rockClass,
			size: rockSize,
			group: args.group,
			screenLoop: !!args.screenLoop
		});
	},
	
	/* spawn_ship_group: function(args) {
		var pt = new Point( port.scrollX + (port.portWidth / 2), port.scrollY + (port.portHeight / 2) );
		var dist = Math.sqrt( Math.pow(port.portWidth / 2, 2) + Math.pow(port.portHeight / 2, 2) );
		pt.project( args.originAngle, dist ).floor();
		
		Effect.Port.getPlane('sprites').createSprite( 'EnemyShip', {
			cx: pt.x,
			cy: pt.y,
			group: args
		});
		
		args.remain = args.count;
		args.count--;
	}, */
	
	create_debris: function(args) {
		var particle_plane = Effect.Port.getPlane('particles');
		
		for (var idx = 0; idx < args.amount; idx++) {
			var cx = args.cx;
			var cy = args.cy;
			if (args.scatter) {
				cx += ((Math.random() * args.scatter) - (args.scatter / 2));
				cy += ((Math.random() * args.scatter) - (args.scatter / 2));
			}
			particle_plane.createSprite( 'Debris', {
				cx: cx,
				cy: cy,
				angle: Math.random() * 360,
				distance: args.distance,
				debrisClass: args.debrisClass
			});
		} // foreach particle
	},
	
	create_particles: function(args) {
		var particle_plane = Effect.Port.getPlane('particles');
		
		for (var idx = 0; idx < args.amount; idx++) {
			var cx = args.cx;
			var cy = args.cy;
			if (args.scatter) {
				cx += ((Math.random() * args.scatter) - (args.scatter / 2));
				cy += ((Math.random() * args.scatter) - (args.scatter / 2));
			}
			particle_plane.createSprite( 'Particle', {
				cx: cx,
				cy: cy,
				angle: Math.random() * 360,
				distance: args.distance,
				particleClass: args.particleClass
			});
		} // foreach particle
	},
	
	show_message: function(text) {
		// create HUD text sprite to "blink" message on screen
		text = text.toString();
		var hplane = Effect.Port.getPlane('huds');
		var msg = new TextSprite();
		msg.setZIndex( 91 ); // above everything else
		msg.setFont( 'digitaldream' );
		// msg.setCustomFont( '/fonts/digitaldream-19pt-custom.png', 16, 20 );
		msg.setTableSize( text.length, 1 );
		msg.setTracking( 1.0, 1.0 );
		msg.setPosition( (Effect.Port.portWidth / 2) - ((text.length * 16) / 2), (Effect.Port.portHeight / 2) - 10 );
		
		msg.frameCount = 0;
		msg.logic = function(clock) {
			this.show( this.frameCount % 30 < 20 );
			if (this.frameCount % 30 == 0) Effect.Audio.playSound( 'message.mp3' );
			this.frameCount++;
			if (this.frameCount >= 30 * 5) this.destroy();
		};
		
		hplane.attach(msg);
		msg.setString( 0, 0, text );
	},
	
	level_complete: function() {
		this.show_message("LEVEL COMPLETE!");
		
		Effect.Audio.playSound( 'level_complete' );
		Effect.Audio.getTrack('engine').stop();
		
		Effect.Game.scheduleEvent( 45 * 2, function() { Effect.Port.getPlane('sprites').getSprite('player').start_flyout(); } );
		
		Effect.Game.scheduleEvent( 45 * 6, function() { CrystalGalaxy.return_to_title(); } );
	},
	
	return_to_title: function() {
		// game over, return to title
		if (CrystalGalaxy.saveLevelMusic) {
			Effect.Game.getLevelProps().music = CrystalGalaxy.saveLevelMusic;
			delete CrystalGalaxy.saveLevelMusic;
		}
		
		Effect.Game.clearSchedule();
		Effect.Audio.quiet();
		Effect.Game.removeAllTweens();
		Effect.Port.showCursor();
		Effect.Port.removeAll();
		Effect.Port.setBackgroundColor('black');
		Effect.Game.loadLevel( 'TitleScreen', CrystalGalaxy.do_title_screen );
	}
	
}; // CrystalGalaxy namespace


function RADIANS_TO_DECIMAL(_rad) { return _rad * 180.0 / Math.PI; }
function DECIMAL_TO_RADIANS(_dec) { return _dec * Math.PI / 180.0; }

function rand_array(arr, min, max) {
	// return random element from array
	if (!min) min = 0;
	if (!max) max = arr.length;
	return arr[ min + parseInt(Math.random() * (max - min), 10) ];
}
