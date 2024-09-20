import {Vector, Plane, World, Entity, Mesh, Physics, Box, Circle, RenderSystem, CollisionSystem, MovementSystem, canvas, drawText, drawLine} from './GameSystem.js';

const PLAYER_MOVE_SPEED = 20;

export function renderPong() {
	const app = document.getElementById('app');
	if (app)
		app.appendChild(canvas);
}

class Ball extends Entity{
	constructor(x = canvas.width / 2, y = canvas.height / 2){
		super(x, y);
		this.addComponent(Mesh, new Circle(40));
		this.physics = new Physics(0,0, false, false);
		// this.physics.hasGravity = false;
		this.addComponent(Physics, this.physics);
	}

	onCollision(other, collisionPoint = undefined){
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
	constructor(x, y){
		super(x, y);
		this.mesh = new Box(40, 250);
		this.physics = new Physics(0, 0, true, false);
		this.addComponent(Mesh, this.mesh);
		this.addComponent(Physics, this.physics);
		this.keyBinds = {up: 'ArrowUp', down: 'ArrowDown'};
		window.addEventListener('keydown', (event) => this.keyDown(event));
		window.addEventListener('keyup', (event) => this.keyUp(event));
	}

	bindToGoal(goal){
		this.position.x = goal.position.x;
		this.position.y = goal.position.y;
		this.rotate(goal.rotation);
	}

	move(xAdd, yAdd){
		let newPos = this.position.add(new Vector(xAdd, yAdd));
		for (let point of this.mesh.points) {
			point = point.add(newPos);
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
			ophys.velocity.normalize()
			ophys.velocity.scale(prevScale);
		}
	}

	update(){
		drawLine(this.position, this.position.add(this.up.dup().scale(100)), 'blue');
	}

	keyDown(event){
		if (event.key === this.keyBinds.up){
			let dir = new Vector(this.up.x, this.up.y);
			dir.scale(PLAYER_MOVE_SPEED);
			this.physics.velocity = dir;
		}
		if (event.key === this.keyBinds.down) {
			let dir = new Vector(this.up.x, this.up.y);
			dir.scale(-PLAYER_MOVE_SPEED);
			this.physics.velocity = dir;
		}
		if (event.key === 'g')
			this.rotate(this.rotation + 5);
	}

	keyUp(event){
		if (event.key === this.keyBinds.up || event.key === this.keyBinds.down){
			this.physics.velocity.x = 0;
			this.physics.velocity.y = 0;
		}
	}
}

class Wall extends Entity{
	constructor(x, y, top = false){
		super(x, y);
		if (top)
			this.addComponent(Mesh, new Box(canvas.width, 5));
		else
			this.addComponent(Mesh, new Box(5, canvas.height));
	}
}

class Goal extends Entity{
	constructor(x, y, rot, height){
		super(x, y);
		let m = new Box(10, height, true);
		this.rotate(rot);
		this.addComponent(Mesh, m);
	}
}

class PongGameManager extends Entity{
	constructor(){
		super(0, 0);
		// this.players = [];
		this.player1 = new Player(canvas.width * 0.1, canvas.height * 0.5);
		this.player1.keyBinds = {up: 'w', down: 's'};
		this.player2 = new Player(canvas.width * 0.9, canvas.height * 0.5);
		this.ball = new Ball(/* canvas.width * 0.1 + 50, canvas.height * 0.2 */);
		this.roundRunning = false;
		this.scores = [0, 0];
		this.winner = -1;
		this.initGame();
	}

	initGame(){
		
		world.addEntity(this.player1);
		world.addEntity(this.player2);
		world.addEntity(this.ball);

		let wallt = new Wall(canvas.width / 2, 0, true);
		let wallb = new Wall(canvas.width / 2, canvas.height, true);

		let goal1 = new Goal(0, canvas.height / 2, 0, canvas.height);
		goal1.onTrigger = (other) => {
			if (!(other instanceof Ball))
				return;
			this.scores[1]++;
			this.resetRound();
		};
		let goal2 = new Goal(canvas.width, canvas.height / 2, 0, canvas.height);
		goal2.onTrigger = (other) => {
			if (!(other instanceof Ball))
				return;
			this.scores[0]++;
			this.resetRound();
		};

		world.addEntity(wallt);
		world.addEntity(wallb);
		world.addEntity(goal1);
		world.addEntity(goal2);

		window.addEventListener("keydown", event => {
			if(event.key == ' ' && !this.roundRunning){
				this.startRound();
				event.preventDefault();
			}
		})

	}

	drawExtra(){
		drawText(this.scores[0], canvas.width * 0.25, canvas.height * 0.25, '120px Arial');
		drawText(this.scores[1], canvas.width * 0.75, canvas.height * 0.25, '120px Arial');
		drawLine(new Vector(canvas.width * 0.5, 0), new Vector(canvas.width * 0.5, canvas.height), 'black', 10, [10, 10]);
		if (!this.roundRunning){
			if (this.winner == -1)
				drawText('Press space to start Round!', canvas.width * 0.3, canvas.height * 0.5, '48px Arial', 'red');
			else
				drawText(`Player ${this.winner+1} won!`, canvas.width * .4, canvas.height * .5, '48px Arial', 'green');
		}
	}

	checkWinCondition(){
		for (let i = 0; i < this.scores.length; i++) {
			const currScore = this.scores[i];
			if (currScore >= 7)
				return i;
		}
		return -1;
	}

	resetGame(){
		this.scores.fill(0);
		this.winner = -1;
	}

	resetRound(){
		this.winner = this.checkWinCondition(); 
		this.roundRunning = false;
		this.ball.physics.setVelocity(0,0);
		this.ball.position.x = canvas.width / 2;
		this.ball.position.y = canvas.height / 2;
	}

	startRound(){
		if (this.winner != -1)
			this.resetGame();
		this.roundRunning = true;
		if (this.scores[0] < this.scores[1])
			this.ball.physics.setVelocity(15, 0);
		else
			this.ball.physics.setVelocity(-15, 0);
	}

	update(){
		this.drawExtra();
		// console.log("GAMEMODE UPDATE!");
	}
}

let world = new World();

world.addSystem(new RenderSystem());
world.addSystem(new CollisionSystem());
world.addSystem(new MovementSystem());

world.addEntity(new PongGameManager());

setInterval(function() {
	world.update();
}, 10);

// let players = 3;
// let rotStep = 360 / players;
// const cent = new Vector(canvas.width/2, canvas.height/2);
// let ls1 = new Vector(0, -(canvas.height / 2));
// let ls2 = new Vector(0, -(canvas.height / 2));
// ls2.rotate(rotStep);

// for (let index = 0; index < players; index++) {
// 	let p1 = ls1.add(cent);
// 	let p2 = ls2.add(cent);
// 	ctx.fillRect(p1.x, p1.y, 5, 5);
// 	ctx.fillRect(p2.x, p2.y, 5, 5);
// 	ctx.beginPath();
// 	ctx.moveTo(p1.x, p1.y);
// 	ctx.lineTo(p2.x, p2.y);
// 	ctx.stroke();
// 	ctx.closePath();
// 	ls1.rotate(rotStep);
// 	ls2.rotate(rotStep);
// }
