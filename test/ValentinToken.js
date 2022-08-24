const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const initialSupply = 100000;
const tokenName = "ValentinToken";
const tokenSymbol = "VAL";

describe("Valentin token tests", function() {
  let valentinTokenV1;
  let valentinTokenV2;
  let deployer;
  let userAccount;
  describe("V1 Tests", function(){

    before(async function() {
      const availableSigners = await ethers.getSigners();
      deployer = availableSigners[0];

      const ValentinToken = await ethers.getContractFactory("ValentinTokenV1");
      // this.valentinToken = await PlatziToken.deploy(initialSupply);
      valentinTokenV1 = await upgrades.deployProxy(ValentinToken, [initialSupply], { kind: "uups" });
      await valentinTokenV1.deployed();
    });

    it('Should be named ValentinToken', async function() {
      const fetchedTokenName = await valentinTokenV1.name();
      expect(fetchedTokenName).to.be.equal(tokenName);
    });

    it('Should have symbol "VAL"', async function() {
      const fetchedTokenSymbol = await valentinTokenV1.symbol();
      expect(fetchedTokenSymbol).to.be.equal(tokenSymbol);
    });

    it('Should have totalSupply passed in during deploying', async function() {
      const [ fetchedTotalSupply, decimals ] = await Promise.all([
        valentinTokenV1.totalSupply(),
        valentinTokenV1.decimals(),
      ]);
      const expectedTotalSupply = ethers.BigNumber.from(initialSupply).mul(ethers.BigNumber.from(10).pow(decimals));
      expect(fetchedTotalSupply.eq(expectedTotalSupply)).to.be.true;
    });

    it('Should run into an error when executing a function that does not exist', async function () {
      expect(() => valentinTokenV1.mint(deployer.address, ethers.BigNumber.from(10).pow(18))).to.throw();
    });
  })

  describe("V2 Tests", function(){

    before(async function() {
      userAccount = (await ethers.getSigners())[1];

      const ValentinTokenV2 = await ethers.getContractFactory("ValentinTokenV2");
      valentinTokenV2 = await upgrades.upgradeProxy(valentinTokenV1.address, ValentinTokenV2);
      await valentinTokenV2.deployed();
    });

    it("Should has the same address, and keep the state as the previous version", async function () {
      const [totalSupplyForNewCongtractVersion, totalSupplyForPreviousVersion] = await Promise.all([
        valentinTokenV2.totalSupply(),
        valentinTokenV1.totalSupply(),
      ]);
      expect(valentinTokenV1.address).to.be.equal(valentinTokenV2.address);
      expect(totalSupplyForNewCongtractVersion.eq(totalSupplyForPreviousVersion)).to.be.equal(true);
    });

    it("Should revert when an account other than the owner is trying to mint tokens", async function() {
      const tmpContractRef = await valentinTokenV2.connect(userAccount);
      try {
        await tmpContractRef.mint(userAccount.address, ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)));
      } catch (ex) {
        expect(ex.message).to.contain("reverted");
        expect(ex.message).to.contain("Ownable: caller is not the owner");
      }
    });

    it("Should mint tokens when the owner is executing the mint function", async function () {
      const amountToMint = ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)).mul(ethers.BigNumber.from(10));
      const accountAmountBeforeMint = await valentinTokenV2.balanceOf(deployer.address);
      const totalSupplyBeforeMint = await valentinTokenV2.totalSupply();
      await valentinTokenV2.mint(deployer.address, amountToMint);

      const newAccountAmount = await valentinTokenV2.balanceOf(deployer.address);
      const newTotalSupply = await valentinTokenV2.totalSupply();
      
      expect(newAccountAmount.eq(accountAmountBeforeMint.add(amountToMint))).to.be.true;
      expect(newTotalSupply.eq(totalSupplyBeforeMint.add(amountToMint))).to.be.true;
    });
  })

});