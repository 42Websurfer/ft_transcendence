from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def updateOnlineStatusChannel():
    channel_layer = get_channel_layer()
    group_name = "online_status"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_online_users',
            
        }
    )