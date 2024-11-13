import json
from channels.generic.websocket import AsyncWebsocketConsumer
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
		print("user = ", self.user.id)
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
			Q(user_id=self.user.id, friend_id__in=online_users_ids) |
			Q(friend_id=self.user.id, user_id__in=online_users_ids)
			).select_related('user', 'friend')
		)

		offline_friend_ids = await sync_to_async(list)(Friendship.objects.filter(
			Q(user_id=self.user.id) | Q(friend_id=self.user.id)
		).filter(
			(~Q(user_id__in=online_users_ids) & Q(friend_id=self.user.id))| 
			(Q(user_id=self.user.id) & ~Q(friend_id__in=online_users_ids))
		).select_related('user', 'friend'))

		friendList = []
		for user in online_friend_ids:
			if (user.friend_id == self.user.id):
				if (user.status == 'accepted'):
					friendList.append({'id': user.id, 'username': user.user.username, 'status': 'online', 'type': 'receiver'})
				else:
					friendList.append({'id': user.id, 'username': user.user.username, 'status': user.status, 'type': 'receiver'})
					
			elif(user.user_id == self.user.id):
				if (user.status == 'accepted'):
					friendList.append({'id': user.id, 'username': user.friend.username, 'status': 'online', 'type': 'sender'})
				else:
					friendList.append({'id': user.id, 'username': user.friend.username, 'status': user.status, 'type': 'sender'})

		for user in offline_friend_ids:
			if(user.friend_id == self.user.id):
				if (user.status == 'accepted'):
					friendList.append({'id': user.id, 'username': user.user.username, 'status': 'offline', 'type': 'receiver'})
				else:
					friendList.append({'id': user.id, 'username': user.user.username, 'status': user.status, 'type': 'receiver'})	
			elif(user.user_id == self.user.id):
				if (user.status == 'accepted'):
					friendList.append({'id': user.id, 'username': user.friend.username, 'status': 'offline', 'type': 'sender'})		
				else:
					friendList.append({'id': user.id, 'username': user.friend.username, 'status': user.status, 'type': 'sender'})	
		
		friendList = sorted(friendList, key=lambda x: x['id'])
		
		await self.send(text_data=json.dumps({'friendList': friendList}))
