import {Vector, Plane, World, Entity, Mesh, Physics, Network, Box, Circle, RenderSystem, CollisionSystem, MovementSystem, canvas, drawText, strokeText, drawLine, ctx} from './GameSystem.js';

const PLAYER_MOVE_SPEED = 20;

export function renderPong(match_id) {
	const app = document.getElementById('app');
	if (app)
	{
		app.style.position = 'relative';
		app.innerHTML = `
		<div class="menu" style="justify-content: center; padding: 2em;">
			<div id="gameContainer" class="game-container"></div>
		</div>
		`;

		const gameContainer = document.getElementById('gameContainer');

		canvas.style.maxHeight = '100%';
        canvas.style.maxWidth = '100%';

		gameContainer.appendChild(canvas);
		selectGamemode(match_id);
	}
}

class Ball extends Entity{
	constructor(x = canvas.width / 2, y = canvas.height / 2){
		super(x, y);
		this.addComponent(Mesh, new Circle(40));
		this.physics = new Physics(0,0, false, false);
		// this.physics.hasGravity = false;
		this.addComponent(Physics, this.physics);
		this.lastHit = undefined;
		this.secondLastHit = undefined;
	}

	resetBall(){
		this.physics.setVelocity(0, 0);
		this.position.x = canvas.width / 2;
		this.position.y = canvas.height / 2;
	}

	move(xAdd, yAdd){
		let newPos = this.position.add(new Vector(xAdd, yAdd));
		this.position = newPos;
	}

	onCollision(other, collisionPoint = undefined){
		if (other instanceof Player){
			this.secondLastHit = this.lastHit != other ? this.lastHit : this.secondLastHit;
			this.lastHit = other;
		}
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

	update(){
		ctx.fillStyle = 'red';
		if (this.lastHit)
			ctx.fillRect(this.lastHit.position.x, this.lastHit.position.y, 5, 5);
		ctx.fillStyle = 'blue';
		if (this.secondLastHit)
			ctx.fillRect(this.secondLastHit.position.x, this.secondLastHit.position.y, 5, 5);
		ctx.fillStyle = 'white';
	}
}

class Player extends Entity{
	constructor(x, y, length = 250){
		super(x, y);
		this.height = length;
		this.mesh = new Box(25, length);
		this.physics = new Physics(0, 0, true, false);
		this.addComponent(Mesh, this.mesh);
		this.addComponent(Physics, this.physics);
		this.keyBinds = {up: 'remote', down: 'remote'};
		this.score = 0;
		this.startPos = undefined;
		this.goalHeight = 0;
	}

	update(){
		this.drawScore();
	}

	drawScore(){
		const center = new Vector(canvas.width * .5, canvas.height * .5);
		let startPos = this.startPos ? this.startPos : this.position;
		let lineToCenter = center.sub(startPos);
		lineToCenter.rotate(25);
		lineToCenter.normalize();
		lineToCenter.scale(100);
		let drawPos = lineToCenter.add(startPos);
		drawText(this.score, drawPos.x, drawPos.y, '120px Arial', '#5e5e5e');
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

class PongLocalManager extends Entity{
	constructor(){
		super(0, 0);
		this.sections = [];
		this.ball = new Ball();
		this.winner = undefined;
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
			this.sections[1].player.keyBinds = {up: 'ArrowUp', down: 'ArrowDown'};
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
					if (other.lastHit){
						if (other.lastHit != section.player){
							other.lastHit.score++;
						} else if(other.secondLastHit) {
							other.secondLastHit.score++;
						} else {
							console.log("WHAT THE FUCK DO WE DO NOW?");
						}
					}
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
	}

	startRound(){
		if (this.winner){
			for (let s of this.sections){
				s.player.score = 0;
			}
			this.winner = undefined;
		}
		let dir = undefined;
		if (this.ball.lastHit !== undefined){
			dir = this.ball.lastHit.position.sub(this.ball.position);
			dir.normalize();
			dir.scale(50);
		}
		else{
			dir = new Vector(50, 0);
		}
		this.ball.physics.setVelocity(dir.x, dir.y);
	}

	checkWinCondition(){
		for (const sec of this.sections) {			
			if (sec.player.score >= 11){
				for (const s of this.sections){
					if (sec != s){
						if (Math.abs(sec.player.score - s.player.score) >= 2)
							return (sec.player.score > s.player.score ? sec.player : s.player);
					}
				}
				return (sec.player);
			}
		}
		return (undefined);
	}

	resetRound(){
		this.ball.resetBall();
		this.winner = this.checkWinCondition();
		if (this.winner){
			let a = document.getElementById('buttonContainer');
			a.innerHTML = `${this.winner} has Won!`;
			console.log(this.winner, 'Is winner');
		}
	}
}

//!!!STRAY FUNCTION!!!
function lerp(start, end, t) {
	return start * (1 - t) + end * t;
}

class RemoteHandler extends Entity{
	constructor(){
		super(0, 0);
		this.entities = {};
		this.localPlayer = undefined;
	}

	initLocal(data){
		this.localPlayer = this.entities[data.id];
		let net = this.localPlayer.getComponent(Network);
		net.isLocal = true;
	}

	newEntity(data){
		let ent = undefined;
		if (data.entType === 'Player'){
			ent = new Player(0, 0, data.constr.height);
		} else if (data.entType === 'Ball'){
			ent = new Ball(0,0);
		} else if (data.entType === 'Wall'){
			ent = new Wall(0, 0, 0, data.constr.height);
		} else {
			ent = new Entity(0, 0);
		}
		ent.addComponent(Network, new Network(socket));
		ent.id = data.id;
		this.addEntity(ent.id, ent);
		this.moveEntity(ent.id, data.transform);
	}

	addEntity(id, ent){
		this.entities[id] = ent;
		world.addEntity(ent);
	}

	moveEntity(id, transform){
		const ent = this.entities[id];

		ent.position.x = transform.position.x;
		ent.position.y = transform.position.y;
		ent.rotate(transform.rotation);
	}

	removeEntity(id){
		world.removeEntity(this.entities[id]);
		delete this.entities[id];
	}
}

let world = new World();

world.addSystem(new RenderSystem());

let intervalId = 0;

let manager = undefined;
let socket = undefined;


function sendMovementInput(event) {
	if (event.type == 'keypress') {
		if (event.key == 'w') {
			socket.send(0b01);
		} else if (event.key == 's') {
			socket.send(0b10);
		}
	} else if (event.type == 'keyup' && (event.key == 's' || event.key == 'w')) {
		socket.send(0b00);
	} 
}

function selectGamemode(groupName){
	if (!groupName){
		world.addSystem(new CollisionSystem());
		world.addSystem(new MovementSystem());
		manager = new PongLocalManager();
	}
	else {
		socket = new WebSocket(`ws://${window.location.host}/ws/pong/${groupName}/`);
		window.addEventListener('keypress', sendMovementInput);
		window.addEventListener('keyup', sendMovementInput);
		manager = new RemoteHandler();
		setupSocketHandlers(socket);
	}
	// else{
	// 	return;
	// }
	world.addEntity(manager);
	intervalId = setInterval(function() {
		world.update();
	}, 10);
}

function setupSocketHandlers(socket){


	socket.onopen = () => {
		console.log("Connection to remote Pong serverer");
	}
	
	socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		if (data instanceof Number) {
			console.log(data);
			return;
		}
		if (data.type !== 'updatePos')
			console.log(data);
		if (data.type === 'currentState'){
			world.entities = data.entities;
		} else if (data.type === 'initLocal'){
			manager.localPlayer = manager.entities[data.id];
			manager.localPlayer.keyBinds = {up: 'ArrowUp', down: 'ArrowDown'};
			console.log(manager.localPlayer, manager.localPlayer.keyBinds);
			console.log(manager.localPlayer.id);
		} else if (data.type === 'newEntity') {
			manager.newEntity(data);
		} else if (data.type === 'updatePos'){
			manager.moveEntity(data.id, data.transform);
		} else if (data.type === 'setScore'){
			manager.entities[data.id].score = data.score;
		}
	}
	
	socket.onclose = () => {
		clearInterval(intervalId);
		world.entities = [];
		world.systems = [];
		showSection('welcome');
	}
}
