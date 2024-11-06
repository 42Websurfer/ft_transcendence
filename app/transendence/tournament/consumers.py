import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from .models import Tournament as TournamentModel
import redis
from .utils import sort_group_tournament
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
			User = get_user_model()
			user = await sync_to_async(User.objects.get)(id=self.user.id)		
			if (not left_user):
				tournament_data = redis.get(self.group_name)
				if redis.exists(self.group_name) and tournament_data:
					redis.sadd('user_lobbies', self.user.id) # frage?
					results = json.loads(tournament_data)
					results.append(create_user_structure(self.user.id, 'member', user.username))
					redis.set(self.group_name, json.dumps(results))
				elif redis.exists(self.group_name):
					results = [] 
					results.append(create_user_structure(self.user.id, 'admin', user.username))
					redis.set(self.group_name, json.dumps(results))
				else:
					print('TOURNAMENT INVALID LOBBY ID ALARM!')
					await self.close()
					return
			
			await self.channel_layer.group_add(
				self.group_name,
				self.channel_name
			)
			await self.accept()
				
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
			results_json = redis.get(self.group_name)
			if not results_json:
				return
			results = json.loads(results_json)			
			new_results = []
			admin_disconnected = False
			all_disconnected = True

			for result in results:
				if result['user_id'] == self.user.id:
					result['status'] = 'disconnected'
					if result['role'] == 'admin':
						admin_disconnected = True
				else:
					if result['status'] != 'disconnected':
						all_disconnected = False
					new_results.append(result)
			
			redis.srem('user_lobbies', self.user.id) # frage?
			if (admin_disconnected and new_results):
				new_results[0]['role'] = 'admin'
			tournament_started = redis.exists(tournament_string(self.group_name))
			if new_results and not tournament_started: 
				redis.set(self.group_name, json.dumps(new_results))
			elif not new_results or all_disconnected:
				redis.delete(self.group_name)
				redis.delete(tournament_string(self.group_name))
				return
			if (tournament_started):
				results = sort_group_tournament(results)
				redis.set(self.group_name, json.dumps(results))
				if not await (sync_to_async)(TournamentModel.objects.filter(tournament_id=self.group_name).exists)():
					print("\n\nKOMMEN WIR HIER ZWEI MAL REIN?!\n\n")
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
		results_json = redis.get(self.group_name)
		if not results_json:
			return
		results = json.loads(results_json)
		data = {
			'type': 'send_tournament_users',
			'results': results,
			'user_id': self.user.id
		}		
		await self.send(text_data=json.dumps(data))

	async def match_list(self, event):
		match_list_json = redis.get(tournament_string(self.group_name))
		if not match_list_json:
			return
		match_list = json.loads(match_list_json)			
		data = {
			'type': 'match_list',
			'matches': match_list
		}
		await self.send(text_data=json.dumps(data))
	
	async def start_tournament_match(self, event):
		print('self.user.id = ', self.user.id)
		print('user1 = ', event['user1'])
		print('user2 = ', event['user2'])

		if self.user.id == event['user1'] or self.user.id == event['user2']:
			data = {
				'type': 'start_tournament_match',
				'match_id': event['match_id'],
			}
			await self.send(text_data=json.dumps(data))

	async def send_round_completed(self, event):
		data = {
			'type': 'round_completed',
		}
		await self.send(text_data=json.dumps(data))

	async def send_tournament_finished(self, event):
		data = {
			'type': 'tournament_finished',
		}
		await self.send(text_data=json.dumps(data))

class OnlineMatch(AsyncWebsocketConsumer): 
	async def connect(self):
		self.user = self.scope["user"]
		self.match_name = match_lobby_string(self.scope['url_route']['kwargs']['match_name'])
		self.lobby_id = self.scope['url_route']['kwargs']['match_name']
		if (self.user.is_authenticated):
			User = get_user_model()
			user = await sync_to_async(User.objects.get)(id=self.user.id)
			match_data = redis.get(self.match_name)
			if (redis.exists(self.match_name) and match_data):
				redis.sadd('user_lobbies', user.id)
				lobby_data = json.loads(match_data)
				if (lobby_data.get('member_id') == -1):
					lobby_data['member_id'] = user.id
					lobby_data['member_username'] = user.username
			elif redis.exists(self.match_name):
				lobby_data = {'admin_id': user.id, 'admin_username': user.username, 'member_id': -1,  'member_username': '', 'matches': []}
			else:
				print('INVALID LOBBY ALARM!')
				await self.close()
				return
			
			await self.channel_layer.group_add(
				self.match_name, 
				self.channel_name
			)
			await self.accept()
			
			redis.set(self.match_name, json.dumps(lobby_data))
			await self.channel_layer.group_send(
				self.match_name,
				{
					'type': 'send_online_lobby_user',
				}
			)
			await self.channel_layer.group_send(
				self.match_name,
				{
					'type': 'send_online_match_list',
				}
			)

	async def disconnect(self, close_code):
		if (self.user.is_authenticated):
			await self.channel_layer.group_discard(
				self.match_name,
				self.channel_name
			)
			redis.srem('user_lobbies', self.user.id)
			lobby_data_json = redis.get(self.match_name)
			if not lobby_data_json:
				return 
			lobby_data = json.loads(lobby_data_json)		
			if (lobby_data.get('admin_id') == self.user.id):
				await self.channel_layer.group_send(
					self.match_name,
					{
						'type': 'close_connection',
					}
				)
				self.close()
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
		lobby_data_json = redis.get(self.match_name)
		if not lobby_data_json:
			return
		lobby_data = json.loads(lobby_data_json)
		data = {
			'type': 'send_online_users',
			'user_id': self.user.id,
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

	async def send_online_start_match(self, event):
		data = {
			'type': 'start_match',
			'match_id': self.match_name + '_loop',
		}
		await self.send(json.dumps(data))
	


	async def close_connection(self, event):
		redis.srem('online_lobbies', self.user.id)
		print('USER ID:', self.user.id)
		await self.close()