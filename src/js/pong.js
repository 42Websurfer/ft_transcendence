import {Vector, Plane, World, Entity, Mesh, Physics, Network, Box, Circle, RenderSystem, CollisionSystem, MovementSystem, canvas, drawText, strokeText, drawLine, ctx} from './GameSystem.js';
import { showSection } from './index.js';

const PLAYER_MOVE_SPEED = 20;
const BALL_MOVE_SPEED = 15;

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
		window.addEventListener('keydown', (event) => this.player.keyDown(event));
		window.addEventListener('keyup', (event) => this.player.keyUp(event));
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
		this.round_running = false;
		this.counter = Date.now();
		this.starter = undefined;
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

		this.sections.forEach( section => {
			this.updatePlayerScore(section.player);
			section.goal.onTrigger = (other) =>{
				if (other instanceof Ball){
					if (other.lastHit){
						if (other.lastHit != section.player){
							other.lastHit.score++;
							this.updatePlayerScore(other.lastHit)
						} else if(other.secondLastHit) {
							other.secondLastHit.score++;
							this.updatePlayerScore(other.secondLastHit)
						}
					} else {
						console.log("WHAT THE FUCK DO WE DO NOW?");
					}
					this.resetRound();
				}
			};
		});

		this.starter = this.sections[0].player;
	}

	updatePlayerScore(playerScored) {
		this.starter = playerScored;
		let section = this.sections.find((value) => value.player == playerScored);
		let idx = this.sections.indexOf(section);
		console.log('idx:', idx);
		let scoreText = document.getElementById(`player${idx+1}_score`);
		let scoreName = document.getElementById(`player${idx+1}_name`);
		if (scoreText)
			scoreText.innerText = playerScored.score;
		if (scoreName)
			scoreName.innerText = idx > 0 ? 'localP2' : 'localP1';
	}

	resetRound() {
		this.ball.resetBall();
		
		this.winner = this.playerHasWon();
		if (this.winner) {
			console.log('we have a winner', this.winner);
			return ;
		}
		this.round_running = false;
		this.counter = Date.now();
	}

	playerHasWon() {
		for (let section of this.sections) {
			if (section.player.score >= 7) {
				let lead = true;
				for (let osection of this.sections) {
					if (osection != section) {
						if (Math.abs(section.player.score - osection.player.score) < 2) {
							lead = false;
							break;
						}
					}
				}
				if (lead) {
					return section.player;
				}
			}
		}
		return undefined;
	}
	
	update() {
		if (this.winner)
			return;
		if (!this.round_running) {
			if (Date.now() - this.counter >= 3000.0) {
				let dir  = new Vector(canvas.width * 0.5, canvas.height * 0.5).sub(this.starter.position);
				dir.y = 0;
				dir.normalize();
				dir.scale(BALL_MOVE_SPEED);
				this.ball.physics.setVelocity(dir.x, dir.y);
				this.ball.lastHit = this.starter;
				this.round_running = true;
			} else if (this.starter) {
				console.log('round not running time < 3s and we have starter');
				let direction = new Vector(canvas.width * 0.5, canvas.height * 0.5).sub(this.starter.position);
				direction.y = 0;
				direction.normalize();
				direction.scale(50);
				direction = this.starter.position.add(direction);
				this.ball.position.x = direction.x;
				this.ball.position.y = direction.y;
			}
		}
		this.ball.physics.velocity.scale(1.0001); //fun idea to increase speed of ball over time :)
		if (this.ball.position.sub(new Vector(canvas.width * 0.5, canvas.height * 0.5)).sqrLength() > (Math.pow(canvas.width * 1.5, 2))) {
			this.resetRound();
		}
	}

	cleanup(){
		this.sections.forEach(section => {
			let success = window.removeEventListener('keydown', section.player.keyDown);
			success = window.removeEventListener('keyup', section.player.keyUp);
			if (!success)
				console.error('could not remove event listener')
		});
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
		window.addEventListener('keypress', sendMovementInput);
		window.addEventListener('keyup', sendMovementInput);
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
		this.setEntityPosition(ent.id, data.transform);
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

		ent.position.x = transform.position.x;
		ent.position.y = transform.position.y;
		ent.rotate(transform.rotation);
	}

	moveEntity(id, transform){
		const ent = this.entities[id];

		ent.position.x = lerp(ent.position.x, transform.position.x, .8);
		ent.position.y = lerp(ent.position.y, transform.position.y, .8);
		ent.rotate(transform.rotation);
	}

	updatePlayerScore(id, score) {
		manager.entities[id].score = score;
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

	cleanup(){
		window.removeEventListener('keypress', sendMovementInput);
		window.removeEventListener('keyup', sendMovementInput);
	}
}

let world = new World();
ctx.fillStyle = '#d8d3d3';

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
	world.addSystem(new RenderSystem());
	if (!groupName){
		world.addSystem(new CollisionSystem());
		world.addSystem(new MovementSystem());
		manager = new PongLocalManager();
		setupCloseLocal();
	} else {
		let split = groupName.split('_');
		matchType = split.length > 0 ? split[0] : undefined;
		lobbyId = split.length > 1 ? split[1] : undefined;
		const token = localStorage.getItem('access_token');
		socket = new WebSocket(`ws://${window.location.host}/ws/pong/${groupName}/?token=${token}`);
		setupCloseWebsocket(socket);
		manager = new RemoteHandler();
		setupSocketHandlers(socket);
	}
	world.addEntity(manager);
	intervalId = setInterval(function() {
		world.update();
	}, 16);
}

function setupSocketHandlers(socket){

	socket.onopen = () => {
		console.log("Connection to remote Pong serverer");
	}
	
	socket.onmessage = (event) => {
		if (event.data[0] !== '{') {
			const data = event.data.split(';');
			manager.moveEntity(data[0], {position: {x: data[1], y: data[2]}, rotation: data[3]});
			return;
		}
		const data = JSON.parse(event.data);

		if (!data.hasOwnProperty('type'))
			console.log("Typeless:", data);
		if (data.type !== 'updatePos')
			console.log(data);
		if (data.type === 'newEntity'){
			manager.newEntity(data);
		} else if (data.type === 'updatePos'){
			manager.moveEntity(data.id, data.transform);
		} else if (data.type === 'setPos'){
			manager.setEntityPosition(data.id, data.transform);
		} else if (data.type === 'roundStart'){
			starRound();
		} else if (data.type === 'setScore'){
			manager.updatePlayerScore(data.id, data.score)
		} else if (data.type === 'initPlayer') {
			manager.addPlayer(data.ent_id, data.uid, data.uname);
		} else if (data.type === 'disconnected') {
			let player = manager.players[data.id];
			displayDisconnect(player.uname);
			endGame();
		} else if (data.type === 'gameOver') {
			// socket.close();
			endGame();
		} else if (data.type === 'drawDot'){
			ctx.fillStyle = 'red';
			ctx.fillRect(data.x, data.y, 5, 5);
			ctx.fillStyle = 'white';
		} else if (data.type === 'drawLine'){
			drawLine(new Vector(data.x1, data.y1), new Vector(data.x2, data.y2), 'blue');
		}
	}
	
	socket.onclose = () => {
		console.log('GAME SOCKET CLOSED!');
		clearInterval(intervalId);
		world.entities = [];
		world.systems = [];
	}
}

function endGame() {
	clearInterval(intervalId);
	manager.cleanup();
	world.entities = [];
	world.systems = [];
	if (matchType === 'match') {
		setTimeout(() => showSection('menu_online_lobby', lobbyId), 2000);
	} else if (matchType === 'tournament') {
		setTimeout(() => showSection('menu_tournament_roundrobin', lobbyId), 2000);
	} else {
		// setTimeout(() => showSection('menu'), 2000);
		showSection('menu');
	}
}

function setupCloseLocal() {
	const logoutButton = document.getElementById('logoutButton');
	const homeButton = document.getElementById('webpong-button');

	const closeGame = () => {
		console.log("CLOSING LOCAL GAME!");
		endGame();
		homeButton.removeEventListener('click', closeGame);
		logoutButton.removeEventListener('click', closeGame);
	}

	homeButton.addEventListener('click', closeGame)
	logoutButton.addEventListener('click', closeGame);
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