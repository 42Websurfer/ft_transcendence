from flask import Flask, request
from web3 import Web3
from eth_account import Account

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

PRIVATE_KEY = "cb65bc2f2cde1bdb952a2878c7ada688171ec487d8680ab898fc6c66b69fb691"
INFURA_API_KEY = "1c9ce34685574fe4ab5af211259b9dc5"

contract_address = "0x951eaE378014A3C5163e1820B32e644E3429e8f0"

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
			},
			{
				"internalType": "uint256",
				"name": "_score",
				"type": "uint256"
			}
		],
		"name": "createUserScore",
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

infura_url = 'https://sepolia.infura.io/v3/' + INFURA_API_KEY

web3 = Web3(Web3.HTTPProvider(infura_url))

contract = web3.eth.contract(address=contract_address, abi=contract_abi)

account = Account.from_key(PRIVATE_KEY)

@app.route('/create_user_score', methods=['POST'])
def create_user_score():
	data = request.json
	user_id = data['userId']
	score = data['score']

	if user_exists(user_id):
		return {"error": "User already exists"}, 400
	
	transaction = contract.functions.createUserScore(user_id, score).build_transaction({
		'nonce': web3.eth.get_transaction_count(account.address),
		'from': account.address,
		'gas': 2000000,
		'gasPrice': get_dynamic_gas_price()
	})

	signed_txn = web3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
	
	tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
	return {"transactionHash": tx_hash.hex()}, 201


@app.route('/update_user_score', methods=['POST'])
def update_user_score():
	data = request.json()
	logger.debug(f"\n\n\n\n\ndata: {data}\n\n\n")
	user_id = data['userId']
	newScore = data['newScore']

	if not user_exists(user_id):
		return {"error": "User does not exist"}, 404
	
	if get_user_score(user_id) == newScore:
		return {"error": "No change needed"}, 400

	transaction = contract.functions.updateUserScore(user_id, newScore).build_transaction({
		'nonce': web3.eth.get_transaction_count(account.address),
		'from': account.address,
		'gas': 2000000,
		'gasPrice': get_dynamic_gas_price()
	})

	signed_txn = web3.eth.account.sign_transaction(transaction, PRIVATE_KEY)

	tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
	return {"transactionHash": tx_hash.hex()}, 202

@app.route('/get_user_score', methods=['GET'])
def get_user_score():
	user_id = int(request.args.get('userId'))
	if not user_exists(user_id):
		return {"error": "User does not exist"}, 404
	
	try:
		score = contract.functions.getUserScore(user_id).call()
		return {"score": score}, 200
	except Exception as e:
		return {"error": str(e)}, 500

def user_exists(user_id):
	return contract.functions.userExists(user_id).call()

def get_dynamic_gas_price():
	gas_price = web3.eth.gas_price
	return max(gas_price, web3.to_wei('50', 'gwei'))

if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5000)

