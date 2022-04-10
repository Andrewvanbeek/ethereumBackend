const { ethers } = require("hardhat");


require('dotenv').config()
const crypto = require('crypto')
const assert = require('assert')

let algorithm = 'aes256' // or any other algorithm supported by OpenSSL
let key = process.env.KEY // or any key from .env

const decrypt = async function (encrypted) {
  var someEncodedString = Buffer.from(process.env.IV, 'utf-8').toString()
  let decipher = crypto.createDecipheriv(algorithm, key, someEncodedString)
  let decrypted =
    decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
  return decrypted
}

const fastify = require('fastify')({ logger: false })

// Declare a route
fastify.post('/createWallet', async (request, reply) => {
  ethers.provider = ethers.getDefaultProvider('http://localhost:8545')
  const wallet = ethers.Wallet.createRandom()
  console.log(wallet.mnemonic)
  console.log(wallet.privateKey)
  let newWallet = new ethers.Wallet(
    process.env.GROUP_FUND_PRIVATE_KEY,
    ethers.provider,
  )


  let amountInEther = '0.08'
    // Create a transaction object
    let tx = {
      to: wallet.address,
      // Convert currency unit from ether to wei
      value: ethers.utils.parseEther(amountInEther),
    }
    // Send a transaction
   const txObj = await newWallet.sendTransaction(tx)
  console.log('txHash', txObj.hash)
  

  return { wallet: wallet, privateKey: wallet.privateKey }
})

fastify.post("/buy", async(request, reply) => {
  console.log("USER DATA", request.body)
  const user =  request.body
  user["decrypted_key"] = await decrypt(user.private_wallet_key)
  console.log("decrypted key", user)
  ethers.provider = ethers.getDefaultProvider('http://localhost:8545')
  const accounts = await ethers.getSigners()
  const groceryStore = accounts[0]
  const groceryStoreBalance = await groceryStore.getBalance()
  let newWallet = new ethers.Wallet(
    user.decrypted_key,
    ethers.provider,
  )

  let amountInEther = '0.001'
    // Create a transaction object
    let tx = {
      to: groceryStore.address,
      // Convert currency unit from ether to wei
      value: ethers.utils.parseEther(amountInEther),
    }

    const txObj = await newWallet.sendTransaction(tx)
    console.log('txHash', txObj.data)
    console.log('txHash', txObj.confirmations)

    const receipt = await txObj.wait()
// Receipt should now contain the logs
    console.log(receipt)


  console.log("this is the accounts", groceryStore)
  console.log("this is the balance", groceryStoreBalance)
  return {receipt: receipt}
})

// Run the server!
const start = async () => {
  try {
    await fastify.listen(4000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()

