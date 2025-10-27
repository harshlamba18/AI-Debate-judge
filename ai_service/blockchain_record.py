import os
import json
import hashlib
import logging
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)

INFURA_URL = os.getenv("INFURA_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
PUBLIC_ADDRESS = os.getenv("PUBLIC_ADDRESS")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
CONTRACT_ABI_JSON = os.getenv("CONTRACT_ABI_JSON")

if PRIVATE_KEY:
    PRIVATE_KEY = PRIVATE_KEY.strip()
if PUBLIC_ADDRESS:
    PUBLIC_ADDRESS = PUBLIC_ADDRESS.strip()
if CONTRACT_ADDRESS:
    CONTRACT_ADDRESS = CONTRACT_ADDRESS.strip()

def _checksum_address(addr: str) -> str:
    return Web3.to_checksum_address(addr)

if not INFURA_URL:
    raise RuntimeError("Missing INFURA_URL")

w3 = Web3(Web3.HTTPProvider(INFURA_URL))
if not w3.is_connected():
    raise RuntimeError("Web3 provider not connected. Check INFURA_URL/network.")

logger.info("Web3 connected: %s", w3.is_connected())

if not PRIVATE_KEY:
    raise RuntimeError("Missing PRIVATE_KEY")
if not PRIVATE_KEY.startswith("0x"):
    PRIVATE_KEY = "0x" + PRIVATE_KEY

if not PUBLIC_ADDRESS:
    raise RuntimeError("Missing PUBLIC_ADDRESS")
PUBLIC_ADDRESS = _checksum_address(PUBLIC_ADDRESS)

if not CONTRACT_ADDRESS:
    raise RuntimeError("Missing CONTRACT_ADDRESS")
CONTRACT_ADDRESS = _checksum_address(CONTRACT_ADDRESS)

if CONTRACT_ABI_JSON:
    CONTRACT_ABI = json.loads(CONTRACT_ABI_JSON)
else:
    CONTRACT_ABI = [
        {
            "inputs": [{"internalType": "string", "name": "data", "type": "string"}],
            "name": "storeData",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function",
        }
    ]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

def store_ai_result(topic, side_a_score, side_b_score, verdict):
    try:
        result_data = f"{topic}|{side_a_score}|{side_b_score}|{verdict}"
        hashed = hashlib.sha256(result_data.encode()).hexdigest()

        balance = w3.eth.get_balance(PUBLIC_ADDRESS)
        nonce = w3.eth.get_transaction_count(PUBLIC_ADDRESS)
        logger.info("Attempting tx: address=%s balance_wei=%d nonce=%d", PUBLIC_ADDRESS, balance, nonce)

        txn = contract.functions.storeData(hashed).build_transaction({
            "from": PUBLIC_ADDRESS,
            "nonce": nonce,
            "gas": 200000,
            "gasPrice": w3.eth.gas_price,  # safer than hardcoding
        })

        signed_txn = w3.eth.account.sign_transaction(txn, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        return w3.to_hex(tx_hash)

    except Exception:
        logger.exception("Failed to store result on-chain")
        return None
