// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {console} from "hardhat/console.sol";

contract Tournament {

    mapping(uint256 => bool) public userExists;
    mapping(uint256 => uint256) public userScore;

    event ScoreUpdated(uint256 indexed userId, uint256 newScore);

    function createUserScore(uint256 _userId, uint256 _score) public {

        require(_userId != 0 && _score > 0, "UserScore could not be created.");
        require(!userExists[_userId], "User is already registered.");

        userScore[_userId] = _score;
        userExists[_userId] = true;

        emit ScoreUpdated(_userId, _score);

    }

    function updateUserScore(uint256 _userId, uint256 _newScore) public {

        require(_userId != 0 && _newScore > 0, "UserScore could not be updated.");
        require(userExists[_userId], "User is not registered yet.");

        userScore[_userId] = _newScore;

        emit ScoreUpdated(_userId, _newScore);

    }

    function getUserScore(uint256 _userId) public view returns (uint256) {

        require(userExists[_userId], "User is not registered yet.");
        return userScore[_userId];

    }

}