const canvas = document.createElement('canvas');
canvas.width = 1280;
canvas.height = 720;
const ctx = canvas.getContext('2d');

var ents = [];

export function renderPong() {
	const app = document.getElementById('app');
	if (app)
		app.appendChild(canvas);
}

class Entity{
	constructor(x, y){
		this.position = {x, y};
		this.velocity = {x: 0, y: 0};
		this.width = 0;
		this.height = 0;
		ents.push(this);
	}

	onCollide(){

	}

	draw(){
		throw new Error("Draw not implemented!");
	}

	setVelocity(xVel, yVel){
		this.velocity.x = xVel;
		this.velocity.y = yVel;
	}

	move(xAdd, yAdd){
		let newPos = {x: this.position.x + xAdd, y: this.position.y + yAdd};
		if (newPos.x - this.width * 0.5 > 0 && newPos.x + this.width * 0.5 < canvas.width) 
			this.position.x = newPos.x;
		else
			this.onCollide({position: {x: newPos.x, y: this.position.y}});
		if (newPos.y - this.height * 0.5 > 0 && newPos.y + this.height * 0.5 < canvas.height)
			this.position.y = newPos.y;
		else
			this.onCollide({position: {x: this.position.x, y: newPos.y}});
	}

	update(){
		this.move(this.velocity.x, this.velocity.y);
	}
}

class Paddle extends Entity{
	constructor(x, y){
		super(x, y);
		this.width = 40;
		this.height = 250;
	}

	draw(){
		ctx.fillStyle = 'black';
		ctx.fillRect(this.position.x - this.width * 0.5, this.position.y - this.height * 0.5, this.width, this.height);
	}


	moveHandle(event){
		switch (event.type) {
			case "keydown":
				if (event.key === "ArrowDown")
					this.setVelocity(0, 10);
				if (event.key === "ArrowUp")
					this.setVelocity(0, -10);
				break;
			case "keyup":
				if (event.key === "ArrowDown" || event.key === "ArrowUp")
					this.setVelocity(0, 0);
				break;
			default:
				return; // Quit when this doesn't handle the key event.
		}
		// Cancel the default action to avoid it being handled twice
	}
}

class Ball extends Entity{
	constructor(startXVel, startYVel = 0){
		super(canvas.width * 0.5, canvas.height * 0.5);
		this.velocity.x = startXVel;
		this.velocity.y = startYVel;
		this.width = this.height = 40;
	}

	onCollide(other){
		if (!other)
			return;
		if (other.position.x > this.position.x)
			this.velocity.x = this.velocity.
		if (other.position.y != this.position.y)
			this.velocity.y = -this.velocity.y;
	}

	draw(){
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.width * 0.5, 0, 360);
		ctx.closePath();
		ctx.fillStyle = 'black';
		ctx.fill();
	}
}

let ball = new Ball(5, 2);
let p1 = new Paddle(canvas.width * 0.10, canvas.height * 0.5);
let p2 = new Paddle(canvas.width * 0.90, canvas.height * 0.5);

window.ball = ball;
window.p1 = p1;
window.p2 = p2;

window.addEventListener("keydown", (event) => p1.moveHandle(event));
window.addEventListener("keyup", (event) => p1.moveHandle(event));
window.addEventListener("keydown", (event) => p2.moveHandle(event));
window.addEventListener("keyup", (event) => p2.moveHandle(event));

function drawCourt() {
	// ctx.fillStyle = 'green';
	// ctx.strokeRect(1, 1, canvas.width - 1, canvas.height - 1);
	ctx.setLineDash([5, 5]);
	ctx.lineWidth = 5;
	ctx.beginPath();
	ctx.moveTo(canvas.width / 2, 0);
	ctx.lineTo(canvas.width / 2, canvas.height);
	ctx.stroke();
	ctx.closePath();
}

setInterval(function(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawCourt();
	for (const ent of ents) {
		ent.update();
		ent.draw();
	}
}, 10);
