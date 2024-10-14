import threading, time, asyncio

from typing import List, Dict, Tuple
from .GameSystem import *

# Constants
PLAYER_MOVE_SPEED = 20
CANVAS_WIDTH = 1640
CANVAS_HEIGHT = 780

class Ball(Entity):
	def __init__(self, x=CANVAS_WIDTH // 2, y=CANVAS_HEIGHT // 2):
		super().__init__(x, y)
		self.add_component(Mesh, Circle(40))
		self.physics = Physics(0, 0, False, False)
		self.add_component(Physics, self.physics)
		self.last_hit = None

	def move(self, x_add, y_add):
		new_pos = self.position.add(Vector(x_add, y_add))
		self.position = new_pos

	def on_collision(self, other, collision_point=None):
		if isinstance(other, Player):
			self.last_hit = other
		if collision_point is None:
			return
		ba = self.position.sub(collision_point)
		ba.normalize()
		tangent = Plane(collision_point, ba)
		velocity_normalized = self.physics.velocity.dup().normalize()
		dot_product = tangent.dir.dot(velocity_normalized)
		reflection = velocity_normalized.dup().sub(ba.scale(2 * dot_product))
		reflection.scale(self.physics.velocity.length())
		self.physics.set_velocity(reflection)

	def move(self, x_add, y_add):
		new_pos = Vector(self.position.x + x_add, self.position.y + y_add)
		if self.position.x != new_pos.x or self.position.y != new_pos.y:
			asyncio.run_coroutine_threadsafe(remoteHandler.host.channel_layer.group_send(
				remoteHandler.host.group_name,
				{
					'type': 'move_entity',
					'id': self.id,
					'transform': self.serialize()
				}
				),
				event_loop)
		self.position = new_pos

class Player(Entity):
	def __init__(self, x, y, height=250):
		super().__init__(x, y)
		self.height = height
		self.mesh = Box(25, self.height)
		self.physics = Physics(0, 0, True, False)
		self.add_component(Mesh, self.mesh)
		self.add_component(Physics, self.physics)
		self.score = 0
		self.start_pos = None
		self.goal_height = 0

	def move(self, x_add, y_add):
		new_pos = self.position.add(Vector(x_add, y_add))

		# Check if the new player position is still in range of its goal
		if self.start_pos is not None:
			ab = new_pos.sub(self.start_pos)
			len = ab.length()
			if (len == 0):
				len = 0.00001
			ab.scale((len + self.mesh.height * 0.5) / len)
			if len > self.goal_height * 0.5:
				return

		# Check if the mesh is still inside the canvas
		transformed_points = [p.dup().rotate(self.rotation).add(new_pos) for p in self.mesh.points]
		for point in transformed_points:
			if point.x < 0 or point.y > CANVAS_WIDTH:
				return
			if point.x < 0 or point.y > CANVAS_HEIGHT:
				return
		if self.position.x != new_pos.x or self.position.y != new_pos.y:
			asyncio.run_coroutine_threadsafe(remoteHandler.host.channel_layer.group_send(
				remoteHandler.host.group_name,
				{
					'type': 'move_entity',
					'id': self.id,
					'transform': self.serialize()
				}
				),
				event_loop)
		self.position = new_pos

	def handle_remote_movement(self, input):
		if input == 1:
			dir = Vector(self.up.x, self.up.y)
			dir.scale(PLAYER_MOVE_SPEED)
			self.physics.velocity = dir
			print('will go up')
		elif input == 2:
			dir = Vector(self.up.x, self.up.y)
			dir.scale(-PLAYER_MOVE_SPEED)
			print('will go down')
			self.physics.velocity = dir
		elif input == 0:
			self.physics.set_velocity(0, 0)
			print('will stop moving')

	def on_collision(self, other, collision_point=None):
		ophys = other.get_component(Physics)
		if ophys and collision_point and isinstance(other, Ball):
			drall = collision_point.sub(self.position)
			prev_scale = ophys.velocity.length()
			drall.normalize()
			drall.scale(10)
			ophys.velocity = ophys.velocity.add(drall)
			ophys.velocity.normalize()
			ophys.velocity.scale(prev_scale)

class Wall(Entity):
	def __init__(self, x, y, rot, height):
		super().__init__(x, y)
		self.height = height
		self.mesh = Box(10, height, True)
		self.rotate(rot)
		self.add_component(Mesh, self.mesh)

playerCount = 0

class RemoteHandler:
	def __init__(self) -> None:
		self.players = []
		self.host = None
		self.maxId = 0

	async def addPlayer(self, consumer, player=None):
		print('add player called')
		if self.host == None:
			self.host = consumer
		self.players.append(consumer)
		if len(self.players) == 2:
			asyncio_thread = threading.Thread(target=thread_main)
			asyncio_thread.start()

			game_thread = threading.Thread(target=game_loop)
			game_thread.start()
		# await self.getCurrentState(consumer)
		print('assign on remote Player the entity as local player')
		
	
	async def getCurrentState(self, consumer):
		print(world.entities)
		for ent in world.entities:
			print('Sending ent id:', ent.id)
			await consumer.client_create_entity(
				{
					'type': 'client_create_entity',
					'id': ent.id,
					'entType': type(ent).__name__,
					'transform': ent.serialize(),
					'constr':{
						'height': 0 if not hasattr(ent, 'height') else ent.height
					}
				}
			)

	async def removePlayer(self, consumer):
		pass
		# if consumer == self.host:
		# 	self.host = next(iter(self.players.keys()))
		# if consumer in self.players:
		# 	del self.players[consumer]


class PlayerSection:
	def __init__(self, x, y, rotation, height):
		self.goal = Wall(x, y, rotation, height)
		self.player = Player(x, y, height * 0.33)
		self.bind_player()

	def bind_player(self):
		self.player.position = self.goal.position
		self.player.rotate(self.goal.rotation)
		if self.player.up.dot(Vector(0, -1)) < 0:
			self.player.rotate(180)
		
		forward = Vector(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2).sub(self.player.position)
		forward.normalize()
		forward.scale(75)
		forward = forward.add(self.player.position)
		self.player.position = forward
		self.player.start_pos = forward
		self.player.goal_height = self.goal.height

class GameLogicManager(Entity):
	def __init__(self):
		super().__init__(0, 0)
		self.sections = []
		self.initalized = False
	
	def buildDynamicField(self, playerCount):
		if playerCount == 2:
			self.sections.append(PlayerSection(0, CANVAS_HEIGHT * .5, 0, CANVAS_HEIGHT))
			self.sections.append(PlayerSection(CANVAS_WIDTH, CANVAS_HEIGHT * .5, 0, CANVAS_HEIGHT))
			world.addEntity(Wall(CANVAS_WIDTH * .5, 0, 90, CANVAS_WIDTH))
			world.addEntity(Wall(CANVAS_WIDTH * .5, CANVAS_HEIGHT, 90, CANVAS_WIDTH))
			# return
		# center = Vector(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
		# point1 = Vector(0, -CANVAS_HEIGHT / 2)
		# rotationStep = 360 / playerCount
		# rot = (rotationStep) / 2
		# point2 = point1.dup().rotate(rotationStep)
		# for i in range(playerCount):
		# 	ba = point2.sub(point1)
		# 	ba.scale(0.5)
		# 	midpoint = ba.add(point1)
		# 	midpoint = midpoint.add(center)
		# 	self.sections.append(PlayerSection(midpoint.x, midpoint.y, rot + 90, ba.length() * 2))
		# 	point1.rotate(rotationStep)
		# 	point2.rotate(rotationStep)
		# 	rot += rotationStep
		for section in self.sections:
			world.addEntity(section.player)
			world.addEntity(section.goal)

	def update(self):
		if self.initalized == False and len(remoteHandler.players) >= 2:
			self.buildDynamicField(len(remoteHandler.players))
			print('built field with players')
			i = 0
			for consumer in remoteHandler.players:
				print('iter', i)
				asyncio.run_coroutine_threadsafe(remoteHandler.getCurrentState(consumer), event_loop)
				consumer.player_c = self.sections[i].player
				# asyncio.run_coroutine_threadsafe(remoteHandler.addPlayer(consumer, self.sections[i].player), event_loop)
				i += 1
			self.initalized = True
			print('assigned players to remote connection')

world = World()
world.addSystem(CollisionSystem())
world.addSystem(MovementSystem())

remoteHandler = RemoteHandler()
gameLogic = GameLogicManager()


world.addEntity(gameLogic)

def game_loop():
	while True:
		world.update()
		time.sleep(0.016)

event_loop = None

def thread_main():
	global event_loop
	event_loop = asyncio.new_event_loop()
	asyncio.set_event_loop(event_loop)
	event_loop.run_forever()

asyncio_thread = None
game_thread = None
# asyncio_thread = threading.Thread(target=thread_main)
# asyncio_thread.start()

# game_thread = threading.Thread(target=game_loop)
# game_thread.start()


class GameHandler:
	
	# Statics?
	game_sessions = {}

	def __init__(self, group_name):
		print('GameHandler() called')
		self.group_name = group_name
		self.players = []

	@staticmethod
	def add_consumer_to_game(consumer, group_name):
		if group_name in GameHandler.game_sessions:
			print('Group exists in handler, we push the player')
			GameHandler.game_sessions[group_name].players.append(consumer)
			return
		print('First player of group we create a new GameHandler')
		GameHandler.game_sessions[group_name] = GameHandler(group_name=group_name)
