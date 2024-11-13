class CustomUser:
    def __init__(self, user_data):
        self.id = user_data.get('id')
        self.username = user_data.get('username')
        self.email = user_data.get('email')
        self.first_name = user_data.get('first_name')
        self.last_name = user_data.get('last_name')
        self.is_authenticated = True
        self.is_active = user_data.get('is_active', True) 

    def is_anonymous(self):
        return False

    def is_authenticated(self):
        return True