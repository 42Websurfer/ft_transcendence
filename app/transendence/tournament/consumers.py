import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import redis
from .utils import create_user_structure

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
			User = get_user_model()
			user = await sync_to_async(User.objects.get)(id=self.user.id)		
			if redis.exists(self.group_name):
				results = json.loads(redis.get(self.group_name))
				results.append(create_user_structure(self.user.id, 'member', user.username))
				redis.set(self.group_name, json.dumps(results))
			else:
				results = [] 
				results.append(create_user_structure(self.user.id, 'admin', user.username))
				redis.set(self.group_name, json.dumps(results))
				
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
			results = json.loads(redis.get(self.group_name))
			
			new_results = []
			admin_disconnected = False

			for result in results:
				if result['user_id'] == self.user.id:
					if result['role'] == 'admin':
						admin_disconnected = True
				else:
					new_results.append(result)

			if (admin_disconnected and new_results):
				new_results[0]['role'] = 'admin'
			
			if new_results: 
				redis.set(self.group_name, json.dumps(new_results))
			else:
				redis.delete(self.group_name)
				return
			
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'send_tournament_users',
				}
			)
	
	async def send_tournament_users(self, event):
		User = get_user_model()
		results = json.loads(redis.get(self.group_name))
		
		await self.send(text_data=json.dumps(results))
