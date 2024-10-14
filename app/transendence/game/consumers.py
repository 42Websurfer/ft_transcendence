import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
import redis
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model

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
