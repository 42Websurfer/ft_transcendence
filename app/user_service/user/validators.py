import re
from rest_framework import serializers

def validate_username_format(value):
    '''Checks the username for the right format.
    Format: letters: a-z & A-Z
            digits: 0-9
            special characters: _.-
            length: max 16 characters
    '''
    if not re.match(r'^[a-zA-Z0-9_.-]+$', value) or len(value) > 16:
        raise serializers.ValidationError("The username may only contain letters, numbers, dots, underscores and hyphens. \nMax length = 16.")
    return value

