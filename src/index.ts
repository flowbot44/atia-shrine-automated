import * as cron from 'node-cron';
import * as fs from 'fs';
import { ethers, Wallet } from "ethers";
import * as dotenv from 'dotenv'
import { fetchBuyGacha, getSlipBalance } from './gacha'
import { exchangeToken, generateAccessTokenMessage } from './access-token'
import { getConsumablesCount, getDailyCocoConsumedAxp } from './axp'

dotenv.config()

const rpc = 'https://api.roninchain.com/rpc';
// Limit batchMaxCount to 1, new Ronin RPC does not support batching yet
const provider = new ethers.JsonRpcProvider(rpc, 2020, { batchMaxCount: 1 });
const atiaAbi = JSON.parse(fs.readFileSync('abis/atiaalter.json', 'utf8'))
const atiaContract = new ethers.Contract('0x9d3936dbd9a794ee31ef9f13814233d435bd806c', atiaAbi, provider)

const shopAbi = JSON.parse(fs.readFileSync('abis/garudashop.json', 'utf8'))
const shopContract = new ethers.Contract('0x3e0674b1ddc84b0cfd9d773bb2ce23fe8f445de3', shopAbi, provider)

const consumableAbi = JSON.parse(fs.readFileSync('abis/consumable.json', 'utf8'))
const consumableContract = new ethers.Contract('0xeaa3d9af9c9c218dae63922c97eeee6c3f770e15', consumableAbi, provider)

const POUCHES_PER_TX = 100


cron.schedule('0 1 * * *', () => {
  console.log(`\nStarting Daily Axie Hard`)
  axieHard()
}, {
  timezone: "UTC"
});

async function checkBlessings(signer: Wallet) {
  console.log(`\n Making an offering to Atia`);

  try {
    const isActivatedResult = await isActivated(signer.address);

    if (isActivatedResult) {
      console.log(`\nOffering to Atia already complete`);
      return;
    }

    const activateStreakResult = await activateStreak(signer);

    if (activateStreakResult) {
      console.log(`✅ Atia's Blessing activated for ${signer.address}`);
      await new Promise(resolve => setTimeout(resolve, 60000))
    }
  } catch (error: any) {
    console.error(`Error during blessing process: ${error.message}`);
  }
}

async function spendSlips(premium: boolean, signer: Wallet, accessToken: string){
  
 
  const slipsPerPouch = premium ? 50 : 10

  let results = []

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

      await new Promise(resolve => setTimeout(resolve, 60000))

    }
  }else{
    console.log(`Not enough slips ${slips} to batch into an efficent roll of ${POUCHES_PER_TX}`)
  }

}

async function feedAxiesCoco(axies: string[],usePremium:boolean, signer: Wallet, accessToken: string) {
  
  let consumablesToEat = await getConsumablesCount(signer.address, usePremium, accessToken )
  
  //TODO check approval to consume 1155 before proceeding

  for (const axieId of axies) {

    if(consumablesToEat < 1){
      console.log(`No Coco no eaty`)
      return
    }
    const cocoToConsume = await calcCocoToConsume(axieId, consumablesToEat, usePremium, accessToken)
    
    if(cocoToConsume == 0){
      console.log(`Axie #${axieId} cannot consume coco check level or was already feed`)
    }else {
      const connectedContract = <ethers.Contract>consumableContract.connect(signer)
      const txFeed = await connectedContract.consume(axieId, usePremium ? '2' : '1', cocoToConsume, {
        gasLimit: 90000
      }) 
      console.log(`#${axieId} feed ${cocoToConsume}`, txFeed.hash)
      consumablesToEat = consumablesToEat - cocoToConsume
      await new Promise(resolve => setTimeout(resolve, 10000)) 
    }    
  }
}

async function calcCocoToConsume(axieId:string, consumablesToEat:number, usePremium:boolean, accessToken: string) {

  const axpPerCoco = usePremium ? 200 : 50
  const axieAxpForCoco = await getDailyCocoConsumedAxp(axieId, accessToken )
  const maxCocoToConsume = Math.floor(axieAxpForCoco / axpPerCoco)
  let cocoToConsume = 0

  if(maxCocoToConsume == 0) {
    console.log(`Axie # has already ate enough Coco for the day`)
    return cocoToConsume
  } else if (maxCocoToConsume <= consumablesToEat){
    cocoToConsume = maxCocoToConsume
  } else {
    cocoToConsume = consumablesToEat
  } 
  return cocoToConsume
}


async function isActivated(address: string) {
  return await atiaContract.hasCurrentlyActivated(address).then((res: boolean) => res)
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
  const accounts: Account[] = getAccounts()
  
  for (const account of accounts) {
    
    const signer = await new ethers.Wallet(account.key, provider)
    const accessTokenMessage = await generateAccessTokenMessage(signer.address)
    const accessTokenSignature = await signer.signMessage(accessTokenMessage)
    const { accessToken } = await exchangeToken(accessTokenSignature, accessTokenMessage)

    const premium = account.rollPremium
  
    if(account.autoBlessing)
      await checkBlessings(signer)
    if(account.autoRollShop)
      await spendSlips(premium, signer, accessToken)
    if(account.autoFeedAxies)
      await feedAxiesCoco(account.axies, premium, signer, accessToken)

  }
}

function getAccounts() {
  return JSON.parse(fs.readFileSync('./privateKeys', 'utf8')).accounts
} 

interface Account {
  key: string;
  autoBlessing: boolean;
  autoRollShop: boolean;
  rollPremium: boolean;
  autoFeedAxies: boolean;
  axies: string[];

}

async function start() {
  if (!fs.existsSync('./privateKeys')) {
    throw Error(`privateKeys file not found`)
  } else if (getAccounts().length <= 0) {
    throw Error(`No keys defined`)
  }
  console.log(`⚙️ Starting Atia's Blessing bot (${getAccounts().length} addresses... AXIE HARD!)`)

  await axieHard()

}

start()
