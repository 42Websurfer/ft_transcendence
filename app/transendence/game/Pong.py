import threading, time, asyncio

from typing import List, Dict, Tuple
from .GameSystem import *

# Constants
PLAYER_MOVE_SPEED = 20
CANVAS_WIDTH = 1280
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
		self.physics.set_velocity_v(reflection)

	def move(self, x_add, y_add):
		new_pos = Vector(self.position.x + x_add, self.position.y + y_add)
		if self.position.x != new_pos.x or self.position.y != new_pos.y:
			asyncio.run_coroutine_threadsafe(thread_local.host.channel_layer.group_send(
				thread_local.host.group_name,
				{
					'type': 'move_entity',
					'id': self.id,
					'transform': self.serialize()
				}
				),
				thread_local.event_loop)
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
			self.position = new_pos
			#send new position to everyone
			asyncio.run_coroutine_threadsafe(thread_local.host.channel_layer.group_send(
				thread_local.host.group_name,
				{
					'type': 'move_entity',
					'id': self.id,
					'transform': self.serialize()
				}
				),
				thread_local.event_loop)

	def handle_remote_movement(self, input):
		if input == 1:
			dir = Vector(self.up.x, self.up.y)
			dir.scale(PLAYER_MOVE_SPEED)
			self.physics.velocity = dir
		elif input == 2:
			dir = Vector(self.up.x, self.up.y)
			dir.scale(-PLAYER_MOVE_SPEED)
			self.physics.velocity = dir
		elif input == 0:
			self.physics.set_velocity(0, 0)

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

async def getCurrentState(world, consumer):
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

class GameLogicManager(Entity):
	def __init__(self):
		super().__init__(0, 0)
		self.sections = []
		self.ball = Ball()
		self.initalized = False
	
	def buildDynamicField(self, world, playerCount):
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
		world.addEntity(self.ball)
		for section in self.sections:
			section.goal.on_collision_lambda = lambda other: (
				print('SOME goal scored')
				# other.last_hit.score + 1 if other.last_hit and other.last_hit != section.player else (
				# 	other.second_last_hit.score + 1 if other.second_last_hit else print("WHAT THE HECK DO WE DO NOW?")
				# ),
				# section.reset_round()
			) if isinstance(other, Ball) else None
			world.addEntity(section.player)
			world.addEntity(section.goal)



thread_local = threading.local()

#all the stuff for one pong game
class PongGame:
	def __init__(self, player1, player2):
		self.game_complete = False #not needed jet
		self.stop_thread = False
		self.player1 = player1
		self.player2 = player2
		self.world = World()
		self.world.addSystem(CollisionSystem())
		self.world.addSystem(MovementSystem())
		self.gameLogic = GameLogicManager()

		self.world.addEntity(self.gameLogic)
		self.event_loop = None
		self.asyncio_thread = None
		self.game_thread = None


	def start_game(self):

		print('Starting threads and game!')

		self.gameLogic.buildDynamicField(self.world, 2)
		self.player1.player_c = self.gameLogic.sections[0].player
		self.player2.player_c = self.gameLogic.sections[1].player

		self.event_loop = asyncio.new_event_loop()
		self.asyncio_thread = threading.Thread(target=self.thread_main)
		self.asyncio_thread.start()

		self.game_thread = threading.Thread(target=self.game_loop)
		self.game_thread.start()

		asyncio.run_coroutine_threadsafe(getCurrentState(self.world, self.player1), self.event_loop)
		asyncio.run_coroutine_threadsafe(getCurrentState(self.world, self.player2), self.event_loop)

	def stop(self):
		print('stopping all threads of this game?')
		self.stop_thread = True
		self.event_loop.stop()

	def game_loop(self):
		thread_local.asyncio_thread = self.asyncio_thread
		thread_local.game_thread = self.game_thread
		thread_local.event_loop = self.event_loop
		thread_local.host = self.player1
		thread_local.world = self.world
		iter = 0
		while not self.stop_thread:
			self.world.update()
			time.sleep(0.016)
			if iter == 1000:
				print('game running on', self.player1.group_name)
				iter = 0
			iter += 1
		print('game loop stopped of group', self.player1.group_name)

	def thread_main(self):
		asyncio.set_event_loop(self.event_loop)
		self.event_loop.run_forever()




class GamesHandler:
	
	# Statics?
	game_sessions = {}

	def __init__(self, group_name):
		print('GamesHandler() called')
		self.group_name = group_name
		self.players = []
		self.game = None

	@staticmethod
	def add_consumer_to_game(consumer, group_name):
		if group_name in GamesHandler.game_sessions:
			print('Group exists in handler, we push the player')
			GamesHandler.game_sessions[group_name].add_consumer(consumer)
			return
		print('First player of group we create a new GamesHandler')
		new_handler = GamesHandler(group_name=group_name)
		new_handler.add_consumer(consumer)
		GamesHandler.game_sessions[group_name] = new_handler

	@staticmethod
	def disconnect_consumer_from_game(consumer, group_name):
		if group_name in GamesHandler.game_sessions:
			print('Group exists in handler, we remove the player')
			GamesHandler.game_sessions[group_name].remove_consumer(consumer)
			if GamesHandler.game_sessions[group_name].players.__len__() == 0:
				GamesHandler.game_sessions.pop(group_name)
		print('Number of handlers:', len(GamesHandler.game_sessions))

	def add_consumer(self, consumer):
		print('GamesHandler.add_consumer() called')
		if self.players.__len__() < 2:
			self.players.append(consumer)
		else:
			print('too many players!!! disconnect consumer')
		if self.players.__len__() == 2:
			print('init PongGame class!')
			self.game = PongGame(self.players[0], self.players[1])
			self.game.start_game()
	
	def remove_consumer(self, consumer):
		print('GamesHandler.remove_consumer() called')
		if self.players.__len__() >= 1:
			self.players.remove(consumer)
		else:
			print('no consumers in this lobby?')
		if self.game is not None and self.players.__len__() == 0:
			self.game.stop()
