import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .Pong import *
from .utils import match_lobby_string, tournament_string, multiple_lobby_string

class MyConsumer(AsyncWebsocketConsumer):
	
	async def connect(self):
		self.player_c = None
		self.group_name = self.scope['url_route']['kwargs']['group_name']
		self.user = self.scope["user"]
		split = self.group_name.split('_')
		self.match_type = split[0] if len(split) > 0 else None
		self.lobby_id = split[1] if len(split) > 1 else None
		self.match_id = int(split[-1]) if len(split) > 3 else -1

		if self.match_type == 'tournament':
			data = redis.get(tournament_string(self.lobby_id))
			if not data:
				await self.close()
				return
			json_data = json.loads(data)
			if self.match_id < 1 or len(json_data['matches']) < self.match_id or json_data['matches'][self.match_id - 1]['status'] != 'pending':
				await self.close()
				return
		elif self.match_type == 'match':
			if self.lobby_id is None or not redis.exists(match_lobby_string(self.lobby_id)):
				await self.close()
				return
		elif self.match_type == 'multiple':
			if self.lobby_id is None or not redis.exists(multiple_lobby_string(self.lobby_id)):
				await self.close()
				return
		else:
			await self.close()
			return

		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)
		await self.accept()
		await GamesHandler.add_consumer_to_game(self, self.group_name)

	#Send table
	#newEntity		ne;id;type;xpos;ypos;rotation;?.height
	#updatePos		up;id;xpos;ypos;rot
	#setPos 		sp;id;xpos;ypos;rot
	#roundStart 	rs
	#setScore 		ss;id;score
	#initPlayer 	ip;entid;uid;uname;sender_uid
	#disconnect 	dc;id
	#gameOver 		go
	#drawDot 		dd;x;y
	#drawLine 		dl;x1;y1;x2;y2

	async def assign_player(self, pong_player):
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
		await self.channel_layer.group_discard(
			self.group_name,
			self.channel_name
		)
		await GamesHandler.disconnect_consumer_from_game(self, self.group_name)


	async def receive(self, text_data):
		try:
			text_data_json = json.loads(text_data)
			if isinstance(text_data_json, int):
				if self.player_c is not None:
					self.player_c.handle_remote_movement(text_data_json)
				return
			if text_data_json['type'] == 'incomplete':
				await getCurrentState(thread_local.world, self)
		except Exception as e:
			print(f'text_data:', text_data, 'eception:', e)

	#initPlayer 	ip;entid;uid;uname
	async def init_players(self, event):
		await self.send(text_data=f"ip;{event.get('ent_id')};{event.get('uid')};{event.get('uname')};{self.user.id}")
		
	#newEntity		ne;id;type;xpos;ypos;rotation;?.height
	async def client_create_entity(self, event):
		transform = event.get('transform')
		await self.send(text_data=f"ne;{event.get('id')};{event.get('entType')};{transform['position']['x']};{transform['position']['y']};{transform['rotation']};{event.get('height')}")

	"""
	This is to indicate an entity moved, client side will smooth out rough movements
	"""
	#updatePos		up;id;xpos;ypos;rot
	async def move_entity(self, event):
		transform = event.get('transform')
		await self.send(text_data=f"up;{event.get('id')};{transform['position']['x']};{transform['position']['y']};{transform['rotation']}")

	"""
	This is to set the pos aka so for ball reset
	"""
	#setPos 		sp;id;xpos;ypos;rot
	async def set_entity_pos(self, event):
		transform = event.get('transform')
		await self.send(text_data=f"sp;{event.get('id')};{transform['position']['x']};{transform['position']['y']};{transform['rotation']}")

	#roundStart 	rs
	async def round_start(self, event):
		await self.send(text_data='rs')

	#gameOver 		go
	async def game_over(self, event):
		await self.send(text_data='go')

	#setScore 		ss;id;score
	async def player_score(self, event):
		await self.send(text_data=f"ss;{event.get('id')};{event.get('score')}")

	#disconnect 	dc;id
	async def disconnectedMsg(self, event):
		await self.send(text_data=f"dc;{event.get('id')}")
	