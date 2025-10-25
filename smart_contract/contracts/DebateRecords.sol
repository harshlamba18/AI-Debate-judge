// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DebateRecords {
    struct DebateResult {
        string dataHash;
        uint256 timestamp;
        address submitter;
    }

    mapping(uint256 => DebateResult) public debates;
    uint256 public debateCount;

    event DataStored(uint256 indexed debateId, string dataHash, address indexed submitter, uint256 timestamp);

    function storeData(string memory data) public {
        debateCount++;
        
        debates[debateCount] = DebateResult({
            dataHash: data,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        emit DataStored(debateCount, data, msg.sender, block.timestamp);
    }

    function getDebate(uint256 debateId) public view returns (
        string memory dataHash,
        uint256 timestamp,
        address submitter
    ) {
        DebateResult memory result = debates[debateId];
        return (result.dataHash, result.timestamp, result.submitter);
    }

    function getAllDebates() public view returns (DebateResult[] memory) {
        DebateResult[] memory allDebates = new DebateResult[](debateCount);
        
        for (uint256 i = 1; i <= debateCount; i++) {
            allDebates[i - 1] = debates[i];
        }
        
        return allDebates;
    }
}