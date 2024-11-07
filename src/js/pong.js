import {Vector, Plane, World, Entity, Mesh, Physics, Network, Box, Circle, RenderSystem, CollisionSystem, MovementSystem, canvas, drawText, strokeText, drawLine, ctx} from './GameSystem.js';
import { showSection } from './index.js';

const PLAYER_MOVE_SPEED = 20;

export function renderPong(match_id) {
	const app = document.getElementById('app');
	if (app)
	{
		app.style.position = 'relative';
		app.innerHTML = `
		<div class="menu" style="justify-content: center; padding: 2em;">
			<div class="game-container">
				<div class="game-information">
					<span id="player1_name" class="game-name">fwechslex</span>
					<span id="player1_score" class="game-score">4</span>
				</div>
				<div id="canvasContainer"></div>
				<div class="game-information">
					<span id="player2_name" class="game-name">fwechslex</span>
					<span id="player2_score" class="game-score">0</span>
				</div>
			</div>
			<div class="countdown-container" id="countdownDisplay"></div>
		</div>
		`;

		const canvasContainer = document.getElementById('canvasContainer');

		canvasContainer.appendChild(canvas);
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
			dir.scale(15);
		}
		else{
			dir = new Vector(15, 0);
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
		this.players = {};
		this.localPlayer = undefined;
	}

	newEntity(type, id, transform, height=undefined){
		let ent = undefined;
		if (type === 'Player'){
			ent = new Player(0, 0, Number(height));
		} else if (type === 'Ball'){
			ent = new Ball(0,0);
		} else if (type === 'Wall'){
			ent = new Wall(0, 0, 0, Number(height));
		} else {
			ent = new Entity(0, 0);
		}
		ent.id = id;
		this.addEntity(ent.id, ent);
		this.setEntityPosition(ent.id, transform);
	}

	addPlayer(entid, uid, uname) {
		this.players[entid] = {uid, uname};
		if (Object.keys(this.players).length >= 2) {
			this.updatePlayerScore(entid, 0);
		}
	}

	addEntity(id, ent){
		this.entities[id] = ent;
		world.addEntity(ent);
	}

	setEntityPosition(id, transform){
		const ent = this.entities[id];

		ent.position.x = Number(transform.position.x);
		ent.position.y = Number(transform.position.y);
		ent.rotate(Number(transform.rotation));
	}

	moveEntity(id, transform){
		const ent = this.entities[id];

		ent.position.x = lerp(ent.position.x, transform.position.x, .8);
		ent.position.y = lerp(ent.position.y, transform.position.y, .8);
		ent.rotate(transform.rotation);
	}

	updatePlayerScore(id, score) {
		this.entities[id].score = score;
		let i = 0;
		for (const entid in this.players) {
			const player = this.players[entid];
			let scoreText = document.getElementById(`player${i+1}_score`);
			let scoreName = document.getElementById(`player${i+1}_name`);
			if (scoreText)
				scoreText.innerText = this.entities[entid].score;
			if (scoreName)
				scoreName.innerText = player.uname;
			i++;
		}
	}

	removeEntity(id){
		world.removeEntity(this.entities[id]);
		delete this.entities[id];
	}
}

let world = new World();
ctx.fillStyle = '#d8d3d3';
world.addSystem(new RenderSystem());

let intervalId;

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

let lobbyId;
let matchType;

function selectGamemode(groupName){
	if (!groupName){
		world.addSystem(new CollisionSystem());
		world.addSystem(new MovementSystem());
		manager = new PongLocalManager();
	} else {
		let split = groupName.split('_');
		matchType = split.length > 0 ? split[0] : undefined;
		lobbyId = split.length > 1 ? split[1] : undefined;
		const token = localStorage.getItem('access_token');
		socket = new WebSocket(`ws://${window.location.host}/ws/pong/${groupName}/?token=${token}`);
		setupCloseWebsocket(socket);
		window.addEventListener('keypress', sendMovementInput);
		window.addEventListener('keyup', sendMovementInput);
		manager = new RemoteHandler();
		setupSocketHandlers(socket);
	}
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
		const data = event.data.split(';');

		//newEntity		ne;id;type;xpos;ypos;rotation;?.height
		//updatePos		up;id;xpos;ypos;rot
		//setPos 		sp;id;xpos;ypos;rot
		//roundStart 	rs
		//setScore 		ss;id;score
		//initPlayer 	ip;entid;uid;uname
		//disconnect 	dc;id
		//gameOver 		go
		//drawDot 		dd;x;y
		//drawLine 		dl;x1;y1;x2;y2

		if (data[0] !== 'up')
			console.log(data);
		if (data[0] === 'ne'){
			manager.newEntity(data[2], data[1], {position: {x: data[3], y: data[4]}, rotation: data[5]}, data[6]);
		} else if (data[0] === 'up'){
			manager.moveEntity(data[1], {position: {x: data[2], y: data[3]}, rotation: data[4]});
		} else if (data[0] === 'sp'){
			manager.setEntityPosition(data[1], {position: {x: data[2], y: data[3]}, rotation: data[4]});
		} else if (data[0] === 'rs'){
			starRound();
		} else if (data[0] === 'ss'){
			manager.updatePlayerScore(data[1], data[2])
		} else if (data[0] === 'ip') {
			manager.addPlayer(data[1], data[2], data[3]);
		} else if (data[0] === 'dc') {
			let player = manager.players[data[1]];
			displayDisconnect(player.uname);
			endGame();
		} else if (data[0] === 'go') {
			endGame();
		} else if (data[0] === 'dd'){
			ctx.fillStyle = 'red';
			ctx.fillRect(data[1], data[2], 5, 5);
			ctx.fillStyle = 'white';
		} else if (data[0] === 'dl'){
			drawLine(new Vector(data[1], data[2]), new Vector(data[3], data[4]), 'blue');
		}
	}
	
	socket.onclose = () => {
		console.log('GAME SOCKET CLOSED!');
		clearInterval(intervalId);
		world.entities = [];
	}
}

function endGame() {
	clearInterval(intervalId);
	world.entities = [];
	if (matchType === 'match') {
		setTimeout(() => showSection('menu_online_lobby', lobbyId), 2000);
	} else if (matchType === 'tournament') {
		setTimeout(() => showSection('menu_tournament_roundrobin', lobbyId), 2000);
	} else {
		setTimeout(() => showSection('menu'), 2000);
	}
}

function setupCloseWebsocket(socket) {
	const logoutButton = document.getElementById('logoutButton');
	const homeButton = document.getElementById('webpong-button');

	const closeSocket = () => {
		socket.close();
		homeButton.removeEventListener('click', closeSocket);
		logoutButton.removeEventListener('click', closeSocket);
	}

	homeButton.addEventListener('click', closeSocket)
	logoutButton.addEventListener('click', closeSocket);
}


// COUNTDOWN TEST

let countdown = 3;
let countdownInterval;

function starRound() {
	console.log('start the countdown!');
	countdown = 3
	let countdownDisplay = document.getElementById('countdownDisplay');
	if (!countdownDisplay)
		return;
	countdownDisplay.textContent = countdown.toString();
	countdownDisplay.style.display = 'block';
	countdownInterval = setInterval(updateCountdown, 1000);
}

async function updateCountdown() {
	
	let countdownDisplay = document.getElementById('countdownDisplay');
	if (!countdownDisplay)
		return ;
	if (countdown > 1) {
		countdown--;
		countdownDisplay.textContent = countdown.toString();
	} else {
		clearInterval(countdownInterval);
		countdownDisplay.style.display = 'none';
		
		console.log('Game started!');
	}
}

function displayDisconnect(name) {
	clearInterval(countdownInterval);
	let countdownDisplay = document.getElementById('countdownDisplay');
	
	countdownDisplay.innerHTML = `<p>${name} disconnected!</p>`;
	countdownDisplay.style.display = 'block';
}