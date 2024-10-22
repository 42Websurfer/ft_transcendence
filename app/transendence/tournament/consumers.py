import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import redis
from .utils import create_user_structure, tournament_string, update_matches_disconnect, match_lobby_string

redis = redis.Redis(host='redis', port=6379, db=0)

class Tournament(AsyncWebsocketConsumer):
	async def connect(self):
		#try and catch einbauen, aber besser ohne zum debuggen
		self.user = self.scope["user"]
		self.group_name = self.scope['url_route']['kwargs']['group_name']
		left_user = False
		if redis.exists(self.group_name):
			results = redis.get(self.group_name)
			if results:
				results = json.loads(results)
				for user in results: 
					if user['user_id'] == self.user.id:
						left_user = True
		if (self.user.is_authenticated):
			await self.channel_layer.group_add(
				self.group_name,
				self.channel_name
			)
			await self.accept()
			User = get_user_model()
			user = await sync_to_async(User.objects.get)(id=self.user.id)		
			if (not left_user):
				if redis.exists(self.group_name):
					results = json.loads(redis.get(self.group_name))
					results.append(create_user_structure(self.user.id, 'member', user.username))
					redis.set(self.group_name, json.dumps(results))
				else:
					results = [] 
					results.append(create_user_structure(self.user.id, 'admin', user.username))
					redis.set(self.group_name, json.dumps(results))
				
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'send_tournament_users',
					'user_id': self.user.id,
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
			tournament_started = redis.exists(tournament_string(self.group_name))
			if new_results and not tournament_started: 
				redis.set(self.group_name, json.dumps(new_results))
			elif not new_results:
				redis.delete(self.group_name)
				redis.delete(tournament_string(self.group_name))
				return
			if (tournament_started):
				await update_matches_disconnect(self.user.id, self.group_name)
			#update all games again the disconnected user!
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'send_tournament_users',
					'user_id': self.user.id
				}
			)
	
	async def send_tournament_users(self, event):
		results = json.loads(redis.get(self.group_name))
		data = {
			'type': 'send_tournament_users',
			'results': results,
			'user_id': self.user.id
		}		
		await self.send(text_data=json.dumps(data))

	async def match_list(self, event):
			matchList = json.loads(redis.get(tournament_string(self.group_name)))			
			data = {
				'type': 'match_list',
				'matches': matchList
			}
			await self.send(text_data=json.dumps(data))

class OnlineMatch(AsyncWebsocketConsumer): 
	async def connect(self):
		self.user = self.scope["user"]
		self.match_name = match_lobby_string(self.scope['url_route']['kwargs']['match_name'])
		if (self.user.is_authenticated):
			await self.channel_layer.group_add(
				self.match_name, 
				self.channel_name
			)
			await self.accept()
			User = get_user_model()
			user = await sync_to_async(User.objects.get)(id=self.user.id)
			if (redis.exists(self.match_name)):
				lobby_data = json.loads(redis.get(self.match_name))
				if (lobby_data.get('member_id') == -1):
					lobby_data['member_id'] = user.id
					lobby_data['member_username'] = user.username
			else:
				lobby_data = {'admin_id': user.id, 'admin_username': user.username, 'member_id': -1,  'member_username': '', 'matches': []}
			redis.set(self.match_name, json.dumps(lobby_data))
			await self.channel_layer.group_send(
				self.match_name,
				{
					'type': 'send_online_lobby_user',
				}
			)

	async def disconnect(self, close_code):
		if (self.user.is_authenticated):
			await self.channel_layer.group_discard(
				self.match_name,
				self.channel_name
			)
			lobby_data = json.loads(redis.get(self.match_name))
			if (lobby_data.get('admin_id') is self.user.id):
				await self.close()
				redis.delete(self.match_name)
			else: 
				lobby_data['member_id'] = -1
				redis.set(self.match_name, json.dumps(lobby_data) )
			await self.channel_layer.group_send(
				self.match_name,
				{
					'type': 'send_online_lobby_user'
				}
			) 
				#now we have to set the everything in the database! oder vielleicht auch nicht

			
	async def send_online_lobby_user(self, event):
		lobby_data = json.loads(redis.get(self.match_name))
		data = {
			'type': 'send_online_users',
			'admin_id': lobby_data.get('admin_id'),
			'admin_username': lobby_data.get('admin_username'),
			'member_id': lobby_data.get('member_id'),
			'member_username': lobby_data.get('member_username'),
		}
		await self.send(json.dumps(data))

	async def send_online_match_list(self, event):
		lobby_data_json = redis.get(self.match_name)
		if (lobby_data_json):
			lobby_data = json.loads(lobby_data_json)
			data = {
				'type': 'match_list',
				'matches': lobby_data.get('matches')
			}
		await self.send(json.dumps(data))
