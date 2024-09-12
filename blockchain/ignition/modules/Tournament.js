const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const TournamentModule = buildModule("TournamentModule", (m) => {
  const token = m.contract("Tournament");

  return { token };
});

module.exports = TournamentModule;