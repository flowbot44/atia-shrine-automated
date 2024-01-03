import { fetchApi } from './utils'

const buyGachaTicketsMsg = `mutation BuyGachaTicketMessage($chests: [GachaChestTpe!]!) {
  buyGachaTicketMessage(chests: $chests) {
    chests {
      amount
      category
    }
    nonce
    slipAmount
    deadline
    signature
  }
}
`

const querySlipBalance = `query GetFortuneSlipBalance {
    profile {
      fortuneSlipBalance
    }
  }`

export async function fetchBuyGacha(amount: number, premium: boolean, token: string) {
  const variables = {
    chests: Array(amount).fill(premium ? 'Silver' : 'Bronze')
  }
  const headers = {
    Authorization: `Bearer ${token}`
  }

  const gachaData = await fetchApi(buyGachaTicketsMsg, variables, headers)

  if ((gachaData as any)?.data?.buyGachaTicketMessage) {
    return (gachaData as any).data.buyGachaTicketMessage
  } else {
    console.log(`Failed to buy gacha tickets`, gachaData)
  }
}

export async function getSlipBalance(token:string) {
    const headers = {
        Authorization: `Bearer ${token}`
    }

    const slipsData = await fetchApi(querySlipBalance, {}, headers)
    
    if ((slipsData as any)?.data?.profile) {
        return (slipsData as any).data.profile.fortuneSlipBalance
    } else {
       console.log(`Failed get slips count`, slipsData)
     }
}