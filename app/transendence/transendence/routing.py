from django.urls import re_path
from game import consumers

websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<group_name>\w+)/$', consumers.MyConsumer.as_asgi()),
]

""" 
re_path: Django verwendet diese Methode, um reguläre Ausdrücke für URLs zu definieren.

-   r'ws/chat/(?P<group_name>\w+)/$':

-   Das r vor dem String bedeutet, dass es sich um einen rohen String handelt (raw string). 
    Das ist wichtig für reguläre Ausdrücke, um Backslashes korrekt zu interpretieren.

-   ws/chat/: Dies ist der feste Teil des URL-Pfads, der für alle WebSocket-Verbindungen gleich bleibt.

-   (?P<group_name>\w+): Das ist der dynamische Teil des Pfads. (?P<group_name>\w+) ist ein regulärer Ausdruck:

    -   ?P<group_name>: Benannter Gruppen-Parameter, der den extrahierten Wert in eine Variable namens group_name speichert.

    -   \w+: Ein regulärer Ausdruck, der "alphanumerische Zeichen" (Buchstaben und Ziffern) erwartet. Er erlaubt mindestens ein Zeichen, kann aber beliebig lang sein.

$: Das Dollarzeichen signalisiert das Ende des URL-Pfads. 
"""