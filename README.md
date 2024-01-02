# Atia's Shrine Automation

Automated Atia's Blessing, Garuda Shop and Feed Axies Coco, runs every day automatically.

Adds to your daily streak which claims slips. Uses all of your slips in 100 pouch batches for effeceny RON uses. Feeds mutiple axies Coco to the limits of consumption for its level
* currently you need to manually approve 1155 to be used
* doesn't feed or feeds to the limit of ascending level, need to manually do to continute feeding
* feeds first axie then moves on to the next axie, if not enough coco it will feed what it can or skip if all is used.
    


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