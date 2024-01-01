import { fetchApi } from './utils'

const queryConsumables = `query getConsumablesCount($owner: String, $tokenId: String, $tokenType: Erc1155Type!) {
        erc1155Token(owner: $owner, tokenId: $tokenId, tokenType: $tokenType) {
            total
        }
    }`
const queryAxieAxp = `query AxpAxieData($axieId: ID!) {
    axie(axieId: $axieId) {
      axpStatDay {
        axpCocoConsumedCapDay
        axpCocoConsumedDay
      }
      axpInfo {
        level
        nextOnchainLevel
        onchainLevel
        shouldAscend
        xpToLevelUp
      }
    }
  }`

export async function getConsumablesCount(address: string, premium: boolean, token: string) {
    const variables = {
        owner: address,
        tokenId: premium ? "2" : "1",
        tokenType: "Consumable"
    }
    const headers = {
        Authorization: `Bearer ${token}`
    }
    
    const consumableData = await fetchApi(queryConsumables, variables, headers)
    
    if ((consumableData as any)?.data?.erc1155Token.total) {
        return (consumableData as any).data.erc1155Token.total
    } else {
        console.log(`Failed to get count for Comsumable ${premium ? "Premium ": "" }Coco`, consumableData)
        return 0
    }
}

export async function getDailyCocoConsumedAxp(axieId: string, token: string) {
    const variables = {
        axieId: axieId
    }
    const headers = {
        Authorization: `Bearer ${token}`
    }
    
    const axieAxpData = await fetchApi(queryAxieAxp, variables, headers)
    const axieAXP = (axieAxpData as any)?.data?.axie

    if (!axieAXP) {
        console.log(`Failed to get Axp Data for Axie #${axieId} `, axieAxpData)
        return 0;
    }

    if(axieAXP.axpInfo.shouldAscend){
        console.log(`Axie #${axieId} needs to ascend before using Coco`)
        return 0
    }

    if(axieAXP.axpInfo.onchainLevel == 60){
        console.log(`Max Level reached STOP FEEDING`)
        return 0
    }

    const axpToConsume = axieAXP.axpStatDay.axpCocoConsumedCapDay - 
            axieAXP.axpStatDay.axpCocoConsumedDay 

    if(axieAXP.axpInfo.nextOnchainLevel == axieAXP.axpInfo.level + 1 && 
        axieAXP.axpInfo.xpToLevelUp < axpToConsume){
            return axieAXP.axpInfo.xpToLevelUp 
    }
    return axpToConsume
}

