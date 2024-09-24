import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
import redis
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from .Pong import *

redis = redis.Redis(host='redis', port=6379, db=0)
class MyConsumer(AsyncWebsocketConsumer):  
	player = 'DEFAULT'
	
	async def connect(self):
		User = get_user_model()
		self.group_name = self.scope['url_route']['kwargs']['group_name']
		self.user = self.scope["user"]
		try: 
			user = await sync_to_async(User.objects.get)(id=self.user.id)
		except User.DoesNotExist:
			print('User does not exist')	
		print(f"ANZAHL GROUP: {redis.scard(self.group_name)}")

		world.addEntity(Player(100, 300))

		if (redis.exists(self.group_name) and redis.scard(self.group_name) > 0):
			self.player = 'Player2'
			print('PLAYER2')
		else:
			self.player = 'Player1'
			print('PLAYER1')


		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)
		await self.accept()
		redis.sadd(self.group_name, self.user.id)
		await self.channel_layer.group_send(
			self.group_name,
			{
				'type': 'newPlayerMsg',
				'player': self.player,
				'uid': self.user.id,
				'username': user.username
			}
		)

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.group_name,
			self.channel_name
		)
		await self.channel_layer.group_send(
			self.group_name,
			{
				'type': 'disconnectedMsg',
				'player': self.player
			}
		)
		redis.srem(self.group_name, self.user.id)

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		print(f"text:data: {text_data_json}")
		
		ws_type = text_data_json.get('type', 'DEFAULT')
		#Hier wird der game_loop decoded und anschließend die positionen and den Gegner weitergeleitet!
		if (ws_type == 'game_loop'):
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'update_playerMsg',
					'sender': self.player,
					'foes_posX': text_data_json.get('x'),
					'foes_posY': text_data_json.get('y')
				}
			)
		elif (ws_type == 'game'):
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'game',
					'user': text_data_json.get('user'),
					'player1_posX': text_data_json.get('player1_posY', 0),
					'player1_posY': text_data_json.get('player1_posY', 0),
					'player2_posX': text_data_json.get('player2_posX'),
					'player2_posY': text_data_json.get('player2_posY'),
				}
			)
		elif(ws_type == 'chat_message'):
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'chat_message',
					'user': text_data_json.get('user'),
					'message': text_data_json.get('message')
				}
			)



	async def newPlayerMsg(self,event):
		# if self.player == event.get('player'):
		# 	print('-------------------')
		# 	print('PLAYER:')
		# 	print(self.player)
		# 	print(event.get('player'))
		# 	print('------------------')
		# 	return 
		# print(f"NEWPLAYER: {self.player}")
		users_data = {
				'type': 'newPlayer',
				'player': event.get('player'),
				'uid': event.get('uid'),
				'username': event.get('username')
		}
		await self.send(text_data=json.dumps(users_data))

	async def disconnectedMsg(self, event):
		users_data = {
			'type': 'disconnected',
			'player': event.get('player')
		}
		await self.send(text_data=json.dumps(users_data))
	
	async def update_playerMsg(self, event):
		if (self.player == event.get('sender')):
			return
		users_data = {
			'type': 'updatePlayer',
			'player': event.get('sender'),
			'pos': {
				'x': event.get('foes_posX'), 
				'y': event.get('foes_posY')
			},
		}
		await self.send(text_data=json.dumps(users_data))

""" 
				player1_posX: 1,
				player1_posY: 0.3,
				player2_posX: 4,
				player2_posY: 0.7,
				ball_posX: 12,
				ball_posY: 0.02,
 """

""" 
self.scope:
-	scope ist ein Dictionary, das alle relevanten Informationen über die WebSocket-Verbindung enthält. 
	Es wird von Django Channels für jeden WebSocket-Request automatisch erstellt.

-	self.scope['url_route']['kwargs']['group_name']: Dies ist der Zugriff auf den dynamischen Teil der URL.
	-	self.scope['url_route'] enthält Informationen über den URL-Pfad.
	-	kwargs ist ein Dictionary, das alle Parameter enthält, die in der URL mit regulären Ausdrücken erfasst wurden.
	-	group_name ist der Wert, der aus der URL extrahiert wurde (z.B. "mygroup").

-	self.channel_layer.group_add(...):
	-	Hier wird der aktuelle WebSocket-Client zu einer Gruppe hinzugefügt.
	-	self.group_name: Dies ist der Name der Gruppe, den du aus der URL extrahiert hast.
	-	self.channel_name: Dies ist die eindeutige Kennung des WebSocket-Clients.
-	await self.accept():
Diese Methode akzeptiert die eingehende WebSocket-Verbindung. Ohne diesen Aufruf wird die Verbindung nicht hergestellt.
 """

class UserStatus(AsyncWebsocketConsumer):
	async def connect(self):
		self.group_name = 'online_status'
		self.user = self.scope["user"]
		if (self.user.is_authenticated):
			await self.channel_layer.group_add(
				self.group_name,
				self.channel_name
			)
			await self.accept()
			redis.sadd('online_users', self.user.id)
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'send_online_users',
				}
			)
		else:
			print("NOT AUTHENTICATED")
		
	async def disconnect(self, close_code):
		if (self.user.is_authenticated):
			await self.channel_layer.group_discard(
				self.group_name,
				self.channel_name
			)
			redis.srem('online_users', self.user.id)
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'send_online_users',
				}
			)


	async def send_online_users(self, event):
		#try:
		User = get_user_model()
		online_users_ids = redis.smembers("online_users")
		print(f"SELF USER: {self.user}")
		print(f"SELF USER_id: {self.user.id}")

		online_users_ids = [int(user_id) for user_id in online_users_ids]
		#friend_ids = await sync_to_async(list)(Friendship.objects.filter )
		online_users = await sync_to_async(list)(User.objects.filter(id__in=online_users_ids))
		online_users_data = [{'id': user.id} for user in online_users]
		print(f"ALL ONLINE USER:  {online_users_data}")
		user_data = [
			{
				'id': user.id,
				'username': user.username,
			}
			for user in online_users
		]
		
		await self.send(text_data=json.dumps({'online_users': user_data}))
		# except Exception as e:
		# 	print("ERRRRRRRRROR")
