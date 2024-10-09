import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import redis
from .utils import change_admin
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
			if redis.exists(self.group_name):
				redis.hset(self.group_name, self.user.id, 'member')
			else: 
				redis.hset(self.group_name, self.user.id, 'admin')
			#redis.sadd(self.group_name, self.user.id)
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
			if redis.hlen(self.group_name) == 1: 
				print(redis.hlen(self.group_name))
				redis.delete(self.group_name)
				return
			role = redis.hget(self.group_name, self.user.id)
			redis.hdel(self.group_name, self.user.id)
			if role.decode() == 'admin':
				change_admin(redis, self.group_name)
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'send_tournament_users',
				}
			)
			#wenn es der admin war, dann muss ein neuer Admin gesetzt werden
	

	#nochmal überarbeiten und dann mal testen! nicht mehr in set sondern in hasheses
	async def send_tournament_users(self, event):
		User = get_user_model()
		tournament_users = redis.hgetall(self.group_name)
		
		print(f"tournament_users: {tournament_users}")
		
		tournament_user_ids = [int(user_id) for user_id in tournament_users.keys()]
		tournament_user_info = await sync_to_async(list)(User.objects.filter(id__in=tournament_user_ids))
		
		for user in tournament_user_info:
			print(f"user.id: {user.id}, role: {tournament_users.get(str(user.id).encode('utf-8')).decode()}")
	
		
		users_data = [
			{
				'username': user.username,
				'role': tournament_users[str(user.id).encode('utf-8')].decode()
			}
			for user in tournament_user_info
		]
		await self.send(text_data=json.dumps({'tournaments_user': users_data}))
		