import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
import redis
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from .Pong import *

redis = redis.Redis(host='redis', port=6379, db=0)
class MyConsumer(AsyncWebsocketConsumer):
	
	async def connect(self):
		self.player_c = None
		User = get_user_model()
		self.group_name = self.scope['url_route']['kwargs']['group_name']
		self.user = self.scope["user"]
		try: 
			user = await sync_to_async(User.objects.get)(id=self.user.id)
		except User.DoesNotExist:
			print('User does not exist')
		print(f"ANZAHL GROUP: {redis.scard(self.group_name)}")

		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)
		await self.accept()
		redis.sadd(self.group_name, self.user.id)
		GamesHandler.add_consumer_to_game(self, self.group_name)

	async def assign_player(self, pong_player):
		print('consumer gets PongPlayer assigned')
		self.player_c = pong_player
		await self.channel_layer.group_send(
			self.group_name,
			{
				'type': "init_players",
				'ent_id': pong_player.id,
				'uid': self.user.id,
				'uname': self.user.username
			}
		)
		# here send the assign local stuff maybe?


	async def disconnect(self, close_code):
		GamesHandler.disconnect_consumer_from_game(self, self.group_name)
		await self.channel_layer.group_discard(
			self.group_name,
			self.channel_name
		)
		await self.channel_layer.group_send(
			self.group_name,
			{
				'type': 'disconnectedMsg',
				'player': 'something?'
			}
		)
		redis.srem(self.group_name, self.user.id)

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		if isinstance(text_data_json, int):
			if self.player_c is not None:
				self.player_c.handle_remote_movement(text_data_json)
			return
		print(f"text:data: {text_data_json}")

	async def init_players(self, event):
		print('We send what player has wich uid and uname')
		await self.send(text_data=json.dumps(
			{
				'type': 'initPlayer',
				'ent_id': event.get('ent_id'),
				'uid': event.get('uid'),
				'uname': event.get('uname')
			}))
		

	async def client_create_entity(self, event):
		print('client_create_entity event sent:', event)
		await self.send(text_data=json.dumps({
			'type': 'newEntity',
			'entType': event.get('entType'),
			'id': event.get('id'),
			'transform': event.get('transform'),
			'constr': event.get('constr')
		}))
		print('client_create_entity event processed')

	"""
	This is to indicate an entity moved, client side will smooth out rough movements
	"""
	async def move_entity(self, event):
		# print('move_entity event sent:', event, self.player_c.id)
		# await self.send(text_data=json.dumps({
		# 	'type': 'updatePos',
		# 	'id': event.get('id'),
		# 	'transform': event.get('transform'),
		# }))

		transform = event.get('transform')
		await self.send(text_data=f"{event.get('id')};{transform['position']['x']};{transform['position']['y']};{transform['rotation']}")

	"""
	This is to set the pos aka so for ball reset
	"""
	async def set_entity_pos(self, event):
		await self.send(text_data=json.dumps({
			'type': 'setPos',
			'id': event.get('id'),
			'transform': event.get('transform'),
		}))

	async def round_start(self, event):
		await self.send(json.dumps({
			'type': 'roundStart'
		}))

	async def player_score(self, event):
		await self.send(text_data=json.dumps({
			'type': 'setScore',
			'id': event.get('id'),
			'score': event.get('score')
		}))

	async def disconnectedMsg(self, event):
		users_data = {
			'type': 'disconnected',
			'player': event.get('player')
		}
		await self.send(text_data=json.dumps(users_data))
	