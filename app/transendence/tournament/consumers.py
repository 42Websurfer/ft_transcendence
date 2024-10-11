import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import redis
from .utils import change_admin, create_user_structure

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
				results = json.loads(redis.get(self.group_name))
				results.append(create_user_structure(self.user.id, 'member'))
				redis.set(self.group_name, json.dumps(results))
			else:
				results = [] 
				results.append(create_user_structure(self.user.id, 'admin'))
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
			print(len(results))
			new_results = [
				result 
				for result in results if result['user_id'] != self.user.id
				]
			#neeeeeed to update admin!
			if results: 
				redis.set(self.group_name, json.dumps(results))
			else:
				redis.delete(self.group_name)
				return
			# role = redis.hget(self.group_name, self.user.id)
			# redis.hdel(self.group_name, self.user.id)
			# if role.decode() == 'admin':
			# 	change_admin(redis, self.group_name)
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
		results = json.loads(redis.get(self.group_name))
		print(results)
		user_ids = [
			result['user_id']
			for result in results
		]
		print(user_ids)
		usernames = await sync_to_async(list)(User.objects.filter(id__in=user_ids))
		user_id_to_username = {
			user.id: user.username
			for user in usernames
		}
		for result in results: 
			result['username'] = user_id_to_username.get(result['user_id'], 'Unkown')
		await self.send(text_data=json.dumps(results))
