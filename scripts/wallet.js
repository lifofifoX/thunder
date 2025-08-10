import { SparkWallet } from "@buildonspark/spark-sdk"
import { read_wallet, c, print_box } from "./utils.js"

let cachedWallet = null
let cachedData = null

export const get_wallet = async () => {
  if (cachedWallet) return cachedWallet

  const data = await read_wallet()
  if (!data) {
    print_box("NO WALLET FOUND", ["RUN: yarn run create"], c.yellow)
    process.exit(1)
  }

  const { wallet } = await SparkWallet.initialize({
    mnemonicOrSeed: data.seed,
    options: { network: "MAINNET" }
  })

  cachedWallet = wallet
  cachedData = data
  return cachedWallet
}

export const get_wallet_data = async () => {
  if (cachedData) return cachedData
  const data = await read_wallet()
  if (!data) {
    print_box("NO WALLET FOUND", ["RUN: yarn run create"], c.yellow)
    process.exit(1)
  }
  cachedData = data
  return cachedData
}


