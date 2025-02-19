from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from user.models import UserProfile, Friendship, FriendshipStatus
from unittest.mock import patch
import json

User = get_user_model()

class UserAPIEndpointsTests(TestCase):

    def setUp(self):
        # Create a test user and profile for login-related tests
        self.test_user = User.objects.create_user(username='testuser', password='testpassword', email='test@example.com')
        self.test_user_profile = UserProfile.objects.create(user=self.test_user)

        self.test_user_2 = User.objects.create_user(username='testuser2', password='testpassword', email='test2@example.com')
        self.test_user_profile_2 = UserProfile.objects.create(user=self.test_user_2)
        
        # Initialize APIClient
        self.client = APIClient()
        
    def authenticate(self, user):
        """Helper method to authenticate a user."""
        self.client.force_authenticate(user=user)

    # Test case for `check_auth` endpoint
    def test_check_auth_authenticated(self):
        self.authenticate(self.test_user)
        response = self.client.get('/api/check_auth/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['authenticated'], True)

    def test_check_auth_not_authenticated(self):
        response = self.client.get('/api/check_auth/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['authenticated'], False)

    # Test case for `user_login` endpoint
    def test_user_login_success(self):
        response = self.client.post('/api/user_login/', data={'username': 'testuser', 'password': 'testpassword'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('tokens', response.data)

    def test_user_login_invalid_credentials(self):
        response = self.client.post('/api/user_login/', data={'username': 'testuser', 'password': 'wrongpassword'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    def test_user_login_user_not_found(self):
        response = self.client.post('/api/user_login/', data={'username': 'nonexistent', 'password': 'password'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    # Test case for `user_logout` endpoint
    def test_user_logout(self):
        self.authenticate(self.test_user)
        response = self.client.get('/api/user_logout/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('success', response.data)

    # Test case for `verify_2fa_code`
    @patch('pyotp.TOTP.verify', return_value=True)
    def test_verify_2fa_code_success(self):
        self.authenticate(self.test_user)
        response = self.client.post('/api/verify_2fa_code/', data={'otp_code': '123456', 'user': {'username': 'testuser'}})
        self.assertEqual(response.status_code, 200)
        self.assertIn('tokens', response.data)

    def test_verify_2fa_code_invalid(self):
        self.authenticate(self.test_user)
        response = self.client.post('/api/verify_2fa_code/', data={'otp_code': '654321', 'user': {'username': 'testuser'}})
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    # Test case for `register`
    def test_register_success(self):
        response = self.client.post('/api/register/', data={
            'username': 'newuser',
            'password': 'newpassword',
            'email': 'newuser@example.com',
        })
        self.assertEqual(response.status_code, 201)
        self.assertIn('tokens', response.data)

    def test_register_with_invalid_avatar(self):
        with open('invalid_avatar.jpg', 'rb') as avatar_file:
            response = self.client.post('/api/register/', data={
                'username': 'newuser',
                'password': 'newpassword',
                'email': 'newuser@example.com',
                'avatar': avatar_file
            })
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    def test_register_email_taken(self):
        response = self.client.post('/api/register/', data={
            'username': 'newuser',
            'password': 'newpassword',
            'email': 'test@example.com',  # Already taken
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    # Test case for `send_friend_request`
    def test_send_friend_request(self):
        self.authenticate(self.test_user)
        response = self.client.get(f'/api/send_friend_request/{self.test_user_2.username}/')
        self.assertEqual(response.status_code, 201)
        self.assertIn('message', response.data)

    def test_send_friend_request_already_sent(self):
        self.authenticate(self.test_user)
        Friendship.objects.create(user=self.test_user, friend=self.test_user_2, status=FriendshipStatus.PENDING)
        response = self.client.get(f'/api/send_friend_request/{self.test_user_2.username}/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    def test_send_friend_request_blocked(self):
        self.authenticate(self.test_user)
        Friendship.objects.create(user=self.test_user, friend=self.test_user_2, status=FriendshipStatus.BLOCKED)
        response = self.client.get(f'/api/send_friend_request/{self.test_user_2.username}/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    def test_send_friend_request_itself(self):
        self.authenticate(self.test_user)
        response = self.client.get(f'/api/send_friend_request/{self.test_user.username}/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    # Test case for `accept_friend_request`
    def test_accept_friend_request(self):
        self.authenticate(self.test_user)
        Friendship.objects.create(user=self.test_user_2, friend=self.test_user, status=FriendshipStatus.PENDING)
        response = self.client.get(f'/api/accept_friend_request/{self.test_user_2.username}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('type', response.data)

    def test_accept_friend_request_already_friends(self):
        self.authenticate(self.test_user)
        Friendship.objects.create(user=self.test_user, friend=self.test_user_2, status=FriendshipStatus.ACCEPTED)
        response = self.client.get(f'/api/accept_friend_request/{self.test_user_2.username}/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    def test_accept_friend_request_not_pending(self):
        self.authenticate(self.test_user)
        Friendship.objects.create(user=self.test_user_2, friend=self.test_user, status=FriendshipStatus.BLOCKED)
        response = self.client.get(f'/api/accept_friend_request/{self.test_user_2.username}/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.data)

    # Additional test cases for `block_friend_request`, `remove_friendship`, `friend_requests`, `friend_list`, etc. would be written similarly.
