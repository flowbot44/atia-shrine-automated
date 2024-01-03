# Atia's Shrine Automation

Automated Atia's Blessing, Garuda Shop and Feed Axies Coco.

* Runs automatically every day.
* Increases your daily streak for claiming Slips.
* Efficiently uses RON by spending all slips in batches of 100.
* Can feed multiple Axies (Coco) to their consumption limit based on their level.

Note:
* Currently you need to manually approve 1155 tokens (Coco) to be used on account
* Does not feed Axies beyond their level cap. Manual intervention is needed to continue feeding.
* Feeds the first Axie and then moves on to the next. If there's not enough Coco, it will feed what it can or skip the Axie if all Coco is used.
    


![blessing](https://github.com/dwi/atia-shrine-automated/assets/1337260/feda58fc-4829-4684-9b40-dac8735dbc05)


> **Warning**
> **Run it locally and preferably on an encrypted volume, your private keys can be exposed!**

## Prerequisites
- Node.js 18+
- pnpm (or Yarn/NPM)

## Installation
- Install dependencies
```bash
pnpm i
```
- Copy example privateKeys file and add your key and settings in per account
```bash
cp privateKeys.example privateKeys
```
- Make your own local copy of .env file
```bash
cp .env.example .env
```

- Edit .env file and add a Sky Mavis API key (obtainable on [Sky Mavis Developer Portal](https://developers.skymavis.com/console/applications/))


- Start Application
```bash
pnpm start
```
The application will be launched by [Nodemon](https://nodemon.com) so it's will restart automatically on file change


Thanks [dw](https://github.com/dwi/) For the starting point of the [Atai Shrine Automated](https://github.com/dwi/atia-shrine-automated) and sampled code from the [Garuda Gacha Roller](https://github.com/dwi/garuda-gacha-roller)