from rest_framework import serializers
from django.contrib.auth.models import User
from .validators import validate_username_format

class RegisterSerializer(serializers.ModelSerializer):
    '''Serialize the registration data.
    
        required keys: username, email, password, firstname, lastname

        validation keys: 
            username: checks username format, unique
            email: unique
    '''
    username = serializers.CharField(
        max_length=150,
        required=True,
        validators=[validate_username_format]
    )
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=1)
    firstname = serializers.CharField(source='first_name', required=True)
    lastname = serializers.CharField(source='last_name', required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'firstname', 'lastname')
    
    def __init__(self, *args, **kwargs):
        self.is_third_party_user = kwargs.pop('is_third_party_user', None)
        super().__init__(*args, **kwargs)
        if self.is_third_party_user:
            self.fields.pop('password', None)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email address already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username already exists.")
        return value
    
    def create(self, validated_data):
        if self.is_third_party_user:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
            )
            user.set_unusable_password()
        else:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                password=validated_data['password']
            )
        return user
    

class UpdateUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        max_length=150,
        required=True,
        validators=[validate_username_format]
    )
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=1, required=False)
    firstname = serializers.CharField(source='first_name', required=True)
    lastname = serializers.CharField(source='last_name', required=True)
    #avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:

        model = User
        fields = ('username', 'email', 'password', 'firstname', 'lastname')

    def __init__(self, *args, **kwargs):
        self.is_third_party_user = kwargs.pop('is_third_party_user', None)
        super().__init__(*args, **kwargs)
        if self.is_third_party_user:
            self.fields.pop('email', None)

    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError("Email address already exists.")
        return value

    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.exclude(id=user.id).filter(username=value).exists():
            raise serializers.ValidationError("This username already exists.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)

        instance.save()
        return instance