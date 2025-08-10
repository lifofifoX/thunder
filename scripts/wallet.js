import { SparkWallet } from "@buildonspark/spark-sdk"
import { read_wallet, c, print_box } from "./utils.js"

export const get_wallet = async () => {
  const data = await read_wallet()
  if (!data) {
    print_box("NO WALLET FOUND", ["RUN: yarn run create"], c.yellow)
    process.exit(1)
  }

  const { wallet } = await SparkWallet.initialize({
    mnemonicOrSeed: data.seed,
    options: { network: "MAINNET" }
  })
  return wallet
}

export const get_wallet_data = async () => {
  const data = await read_wallet()
  if (!data) {
    print_box("NO WALLET FOUND", ["RUN: yarn run create"], c.yellow)
    process.exit(1)
  }
  return data
}
