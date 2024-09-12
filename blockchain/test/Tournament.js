const { expect } = require("chai");

const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Tournament contract", function () {

	async function deployTournamentFixture() {

		const Tournament = await ethers.deployContract("Tournament");

		await Tournament.waitForDeployment();

		return { Tournament };
	}

	describe("function: createUserScore()", function () {

		it("Should set score of a specific userId", async function () {

			const userId = 2;
			const points = 42;

			const { Tournament } = await loadFixture(deployTournamentFixture);
			
			await expect(Tournament.createUserScore(3, 43)).to.emit(Tournament, "ScoreUpdated").withArgs(3, 43);

			await Tournament.createUserScore(userId, points);

			const score = await Tournament.userScore(userId);
			expect(score).to.equal(points);

		});
	});

	describe("function: updateUserScore()", function () {

		it("Should update the score of a specific userId", async function () {

			const userId = 2;
			const points = 37;

			const { Tournament } = await loadFixture(deployTournamentFixture);

			await Tournament.createUserScore(userId, points);
			await expect(Tournament.updateUserScore(userId, points)).to.emit(Tournament, "ScoreUpdated").withArgs(userId, points);

			Tournament.updateUserScore(userId, points);

			const score = await Tournament.userScore(userId);
			expect(score).to.equal(points);

		});
	});

	describe("function: getUserScore()", function () {
		
			it("Should get the correct new score", async function () {

				const userId = 4;
				const score = 42;

				const { Tournament } = await loadFixture(deployTournamentFixture);

				await Tournament.createUserScore(userId, score);

				get_score = await Tournament.getUserScore(userId);
				expect(get_score).to.equal(score);
		});
	});
});

