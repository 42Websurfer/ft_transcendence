from flask import Flask, request
from web3 import Web3
from eth_account import Account

import os

app = Flask(__name__)

PRIVATE_KEY = os.getenv('SEPOLIA_PRIVATE_KEY')
API_KEY = os.getenv('INFURA_API_KEY')

contract_address = os.getenv('TOURNAMENT_CONTRACT_ADDRESS')

contract_abi = '''
[
	{
		"anonymous": false,
		"inputs": [
		{
			"indexed": true,
			"internalType": "uint256",
			"name": "userId",
			"type": "uint256"
		},
		{
			"indexed": false,
			"internalType": "uint256",
			"name": "newScore",
			"type": "uint256"
		}
		],
		"name": "ScoreUpdated",
		"type": "event"
	},
	{
		"inputs": [
		{
			"internalType": "uint256",
			"name": "_userId",
			"type": "uint256"
		}
		],
		"name": "deleteUserScore",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
		{
			"internalType": "uint256",
			"name": "_userId",
			"type": "uint256"
		}
		],
		"name": "getUserScore",
		"outputs": [
		{
			"internalType": "uint256",
			"name": "",
			"type": "uint256"
		}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
		{
			"internalType": "uint256",
			"name": "_userId",
			"type": "uint256"
		},
		{
			"internalType": "uint256",
			"name": "_newScore",
			"type": "uint256"
		}
		],
		"name": "updateUserScore",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
		{
			"internalType": "uint256",
			"name": "",
			"type": "uint256"
		}
		],
		"name": "userExists",
		"outputs": [
		{
			"internalType": "bool",
			"name": "",
			"type": "bool"
		}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
		{
			"internalType": "uint256",
			"name": "",
			"type": "uint256"
		}
		],
		"name": "userScore",
		"outputs": [
		{
			"internalType": "uint256",
			"name": "",
			"type": "uint256"
		}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
'''

infura_url = 'https://sepolia.infura.io/v3/' + API_KEY

web3 = Web3(Web3.HTTPProvider(infura_url))

contract = web3.eth.contract(address=contract_address, abi=contract_abi)

account = Account.from_key(PRIVATE_KEY)

def user_exists(user_id):
	return contract.functions.userExists(user_id).call()

def user_score(user_id):
	return contract.functions.getUserScore(user_id).call()

def get_dynamic_gas_price():
	gas_price = web3.eth.gas_price
	return max(gas_price, web3.to_wei('50', 'gwei'))

@app.route('/update_user_score', methods=['POST'])
def update_user_score():
	data = request.json
	user_id = int(data['userId'])
	newScore = int(data['newScore'])

	if (user_exists(user_id) and user_score(user_id) == newScore):
		return {"error": "User has already the same score."}, 400

	if (newScore <= 0):
		return {"error": "New score is zero or negative."}, 400

	try:
		transaction = contract.functions.updateUserScore(user_id, newScore).build_transaction({
			'nonce': web3.eth.get_transaction_count(account.address),
			'from': account.address,
			'gas': 2000000,
			'gasPrice': get_dynamic_gas_price()
		})
		
		signed_txn = web3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
		tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
		return {"transaction_hash": tx_hash.hex()}, 201

	except:
		return {"error": "Contract execution failed."}, 444

@app.route('/get_user_score', methods=['GET'])
def get_user_score():
	user_id = int(request.args.get('userId'))

	if not user_exists(user_id):
		return {"error": "User does not exist."}, 404
	
	try:
		score = user_score(user_id)	
	except:
		return {"error": "Contract execution failed."}, 444

	return {"score": score}, 200

@app.route('/delete_user_score', methods=['GET'])
def delete_user_score():
	user_id = int(request.args.get('userId'))

	if not user_exists(user_id):
		return {"type": "error", "message": "User does not exist."}, 200
	
	try:
		transaction = contract.functions.deleteUserScore(user_id).build_transaction({
			'nonce': web3.eth.get_transaction_count(account.address),
			'from': account.address,
			'gas': 2000000,
			'gasPrice': get_dynamic_gas_price()
		})

		signed_txn = web3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
		tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
		return {"type": "success", "transaction_hash": tx_hash.hex()}, 200

	except:
		return {"type": "error", "message": "Contract execution failed."}, 200

if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5000)
