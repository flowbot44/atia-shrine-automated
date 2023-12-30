import * as cron from 'node-cron';
import * as fs from 'fs';
import { ethers, Wallet } from "ethers";
import * as dotenv from 'dotenv'
import { fetchBuyGacha, getSlipBalance } from './gacha'
import { exchangeToken, generateAccessTokenMessage } from './access-token'
dotenv.config()

const rpc = 'https://api.roninchain.com/rpc';
// Limit batchMaxCount to 1, new Ronin RPC does not support batching yet
const provider = new ethers.JsonRpcProvider(rpc, 2020, { batchMaxCount: 1 });
const atiaAbi = JSON.parse(fs.readFileSync('abis/atiaalter.json', 'utf8'))
const atiaContract = new ethers.Contract('0x9d3936dbd9a794ee31ef9f13814233d435bd806c', atiaAbi, provider)

const shopABI = JSON.parse(fs.readFileSync('abis/garudashop.json', 'utf8'))
const shopContract = new ethers.Contract('0x3e0674b1ddc84b0cfd9d773bb2ce23fe8f445de3', shopABI, provider)

const POUCHES_PER_TX = 100

cron.schedule('0 1 * * *', () => {
  console.log(`\nStarting Daily Axie Hard`)
  axieHard()
}, {
  timezone: "UTC"
});

async function checkBlessings(signer: Wallet) {
      console.log(`\n🙏 Making an offering to Atia`)  
      isActivated(signer.address).then((res) => {
        if (res) {
          console.log(`\nOffering to Atia already complete`)
          return
        }
        activateStreak(signer).then((res) => {
          if (!res) return
          console.log(`✅ Atia's Blessing activated for ${signer.address}`)
        })
      })
    
}

async function spendSlips(signer: Wallet){
  
  const premium = false //TODO make configurable.
  const slipsPerPouch = premium ? 50 : 10

  let results = []
  const accessTokenMessage = await generateAccessTokenMessage(signer.address)
  const accessTokenSignature = await signer.signMessage(accessTokenMessage)
  const { accessToken } = await exchangeToken(accessTokenSignature, accessTokenMessage)

  const slips = await getSlipBalance(accessToken)
  
  const amount = Math.floor(slips / slipsPerPouch / POUCHES_PER_TX)

  if(amount > 0){
    const connectedContract = <ethers.Contract>shopContract.connect(signer)
    
    console.log(`Buying ${amount}x ${POUCHES_PER_TX}${premium ? ' Premium' : ''} Pouches (total ${amount * POUCHES_PER_TX * slipsPerPouch} slips)`)

    for (let i = 1; i <= amount; i++) {
      results = await fetchBuyGacha(POUCHES_PER_TX, premium, accessToken)
      try {
        const chestsToRoll = Array(POUCHES_PER_TX).fill([premium ? '1' : '0', slipsPerPouch.toString()])
        const txRoll = await connectedContract.roll(chestsToRoll, results.nonce, results.deadline, results.slipAmount, results.signature,
          {
            value: ethers.parseEther((0.006 * POUCHES_PER_TX + .11).toString()),
            gasLimit: 600000
          })
        console.log(`#${i}\tPurchased ${results.chests.length}${premium ? ' Premium' : ''} Pouches:`, txRoll.hash)
      } catch (e: Error | any) {
        console.log('⭕ Failed to buy')
        console.log(e)
        e.code && e.info && console.error(`⚠️ ${e.code} (${e.info.error.message})`)
      }

      if (i < amount) {
        await new Promise(resolve => setTimeout(resolve, 60000))
      }
    }
  }else{
    console.log(`Not enough slips ${slips} to batch into an efficent roll of ${POUCHES_PER_TX}`)
  }

}


async function isActivated(address: string) {
  return atiaContract.hasCurrentlyActivated(address).then((res: boolean) => res)
}

async function activateStreak(signer: Wallet) {
  const connectedContract = <ethers.Contract>atiaContract.connect(signer)
  try {
    return await connectedContract.activateStreak().then(() => { return true })
  } catch (e: Error | any) {
    console.error(`⚠️ Blessing failed for ${signer.address} ${e.code} (${e.info.error.message})`)
    return false
  }

}

async function axieHard(){
  getKeys().then((keys) => {
    keys.forEach(async (key: string) => {
      const signer = await new ethers.Wallet(key, provider)
      await checkBlessings(signer)
      await spendSlips(signer)
      
    })
  })
}

async function getKeys() {
  return JSON.parse(fs.readFileSync('./privateKeys', 'utf8')).keys
}

async function start() {
  if (!fs.existsSync('./privateKeys')) {
    throw Error(`privateKeys file not found`)
  } else if ((await getKeys()).length <= 0) {
    throw Error(`No keys defined`)
  }
  console.log(`⚙️ Starting Atia's Blessing bot (${(await getKeys()).length} addresses... AXIE HARD!)`)

  axieHard()

}

start()
