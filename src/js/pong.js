import {Vector, Plane, World, Entity, Mesh, Physics, Network, Box, Circle, RenderSystem, CollisionSystem, MovementSystem, canvas, drawText, strokeText, drawLine, ctx} from './GameSystem.js';

const PLAYER_MOVE_SPEED = 20;

export function renderPong() {
	const app = document.getElementById('app');
	if (app)
	{
		app.innerHTML = '';
		app.appendChild(canvas);
	}
}

class Ball extends Entity{
	constructor(x = canvas.width / 2, y = canvas.height / 2){
		super(x, y);
		this.net = new Network();
		this.addComponent(Network, this.net);
		this.addComponent(Mesh, new Circle(40));
		this.physics = new Physics(0,0, false, false);
		// this.physics.hasGravity = false;
		this.addComponent(Physics, this.physics);
		this.lastHit = undefined;
	}

	resetBall(){
		this.physics.setVelocity(0, 0);
		// this.lastHit = undefined;
		this.position.x = canvas.width / 2;
		this.position.y = canvas.height / 2;
	}

	move(xAdd, yAdd){
		let newPos = this.position.add(new Vector(xAdd, yAdd));
		if (this.net.isLocal && (this.position.x !== newPos.x || this.position.y !== newPos.y)){
			socket.send(JSON.stringify({type: 'game_loop', id: this.id, x: this.position.x, y: this.position.y}));
		}
		this.position = newPos;
	}

	onCollision(other, collisionPoint = undefined){
		if (other instanceof Player)
			this.lastHit = other;
		if (collisionPoint === undefined)
			return;
		let ba = this.position.sub(collisionPoint);
		ba.normalize();
		let tangent = new Plane(collisionPoint, ba);
		let velocityNormalized = this.physics.velocity.dup().normalize();
		let dotProduct = tangent.dir.dot(velocityNormalized);
		let reflection = velocityNormalized.sub(ba.scale(2 * dotProduct));
		reflection.scale(this.physics.velocity.length());
		this.physics.setVelocityV(reflection);
	}
}

class Player extends Entity{
	constructor(x, y, length = 250){
		super(x, y);
		this.mesh = new Box(25, length);
		this.physics = new Physics(0, 0, true, false);
		this.net = new Network();
		this.addComponent(Mesh, this.mesh);
		this.addComponent(Physics, this.physics);
		this.addComponent(Network, this.net);
		this.keyBinds = {up: 'remote', down: 'remote'};
		window.addEventListener('keydown', (event) => this.keyDown(event));
		window.addEventListener('keyup', (event) => this.keyUp(event));
		this.score = 0;
		this.startPos = undefined;
		this.goalHeight = 0;
	}

	move(xAdd, yAdd){
		let newPos = this.position.add(new Vector(xAdd, yAdd));

		/**
		 * Check if the new player position is still in range of its goal
		 * if not dont allow the move
		 */
		if (this.startPos !== undefined){
			let ab = newPos.sub(this.startPos);
			let len = ab.length();
			ab.scale((len + this.mesh.height * 0.5) / len);
			if (ab.length() > this.goalHeight * 0.5)
				return;
		}
		/**
		 * Check if the mesh is still inside the canvas
		 * if not dont allow the move
		 */
		let transformedPoints = this.mesh.points.map(p => p.dup().rotate(this.rotation).add(newPos));
		for (let point of transformedPoints) {
			// point = point.add(newPos);
			if (point.x < 0 || point.x > canvas.width)
				return;
			if (point.y < 0 || point.y > canvas.height)
				return;
		}
		if (this.net.isLocal && (this.position.x !== newPos.x || this.position.y !== newPos.y)){
			socket.send(JSON.stringify({type: 'game_loop', id: this.id, x: this.position.x, y: this.position.y}));
		}
		this.position = newPos;
	}

	onCollision(other, collisionPoint = undefined){
		var ophys = other.getComponent(Physics);
		if (ophys && collisionPoint && other instanceof Ball){
			let drall = collisionPoint.sub(this.position);
			let prevScale = ophys.velocity.length();
			// drall = drall.add(this.physics.velocity);
			drall.normalize();
			drall.scale(10);	
			ophys.velocity = ophys.velocity.add(drall);
			ophys.velocity.normalize();
			ophys.velocity.scale(prevScale);
		}
	}

	keyDown(event){
		if (event.key === this.keyBinds.up){
			let dir = new Vector(this.up.x, this.up.y);
			dir.scale(PLAYER_MOVE_SPEED);
			this.physics.velocity = dir;
		} else if (event.key === this.keyBinds.down) {
			let dir = new Vector(this.up.x, this.up.y);
			dir.scale(-PLAYER_MOVE_SPEED);
			this.physics.velocity = dir;
		} else if (event.key === 'g') {
			this.rotate(this.rotation + 5);
		}
		else {
			return;
		}
		event.preventDefault();
	}

	keyUp(event){
		if (event.key === this.keyBinds.up || event.key === this.keyBinds.down){
			this.physics.velocity.x = 0;
			this.physics.velocity.y = 0;
		} else {
			return;
		}
		event.preventDefault();
	}
}

class Wall extends Entity{
	constructor(x, y, rot, height){
		super(x, y);
		this.height = height;
		let m = new Box(10, this.height, true);
		this.rotate(rot);
		this.addComponent(Mesh, m);
	}
}

class PlayerSection extends Entity{
	constructor(x, y, rotation, height){
		super(x, y);
		this.goal = new Wall(x, y, rotation, height);
		this.player = new Player(x, y, height * 0.33);
		this.bindPlayer();
		world.addEntity(this.goal);
		world.addEntity(this.player);
	}

	update(){
		this.drawScore();
	}

	drawScore(){
		const center = new Vector(canvas.width * .5, canvas.height * .5);
		let lineToCenter = center.sub(this.position);
		lineToCenter.rotate(25);
		lineToCenter.normalize();
		lineToCenter.scale(100);
		let drawPos = lineToCenter.add(this.position);
		drawText(this.player.score, drawPos.x, drawPos.y, '120px Arial');
	}

	bindPlayer(){
		this.player.position.x = this.goal.position.x;
		this.player.position.y = this.goal.position.y;
		this.player.rotate(this.goal.rotation);
		if (this.player.up.dot(new Vector(0, -1)) < 0)
			this.player.rotate(this.player.rotation + 180);
		let forward = new Vector(canvas.width * 0.5, canvas.height * 0.5).sub(this.player.position);
		forward.normalize();
		forward.scale(75);
		forward = forward.add(this.player.position);
		this.player.position = forward;
		this.player.startPos = forward;
		this.player.goalHeight = this.goal.height;
	}
}

class PongGameManager extends Entity{
	constructor(){
		super(0, 0);
		this.sections = [];
		this.ball = new Ball();
		world.addEntity(this.ball);
		this.initGame();
	}

	update(){
		// this.buildDynamicField(3);
	}

	buildDynamicField(playerCount){
		if (playerCount === 2){
			this.sections.push(new PlayerSection(0, canvas.height * .5, 0, canvas.height));
			this.sections.push(new PlayerSection(canvas.width, canvas.height * .5, 0, canvas.height));
			this.sections[0].player.keyBinds = {up: 'w', down: 's'};
			world.addEntity(new Wall(canvas.width * .5, 0, 90, canvas.width));
			world.addEntity(new Wall(canvas.width * .5, canvas.height, 90, canvas.width));
			return;
		}
		const center = new Vector(canvas.width / 2, canvas.height / 2);
		let point1 = new Vector(0, -canvas.height / 2);
		let rotationStep = 360 / playerCount;
		let rot = (rotationStep) / 2;
		let point2 = point1.dup().rotate(rotationStep);
		for (let i = 0; i < playerCount; i++) {
			let ba = point2.sub(point1);
			drawLine(point1.add(center), point2.add(center));
			ba.scale(0.5);
			let midpoint = ba.add(point1);
			midpoint = midpoint.add(center);
			ctx.fillRect(midpoint.x, midpoint.y, 5, 5);
			this.sections.push(new PlayerSection(midpoint.x, midpoint.y, rot + 90, ba.length() * 2));
			point1.rotate(rotationStep);
			point2.rotate(rotationStep);
			rot += rotationStep;
		}
	}

	initGame(){
		
		this.buildDynamicField(2);
		// this.sections.push(new PlayerSection(0, canvas.height / 2, 0, canvas.height));
		// this.sections.push(new PlayerSection(canvas.width, canvas.height / 2, 0, canvas.height));
		// this.sections.push(new PlayerSection(canvas.width / 2, 0, 90, canvas.width));
		// this.sections.push(new PlayerSection(canvas.width / 2, canvas.height, 90, canvas.width));

		this.sections.forEach( section => {
			world.addEntity(section);
			section.goal.onTrigger = (other) =>{
				if (other instanceof Ball){
					other.lastHit.score++;
					this.resetRound();
				}
			};
		});

		window.addEventListener("keydown", event => {
			if(event.key == ' ' && !this.roundRunning){
				this.startRound();
				event.preventDefault();
			}
		})

		this.ball.physics.setVelocity(15, 0);

	}

	startRound(){
		let dir = undefined;
		if (this.ball.lastHit !== undefined){
			dir = this.ball.lastHit.position.sub(this.ball.position);
			dir.normalize();
			dir.scale(15);
		}
		else{
			dir = new Vector(15, 0);
		}
		this.ball.physics.setVelocity(dir.x, dir.y);
	}

	resetRound(){
		this.ball.resetBall();
	}

}

class MultiplayerManage extends Entity{
	constructor(){
		super(0, 0);
	}
}

let world = new World();

world.addSystem(new RenderSystem());
world.addSystem(new CollisionSystem());
world.addSystem(new MovementSystem());

let socket = new WebSocket(`ws://${window.location.host}/ws/pong/test/`);

socket.onopen = () => {
	console.log('Connected to WebSocket server');
}

socket.onmessage = (event) => {
	const data = JSON.parse(event.data);
	console.log(data);
	if (data.type === 'currentState'){
		world.entities = data.entities;
	} else if (data.type === 'newPlayer') {
		
	} else if (data.type === 'updatePos'){
	} else if (data.type === 'setScore'){
		//player/entity id and data.newScore ???
	}
}

const id = setInterval(function() {
	world.update();
}, 10);

socket.onclose = () => {
	clearInterval(id);
	showSection('welcome');
}
