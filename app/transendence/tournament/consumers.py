import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import redis

redis = redis.Redis(host='redis', port=6379, db=0)

class Tournament(AsyncWebsocketConsumer):
	async def connect(self):
		#try and catch einbauen, aber besser ohne zum debuggen
		self.user = self.scope["user"]
		self.group_name = self.scope['url_route']['kwargs']['group_name']
		if (self.user.is_authenticated):
			await self.channel_layer.group_add(
				self.group_name,
				self.channel_name
			)
			await self.accept()
			redis.sadd(self.group_name, self.user.id)
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'send_tournament_users',
				}
			)

	async def disconnect(self, close_code):
		if (self.user.is_authenticated):
			await self.channel_layer.group_discard(
				self.group_name,
				self.channel_name
			)
			redis.srem(self.group_name, self.user.id)
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'send_tournament_users',
				}
			)
			#wenn es der admin war, dann muss ein neuer Admin gesetzt werden
	
	async def send_tournament_users(self, event):
		User = get_user_model()
		tournament_user_ids = redis.smembers(self.group_name)
		tournament_users_ids = [int(user_id) for user_id in tournament_user_ids]
		tournament_user_info = await sync_to_async(list)(User.objects.filter(id__in=tournament_user_ids))
		users_data = [
			{
				'username': user.username
			}
			for user in tournament_user_info
		]
		await self.send(text_data=json.dumps({'tournaments_user': users_data}))
		