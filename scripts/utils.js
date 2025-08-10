import fs from "fs/promises"
import path from "path"

export const output_path = path.resolve(process.cwd(), "wallet.json")

export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m"
}

export const print_box = (title, lines, color) => {
  const pad = 2
  const width = Math.max(title.length, ...lines.map(s => s.length)) + pad * 2
  const top = "═".repeat(width)
  const sep = "─".repeat(width)
  const centerPad = Math.floor((width - title.length) / 2)
  const centeredTitle = " ".repeat(centerPad) + title + " ".repeat(width - centerPad - title.length)
  console.log(`${color}╔${top}╗${c.reset}`)
  console.log(`${color}║${c.reset}${c.bold}${centeredTitle}${c.reset}${color}║${c.reset}`)
  console.log(`${color}╟${sep}╢${c.reset}`)
  for (const line of lines) {
    const padded = line + " ".repeat(width - line.length)
    console.log(`${color}║${c.reset}${padded}${color}║${c.reset}`)
  }
  console.log(`${color}╚${top}╝${c.reset}`)
}

export const read_wallet = async () => {
  try {
    const data = await fs.readFile(output_path, "utf8")
    return JSON.parse(data)
  } catch (_) {
    return null
  }
}

export const write_wallet = async wallet => {
  await fs.writeFile(output_path, JSON.stringify(wallet, null, 2), { mode: 0o600 })
}

export const print_wallet_info = (wallet, title, color) => {
  const lines = []
  if (wallet.depositAddress || wallet.address) lines.push(`DEPOSIT ADDRESS: ${wallet.depositAddress || wallet.address}`)
  if (wallet.sparkAddress) lines.push(`SPARK ADDRESS: ${wallet.sparkAddress}`)
  print_box(title, lines, color)
}

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const MEMPOOL_BASE = "https://mempool.space/api"

export const fetch_tx_status = async txid => {
  try {
    const res = await fetch(`${MEMPOOL_BASE}/tx/${txid}/status`)
    if (!res.ok) return null
    return await res.json()
  } catch (_) {
    return null
  }
}

export const fetch_tip_height = async () => {
  try {
    const res = await fetch(`${MEMPOOL_BASE}/blocks/tip/height`)
    if (!res.ok) return null
    const text = await res.text()
    return parseInt(text, 10)
  } catch (_) {
    return null
  }
}

export const fetch_confirmations = async txid => {
  const status = await fetch_tx_status(txid)
  if (!status || !status.confirmed) return 0
  const tip = await fetch_tip_height()
  if (tip == null || status.block_height == null) return 1
  return Math.max(0, tip - status.block_height + 1)
}


