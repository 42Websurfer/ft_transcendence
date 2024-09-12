from web3 import Web3
from eth_account import Account

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

if (web3.is_connected()):
	print(">>> Successfully connected to sepolia (infura-api).")
else:
	print(">>> Error: could not connect to sepolia (infura-api).\n")
	exit(1)

contract = web3.eth.contract(address=contract_address, abi=contract_abi)

account = Account.from_key(PRIVATE_KEY)
print(f">>> Wallet address: {account.address}\n")

def create_user_score(user_id, score):

	print(f">> Trying to create a new user with userId {user_id} and score {score}.")

	if (user_exists(user_id)):
		print("> Error: User is already registered.\n")
		return

	try:
		transaction = contract.functions.createUserScore(user_id, score).build_transaction({
		'nonce': web3.eth.get_transaction_count(account.address),
		'from': account.address,
		'gas': 2000000,
		'gasPrice': get_dynamic_gas_price()
		})

		signed_txn = web3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
  
		try:
			tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
			print(f"> Transaction sent: {tx_hash.hex()}\n")
		except Exception as e:
			print(f"> Error sending transaction: {str(e)}\n")
     
	except Exception as e:
		 print(f"> Error creating user score: {str(e)}\n")
		

def update_user_score(user_id, newScore):

	print(f">> Trying to update the user with userId {user_id} to newScore {newScore}.")

	if (not user_exists(user_id)):
		print("> Error: User is not registered yet.\n")
		return

	if (get_user_score(user_id) == newScore):
		print("> Error: User has the same score already.\n")
		return

	try:
		transaction = contract.functions.updateUserScore(user_id, newScore).build_transaction({
		'nonce': web3.eth.get_transaction_count(account.address),
		'from': account.address,
		'gas': 2000000,
		'gasPrice': get_dynamic_gas_price()
		})

		signed_txn = web3.eth.account.sign_transaction(transaction, PRIVATE_KEY)

		try:
			tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
			print(f"> Transaction sent: {tx_hash.hex()}\n")
		except Exception as e:
			print(f"> Error sending transaction: {str(e)}\n")

	except Exception as e:
		 print(f"> Error updating user score: {str(e)}\n")

def get_user_score(user_id):

    if (not user_exists(user_id)):
        print("> Error: User is not registered yet.\n")
        return  

    try:
        score = contract.functions.getUserScore(user_id).call()
        return (score)
    except Exception as e:
        print(f"> Error getting score: {str(e)}\n")
        
def print_user_score(user_id):
    
    print(f">> Trying to get the score of the user with userId {user_id}.")
    
    if (not user_exists(user_id)):
        print("> Error: User is not registered yet.\n")
        return    

    try:
        score = contract.functions.getUserScore(user_id).call()
        print(f"> Score: {score}")
    except Exception as e:
        print(f"> Error getting score: {str(e)}\n")
        
def user_exists(user_id):
    return (contract.functions.userExists(user_id).call())

def get_dynamic_gas_price():
    gas_price = web3.eth.gas_price
    return max(gas_price, web3.to_wei('50', 'gwei'))

# update_user_score(4, 4)
# create_user_score(8, 42)
# create_user_score(8, 42)
# create_user_score(8, 42)
# create_user_score(8, 42)
# create_user_score(8, 42)
# print_user_score(8)
# user_exists(4)
# print_user_score(2)
# update_user_score(2, 20)
# print_user_score(2)

