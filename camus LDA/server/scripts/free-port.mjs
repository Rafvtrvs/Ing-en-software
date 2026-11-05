/**
 * Libera el puerto del API y apaga instancias previas de este backend
 * para evitar EADDRINUSE (Windows / Unix).
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const port = String(process.env.PORT || 4000).trim()
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const selfPid = process.pid
const parentPid = process.ppid || 0

function sleep(ms) {
  spawnSync(process.execPath, ['-e', `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${ms})`])
}

function runPs(script) {
  const r = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  )
  return {
    ok: r.status === 0,
    out: `${r.stdout || ''}${r.stderr || ''}`.trim(),
  }
}

function freePortWindows() {
  const rootEscaped = serverRoot.replace(/'/g, "''")
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$self = ${selfPid}
$parent = ${parentPid}
$port = ${Number(port)}
$root = '${rootEscaped}'.ToLowerInvariant()
$killed = @()

function Kill-Tree([int]$procId) {
  if ($procId -le 0 -or $procId -eq $self -or $procId -eq $parent) { return }
  Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  $script:killed += $procId
}

# 1) Quien escucha el puerto
Get-NetTCPConnection -LocalPort $port -State Listen | ForEach-Object {
  Kill-Tree $_.OwningProcess
}

# 2) Watchers / index.ts de este proyecto (huérfanos en otras terminales)
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | ForEach-Object {
  $cmd = $_.CommandLine
  if (-not $cmd) { return }
  $lower = $cmd.ToLowerInvariant()
  if ($lower -notlike "*$root*") { return }
  $isBackend =
    $lower -match 'src[\\\\/]index\\.ts' -or
    $lower -match 'tsx\\s+watch' -or
    $lower -match 'tsx\\\\dist' -or
    $lower -match 'free-port\\.mjs'
  if (-not $isBackend) { return }
  Kill-Tree $_.ProcessId
}

$killed | Select-Object -Unique | ForEach-Object { Write-Output $_ }
`
  const { out } = runPs(script)
  const pids = out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
  for (const pid of pids) {
    console.log(`[free-port] terminado PID ${pid}`)
  }
}

function freePortUnix() {
  try {
    const r = spawnSync('lsof', [`-tiTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' })
    const pids = (r.stdout || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s) && s !== String(selfPid) && s !== String(parentPid))
    for (const pid of pids) {
      spawnSync('kill', ['-9', pid], { stdio: 'ignore' })
      console.log(`[free-port] terminado PID ${pid}`)
    }
  } catch {
    /* sin lsof o sin procesos */
  }
}

if (process.platform === 'win32') {
  freePortWindows()
} else {
  freePortUnix()
}

function portBusyWindows() {
  const { out } = runPs(
    `@(Get-NetTCPConnection -LocalPort ${Number(port)} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess) -join ','`,
  )
  const pids = out
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s) && s !== String(selfPid) && s !== String(parentPid))
  return pids.length > 0
}

function portBusyUnix() {
  const r = spawnSync('lsof', [`-tiTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' })
  const pids = (r.stdout || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s) && s !== String(selfPid) && s !== String(parentPid))
  return pids.length > 0
}

const busy = () => (process.platform === 'win32' ? portBusyWindows() : portBusyUnix())

for (let i = 0; i < 25 && busy(); i++) {
  sleep(200)
}

if (busy()) {
  console.warn(`[free-port] aviso: el puerto ${port} sigue ocupado`)
} else {
  console.log(`[free-port] puerto ${port} libre`)
}
