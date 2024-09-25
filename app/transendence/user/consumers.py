import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
import redis
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from user.models import Friendship
from django.db.models import Q

redis = redis.Redis(host='redis', port=6379, db=0)

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
					'new_uid': self.user.id
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
		online_users_ids = redis.smembers("online_users")
		online_users_ids = [
			int(user_id)
			for user_id in online_users_ids
		]
		online_friend_ids = await sync_to_async(list)(Friendship.objects.filter(
			Q(user_id=self.user.id, friend_id__in=online_users_ids, status='accepted') |
			Q(friend_id=self.user.id, user_id__in=online_users_ids, status='accepted')
			).select_related('user', 'friend')
		)

		offline_friend_ids = await sync_to_async(list)(Friendship.objects.filter(
			Q(user_id=self.user.id) | Q(friend_id=self.user.id)
		).filter(
			(~Q(user_id__in=online_users_ids) & Q(friend_id=self.user.id, status='accepted'))| 
			(Q(user_id=self.user.id, status='accepted') & ~Q(friend_id__in=online_users_ids))
		).select_related('user', 'friend'))

		friendList = []
		for user in online_friend_ids:
			if (user.friend_id == self.user.id):
				friendList.append({'username': user.user.username, 'status': 'online'})
			elif(user.user_id == self.user.id):
				friendList.append({'username': user.friend.username, 'status': 'online'})

		for user in offline_friend_ids:
			if(user.friend_id == self.user.id):
				friendList.append({'username': user.user.username, 'status': 'offline'})
			elif(user.user_id == self.user.id):
				friendList.append({'username': user.friend.username, 'status': 'offline'})		
		
		await self.send(text_data=json.dumps({'friendList': friendList}))
