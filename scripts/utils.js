import fs from "fs/promises"
import path from "path"
import readline from "readline/promises"

export const output_path = path.resolve(process.cwd(), "wallet.json")
export const logs_dir = path.resolve(process.cwd(), "logs")
export const log_file = path.resolve(logs_dir, "thunder.log")

export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m"
}

export const print_box = (title, lines, color) => {
  const headerLines = Array.isArray(title) ? title : [title]
  const pad = 2
  const width = Math.max(
    ...headerLines.map(s => s.length),
    ...(lines && lines.length ? lines.map(s => s.length) : [0])
  ) + pad * 2
  const top = "═".repeat(width)
  const sep = "─".repeat(width)

  console.log(`${color}╔${top}╗${c.reset}`)
  for (const h of headerLines) {
    const centerPad = Math.floor((width - h.length) / 2)
    const centered = " ".repeat(centerPad) + h + " ".repeat(width - centerPad - h.length)
    console.log(`${color}║${c.reset}${c.bold}${centered}${c.reset}${color}║${c.reset}`)
  }
  console.log(`${color}╟${sep}╢${c.reset}`)

  for (const line of (lines || [])) {
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

export const safe_stringify = obj => JSON.stringify(obj, (k, v) => typeof v === "bigint" ? v.toString() : v)

export const ensure_logs_dir = async () => {
  try {
    await fs.mkdir(logs_dir, { recursive: true })
  } catch {}
}

export const rotate_log_if_needed = async () => {
  try {
    const st = await fs.stat(log_file)
    if (st.size < 1024 * 1024) return
  } catch {
    return
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-")
  const rotated = path.resolve(logs_dir, `thunder-${ts}.log`)

  try {
    await fs.rename(log_file, rotated)
  } catch {}

  try {
    const entries = await fs.readdir(logs_dir)
    const files = entries.filter(f => f.startsWith("thunder-") && f.endsWith(".log")).sort()
    const excess = files.length - 5
    if (excess > 0) {
      for (let i = 0; i < excess; i++) {
        try { await fs.unlink(path.resolve(logs_dir, files[i])) } catch {}
      }
    }
  } catch {}
}

export const append_transfer_log = async payload => {
  await ensure_logs_dir()
  await rotate_log_if_needed()

  const entry = { timestamp: new Date().toISOString(), ...payload }
  await fs.appendFile(log_file, safe_stringify(entry) + "\n")
}

export const create_readline = () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.on("SIGINT", () => {
    rl.close()
    process.stdout.write("\n")
    process.exit(0)
  })
  return rl
}

export const ask = async (rl, prompt) => {
  try {
    return (await rl.question(prompt)).trim()
  } catch (err) {
    if (err && (err.name === "AbortError" || err.code === "ABORT_ERR")) {
      rl.close()
      process.stdout.write("\n")
      process.exit(0)
    }
    throw err
  }
}

export const short_id = id => {
  if (!id || id.length <= 12) return id
  return id.slice(0, 8) + "…" + id.slice(-6)
}

export const format_bigint = value => {
  try {
    const s = typeof value === "bigint" ? value.toString() : String(value)
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  } catch {
    return String(value)
  }
}

export const format_token_amount = (amount, decimals) => {
  try {
    const amt = typeof amount === "bigint" ? amount : BigInt(amount)
    const d = Number(decimals ?? 0)
    if (!Number.isFinite(d) || d <= 0) return format_bigint(amt)
    const base = BigInt(10) ** BigInt(d)
    const integer = amt / base
    const fraction = amt % base
    const intStr = format_bigint(integer)
    const fracStrRaw = fraction.toString().padStart(d, "0")
    const fracStr = fracStrRaw.replace(/0+$/, "")
    return fracStr ? `${intStr}.${fracStr}` : intStr
  } catch {
    return String(amount)
  }
}
