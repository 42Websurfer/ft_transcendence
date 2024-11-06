import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
import redis
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model

redis = redis.Redis(host='redis', port=6379, db=0)


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
