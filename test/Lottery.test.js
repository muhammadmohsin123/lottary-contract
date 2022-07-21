const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const { interface: ABI, bytecode } = require("../compile");

let lottary;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottary = await new web3.eth.Contract(JSON.parse(ABI))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottary Contract", () => {
  it("contract deployed", () => {
    assert.ok(lottary.options.address);
  });
  it("allows one account to enter", async () => {
    await lottary.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });
    const players = await lottary.methods.getPlayers().call({
      from: accounts[0],
    });
    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });
  it("allows multiple account to enter", async () => {
    await lottary.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });
    await lottary.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("0.02", "ether"),
    });
    await lottary.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("0.02", "ether"),
    });
    const players = await lottary.methods.getPlayers().call({
      from: accounts[0],
    });
    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });

  it("requires a minimum amount of ethers", async () => {
    try {
      await lottary.methods.enter().send({
        from: accounts[0],
        value: 0,
      });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });
  it("only manager can pick winner", async () => {
    try {
      await lottary.methods.pickWinner().send({
        from: accounts[1],
      });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("sends money to the winner and resets the player array", async () => {
    await lottary.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("10", "ether"),
    });
    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await lottary.methods.pickWinner().send({
      from: accounts[0],
    });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    assert(difference > web3.utils.toWei("9.5", "ether"));
  });
});
