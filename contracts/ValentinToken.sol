// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ValentinToken is ERC20 {
  constructor() ERC20("ValentinToken", "VAL") {
      _mint(msg.sender, 100000 * (10 ** decimals()));
  }

  function decimals() public pure override returns (uint8) {
    return 6;
  }
}