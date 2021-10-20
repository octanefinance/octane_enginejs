var Web3 = require('web3');
var web3 = new Web3(process.env.BSC_URL);
var address = require('./constants/address');
var abi = require('./constants/abi');
const axios = require('axios');

async function executeAllOrders() {
  axios.get('https://prod-node.octane.finance/api/v1/engine/orders')
  .then(response => {
    var orders = response.data.orders;
    orders.forEach(async order => {
      var transactionCount = 0;
      await web3.eth.getTransactionCount(process.env.WALLET_ADDRESS, "pending").then((c) => {
        transactionCount = c;
      });
      orders.forEach(async order => {
        await execute(transactionCount, order.contact_order_id);
      });
    });
  })
  .catch(error => {
    console.log(error);
  });
}

console.log(web3.utils.toWei("10", 'gwei'));

async function execute(nonce, order_id){
  console.log("===> STARTED: Executing Order :" + order_id);
  const contract = new web3.eth.Contract(abi.octaneAbi, address.octaneContractaddress);
  await contract.methods.execute(order_id).estimateGas({from: process.env.WALLET_ADDRESS})
  .then(async function(gasAmount){
    console.log("===> INSIDE: gasAmount :" + gasAmount);
    const tx = {
      nonce: nonce,
      to: address.octaneContractaddress, 
      gas: gasAmount,
      gapPrice: web3.utils.toWei("10", 'gwei'),
      data: contract.methods.execute(order_id.toString()).encodeABI() 
    };
    await web3.eth.accounts.signTransaction(tx, process.env.WALLET_PRIVATE_KEY)
    .then((signedTx) => {
      console.log("===> INSIDE: Executing Order :" + order_id);
      const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
      sentTx.on("receipt", receipt => {
        console.log(receipt);
      });
      sentTx.on("error", err => {
        console.log("E1" + err);
      });
    }).catch((err) => {
      console.log("E2" + err);
    });
  })
  .catch(function(error){
    console.log("error:" + error);
  });
}

module.exports = {
  executeAllOrders
}